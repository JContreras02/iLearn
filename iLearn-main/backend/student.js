// Firebase configuration
const firebaseConfig = {
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

// Update Dashboard Section
async function updateDashboard(userData) {
    // Welcome message
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${userData.name}! 👋`;

    // Stats
    const stats = calculateUserStats(userData);
    updateStats(stats);

    // Course Progress
    if (userData.courses) {
        updateCourseProgress(userData.courses);
    }

    // Deadlines
    if (userData.assignments) {
        updateDeadlines(userData.assignments);
    }

    // Recent Activity
    if (userData.activities) {
        updateRecentActivity(userData.activities);
    }

    // Learning Streak
    if (userData.streak) {
        updateLearningStreak(userData.streak);
    }
}

// Update Courses Section
function updateCourses(courses) {
    const courseGrid = document.getElementById('courseGrid');
    courseGrid.innerHTML = '';

    if (!courses || Object.keys(courses).length === 0) {
        courseGrid.innerHTML = '<div class="empty-state">No courses enrolled yet</div>';
        return;
    }

    Object.values(courses).forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-card';
        courseElement.innerHTML = `
            <div class="course-header">
                <img src="${course.imageUrl || '/api/placeholder/400/200'}" alt="${course.name}" class="course-image">
                <span class="course-status ${course.status}">${course.status}</span>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.name}</h3>
                <p class="course-instructor">By ${course.instructor}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>${course.progress}% Complete</span>
                    <span>${course.completedLessons}/${course.totalLessons} Lessons</span>
                </div>
                <div class="course-actions">
                    <button class="action-btn primary">Continue Learning</button>
                    <button class="action-btn secondary">View Materials</button>
                </div>
            </div>
        `;
        courseGrid.appendChild(courseElement);
    });
}

// Update Assignments Section
function updateAssignments(assignments) {
    const assignmentList = document.getElementById('assignmentList');
    assignmentList.innerHTML = '';

    if (!assignments || Object.keys(assignments).length === 0) {
        assignmentList.innerHTML = '<div class="empty-state">No assignments yet</div>';
        return;
    }

    Object.values(assignments).forEach(assignment => {
        const assignmentElement = document.createElement('div');
        assignmentElement.className = 'assignment-card';
        assignmentElement.innerHTML = `
            <div class="assignment-status ${assignment.status}"></div>
            <div class="assignment-info">
                <h3 class="assignment-title">${assignment.title}</h3>
                <p class="assignment-course">${assignment.courseName}</p>
                <div class="assignment-meta">
                    <span class="due-date">${assignment.status === 'pending' ? 'Due: ' + formatDate(assignment.dueDate) : 'Submitted: ' + formatDate(assignment.submittedDate)}</span>
                    <span class="points">Points: ${assignment.points}</span>
                </div>
            </div>
            <div class="assignment-actions">
                ${getAssignmentActions(assignment)}
            </div>
        `;
        assignmentList.appendChild(assignmentElement);
    });
}

// Update Grades Section
function updateGrades(grades, courses) {
    // Update GPA card
    const gpaStats = calculateGPA(grades);
    document.getElementById('overallGPA').textContent = gpaStats.gpa.toFixed(1);
    document.getElementById('termAverage').textContent = `${gpaStats.average}%`;

    // Update course grades
    const gradesContainer = document.getElementById('courseGrades');
    gradesContainer.innerHTML = '';

    if (!grades || Object.keys(grades).length === 0) {
        gradesContainer.innerHTML = '<div class="empty-state">No grades available</div>';
        return;
    }

    Object.entries(grades).forEach(([courseId, grade]) => {
        const course = courses[courseId];
        const gradeElement = document.createElement('div');
        gradeElement.className = 'grade-card';
        gradeElement.innerHTML = `
            <div class="grade-header">
                <h3>${course.name}</h3>
                <span class="grade-badge ${getGradeClass(grade.final)}">${getGradeLetter(grade.final)}</span>
            </div>
            <div class="grade-details">
                ${Object.entries(grade.breakdown).map(([category, value]) => `
                    <div class="grade-item">
                        <span>${category}</span>
                        <span>${value}%</span>
                    </div>
                `).join('')}
            </div>
            <div class="grade-footer">
                <div class="final-grade">
                    <span>Final Grade</span>
                    <span>${grade.final}%</span>
                </div>
                <button class="view-details-btn">View Details</button>
            </div>
        `;
        gradesContainer.appendChild(gradeElement);
    });
}

// Update Calendar Section
function updateCalendar(events) {
    // Update calendar days
    const currentDate = new Date();
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = generateCalendarDays(currentDate, events);

    // Update upcoming events
    const eventList = document.getElementById('upcomingEvents');
    eventList.innerHTML = '';

    if (!events || Object.keys(events).length === 0) {
        eventList.innerHTML = '<div class="empty-state">No upcoming events</div>';
        return;
    }

    const upcomingEvents = Object.values(events)
        .filter(event => new Date(event.date) > currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    upcomingEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-dot ${event.type}"></div>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${formatDate(event.date)}</div>
            </div>
            <button class="event-action">${getEventAction(event.type)}</button>
        `;
        eventList.appendChild(eventElement);
    });
}

