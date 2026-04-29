const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      avatar TEXT DEFAULT '/images/default-avatar.png',
      phone TEXT,
      bio TEXT,
      isHost INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      pricePerNight REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      maxGuests INTEGER NOT NULL DEFAULT 2,
      bedrooms INTEGER NOT NULL DEFAULT 1,
      bathrooms INTEGER NOT NULL DEFAULT 1,
      beds INTEGER NOT NULL DEFAULT 1,
      amenities TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      thumbnail TEXT DEFAULT '/images/default-property.jpg',
      rating REAL DEFAULT 0,
      reviewCount INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (hostId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      propertyId INTEGER NOT NULL,
      guestId INTEGER NOT NULL,
      hostId INTEGER NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL,
      guests INTEGER NOT NULL DEFAULT 1,
      totalPrice REAL NOT NULL,
      serviceFee REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      message TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (guestId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hostId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      propertyId INTEGER NOT NULL,
      guestId INTEGER NOT NULL,
      bookingId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      cleanlinessRating INTEGER,
      communicationRating INTEGER,
      locationRating INTEGER,
      valueRating INTEGER,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (guestId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      propertyId INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
      UNIQUE(userId, propertyId)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      bookingId INTEGER,
      content TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try { db.run('CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)'); } catch(e) {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country)'); } catch(e) {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type)'); } catch(e) {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guestId)'); } catch(e) {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(hostId)'); } catch(e) {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(propertyId)'); } catch(e) {}

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper to convert sql.js results to objects array
function queryAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('Query error:', sql, err.message);
    return [];
  }
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runSql(sql, params = []) {
  try {
    if (params.length > 0) {
      db.run(sql, params);
    } else {
      db.run(sql);
    }
    // Get last_insert_rowid immediately after the run, before any other operations
    const stmt = db.prepare('SELECT last_insert_rowid() as id');
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    const lastId = row.id || 0;
    saveDatabase();
    return { lastId };
  } catch (err) {
    console.error('Run error:', sql, err.message);
    throw err;
  }
}

function getDb() {
  return db;
}

module.exports = { initDatabase, queryAll, queryOne, runSql, saveDatabase, getDb };
