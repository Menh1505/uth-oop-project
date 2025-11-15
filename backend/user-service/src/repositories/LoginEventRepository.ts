import { Pool } from 'pg';
import pool from '../config/database';

interface LoginEvent {
  userId?: string;
  email?: string;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

export class LoginEventRepository {
  private static pool: Pool = pool;

  // Check if a message has been processed (for idempotency)
  static async isProcessed(messageId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM processed_messages 
      WHERE message_id = $1
    `;
    
    try {
      const result = await this.pool.query(query, [messageId]);
      return result.rows.length > 0;
    } catch (error) {
      // If table doesn't exist, create it
      await this.createProcessedMessagesTable();
      return false;
    }
  }

  // Mark a message as processed
  static async markProcessed(messageId: string, routingKey: string): Promise<void> {
    const query = `
      INSERT INTO processed_messages (message_id, routing_key, processed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (message_id) DO NOTHING
    `;
    
    try {
      await this.pool.query(query, [messageId, routingKey]);
    } catch (error) {
      // If table doesn't exist, create it and retry
      await this.createProcessedMessagesTable();
      await this.pool.query(query, [messageId, routingKey]);
    }
  }

  // Record a login event
  static async recordLogin(event: LoginEvent): Promise<void> {
    const query = `
      INSERT INTO login_events (user_id, email, login_timestamp, ip_address, user_agent, success)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    const values = [
      event.userId || null,
      event.email || null,
      event.timestamp ? new Date(event.timestamp) : new Date(),
      event.ipAddress || null,
      event.userAgent || null,
      event.success !== undefined ? event.success : true
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      // If table doesn't exist, create it and retry
      await this.createLoginEventsTable();
      await this.pool.query(query, values);
    }
  }

  // Create processed_messages table if it doesn't exist
  private static async createProcessedMessagesTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS processed_messages (
        message_id VARCHAR(255) PRIMARY KEY,
        routing_key VARCHAR(100) NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.pool.query(createTableQuery);
    
    // Create index for cleanup
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_processed_messages_processed_at 
      ON processed_messages(processed_at)
    `;
    
    await this.pool.query(createIndexQuery);
  }

  // Create login_events table if it doesn't exist
  private static async createLoginEventsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS login_events (
        event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        email VARCHAR(255),
        login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.pool.query(createTableQuery);
    
    // Create indexes
    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_login_events_email ON login_events(email)',
      'CREATE INDEX IF NOT EXISTS idx_login_events_timestamp ON login_events(login_timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_login_events_success ON login_events(success)'
    ];
    
    for (const indexQuery of createIndexQueries) {
      await this.pool.query(indexQuery);
    }
  }

  // Get login history for a user
  static async getUserLoginHistory(userId: string, limit = 10): Promise<any[]> {
    const query = `
      SELECT event_id, login_timestamp, ip_address, user_agent, success
      FROM login_events 
      WHERE user_id = $1
      ORDER BY login_timestamp DESC
      LIMIT $2
    `;
    
    try {
      const result = await this.pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      await this.createLoginEventsTable();
      const result = await this.pool.query(query, [userId, limit]);
      return result.rows;
    }
  }

  // Clean up old processed messages (run periodically)
  static async cleanupOldProcessedMessages(daysOld = 30): Promise<void> {
    const query = `
      DELETE FROM processed_messages 
      WHERE processed_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
    `;
    
    try {
      await this.pool.query(query);
    } catch (error) {
      // Table might not exist, that's OK
    }
  }

  // Clean up old login events (run periodically)
  static async cleanupOldLoginEvents(daysOld = 90): Promise<void> {
    const query = `
      DELETE FROM login_events 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
    `;
    
    try {
      await this.pool.query(query);
    } catch (error) {
      // Table might not exist, that's OK
    }
  }
}