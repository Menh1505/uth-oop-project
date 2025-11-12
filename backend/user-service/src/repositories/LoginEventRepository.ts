// src/repositories/LoginEventRepository.ts
import pool from '../config/database';  // ⬅️ đúng đường dẫn
// ❌ bỏ: import { v4 as uuidv4 } from 'uuid';

export type UserLoggedInEvent = {
  userId?: string;
  email: string;
  role?: string;
  timestamp?: string;
  [k: string]: any;
};

export class LoginEventRepository {
  static async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        email TEXT NOT NULL,
        role TEXT,
        occurred_at TIMESTAMPTZ NOT NULL,
        raw JSONB NOT NULL
      )
    `);
  }

  static async recordLogin(evt: UserLoggedInEvent) {
    await pool.query(
      `INSERT INTO login_events (user_id, email, role, occurred_at, raw)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        evt.userId || null,
        evt.email,
        evt.role || null,
        evt.timestamp ? new Date(evt.timestamp) : new Date(),
        JSON.stringify(evt),
      ]
    );
  }
}
