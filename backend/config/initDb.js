/**
 * initDb.js — Runs schema.sql to create all tables in PostgreSQL
 * Usage: npm run db:init
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'auth_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    const client = await pool.connect();

    console.log('📄 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Running schema...');
    await client.query(schemaSql);

    console.log('✅ Database initialized successfully!');
    console.log('   Tables created:');
    console.log('   - users');
    console.log('   - sessions');
    console.log('   - login_attempts');
    console.log('   - password_reset_tokens');

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    console.error('');
    console.error('💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. The database "auth_system" exists (CREATE DATABASE auth_system;)');
    console.error('   3. Your .env credentials are correct');
    process.exit(1);
  }
}

initializeDatabase();
