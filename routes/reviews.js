const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create a review
router.post('/', authenticate, (req, res) => {
  try {
    const { propertyId, bookingId, rating, comment, cleanlinessRating, communicationRating, locationRating, valueRating } = req.body;

    if (!propertyId || !bookingId || !rating) {
      return res.status(400).json({ error: 'Property, booking and rating are required' });
    }

    // Verify booking exists and belongs to user
    const booking = queryOne('SELECT * FROM bookings WHERE id = ? AND guestId = ? AND status = ?', [bookingId, req.user.id, 'completed']);
    if (!booking) {
      return res.status(400).json({ error: 'You can only review completed bookings' });
    }

    // Check if already reviewed
    const existing = queryOne('SELECT id FROM reviews WHERE bookingId = ?', [bookingId]);
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this booking' });
    }

    const result = runSql(`
      INSERT INTO reviews (propertyId, guestId, bookingId, rating, comment, cleanlinessRating, communicationRating, locationRating, valueRating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [propertyId, req.user.id, bookingId, rating, comment || null, cleanlinessRating || null, communicationRating || null, locationRating || null, valueRating || null]);

    // Update property rating
    const stats = queryOne('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE propertyId = ?', [propertyId]);
    runSql('UPDATE properties SET rating = ?, reviewCount = ? WHERE id = ?', [
      Math.round((stats.avgRating || 0) * 10) / 10, stats.count || 0, propertyId
    ]);

    const review = queryOne('SELECT r.*, u.firstName, u.lastName, u.avatar FROM reviews r JOIN users u ON r.guestId = u.id WHERE r.id = ?', [result.lastId]);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get reviews for a property
router.get('/property/:propertyId', (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const reviews = queryAll(`
      SELECT r.*, u.firstName, u.lastName, u.avatar
      FROM reviews r
      JOIN users u ON r.guestId = u.id
      WHERE r.propertyId = ?
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `, [Number(req.params.propertyId), Number(limit), offset]);

    const countResult = queryOne('SELECT COUNT(*) as total FROM reviews WHERE propertyId = ?', [Number(req.params.propertyId)]);
    const total = countResult ? countResult.total : 0;

    res.json({ reviews, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
