// instructor-dashboard.js
import { authService } from './auth-service.js';
import { databaseService } from './database-service.js';

class InstructorDashboard {
    constructor() {
        this.user = null;
        this.courses = [];
        this.analytics = {};
        this.initialize();
    }

    async initialize() {
        try {
            // Get current user
            this.user = await authService.getCurrentUser();
            if (!this.user || this.user.userType !== 'instructor') {
                window.location.href = '/login.html';
                return;
            }

            // Initialize dashboard components
            await Promise.all([
                this.loadCourses(),
                this.loadAnalytics(),
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

    async loadCourses() {
        try {
            const coursesSnapshot = await firebase.database()
                .ref('courses')
                .orderByChild('instructorId')
                .equalTo(this.user.uid)
                .once('value');
            
            this.courses = Object.entries(coursesSnapshot.val() || {})
                .map(([id, course]) => ({ id, ...course }));
            
            // Load additional data for each course
            await Promise.all(this.courses.map(async course => {
                const [enrollments, ratings] = await Promise.all([
                    this.loadCourseEnrollments(course.id),
                    this.loadCourseRatings(course.id)
                ]);
                
                course.enrollments = enrollments;
                course.ratings = ratings;
            }));
        } catch (error) {
            console.error('Failed to load courses:', error);
            throw error;
        }
    }

    async loadCourseEnrollments(courseId) {
        const snapshot = await firebase.database()
            .ref(`enrollments/${courseId}`)
            .once('value');
        return snapshot.val() || {};
    }

    async loadCourseRatings(courseId) {
        const snapshot = await firebase.database()
            .ref(`ratings/${courseId}`)
            .once('value');
        return snapshot.val() || {};
    }

    async loadAnalytics() {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);

            const analyticsPromises = this.courses.map(course =>
                databaseService.getAnalytics(course.id, startDate.toISOString(), endDate.toISOString())
            );

            const analyticsResults = await Promise.all(analyticsPromises);
            this.analytics = this.processAnalytics(analyticsResults);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            throw error;
        }
    }

    processAnalytics(analyticsResults) {
        return {
            totalStudents: this.calculateTotalStudents(),
            totalRevenue: this.calculateTotalRevenue(),
            averageRating: this.calculateAverageRating(),
            engagementRate: this.calculateEngagementRate(analyticsResults)
        };
    }

    setupEventListeners() {
        // Course creation
        const createCourseBtn = document.getElementById('createCourseBtn');
        if (createCourseBtn) {
            createCourseBtn.addEventListener('click', () => this.openCreateCourseModal());
        }

        // Course editing
        document.querySelectorAll('.edit-course-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.currentTarget.dataset.courseId;
                this.openEditCourseModal(courseId);
            });
        });

