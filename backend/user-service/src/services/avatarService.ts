import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { Express } from "express";
import { storagePaths } from "../config/storage.js";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

const ensureWithinLimit = (buffer: Buffer) => {
  const maxSize = storagePaths.maxAvatarBytes || 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error("Avatar exceeds size limit");
  }
  if (buffer.length === 0) {
    throw new Error("Avatar payload is empty");
  }
};

const extensionFromMime = (mime?: string, fallback?: string) => {
  if (mime && MIME_EXTENSION_MAP[mime.toLowerCase()]) {
    return MIME_EXTENSION_MAP[mime.toLowerCase()];
  }
  if (fallback) {
    const cleaned = fallback.replace(".", "").toLowerCase();
    if (cleaned && cleaned.length <= 5) {
      return cleaned;
    }
  }
  return "png";
};

const buildFilename = (userId: string, ext: string) => {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  const slug = randomBytes(4).toString("hex");
  return `${userId}-${Date.now()}-${slug}.${safeExt}`;
};

const publicUrlFor = (filename: string) => {
  const base = storagePaths.publicBaseUrl || "/api/users/uploads";
  return `${base}/${encodeURIComponent(filename)}`;
};

const persistBuffer = async (
  userId: string,
  buffer: Buffer,
  mimeType?: string,
  originalName?: string
) => {
  ensureWithinLimit(buffer);
  await fs.mkdir(storagePaths.avatars, { recursive: true });
  const ext = extensionFromMime(
    mimeType,
    originalName ? path.extname(originalName) : undefined
  );
  const filename = buildFilename(userId, ext);
  const filePath = path.join(storagePaths.avatars, filename);
  await fs.writeFile(filePath, buffer);
  return {
    filename,
    filePath,
    publicUrl: publicUrlFor(filename),
  };
};

const extractFileName = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const base = storagePaths.publicBaseUrl || "";
  if (trimmed.startsWith(base)) {
    const remainder = trimmed.slice(base.length).replace(/^\/+/, "");
    return remainder ? decodeURIComponent(remainder) : null;
  }

  const lastSegment = trimmed.split("/").pop() ?? "";
  if (SAFE_FILENAME.test(lastSegment)) {
    return lastSegment;
  }
  return null;
};

export const avatarService = {
  async saveUploadedFile(userId: string, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error("Uploaded file is missing");
    }
    return persistBuffer(userId, file.buffer, file.mimetype, file.originalname);
  },

  async saveBase64Image(userId: string, dataUri: string) {
    const matches = dataUri.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/
    );
    if (!matches) {
      throw new Error("Invalid base64 avatar payload");
    }
    const buffer = Buffer.from(matches[2], "base64");
    return persistBuffer(userId, buffer, matches[1]);
  },

  async saveRemoteImage(userId: string, remoteUrl: string) {
    if (!remoteUrl) {
      throw new Error("Remote avatar URL is empty");
    }
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download avatar from remote source (${response.status})`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || undefined;
    let fallbackExt: string | undefined;
    try {
      const parsed = new URL(remoteUrl);
      fallbackExt = path.extname(parsed.pathname).replace(".", "");
    } catch {
      fallbackExt = undefined;
    }
    return persistBuffer(userId, buffer, contentType || undefined, fallbackExt);
  },

  async deleteAvatarByUrl(url?: string | null) {
    const filename = extractFileName(url);
    if (!filename) return;
    const filePath = path.join(storagePaths.avatars, filename);
    if (!filePath.startsWith(storagePaths.avatars)) {
      return;
    }
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        // eslint-disable-next-line no-console
        console.warn("Failed to delete avatar", error);
      }
    }
  },
};

export type StoredAvatar = Awaited<
  ReturnType<typeof avatarService.saveUploadedFile>
>;
