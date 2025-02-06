// student-dashboard.js
import { authService } from './auth-service.js';
import { databaseService } from './database-service.js';

class StudentDashboard {
    constructor() {
        this.user = null;
        this.courses = [];
        this.notifications = [];
        this.initialize();
    }

    async initialize() {
        try {
            // Get current user
            this.user = await authService.getCurrentUser();
            if (!this.user || this.user.userType !== 'student') {
                window.location.href = '/login.html';
                return;
            }

            // Initialize dashboard components
            await Promise.all([
                this.loadEnrolledCourses(),
                this.loadNotifications(),
                this.setupEventListeners(),
                this.setupRealTimeListeners()
            ]);

            // Update UI
            this.updateDashboard();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            alert('Failed to load dashboard. Please try again.');
        }
    }

    async loadEnrolledCourses() {
        try {
            const enrollmentsSnapshot = await firebase.database()
                .ref('enrollments')
                .orderByChild('userId')
                .equalTo(this.user.uid)
                .once('value');
            
            const enrollments = enrollmentsSnapshot.val() || {};
            
            // Fetch course details for each enrollment
            const coursePromises = Object.entries(enrollments).map(async ([courseId]) => {
                const courseSnapshot = await firebase.database().ref(`courses/${courseId}`).once('value');
                const progressSnapshot = await firebase.database().ref(`progress/${courseId}/${this.user.uid}`).once('value');
                
                return {
                    id: courseId,
                    ...courseSnapshot.val(),
                    progress: progressSnapshot.val() || { percentage: 0 }
                };
            });

            this.courses = await Promise.all(coursePromises);
        } catch (error) {
            console.error('Failed to load courses:', error);
            throw error;
        }
    }

