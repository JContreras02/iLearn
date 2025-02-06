// signup.js
import { authService } from './auth-service.js';

document.getElementById('signUpForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const user = await authService.signUp(email, password);
        if (user) {
            window.location.href = '/student-dashboard.html';
        }
    } catch (error) {
        alert('Failed to sign up. Please try again.');
    }
});
