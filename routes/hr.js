const express = require('express');
const path = require('path');
const { requireRole } = require('../middleware/auth');
const Student = require('../models/Student');
const HR = require('../models/HR');

const router = express.Router();

// HR dashboard (protected route)
router.get('/dashboard', requireRole('hr'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/hr-dashboard.html'));
});

// API route to get HR profile
router.get('/profile', requireRole('hr'), async (req, res) => {
    try {
        const hr = await HR.findById(req.session.user.id);
        if (!hr) {
            return res.status(404).json({
                success: false,
                message: 'HR profile not found'
            });
        }

        res.json({
            success: true,
            user: req.session.user,
            profile: hr.toJSONSafe(),
            profileCompleted: hr.checkProfileCompletion()
        });
    } catch (error) {
        console.error('Error fetching HR profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile data'
        });
    }
});

// API route to update HR profile
router.put('/profile', requireRole('hr'), async (req, res) => {
    try {
        const hrId = req.session.user.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated via this route
        delete updateData.password;
        delete updateData.email;
        delete updateData.role;
        delete updateData.createdAt;

        const hr = await HR.findByIdAndUpdate(
            hrId,
            { ...updateData, updatedAt: new Date() },
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        );

        if (!hr) {
            return res.status(404).json({
                success: false,
                message: 'HR profile not found'
            });
        }

        // Check and update profile completion status
        hr.checkProfileCompletion();
        await hr.save();

        // Update session data if company name changed
        if (updateData.companyName) {
            req.session.user.companyName = updateData.companyName;
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: hr.toJSONSafe(),
            profileCompleted: hr.profileCompleted
        });

    } catch (error) {
        console.error('Error updating HR profile:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// API route to get all students with advanced filtering
router.get('/students', requireRole('hr'), async (req, res) => {
    try {
        const {
            skills,
            location,
            degree,
            fieldOfStudy,
            graduationYear,
            availability,
            experienceMin,
            experienceMax,
            gpaMin,
            gpaMax,
            searchTerm,
            page = 1,
            limit = 10
        } = req.query;

        // Build the filter query
        let query = {};
        
        // Skills filter (case-insensitive, partial match)
        if (skills && skills.trim()) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            query.skills = { 
                $in: skillsArray.map(skill => new RegExp(skill, 'i'))
            };
        }
        
        // Location filter (city, state, or country - case-insensitive)
        if (location && location.trim()) {
            query.$or = [
                { 'location.city': new RegExp(location, 'i') },
                { 'location.state': new RegExp(location, 'i') },
                { 'location.country': new RegExp(location, 'i') }
            ];
        }
        
        // Education filters
        if (degree && degree.trim()) {
            query['education.degree'] = new RegExp(degree, 'i');
        }
        
        if (fieldOfStudy && fieldOfStudy.trim()) {
            query['education.fieldOfStudy'] = new RegExp(fieldOfStudy, 'i');
        }
        
        if (graduationYear) {
            query['education.graduationYear'] = parseInt(graduationYear);
        }
        
        // Availability filter
        if (availability && availability.trim()) {
            query.availability = availability;
        }
        
        // Experience range filter
        if (experienceMin !== undefined || experienceMax !== undefined) {
            query['experience.yearsOfExperience'] = {};
            if (experienceMin !== undefined) {
                query['experience.yearsOfExperience'].$gte = parseInt(experienceMin);
            }
            if (experienceMax !== undefined) {
                query['experience.yearsOfExperience'].$lte = parseInt(experienceMax);
            }
        }
        
        // GPA range filter
        if (gpaMin !== undefined || gpaMax !== undefined) {
            query['education.gpa'] = {};
            if (gpaMin !== undefined) {
                query['education.gpa'].$gte = parseFloat(gpaMin);
            }
            if (gpaMax !== undefined) {
                query['education.gpa'].$lte = parseFloat(gpaMax);
            }
        }
        
        // Text search filter (name or email)
        if (searchTerm && searchTerm.trim()) {
            query.$text = { $search: searchTerm };
        }

        // Execute the query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const students = await Student.find(query)
            .select('-password')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalStudents = await Student.countDocuments(query);
        const totalPages = Math.ceil(totalStudents / parseInt(limit));

        // Save search to HR's history
        const hr = await HR.findById(req.session.user.id);
        if (hr) {
            const searchFilters = {
                skills: skills || null,
                location: location || null,
                degree: degree || null,
                fieldOfStudy: fieldOfStudy || null,
                graduationYear: graduationYear ? parseInt(graduationYear) : null,
                availability: availability || null,
                experienceRange: {
                    min: experienceMin ? parseInt(experienceMin) : null,
                    max: experienceMax ? parseInt(experienceMax) : null
                },
                gpaRange: {
                    min: gpaMin ? parseFloat(gpaMin) : null,
                    max: gpaMax ? parseFloat(gpaMax) : null
                },
                searchTerm: searchTerm || null
            };
            await hr.addSearchToHistory(searchFilters, totalStudents);
        }

        res.json({
            success: true,
            user: req.session.user,
            students: students,
            totalStudents: totalStudents,
            currentPage: parseInt(page),
            totalPages: totalPages,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            filters: {
                skills, location, degree, fieldOfStudy, graduationYear,
                availability, experienceMin, experienceMax, gpaMin, gpaMax, searchTerm
            }
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student data'
        });
    }
});

// API route to get student details by ID
router.get('/students/:id', requireRole('hr'), async (req, res) => {
    try {
        const studentId = req.params.id;
        const student = await Student.findById(studentId).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            student: student
        });

    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student details'
        });
    }
});

