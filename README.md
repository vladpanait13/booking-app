# StayBooker - Booking Web Application

An Airbnb-like booking web application built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

### For Guests
- **Browse Properties** - Search and filter properties by location, type, price, guests, and more
- **Property Details** - View detailed property pages with photos, amenities, host info, and reviews
- **Book Properties** - Select dates, choose guests, and make booking requests
- **My Trips** - View all your bookings with status tracking (pending, confirmed, completed, cancelled)
- **Wishlist** - Save your favorite properties for later
- **Reviews** - Leave reviews for completed stays
- **Messages** - Communicate with hosts directly

### For Hosts
- **Create Listings** - List your property with detailed descriptions, amenities, and pricing
- **Manage Listings** - View and manage all your active properties
- **Hosting Dashboard** - Accept or decline booking requests
- **Messaging** - Respond to guest inquiries

### General Features
- **User Authentication** - Register and login with JWT-based auth
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Search & Filters** - Advanced search with multiple filter options
- **Category Browsing** - Filter by property type (apartment, house, villa, cabin, etc.)
- **Rating System** - 5-star ratings with sub-categories (cleanliness, communication, location, value)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Frontend**: Vanilla HTML/CSS/JavaScript (SPA architecture)
- **Styling**: Custom CSS with CSS variables, responsive grid layout

## Getting Started

### Prerequisites
- Node.js (v16 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Seed the database with sample data:
```bash
npm run seed
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Development Mode
```bash
npm run dev
```

## Demo Accounts

After seeding the database, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Host | john@example.com | password123 |
| Host | sarah@example.com | password123 |
| Host | maria@example.com | password123 |
| Guest | guest@example.com | password123 |

## Project Structure

```
booking-web-app/
├── server.js            # Express server entry point
├── database.js          # SQLite database setup & schema
├── seed.js              # Database seeding script
├── package.json
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── routes/
│   ├── auth.js          # Login, register, session
│   ├── properties.js    # CRUD for properties, favorites
│   ├── bookings.js      # Booking management
│   ├── reviews.js       # Review system
│   ├── users.js         # User profiles, favorites
│   └── messages.js      # Messaging system
└── public/
    ├── index.html       # Main SPA entry point
    ├── css/
    │   └── styles.css   # Complete application styles
    └── js/
        ├── api.js       # API client helper
        ├── app.js       # Main application controller
        └── pages.js     # Page rendering functions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties (with search/filter)
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (auth required)
- `PUT /api/properties/:id` - Update property (owner only)
- `DELETE /api/properties/:id` - Delete property (owner only)
- `POST /api/properties/:id/favorite` - Toggle favorite

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-trips` - Get guest's bookings
- `GET /api/bookings/hosting` - Get host's bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update booking status

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/property/:id` - Get property reviews

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/favorites/list` - Get user's favorites
- `GET /api/users/my/properties` - Get user's listings

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/conversation/:userId` - Get conversation messages

## Production Readiness Roadmap

This application is a fully functional prototype with all core user flows working (browse, search, book, review, message, host). Below is what's needed to make it a production-grade application:

### 1. Security Hardening (Critical)
- **Environment variables** — Move `JWT_SECRET` and other secrets to `.env` (use `dotenv`)
- **HTTPS** — Deploy behind a reverse proxy (Nginx/Caddy) with TLS certificates
- **Rate limiting** — Add `express-rate-limit` to prevent brute-force/DDoS
- **Helmet.js** — Add security headers (`helmet` middleware)
- **Input validation** — Add proper validation library (Joi/Zod) for all inputs
- **CSRF protection** — For cookie-based auth
- **Password reset flow** — Email-based reset with token expiry
- **2FA / OAuth** — Social login (Google, Facebook, Apple)

### 2. Database (Critical)
- **PostgreSQL or MySQL** — Replace SQLite with a production database (SQLite doesn't scale for concurrent writes)
- **Migrations system** — Use Knex.js or Prisma for schema management
- **Connection pooling** — For handling concurrent connections
- **Backup strategy** — Automated daily backups

### 3. Payment Processing (Critical)
- **Stripe/PayPal integration** — Handle real payments, refunds, payouts to hosts
- **Escrow system** — Hold payment until check-in
- **Payout management** — Automated host payouts after checkout
- **Tax calculation** — Depending on region
- **Invoice generation**

### 4. File Storage & Media
- **Cloud storage** — Upload images to AWS S3/Cloudinary instead of local disk
- **Image optimization** — Resize, compress, generate thumbnails
- **CDN** — Serve static assets via CloudFront/Cloudflare

### 5. Email & Notifications
- **Transactional emails** — SendGrid/Mailgun for booking confirmations, reminders
- **Push notifications** — Browser and mobile
- **SMS notifications** — Twilio for critical alerts
- **In-app real-time notifications** — WebSocket (Socket.io)

### 6. Real-time Features
- **WebSocket messaging** — Real-time chat instead of polling
- **Live availability updates** — Prevent double bookings
- **Real-time notifications**

### 7. Search & Discovery
- **ElasticSearch/Algolia** — Full-text search with autocomplete
- **Geolocation search** — "Nearby" properties using PostGIS
- **Map integration** — Google Maps/Mapbox for property locations
- **Calendar availability widget** — Visual date picker with booked dates blocked

### 8. DevOps & Infrastructure
- **Docker** — Containerize the app
- **CI/CD pipeline** — GitHub Actions / GitLab CI for automated testing & deployment
- **Load balancer** — For high availability
- **Monitoring** — APM tools (Datadog, New Relic, or Prometheus + Grafana)
- **Error tracking** — Sentry for production error monitoring
- **Logging** — Structured logging (Winston/Pino) with log aggregation (ELK stack)

### 9. Testing
- **Unit tests** — Jest for backend logic
- **Integration tests** — Supertest for API routes
- **E2E tests** — Playwright/Cypress for frontend flows
- **Load tests** — k6 or Artillery for performance benchmarks

### 10. Legal & Compliance
- **Terms of Service & Privacy Policy**
- **GDPR compliance** — Data export, right to deletion
- **Cookie consent** banner
- **KYC/AML** — Identity verification for hosts
- **Content moderation** — Review flagging, property verification

### 11. Advanced Features
- **Calendar management** — Host availability calendar, iCal sync
- **Dynamic pricing** — Weekend/seasonal rates, discounts for longer stays
- **Multi-language (i18n)** — Internationalization
- **Multi-currency** — Price conversion
- **Reviews for guests** — Two-way review system
- **Cancellation policies** — Flexible/moderate/strict with automated refund tiers
- **Host verification badges** — Superhost program
- **Admin dashboard** — Content moderation, user management, analytics
- **Analytics** — Revenue reports for hosts, platform metrics
- **Mobile app** — React Native / Flutter companion app
- **SEO optimization** — Server-side rendering or static generation
- **Accessibility (WCAG)** — Screen reader support, keyboard navigation

### 12. Performance
- **Caching** — Redis for sessions, frequently accessed data
- **Pagination optimization** — Cursor-based pagination for large datasets
- **Image lazy loading** — Already partially done, ensure complete
- **Service worker** — Offline support / PWA capabilities
- **Code splitting** — Bundle optimization if migrating to React/Vue/Next.js

### Priority Order for Production Launch
1. Switch to PostgreSQL + Stripe payments
2. Add HTTPS, rate limiting, Helmet, input validation
3. Cloud file storage (S3) + email service
4. Real-time messaging (Socket.io)
5. Map integration + calendar widget
6. Testing suite + CI/CD
7. Admin panel + monitoring

## License

MIT
