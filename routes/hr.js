const express = require('express');
const path = require('path');
const { requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// HR dashboard (protected route)
router.get('/dashboard', requireRole('hr'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/hr-dashboard.html'));
});

// API route to get all students (HR can view all students)
router.get('/students', requireRole('hr'), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json({
            success: true,
            user: req.session.user,
            students: students,
            totalStudents: students.length
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student data'
        });
    }
});

module.exports = router;