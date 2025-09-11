let studentProfile = {};
let currentSkills = [];

// Load user info and profile data on page load
window.addEventListener('load', async () => {
    await loadProfile();
    updateCompletionStatus();
});

async function loadProfile() {
    try {
        const response = await fetch('/student/profile');
        const data = await response.json();
        
        if (data.success && data.user) {
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${data.user.name}!`;
            
            studentProfile = data.profile || {};
            currentSkills = studentProfile.skills || [];
            
            // Populate form fields
            populateProfileForm();
            
        } else {
            console.error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

function populateProfileForm() {
    // Basic info
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = studentProfile.name || '';
    }
    if (document.getElementById('profileEmail')) {
        document.getElementById('profileEmail').value = studentProfile.email || '';
    }
    
    // Location
    if (document.getElementById('locationCity')) {
        document.getElementById('locationCity').value = studentProfile.location?.city || '';
    }
    if (document.getElementById('locationState')) {
        document.getElementById('locationState').value = studentProfile.location?.state || '';
    }
    if (document.getElementById('locationCountry')) {
        document.getElementById('locationCountry').value = studentProfile.location?.country || '';
    }
    
    // Availability
    if (document.getElementById('availability')) {
        document.getElementById('availability').value = studentProfile.availability || 'immediate';
    }
    
    // Education
    if (document.getElementById('eduDegree')) {
        document.getElementById('eduDegree').value = studentProfile.education?.degree || '';
    }
    if (document.getElementById('eduFieldOfStudy')) {
        document.getElementById('eduFieldOfStudy').value = studentProfile.education?.fieldOfStudy || '';
    }
    if (document.getElementById('eduUniversity')) {
        document.getElementById('eduUniversity').value = studentProfile.education?.university || '';
    }
    if (document.getElementById('eduGraduationYear')) {
        document.getElementById('eduGraduationYear').value = studentProfile.education?.graduationYear || '';
    }
    if (document.getElementById('eduGPA')) {
        document.getElementById('eduGPA').value = studentProfile.education?.gpa || '';
    }
    
    // Experience
    if (document.getElementById('expYears')) {
        document.getElementById('expYears').value = studentProfile.experience?.yearsOfExperience || '';
    }
    if (document.getElementById('expJobTitle')) {
        document.getElementById('expJobTitle').value = studentProfile.experience?.jobTitle || '';
    }
    if (document.getElementById('expCompany')) {
        document.getElementById('expCompany').value = studentProfile.experience?.company || '';
    }
    if (document.getElementById('expDescription')) {
        document.getElementById('expDescription').value = studentProfile.experience?.description || '';
    }
    
    // Professional links
    if (document.getElementById('linkedinUrl')) {
        document.getElementById('linkedinUrl').value = studentProfile.professionalLinks?.linkedin || '';
    }
    if (document.getElementById('githubUrl')) {
        document.getElementById('githubUrl').value = studentProfile.professionalLinks?.github || '';
    }
    if (document.getElementById('portfolioUrl')) {
        document.getElementById('portfolioUrl').value = studentProfile.professionalLinks?.portfolio || '';
    }
    
    // Resume info
    if (studentProfile.resume?.fileName) {
        document.getElementById('currentResume').classList.remove('hidden');
        document.getElementById('resumeFileName').textContent = studentProfile.resume.fileName;
        if (studentProfile.resume.uploadDate) {
            document.getElementById('resumeUploadDate').textContent = 
                new Date(studentProfile.resume.uploadDate).toLocaleDateString();
        }
    }
    
    // Update skills display
    updateSkillsDisplay();
}

function updateCompletionStatus() {
    const statusDiv = document.getElementById('completionStatus');
    const statusText = document.getElementById('completionText');
    
    if (studentProfile.profileCompleted) {
        statusDiv.className = 'completion-status completion-complete';
        statusText.textContent = '✓ Profile Complete - You\'re visible to HR recruiters!';
    } else {
        statusDiv.className = 'completion-status completion-incomplete';
        statusText.textContent = '⚠ Profile Incomplete - Complete your profile to increase visibility to recruiters';
    }
}

function hideAllSections() {
    document.getElementById('welcomeSection').classList.add('hidden');
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('educationSection').classList.add('hidden');
    document.getElementById('skillsSection').classList.add('hidden');
    document.getElementById('experienceSection').classList.add('hidden');
    document.getElementById('professionalLinksSection').classList.add('hidden');
    document.getElementById('resumeSection').classList.add('hidden');
}

function showProfile() {
    hideAllSections();
    document.getElementById('profileSection').classList.remove('hidden');
}

function showEducation() {
    hideAllSections();
    document.getElementById('educationSection').classList.remove('hidden');
}

function showSkills() {
    hideAllSections();
    document.getElementById('skillsSection').classList.remove('hidden');
    updateSkillsDisplay();
}

function showExperience() {
    hideAllSections();
    document.getElementById('experienceSection').classList.remove('hidden');
}

function showProfessionalLinks() {
    hideAllSections();
    document.getElementById('professionalLinksSection').classList.remove('hidden');
}

function showResume() {
    hideAllSections();
    document.getElementById('resumeSection').classList.remove('hidden'); 
}

// Enhanced showMessage function with auto-dismiss
function showMessage(message, type = 'success', duration = 3000) {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.setProperty('--timeout-duration', `${duration}ms`);
    
    messageDiv.innerHTML = `
        ${message}
        <button class="close-btn" onclick="hideMessage(this.parentElement)">&times;</button>
    `;
    
    alertContainer.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.classList.add('show'), 10);
    
    const timeoutId = setTimeout(() => hideMessage(messageDiv), duration);
    messageDiv.timeoutId = timeoutId;
    
    return messageDiv;
}

function hideMessage(messageElement) {
    if (!messageElement) return;
    
    if (messageElement.timeoutId) {
        clearTimeout(messageElement.timeoutId);
    }
    
    messageElement.classList.add('hide');
    messageElement.classList.remove('show');
    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 400);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'alert-container';
    document.body.appendChild(container);
    return container;
}

// Utility functions
function showSuccess(message, duration = 3000) {
    return showMessage(message, 'success', duration);
}

function showError(message, duration = 4000) {
    return showMessage(message, 'error', duration);
}

function showWarning(message, duration = 3500) {
    return showMessage(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    return showMessage(message, 'info', duration);
}

function updateSkillsDisplay() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    skillsList.innerHTML = '';
    
    currentSkills.forEach((skill, index) => {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <span class="remove-skill" onclick="removeSkill(${index})">&times;</span>
        `;
        skillsList.appendChild(skillTag);
    });
}

