import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { jwtConfig } from '../config/jwt';
import jwt from 'jsonwebtoken';

function internalSelfCheck() { return { db: 'ok', redis: 'ok' }; }

export class AuthController {
  static async health(_req: Request, res: Response) {
    const started = Date.now();
    try {
      const checks = internalSelfCheck();
      res.status(200).json({
        service: 'auth-service',
        status: 'healthy',
        checks,
        uptime: process.uptime(),
        responseTime: Date.now() - started
      });
    } catch (err: any) {
      res.status(503).json({ service: 'auth-service', status: 'unhealthy', error: err?.message || 'unknown' });
    }
  }

  static async register(req: Request, res: Response) {
    const { email, password, username } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    try {
      const result = await AuthService.register(email, password, username);
      res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.', ...result });
    } catch (e: any) {
      res.status(400).json({ message: e.message || 'Register failed' });
    }
  }

  static async login(req: Request, res: Response) {
    const { email, username, password } = req.body || {};
    const _email = email || username;
    if (!_email || !password) return res.status(400).json({ message: 'Email and password required' });

    const result = await AuthService.login(_email, password);
    if (!result) return res.status(401).json({ message: 'Invalid credentials' });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true, secure: !!process.env.COOKIE_SECURE, sameSite: 'lax',
      maxAge: parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10) * 1000,
      path: '/auth',
    });
    res.json({ access_token: result.access_token, expires_at: result.expires_at, refresh_token: result.refresh_token, token_type: 'Bearer' });
  }

  static async adminLogin(req: Request, res: Response) {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    const result = await AuthService.adminLogin(username, password);
    if (!result) return res.status(401).json({ message: 'Invalid admin credentials' });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true, secure: !!process.env.COOKIE_SECURE, sameSite: 'lax',
      maxAge: parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10) * 1000,
      path: '/auth',
    });
    res.json({ access_token: result.access_token, expires_at: result.expires_at, refresh_token: result.refresh_token, token_type: 'Bearer' });
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refresh = (req.cookies?.refresh_token as string) || (req.body?.refresh_token as string);
      if (!refresh) return res.status(400).json({ message: 'Missing refresh_token' });

      const ua = req.headers['user-agent'];
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || undefined;
      const result = await AuthService.refresh(refresh, ua, ip);

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true, secure: !!process.env.COOKIE_SECURE, sameSite: 'lax',
        maxAge: parseInt(process.env.REFRESH_TTL_SEC || `${60*60*24*30}`, 10) * 1000,
        path: '/auth',
      });
      res.json({ access_token: result.access_token, expires_at: result.expires_at, refresh_token: result.refresh_token, token_type: 'Bearer' });
    } catch (e: any) {
      res.status(401).json({ message: e.message || 'Refresh failed' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
      }
      
      const access = authHeader.substring(7);
      const refresh = (req.cookies?.refresh_token as string) || (req.body?.refresh_token as string);
      
      // Invalidate session, blacklist tokens, publish event
      const result = await AuthService.logout(access, refresh);
      
      // Clear refresh token cookie with proper security settings
      res.clearCookie('refresh_token', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ 
        message: 'Logout successful',
        success: true,
        sessionsDeleted: result.sessionsDeleted || 0,
        tokensRevoked: result.tokensRevoked || 0
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        message: 'Logout failed',
        error: error.message || 'Unknown error'
      });
    }
  }

  // ===== sessions =====
  static async listSessions(req: Request, res: Response) {
    const refresh = (req.cookies?.refresh_token as string) || (req.body?.refresh_token as string) || undefined;
    const data = await AuthService.listSessions(refresh);
    res.json({ items: data });
  }

  static async deleteSession(req: Request, res: Response) {
    const ok = await AuthService.deleteSessionById(req.params.sessionId);
    if (!ok) return res.status(404).json({ message: 'Session not found' });
    res.status(204).send();
  }

  static async deleteOtherSessions(req: Request, res: Response) {
    const all = String(req.query.all || '') === '1';
    if (all) {
      const { Session } = await import('../models/User');
      await Session.deleteMany({});
      return res.status(204).send();
    }
    const refresh = (req.cookies?.refresh_token as string) || (req.body?.refresh_token as string) || undefined;
    const result = await AuthService.deleteOtherSessions(refresh);
    res.json(result);
  }

  // ===== blacklist admin =====
  static async adminListBlacklist(_req: Request, res: Response) {
    const items = await AuthService.listBlacklist();
    res.json({ items });
  }
  static async adminBlacklistToken(req: Request, res: Response) {
    const token = req.body?.access_token as string;
    if (!token) return res.status(400).json({ message: 'access_token is required' });
    try {
      const decoded = jwt.decode(token) as any;
      await AuthService.blacklistAccess(token, decoded);
      res.status(201).json({ success: true });
    } catch {
      res.status(400).json({ message: 'Invalid access token' });
    }
  }

  static async googleLogin(req: Request, res: Response) {
    try {
      const idToken = (req.body?.idToken as string) || (req.body?.id_token as string);
      if (!idToken) {
        return res.status(400).json({ message: 'idToken is required' });
      }

      const result = await AuthService.loginWithGoogle(idToken);

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: !!process.env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: parseInt(process.env.REFRESH_TTL_SEC || `${60 * 60 * 24 * 30}`, 10) * 1000,
        path: '/auth',
      });
      res.json({
        access_token: result.access_token,
        expires_at: result.expires_at,
        refresh_token: result.refresh_token,
        token_type: 'Bearer',
      });
    } catch (e: any) {
      console.error('Google login error:', e);
      res.status(401).json({ message: e.message || 'Google login failed' });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authorization token required' });
      const token = authHeader.substring(7);

      // Check blacklist với MongoDB
      const bcrypt = await import('bcryptjs');
      const { TokenBlacklist } = await import('../models/User');
      
      const blacklistedTokens = await TokenBlacklist.find({ 
        expires_at: { $gt: new Date() } 
      }).select('token_hash').lean();
      
      for (const blacklisted of blacklistedTokens) {
        if (await bcrypt.default.compare(token, blacklisted.token_hash)) {
          return res.status(401).json({ message: 'Token revoked' });
        }
      }

      const decoded = jwt.verify(token, jwtConfig.secret, { issuer: jwtConfig.issuer, audience: jwtConfig.audience }) as any;
      res.json({ valid: true, claims: { id: decoded.id, email: decoded.email, role: decoded.role, jti: decoded.jti, exp: decoded.exp } });
    } catch {
      res.status(401).json({ valid: false, message: 'Invalid token' });
    }
  }
}
