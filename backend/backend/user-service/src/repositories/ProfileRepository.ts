import pool from '../config/database';
import { Profile, UpdateProfilePayload } from '../models/User';

export class ProfileRepository {
  static async getById(userId: string): Promise<Profile | null> {
    const q = await pool.query(
      `SELECT id, full_name, avatar_url, phone, date_of_birth, gender, bio, timezone, language, created_at, updated_at
       FROM profiles WHERE id = $1`, [userId]);
    return q.rows[0] || null;
  }

  static async upsertSkeleton(userId: string, fullName?: string | null) {
    await pool.query(
      `INSERT INTO profiles (id, full_name) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [userId, fullName ?? null]
    );
  }

  static async update(userId: string, data: UpdateProfilePayload): Promise<Profile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    
    // Ensure profile exists first (upsert skeleton if not)
    await this.upsertSkeleton(userId);
    
    if (!fields.length) {
      const current = await this.getById(userId);
      return current;
    }
    values.push(userId);
    const q = await pool.query(
      `UPDATE profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return q.rows[0] || null;
  }

  static async setLastLogin(userId: string) {
    // cột last_login có thể chưa tồn tại — thêm trước rồi update
    await pool.query(`ALTER TABLE IF EXISTS profiles 
                      ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`);
    await pool.query(`UPDATE profiles SET last_login = NOW() WHERE id = $1`, [userId]);
  }
}
