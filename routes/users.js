const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id, firstName, lastName, avatar, bio, isHost, createdAt FROM users WHERE id = ?', [Number(req.params.id)]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's listings if host
    let listings = [];
    if (user.isHost) {
      listings = queryAll('SELECT * FROM properties WHERE hostId = ? AND isActive = 1', [Number(req.params.id)]);
      listings = listings.map(p => ({ ...p, amenities: JSON.parse(p.amenities || '[]'), images: JSON.parse(p.images || '[]') }));
    }

    res.json({ ...user, listings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { firstName, lastName, phone, bio, avatar } = req.body;

    runSql(`
      UPDATE users SET
        firstName = COALESCE(?, firstName),
        lastName = COALESCE(?, lastName),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar),
        updatedAt = datetime('now')
      WHERE id = ?
    `, [firstName || null, lastName || null, phone || null, bio || null, avatar || null, req.user.id]);

    const user = queryOne('SELECT id, email, firstName, lastName, avatar, phone, bio, isHost, createdAt FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's favorites
router.get('/favorites/list', authenticate, (req, res) => {
  try {
    const favorites = queryAll(`
      SELECT p.*, u.firstName as hostFirstName, u.lastName as hostLastName
      FROM favorites f
      JOIN properties p ON f.propertyId = p.id
      JOIN users u ON p.hostId = u.id
      WHERE f.userId = ?
      ORDER BY f.createdAt DESC
    `, [req.user.id]);

    const parsed = favorites.map(p => ({ ...p, amenities: JSON.parse(p.amenities || '[]'), images: JSON.parse(p.images || '[]') }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get user's properties (as host)
router.get('/my/properties', authenticate, (req, res) => {
  try {
    const properties = queryAll('SELECT * FROM properties WHERE hostId = ? ORDER BY createdAt DESC', [req.user.id]);
    const parsed = properties.map(p => ({ ...p, amenities: JSON.parse(p.amenities || '[]'), images: JSON.parse(p.images || '[]') }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

module.exports = router;
