// Initialize Firebase Auth and Database
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const courseGrid = document.querySelector('.course-grid');
const activityList = document.querySelector('.activity-list');
const userNameElement = document.querySelector('.user-name');
const userAvatar = document.querySelector('.user-profile img');

// Check Authentication State
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadUserData(user);
        loadUserCourses(user.uid);
        loadUserActivities(user.uid);
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});

// Load User Data
async function loadUserData(user) {
    try {
        const userRef = database.ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData) {
            userNameElement.textContent = userData.name || 'Student';
            if (userData.photoURL) {
                userAvatar.src = userData.photoURL;
            }
            updateStatistics(userData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load user data');
    }
}

// Load User's Courses
async function loadUserCourses(userId) {
    try {
        const enrollmentsRef = database.ref(`enrollments/${userId}`);
        const snapshot = await enrollmentsRef.once('value');
        const enrollments = snapshot.val() || {};

        courseGrid.innerHTML = ''; // Clear existing courses

        for (const courseId in enrollments) {
            const courseRef = database.ref(`courses/${courseId}`);
            const courseSnapshot = await courseRef.once('value');
            const courseData = courseSnapshot.val();

            if (courseData) {
                const progress = enrollments[courseId].progress || 0;
                addCourseCard(courseData, progress);
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Create Course Card
function addCourseCard(course, progress) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
        <img src="${course.thumbnail || '../assets/course-placeholder.jpg'}" alt="${course.title}">
        <div class="course-info">
            <h3>${course.title}</h3>
            <p>${course.instructor}</p>
            <div class="course-progress">
                <div class="progress-text">
                    <span>Progress</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-value" style="width: ${progress}%"></div>
                </div>
            </div>
            <a href="course.html?id=${course.id}" class="btn-primary mt-3">Continue Learning</a>
        </div>
    `;
    courseGrid.appendChild(card);
}

// Load User Activities
async function loadUserActivities(userId) {
    try {
        const activitiesRef = database.ref(`activities/${userId}`).orderByChild('timestamp').limitToLast(5);
        const snapshot = await activitiesRef.once('value');
        const activities = snapshot.val() || {};

        activityList.innerHTML = ''; // Clear existing activities

        Object.entries(activities)
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .forEach(([id, activity]) => {
                addActivityItem(activity);
            });
    } catch (error) {
        console.error('Error loading activities:', error);
        showError('Failed to load activities');
    }
}

// Create Activity Item
function addActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon">
            <i class="icon-${activity.type}"></i>
        </div>
        <div class="activity-content">
            <p>${activity.description}</p>
            <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
        </div>
    `;
    activityList.appendChild(item);
}

// Update Statistics
function updateStatistics(userData) {
    const statsRef = database.ref(`statistics/${userData.uid}`);
    statsRef.once('value').then((snapshot) => {
        const stats = snapshot.val() || {};
        
        document.querySelector('.stat-card:nth-child(1) .stat-number')
            .textContent = stats.coursesInProgress || 0;
        document.querySelector('.stat-card:nth-child(2) .stat-number')
            .textContent = stats.completedCourses || 0;
        document.querySelector('.stat-card:nth-child(3) .stat-number')
            .textContent = stats.certificatesEarned || 0;
    });
}

// Utility Functions
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.dashboard-content');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Mobile Navigation Toggle
const mobileNavToggle = document.createElement('button');
mobileNavToggle.className = 'mobile-nav-toggle';
mobileNavToggle.innerHTML = '<i class="icon-menu"></i>';
document.body.appendChild(mobileNavToggle);

mobileNavToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
});

// Search Functionality
const searchInput = document.querySelector('.header-search input');
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const instructor = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || instructor.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Notifications
const notificationsIcon = document.querySelector('.notifications');
notificationsIcon.addEventListener('click', () => {
    // Implementation for notifications panel
    console.log('Notifications clicked');
});

// Handle Profile Click
const userProfile = document.querySelector('.user-profile');
userProfile.addEventListener('click', () => {
    // Implementation for profile menu
    console.log('Profile clicked');
});

// Listen for real-time updates
function setupRealtimeListeners(userId) {
    // Listen for new activities
    database.ref(`activities/${userId}`).on('child_added', (snapshot) => {
        const activity = snapshot.val();
        addActivityItem(activity);
    });

    // Listen for course progress updates
    database.ref(`enrollments/${userId}`).on('child_changed', (snapshot) => {
        const enrollment = snapshot.val();
        const courseId = snapshot.key;
        updateCourseProgress(courseId, enrollment.progress);
    });
}

function updateCourseProgress(courseId, progress) {
    const courseCard = document.querySelector(`[data-course-id="${courseId}"]`);
    if (courseCard) {
        const progressBar = courseCard.querySelector('.progress-value');
        const progressText = courseCard.querySelector('.progress-text span:last-child');
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    }
}