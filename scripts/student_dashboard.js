// Load user info on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/student/profile');
        const data = await response.json();
        if (data.success && data.user) {
            document.getElementById('welcomeMessage').textContent = `Welcome back, ${data.user.name}!`;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
});

async function loadProfile() {
    try {
        const response = await fetch('/student/profile');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('content').innerHTML = 
                '<h2>My Profile</h2>' +
                '<p><strong>Name:</strong> ' + data.user.name + '</p>' +
                '<p><strong>Email:</strong> ' + data.user.email + '</p>' +
                '<p><strong>Role:</strong> ' + data.user.role + '</p>' +
                '<p><strong>Student ID:</strong> ' + data.user.id + '</p>';
        } else {
            document.getElementById('content').innerHTML = '<h2>Error loading profile</h2>';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('content').innerHTML = '<h2>Error loading profile</h2>';
    }
}

async function loadCourses() {
    try {
        const response = await fetch('/student/profile');
        const data = await response.json();
        
        if (data.success && data.additionalData) {
            document.getElementById('content').innerHTML = 
                '<h2>My Courses</h2>' +
                '<p><strong>Semester:</strong> ' + data.additionalData.semester + '</p>' +
                '<p><strong>Current GPA:</strong> ' + data.additionalData.gpa + '</p>' +
                '<h3>Enrolled Courses:</h3>' +
                '<ul>' + 
                data.additionalData.courses.map(course => '<li>' + course + '</li>').join('') +
                '</ul>';
        } else {
            document.getElementById('content').innerHTML = '<h2>Error loading courses</h2>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('content').innerHTML = '<h2>Error loading courses</h2>';
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