const express = require('express');
const path = require('path');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Student = require('../models/Student');

const router = express.Router();

// Student dashboard (protected route)
router.get('/dashboard', requireRole('student'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/student-dashboard.html'));
});

// API route to get student profile data
router.get('/profile', requireRole('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.session.user.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            user: req.session.user,
            profile: student,
            profileCompleted: student.checkProfileCompletion()
        });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile data'
        });
    }
});

// API route to update student profile
router.put('/profile', requireRole('student'), async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated via this route
        delete updateData.password;
        delete updateData.email;
        delete updateData.role;
        delete updateData.createdAt;

        const student = await Student.findByIdAndUpdate(
            studentId,
            { ...updateData, updatedAt: new Date() },
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check and update profile completion status
        student.checkProfileCompletion();
        await student.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: student,
            profileCompleted: student.profileCompleted
        });

    } catch (error) {
        console.error('Error updating student profile:', error);
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

// API route to get education details
router.get('/education', requireRole('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.session.user.id).select('education');
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            education: student.education || {}
        });
    } catch (error) {
        console.error('Error fetching education details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching education data'
        });
    }
});

// API route to update education details
router.put('/education', requireRole('student'), async (req, res) => {
    try {
        const studentId = req.session.user.id;
        console.log("studentId:", studentId);
        const { degree, fieldOfStudy, university, graduationYear, gpa } = req.body;

        const student = await Student.findByIdAndUpdate(
            studentId,
            {
                education: {
                    degree,
                    fieldOfStudy,
                    university,
                    graduationYear,
                    gpa
                },
                updatedAt: new Date()
            },
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check and update profile completion status
        student.checkProfileCompletion();
        await student.save();

        res.json({
            success: true,
            message: 'Education details updated successfully',
            education: student.education,
            profileCompleted: student.profileCompleted
        });

    } catch (error) {
        console.error('Error updating education details:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating education details'
        });
    }
});

// API route to get skills
router.get('/skills', requireRole('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.session.user.id).select('skills');
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            skills: student.skills || []
        });
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching skills data'
        });
    }
});

// API route to update skills
router.put('/skills', requireRole('student'), async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const { skills } = req.body;

        // Ensure skills is an array and clean up the data
        const cleanedSkills = Array.isArray(skills) 
            ? skills.filter(skill => skill && skill.trim()).map(skill => skill.trim())
            : [];

        const student = await Student.findByIdAndUpdate(
            studentId,
            {
                skills: cleanedSkills,
                updatedAt: new Date()
            },
            { 
                new: true, 
                runValidators: true,
                context: 'query'
            }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check and update profile completion status
        student.checkProfileCompletion();
        await student.save();

        res.json({
            success: true,
            message: 'Skills updated successfully',
            skills: student.skills,
            profileCompleted: student.profileCompleted
        });

    } catch (error) {
        console.error('Error updating skills:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating skills'
        });
    }
});

router.post('/upload_resume/:id', upload.single('resume'), async (req, res) => {
    try {
        const student = await Student.findById(req.session.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        student.resume = {
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileData: req.file.buffer, // <-- PDF stored here
            uploadDate: new Date()
        };

        await student.save();
        res.json({ success: true, message: 'Resume uploaded successfully', student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/resume/:id', async (req, res) => {
    try {
        if(req.session.user.role=='hr'){
            const student = await Student.findById(req.params.id);
            if (!student || !student.resume?.fileData) {
                return res.status(404).json({ message: 'Resume not found' });
            }
            res.set({
                'Content-Type': student.resume.fileType,
                'Content-Disposition': `inline; filename="${student.resume.fileName}"`
            });
            res.send(student.resume.fileData);
        }
        else{
            const student = await Student.findById(req.session.user.id);
            if (!student || !student.resume?.fileData) {
                return res.status(404).json({ message: 'Resume not found' });
            }

            res.set({
                'Content-Type': student.resume.fileType,
                'Content-Disposition': `inline; filename="${student.resume.fileName}"`
            });
            res.send(student.resume.fileData);
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;