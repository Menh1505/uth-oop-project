import pool from '../config/database';
import { Preferences } from '../models/User';

export class PreferencesRepository {
  static async get(userId: string): Promise<Preferences | null> {
    const q = await pool.query(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]);
    return q.rows[0] || null;
  }
}
