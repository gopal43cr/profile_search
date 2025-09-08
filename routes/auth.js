const express = require('express');
const path = require('path');
const User = require('../models/User');

const router = express.Router();

// Show login/signup page
router.get('/login', (req, res) => {
    // If already logged in, redirect to appropriate dashboard
    if (req.session.user) {
        if (req.session.user.role === 'student') {
            return res.redirect('/student/dashboard');
        } else if (req.session.user.role === 'hr') {
            return res.redirect('/hr/dashboard');
        }
    }
    res.sendFile(path.join(__dirname, '../views/auth.html'));
});

// Handle signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Create new user
        const user = new User({ name, email, password, role });
        await user.save();
        
        // Store user in session (without password)
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        // Return success response
        res.json({
            success: true,
            message: 'Account created successfully!',
            redirectUrl: user.role === 'student' ? '/student/dashboard' : '/hr/dashboard'
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Handle login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Store user in session (without password)
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        // Return success response
        res.json({
            success: true,
            message: 'Login successful!',
            redirectUrl: user.role === 'student' ? '/student/dashboard' : '/hr/dashboard'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// Handle logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Could not log out'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully',
            redirectUrl: '/auth/login'
        });
    });
});

module.exports = router;