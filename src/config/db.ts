import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../common/logger';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    Logger.instance().log('Connection to the database successful!');
    client.release();
  } catch (error) {
    Logger.instance().log(`Error connecting to the database:, ${error.message}`);
  }
};

