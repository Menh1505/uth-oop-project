import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  username?: string;
  password_hash: string;
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  email_verified: boolean;
  login_methods: Array<"email" | "google" | "facebook" | "apple">; // Track which login methods user has
  google_id?: string; // For quick lookup
  google_email?: string;
  google_verified_at?: Date;
  last_login?: Date;
  profile_picture_url?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    password_hash: {
      type: String,
      required: false, // Not required for social-only accounts
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    login_methods: {
      type: [String],
      enum: ["email", "google", "facebook", "apple"],
      default: ["email"],
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true, // Allow null for email-only users
    },
    google_email: String,
    google_verified_at: Date,
    last_login: {
      type: Date,
    },
    profile_picture_url: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ google_id: 1 });
UserSchema.index({ login_methods: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);

// Session Schema for refresh tokens
export interface ISession extends Document {
  user_id: mongoose.Types.ObjectId;
  refresh_token_hash: string;
  user_agent?: string;
  ip?: string;
  expires_at: Date;
  created_at: Date;
  login_method?: "email" | "google" | "facebook" | "apple"; // Track which method created session
}

const SessionSchema = new Schema<ISession>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refresh_token_hash: {
      type: String,
      required: true,
    },
    user_agent: String,
    ip: String,
    login_method: {
      type: String,
      enum: ["email", "google", "facebook", "apple"],
      default: "email",
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

SessionSchema.index({ user_id: 1 });
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);

// Token Blacklist Schema
export interface ITokenBlacklist extends Document {
  token_hash: string;
  user_id: mongoose.Types.ObjectId;
  expires_at: Date;
  blacklisted_at: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token_hash: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  expires_at: {
    type: Date,
    required: true,
  },
  blacklisted_at: {
    type: Date,
    default: Date.now,
  },
});

TokenBlacklistSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
TokenBlacklistSchema.index({ token_hash: 1 });

export const TokenBlacklist = mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  TokenBlacklistSchema
);

// Identity Schema for social login
export interface IIdentity extends Document {
  user_id: mongoose.Types.ObjectId;
  provider: string;
  provider_uid: string;
  meta?: any;
  created_at: Date;
}

const IdentitySchema = new Schema<IIdentity>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    provider_uid: {
      type: String,
      required: true,
    },
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

IdentitySchema.index({ user_id: 1 });
IdentitySchema.index({ provider: 1, provider_uid: 1 }, { unique: true });

export const Identity = mongoose.model<IIdentity>("Identity", IdentitySchema);