// Update Messages Section
function updateMessages(messages, userData) {
    const messageThreads = document.getElementById('messageThreads');
    messageThreads.innerHTML = '';

    if (!messages || Object.keys(messages).length === 0) {
        messageThreads.innerHTML = '<div class="empty-state">No messages yet</div>';
        return;
    }

    Object.values(messages).forEach(thread => {
        const threadElement = document.createElement('div');
        threadElement.className = 'message-thread';
        threadElement.innerHTML = `
            <img src="${thread.avatar || '/api/placeholder/50/50'}" alt="${thread.name}" class="thread-avatar">
            <div class="thread-info">
                <div class="thread-header">
                    <h3>${thread.name}</h3>
                    <span class="thread-time">${formatTimeAgo(thread.lastMessage.timestamp)}</span>
                </div>
                <p class="thread-preview">${thread.lastMessage.content}</p>
            </div>
        `;
        messageThreads.appendChild(threadElement);
    });
}

// Update Settings Section
function updateSettings(userData) {
    // Profile settings
    document.getElementById('settingsName').value = userData.name || '';
    document.getElementById('settingsEmail').value = userData.email || '';
    document.getElementById('settingsPhone').value = userData.phone || '';
    document.getElementById('settingsBio').value = userData.bio || '';
    document.getElementById('settingsLanguage').value = userData.language || 'English';
    document.getElementById('settingsTimezone').value = userData.timezone || 'UTC';

    // Notification settings
    Object.entries(userData.notifications || {}).forEach(([key, value]) => {
        const toggle = document.querySelector(`input[name="notification-${key}"]`);
        if (toggle) toggle.checked = value;
    });
}

// Helper Functions
function calculateUserStats(userData) {
    // Calculate various user statistics
    const stats = {
        activeCourses: 0,
        pendingAssignments: 0,
        averageGrade: 0,
        certificatesEarned: 0
    };

    if (userData.courses) {
        stats.activeCourses = Object.values(userData.courses).filter(c => c.status === 'active').length;
    }

    if (userData.assignments) {
        stats.pendingAssignments = Object.values(userData.assignments).filter(a => a.status === 'pending').length;
    }

    if (userData.grades) {
        const grades = Object.values(userData.grades);
        stats.averageGrade = grades.reduce((acc, g) => acc + g.final, 0) / grades.length;
    }

    if (userData.certificates) {
        stats.certificatesEarned = Object.keys(userData.certificates).length;
    }

    return stats;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(timestamp);
}

function getGradeLetter(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

function getGradeClass(percentage) {
    return getGradeLetter(percentage).toLowerCase();
}

function getAssignmentActions(assignment) {
    switch (assignment.status) {
        case 'pending':
            return '<button class="action-btn primary">Start Assignment</button><button class="action-btn secondary">View Details</button>';
        case 'submitted':
            return '<button class="action-btn secondary">View Submission</button>';
        case 'graded':
            return '<button class="action-btn secondary">View Feedback</button>';
        default:
            return '';
    }
}

function getEventAction(type) {
    switch (type) {
        case 'assignment': return 'View';
        case 'lecture': return 'Join';
        case 'quiz': return 'Start';
        default: return 'View';
    }
}

// Main initialization
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // Get user data
            const userRef = database.ref('users/' + user.uid);
            const snapshot = await userRef.get();
            const userData = snapshot.val() || {};

            // Update all sections
            updateDashboard(userData);
            updateCourses(userData.courses);
            updateAssignments(userData.assignments);
            updateGrades(userData.grades, userData.courses);
            updateCalendar(userData.events);
            updateMessages(userData.messages, userData);
            updateSettings(userData);

            // Setup real-time updates for messages
            const messagesRef = database.ref('users/' + user.uid + '/messages');
            messagesRef.on('value', (snapshot) => {
                updateMessages(snapshot.val(), userData);
            });

        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        window.location.href = 'signin.html';
    }
});

// Event Listeners
document.querySelector('.signout-btn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'signin.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        const sectionId = link.getAttribute('href').substring(1) + '-section';
        document.getElementById(sectionId).classList.add('active');
    });
});

// Handle settings navigation
document.querySelectorAll('.settings-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links and panels
        document.querySelectorAll('.settings-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Show corresponding panel
        const panelId = link.getAttribute('href').substring(1) + '-settings';
        document.getElementById(panelId).classList.add('active');
    });
});