// API route to get search statistics
router.get('/statistics', requireRole('hr'), async (req, res) => {
    try {
        // Get total students count
        const totalStudents = await Student.countDocuments();
        
        // Get students by availability
        const availabilityStats = await Student.aggregate([
            { $group: { _id: '$availability', count: { $sum: 1 } } }
        ]);
        
        // Get students by degree
        const degreeStats = await Student.aggregate([
            { $group: { _id: '$education.degree', count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } }
        ]);
        
        // Get students by experience range
        const experienceStats = await Student.aggregate([
            {
                $bucket: {
                    groupBy: '$experience.yearsOfExperience',
                    boundaries: [0, 1, 3, 5, 10, 100],
                    default: 'No Experience',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        
        // Get top skills
        const skillsStats = await Student.aggregate([
            { $unwind: '$skills' },
            { $group: { _id: '$skills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = await Student.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            statistics: {
                totalStudents,
                recentRegistrations,
                availabilityStats,
                degreeStats,
                experienceStats,
                skillsStats
            }
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// API route to get search suggestions (for autocomplete)
router.get('/suggestions', requireRole('hr'), async (req, res) => {
    try {
        const { type } = req.query;
        let suggestions = [];

        switch (type) {
            case 'skills':
                const skills = await Student.aggregate([
                    { $unwind: '$skills' },
                    { $group: { _id: '$skills', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 20 },
                    { $project: { _id: 1 } }
                ]);
                suggestions = skills.map(skill => skill._id);
                break;

            case 'locations':
                const locations = await Student.aggregate([
                    {
                        $project: {
                            locations: [
                                '$location.city',
                                '$location.state',
                                '$location.country'
                            ]
                        }
                    },
                    { $unwind: '$locations' },
                    { $match: { locations: { $ne: null, $ne: '' } } },
                    { $group: { _id: '$locations', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 20 },
                    { $project: { _id: 1 } }
                ]);
                suggestions = locations.map(location => location._id);
                break;

            case 'degrees':
                const degrees = await Student.distinct('education.degree', {
                    'education.degree': { $ne: null, $ne: '' }
                });
                suggestions = degrees;
                break;

            case 'fieldOfStudy':
                const fields = await Student.distinct('education.fieldOfStudy', {
                    'education.fieldOfStudy': { $ne: null, $ne: '' }
                });
                suggestions = fields;
                break;

            case 'universities':
                const universities = await Student.distinct('education.university', {
                    'education.university': { $ne: null, $ne: '' }
                });
                suggestions = universities;
                break;

            default:
                suggestions = [];
        }

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching suggestions'
        });
    }
});

module.exports = router;