// app.js - Main Application Initialization

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase Auth Observer
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Get user data
        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val();

        // Route to appropriate dashboard based on user type
        if (userData.userType === 'instructor') {
          // Initialize instructor dashboard
          if (window.location.pathname !== '/instructor-dashboard.html') {
            window.location.href = '/instructor-dashboard.html';
          } else {
            new InstructorDashboard(user.uid);
          }
        } else if (userData.userType === 'student') {
          // Initialize student dashboard
          if (window.location.pathname !== '/student-dashboard.html') {
            window.location.href = '/student-dashboard.html';
          } else {
            new StudentDashboard(user.uid);
          }
        }

        // Update last login
        await firebase.database().ref(`users/${user.uid}`).update({
          lastLogin: Date.now()
        });
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('An error occurred. Please try again.');
      }
    } else {
      // User is signed out
      if (!window.location.pathname.includes('/login.html') && 
          !window.location.pathname.includes('/signup.html')) {
        window.location.href = '/login.html';
      }
    }
  });

  // Initialize Forms
  initializeForms();
});

function initializeForms() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await AuthService.signIn(email, password);
        // Auth observer will handle redirect
      } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
      }
    });
  }

  // Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const fullName = document.getElementById('fullName').value;
      const userType = document.querySelector('input[name="accountType"]:checked').value;

      try {
        await AuthService.signUp(email, password, fullName, userType);
        // Auth observer will handle redirect
      } catch (error) {
        console.error('Signup error:', error);
        alert(error.message);
      }
    });
  }

  // Course Creation Form
  const createCourseForm = document.getElementById('createCourseForm');
  if (createCourseForm) {
    createCourseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = firebase.auth().currentUser;
      if (!user) return;

      const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        price: parseFloat(document.getElementById('coursePrice').value),
        category: document.getElementById('courseCategory').value,
        level: document.getElementById('courseLevel').value
      };

      try {
        await DatabaseService.createCourse(user.uid, courseData);
        closeCreateCourseModal();
        location.reload();
      } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
      }
    });
  }
}

// Global Error Handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', {
    message: msg,
    url: url,
    lineNo: lineNo,
    columnNo: columnNo,
    error: error
  });
  
  // Log error to your analytics service here
  
  return false;
};