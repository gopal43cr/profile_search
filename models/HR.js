// Save this as models/HR.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hrSchema = new mongoose.Schema({
    // Basic Auth Info
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        default: 'hr',
        immutable: true
    },
    
    // HR Profile Information
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        minlength: [2, 'Company name must be at least 2 characters long']
    },
    
    jobTitle: {
        type: String,
        trim: true,
        default: 'HR Manager'
    },
    
    department: {
        type: String,
        trim: true,
        default: 'Human Resources'
    },
    
    // Search preferences (optional - for saving frequently used filters)
    searchPreferences: {
        preferredSkills: [{ type: String, trim: true }],
        preferredLocations: [{ type: String, trim: true }],
        preferredDegrees: [{ type: String, trim: true }],
        preferredExperienceRange: {
            min: { type: Number, min: 0 },
            max: { type: Number, min: 0 }
        }
    },
    
    // Activity tracking
    lastLogin: {
        type: Date,
        default: Date.now
    },
    
    searchHistory: [{
        filters: {
            skills: [String],
            location: String,
            degree: String,
            fieldOfStudy: String,
            graduationYear: Number,
            availability: String,
            experienceRange: {
                min: Number,
                max: Number
            },
            gpaRange: {
                min: Number,
                max: Number
            },
            searchTerm: String
        },
        searchDate: {
            type: Date,
            default: Date.now
        },
        resultsCount: Number
    }],
    
    profileCompleted: {
        type: Boolean,
        default: false
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
hrSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        this.updatedAt = new Date();
        return next();
    }
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        this.updatedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Update timestamp on save
hrSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Update last login
hrSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Compare password method
hrSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if profile is complete
hrSchema.methods.checkProfileCompletion = function() {
    const required = [
        this.name,
        this.email,
        this.companyName
    ];
    
    this.profileCompleted = required.every(field => Boolean(field));
    return this.profileCompleted;
};

// Add search to history
hrSchema.methods.addSearchToHistory = function(filters, resultsCount) {
    // Limit search history to last 50 searches
    if (this.searchHistory.length >= 50) {
        this.searchHistory = this.searchHistory.slice(-49);
    }
    
    this.searchHistory.push({
        filters: filters,
        searchDate: new Date(),
        resultsCount: resultsCount
    });
    
    return this.save();
};

// Remove password from JSON output
hrSchema.methods.toJSON = function() {
    const hrObject = this.toObject();
    delete hrObject.password;
    return hrObject;
};

// Limit search history in JSON output
hrSchema.methods.toJSONSafe = function() {
    const hrObject = this.toObject();
    delete hrObject.password;
    delete hrObject.searchHistory; // Remove search history from general responses
    return hrObject;
};

module.exports = mongoose.model('HR', hrSchema);