const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Run migrations if in development
    if (process.env.NODE_ENV === 'development') {
      await runMigrations();
    }
    
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
};

// Run database migrations
const runMigrations = async () => {
  try {
    const migrationsDir = path.join(__dirname, '../../../database/schemas');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(migrationSQL);
      console.log(`✅ Migration applied: ${file}`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run database seeds
const runSeeds = async () => {
  try {
    const seedsDir = path.join(__dirname, '../../../database/seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      const seedPath = path.join(seedsDir, file);
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      
      await pool.query(seedSQL);
      console.log(`✅ Seed applied: ${file}`);
    }
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connectDB,
  runMigrations,
  runSeeds,
  query,
  transaction
};
