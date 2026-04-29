# Technical Documentation - StayBooker Booking Web Application

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Files](#backend-files)
   - [package.json](#packagejson)
   - [server.js](#serverjs)
   - [database.js](#databasejs)
   - [middleware/auth.js](#middlewareauthjs)
   - [routes/auth.js](#routesauthjs)
   - [routes/properties.js](#routespropertiesjs)
   - [routes/bookings.js](#routesbookingsjs)
   - [routes/reviews.js](#routesreviewsjs)
   - [routes/users.js](#routesusersjs)
   - [routes/messages.js](#routesmessagesjs)
   - [seed.js](#seedjs)
5. [Frontend Files](#frontend-files)
   - [public/index.html](#publicindexhtml)
   - [public/js/api.js](#publicjsapijs)
   - [public/js/app.js](#publicjsappjs)
   - [public/js/pages.js](#publicjspagesjs)
   - [public/css/styles.css](#publiccssstylescss)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Authentication Flow](#authentication-flow)
9. [Client-Side Routing](#client-side-routing)
10. [Data Flow & Architecture Patterns](#data-flow--architecture-patterns)
11. [Running the Application](#running-the-application)

---

## Architecture Overview

StayBooker follows a **monolithic full-stack architecture** where a single Express.js server handles both the REST API and serves the static frontend files. The frontend is a **vanilla JavaScript Single Page Application (SPA)** — no frameworks like React or Vue are used.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Client)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  index.html  │  │   app.js     │  │   pages.js    │  │
│  │  (Shell/UI)  │  │  (Router &   │  │  (Page Render │  │
│  │              │  │   Auth)      │  │   Functions)  │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └──────────────────┼──────────────────┘          │
│                            │                              │
│                    ┌───────▼────────┐                     │
│                    │    api.js      │                     │
│                    │  (HTTP Client) │                     │
│                    └───────┬────────┘                     │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTP (fetch)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Express.js Server                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   Middleware                       │   │
│  │  cors → json → urlencoded → cookieParser → static │   │
│  └──────────────────────┬────────────────────────────┘   │
│                         ▼                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │              Route Handlers                        │   │
│  │  /api/auth  /api/properties  /api/bookings        │   │
│  │  /api/reviews  /api/users  /api/messages          │   │
│  └──────────────────────┬────────────────────────────┘   │
│                         ▼                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │              database.js (DAL)                     │   │
│  │         queryAll / queryOne / runSql               │   │
│  └──────────────────────┬────────────────────────────┘   │
│                         ▼                                 │
│  ┌───────────────────────────────────────────────────┐   │
│  │              sql.js (SQLite in-memory)             │   │
│  │           Persisted to database.db file            │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**
- **sql.js** was chosen over `better-sqlite3` because sql.js is a pure JavaScript implementation (compiled from C via Emscripten/WASM) and requires NO native compilation. This avoids issues with node-gyp, Python, or Visual Studio Build Tools on Windows.
- The database is loaded into memory on startup and explicitly written to disk after each write operation (`saveDatabase()`).
- The frontend uses the **History API** (`window.history.pushState`) for clean URLs without page reloads.
- Authentication uses **JWT tokens** stored in `localStorage` and sent via the `Authorization: Bearer <token>` header.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript runtime for the server |
| Web Framework | Express.js 4.18 | HTTP server, routing, middleware pipeline |
| Database | sql.js 1.9 (SQLite) | Relational data storage (in-memory + file persistence) |
| Authentication | jsonwebtoken 9.x | JWT token creation and verification |
| Password Hashing | bcryptjs 2.4 | Secure password hashing (pure JS, no native deps) |
| File Upload | multer 1.4 | Multipart form data handling (prepared, not yet used) |
| UUID | uuid 9.x | Unique identifier generation (prepared for future use) |
| CORS | cors 2.8 | Cross-Origin Resource Sharing headers |
| Cookie Parsing | cookie-parser 1.4 | Parse cookies from request headers |
| Frontend | Vanilla HTML/CSS/JS | No framework — raw DOM manipulation |
| Icons | Font Awesome 6.5 | Icon library loaded via CDN |
| Fonts | Google Fonts (Inter) | Typography loaded via CDN |

---

## Project Structure

```
booking web app/
├── server.js              # Express app entry point & server bootstrap
├── database.js            # Database initialization, connection, helper functions
├── seed.js                # Database seeding script with demo data
├── package.json           # NPM dependencies & scripts
├── database.db            # SQLite database file (auto-generated)
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── routes/
│   ├── auth.js            # Login, Register, Get Current User
│   ├── properties.js      # CRUD for properties, search/filter, favorites
│   ├── bookings.js        # Create/manage bookings, host/guest views
│   ├── reviews.js         # Create reviews, get property reviews
│   ├── users.js           # Profile management, favorites list, host properties
│   └── messages.js        # Send messages, conversations, chat
├── public/
│   ├── index.html         # Main HTML shell (SPA entry point)
│   ├── css/
│   │   └── styles.css     # All application styles
│   └── js/
│       ├── api.js         # API client class (HTTP abstraction layer)
│       ├── app.js         # Application controller (auth, routing, UI handlers)
│       └── pages.js       # Page rendering functions (DOM generation)
└── uploads/               # Directory for user-uploaded files (auto-created)
```

---

## Backend Files

---

### package.json

**Purpose:** Defines the project metadata, dependencies, and npm scripts.

```json
{
  "name": "booking-web-app",
  "version": "1.0.0",
  "description": "An Airbnb-like booking web application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  }
}
```

**Scripts explained:**
- `npm start` — Runs the server in production mode using Node directly.
- `npm run dev` — Runs the server with `nodemon`, which auto-restarts on file changes (development mode).
- `npm run seed` — Drops and re-creates the database with demo/sample data.

**Dependencies:**
- `express` — The web framework that handles HTTP requests, routing, and middleware.
- `sql.js` — Pure JavaScript SQLite engine (compiles SQLite C code to WebAssembly). Unlike `better-sqlite3`, it doesn't need a C compiler to install.
- `jsonwebtoken` — Creates and verifies JWT tokens for stateless authentication.
- `bcryptjs` — Pure JavaScript bcrypt implementation. Hashes passwords before storing them. The "js" variant avoids native compilation issues.
- `cookie-parser` — Middleware that parses the `Cookie` header and populates `req.cookies`.
- `cors` — Middleware that sets CORS headers so the API can be called from different origins.
- `multer` — Middleware for handling `multipart/form-data` (file uploads). Included for future image upload support.
- `uuid` — Generates RFC4122 UUIDs. Available for future use (e.g., unique filenames for uploads).

**Dev Dependencies:**
- `nodemon` — Watches for file changes and auto-restarts the Node.js process during development.

---

### server.js

**Purpose:** The application entry point. Sets up the Express application, configures middleware, mounts route handlers, and starts the HTTP server.

**Line-by-line breakdown:**

```javascript
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
```
These import all required modules. `path` and `fs` are Node.js built-in modules for file system operations and path manipulation.

```javascript
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const { initDatabase } = require('./database');
```
Each route module exports an Express Router instance. We import `initDatabase` to initialize the SQLite database before the server starts accepting requests.

```javascript
const app = express();
const PORT = process.env.PORT || 3000;
```
Creates the Express application instance. The port defaults to 3000 but can be overridden via the `PORT` environment variable (important for deployment).

**Middleware Pipeline (order matters!):**
```javascript
app.use(cors());                              // 1. Allow cross-origin requests
app.use(express.json());                      // 2. Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // 3. Parse URL-encoded form data
app.use(cookieParser());                      // 4. Parse cookies
app.use(express.static(path.join(__dirname, 'public')));          // 5. Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 6. Serve uploaded files
```

> **Why order matters:** Middleware executes in the order it's registered. `express.json()` MUST come before route handlers, otherwise `req.body` would be `undefined`. Static file serving comes before routes so that actual files (CSS, JS, images) are served without hitting the API router.

**Uploads directory creation:**
```javascript
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}
```
Ensures the `uploads/` directory exists. The `{ recursive: true }` option creates parent directories if needed (like `mkdir -p` in Unix).

**Route Mounting:**
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
```
Each route module is "mounted" at a base path. For example, if `authRoutes` defines `router.post('/login', ...)`, the full URL becomes `POST /api/auth/login`.

**SPA Catch-All:**
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```
This is critical for SPAs. Any GET request that doesn't match a static file or API route receives `index.html`. This allows the frontend router to handle paths like `/property/5` or `/trips` — without this, refreshing the page on those URLs would return 404.

> **Important:** This MUST be defined AFTER the API routes. Otherwise, API requests would get `index.html` instead of JSON responses.

**Error Handling Middleware:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```
Express identifies error-handling middleware by its 4-parameter signature `(err, req, res, next)`. If any route throws an unhandled error or calls `next(err)`, this catches it and returns a generic 500 response.

**Server Initialization:**
```javascript
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🏠 Booking app server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
```
`initDatabase()` is async because sql.js needs to load its WASM binary. We wait for the database to be ready BEFORE starting the HTTP server. If database initialization fails, we hard-exit with code 1 (telling the OS something went wrong).

---

### database.js

**Purpose:** Manages the SQLite database lifecycle — initialization, schema creation, persistence to disk, and provides helper functions for querying/writing data.

**This is the most critical infrastructure file.** It acts as the Data Access Layer (DAL) between the route handlers and the underlying SQLite engine.

#### Database Initialization

```javascript
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
let db = null;
```
- `sql.js` exports a factory function, not the SQL class directly.
- `db` is a module-level variable — this means it's effectively a singleton. All requests share the same database connection.
- `DB_PATH` resolves to `<project_root>/database.db`.

```javascript
async function initDatabase() {
  const SQL = await initSqlJs();
```
`initSqlJs()` loads the WebAssembly binary for SQLite. This is why the function is async — WASM loading is asynchronous.

```javascript
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
```
**Persistence Strategy:** If a database file exists, we load it into memory. Otherwise, we create a fresh in-memory database. All subsequent operations happen in-memory for speed, and we explicitly flush to disk after writes.

#### Schema Creation (CREATE TABLE IF NOT EXISTS)

The `IF NOT EXISTS` clause means these statements are idempotent — safe to run multiple times. They only create tables if they don't already exist.

**Users Table:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing primary key
  email TEXT UNIQUE NOT NULL,             -- Unique constraint prevents duplicate emails
  password TEXT NOT NULL,                 -- Stores bcrypt hash, NOT plaintext
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  avatar TEXT DEFAULT '/images/default-avatar.png',
  phone TEXT,                             -- Nullable (optional field)
  bio TEXT,                               -- Nullable
  isHost INTEGER DEFAULT 0,              -- SQLite has no BOOLEAN, uses 0/1
  createdAt TEXT DEFAULT (datetime('now')),  -- SQLite stores dates as TEXT (ISO 8601)
  updatedAt TEXT DEFAULT (datetime('now'))
)
```
> **Design Note:** SQLite doesn't have a native BOOLEAN or DATETIME type. Booleans are stored as INTEGER (0 or 1), and dates as TEXT in ISO 8601 format using SQLite's `datetime('now')` function.

**Properties Table:**
```sql
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostId INTEGER NOT NULL,               -- Foreign key → users.id
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,                    -- 'apartment', 'house', 'villa', etc.
  pricePerNight REAL NOT NULL,           -- REAL = floating point
  currency TEXT DEFAULT 'USD',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude REAL,                         -- For map integration (future)
  longitude REAL,
  maxGuests INTEGER NOT NULL DEFAULT 2,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  beds INTEGER NOT NULL DEFAULT 1,
  amenities TEXT DEFAULT '[]',           -- JSON array stored as TEXT
  images TEXT DEFAULT '[]',              -- JSON array stored as TEXT
  thumbnail TEXT DEFAULT '/images/default-property.jpg',
  rating REAL DEFAULT 0,                 -- Denormalized from reviews
  reviewCount INTEGER DEFAULT 0,         -- Denormalized from reviews
  isActive INTEGER DEFAULT 1,            -- Soft delete / listing toggle
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hostId) REFERENCES users(id) ON DELETE CASCADE
)
```
> **Design Decisions:**
> - `amenities` and `images` store JSON arrays as TEXT strings. This is a common pattern in SQLite since it lacks a native JSON column type. They get parsed with `JSON.parse()` when reading from the DB.
> - `rating` and `reviewCount` are **denormalized** — they're calculated from the `reviews` table and cached here for performance. Updated every time a new review is submitted.
> - `ON DELETE CASCADE` means if a user (host) is deleted, all their properties are automatically deleted too.

**Bookings Table:**
```sql
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  propertyId INTEGER NOT NULL,
  guestId INTEGER NOT NULL,
  hostId INTEGER NOT NULL,              -- Stored redundantly for query performance
  checkIn TEXT NOT NULL,                -- Date as ISO string 'YYYY-MM-DD'
  checkOut TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  totalPrice REAL NOT NULL,             -- Pre-calculated at booking time
  serviceFee REAL DEFAULT 0,            -- 12% service fee
  status TEXT DEFAULT 'pending',        -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  message TEXT,                         -- Optional message from guest to host
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (guestId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hostId) REFERENCES users(id) ON DELETE CASCADE
)
```
> **Why store hostId redundantly?** The hostId can be derived from `properties.hostId`, but storing it directly in bookings avoids a JOIN when querying "all bookings for this host." This is a common read-performance optimization.

**Reviews Table:**
```sql
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  propertyId INTEGER NOT NULL,
  guestId INTEGER NOT NULL,
  bookingId INTEGER NOT NULL,          -- Links review to specific booking (prevents double reviews)
  rating INTEGER NOT NULL,             -- Overall rating 1-5
  comment TEXT,
  cleanlinessRating INTEGER,           -- Sub-ratings (optional)
  communicationRating INTEGER,
  locationRating INTEGER,
  valueRating INTEGER,
  createdAt TEXT DEFAULT (datetime('now')),
  -- Foreign keys with cascaded deletes
)
```

**Favorites Table:**
```sql
CREATE TABLE IF NOT EXISTS favorites (
  userId INTEGER NOT NULL,
  propertyId INTEGER NOT NULL,
  UNIQUE(userId, propertyId)           -- Prevents duplicate favorites
)
```
The `UNIQUE(userId, propertyId)` composite constraint ensures a user can only favorite a property once.

**Messages Table:**
```sql
CREATE TABLE IF NOT EXISTS messages (
  senderId INTEGER NOT NULL,
  receiverId INTEGER NOT NULL,
  bookingId INTEGER,                   -- Optional link to a booking context
  content TEXT NOT NULL,
  isRead INTEGER DEFAULT 0,            -- Read receipt tracking
  createdAt TEXT DEFAULT (datetime('now'))
)
```

#### Indexes

```javascript
db.run('CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)');
db.run('CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country)');
db.run('CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type)');
db.run('CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guestId)');
db.run('CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(hostId)');
db.run('CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(propertyId)');
```
Indexes speed up queries that filter/sort by these columns. Without them, SQLite would do a full table scan every time. Wrapped in try-catch because re-creating an existing index might throw in some edge cases.

#### Helper Functions

**`saveDatabase()`**
```javascript
function saveDatabase() {
  if (db) {
    const data = db.export();          // Export in-memory DB as Uint8Array
    const buffer = Buffer.from(data);  // Convert to Node.js Buffer
    fs.writeFileSync(DB_PATH, buffer); // Write atomically to disk
  }
}
```
This persists the in-memory database to the file system. Called after every write operation. This is the trade-off of sql.js: you get easy setup but must manage persistence yourself.

> **Potential Issue:** In a high-concurrency scenario, multiple requests writing simultaneously could cause race conditions. For a production app, you'd want a proper database server (PostgreSQL) or at minimum a write queue.

**`queryAll(sql, params)`**
```javascript
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);          // Compile the SQL into a prepared statement
  if (params.length > 0) stmt.bind(params); // Bind parameters (prevents SQL injection!)
  
  const results = [];
  while (stmt.step()) {                  // Iterate over result rows
    results.push(stmt.getAsObject());    // Convert each row to a JS object
  }
  stmt.free();                           // IMPORTANT: Free memory for the statement
  return results;
}
```
Executes a SELECT query and returns an array of objects. The `stmt.free()` call is critical — sql.js uses WASM memory that isn't garbage-collected by JavaScript's GC. Failing to free statements causes memory leaks.

> **Security:** Parameters are bound via `?` placeholders, not string concatenation. This **prevents SQL injection attacks**. If someone passed `'; DROP TABLE users; --` as a name, it would be treated as a literal string value, not executable SQL.

**`queryOne(sql, params)`**
```javascript
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}
```
Convenience wrapper that returns the first result or `null`. Used when you expect 0 or 1 results (e.g., finding a user by email).

**`runSql(sql, params)`**
```javascript
function runSql(sql, params = []) {
  if (params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  // Get last_insert_rowid immediately after the run
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  const lastId = row.id || 0;
  saveDatabase();    // Persist to disk
  return { lastId }; // Return the auto-generated ID
}
```
Executes INSERT/UPDATE/DELETE statements. Returns the `lastId` which is the auto-incremented ID of the last inserted row.

> **Critical Bug Fix Note:** The `last_insert_rowid()` query MUST happen immediately after `db.run()` and BEFORE `saveDatabase()`. In an earlier version, `saveDatabase()` was called first, which reset the last_insert_rowid to 0. This caused new users/properties to get ID 0 instead of their actual ID.

---

### middleware/auth.js

**Purpose:** Provides JWT-based authentication middleware functions that protect API endpoints.

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```
The secret key used to sign and verify JWT tokens. In production, this MUST be set via an environment variable, not hardcoded.

> **Security Note:** If an attacker knows the JWT_SECRET, they can forge tokens for any user. Always use a strong, random string (e.g., 64+ characters) and store it in environment variables or a secrets manager.

**`authenticate` middleware:**
```javascript
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // "Bearer <token>" → "<token>"
  
  // Fallback: check cookies
  const cookieToken = req.cookies && req.cookies.token;
  const finalToken = token || cookieToken;

  if (!finalToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(finalToken, JWT_SECRET);
    req.user = decoded;  // Attaches { id, email, isHost } to the request
    next();              // Continue to the next middleware/route handler
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

**How middleware works in Express:**
1. Express calls middleware functions in order.
2. If `authenticate` succeeds, it calls `next()` which passes control to the route handler.
3. If it fails, it sends a response (401 or 403) and does NOT call `next()`, stopping the chain.

**Token extraction strategy:**
1. First, check the `Authorization` header (format: `Bearer eyJhbGciOi...`)
2. If not found there, check for a `token` cookie
3. This dual approach supports both API clients (header) and browser-based apps (cookies)

**`optionalAuth` middleware:**
```javascript
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies && req.cookies.token;
  const finalToken = token || cookieToken;

  if (finalToken) {
    try {
      req.user = jwt.verify(finalToken, JWT_SECRET);
    } catch (err) {
      // Token invalid — just proceed without user
    }
  }
  next(); // ALWAYS calls next(), whether authenticated or not
}
```
Used on routes that work for both anonymous and authenticated users (e.g., property listing shows "favorited" status only for logged-in users). The key difference from `authenticate`: it NEVER rejects the request. If the token is invalid or missing, `req.user` remains `undefined` and the request continues.

---

### routes/auth.js

**Purpose:** Handles user registration, login, and fetching the current authenticated user.

#### POST /api/auth/register

```javascript
router.post('/register', (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
```
Destructures the request body. Express's `json()` middleware already parsed the JSON string into a JavaScript object.

**Validation:**
```javascript
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
```
Server-side validation is essential even if the frontend validates too — never trust the client.

**Duplicate check:**
```javascript
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }
```
Because `email` has a UNIQUE constraint in the database, we could rely on the SQL error. But checking explicitly gives a better error message.

**Password hashing:**
```javascript
  const hashedPassword = bcrypt.hashSync(password, 10);
```
`bcrypt.hashSync(plaintext, rounds)` — The `10` is the number of salt rounds (2^10 = 1024 iterations). Higher = more secure but slower. 10 is the industry standard for web applications.

> **Never store plaintext passwords.** Bcrypt is a one-way hash — you can't reverse it. To verify a password later, you hash the input again and compare hashes.

**User creation & token generation:**
```javascript
  const result = runSql('INSERT INTO users ...', [...]);
  const user = queryOne('SELECT id, email, firstName, ... WHERE id = ?', [result.lastId]);
  const token = jwt.sign({ id: user.id, email: user.email, isHost: user.isHost }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user, token });
```
After inserting, we fetch the user back to get the full object (with defaults like `createdAt`). The JWT is signed with a 7-day expiration. The response includes both the user object (for immediate display) and the token (for future authenticated requests).

#### POST /api/auth/login

```javascript
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
```

> **Security Best Practice:** The error message is intentionally vague ("Invalid email or password") rather than saying "User not found" or "Wrong password". This prevents **account enumeration** — an attacker can't determine which emails have accounts.

```javascript
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
```
Uses destructuring to remove the password hash from the response. The `password: _` renames it to `_` (convention for unused variables) and the spread `...userWithoutPassword` collects everything else.

#### GET /api/auth/me

```javascript
router.get('/me', authenticate, (req, res) => {
```
The `authenticate` middleware runs first. If the token is valid, `req.user` contains `{ id, email, isHost }` from the token payload. The handler then fetches fresh user data from the database (in case anything changed since the token was issued).

---

### routes/properties.js

**Purpose:** CRUD operations for properties, search/filtering, and favorite toggling.

#### GET /api/properties (Search & Filter)

This is the most complex endpoint. It builds a dynamic SQL query based on query parameters.

```javascript
router.get('/', optionalAuth, (req, res) => {
  const {
    city, country, type, minPrice, maxPrice,
    guests, bedrooms, bathrooms,
    search, sort, page = 1, limit = 12
  } = req.query;
```
`req.query` contains URL query parameters (e.g., `/api/properties?city=Paris&type=apartment`). Defaults: page 1, 12 results per page.

**Dynamic Query Building:**
```javascript
  let query = 'SELECT ... FROM properties p JOIN users u ON p.hostId = u.id WHERE p.isActive = 1';
  const params = [];

  if (search) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.city LIKE ? OR p.country LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
```
The pattern here is called **query composition**: start with a base query and conditionally append WHERE clauses. Each clause adds `?` placeholders and pushes corresponding values into the `params` array.

> **LIKE with %:** The `%` wildcard matches any sequence of characters. `%Paris%` matches "Visit Paris", "Parisian Apartment", etc.

**Pagination:**
```javascript
  // Count total results (for pagination metadata)
  const countQuery = query.replace('SELECT p.*, u.firstName...', 'SELECT COUNT(*) as total');
  const countResult = queryOne(countQuery, params);

  // Apply LIMIT/OFFSET for current page
  const offset = (Number(page) - 1) * Number(limit);
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);
```
We run the same query twice: once to get the total count, once to get the actual page of results. This allows the frontend to show "Page 2 of 5".

> **OFFSET formula:** Page 1 → offset 0, Page 2 → offset 12, Page 3 → offset 24 (with limit=12).

**JSON Parsing:**
```javascript
  const parsed = properties.map(p => ({
    ...p,
    amenities: JSON.parse(p.amenities || '[]'),
    images: JSON.parse(p.images || '[]')
  }));
```
Since amenities/images are stored as JSON TEXT in SQLite, we parse them back into arrays before sending to the client.

#### GET /api/properties/:id (Single Property Detail)

Returns a single property with additional context: reviews, favorite status, and booked dates.

```javascript
  let isFavorited = false;
  if (req.user) {  // Only if authenticated (optionalAuth)
    const fav = queryOne('SELECT id FROM favorites WHERE userId = ? AND propertyId = ?', [req.user.id, propertyId]);
    isFavorited = !!fav;  // Convert truthy/falsy to boolean
  }
```
The double-bang `!!` operator converts any value to a boolean. `!!null` → `false`, `!!{id: 5}` → `true`.

```javascript
  const bookings = queryAll(`
    SELECT checkIn, checkOut FROM bookings
    WHERE propertyId = ? AND status IN ('confirmed', 'pending')
    AND checkOut >= date('now')
  `, [propertyId]);
```
Returns future-dated bookings so the frontend can disable those dates in the calendar.

#### POST /api/properties (Create Listing)

```javascript
  // Make user a host if not already
  runSql('UPDATE users SET isHost = 1 WHERE id = ?', [req.user.id]);
```
Automatically promotes a user to "host" status when they create their first listing. This is a nice UX touch — no separate "become a host" workflow needed.

#### PUT /api/properties/:id (Update)

Uses SQL `COALESCE(?, column_name)` pattern:
```javascript
  runSql(`UPDATE properties SET title = COALESCE(?, title), ... WHERE id = ?`, [title || null, ...]);
```
`COALESCE` returns the first non-NULL argument. If the client sends `title: null` (or we convert empty string to null), the existing value is preserved. This enables partial updates — the client only sends fields that changed.

#### POST /api/properties/:id/favorite (Toggle)

```javascript
  const existing = queryOne('SELECT id FROM favorites WHERE userId = ? AND propertyId = ?', [...]);
  if (existing) {
    runSql('DELETE FROM favorites WHERE id = ?', [existing.id]);
    res.json({ isFavorited: false });
  } else {
    runSql('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [...]);
    res.json({ isFavorited: true });
  }
```
A **toggle** pattern: check if it exists → if yes, remove it; if no, add it. The response tells the client the new state.

---

### routes/bookings.js

**Purpose:** Manages the booking lifecycle — creation, retrieval, and status management.

#### POST /api/bookings (Create Booking)

**Business logic validations:**
1. Property must exist and be active
2. You can't book your own property
3. Guest count must not exceed max
4. Dates must not conflict with existing bookings

**Availability Check (complex SQL):**
```javascript
  const conflict = queryOne(`
    SELECT id FROM bookings
    WHERE propertyId = ? AND status IN ('pending', 'confirmed')
    AND (
      (checkIn <= ? AND checkOut > ?)    -- Existing booking spans our check-in
      OR (checkIn < ? AND checkOut >= ?)  -- Existing booking spans our check-out
      OR (checkIn >= ? AND checkOut <= ?) -- Existing booking is within our range
    )
  `, [propertyId, checkIn, checkIn, checkOut, checkOut, checkIn, checkOut]);
```
This covers all possible overlap scenarios between the requested dates and existing bookings. Only 'pending' and 'confirmed' bookings block availability — cancelled/completed ones don't.

**Price Calculation:**
```javascript
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const subtotal = property.pricePerNight * nights;
  const serviceFee = Math.round(subtotal * 0.12 * 100) / 100; // 12% fee, rounded to cents
  const totalPrice = subtotal + serviceFee;
```
The service fee is 12% of the subtotal. `Math.round(x * 100) / 100` rounds to 2 decimal places (cents).

#### PATCH /api/bookings/:id/status (Update Status)

**Role-based permissions:**
```javascript
  if (booking.hostId === req.user.id) {
    // Host can confirm or cancel
    if (!['confirmed', 'cancelled'].includes(status)) return error;
  } else if (booking.guestId === req.user.id) {
    // Guest can ONLY cancel
    if (status !== 'cancelled') return error;
  } else {
    return 403; // Neither host nor guest
  }
```
This implements a state machine where hosts have more control (accept/decline) while guests can only cancel.

---

### routes/reviews.js

**Purpose:** Handles review creation and retrieval for properties.

#### POST /api/reviews (Create Review)

**Guard conditions:**
1. Booking must exist, belong to the user, and be 'completed'
2. Can't review the same booking twice (checked via `bookingId`)

**Rating Recalculation:**
```javascript
  const stats = queryOne('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE propertyId = ?', [propertyId]);
  runSql('UPDATE properties SET rating = ?, reviewCount = ? WHERE id = ?', [
    Math.round((stats.avgRating || 0) * 10) / 10,  // Round to 1 decimal
    stats.count || 0,
    propertyId
  ]);
```
After each new review, the property's cached rating and count are recalculated from ALL reviews. This ensures the denormalized data stays accurate.

---

### routes/users.js

**Purpose:** User profile management, favorites list, and host-specific property listing.

#### GET /api/users/:id (Public Profile)

Returns public user info (no email, no password) plus their active listings if they're a host.

#### PUT /api/users/profile (Update Own Profile)

Uses the same `COALESCE` pattern as property updates for partial updates.

#### GET /api/users/favorites/list

```javascript
  const favorites = queryAll(`
    SELECT p.*, u.firstName as hostFirstName, u.lastName as hostLastName
    FROM favorites f
    JOIN properties p ON f.propertyId = p.id
    JOIN users u ON p.hostId = u.id
    WHERE f.userId = ?
  `, [req.user.id]);
```
A **three-table JOIN**: starts from favorites, joins to properties (to get listing details), then joins to users (to get host name). This is a common pattern for junction/pivot tables.

---

### routes/messages.js

**Purpose:** Real-time messaging between guests and hosts (without WebSockets — uses HTTP polling).

#### GET /api/messages/conversations

This endpoint builds a "conversations list" (like WhatsApp/iMessage sidebar) from raw message data:

```javascript
  // Get distinct users this person has communicated with
  const conversations = queryAll(`
    SELECT DISTINCT
      CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END as userId
    FROM messages m
    WHERE m.senderId = ? OR m.receiverId = ?
  `, [userId, userId, userId]);
```
The `CASE` expression is clever: for each message, if I'm the sender, the "other person" is the receiver, and vice versa. `DISTINCT` ensures each person appears once.

Then for each conversation partner, it fetches:
- Their profile info (name, avatar)
- The last message (for preview)
- Unread count

> **Performance Note:** This N+1 query pattern (1 query to get conversations, then N queries for details) is fine for small datasets but would be slow with many conversations. A production app would use a single query with subqueries or CTEs.

#### GET /api/messages/conversation/:userId

Fetches all messages between the current user and another user, ordered chronologically:
```javascript
  WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
```
This bidirectional condition gets messages sent in BOTH directions.

```javascript
  // Mark messages as read
  runSql('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ?', [otherUserId, req.user.id]);
```
When you open a conversation, all messages FROM the other person TO you are marked as read.

---

### seed.js

**Purpose:** Populates the database with realistic demo data for development and testing.

**Strategy:**
1. Delete existing database file (`fs.unlinkSync`) — ensures a clean slate
2. Initialize a fresh database
3. Create 6 users (5 hosts + 1 guest)
4. Create 12 diverse properties across different cities and types
5. Create 4 bookings in various states (pending, confirmed, completed)
6. Create 2 reviews for completed bookings
7. Add 3 favorites for the guest user

**Password Handling:**
```javascript
const hashedPassword = bcrypt.hashSync('password123', 10);
```
All demo accounts use the same password ('password123') hashed with bcrypt. This is calculated ONCE and reused for all users (since they have the same password).

**Property Data:**
Properties include realistic descriptions, geo-coordinates, amenity lists, and Unsplash thumbnail URLs. The data is designed to test various filter combinations (different cities, types, price ranges, guest capacities).

**Booking States:**
- `confirmed` — Upcoming trip
- `completed` — Past trip (can be reviewed)
- `pending` — Awaiting host approval
- `cancelled` — Would exist after someone cancels

**Favorites with try-catch:**
```javascript
try { runSql('INSERT INTO favorites ...'); } catch(e) {}
```
Wrapped in try-catch because if the seed runs again without deleting the DB file first, the UNIQUE constraint would throw. The try-catch silently ignores duplicates.

---

## Frontend Files

---

### public/index.html

**Purpose:** The HTML shell (skeleton) of the Single Page Application. This is the ONLY HTML file — all page content is dynamically generated by JavaScript.

**Structure:**
1. **`<head>`** — Meta tags, CSS link, Font Awesome (icons), Google Fonts (Inter)
2. **`<nav>`** — Navigation bar with logo, search button, user menu
3. **Search Modal** — Full-screen overlay with search/filter form
4. **Auth Modal** — Login/Register forms in a modal overlay
5. **`<main id="main-content">`** — Empty container where JavaScript renders page content
6. **`<footer>`** — Static footer with links
7. **`<script>` tags** — Load api.js, app.js, pages.js (in order)

**Key HTML Patterns:**

**Navigation User Menu:**
```html
<div id="guest-menu">        <!-- Shown when NOT logged in -->
  <a href="#" onclick="openAuthModal('login')">Log in</a>
  <a href="#" onclick="openAuthModal('register')">Sign up</a>
</div>
<div id="user-menu" style="display:none;">  <!-- Shown when logged in -->
  <a href="#" onclick="navigate('trips')">My Trips</a>
  ...
</div>
```
Both menus exist in the DOM simultaneously — JavaScript toggles their `display` property based on auth state.

**Modal Pattern:**
```html
<div class="modal-overlay" id="auth-modal">   <!-- Full-screen transparent bg -->
  <div class="modal-content auth-modal-content">  <!-- Centered white card -->
    ...
  </div>
</div>
```
Modals are always in the DOM but hidden via CSS (`display: none` or `opacity: 0`). JavaScript adds/removes an `active` class to show/hide them.

**Script Load Order:**
```html
<script src="/js/api.js"></script>   <!-- Must load first (defines `api` global) -->
<script src="/js/app.js"></script>   <!-- Depends on api.js -->
<script src="/js/pages.js"></script> <!-- Depends on app.js functions -->
```
Order matters because these aren't ES modules — they're classic scripts that share the global scope. `pages.js` calls functions defined in `app.js`, which uses the `api` object from `api.js`.

---

### public/js/api.js

**Purpose:** An abstraction layer (HTTP client) that encapsulates all API communication. Isolates fetch logic from UI code.

**Design Pattern:** This is a **Service class** — it encapsulates API communication behind clean method names. The rest of the app never constructs URLs or sets headers directly.

```javascript
class API {
  constructor() {
    this.token = localStorage.getItem('token');  // Restore token on page load
  }
```
When the page loads, the API class checks if there's a saved token. This enables "remember me" functionality — you stay logged in across browser sessions.

**`request()` — The Core Method:**
```javascript
  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }
```
Every API call goes through this method. It:
1. Constructs the fetch options (method, headers, body)
2. Sends the request to `/api/...`
3. Parses the JSON response
4. Throws an error if the HTTP status indicates failure (4xx, 5xx)

> **Error handling philosophy:** By throwing on non-2xx responses, the calling code can use try/catch to handle errors uniformly. The error message comes from the server's JSON response.

**Method Naming Convention:**
```javascript
  async login(email, password) { ... }
  async getProperties(params) { ... }
  async createBooking(bookingData) { ... }
  async updateBookingStatus(id, status) { ... }
```
Methods are named as actions: `getX`, `createX`, `updateX`, `deleteX`. Parameters match what the server expects.

**Singleton Instance:**
```javascript
const api = new API();
```
A single instance is created and available globally. All scripts share the same `api` object (and thus the same token state).

---

### public/js/app.js

**Purpose:** The application controller. Manages authentication state, client-side routing, modal dialogs, search, and utility functions.

#### State Management

```javascript
let currentUser = null;   // Holds the logged-in user object (or null)
let currentPage = 'home'; // Tracks which page is currently displayed
```
These module-level variables serve as the application's global state. In a framework like React, this would be managed by a state management library (Redux, Context). Here, it's simple variables.

#### Initialization

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();  // Try to restore session
  handleRoute();      // Render the correct page based on URL
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => { ... });
});
```
`DOMContentLoaded` fires when the HTML is fully parsed (but before images load). We first check if the user has a valid saved session, then render the page.

#### Client-Side Router

```javascript
function navigate(page, params = {}) {
  currentPage = page;
  window.history.pushState({ page, params }, '', `/${page === 'home' ? '' : page}${params.id ? '/' + params.id : ''}`);
  renderPage(page, params);
  window.scrollTo(0, 0);
}
```
`pushState` updates the browser URL WITHOUT triggering a page reload. This is the foundation of SPA routing:
- Changes the URL bar (so users can bookmark/share links)
- Doesn't make a new HTTP request
- Stores state in the history entry (for back/forward navigation)

```javascript
window.onpopstate = (event) => {
  if (event.state) {
    renderPage(event.state.page, event.state.params || {});
  } else {
    handleRoute();
  }
};
```
`onpopstate` fires when the user clicks browser back/forward buttons. We re-render the appropriate page from the stored state.

```javascript
function handleRoute() {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    renderPage('home');
  } else if (path.startsWith('/property/')) {
    const id = path.split('/')[2];
    renderPage('property', { id });
  } else {
    const page = path.substring(1).split('/')[0];
    renderPage(page);
  }
}
```
This handles the initial page load (or page refresh). It parses the current URL and renders the appropriate page. This works because the server's catch-all route always returns `index.html`, so the JavaScript takes over routing.

#### Authentication Handlers

```javascript
async function handleLogin(e) {
  e.preventDefault();  // Prevent form from doing a traditional submission
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await api.login(email, password);
    currentUser = data.user;
    updateNavForUser();
    closeAuthModal();
    showToast('Welcome back, ' + currentUser.firstName + '!', 'success');
    renderPage(currentPage);  // Re-render current page with auth context
  } catch (err) {
    errorEl.textContent = err.message;  // Show error in the form
  }
}
```
The `e.preventDefault()` is critical — without it, the browser would submit the form via a full page reload (traditional HTML form behavior). We want to handle it via JavaScript instead.

#### Toast Notifications

```javascript
function showToast(message, type = '') {
  // Create container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) { ... create it ... }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-..."></i> ${message}`;
  container.appendChild(toast);

  // Auto-remove after 3 seconds with fade animation
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);  // Remove from DOM after animation
  }, 3000);
}
```
A self-managing notification system. Each toast creates itself, displays for 3 seconds, animates out, then removes itself from the DOM. The double-setTimeout pattern: outer for the display duration, inner for the CSS transition duration.

#### Utility Functions

```javascript
function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(0);
}
```
Formats a number as currency. `toFixed(0)` rounds to zero decimal places (e.g., `189.50` → `$190`).

```javascript
function getAmenityIcon(amenity) {
  const icons = { 'WiFi': 'fas fa-wifi', 'Kitchen': 'fas fa-utensils', ... };
  return icons[amenity] || 'fas fa-check';  // Fallback to checkmark
}
```
Maps amenity names to Font Awesome icon classes. Uses fallback for unlisted amenities.

---

### public/js/pages.js

**Purpose:** Contains all page rendering functions. Each function generates HTML strings and inserts them into `#main-content`.

**This is the largest file (1056 lines)** because it contains the HTML templates for every page of the application.

**Pattern: Template Generation via String Interpolation**

```javascript
function renderPage(page, params = {}) {
  const main = document.getElementById('main-content');
  switch (page) {
    case 'home': renderHomePage(main, params); break;
    case 'property': renderPropertyPage(main, params); break;
    case 'trips': renderTripsPage(main); break;
    // ...
  }
}
```
A central dispatcher that routes to the correct render function based on the page name.

#### Home Page (`renderHomePage`)

1. **Renders static HTML** (hero section, category bar)
2. **Fetches properties** asynchronously from the API
3. **Generates property cards** using `createPropertyCard()` and injects into the grid

```javascript
container.innerHTML = `<div class="hero-section">...</div>...`;  // Step 1

const data = await api.getProperties(params);                     // Step 2
grid.innerHTML = data.properties.map(property => 
  createPropertyCard(property)
).join('');                                                        // Step 3
```

> **Performance note:** `.innerHTML = ...` replaces the entire DOM subtree at once. This is actually faster than creating elements one by one with `createElement` for large batches, because the browser only reflows once.

#### Property Detail Page (`renderPropertyPage`)

The most complex page. Renders:
- Image gallery
- Host information
- Highlights (self check-in, location, cancellation policy)
- Full description
- Amenities grid
- Reviews section
- **Booking card** (the sticky sidebar with date pickers and price calculation)

**Real-time Price Update:**
```javascript
function updateBookingTotal(pricePerNight) {
  const checkIn = document.getElementById('booking-checkin').value;
  const checkOut = document.getElementById('booking-checkout').value;
  // Calculate nights, subtotal, service fee, total
  // Update DOM with formatted prices
}
```
This runs every time the user changes a date input (`onchange` event). It dynamically recalculates and displays the booking total without a server round-trip.

#### Trips Page (`renderTripsPage`)

Shows the user's bookings with tabs for filtering by status. Each booking card includes:
- Property thumbnail and title
- Date range and guest count
- Status badge (colored based on state)
- Action buttons (Cancel for pending/confirmed, Leave Review for completed)

#### Favorites Page (`renderFavoritesPage`)

Fetches and displays saved properties using the same `createPropertyCard` function as the home page, ensuring visual consistency.

#### Messages Page (`renderMessagesPage`)

Implements a two-panel layout:
- **Left sidebar:** Conversation list (shows contacts, last message preview, unread indicator)
- **Right panel:** Active chat thread (bubbles, input field)

```javascript
let currentChatUserId = null;  // Tracks which conversation is open
```
Module-level state for the messaging page specifically.

#### Host Page (`renderHostPage`)

Lists the host's properties with a "New Listing" button. The create form includes:
- Basic info (title, description, type, price)
- Location (address, city, country)
- Capacity (guests, bedrooms, bathrooms, beds)
- Image URL
- Amenity checkboxes

#### Hosting Dashboard (`renderHostingPage`)

Shows booking requests from guests. Hosts can:
- View all requests with tabs (pending, confirmed, completed)
- **Accept** pending bookings (changes status to 'confirmed')
- **Decline** pending bookings (changes status to 'cancelled')

#### Profile Page (`renderProfilePage`)

Editable form for the user's own profile (name, phone, bio). Email is displayed but disabled (read-only).

---

### public/css/styles.css

**Purpose:** All application styles. Uses CSS Custom Properties (variables) for theming and consistency.

**Key Design System Elements:**

1. **CSS Variables** (defined on `:root`):
   - Colors: `--primary` (Airbnb red), `--gray-100` through `--gray-900`, `--success`, `--error`
   - Spacing: `--space-xs` through `--space-xl`
   - Border radius: `--radius-sm`, `--radius-md`, `--radius-lg`
   - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
   - Transitions: `--transition-fast`, `--transition-normal`

2. **Responsive Design:** Media queries adjust layouts for mobile/tablet/desktop.

3. **Component Styles:** Each UI component (cards, modals, buttons, forms) has its own section.

4. **Animation Classes:** Toast notifications, modal overlays, hover effects use CSS transitions.

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │────<│  properties  │>────│  reviews  │
│          │     │              │     │          │
│ id (PK)  │     │ id (PK)      │     │ id (PK)  │
│ email    │     │ hostId (FK)  │     │ propertyId│
│ password │     │ title        │     │ guestId   │
│ firstName│     │ type         │     │ bookingId │
│ lastName │     │ pricePerNight│     │ rating    │
│ isHost   │     │ city/country │     │ comment   │
│          │     │ amenities    │     └──────────┘
└──────────┘     │ rating (cache)│
      │          └──────────────┘
      │                │
      │          ┌─────┴──────┐
      │          │            │
      ▼          ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ bookings │  │ favorites │  │ messages │
│          │  │           │  │          │
│ id (PK)  │  │ userId    │  │ senderId │
│ propertyId│  │ propertyId│  │receiverId│
│ guestId  │  │ UNIQUE()  │  │ content  │
│ hostId   │  └───────────┘  │ isRead   │
│ status   │                  └──────────┘
│ totalPrice│
└──────────┘
```

### Relationships:
- **User → Properties:** One-to-Many (a host can have many properties)
- **User → Bookings (as guest):** One-to-Many
- **User → Bookings (as host):** One-to-Many
- **Property → Bookings:** One-to-Many
- **Property → Reviews:** One-to-Many
- **User ↔ Property (via Favorites):** Many-to-Many (junction table)
- **User ↔ User (via Messages):** Many-to-Many (self-referencing)
- **Booking → Review:** One-to-One

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/login` | No | Authenticate and get token |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Properties

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | Optional | List/search properties |
| GET | `/api/properties/:id` | Optional | Get single property with reviews |
| POST | `/api/properties` | Yes | Create new property |
| PUT | `/api/properties/:id` | Yes (owner) | Update property |
| DELETE | `/api/properties/:id` | Yes (owner) | Delete property |
| POST | `/api/properties/:id/favorite` | Yes | Toggle favorite |

**Query Parameters for GET /api/properties:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Full-text search (title, description, city, country) |
| city | string | Filter by city (case-insensitive exact match) |
| country | string | Filter by country |
| type | string | Property type (apartment, house, villa, cabin, etc.) |
| minPrice | number | Minimum price per night |
| maxPrice | number | Maximum price per night |
| guests | number | Minimum guest capacity |
| bedrooms | number | Minimum bedrooms |
| bathrooms | number | Minimum bathrooms |
| sort | string | Sorting: price_low, price_high, rating, newest |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 12) |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Yes | Create a booking |
| GET | `/api/bookings/my-trips` | Yes | Get user's bookings as guest |
| GET | `/api/bookings/hosting` | Yes | Get bookings for host's properties |
| GET | `/api/bookings/:id` | Yes | Get single booking details |
| PATCH | `/api/bookings/:id/status` | Yes | Update booking status |

**Booking Status Values:** `pending` → `confirmed` → `completed` (or `cancelled` at any point)

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | Yes | Create a review (requires completed booking) |
| GET | `/api/reviews/property/:propertyId` | No | Get reviews for a property (paginated) |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:id` | No | Get public user profile |
| PUT | `/api/users/profile` | Yes | Update own profile |
| GET | `/api/users/favorites/list` | Yes | Get user's favorited properties |
| GET | `/api/users/my/properties` | Yes | Get user's own properties |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/messages` | Yes | Send a message |
| GET | `/api/messages/conversations` | Yes | Get conversation list |
| GET | `/api/messages/conversation/:userId` | Yes | Get messages with a user |

---

## Authentication Flow

```
1. User fills login/register form
                │
                ▼
2. Frontend calls api.login(email, password)
                │
                ▼
3. api.js sends POST /api/auth/login with JSON body
                │
                ▼
4. Server validates credentials (bcrypt.compareSync)
                │
                ▼
5. Server creates JWT: jwt.sign({ id, email, isHost }, secret, { expiresIn: '7d' })
                │
                ▼
6. Server responds: { user: {...}, token: "eyJhbGciOi..." }
                │
                ▼
7. api.js stores token: localStorage.setItem('token', token)
                │
                ▼
8. app.js updates UI: currentUser = data.user; updateNavForUser()
                │
                ▼
9. Subsequent requests include: Authorization: Bearer eyJhbGciOi...
                │
                ▼
10. Server middleware (authenticate) verifies token and sets req.user
```

**Token Lifecycle:**
- Created on login/register
- Stored in localStorage (persists across browser sessions)
- Sent with every authenticated request via `Authorization` header
- Expires after 7 days (server rejects expired tokens with 403)
- Cleared on logout (`localStorage.removeItem('token')`)

**JWT Payload Structure:**
```json
{
  "id": 1,
  "email": "john@example.com",
  "isHost": 1,
  "iat": 1700000000,     // Issued at (auto-added)
  "exp": 1700604800      // Expires at (7 days later)
}
```

---

## Client-Side Routing

The application uses the **History API** for clean URL routing without page reloads.

### How it Works:

1. **User clicks a link** — e.g., "My Trips"
   ```html
   <a href="#" onclick="navigate('trips'); return false;">My Trips</a>
   ```
   `return false` prevents the default link behavior (navigation).

2. **`navigate()` is called:**
   ```javascript
   function navigate(page, params = {}) {
     window.history.pushState({ page, params }, '', '/trips');
     renderPage(page, params);
     window.scrollTo(0, 0);
   }
   ```
   - Updates the URL bar to `/trips`
   - Stores `{ page: 'trips' }` in the history stack
   - Calls `renderPage` to update the DOM

3. **Browser back/forward buttons:**
   ```javascript
   window.onpopstate = (event) => {
     renderPage(event.state.page, event.state.params);
   };
   ```
   Retrieves the stored state and re-renders.

4. **Page refresh (F5):**
   - Browser requests `/trips` from the server
   - Server's catch-all route returns `index.html`
   - JavaScript boots up, `handleRoute()` parses the URL, renders the correct page

### URL ↔ Page Mapping:

| URL | Page | Function Called |
|-----|------|----------------|
| `/` | Home | `renderHomePage()` |
| `/property/5` | Property Detail | `renderPropertyPage({id: 5})` |
| `/trips` | My Trips | `renderTripsPage()` |
| `/favorites` | Wishlists | `renderFavoritesPage()` |
| `/messages` | Messages | `renderMessagesPage()` |
| `/host` | Manage Listings | `renderHostPage()` |
| `/hosting` | Hosting Dashboard | `renderHostingPage()` |
| `/profile` | Profile | `renderProfilePage()` |

---

## Data Flow & Architecture Patterns

### Request Lifecycle (Example: Creating a Booking)

```
User clicks "Reserve"
        │
        ▼
handleBooking() in pages.js
  ├── Validates dates are selected
  ├── Calls api.createBooking({ propertyId, checkIn, checkOut, guests })
  │
  ▼
API.request('POST', '/bookings', body) in api.js
  ├── Constructs fetch options with headers + JSON body
  ├── Sends HTTP request
  │
  ▼
Express receives POST /api/bookings
  ├── cors middleware (adds headers)
  ├── express.json() (parses body → req.body)
  ├── authenticate middleware (verifies JWT → req.user)
  │
  ▼
Route handler in routes/bookings.js
  ├── Validates input
  ├── Checks property exists (queryOne)
  ├── Checks availability (queryOne for conflicts)
  ├── Calculates price (nights × rate + 12% fee)
  ├── Inserts booking (runSql)
  │     ├── db.run(INSERT...)
  │     ├── Gets last_insert_rowid
  │     └── saveDatabase() → writes to disk
  ├── Fetches created booking with JOINs (queryOne)
  └── Responds: 201 { booking object }
        │
        ▼
api.js receives response
  ├── Parses JSON
  ├── Checks response.ok (201 = ok)
  └── Returns data to caller
        │
        ▼
handleBooking() continues
  ├── showToast('Booking request sent!', 'success')
  └── navigate('trips')  → renders trips page with new booking
```

### Error Handling Strategy

**Backend:** Every route handler is wrapped in try/catch. Errors are logged server-side and a generic message is returned to the client.

```javascript
try {
  // ... business logic ...
} catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Failed to create booking' });
}
```

**Frontend:** API calls use try/catch with toast notifications for user feedback.

```javascript
try {
  await api.createBooking(data);
  showToast('Success!', 'success');
} catch (err) {
  showToast(err.message, 'error');  // err.message comes from server's error response
}
```

### State Synchronization

The frontend maintains minimal state:
- `currentUser` — The logged-in user object (or null)
- `currentPage` — Which page is displayed
- `currentChatUserId` — Active conversation

All other data is fetched fresh from the server when a page renders. This means:
- ✅ Data is always up-to-date
- ✅ No complex state management needed
- ❌ Every page navigation makes API calls (acceptable for this scale)

---

## Running the Application

### Prerequisites
- Node.js 16+ installed
- npm (comes with Node.js)

### Setup
```bash
# Install dependencies
npm install

# Seed the database with demo data
npm run seed

# Start the server
npm start

# Or for development (auto-restart on changes)
npm run dev
```

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| john@example.com | password123 | Host (4 properties) |
| sarah@example.com | password123 | Host (3 properties) |
| maria@example.com | password123 | Host (2 properties) |
| david@example.com | password123 | Host (2 properties) |
| emma@example.com | password123 | Host (2 properties) |
| guest@example.com | password123 | Guest (has bookings & favorites) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | HTTP server port |
| JWT_SECRET | 'your-secret-key-change-in-production' | JWT signing secret |

---

## Key Concepts for Junior Developers

### 1. Why We Use Middleware
Middleware is code that runs BETWEEN receiving a request and sending a response. Think of it as a pipeline of processing steps. Each middleware can:
- Read/modify the request
- Read/modify the response
- Stop the pipeline (by NOT calling `next()`)
- Pass control to the next middleware (by calling `next()`)

### 2. Why Passwords Are Hashed
We never store the actual password. `bcrypt.hashSync('password123', 10)` might produce `$2a$10$X7fJ8k...` — a one-way transformation. To verify a login, we hash the input and compare hashes. If our database is compromised, attackers get useless hashes instead of passwords.

### 3. Why JWTs
A JWT (JSON Web Token) is a self-contained token that proves "this user is authenticated." The server signs it with a secret key. On subsequent requests, the server verifies the signature. This is **stateless** — the server doesn't need to store session data in a database or in memory.

### 4. Why SPAs Use a Catch-All Route
When you navigate to `/trips` in a traditional website, the browser requests that path from the server. But our server only has `index.html` — there's no `trips.html`. The catch-all route (`app.get('*', ...)`) returns `index.html` for ALL paths, letting JavaScript handle the routing.

### 5. Why SQL Parameterization
```javascript
// ❌ DANGEROUS (SQL Injection vulnerable):
db.run(`SELECT * FROM users WHERE email = '${email}'`);
// If email = "'; DROP TABLE users; --" → disaster

// ✅ SAFE (parameterized):
db.run('SELECT * FROM users WHERE email = ?', [email]);
// The ? placeholder escapes special characters
```

### 6. Why We Parse JSON Fields
SQLite doesn't have an ARRAY or JSON column type. We store arrays as JSON strings (`'["WiFi","Pool"]'`). When reading from the DB, we call `JSON.parse()` to convert them back to JavaScript arrays that the frontend can iterate over.

---

*This documentation was generated for the StayBooker Booking Web Application v1.0.0*
