import pool from '../config/database';
import { Address } from '../models/User';

export class AddressRepository {
  static async list(userId: string): Promise<Address[]> {
    const q = await pool.query(`SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return q.rows as Address[];
  }
}
