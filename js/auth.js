import { auth, database } from './firebase.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

class AuthManager {
    constructor() {
        this.googleProvider = new GoogleAuthProvider();
        this.setupAuthStateListener();
    }

    // Handle sign up
    async signUp(email, password, name, role = 'student') {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile
            await updateProfile(user, {
                displayName: name
            });

            // Create user document in database
            await set(ref(database, `users/${user.uid}`), {
                name: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });

            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Handle login
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await this.updateLastLogin(userCredential.user.uid);
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Handle Google Sign In
    async googleSignIn() {
        try {
            const result = await signInWithPopup(auth, this.googleProvider);
            const user = result.user;

            // Check if user exists in database
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                // Create new user document
                await set(userRef, {
                    name: user.displayName,
                    email: user.email,
                    role: 'student',
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
            } else {
                // Update last login
                await this.updateLastLogin(user.uid);
            }

            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Handle logout
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Update last login timestamp
    async updateLastLogin(userId) {
        try {
            await set(ref(database, `users/${userId}/lastLogin`), new Date().toISOString());
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    // Set up auth state listener
    setupAuthStateListener() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                const userRef = ref(database, `users/${user.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val();

                // Redirect based on role
                if (userData.role === 'instructor') {
                    window.location.href = 'instructor-dashboard.html';
                } else {
                    window.location.href = 'student-dashboard.html';
                }
            } else {
                // User is signed out
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Handle authentication errors
    handleAuthError(error) {
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already registered.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Operation not allowed.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak.';
                break;
            case 'auth/user-not-found':
                message = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password.';
                break;
        }

        return { code: error.code, message };
    }
}

// Export auth manager instance
export const authManager = new AuthManager();