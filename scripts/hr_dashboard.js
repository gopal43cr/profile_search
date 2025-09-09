let hrProfile = {};
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

// Load HR profile on page load
window.addEventListener('load', async () => {
    await loadHRProfile();
});

async function loadHRProfile() {
    try {
        const response = await fetch('/hr/profile');
        const data = await response.json();
        
        if (data.success && data.user) {
            document.getElementById('welcomeMessage').textContent = 
                `Welcome, ${data.user.name} from ${data.user.companyName}!`;
            
            hrProfile = data.profile || {};
            populateHRProfileForm();
        } else {
            console.error('Failed to load HR profile');
        }
    } catch (error) {
        console.error('Error loading HR profile:', error);
    }
}

function populateHRProfileForm() {
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = hrProfile.name || '';
    }
    if (document.getElementById('profileEmail')) {
        document.getElementById('profileEmail').value = hrProfile.email || '';
    }
    if (document.getElementById('profileCompany')) {
        document.getElementById('profileCompany').value = hrProfile.companyName || '';
    }
    if (document.getElementById('profileJobTitle')) {
        document.getElementById('profileJobTitle').value = hrProfile.jobTitle || '';
    }
    if (document.getElementById('profileDepartment')) {
        document.getElementById('profileDepartment').value = hrProfile.department || '';
    }
}

function hideAllSections() {
    document.getElementById('welcomeSection').classList.add('hidden');
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('searchSection').classList.add('hidden');
    document.getElementById('statisticsSection').classList.add('hidden');
}

function showProfile() {
    hideAllSections();
    document.getElementById('profileSection').classList.remove('hidden');
}

function showStudentSearch() {
    hideAllSections();
    document.getElementById('searchSection').classList.remove('hidden');
}

function showStatistics() {
    hideAllSections();
    document.getElementById('statisticsSection').classList.remove('hidden');
    loadStatistics();
}

// Handle HR profile form submission
document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateHRProfile();
        });
    }
});

