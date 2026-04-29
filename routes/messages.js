const express = require('express');
const { queryAll, queryOne, runSql } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Send message
router.post('/', authenticate, (req, res) => {
  try {
    const { receiverId, bookingId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const result = runSql('INSERT INTO messages (senderId, receiverId, bookingId, content) VALUES (?, ?, ?, ?)',
      [req.user.id, receiverId, bookingId || null, content]);

    const message = queryOne(`
      SELECT m.*, u.firstName as senderFirstName, u.lastName as senderLastName, u.avatar as senderAvatar
      FROM messages m JOIN users u ON m.senderId = u.id WHERE m.id = ?
    `, [result.lastId]);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversations list
router.get('/conversations', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all unique users this user has messaged with
    const conversations = queryAll(`
      SELECT DISTINCT
        CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END as userId
      FROM messages m
      WHERE m.senderId = ? OR m.receiverId = ?
    `, [userId, userId, userId]);

    const result = conversations.map(conv => {
      const otherUser = queryOne('SELECT id, firstName, lastName, avatar FROM users WHERE id = ?', [conv.userId]);
      const lastMsg = queryOne(`
        SELECT content, createdAt FROM messages
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
        ORDER BY createdAt DESC LIMIT 1
      `, [userId, conv.userId, conv.userId, userId]);
      
      const unreadResult = queryOne(`
        SELECT COUNT(*) as count FROM messages
        WHERE senderId = ? AND receiverId = ? AND isRead = 0
      `, [conv.userId, userId]);

      return {
        userId: conv.userId,
        firstName: otherUser ? otherUser.firstName : 'Unknown',
        lastName: otherUser ? otherUser.lastName : '',
        avatar: otherUser ? otherUser.avatar : null,
        lastMessage: lastMsg ? lastMsg.content : '',
        lastMessageAt: lastMsg ? lastMsg.createdAt : '',
        unreadCount: unreadResult ? unreadResult.count : 0
      };
    });

    // Sort by last message time
    result.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages with a specific user
router.get('/conversation/:userId', authenticate, (req, res) => {
  try {
    const otherUserId = Number(req.params.userId);
    const messages = queryAll(`
      SELECT m.*, u.firstName as senderFirstName, u.lastName as senderLastName, u.avatar as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
      ORDER BY m.createdAt ASC
    `, [req.user.id, otherUserId, otherUserId, req.user.id]);

    // Mark messages as read
    runSql('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ?', [otherUserId, req.user.id]);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