        // Analytics filters
        const analyticsFilters = document.querySelectorAll('.analytics-filter');
        analyticsFilters.forEach(filter => {
            filter.addEventListener('change', () => this.updateAnalyticsDisplay());
        });
    }

    setupRealTimeListeners() {
        // Listen for new enrollments
        this.courses.forEach(course => {
            firebase.database()
                .ref(`enrollments/${course.id}`)
                .on('child_added', (snapshot) => {
                    this.handleNewEnrollment(course.id, snapshot.val());
                });

            // Listen for rating changes
            firebase.database()
                .ref(`ratings/${course.id}`)
                .on('child_added', (snapshot) => {
                    this.handleNewRating(course.id, snapshot.val());
                });

            // Listen for course content updates
            firebase.database()
                .ref(`courses/${course.id}`)
                .on('value', (snapshot) => {
                    this.handleCourseUpdate(course.id, snapshot.val());
                });
        });
    }

    updateDashboard() {
        this.updateStats();
        this.updateCoursesList();
        this.updateRecentActivity();
        this.updateAnalyticsCharts();
    }

    updateStats() {
        const stats = {
            totalStudents: this.calculateTotalStudents(),
            activeCourses: this.courses.length,
            totalRevenue: this.calculateTotalRevenue(),
            averageRating: this.calculateAverageRating()
        };

        // Update UI elements
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('activeCourses').textContent = stats.activeCourses;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        document.getElementById('averageRating').textContent = stats.averageRating.toFixed(1);

        // Update growth indicators
        this.updateGrowthIndicators();
    }

    updateCoursesList() {
        const coursesGrid = document.getElementById('coursesGrid');
        if (!coursesGrid) return;

        coursesGrid.innerHTML = this.courses.map(course => this.createCourseCard(course)).join('');
    }

    createCourseCard(course) {
        const enrollmentCount = Object.keys(course.enrollments || {}).length;
        const averageRating = this.calculateCourseRating(course);

        return `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-image">
                    <img src="${course.thumbnailUrl || '/images/default-course.jpg'}" alt="${course.title}">
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-stats">
                        <span>${enrollmentCount} Students</span>
                        <span>• ${averageRating} ⭐</span>
                    </div>
                    <div class="course-actions">
                        <button class="edit-btn" onclick="editCourse('${course.id}')">Edit</button>
                        <button class="view-btn" onclick="viewCourseDetails('${course.id}')">View Details</button>
                    </div>
                </div>
            </div>
        `;
    }

    updateRecentActivity() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        const recentActivities = this.getRecentActivities();
        activityFeed.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-text">${activity.message}</div>
                <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
            </div>
        `).join('');
    }

    updateAnalyticsCharts() {
        this.createEngagementChart();
        this.createRevenueChart();
        this.createEnrollmentChart();
    }

    createEngagementChart() {
        const engagementData = this.prepareEngagementData();
        const chartContainer = document.getElementById('engagementChart');
        if (!chartContainer) return;

        // Implementation would depend on your chosen charting library
        // Example using a hypothetical chart library:
        new LineChart(chartContainer, {
            data: engagementData,
            options: {
                title: 'Student Engagement Over Time',
                xAxis: 'Date',
                yAxis: 'Active Students'
            }
        });
    }

    createRevenueChart() {
        const revenueData = this.prepareRevenueData();
        const chartContainer = document.getElementById('revenueChart');
        if (!chartContainer) return;

        // Implementation for revenue chart
    }

    createEnrollmentChart() {
        const enrollmentData = this.prepareEnrollmentData();
        const chartContainer = document.getElementById('enrollmentChart');
        if (!chartContainer) return;

        // Implementation for enrollment chart
    }

    // Course Management Methods
    async openCreateCourseModal() {
        const modal = document.getElementById('createCourseModal');
        if (!modal) return;

        modal.classList.add('active');
    }

    async handleCourseCreation(formData) {
        try {
            const courseData = {
                title: formData.get('title'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                level: formData.get('level'),
                thumbnailUrl: formData.get('thumbnailUrl'),
                instructorId: this.user.uid,
                createdAt: Date.now()
            };

            await databaseService.createCourse(this.user.uid, courseData);
            this.closeCreateCourseModal();
            await this.loadCourses();
            this.updateDashboard();
        } catch (error) {
            console.error('Failed to create course:', error);
            alert('Failed to create course. Please try again.');
        }
    }

    async openEditCourseModal(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const modal = document.getElementById('editCourseModal');
        if (!modal) return;

        // Populate form fields
        modal.querySelector('#editCourseTitle').value = course.title;
        modal.querySelector('#editCourseDescription').value = course.description;
        modal.querySelector('#editCoursePrice').value = course.price;
        modal.querySelector('#editCourseCategory').value = course.category;
        modal.querySelector('#editCourseLevel').value = course.level;

        modal.classList.add('active');
        modal.dataset.courseId = courseId;
    }

    // Utility Methods
    calculateTotalStudents() {
        return this.courses.reduce((total, course) => 
            total + Object.keys(course.enrollments || {}).length, 0);
    }

    calculateTotalRevenue() {
        return this.courses.reduce((total, course) => {
            const enrollmentCount = Object.keys(course.enrollments || {}).length;
            return total + (course.price * enrollmentCount);
        }, 0);
    }

    calculateAverageRating() {
        const ratings = this.courses.flatMap(course => 
            Object.values(course.ratings || {}).map(r => r.rating)
        );

        if (ratings.length === 0) return 0;
        return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }

    calculateCourseRating(course) {
        const ratings = Object.values(course.ratings || {}).map(r => r.rating);
        if (ratings.length === 0) return 0;
        return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
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

    // Event Handlers
    handleNewEnrollment(courseId, enrollment) {
        // Update local data
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            course.enrollments = course.enrollments || {};
            course.enrollments[enrollment.userId] = enrollment;
            this.updateDashboard();
        }
    }

    handleNewRating(courseId, rating) {
        // Update local data
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            course.ratings = course.ratings || {};
            course.ratings[rating.userId] = rating;
            this.updateDashboard();
        }
    }

    handleCourseUpdate(courseId, updatedCourse) {
        // Update local data
        const index = this.courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updatedCourse };
            this.updateDashboard();
        }
    }

    // Cleanup
    destroy() {
        // Remove real-time listeners
        this.courses.forEach(course => {
            firebase.database().ref(`enrollments/${course.id}`).off();
            firebase.database().ref(`ratings/${course.id}`).off();
            firebase.database().ref(`courses/${course.id}`).off();
        });
    }
}

// Export dashboard class
export default InstructorDashboard;