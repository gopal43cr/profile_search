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
            showSuccess('Profile updated successfully!');
            hrProfile = data.profile;
            // Update welcome message if company name changed
            if (updateData.companyName) {
                document.getElementById('welcomeMessage').textContent = 
                    `Welcome, ${hrProfile.name} from ${updateData.companyName}!`;
            }
        } else {
            showError('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating HR profile:', error);
        showError('Network error. Please try again.');
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
    card.className = 'student-profile-card horizontal';
    
    const skills = student.skills && student.skills.length > 0 
        ? student.skills.slice(0, 4).map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        : '<span class="skill-tag">No skills listed</span>';
    
    const location = student.location 
        ? [student.location.city, student.location.state, student.location.country]
            .filter(Boolean).join(', ') || 'Location not specified'
        : 'Location not specified';
    
    const education = student.education;
    const educationText = education && education.degree
        ? `${education.degree} in ${education.fieldOfStudy || 'N/A'}`
        : 'Education details not provided';
    
    const experience = student.experience;
    const experienceText = experience && experience.yearsOfExperience !== undefined
        ? `${experience.yearsOfExperience} years experience`
        : 'No experience';
    
    const gpa = education && education.gpa ? education.gpa.toFixed(1) : 'N/A';
    const graduationYear = education && education.graduationYear ? education.graduationYear : 'N/A';
    
    card.innerHTML = `
        <div class="student-header-horizontal">
            <div class="student-main-info">
                <h3>${student.name}</h3>
                <p class="student-subtitle">${educationText}</p>
            </div>
            <div class="availability-container">
                <span class="availability-badge">
                    ${getAvailabilityText(student.availability)}
                </span>
            </div>
        </div>
        
        <div class="student-details-grid">
            <div class="detail-column">
                <div class="detail-item">
                    <span class="detail-label">📧 Email:</span>
                    <span class="detail-value">${student.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${location}</span>
                </div>
            </div>
            
            <div class="detail-column">
                <div class="detail-item">
                    <span class="detail-label">🎓 GPA:</span>
                    <span class="detail-value">${gpa}/10.0</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Graduation:</span>
                    <span class="detail-value">${graduationYear}</span>
                </div>
            </div>
            
            <div class="detail-column">
                <div class="detail-item">
                    <span class="detail-label">💼 Experience:</span>
                    <span class="detail-value">${experienceText}</span>
                </div>
                ${experience && experience.company ? `
                <div class="detail-item">
                    <span class="detail-label">🏢 Company:</span>
                    <span class="detail-value">${experience.company}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="detail-column skills-column">
                <div class="detail-item">
                    <span class="detail-label">🔧 Skills:</span>
                    <div class="skills-horizontal">
                        ${skills}
                        ${student.skills && student.skills.length > 4 ? `<span class="skill-tag more-skills">+${student.skills.length - 4} more</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="student-actions">
            <button class="btn btn-small" onclick="viewResume('${student._id}')">📄 Resume</button>
            <button class="btn btn-small" onclick="viewStudentDetails('${student._id}')">👤 Profile</button>
            <button class="btn btn-small btn-secondary" onclick="contactStudent('${student.email}')">✉️ Contact</button>
            ${student.professionalLinks && student.professionalLinks.linkedin ? `
            <a href="${student.professionalLinks.linkedin}" target="_blank" class="btn btn-small btn-linkedin">💼 LinkedIn</a>
            ` : ''}
            ${student.professionalLinks && student.professionalLinks.github ? `
                <a href="${student.professionalLinks.github}" target="_blank" class="btn btn-small btn-linkedin">💻 Github</a>
                ` : ''}
            ${student.professionalLinks && student.professionalLinks.portfolio ? `
                <a href="${student.professionalLinks.portfolio}" target="_blank" class="btn btn-small btn-linkedin">🌐 Portfolio</a>
                ` : ''}
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
        
        if (data.success && data.student) {
            const student = data.student;
            
            // Get location string safely
            const location = student.location 
                ? [student.location.city, student.location.state, student.location.country]
                    .filter(Boolean).join(', ') || 'Location not specified'
                : 'Location not specified';
            
            // Get education info safely
            const education = student.education || {};
            const educationText = education.degree
                ? `${education.degree} in ${education.fieldOfStudy || 'N/A'}`
                : 'Education details not provided';
            
            // Get experience info safely
            const experience = student.experience || {};
            const experienceText = experience.yearsOfExperience !== undefined
                ? `${experience.yearsOfExperience} years experience`
                : 'No experience listed';
            
            // Get skills safely
            const skills = student.skills && student.skills.length > 0
                ? student.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
                : '<span class="skill-tag">No skills listed</span>';
            
            // Create comprehensive modal content
            const studentModal = document.getElementById('studentModal');
            studentModal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>${student.name}</h2>
                            <button class="modal-close" onclick="closeStudentModal()">&times;</button>
                        </div>
                        
                        <div class="modal-body">
                            <div class="student-detail-section">
                                <h3>Contact Information</h3>
                                <p><strong>Email:</strong> ${student.email}</p>
                                <p><strong>Location:</strong> ${location}</p>
                                <p><strong>Availability:</strong> ${getAvailabilityText(student.availability)}</p>
                            </div>
                            
                            <div class="student-detail-section">
                                <h3>Education</h3>
                                <p><strong>Degree:</strong> ${educationText}</p>
                                ${education.university ? `<p><strong>University:</strong> ${education.university}</p>` : ''}
                                ${education.graduationYear ? `<p><strong>Graduation Year:</strong> ${education.graduationYear}</p>` : ''}
                                ${education.gpa ? `<p><strong>GPA:</strong> ${education.gpa}/10.0</p>` : ''}
                            </div>
                            
                            <div class="student-detail-section">
                                <h3>Experience</h3>
                                <p><strong>Experience:</strong> ${experienceText}</p>
                                ${experience.company ? `<p><strong>Company:</strong> ${experience.company}</p>` : ''}
                                ${experience.role ? `<p><strong>Role:</strong> ${experience.role}</p>` : ''}
                            </div>
                            
                            <div class="student-detail-section">
                                <h3>Skills</h3>
                                <div class="skills-container">
                                    ${skills}
                                </div>
                            </div>
                            
                            ${student.professionalLinks ? `
                            <div class="student-detail-section">
                                <h3>Professional Links</h3>
                                <div class="professional-links">
                                    ${student.professionalLinks.linkedin ? `
                                        <a href="${student.professionalLinks.linkedin}" target="_blank" class="btn btn-small btn-linkedin">LinkedIn</a>
                                    ` : ''}
                                    ${student.professionalLinks.github ? `
                                        <a href="${student.professionalLinks.github}" target="_blank" class="btn btn-small btn-linkedin">GitHub</a>
                                    ` : ''}
                                    ${student.professionalLinks.portfolio ? `
                                        <a href="${student.professionalLinks.portfolio}" target="_blank" class="btn btn-small btn-linkedin">Portfolio</a>
                                    ` : ''}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="closeStudentModal()">Close</button>
                            <button class="btn" onclick="contactStudent('${student.email}')">Contact Student</button>
                            <button class="btn" onclick="viewResume('${student._id}')">View Resume</button>
                        </div>
                    </div>
                </div>
            `;
            
            studentModal.classList.remove('hidden');
            document.body.classList.add('modal-open'); // Prevent background scrolling
        } else {
            showError('Error: ' + (data.message || 'Failed to load student details'));
        }
    } catch (error) {
        console.error('Error loading student details:', error);
        showError('Network error while loading student details. Please try again.');
    }
}

// Function to close the modal
function closeStudentModal() {
    const studentModal = document.getElementById('studentModal');
    studentModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Close modal when clicking outside of it
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeStudentModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const studentModal = document.getElementById('studentModal');
        if (!studentModal.classList.contains('hidden')) {
            closeStudentModal();
        }
    }
});

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
        showError('No search results to export. Please perform a search first.');
        return;
    }
    
    // In a real implementation, this would generate and download a CSV/Excel file
    showInfo('Export functionality would generate a CSV/Excel file with the current search results including all student details and contact information.');
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
        showError('Error fetching resume.');
    }
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