import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { jwtConfig } from '../config/jwt';
import { MessageService } from './messageService';
import {
  signAccess, generateRefreshToken, hashOpaqueToken, compareOpaqueToken
} from '../utils/tokens';

type LoginResult = { access_token: string; expires_at: number; refresh_token: string };

async function getUserByEmail(email: string) {
  const q = await pool.query('SELECT * FROM users_auth WHERE email = $1 AND status = $2', [email, 'active']);
  return q.rows[0] || null;
}
async function getUserRoles(userId: string) {
  const q = await pool.query(`
    SELECT r.name FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 AND ur.tenant_id IS NULL
  `, [userId]);
  return q.rows.map((r: any) => r.name as string);
}
function pickRole(roles: string[]) {
  return roles.includes('admin') ? 'admin' : (roles[0] || 'user');
}

export class AuthService {
  // ===== core =====
  static async register(email: string, password: string, username?: string) {
    console.log(`[AUTH] Register attempt: ${email}`);
    const existing = await pool.query('SELECT id FROM users_auth WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`[AUTH] User already exists: ${email}`);
      throw new Error('User already exists');
    }

    const hash = await bcrypt.hash(password, 10);
    const ins = await pool.query(
      'INSERT INTO users_auth (email, username, password_hash, status) VALUES ($1,$2,$3,$4) RETURNING id,email',
      [email, username || null, hash, 'active']
    );

    console.log(`[AUTH] User registered successfully: ${email} (ID: ${ins.rows[0].id})`);

    await MessageService.publish('user.registered', {
      userId: ins.rows[0].id, email, timestamp: new Date().toISOString()
    });
    return { success: true };
  }