    async loadNotifications() {
        try {
            const notificationsSnapshot = await firebase.database()
                .ref(`notifications/${this.user.uid}`)
                .orderByChild('timestamp')
                .limitToLast(10)
                .once('value');
            
            this.notifications = Object.entries(notificationsSnapshot.val() || {})
                .map(([id, notification]) => ({ id, ...notification }))
                .sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Course navigation
        document.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const courseId = e.currentTarget.dataset.courseId;
                this.navigateToCourse(courseId);
            });
        });

        // Notification handling
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const notificationId = e.currentTarget.dataset.notificationId;
                this.handleNotificationClick(notificationId);
            });
        });

        // Profile menu
        const profileButton = document.getElementById('profileButton');
        if (profileButton) {
            profileButton.addEventListener('click', () => this.toggleProfileMenu());
        }
    }

    setupRealTimeListeners() {
        // Listen for course progress updates
        this.courses.forEach(course => {
            firebase.database()
                .ref(`progress/${course.id}/${this.user.uid}`)
                .on('value', (snapshot) => {
                    this.updateCourseProgress(course.id, snapshot.val());
                });
        });

        // Listen for new notifications
        firebase.database()
            .ref(`notifications/${this.user.uid}`)
            .on('child_added', (snapshot) => {
                this.handleNewNotification(snapshot.val());
            });

        // Listen for assignment updates
        this.courses.forEach(course => {
            firebase.database()
                .ref(`assignments/${course.id}`)
                .on('child_added', (snapshot) => {
                    this.handleNewAssignment(course.id, snapshot.val());
                });
        });
    }

    updateDashboard() {
        this.updateStats();
        this.updateCourseList();
        this.updateNotifications();
        this.updateDeadlines();
    }

    updateStats() {
        // Calculate and update dashboard statistics
        const stats = {
            coursesInProgress: this.courses.filter(c => c.progress.percentage < 100).length,
            completedCourses: this.courses.filter(c => c.progress.percentage === 100).length,
            totalHoursLearned: this.calculateTotalHours(),
            averageScore: this.calculateAverageScore()
        };

        // Update UI elements
        document.getElementById('coursesInProgress').textContent = stats.coursesInProgress;
        document.getElementById('completedCourses').textContent = stats.completedCourses;
        document.getElementById('hoursLearned').textContent = stats.totalHoursLearned;
        document.getElementById('averageScore').textContent = `${stats.averageScore}%`;
    }

    updateCourseList() {
        const coursesList = document.getElementById('activeCoursesGrid');
        if (!coursesList) return;

        coursesList.innerHTML = this.courses
            .filter(course => course.progress.percentage < 100)
            .map(course => this.createCourseCard(course))
            .join('');
    }

    createCourseCard(course) {
        return `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-image" style="background-image: url(${course.thumbnailUrl || '/images/default-course.jpg'})"></div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${course.progress.percentage}%"></div>
                        </div>
                        <span class="progress-text">${course.progress.percentage}% Complete</span>
                    </div>
                    <div class="course-details">
                        <span class="instructor">By ${course.instructorName}</span>
                        <span class="last-accessed">Last accessed: ${this.formatDate(course.progress.lastAccessed)}</span>
                    </div>
                    <button class="btn btn-primary continue-btn">Continue Learning</button>
                </div>
            </div>
        `;
    }

    updateNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        notificationsList.innerHTML = this.notifications
            .map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}" 
                     data-notification-id="${notification.id}">
                    <div class="notification-content">
                        <span class="notification-title">${notification.title}</span>
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${this.formatTimeAgo(notification.timestamp)}</span>
                    </div>
                </div>
            `)
            .join('');
    }

    updateDeadlines() {
        const deadlinesList = document.getElementById('deadlinesList');
        if (!deadlinesList) return;

        const allDeadlines = this.courses.flatMap(course => 
            (course.assignments || [])
                .filter(assignment => !assignment.submitted)
                .map(assignment => ({
                    ...assignment,
                    courseTitle: course.title,
                    courseId: course.id
                }))
        );

        const sortedDeadlines = allDeadlines.sort((a, b) => a.dueDate - b.dueDate);

        deadlinesList.innerHTML = sortedDeadlines
            .map(deadline => `
                <div class="deadline-item">
                    <div class="deadline-header">
                        <span class="deadline-course">${deadline.courseTitle}</span>
                        <span class="deadline-date">${this.formatDate(deadline.dueDate)}</span>
                    </div>
                    <h4 class="deadline-title">${deadline.title}</h4>
                    <p class="deadline-description">${deadline.description}</p>
                    <button class="btn btn-outline" 
                            onclick="window.location.href='/course.html?id=${deadline.courseId}&assignment=${deadline.id}'">
                        View Assignment
                    </button>
                </div>
            `)
            .join('');
    }

    // Utility methods
    calculateTotalHours() {
        return this.courses.reduce((total, course) => {
            const completedLessons = course.progress.completedLessons || [];
            const hoursSpent = completedLessons.reduce((hours, lesson) => hours + (lesson.duration || 0), 0);
            return total + hoursSpent;
        }, 0);
    }

    calculateAverageScore() {
        const scores = this.courses.flatMap(course => 
            (course.assignments || [])
                .filter(assignment => assignment.submitted && assignment.score)
                .map(assignment => assignment.score)
        );

        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'Just now';
    }

    // Navigation methods
    navigateToCourse(courseId) {
        window.location.href = `/course.html?id=${courseId}`;
    }

    async handleNotificationClick(notificationId) {
        await databaseService.markNotificationAsRead(this.user.uid, notificationId);
        this.loadNotifications();
    }

    toggleProfileMenu() {
        const menu = document.getElementById('profileMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    // Cleanup
    destroy() {
        // Remove real-time listeners
        this.courses.forEach(course => {
            firebase.database().ref(`progress/${course.id}/${this.user.uid}`).off();
            firebase.database().ref(`assignments/${course.id}`).off();
        });
        firebase.database().ref(`notifications/${this.user.uid}`).off();
    }
}

// Export dashboard class
export default StudentDashboard;