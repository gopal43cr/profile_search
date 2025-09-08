// ============= routes/student.js =============
const express = require('express');
const path = require('path');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Student dashboard (protected route)
router.get('/dashboard', requireRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/student-dashboard.html'));
});

// API route to get student data
router.get('/profile', requireRole('student'), (req, res) => {
    res.json({
        user: req.session.user,
        message: 'This is student profile data'
    });
});

module.exports = router;