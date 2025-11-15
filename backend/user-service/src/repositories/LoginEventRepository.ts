import pool from '../config/database';

export type UserLoggedInEvent = {
  userId?: string;
  email: string;
  role?: string;
  timestamp?: string;
  [k: string]: any;
};

export class LoginEventRepository {
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

  static async markProcessed(eventId: string, type: string) {
    await pool.query(
      `INSERT INTO processed_events (event_id, event_type) VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, type]
    );
  }

  static async isProcessed(eventId: string): Promise<boolean> {
    const q = await pool.query(`SELECT 1 FROM processed_events WHERE event_id = $1`, [eventId]);
    return (q.rowCount ?? 0) > 0;
  }
}
