// Initialize Firebase with environment variables
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Initialize Analytics if available
if (typeof firebase.analytics === 'function') {
    firebase.analytics();
}

// Database Reference Helper Functions
const db = {
    // User related references
    users: {
        get: (uid) => firebase.database().ref(`users/${uid}`),
        create: async (uid, userData) => {
            await firebase.database().ref(`users/${uid}`).set(userData);
        },
        update: async (uid, updates) => {
            await firebase.database().ref(`users/${uid}`).update(updates);
        }
    },

    // Course related references
    courses: {
        get: (courseId) => firebase.database().ref(`courses/${courseId}`),
        getAll: () => firebase.database().ref('courses'),
        create: async (courseData) => {
            const courseRef = firebase.database().ref('courses').push();
            await courseRef.set({
                ...courseData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return courseRef.key;
        },
        update: async (courseId, updates) => {
            await firebase.database().ref(`courses/${courseId}`).update({
                ...updates,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    },

    // Enrollment related references
    enrollments: {
        get: (userId, courseId) => firebase.database().ref(`enrollments/${userId}/${courseId}`),
        create: async (userId, courseId, enrollmentData) => {
            await firebase.database().ref(`enrollments/${userId}/${courseId}`).set({
                ...enrollmentData,
                enrolledAt: firebase.database.ServerValue.TIMESTAMP
            });
        },
        updateProgress: async (userId, courseId, progress) => {
            await firebase.database().ref(`enrollments/${userId}/${courseId}`).update({
                progress,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    },

    // Content related references
    content: {
        get: (courseId, contentId) => firebase.database().ref(`content/${courseId}/${contentId}`),
        create: async (courseId, contentData) => {
            const contentRef = firebase.database().ref(`content/${courseId}`).push();
            await contentRef.set({
                ...contentData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return contentRef.key;
        }
    },

    // Assessment related references
    assessments: {
        get: (courseId, assessmentId) => firebase.database().ref(`assessments/${courseId}/${assessmentId}`),
        create: async (courseId, assessmentData) => {
            const assessmentRef = firebase.database().ref(`assessments/${courseId}`).push();
            await assessmentRef.set({
                ...assessmentData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return assessmentRef.key;
        }
    },

    // Activity related references
    activities: {
        create: async (userId, activityData) => {
            const activityRef = firebase.database().ref(`activities/${userId}`).push();
            await activityRef.set({
                ...activityData,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }
    },

    // Certificate related references
    certificates: {
        get: (userId, courseId) => firebase.database().ref(`certificates/${userId}/${courseId}`),
        create: async (userId, courseId, certificateData) => {
            await firebase.database().ref(`certificates/${userId}/${courseId}`).set({
                ...certificateData,
                issuedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }
};

// Storage Helper Functions
const storage = {
    // Upload file to storage
    uploadFile: async (path, file) => {
        const storageRef = firebase.storage().ref(path);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    },

    // Delete file from storage
    deleteFile: async (path) => {
        const storageRef = firebase.storage().ref(path);
        await storageRef.delete();
    }
};

// Authentication Helper Functions
const auth = {
    // Sign up with email and password
    signUp: async (email, password) => {
        return await firebase.auth().createUserWithEmailAndPassword(email, password);
    },

    // Sign in with email and password
    signIn: async (email, password) => {
        return await firebase.auth().signInWithEmailAndPassword(email, password);
    },

    // Sign in with Google
    signInWithGoogle: async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        return await firebase.auth().signInWithPopup(provider);
    },

    // Sign out
    signOut: async () => {
        await firebase.auth().signOut();
    },

    // Get current user
    getCurrentUser: () => {
        return firebase.auth().currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged: (callback) => {
        return firebase.auth().onAuthStateChanged(callback);
    }
};

// Export the helper functions
window.db = db;
window.storage = storage;
window.auth = auth;