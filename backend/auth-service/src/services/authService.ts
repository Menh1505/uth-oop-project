import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import {
  User,
  Session,
  TokenBlacklist,
  Identity,
  IUser,
  ISession,
} from "../models/User";
import { jwtConfig } from "../config/jwt";
import { MessageService } from "./messageService";
import { cacheAuthUser } from "./cacheService";
import type { CachedAuthUserPayload } from "../types/auth";
import {
  signAccess,
  generateRefreshToken,
  hashOpaqueToken,
  compareOpaqueToken,
} from "../utils/tokens";
import { verifyFirebaseIdToken } from "../config/firebase";

type LoginResult = {
  access_token: string;
  expires_at: number;
  refresh_token: string;
};

async function getUserByEmail(email: string) {
  return await User.findOne({ email, status: "active" }).lean();
}

async function getUserRoles(userId: string) {
  // For simplicity, we'll implement a basic role system
  const user = await User.findById(userId).lean();
  if (!user) return [];

  // For now, admin users have 'admin' role based on email or other criteria
  return user.email?.includes("admin") ? ["admin"] : ["user"];
}

function pickRole(roles: string[]) {
  return roles.includes("admin") ? "admin" : roles[0] || "user";
}

export class AuthService {
  // ===== core =====
  static async register(email: string, password: string, username?: string) {
    const existing = await User.findOne({ email });
    if (existing) throw new Error("User already exists");

    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      username: username || null,
      password_hash: hash,
      status: "active",
    });

    const savedUser = await user.save();

    await MessageService.publish("user.registered", {
      userId: savedUser._id.toString(),
      email,
      timestamp: new Date().toISOString(),
      profilePictureUrl: savedUser.profile_picture_url || null,
    });

    return { success: true };
  }

  static async login(
    email: string,
    password: string
  ): Promise<LoginResult | null> {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;

    const roles = await getUserRoles(user._id.toString());
    const role = pickRole(roles);

    const { token: access, exp } = signAccess({
      id: user._id.toString(),
      email: user.email,
      role,
    });

    const refresh = generateRefreshToken();
    const refreshHash = await hashOpaqueToken(refresh);
    const refreshExpSec = parseInt(
      process.env.REFRESH_TTL_SEC || `${60 * 60 * 24 * 30}`,
      10
    );
    const expiresAt = new Date(Date.now() + refreshExpSec * 1000);

    await new Session({
      user_id: user._id,
      refresh_token_hash: refreshHash,
      user_agent: "api",
      ip: null,
      expires_at: expiresAt,
    }).save();

    await MessageService.publish("user.logged_in", {
      userId: user._id.toString(),
      email: user.email,
      role,
      timestamp: new Date().toISOString(),
      profilePictureUrl: user.profile_picture_url || null,
    });

    const payload: CachedAuthUserPayload = {
      user: user as any,
      roles,
      cachedAt: new Date().toISOString(),
    };
    await cacheAuthUser(email, payload);

    return {
      access_token: access,
      expires_at: exp * 1000,
      refresh_token: refresh,
    };
  }

  static async loginWithGoogle(idToken: string): Promise<LoginResult> {
    const decoded = await verifyFirebaseIdToken(idToken);
    const email = decoded.email;
    const firebaseUid = decoded.uid;

    if (!email) {
      throw new Error("No email in token");
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      const randomPassword = randomBytes(32).toString("hex");
      const hash = await bcrypt.hash(randomPassword, 10);

      const newUser = new User({
        email,
        username: decoded.name || null,
        password_hash: hash,
        status: "active",
        login_methods: ["google"],
        google_id: firebaseUid,
        google_email: decoded.email,
        google_verified_at: new Date(),
        email_verified: decoded.email_verified || true,
        profile_picture_url: decoded.picture || null, // Save Google avatar
      });

      const savedUser = await newUser.save();
      user = savedUser;

      await MessageService.publish("user.registered", {
        userId: savedUser._id.toString(),
        email: savedUser.email,
        loginMethod: "google",
        timestamp: new Date().toISOString(),
        profilePictureUrl: savedUser.profile_picture_url || decoded.picture || null,
      });
    } else {
      // Update existing user to track Google login
      if (!user.login_methods.includes("google")) {
        user.login_methods.push("google");
      }
      user.google_id = firebaseUid;
      user.google_email = decoded.email;
      user.google_verified_at = new Date();
      user.last_login = new Date();
      // Update avatar if it exists
      if (decoded.picture) {
        user.profile_picture_url = decoded.picture;
      }
      await user.save();
    }

    // Create or update identity
    await Identity.findOneAndUpdate(
      { provider: "google", provider_uid: firebaseUid },
      {
        user_id: user._id,
        provider: "google",
        provider_uid: firebaseUid,
        meta: {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        },
      },
      { upsert: true, new: true }
    );

    if (!user || user.status !== "active") {
      throw new Error("User disabled");
    }

    const roles = await getUserRoles(user._id.toString());
    const role = pickRole(roles);

    const { token: access, exp } = signAccess({
      id: user._id.toString(),
      email: user.email,
      role,
    });

    const refresh = generateRefreshToken();
    const refreshHash = await hashOpaqueToken(refresh);
    const refreshExpSec = parseInt(
      process.env.REFRESH_TTL_SEC || `${60 * 60 * 24 * 30}`,
      10
    );
    const expiresAt = new Date(Date.now() + refreshExpSec * 1000);

    await new Session({
      user_id: user._id,
      refresh_token_hash: refreshHash,
      user_agent: "firebase-google",
      ip: null,
      login_method: "google",
      expires_at: expiresAt,
    }).save();

    await MessageService.publish("user.logged_in", {
      userId: user._id.toString(),
      email: user.email,
      role,
      provider: "google",
      timestamp: new Date().toISOString(),
      profilePictureUrl: user.profile_picture_url || decoded.picture || null,
    });

    const payload: CachedAuthUserPayload = {
      user: user.toObject() as any,
      roles,
      cachedAt: new Date().toISOString(),
    };
    await cacheAuthUser(email, payload);

    return {
      access_token: access,
      expires_at: exp * 1000,
      refresh_token: refresh,
    };
  }

  static async adminLogin(
    username: string,
    password: string
  ): Promise<LoginResult | null> {
    const user = await User.findOne({ username, status: "active" }).lean();
    if (!user) return null;

    const roles = await getUserRoles(user._id.toString());
    if (!roles.includes("admin")) return null;

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;

    const { token: access, exp } = signAccess({
      id: user._id.toString(),
      email: user.email,
      role: "admin",
    });

    const refresh = generateRefreshToken();
    const refreshHash = await hashOpaqueToken(refresh);
    const refreshExpSec = parseInt(
      process.env.REFRESH_TTL_SEC || `${60 * 60 * 24 * 30}`,
      10
    );
    const expiresAt = new Date(Date.now() + refreshExpSec * 1000);

    await new Session({
      user_id: user._id,
      refresh_token_hash: refreshHash,
      user_agent: "api",
      ip: null,
      expires_at: expiresAt,
    }).save();

    await MessageService.publish("user.logged_in", {
      userId: user._id.toString(),
      username: user.username,
      role: "admin",
      timestamp: new Date().toISOString(),
      profilePictureUrl: user.profile_picture_url || null,
    });

    return {
      access_token: access,
      expires_at: exp * 1000,
      refresh_token: refresh,
    };
  }

  static async refresh(oldRefresh: string, userAgent?: string, ip?: string) {
    // Find valid sessions
    const sessions = await Session.find({
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 });

    let session: any = null;
    for (const s of sessions) {
      if (await compareOpaqueToken(oldRefresh, s.refresh_token_hash)) {
        session = s;
        break;
      }
    }

    if (!session) throw new Error("Invalid refresh token");

    const user = await User.findById(session.user_id).lean();
    if (!user || user.status !== "active") throw new Error("User disabled");

    const roles = await getUserRoles(user._id.toString());
    const role = pickRole(roles);

    // Rotate: delete old session and create new one
    await Session.findByIdAndDelete(session._id);

    const newRefresh = generateRefreshToken();
    const newRefreshHash = await hashOpaqueToken(newRefresh);
    const refreshExpSec = parseInt(
      process.env.REFRESH_TTL_SEC || `${60 * 60 * 24 * 30}`,
      10
    );
    const newExpAt = new Date(Date.now() + refreshExpSec * 1000);

    await new Session({
      user_id: user._id,
      refresh_token_hash: newRefreshHash,
      user_agent: userAgent || "api",
      ip: ip || null,
      expires_at: newExpAt,
    }).save();

    const { token: access, exp } = signAccess({
      id: user._id.toString(),
      email: user.email,
      role,
    });

    return {
      access_token: access,
      expires_at: exp * 1000,
      refresh_token: newRefresh,
    };
  }

  static async blacklistAccess(
    accessToken: string,
    decoded?: any
  ): Promise<boolean> {
    try {
      const exp = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 3600_000);
      const tokenHash = await bcrypt.hash(accessToken, 10);

      const blacklistedToken = new TokenBlacklist({
        token_hash: tokenHash,
        user_id: decoded?.id || null,
        expires_at: exp,
      });

      await blacklistedToken.save();
      return true;
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        return false; // Token already blacklisted
      }
      console.error("Error blacklisting access token:", error);
      throw error;
    }
  }

  static async logout(accessToken: string, refreshFromCookieOrBody?: string) {
    let decoded: any = null;
    let userId: string | null = null;
    let sessionsDeleted = 0;
    let tokensRevoked = 0;

    try {
      decoded = jwt.decode(accessToken);
      userId = decoded?.id || null;
    } catch (e) {
      console.warn("Failed to decode access token:", e);
    }

    try {
      // Blacklist the current access token
      if (decoded && userId) {
        tokensRevoked = (await this.blacklistAccess(accessToken, decoded))
          ? 1
          : 0;
      }

      // Invalidate the session if we have a refresh token
      if (refreshFromCookieOrBody && userId) {
        const sessions = await Session.find({
          user_id: userId,
        });

        for (const session of sessions) {
          try {
            if (
              await compareOpaqueToken(
                refreshFromCookieOrBody,
                session.refresh_token_hash
              )
            ) {
              await Session.findByIdAndDelete(session._id);
              sessionsDeleted++;
              break;
            }
          } catch (e) {
            console.warn("Failed to compare refresh token:", e);
          }
        }
      }

      // Publish logout event
      if (userId) {
        await MessageService.publish("user.logged_out", {
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      return { sessionsDeleted, tokensRevoked };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // ===== sessions mgmt =====
  static async listSessions(currentRefresh?: string) {
    const sessions = await Session.find({
      expires_at: { $gt: new Date() },
    })
      .sort({ created_at: -1 })
      .lean();

    const result = await Promise.all(
      sessions.map(async (session: any) => {
        if (!currentRefresh) {
          return { ...session, current: false };
        }

        const isCurrent = await compareOpaqueToken(
          currentRefresh,
          session.refresh_token_hash
        );
        return { ...session, current: isCurrent };
      })
    );

    return result;
  }

  static async deleteSessionById(sessionId: string) {
    try {
      const result = await Session.findByIdAndDelete(sessionId);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  static async deleteOtherSessions(currentRefresh?: string) {
    if (!currentRefresh) {
      // Delete all sessions
      await Session.deleteMany({});
      return { deletedAll: true };
    }

    // Find current session
    const sessions = await Session.find({});
    let currentId: string | null = null;

    for (const session of sessions) {
      if (
        await compareOpaqueToken(currentRefresh, session.refresh_token_hash)
      ) {
        currentId = session._id.toString();
        break;
      }
    }

    if (currentId) {
      await Session.deleteMany({ _id: { $ne: currentId } });
      return { deletedAllExceptCurrent: true };
    } else {
      await Session.deleteMany({});
      return { deletedAll: true, note: "current not found" };
    }
  }

  // ===== blacklist admin =====
  static async listBlacklist(limit = 100) {
    const blacklisted = await TokenBlacklist.find({
      expires_at: { $gt: new Date() },
    })
      .sort({ blacklisted_at: -1 })
      .limit(limit)
      .lean();

    return blacklisted;
  }
}
