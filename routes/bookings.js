const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create booking
router.post('/', authenticate, (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, guests, message } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Property, check-in and check-out dates are required' });
    }

    const property = queryOne('SELECT * FROM properties WHERE id = ? AND isActive = 1', [propertyId]);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.hostId === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own property' });
    }

    if (guests > property.maxGuests) {
      return res.status(400).json({ error: `Maximum ${property.maxGuests} guests allowed` });
    }

    // Check availability
    const conflict = queryOne(`
      SELECT id FROM bookings
      WHERE propertyId = ? AND status IN ('pending', 'confirmed')
      AND ((checkIn <= ? AND checkOut > ?) OR (checkIn < ? AND checkOut >= ?) OR (checkIn >= ? AND checkOut <= ?))
    `, [propertyId, checkIn, checkIn, checkOut, checkOut, checkIn, checkOut]);

    if (conflict) {
      return res.status(400).json({ error: 'Property is not available for these dates' });
    }

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    const subtotal = property.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.12 * 100) / 100;
    const totalPrice = subtotal + serviceFee;

    const result = runSql(`
      INSERT INTO bookings (propertyId, guestId, hostId, checkIn, checkOut, guests, totalPrice, serviceFee, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [propertyId, req.user.id, property.hostId, checkIn, checkOut, guests || 1, totalPrice, serviceFee, message || null]);

    const booking = queryOne(`
      SELECT b.*, p.title as propertyTitle, p.thumbnail as propertyThumbnail, p.city as propertyCity
      FROM bookings b
      JOIN properties p ON b.propertyId = p.id
      WHERE b.id = ?
    `, [result.lastId]);

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings (as guest)
router.get('/my-trips', authenticate, (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, p.title as propertyTitle, p.thumbnail as propertyThumbnail, p.city as propertyCity, p.country as propertyCountry,
             u.firstName as hostFirstName, u.lastName as hostLastName
      FROM bookings b
      JOIN properties p ON b.propertyId = p.id
      JOIN users u ON b.hostId = u.id
      WHERE b.guestId = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.checkIn DESC';

    const bookings = queryAll(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get host's bookings (as host)
router.get('/hosting', authenticate, (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, p.title as propertyTitle, p.thumbnail as propertyThumbnail,
             u.firstName as guestFirstName, u.lastName as guestLastName, u.avatar as guestAvatar
      FROM bookings b
      JOIN properties p ON b.propertyId = p.id
      JOIN users u ON b.guestId = u.id
      WHERE b.hostId = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.createdAt DESC';

    const bookings = queryAll(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch host bookings' });
  }
});

// Update booking status (host can confirm/cancel, guest can cancel)
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [Number(req.params.id)]);
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Host can confirm or cancel
    if (booking.hostId === req.user.id) {
      if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }
    // Guest can only cancel
    else if (booking.guestId === req.user.id) {
      if (status !== 'cancelled') {
        return res.status(400).json({ error: 'You can only cancel your booking' });
      }
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    runSql("UPDATE bookings SET status = ?, updatedAt = datetime('now') WHERE id = ?", [status, Number(req.params.id)]);
    
    const updated = queryOne(`
      SELECT b.*, p.title as propertyTitle, p.thumbnail as propertyThumbnail
      FROM bookings b JOIN properties p ON b.propertyId = p.id
      WHERE b.id = ?
    `, [Number(req.params.id)]);
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Get single booking
router.get('/:id', authenticate, (req, res) => {
  try {
    const booking = queryOne(`
      SELECT b.*, p.title as propertyTitle, p.thumbnail as propertyThumbnail, p.city as propertyCity, p.country as propertyCountry, p.address as propertyAddress,
             host.firstName as hostFirstName, host.lastName as hostLastName, host.avatar as hostAvatar,
             guest.firstName as guestFirstName, guest.lastName as guestLastName, guest.avatar as guestAvatar
      FROM bookings b
      JOIN properties p ON b.propertyId = p.id
      JOIN users host ON b.hostId = host.id
      JOIN users guest ON b.guestId = guest.id
      WHERE b.id = ?
    `, [Number(req.params.id)]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.guestId !== req.user.id && booking.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

module.exports = router;