  static async login(email: string, password: string): Promise<LoginResult | null> {
    console.log(`[AUTH] Login attempt: ${email}`);
    const user = await getUserByEmail(email);
    if (!user) {
      console.log(`[AUTH] Login failed - user not found: ${email}`);
      return null;
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log(`[AUTH] Login failed - invalid password: ${email}`);
      return null;
    }

    const roles = await getUserRoles(user.id);
    const role = pickRole(roles);

    const { token: access, exp } = signAccess({ id: user.id, email: user.email, role });
    const refresh = generateRefreshToken();
    const refreshHash = await hashOpaqueToken(refresh);
    const refreshExpSec = parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10);
    const expiresAt = new Date(Date.now() + refreshExpSec * 1000);

    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, refreshHash, 'api', null, expiresAt]
    );

    console.log(`[AUTH] Login successful: ${email} (Role: ${role})`);

    await MessageService.publish('user.logged_in', {
      userId: user.id, email: user.email, role, timestamp: new Date().toISOString()
    });

    return { access_token: access, expires_at: exp * 1000, refresh_token: refresh };
  }

  static async adminLogin(username: string, password: string): Promise<LoginResult | null> {
    const q = await pool.query(`SELECT * FROM users_auth WHERE username = $1 AND status = 'active'`, [username]);
    const user = q.rows[0]; if (!user) return null;

    const roles = await getUserRoles(user.id);
    if (!roles.includes('admin')) return null;

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;

    const { token: access, exp } = signAccess({ id: user.id, email: user.email, role: 'admin' });
    const refresh = generateRefreshToken();
    const refreshHash = await hashOpaqueToken(refresh);
    const refreshExpSec = parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10);
    const expiresAt = new Date(Date.now() + refreshExpSec * 1000);

    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, refreshHash, 'api', null, expiresAt]
    );

    await MessageService.publish('user.logged_in', {
      userId: user.id, username: user.username, role: 'admin', timestamp: new Date().toISOString()
    });

    return { access_token: access, expires_at: exp * 1000, refresh_token: refresh };
  }

  static async refresh(oldRefresh: string, userAgent?: string, ip?: string) {
    // tìm session khớp (và còn hạn)
    const q = await pool.query(
      `SELECT id, user_id, refresh_token_hash, expires_at
       FROM sessions WHERE expires_at > NOW() ORDER BY created_at DESC`
    );

    let session: any = null;
    for (const row of q.rows) {
      if (await compareOpaqueToken(oldRefresh, row.refresh_token_hash)) { session = row; break; }
    }
    if (!session) throw new Error('Invalid refresh token');

    const uq = await pool.query('SELECT id, email, status FROM users_auth WHERE id = $1', [session.user_id]);
    const user = uq.rows[0];
    if (!user || user.status !== 'active') throw new Error('User disabled');

    const roles = await getUserRoles(user.id);
    const role = pickRole(roles);

    // rotate: xoá phiên cũ → tạo mới
    await pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);

    const newRefresh = generateRefreshToken();
    const newRefreshHash = await hashOpaqueToken(newRefresh);
    const refreshExpSec = parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10);
    const newExpAt = new Date(Date.now() + refreshExpSec * 1000);

    await pool.query(
      'INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, newRefreshHash, userAgent || 'api', ip || null, newExpAt]
    );

    const { token: access, exp } = signAccess({ id: user.id, email: user.email, role });

    await MessageService.publish('user.token_refreshed', {
      userId: user.id, timestamp: new Date().toISOString()
    });

    return { access_token: access, expires_at: exp * 1000, refresh_token: newRefresh };
  }

  static async blacklistAccess(accessToken: string, decoded?: any): Promise<boolean> {
    try {
      const exp = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600_000);
      const tokenHash = await bcrypt.hash(accessToken, 10);
      
      const result = await pool.query(
        `INSERT INTO token_blacklist (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (token_hash) DO NOTHING
         RETURNING id`,
        [tokenHash, decoded?.id || null, exp]
      );
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error blacklisting access token:', error);
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
      console.warn('Failed to decode access token:', e);
    }

    try {
      // Blacklist the current access token
      if (decoded && userId) {
        tokensRevoked = await this.blacklistAccess(accessToken, decoded) ? 1 : 0;
      }

      // Invalidate the session if we have a refresh token
      if (refreshFromCookieOrBody && userId) {
        const s = await pool.query(
          'SELECT id, refresh_token_hash FROM sessions WHERE user_id = $1',
          [userId]
        );
        
        for (const row of s.rows) {
          try {
            if (await compareOpaqueToken(refreshFromCookieOrBody, row.refresh_token_hash)) {
              const deleteResult = await pool.query(
                'DELETE FROM sessions WHERE id = $1',
                [row.id]
              );
              sessionsDeleted = (deleteResult.rowCount ?? 0);
              break;
            }
          } catch (e) {
            console.warn('Error comparing refresh token:', e);
          }
        }
      }

      // Publish logout event for audit/notification
      if (userId) {
        await MessageService.publish('user.logged_out', {
          userId,
          timestamp: new Date().toISOString(),
          refreshToken: refreshFromCookieOrBody ? 'provided' : 'missing'
        });
      }

      return { 
        success: true,
        userId,
        sessionsDeleted,
        tokensRevoked
      };
    } catch (error) {
      console.error('Logout service error:', error);
      throw error;
    }
  }

  // ===== sessions mgmt =====
  static async listSessions(currentRefresh?: string) {
    // chỉ show các phiên còn hạn; flag current
    const q = await pool.query(`
      SELECT id, user_id, user_agent, ip, expires_at, created_at
      FROM sessions WHERE expires_at > NOW() ORDER BY created_at DESC
    `);
    const rows = await Promise.all(q.rows.map(async (r: any) => {
      if (!currentRefresh) return { ...r, current: false };
      // đánh dấu phiên hiện tại bằng so khớp hash
      const h = await pool.query('SELECT refresh_token_hash FROM sessions WHERE id = $1', [r.id]);
      const isCurrent = h.rows[0]?.refresh_token_hash
        ? await compareOpaqueToken(currentRefresh, h.rows[0].refresh_token_hash)
        : false;
      return { ...r, current: isCurrent };
    }));
    return rows;
  }

  static async deleteSessionById(sessionId: string) {
    const r = await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    return (r.rowCount ?? 0) > 0;
  }

  static async deleteOtherSessions(currentRefresh?: string) {
    if (!currentRefresh) {
      // nếu không có refresh hiện tại → xoá tất cả
      await pool.query('DELETE FROM sessions');
      return { deletedAll: true };
    }
    // tìm id phiên hiện tại
    const q = await pool.query('SELECT id, refresh_token_hash FROM sessions');
    let currentId: string | null = null;
    for (const row of q.rows) {
      if (await compareOpaqueToken(currentRefresh, row.refresh_token_hash)) {
        currentId = row.id; break;
      }
    }
    if (currentId) {
      await pool.query('DELETE FROM sessions WHERE id <> $1', [currentId]);
      return { deletedAllExceptCurrent: true };
    } else {
      await pool.query('DELETE FROM sessions');
      return { deletedAll: true, note: 'current not found' };
    }
  }

  // ===== blacklist admin =====
  static async listBlacklist(limit = 100) {
    const q = await pool.query(
      `SELECT id, user_id, expires_at, blacklisted_at FROM token_blacklist
       WHERE expires_at > NOW() ORDER BY blacklisted_at DESC LIMIT $1`, [limit]
    );
    return q.rows;
  }
}
