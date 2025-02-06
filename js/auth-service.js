// auth-service.js
class AuthService {
    constructor() {
        this.auth = firebase.auth();
        this.database = firebase.database();
        this.googleProvider = new firebase.auth.GoogleAuthProvider();
    }

    // Google Sign In
    async signInWithGoogle() {
        try {
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;
            
            // Check if user exists in database
            const userSnapshot = await this.database.ref(`users/${user.uid}`).once('value');
            
            if (!userSnapshot.exists()) {
                // First time Google sign in - need to create profile
                await this.database.ref(`users/${user.uid}`).set({
                    fullName: user.displayName,
                    email: user.email,
                    userType: 'student', // Default to student
                    createdAt: Date.now(),
                    lastLogin: Date.now(),
                    profileImage: user.photoURL
                });
            } else {
                // Update last login
                await this.database.ref(`users/${user.uid}`).update({
                    lastLogin: Date.now()
                });
            }
            
            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign up new user
    async signUp(email, password, fullName, userType) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            await this.database.ref(`users/${userCredential.user.uid}`).set({
                fullName,
                email,
                userType,
                createdAt: Date.now(),
                lastLogin: Date.now(),
                settings: {
                    notifications: true,
                    emailPreferences: {
                        courseUpdates: true,
                        assignments: true,
                        announcements: true
                    }
                }
            });
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign in existing user
    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            await this.database.ref(`users/${userCredential.user.uid}`).update({
                lastLogin: Date.now()
            });
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign out user
    async signOut() {
        try {
            await this.auth.signOut();
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Get current user data
    async getCurrentUser() {
        const user = this.auth.currentUser;
        if (!user) return null;

        const snapshot = await this.database.ref(`users/${user.uid}`).once('value');
        return {
            ...snapshot.val(),
            uid: user.uid
        };
    }

    // Update user profile
    async updateProfile(userData) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        try {
            await this.database.ref(`users/${user.uid}`).update({
                ...userData,
                updatedAt: Date.now()
            });
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Update password
    async updatePassword(newPassword) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        try {
            await user.updatePassword(newPassword);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Update email
    async updateEmail(newEmail) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        try {
            await user.updateEmail(newEmail);
            await this.database.ref(`users/${user.uid}`).update({
                email: newEmail,
                updatedAt: Date.now()
            });
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Handle authentication errors
    handleAuthError(error) {
        let message = 'An error occurred during authentication.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already registered.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Email/password accounts are not enabled.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Use at least 6 characters.';
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                message = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                message = 'Invalid password.';
                break;
            default:
                message = error.message;
        }

        return new Error(message);
    }

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
}

// Export as singleton
export const authService = new AuthService();