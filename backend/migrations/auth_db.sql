-- ============================
-- Auth Database Schema (FULL)
-- Source of truth for identity & permissions
-- Idempotent-safe (re-runnable)
-- ============================

-- ===== Extensions =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ===== Users (core identity) =====
CREATE TABLE IF NOT EXISTS users_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_users_auth') THEN
    CREATE OR REPLACE FUNCTION set_updated_at_users_auth() RETURNS TRIGGER AS $FN$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $FN$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_auth_updated_at') THEN
    CREATE TRIGGER trg_users_auth_updated_at
      BEFORE UPDATE ON users_auth
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_users_auth();
  END IF;
END$$;

-- ===== OAuth/SSO identities =====
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google','github',...
    provider_uid VARCHAR(255) NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_uid)
);

-- ===== Sessions (refresh tokens) =====
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- (Tùy chọn) bạn có thể unique theo refresh_token_hash nếu đảm bảo không tái sử dụng:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON sessions(refresh_token_hash);

-- ===== Roles =====
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Permissions =====
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create','read','update','delete' hoặc custom
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Role-Permission (N-N) =====
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ===== User-Role (multi-tenant) =====
-- FIX: dùng PK id + 2 unique indexes partial để thay cho COALESCE trong PK
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_auth(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID, -- NULL = global; có giá trị = tenant-specific
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global: (user_id, role_id) duy nhất khi tenant_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_global
  ON user_roles (user_id, role_id)
  WHERE tenant_id IS NULL;

-- Tenant: (user_id, role_id, tenant_id) duy nhất khi tenant_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_tenant
  ON user_roles (user_id, role_id, tenant_id)
  WHERE tenant_id IS NOT NULL;

-- ===== Admin audit logs =====
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users_auth(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    result VARCHAR(50) DEFAULT 'success' CHECK (result IN ('success','failure','error')),
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Admin jobs =====
CREATE TABLE IF NOT EXISTS admin_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    state VARCHAR(50) DEFAULT 'pending' CHECK (state IN ('pending','running','completed','failed')),
    run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger cho admin_jobs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_admin_jobs') THEN
    CREATE OR REPLACE FUNCTION set_updated_at_admin_jobs() RETURNS TRIGGER AS $FN$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $FN$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_jobs_updated_at') THEN
    CREATE TRIGGER trg_admin_jobs_updated_at
      BEFORE UPDATE ON admin_jobs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_admin_jobs();
  END IF;
END$$;

-- ===== Admin settings (KV JSON) =====
CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger cho admin_settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_admin_settings') THEN
    CREATE OR REPLACE FUNCTION set_updated_at_admin_settings() RETURNS TRIGGER AS $FN$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $FN$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_settings_updated_at') THEN
    CREATE TRIGGER trg_admin_settings_updated_at
      BEFORE UPDATE ON admin_settings
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_admin_settings();
  END IF;
END$$;

-- ===== Token blacklist (logout/invalidate access) =====
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users_auth(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    blacklisted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_users_auth_email ON users_auth(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_status ON users_auth(status);

CREATE INDEX IF NOT EXISTS idx_identities_provider_uid ON identities(provider, provider_uid);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_jobs_state ON admin_jobs(state);
CREATE INDEX IF NOT EXISTS idx_admin_jobs_run_at ON admin_jobs(run_at);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- ============================
-- ===== Seed data ============
-- ============================

-- Roles (fixed UUIDs để dễ migrate/so sánh)
INSERT INTO roles (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'System administrator'),
('22222222-2222-2222-2222-222222222222', 'user', 'Regular user'),
('33333333-3333-3333-3333-333333333333', 'moderator', 'Content moderator')
ON CONFLICT (name) DO NOTHING;

-- Permissions (fixed UUIDs)
INSERT INTO permissions (id, name, resource, action, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'user.read',  'user',  'read',  'Read user profiles'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'user.write', 'user',  'write', 'Modify user profiles'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'admin.read', 'admin', 'read',  'Access admin features'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'admin.write','admin', 'write', 'Modify admin settings')
ON CONFLICT (name) DO NOTHING;

-- Role ↔ Permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN ('user.read','user.write','admin.read','admin.write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.name = 'user.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Default admin user
-- NOTE: Hash dưới là bcrypt của "password" ($2a$10$92IX...); hãy đổi ngay trong môi trường thật.
INSERT INTO users_auth (id, email, username, password_hash, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Gán vai trò admin toàn cục (tenant_id = NULL)
INSERT INTO user_roles (user_id, role_id, tenant_id)
SELECT '00000000-0000-0000-0000-000000000001', id, NULL
FROM roles
WHERE name = 'admin'
ON CONFLICT DO NOTHING;
