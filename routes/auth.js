const express = require('express');
const path = require('path');
const Student = require('../models/Student');
const HR = require('../models/HR');

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
        const { name, email, password, role, companyName } = req.body;
        
        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        // Validate company name for HR role
        if (role === 'hr' && !companyName) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required for HR role'
            });
        }
        
        // Check if user already exists in both collections
        const existingStudent = await Student.findOne({ email });
        const existingHR = await HR.findOne({ email });
        
        if (existingStudent || existingHR) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        let user;
        
        // Create user based on role
        if (role === 'student') {
            user = new Student({ name, email, password });
            await user.save();
        } else if (role === 'hr') {
            user = new HR({ name, email, password, companyName });
            await user.save();
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }
        
        // Store user in session (without password)
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ...(role === 'hr' && { companyName: user.companyName })
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
        
        // Find user in both collections
        let user = await Student.findOne({ email });
        let userType = 'student';
        
        if (!user) {
            user = await HR.findOne({ email });
            userType = 'hr';
        }
        
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
        
        // Update last login for HR users
        if (userType === 'hr') {
            await user.updateLastLogin();
        }
        
        // Store user in session (without password)
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            ...(userType === 'hr' && { companyName: user.companyName })
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