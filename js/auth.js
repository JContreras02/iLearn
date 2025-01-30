// Get DOM elements
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLogin');

// Initialize Firebase Auth
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    
    try {
        // Show loading state
        submitBtn.classList.add('loading');
        
        // Sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check user role from Realtime Database
        const userRole = await getUserRole(user.uid);
        
        // Redirect based on user role
        redirectBasedOnRole(userRole);
    } catch (error) {
        // Handle errors
        showError(error.message);
    } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
    }
});

// Handle Google Sign In
googleLoginBtn.addEventListener('click', async () => {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if it's a new user
        if (result.additionalUserInfo.isNewUser) {
            // Create user profile in database
            await createUserProfile(user.uid, {
                email: user.email,
                name: user.displayName,
                role: 'student', // Default role
                createdAt: new Date().toISOString()
            });
        }
        
        // Get user role and redirect
        const userRole = await getUserRole(user.uid);
        redirectBasedOnRole(userRole);
    } catch (error) {
        showError(error.message);
    }
});

// Get user role from database
async function getUserRole(uid) {
    const userRef = firebase.database().ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    return userData?.role || 'student';
}

// Create user profile in database
async function createUserProfile(uid, userData) {
    const userRef = firebase.database().ref(`users/${uid}`);
    await userRef.set(userData);
}

// Redirect based on user role
function redirectBasedOnRole(role) {
    switch (role) {
        case 'student':
            window.location.href = 'student-dashboard.html';
            break;
        case 'instructor':
            window.location.href = 'instructor-dashboard.html';
            break;
        default:
            window.location.href = 'student-dashboard.html';
    }
}

// Show error message
function showError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        getUserRole(user.uid).then(role => {
            redirectBasedOnRole(role);
        });
    }
});

// Handle "Remember me" functionality
const rememberCheckbox = document.getElementById('remember');
if (rememberCheckbox) {
    auth.setPersistence(
        rememberCheckbox.checked
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION
    );
}