async function updateHRProfile() {
    try {
        const updateData = {
            companyName: document.getElementById('profileCompany').value,
            jobTitle: document.getElementById('profileJobTitle').value,
            department: document.getElementById('profileDepartment').value
        };
        
        const response = await fetch('/hr/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Profile updated successfully!');
            hrProfile = data.profile;
            // Update welcome message if company name changed
            if (updateData.companyName) {
                document.getElementById('welcomeMessage').textContent = 
                    `Welcome, ${hrProfile.name} from ${updateData.companyName}!`;
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating HR profile:', error);
        alert('Network error. Please try again.');
    }
}

function getSearchFilters() {
    return {
        searchTerm: document.getElementById('searchTerm').value.trim(),
        skills: document.getElementById('skillsFilter').value.trim(),
        location: document.getElementById('locationFilter').value.trim(),
        degree: document.getElementById('degreeFilter').value,
        fieldOfStudy: document.getElementById('fieldOfStudyFilter').value.trim(),
        graduationYear: document.getElementById('graduationYearFilter').value,
        availability: document.getElementById('availabilityFilter').value,
        experienceMin: document.getElementById('expMinFilter').value,
        experienceMax: document.getElementById('expMaxFilter').value,
        gpaMin: document.getElementById('gpaMinFilter').value,
        gpaMax: document.getElementById('gpaMaxFilter').value
    };
}

async function searchStudents(page = 1) {
    try {
        currentFilters = getSearchFilters();
        currentPage = page;
        
        // Build query parameters
        const params = new URLSearchParams();
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        params.append('page', page);
        params.append('limit', 10);
        
        const response = await fetch(`/hr/students?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data);
            updatePagination(data);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error searching students:', error);
        showNoResults();
    }
}

function displaySearchResults(data) {
    const resultsInfo = document.getElementById('resultsInfo');
    const studentsList = document.getElementById('studentsList');
    const noResults = document.getElementById('noResults');
    
    if (data.students && data.students.length > 0) {
        // Show results info
        resultsInfo.classList.remove('hidden');
        resultsInfo.innerHTML = `
            Found ${data.totalStudents} student${data.totalStudents !== 1 ? 's' : ''} 
            (Page ${data.currentPage} of ${data.totalPages})
        `;
        
        // Display student cards
        studentsList.innerHTML = '';
        data.students.forEach(student => {
            const studentCard = createStudentCard(student);
            studentsList.appendChild(studentCard);
        });
        
        noResults.classList.add('hidden');
    } else {
        showNoResults();
    }
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    const skills = student.skills && student.skills.length > 0 
        ? student.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        : '<span class="skill-tag">No skills listed</span>';
    
    const location = student.location 
        ? [student.location.city, student.location.state, student.location.country]
            .filter(Boolean).join(', ') || 'Location not specified'
        : 'Location not specified';
    
    const education = student.education;
    const educationText = education && education.degree
        ? `${education.degree} in ${education.fieldOfStudy || 'N/A'} from ${education.university || 'N/A'}`
        : 'Education details not provided';
    
    const experience = student.experience;
    const experienceText = experience && experience.yearsOfExperience !== undefined
        ? `${experience.yearsOfExperience} years of experience`
        : 'Experience not specified';
    
    const gpa = education && education.gpa ? education.gpa.toFixed(2) : 'N/A';
    const graduationYear = education && education.graduationYear ? education.graduationYear : 'N/A';
    
    card.innerHTML = `
        <div class="student-header">
            <h3>${student.name}</h3>
            <span class="availability-badge" style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${getAvailabilityText(student.availability)}
            </span>
        </div>
        
        <div class="student-info">
            <div class="info-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> ${student.email}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Student ID:</strong> ${student._id}</p>
            </div>
            
            <div class="info-section">
                <h4>Education</h4>
                <p>${educationText}</p>
                <p><strong>GPA:</strong> ${gpa}/10.0</p>
                <p><strong>Graduation Year:</strong> ${graduationYear}</p>
            </div>
            
            <div class="info-section">
                <h4>Experience</h4>
                <p>${experienceText}</p>
                ${experience && experience.jobTitle ? `<p><strong>Latest Role:</strong> ${experience.jobTitle}</p>` : ''}
                ${experience && experience.company ? `<p><strong>Company:</strong> ${experience.company}</p>` : ''}
            </div>
            
            <div class="info-section">
                <h4>Skills</h4>
                <div class="skills-list">
                    ${skills}
                </div>
            </div>

            <div class="info-section">
                <h3>Resume</h3>
                <button type="button" class="btn" onclick="viewResume('${student._id}')">View</button>
            </div>
            
            ${student.professionalLinks && (student.professionalLinks.linkedin || student.professionalLinks.github || student.professionalLinks.portfolio) ? `
            <div class="info-section">
                <h4>Professional Links</h4>
                ${student.professionalLinks.linkedin ? `<p><a href="${student.professionalLinks.linkedin}" target="_blank">LinkedIn Profile</a></p>` : ''}
                ${student.professionalLinks.github ? `<p><a href="${student.professionalLinks.github}" target="_blank">GitHub Profile</a></p>` : ''}
                ${student.professionalLinks.portfolio ? `<p><a href="${student.professionalLinks.portfolio}" target="_blank">Portfolio Website</a></p>` : ''}
            </div>
            ` : ''}
        </div>
        
        <div style="margin-top: 15px;">
            <button class="btn" onclick="viewStudentDetails('${student._id}')">View Full Profile</button>
            <button class="btn btn-secondary" onclick="contactStudent('${student.email}')">Contact Student</button>
        </div>
    `;
    
    return card;
}

function getAvailabilityText(availability) {
    const availabilityMap = {
        'immediate': 'Available Immediately',
        '2-weeks': 'Available in 2 weeks',
        '1-month': 'Available in 1 month',
        '2-months': 'Available in 2 months',
        'not-available': 'Not Available'
    };
    return availabilityMap[availability] || 'Availability not specified';
}

function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    totalPages = data.totalPages;
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = !data.hasPrevPage;
    prevBtn.onclick = () => searchStudents(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'current-page' : '';
        pageBtn.onclick = () => searchStudents(i);
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = !data.hasNextPage;
    nextBtn.onclick = () => searchStudents(currentPage + 1);
    pagination.appendChild(nextBtn);
}

function showNoResults() {
    document.getElementById('resultsInfo').classList.add('hidden');
    document.getElementById('studentsList').innerHTML = '';
    document.getElementById('pagination').classList.add('hidden');
    document.getElementById('noResults').classList.remove('hidden');
}

function clearAllFilters() {
    document.getElementById('searchTerm').value = '';
    document.getElementById('skillsFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('degreeFilter').value = '';
    document.getElementById('fieldOfStudyFilter').value = '';
    document.getElementById('graduationYearFilter').value = '';
    document.getElementById('availabilityFilter').value = '';
    document.getElementById('expMinFilter').value = '';
    document.getElementById('expMaxFilter').value = '';
    document.getElementById('gpaMinFilter').value = '';
    document.getElementById('gpaMaxFilter').value = '';
    
    // Clear results
    document.getElementById('resultsInfo').classList.add('hidden');
    document.getElementById('studentsList').innerHTML = '';
    document.getElementById('pagination').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
}

async function viewStudentDetails(studentId) {
    try {
        const response = await fetch(`/hr/students/${studentId}`);
        const data = await response.json();
        
        if (data.success) {
            // In a real implementation, this would open a modal or new page
            alert(`Full profile for ${data.student.name}:\n\n` + JSON.stringify(data.student, null, 2));
        } else {
            alert('Error loading student details');
        }
    } catch (error) {
        console.error('Error loading student details:', error);
        alert('Error loading student details');
    }
}

function contactStudent(email) {
    // Open email client with pre-filled recipient
    window.location.href = `mailto:${email}?subject=Opportunity from ${hrProfile.companyName}`;
}

async function loadStatistics() {
    try {
        const response = await fetch('/hr/statistics');
        const data = await response.json();
        
        if (data.success) {
            displayStatistics(data.statistics);
        } else {
            document.getElementById('statisticsContent').innerHTML = '<p>Error loading statistics</p>';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('statisticsContent').innerHTML = '<p>Error loading statistics</p>';
    }
}

function displayStatistics(stats) {
    const content = document.getElementById('statisticsContent');
    
    content.innerHTML = `
        <div class="profile-section">
            <h3>Overall Statistics</h3>
            <div class="filter-grid">
                <div class="form-group">
                    <label>Total Students:</label>
                    <input type="text" value="${stats.totalStudents}" readonly class="readonly">
                </div>
                <div class="form-group">
                    <label>Recent Registrations (30 days):</label>
                    <input type="text" value="${stats.recentRegistrations}" readonly class="readonly">
                </div>
            </div>
        </div>
        
        <div class="profile-section">
            <h3>Students by Availability</h3>
            <div class="info-section">
                ${stats.availabilityStats.map(stat => `
                    <p><strong>${getAvailabilityText(stat._id)}:</strong> ${stat.count} students</p>
                `).join('')}
            </div>
        </div>
        
        <div class="profile-section">
            <h3>Students by Degree</h3>
            <div class="info-section">
                ${stats.degreeStats.map(stat => `
                    <p><strong>${stat._id}:</strong> ${stat.count} students</p>
                `).join('')}
            </div>
        </div>
        
        <div class="profile-section">
            <h3>Top Skills</h3>
            <div class="skills-list">
                ${stats.skillsStats.map(skill => `
                    <span class="skill-tag">${skill._id} (${skill.count})</span>
                `).join('')}
            </div>
        </div>
        
        <div class="profile-section">
            <h3>Students by Experience Range</h3>
            <div class="info-section">
                ${stats.experienceStats.map(stat => {
                    let rangeText = stat._id;
                    if (typeof stat._id === 'number') {
                        if (stat._id === 0) rangeText = '0-1 years';
                        else if (stat._id === 1) rangeText = '1-3 years';
                        else if (stat._id === 3) rangeText = '3-5 years';
                        else if (stat._id === 5) rangeText = '5-10 years';
                        else if (stat._id === 10) rangeText = '10+ years';
                    }
                    return `<p><strong>${rangeText}:</strong> ${stat.count} students</p>`;
                }).join('')}
            </div>
        </div>
    `;
}

function exportResults() {
    if (!document.getElementById('studentsList').innerHTML) {
        alert('No search results to export. Please perform a search first.');
        return;
    }
    
    // In a real implementation, this would generate and download a CSV/Excel file
    alert('Export functionality would generate a CSV/Excel file with the current search results including all student details and contact information.');
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

async function viewResume(studentId) {
    const response = await fetch(`/student/resume/${studentId}`);
    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } else {
        alert('Error fetching resume.');
    }
}