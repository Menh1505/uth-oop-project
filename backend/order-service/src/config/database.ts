import { Pool } from 'pg';
import { config } from './index.js';

const pool = new Pool(
  config.db.url
    ? { connectionString: config.db.url }
    : {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.name
      }
);
export default pool;
