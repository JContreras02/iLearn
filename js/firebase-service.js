// Firebase Configuration and Setup
const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyDUZ9JQgfK4tx1dNZTKjpXdujWaazZTEOI",
  authDomain: "ilearn-af4eb.firebaseapp.com",
  databaseURL: "https://ilearn-af4eb-default-rtdb.firebaseio.com",
  projectId: "ilearn-af4eb",
  storageBucket: "ilearn-af4eb.firebasestorage.app",
  messagingSenderId: "291415286107",
  appId: "1:291415286107:web:3d85fef75c10f24d5ffa7e",
  measurementId: "G-RDN0255N28",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Database Structure
const dbStructure = {
  users: {
    userId: {
      fullName: "String",
      email: "String",
      userType: "student|instructor",
      createdAt: "Timestamp",
      lastLogin: "Timestamp",
      profileImage: "String (URL)",
      bio: "String",
      settings: {
        notifications: "Boolean",
        emailPreferences: "Object"
      }
    }
  },
  courses: {
    courseId: {
      title: "String",
      description: "String",
      instructorId: "String (User ID)",
      price: "Number",
      category: "String",
      level: "beginner|intermediate|advanced",
      thumbnailUrl: "String (URL)",
      createdAt: "Timestamp",
      updatedAt: "Timestamp",
      status: "draft|published|archived",
      modules: {
        moduleId: {
          title: "String",
          order: "Number",
          lessons: {
            lessonId: {
              title: "String",
              content: "String",
              type: "video|text|quiz",
              duration: "Number (minutes)",
              order: "Number"
            }
          }
        }
      }
    }
  },
  enrollments: {
    courseId: {
      userId: {
        enrolledAt: "Timestamp",
        status: "active|completed|paused",
        lastAccessed: "Timestamp",
        completedLessons: ["lessonId"]
      }
    }
  },
  progress: {
    courseId: {
      userId: {
        progress: "Number (percentage)",
        currentModule: "String (moduleId)",
        currentLesson: "String (lessonId)",
        lastUpdated: "Timestamp"
      }
    }
  },
  assignments: {
    courseId: {
      assignmentId: {
        title: "String",
        description: "String",
        dueDate: "Timestamp",
        points: "Number",
        type: "quiz|project|essay"
      }
    }
  },
  submissions: {
    courseId: {
      assignmentId: {
        userId: {
          submittedAt: "Timestamp",
          content: "String/Object",
          grade: "Number",
          feedback: "String",
          status: "submitted|graded|returned"
        }
      }
    }
  },
  analytics: {
    courses: {
      courseId: {
        dailyEngagement: {
          date: {
            activeUsers: "Number",
            lessonCompletions: "Number",
            averageProgress: "Number"
          }
        }
      }
    },
    instructors: {
      userId: {
        studentCount: "Number",
        courseCount: "Number",
        revenue: "Number",
        ratings: {
          average: "Number",
          count: "Number"
        }
      }
    }
  }
};

// Helper Classes for Database Operations

class DatabaseService {
  // User Operations
  static async createUser(userData) {
    const { uid, email, fullName, userType } = userData;
    await database.ref(`users/${uid}`).set({
      email,
      fullName,
      userType,
      createdAt: Date.now(),
      lastLogin: Date.now()
    });
  }

  static async updateUserProfile(uid, profileData) {
    await database.ref(`users/${uid}`).update(profileData);
  }

  // Course Operations
  static async createCourse(instructorId, courseData) {
    const courseRef = database.ref('courses').push();
    const course = {
      ...courseData,
      instructorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'draft'
    };
    await courseRef.set(course);
    return courseRef.key;
  }

  static async updateCourse(courseId, courseData) {
    await database.ref(`courses/${courseId}`).update({
      ...courseData,
      updatedAt: Date.now()
    });
  }

  // Enrollment Operations
  static async enrollStudent(courseId, userId) {
    await database.ref(`enrollments/${courseId}/${userId}`).set({
      enrolledAt: Date.now(),
      status: 'active',
      lastAccessed: Date.now()
    });
  }

  // Progress Tracking
  static async updateProgress(courseId, userId, progressData) {
    await database.ref(`progress/${courseId}/${userId}`).update({
      ...progressData,
      lastUpdated: Date.now()
    });
  }

  // Analytics Operations
  static async updateCourseAnalytics(courseId, analyticsData) {
    const date = new Date().toISOString().split('T')[0];
    await database.ref(`analytics/courses/${courseId}/dailyEngagement/${date}`).update(analyticsData);
  }

  static async updateInstructorAnalytics(instructorId, analyticsData) {
    await database.ref(`analytics/instructors/${instructorId}`).update(analyticsData);
  }
}

// Authentication Service
class AuthService {
  static async signUp(email, password, fullName, userType) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await DatabaseService.createUser({
        uid: userCredential.user.uid,
        email,
        fullName,
        userType
      });
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      await database.ref(`users/${userCredential.user.uid}`).update({
        lastLogin: Date.now()
      });
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      throw error;
    }
  }
}