// Save this as models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
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
        default: 'student',
        immutable: true
    },
    
    // Profile Information
    location: {
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true }
    },
    
    education: {
        degree: { type: String, trim: true }, // e.g., "Bachelor's", "Master's", "PhD"
        fieldOfStudy: { type: String, trim: true }, // e.g., "Computer Science"
        university: { type: String, trim: true },
        graduationYear: { 
            type: Number,
            min: [1950, 'Invalid graduation year'],
            max: [new Date().getFullYear() + 10, 'Invalid graduation year']
        },
        gpa: { 
            type: Number,
            min: [0, 'GPA cannot be negative'],
            max: [10.0, 'GPA cannot exceed 10.0']
        }
    },
    
    skills: [{
        type: String,
        trim: true
    }],
    
    experience: {
        yearsOfExperience: {
            type: Number,
            min: [0, 'Experience cannot be negative'],
            default: 0
        },
        jobTitle: { type: String, trim: true },
        company: { type: String, trim: true },
        description: { type: String, trim: true }
    },
    
    professionalLinks: {
        linkedin: { 
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(v);
                },
                message: 'Please enter a valid LinkedIn URL'
            }
        },
        github: { 
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/.test(v);
                },
                message: 'Please enter a valid GitHub URL'
            }
        },
        portfolio: { 
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(v);
                },
                message: 'Please enter a valid portfolio URL'
            }
        }
    },
    
    resume: {
        fileName: { type: String },
        filePath: { type: String },
        uploadDate: { type: Date }
    },
    
    availability: {
        type: String,
        enum: ['immediate', '2-weeks', '1-month', '2-months', 'not-available'],
        default: 'immediate'
    },
    
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
studentSchema.pre('save', async function(next) {
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
studentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if profile is complete
studentSchema.methods.checkProfileCompletion = function() {
    const required = [
        this.name,
        this.email,
        this.location?.city,
        this.education?.degree,
        this.education?.fieldOfStudy,
        this.education?.university,
        this.skills?.length > 0
    ];
    
    this.profileCompleted = required.every(field => Boolean(field));
    return this.profileCompleted;
};

// Remove password from JSON output
studentSchema.methods.toJSON = function() {
    const studentObject = this.toObject();
    delete studentObject.password;
    return studentObject;
};

// Create indexes for search optimization
studentSchema.index({ 'education.degree': 1 });
studentSchema.index({ 'education.fieldOfStudy': 1 });
studentSchema.index({ 'education.graduationYear': 1 });
studentSchema.index({ 'education.gpa': 1 });
studentSchema.index({ 'location.city': 1, 'location.state': 1 });
studentSchema.index({ skills: 1 });
studentSchema.index({ availability: 1 });
studentSchema.index({ 'experience.yearsOfExperience': 1 });
studentSchema.index({ name: 'text', email: 'text' }); // Text search index

module.exports = mongoose.model('Student', studentSchema);