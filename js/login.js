// login.js
import { authService } from './auth-service.js';

document.getElementById('signInForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const user = await authService.signIn(email, password);
        if (user) {
            window.location.href = '/student-dashboard.html';
        }
    } catch (error) {
        alert('Failed to sign in. Please check your credentials.');
    }
});

document.getElementById('googleSignInButton').addEventListener('click', async () => {
    try {
        const user = await authService.googleSignIn();
        if (user) {
            window.location.href = '/student-dashboard.html';
        }
    } catch (error) {
        alert('Google sign-in failed.');
    }
});
