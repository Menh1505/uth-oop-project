import fs from "fs";
import path from "path";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const resolveUploadRoot = () => {
  const customRoot = process.env.UPLOAD_ROOT;
  if (customRoot) {
    return path.isAbsolute(customRoot)
      ? customRoot
      : path.join(process.cwd(), customRoot);
  }
  return path.join(process.cwd(), "uploads");
};

const uploadRoot = resolveUploadRoot();
ensureDir(uploadRoot);

const avatarDir = path.join(
  uploadRoot,
  process.env.AVATAR_SUBDIR || "avatars"
);
ensureDir(avatarDir);

const normalizePath = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const publicBaseUrl = normalizePath(
  process.env.PUBLIC_UPLOAD_BASE_URL || "/api/users/uploads"
);
const serviceBasePath = normalizePath(
  process.env.SERVICE_UPLOAD_BASE_PATH || "/users/uploads"
);

export const storagePaths = {
  root: uploadRoot,
  avatars: avatarDir,
  publicBaseUrl,
  serviceBasePath,
  maxAvatarBytes: parseInt(
    process.env.MAX_AVATAR_BYTES || `${5 * 1024 * 1024}`,
    10
  ),
};