function addSkill() {
    const newSkillInput = document.getElementById('newSkillInput');
    const skill = newSkillInput.value.trim();
    
    if (skill && !currentSkills.includes(skill)) {
        currentSkills.push(skill);
        updateSkillsDisplay();
        newSkillInput.value = '';
    }
}

function removeSkill(index) {
    currentSkills.splice(index, 1);
    updateSkillsDisplay();
}

// Handle Enter key in skill input
document.addEventListener('DOMContentLoaded', () => {
    const skillInput = document.getElementById('newSkillInput');
    if (skillInput) {
        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }
});

// Form submission handlers
document.addEventListener('DOMContentLoaded', () => {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfileSection();
        });
    }
    
    // Education form
    const educationForm = document.getElementById('educationForm');
    if (educationForm) {
        educationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateEducation();
        });
    }
    
    // Experience form
    const experienceForm = document.getElementById('experienceForm');
    if (experienceForm) {
        experienceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateExperience();
        });
    }
    
    // Professional links form
    const linksForm = document.getElementById('professionalLinksForm');
    if (linksForm) {
        linksForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfessionalLinks();
        });
    }
});

async function updateProfileSection() {
    try {
        const updateData = {
            location: {
                city: document.getElementById('locationCity').value,
                state: document.getElementById('locationState').value,
                country: document.getElementById('locationCountry').value
            },
            availability: document.getElementById('availability').value
        };
        
        const response = await fetch('/student/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Profile updated successfully!');
            studentProfile = data.profile;
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message, true);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Network error. Please try again.', true);
    }
}

async function updateEducation() {
    try {
        const updateData = {
            degree: document.getElementById('eduDegree').value,
            fieldOfStudy: document.getElementById('eduFieldOfStudy').value,
            university: document.getElementById('eduUniversity').value,
            graduationYear: parseInt(document.getElementById('eduGraduationYear').value) || undefined,
            gpa: parseFloat(document.getElementById('eduGPA').value) || undefined
        };
        
        const response = await fetch('/student/education', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Education details updated successfully!');
            studentProfile.education = data.education;
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message, true);
        }
    } catch (error) {
        console.error('Error updating education:', error);
        showError('Network error. Please try again.', true);
    }
}

async function updateSkills() {
    try {
        const response = await fetch('/student/skills', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ skills: currentSkills })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Skills updated successfully!');
            studentProfile.skills = data.skills;
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating skills:', error);
        showError('Network error. Please try again.', true);
    }
}

async function updateExperience() {
    try {
        const updateData = {
            experience: {
                yearsOfExperience: parseInt(document.getElementById('expYears').value) || 0,
                jobTitle: document.getElementById('expJobTitle').value,
                company: document.getElementById('expCompany').value,
                description: document.getElementById('expDescription').value
            }
        };
        
        const response = await fetch('/student/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Experience updated successfully!');
            studentProfile = data.profile;
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message, true);
        }
    } catch (error) {
        console.error('Error updating experience:', error);
        showError('Network error. Please try again.', true);
    }
}

async function updateProfessionalLinks() {
    try {
        const updateData = {
            professionalLinks: {
                linkedin: document.getElementById('linkedinUrl').value,
                github: document.getElementById('githubUrl').value,
                portfolio: document.getElementById('portfolioUrl').value
            }
        };
        
        const response = await fetch('/student/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Professional links updated successfully!');
            studentProfile = data.profile;
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message, true);
        }
    } catch (error) {
        console.error('Error updating professional links:', error);
        showError('Network error. Please try again.', true);
    }
}


async function uploadResume() {
    const resumeInput = document.getElementById('resumeFile');
    if (resumeInput.files.length === 0) {
        showWarning('Please select a file to upload.');
        return;
    }
    const file = resumeInput.files[0];
    
    const formData = new FormData();
    formData.append('resume', file);

    fetch(`/student/upload_resume/${studentProfile._id}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Resume uploaded successfully!');
            studentProfile.resume = data.student.resume;
            populateProfileForm();
            updateCompletionStatus();
        } else {
            showError('Error: ' + data.message, true);
        }
    })
    .catch(error => {
        console.error('Error uploading resume:', error);
        showError('Network error. Please try again.', true);
    });
}

async function viewResume() {
    if (!studentProfile.resume || !studentProfile.resume.fileData) {
        showWarning('No resume uploaded.');
        return;
    }
    const response = await fetch(`/student/resume/${studentProfile._id}`);
    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } else {
        showError('Error fetching resume.', true);
    }
}


async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        if (data.success) {
            window.location.href = data.redirectUrl;
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/auth/login';
    }
}