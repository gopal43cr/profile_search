 // Load user info on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/hr/students');
        const data = await response.json();
        if (data.success && data.user) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${data.user.name}!`;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
});

async function loadStudents() {
    try {
        const response = await fetch('/hr/students');
        const data = await response.json();
        
        if (data.success) {
            let studentsHtml = '<h2>All Students (' + data.totalStudents + ')</h2>';
            
            if (data.students.length === 0) {
                studentsHtml += '<p>No students registered yet.</p>';
            } else {
                data.students.forEach(student => {
                    studentsHtml += 
                        '<div class="student-card">' +
                        '<h3>' + student.name + '</h3>' +
                        '<p><strong>Email:</strong> ' + student.email + '</p>' +
                        '<p><strong>Student ID:</strong> ' + student._id + '</p>' +
                        '<p><strong>Registered:</strong> ' + new Date(student.createdAt).toLocaleDateString() + '</p>' +
                        '</div>';
                });
            }
            
            document.getElementById('content').innerHTML = studentsHtml;
        } else {
            document.getElementById('content').innerHTML = '<h2>Error loading students</h2>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        document.getElementById('content').innerHTML = '<h2>Error loading students</h2>';
    }
}

async function loadStatistics() {
    try {
        const response = await fetch('/hr/students');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('content').innerHTML = 
                '<h2>System Statistics</h2>' +
                '<div class="student-card">' +
                '<h3>User Statistics</h3>' +
                '<p><strong>Total Students:</strong> ' + data.totalStudents + '</p>' +
                '<p><strong>Total HR Users:</strong> 1+ (including you)</p>' +
                '<p><strong>System Status:</strong> Active</p>' +
                '</div>' +
                '<div class="student-card">' +
                '<h3>Recent Activity</h3>' +
                '<p>Latest student registrations and system usage statistics would be displayed here.</p>' +
                '</div>';
        } else {
            document.getElementById('content').innerHTML = '<h2>Error loading statistics</h2>';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('content').innerHTML = '<h2>Error loading statistics</h2>';
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