import { Pool } from 'pg';

// Use default values if environment variables are not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nutrition_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    client.release(); // Release the test connection
    console.log('✅ Database connection pool initialized');
    if (!process.env.DATABASE_URL) {
      console.log('ℹ️  Using default database configuration');
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.error('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
    throw error;
  }
};

export default pool;