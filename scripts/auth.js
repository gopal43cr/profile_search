let isLoginMode = true;
        
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const title = document.getElementById('formTitle');
    const toggleBtn = document.getElementById('toggleBtn');
    const messageDiv = document.getElementById('message');
    
    if (isLoginMode) {
        // Switch to signup mode
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        title.textContent = 'Sign Up';
        toggleBtn.textContent = 'Already have an account? Login';
        isLoginMode = false;
    } else {
        // Switch to login mode
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        title.textContent = 'Login';
        toggleBtn.textContent = "Don't have an account? Sign Up";
        isLoginMode = true;
    }
    
    // Clear message when switching
    messageDiv.classList.add('hidden');
}

function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message);
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1000);
        } else {
            showMessage(data.message, true);
        }
    } catch (error) {
        showMessage('Network error. Please try again.', true);
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    
    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message);
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1000);
        } else {
            showMessage(data.message, true);
        }
    } catch (error) {
        showMessage('Network error. Please try again.', true);
    }
});