const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all properties with filtering/search
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      city, country, type, minPrice, maxPrice,
      guests, bedrooms, bathrooms,
      search, sort, page = 1, limit = 12
    } = req.query;

    let query = 'SELECT p.*, u.firstName as hostFirstName, u.lastName as hostLastName, u.avatar as hostAvatar FROM properties p JOIN users u ON p.hostId = u.id WHERE p.isActive = 1';
    const params = [];

    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.city LIKE ? OR p.country LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (city) {
      query += ' AND LOWER(p.city) = LOWER(?)';
      params.push(city);
    }

    if (country) {
      query += ' AND LOWER(p.country) = LOWER(?)';
      params.push(country);
    }

    if (type) {
      query += ' AND p.type = ?';
      params.push(type);
    }

    if (minPrice) {
      query += ' AND p.pricePerNight >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ' AND p.pricePerNight <= ?';
      params.push(Number(maxPrice));
    }

    if (guests) {
      query += ' AND p.maxGuests >= ?';
      params.push(Number(guests));
    }

    if (bedrooms) {
      query += ' AND p.bedrooms >= ?';
      params.push(Number(bedrooms));
    }

    if (bathrooms) {
      query += ' AND p.bathrooms >= ?';
      params.push(Number(bathrooms));
    }

    // Count total results
    const countQuery = query.replace('SELECT p.*, u.firstName as hostFirstName, u.lastName as hostLastName, u.avatar as hostAvatar', 'SELECT COUNT(*) as total');
    const countResult = queryOne(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Sorting
    switch (sort) {
      case 'price_low':
        query += ' ORDER BY p.pricePerNight ASC';
        break;
      case 'price_high':
        query += ' ORDER BY p.pricePerNight DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating DESC';
        break;
      case 'newest':
        query += ' ORDER BY p.createdAt DESC';
        break;
      default:
        query += ' ORDER BY p.rating DESC, p.reviewCount DESC';
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const properties = queryAll(query, params);

    // Parse JSON fields
    const parsed = properties.map(p => ({
      ...p,
      amenities: JSON.parse(p.amenities || '[]'),
      images: JSON.parse(p.images || '[]')
    }));

    res.json({
      properties: parsed,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const property = queryOne(`
      SELECT p.*, u.firstName as hostFirstName, u.lastName as hostLastName, u.avatar as hostAvatar, u.bio as hostBio, u.createdAt as hostSince
      FROM properties p
      JOIN users u ON p.hostId = u.id
      WHERE p.id = ?
    `, [Number(req.params.id)]);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get reviews for this property
    const reviews = queryAll(`
      SELECT r.*, u.firstName, u.lastName, u.avatar
      FROM reviews r
      JOIN users u ON r.guestId = u.id
      WHERE r.propertyId = ?
      ORDER BY r.createdAt DESC
      LIMIT 10
    `, [Number(req.params.id)]);

    // Check if favorited by current user
    let isFavorited = false;
    if (req.user) {
      const fav = queryOne('SELECT id FROM favorites WHERE userId = ? AND propertyId = ?', [req.user.id, Number(req.params.id)]);
      isFavorited = !!fav;
    }

    // Get booked dates
    const bookings = queryAll(`
      SELECT checkIn, checkOut FROM bookings
      WHERE propertyId = ? AND status IN ('confirmed', 'pending')
      AND checkOut >= date('now')
    `, [Number(req.params.id)]);

    res.json({
      ...property,
      amenities: JSON.parse(property.amenities || '[]'),
      images: JSON.parse(property.images || '[]'),
      reviews,
      isFavorited,
      bookedDates: bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property (host only)
router.post('/', authenticate, (req, res) => {
  try {
    const {
      title, description, type, pricePerNight, address, city, country,
      latitude, longitude, maxGuests, bedrooms, bathrooms, beds, amenities, images, thumbnail
    } = req.body;

    if (!title || !description || !type || !pricePerNight || !address || !city || !country) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Make user a host if not already
    runSql('UPDATE users SET isHost = 1 WHERE id = ?', [req.user.id]);

    const result = runSql(`
      INSERT INTO properties (hostId, title, description, type, pricePerNight, address, city, country, latitude, longitude, maxGuests, bedrooms, bathrooms, beds, amenities, images, thumbnail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, title, description, type, pricePerNight, address, city, country,
      latitude || null, longitude || null, maxGuests || 2, bedrooms || 1, bathrooms || 1, beds || 1,
      JSON.stringify(amenities || []), JSON.stringify(images || []), thumbnail || '/images/default-property.jpg'
    ]);

    const property = queryOne('SELECT * FROM properties WHERE id = ?', [result.lastId]);
    res.status(201).json({ ...property, amenities: JSON.parse(property.amenities), images: JSON.parse(property.images) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
router.put('/:id', authenticate, (req, res) => {
  try {
    const property = queryOne('SELECT * FROM properties WHERE id = ?', [Number(req.params.id)]);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.hostId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const {
      title, description, type, pricePerNight, address, city, country,
      latitude, longitude, maxGuests, bedrooms, bathrooms, beds, amenities, images, thumbnail, isActive
    } = req.body;

    runSql(`
      UPDATE properties SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        pricePerNight = COALESCE(?, pricePerNight),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        maxGuests = COALESCE(?, maxGuests),
        bedrooms = COALESCE(?, bedrooms),
        bathrooms = COALESCE(?, bathrooms),
        beds = COALESCE(?, beds),
        amenities = COALESCE(?, amenities),
        images = COALESCE(?, images),
        thumbnail = COALESCE(?, thumbnail),
        isActive = COALESCE(?, isActive),
        updatedAt = datetime('now')
      WHERE id = ?
    `, [
      title || null, description || null, type || null, pricePerNight || null,
      address || null, city || null, country || null, latitude || null, longitude || null,
      maxGuests || null, bedrooms || null, bathrooms || null, beds || null,
      amenities ? JSON.stringify(amenities) : null, images ? JSON.stringify(images) : null,
      thumbnail || null, isActive !== undefined ? (isActive ? 1 : 0) : null, Number(req.params.id)
    ]);

    const updated = queryOne('SELECT * FROM properties WHERE id = ?', [Number(req.params.id)]);
    res.json({ ...updated, amenities: JSON.parse(updated.amenities), images: JSON.parse(updated.images) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
router.delete('/:id', authenticate, (req, res) => {
  try {
    const property = queryOne('SELECT * FROM properties WHERE id = ?', [Number(req.params.id)]);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.hostId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    runSql('DELETE FROM properties WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticate, (req, res) => {
  try {
    const existing = queryOne('SELECT id FROM favorites WHERE userId = ? AND propertyId = ?', [req.user.id, Number(req.params.id)]);
    
    if (existing) {
      runSql('DELETE FROM favorites WHERE id = ?', [existing.id]);
      res.json({ isFavorited: false });
    } else {
      runSql('INSERT INTO favorites (userId, propertyId) VALUES (?, ?)', [req.user.id, Number(req.params.id)]);
      res.json({ isFavorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;
