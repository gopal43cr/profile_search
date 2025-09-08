const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const hrRoutes = require('./routes/hr');

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static('views'));
app.use('/css', express.static('css'));
app.use('/scripts', express.static('scripts'));

// Routes
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/hr', hrRoutes);

// Root route - redirect to login
app.get('/', (req, res) => {
    if (req.session.user) {
        // Redirect based on role
        if (req.session.user.role === 'student') {
            return res.redirect('/student/dashboard');
        } else if (req.session.user.role === 'hr') {
            return res.redirect('/hr/dashboard');
        }
    }
    res.redirect('/auth/login');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});