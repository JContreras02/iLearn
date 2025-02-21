// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Prevent showing multiple error toasts
    if (!window.hasShownError) {
        showToast('An error occurred. Please refresh the page.', 'error');
        window.hasShownError = true;
        setTimeout(() => window.hasShownError = false, 5000);
    }
});

// Add null checks to element selectors
function safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
        return null;
    }
    return element;
}

// Modify DOM operations to use safe selectors
function updateUI(elementId, value) {
    const element = safeQuerySelector(`#${elementId}`);
    if (element) {
        element.textContent = value;
    }
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUZ9JQgfK4tx1dNZTKjpXdujWaazZTEOI",
    authDomain: "ilearn-af4eb.firebaseapp.com",
    databaseURL: "https://ilearn-af4eb-default-rtdb.firebaseio.com",
    projectId: "ilearn-af4eb",
    storageBucket: "ilearn-af4eb.firebasestorage.app",
    messagingSenderId: "291415286107",
    appId: "1:291415286107:web:3d85fef75c10f24d5ffa7e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global state
let currentUser = null;
let currentSection = 'dashboard';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
});

// Authentication Check
function checkAuth() {
    showLoading();
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'signin.html';
            return;
        }

        try {
            // Check if user is an instructor
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.get();
            const userData = snapshot.val();

            if (!userData || userData.role !== 'instructor') {
                await auth.signOut();
                window.location.href = 'signin.html';
                return;
            }

            currentUser = user;
            updateUserDisplay(userData);
            initializeInstructorPortal(userData);
        } catch (error) {
            console.error("Auth check error:", error);
            showToast('Error verifying credentials', 'error');
            window.location.href = 'signin.html';
        } finally {
            hideLoading();
        }
    });
}

// Initialize Instructor Portal
async function initializeInstructorPortal(userData) {
    try {
        // Update profile UI
        updateUserDisplay(userData);
        
        // Set up real-time listeners
        setupDataListeners(userData.uid);
        
        // Load initial dashboard data
        await loadDashboardData(userData.uid);

        // Initialize charts if they exist
        initializeCharts();

    } catch (error) {
        console.error("Error initializing portal:", error);
        showToast('Error loading portal data', 'error');
    }
}

// Update User Display
function updateUserDisplay(userData) {
    // Update sidebar profile
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${userData.name}! 👋`;

    // Update profile image if exists
    if (userData.avatar) {
        document.getElementById('userProfileImage').src = userData.avatar;
    }
}

// Setup Real-time Data Listeners
function setupDataListeners(userId) {
    // Courses Listener
    const coursesRef = database.ref(`courses/${userId}`);
    coursesRef.on('value', snapshot => {
        updateCoursesList(snapshot.val());
    });

    // Students Listener
    const studentsRef = database.ref(`instructorStudents/${userId}`);
    studentsRef.on('value', snapshot => {
        updateStudentsList(snapshot.val());
    });

    // Notifications Listener
    const notificationsRef = database.ref(`instructorNotifications/${userId}`);
    notificationsRef.on('value', snapshot => {
        updateNotifications(snapshot.val());
    });

    // Analytics Listener
    const analyticsRef = database.ref(`instructorAnalytics/${userId}`);
    analyticsRef.on('value', snapshot => {
        updateAnalytics(snapshot.val());
    });

    // Discussions Listener
    const discussionsRef = database.ref(`instructorDiscussions/${userId}`);
    discussionsRef.on('value', snapshot => {
        updateDiscussionsList(snapshot.val());
    });

    // Earnings Listener
    const earningsRef = database.ref(`instructorEarnings/${userId}`);
    earningsRef.on('value', snapshot => {
        updateEarningsDisplay(snapshot.val());
    });
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });

    // Sign Out
    document.querySelector('.signout-btn').addEventListener('click', handleSignOut);

    // Form Submissions
    document.getElementById('createCourseForm')?.addEventListener('submit', handleCourseSubmit);
    document.getElementById('announcementForm')?.addEventListener('submit', handleAnnouncementSubmit);
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('withdrawalForm')?.addEventListener('submit', handleWithdrawal);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Dashboard Functions
async function loadDashboardData(userId) {
    showLoading();
    try {
        const statsRef = database.ref(`instructorStats/${userId}`);
        const activityRef = database.ref(`instructorActivity/${userId}`).limitToLast(5);
        const reviewsRef = database.ref(`instructorReviews/${userId}`).limitToLast(3);

        const [stats, activity, reviews] = await Promise.all([
            statsRef.get(),
            activityRef.get(),
            reviewsRef.get()
        ]);

        updateDashboardStats(stats.val() || {});
        updateRecentActivity(activity.val() || {});
        updateRecentReviews(reviews.val() || {});

        // Update student engagement
        const engagementRef = database.ref(`instructorEngagement/${userId}`);
        const engagement = await engagementRef.get();
        updateStudentEngagement(engagement.val() || {});

    } catch (error) {
        console.error("Error loading dashboard:", error);
        showToast('Error loading dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(stats) {
    // Update stats cards
    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('activeCourses').textContent = stats.activeCourses || 0;
    document.getElementById('monthlyEarnings').textContent = formatCurrency(stats.monthlyEarnings || 0);
    document.getElementById('averageRating').textContent = stats.averageRating?.toFixed(1) || '0.0';

    // Update completion and submission rates
    document.getElementById('completionRate').textContent = `${stats.completionRate || 0}%`;
    document.getElementById('submissionRate').textContent = `${stats.submissionRate || 0}%`;
}

function updateRecentActivity(activities) {
    const activityList = document.getElementById('courseActivityList');
    
    if (!activities || Object.keys(activities).length === 0) {
        activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }

    activityList.innerHTML = Object.entries(activities)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .map(([id, activity]) => `
            <div class="activity-item">
                <div class="activity-info">
                    <h3>${activity.courseName}</h3>
                    <p>${activity.description}</p>
                    <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
                </div>
                <button class="action-btn" onclick="viewCourseDetails('${activity.courseId}')">
                    View Details
                </button>
            </div>
        `).join('');
}

function updateRecentReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (!reviews || Object.keys(reviews).length === 0) {
        reviewsList.innerHTML = '<div class="empty-state">No reviews yet</div>';
        return;
    }

    reviewsList.innerHTML = Object.entries(reviews)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .map(([id, review]) => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                    <span class="review-date">${formatTimeAgo(review.timestamp)}</span>
                </div>
                <p class="review-text">"${review.comment}"</p>
                <span class="review-course">${review.courseName}</span>
            </div>
        `).join('');
}

function updateStudentEngagement(engagement) {
    const engagementStats = document.getElementById('engagementStats');
    
    if (!engagement) {
        return;
    }

    // Update engagement metrics
    engagementStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-percentage">${engagement.completionRate || 0}%</span>
            <span class="stat-description">Course Completion Rate</span>
        </div>
        <div class="stat-item">
            <span class="stat-percentage">${engagement.submissionRate || 0}%</span>
            <span class="stat-description">Assignment Submission Rate</span>
        </div>
    `;
}

// Course Management Functions
async function loadCoursesData(userId) {
    showLoading();
    try {
        const coursesRef = database.ref(`courses/${userId}`);
        const snapshot = await coursesRef.get();
        updateCoursesList(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading courses:", error);
        showToast('Error loading courses', 'error');
    } finally {
        hideLoading();
    }
}

function updateCoursesList(courses) {
    const courseList = document.getElementById('courseList');
    
    if (!courses || Object.keys(courses).length === 0) {
        courseList.innerHTML = `
            <div class="empty-state">
                <h3>No Courses Yet</h3>
                <p>Start by creating your first course!</p>
                <button class="btn-primary" onclick="handleCreateCourse()">Create Course</button>
            </div>
        `;
        return;
    }

    courseList.innerHTML = Object.entries(courses)
        .map(([id, course]) => createCourseElement(id, course))
        .join('');
}

function createCourseElement(id, course) {
    return `
        <div class="course-item" data-status="${course.status}" data-course-id="${id}">
            <div class="course-thumbnail">
                <img src="${course.thumbnail || '/api/placeholder/300/200'}" 
                     alt="${course.title}" class="course-image">
                <span class="course-status ${course.status}">${course.status}</span>
            </div>
            <div class="course-details">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta">
                        <span>📚 ${course.lessons || 0} Lessons</span>
                        <span>⏱️ ${course.duration || 0} Hours</span>
                        <span>👥 ${course.enrollments || 0} Students</span>
                    </div>
                </div>
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-label">Rating</span>
                        <span class="stat-value">⭐ ${course.rating || 0} (${course.reviews || 0})</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Revenue</span>
                        <span class="stat-value">${formatCurrency(course.revenue || 0)}</span>
                    </div>
                </div>
            </div>
            <div class="course-actions">
                <button class="action-btn" onclick="editCourse('${id}')">
                    Edit Course
                </button>
                <button class="action-btn" onclick="viewCourse('${id}')">
                    View Content
                </button>
                <div class="action-dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="previewCourse('${id}'); return false;">Preview</a>
                        <a href="#" onclick="duplicateCourse('${id}'); return false;">Duplicate</a>
                        <a href="#" onclick="archiveCourse('${id}'); return false;" 
                           class="text-warning">Archive</a>
                        <a href="#" onclick="deleteCourse('${id}'); return false;" 
                           class="text-danger">Delete</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// Course Actions
async function handleCreateCourse() {
    // Reset form
    document.getElementById('createCourseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('courseModalTitle').textContent = 'Create New Course';
    openModal('createCourseModal');
}

async function handleCourseSubmit(event) {
    event.preventDefault();
    if (!currentUser) return;

    showLoading();
    try {
        const formData = new FormData(event.target);
        const courseData = Object.fromEntries(formData);
        const courseId = courseData.courseId;
        delete courseData.courseId;

        if (courseId) {
            await updateCourse(courseId, courseData);
        } else {
            await createCourse(courseData);
        }

        closeModal('createCourseModal');
        showToast(courseId ? 'Course updated successfully!' : 'Course created successfully!', 'success');
    } catch (error) {
        console.error("Course submission error:", error);
        showToast('Error saving course', 'error');
    } finally {
        hideLoading();
    }
}

function uploadThumbnail(file) {
    // Code to handle uploading the thumbnail.
    // This is just a placeholder. You need to implement the actual file upload logic here.
    console.log("Uploading thumbnail:", file);
    return Promise.resolve('https://some-cloud-storage/path/to/image.jpg')
  }
  
  function createCourse(courseData) {
    // ... other code
    // Call uploadThumbnail here, for example:
    const thumbnailPromise = uploadThumbnail(courseData.thumbnail); // Assumes courseData has a thumbnail property.
  
    thumbnailPromise.then((thumbnailUrl) => {
      console.log('Thumbnail url', thumbnailUrl);
      // Do something with the result of the promise. For example,
      // save the course information along with the new thumbnail URL.
    })
    .catch((error) => {
      console.log('Could not upload thumbnail', error);
    })
    // ... rest of the createCourse code
  }
  

async function createCourse(courseData) {
    const coursesRef = database.ref(`courses/${currentUser.uid}`);
    const newCourse = coursesRef.push();
    
    // Handle thumbnail upload if exists
    let thumbnailUrl = null;
    if (courseData.thumbnail instanceof File) {
        thumbnailUrl = await uploadThumbnail(courseData.thumbnail);
    }

    await newCourse.set({
        ...courseData,
        thumbnail: thumbnailUrl,
        status: 'draft',
        enrollments: 0,
        rating: 0,
        reviews: 0,
        revenue: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
}

async function updateCourse(courseId, courseData) {
    const courseRef = database.ref(`courses/${currentUser.uid}/${courseId}`);
    
    // Handle thumbnail upload if exists
    if (courseData.thumbnail instanceof File) {
        courseData.thumbnail = await uploadThumbnail(courseData.thumbnail);
    }

    await courseRef.update({
        ...courseData,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
}

async function editCourse(courseId) {
    if (!currentUser) return;

    showLoading();
    try {
        const courseRef = database.ref(`courses/${currentUser.uid}/${courseId}`);
        const snapshot = await courseRef.get();
        const courseData = snapshot.val();

        if (!courseData) {
            showToast('Course not found', 'error');
            return;
        }

        // Fill form with course data
        document.getElementById('courseId').value = courseId;
        document.getElementById('courseTitle').value = courseData.title;
        document.getElementById('courseDescription').value = courseData.description;
        document.getElementById('courseCategory').value = courseData.category;
        document.getElementById('coursePrice').value = courseData.price;

        // Update modal title
        document.getElementById('courseModalTitle').textContent = 'Edit Course';
        openModal('createCourseModal');
    } catch (error) {
        console.error("Error loading course:", error);
        showToast('Error loading course data', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteCourse(courseId) {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }

    showLoading();
    try {
        const courseRef = database.ref(`courses/${currentUser.uid}/${courseId}`);
        const snapshot = await courseRef.get();
        const courseData = snapshot.val();

        if (courseData.enrollments > 0) {
            // Archive instead of delete if there are enrolled students
            await courseRef.update({
                status: 'archived',
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            showToast('Course archived successfully', 'success');
        } else {
            await courseRef.remove();
            showToast('Course deleted successfully', 'success');
        }
    } catch (error) {
        console.error("Error deleting course:", error);
        showToast('Error deleting course', 'error');
    } finally {
        hideLoading();
    }
}

// Student Management Functions
async function loadStudentsData(userId) {
    showLoading();
    try {
        const studentsRef = database.ref(`instructorStudents/${userId}`);
        const snapshot = await studentsRef.get();
        updateStudentsList(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading students:", error);
        showToast('Error loading students', 'error');
    } finally {
        hideLoading();
    }
}

function updateStudentsList(students) {
    const tbody = document.getElementById('studentsTableBody');
    
    if (!students || Object.keys(students).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-content">
                        <h3>No Students Yet</h3>
                        <p>Students will appear here when they enroll in your courses</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = Object.entries(students)
        .map(([id, student]) => createStudentRow(id, student))
        .join('');
}

function createStudentRow(id, student) {
    return `
        <tr class="student-row" data-student-id="${id}" data-status="${student.status}">
            <td>
                <input type="checkbox" class="select-student" />
            </td>
            <td>
                <div class="student-info">
                    <img src="${student.avatar || '/api/placeholder/40/40'}" 
                         alt="${student.name}" class="student-avatar" />
                    <div>
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="course-info">
                    <div class="course-name">${student.courseName}</div>
                    <div class="enrollment-date">
                        Enrolled: ${formatDate(student.enrollmentDate)}
                    </div>
                </div>
            </td>
            <td>
                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${student.progress}%"></div>
                    </div>
                    <span>${student.progress}% Complete</span>
                </div>
            </td>
            <td>
                <div class="activity-info">
                    <span class="activity-time">${formatTimeAgo(student.lastActive)}</span>
                    <span class="activity-status ${student.status}">${student.status}</span>
                </div>
            </td>
            <td>
                <div class="performance-info">
                    <div class="grade">${student.grade}</div>
                    <div class="assignment-status">${student.assignmentStatus}</div>
                </div>
            </td>
            <td>
                <div class="row-actions">
                    <button class="action-btn" onclick="viewStudentProgress('${id}')">
                        View Progress
                    </button>
                    <div class="action-dropdown">
                        <button class="dropdown-btn" onclick="toggleDropdown(this)">⋮</button>
                        <div class="dropdown-content">
                            <a href="#" onclick="sendMessage('${id}'); return false;">
                                Send Message
                            </a>
                            <a href="#" onclick="viewAssignments('${id}'); return false;">
                                View Assignments
                            </a>
                            <a href="#" onclick="downloadReport('${id}'); return false;">
                                Download Report
                            </a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

// Assignments Functions
async function loadAssignmentsData(userId) {
    showLoading();
    try {
        const assignmentsRef = database.ref(`assignments/${userId}`);
        const snapshot = await assignmentsRef.get();
        updateAssignmentsList(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading assignments:", error);
        showToast('Error loading assignments', 'error');
    } finally {
        hideLoading();
    }
}

function updateAssignmentsList(assignments) {
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    
    if (!assignments || Object.keys(assignments).length === 0) {
        assignmentsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Assignments Yet</h3>
                <p>Create your first assignment</p>
                <button class="btn-primary" onclick="openModal('createAssignmentModal')">
                    Create Assignment
                </button>
            </div>
        `;
        return;
    }

    assignmentsGrid.innerHTML = Object.entries(assignments)
        .map(([id, assignment]) => createAssignmentCard(id, assignment))
        .join('');
}

function createAssignmentCard(id, assignment) {
    return `
        <div class="assignment-card" 
             data-id="${id}" 
             data-status="${assignment.status}" 
             data-type="${assignment.type}">
            <div class="assignment-header">
                <span class="assignment-type ${assignment.type}">${assignment.type}</span>
                <div class="assignment-actions">
                    <button class="icon-btn" onclick="editAssignment('${id}')">✏️</button>
                    <button class="icon-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="duplicateAssignment('${id}'); return false;">Duplicate</a>
                        <a href="#" onclick="previewAssignment('${id}'); return false;">Preview</a>
                        <a href="#" onclick="archiveAssignment('${id}'); return false;" 
                           class="text-warning">Archive</a>
                        <a href="#" onclick="deleteAssignment('${id}'); return false;" 
                           class="text-danger">Delete</a>
                    </div>
                </div>
            </div>
            <h3 class="assignment-title">${assignment.title}</h3>
            <div class="assignment-meta">
                <span class="course-name">${assignment.courseName}</span>
                <span class="points">${assignment.points} points</span>
            </div>
            <div class="assignment-dates">
                <div class="date-item">
                    <span class="date-label">Due Date</span>
                    <span class="date-value">${formatDate(assignment.dueDate)}</span>
                </div>
                <div class="date-item">
                    <span class="date-label">Published</span>
                    <span class="date-value">${formatDate(assignment.publishDate)}</span>
                </div>
            </div>
            <div class="submission-stats">
                <div class="stat-item">
                    <span class="stat-value">${assignment.submittedCount}/${assignment.totalStudents}</span>
                    <span class="stat-label">Submitted</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${assignment.gradedCount}</span>
                    <span class="stat-label">Graded</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${assignment.averageScore}%</span>
                    <span class="stat-label">Avg. Score</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn" onclick="gradeAssignments('${id}')">
                    Grade Submissions
                </button>
                <button class="action-btn" onclick="viewAssignmentDetails('${id}')">
                    View Details
                </button>
            </div>
        </div>
    `;
}

// Analytics Functions
async function loadAnalyticsData(userId) {
    showLoading();
    try {
        const timeRange = document.getElementById('timeRangeSelect').value || '30';
        const analyticsRef = database.ref(`instructorAnalytics/${userId}/last${timeRange}Days`);
        const snapshot = await analyticsRef.get();
        updateAnalytics(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading analytics:", error);
        showToast('Error loading analytics', 'error');
    } finally {
        hideLoading();
    }
}

function updateAnalytics(data) {
    // Update overview stats
    updateAnalyticsOverview(data.overview || {});
    
    // Update revenue chart
    updateRevenueChart(data.revenue || {});
    
    // Update course performance
    updateCoursePerformance(data.coursePerformance || {});
    
    // Update student engagement
    updateEngagementMetrics(data.engagement || {});
}

function updateAnalyticsOverview(overview) {
    const analyticsOverview = document.getElementById('analyticsOverview');
    
    analyticsOverview.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <h3>Total Revenue</h3>
                <span class="trend ${overview.revenueTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.revenueTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.revenueTrend)}%
                </span>
            </div>
            <div class="stat-value">${formatCurrency(overview.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Active Students</h3>
                <span class="trend ${overview.studentsTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.studentsTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.studentsTrend)}%
                </span>
            </div>
            <div class="stat-value">${overview.activeStudents || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Course Completion</h3>
                <span class="trend ${overview.completionTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.completionTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.completionTrend)}%
                </span>
            </div>
            <div class="stat-value">${overview.completionRate || 0}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Average Rating</h3>
                <span class="trend ${overview.ratingTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.ratingTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.ratingTrend)}%
                </span>
            </div>
            <div class="stat-value">${overview.averageRating?.toFixed(1) || '0.0'}</div>
        </div>
    `;
}

// Discussions Functions
async function loadDiscussionsData(userId) {
    showLoading();
    try {
        const discussionsRef = database.ref(`instructorDiscussions/${userId}`);
        const snapshot = await discussionsRef.get();
        updateDiscussionsList(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading discussions:", error);
        showToast('Error loading discussions', 'error');
    } finally {
        hideLoading();
    }
}

function updateDiscussionsList(discussions) {
    // Update pinned topics
    const pinnedTopicsList = document.getElementById('pinnedTopicsList');
    const pinnedTopics = Object.entries(discussions)
        .filter(([_, discussion]) => discussion.pinned);
    
    if (pinnedTopics.length === 0) {
        pinnedTopicsList.innerHTML = '<div class="empty-state">No pinned topics</div>';
    } else {
        pinnedTopicsList.innerHTML = pinnedTopics
            .map(([id, discussion]) => createDiscussionCard(id, discussion, true))
            .join('');
    }

    // Update recent discussions
    const recentDiscussionsList = document.getElementById('recentDiscussionsList');
    const recentDiscussions = Object.entries(discussions)
        .filter(([_, discussion]) => !discussion.pinned)
        .sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    if (recentDiscussions.length === 0) {
        recentDiscussionsList.innerHTML = '<div class="empty-state">No recent discussions</div>';
    } else {
        recentDiscussionsList.innerHTML = recentDiscussions
            .map(([id, discussion]) => createDiscussionCard(id, discussion, false))
            .join('');
    }
}

// Earnings Functions
async function loadEarningsData(userId) {
    showLoading();
    try {
        const earningsRef = database.ref(`instructorEarnings/${userId}`);
        const snapshot = await earningsRef.get();
        updateEarningsDisplay(snapshot.val() || {});
    } catch (error) {
        console.error("Error loading earnings:", error);
        showToast('Error loading earnings data', 'error');
    } finally {
        hideLoading();
    }
}

function updateEarningsDisplay(earnings) {
    // Update total earnings
    document.getElementById('totalEarnings').textContent = formatCurrency(earnings.total || 0);

    // Update earnings trend
    const trendElement = document.getElementById('earningsTrend');
    const trend = earnings.trend || 0;
    trendElement.innerHTML = `
        <span class="trend-icon">${trend >= 0 ? '↑' : '↓'}</span>
        <span class="trend-value">${Math.abs(trend)}%</span>
        <span class="trend-label">vs last period</span>
    `;
    trendElement.className = `earnings-trend ${trend >= 0 ? 'positive' : 'negative'}`;

    // Update pending payout
    document.getElementById('pendingPayout').textContent = formatCurrency(earnings.pending || 0);
    document.getElementById('payoutDate').textContent = 
        `Next payout: ${formatDate(earnings.nextPayoutDate)}`;

    // Update course revenue list
    updateCourseRevenueList(earnings.courseRevenue || {});

    // Update earnings chart
    updateEarningsChart(earnings.history || {});
}

function updateCourseRevenueList(courseRevenue) {
    const revenueList = document.getElementById('courseRevenueList');
    
    if (!courseRevenue || Object.keys(courseRevenue).length === 0) {
        revenueList.innerHTML = '<div class="empty-state">No revenue data available</div>';
        return;
    }

    revenueList.innerHTML = Object.entries(courseRevenue)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([id, data]) => `
            <div class="course-revenue-item">
                <div class="course-info">
                    <div class="course-name">${data.title}</div>
                    <div class="course-stats">
                        <span>${data.students} Students</span>
                        <span>•</span>
                        <span>${data.rating} ★</span>
                    </div>
                </div>
                <div class="revenue-info">
                    <div class="revenue-amount">${formatCurrency(data.revenue)}</div>
                    <div class="revenue-trend ${data.trend >= 0 ? 'positive' : 'negative'}">
                        ${data.trend >= 0 ? '+' : ''}${data.trend}%
                    </div>
                </div>
            </div>
        `).join('');
}

function updateEarningsChart(history) {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    const dates = Object.keys(history).sort();
    const revenues = dates.map(date => history[date]);

    if (window.earningsChart) {
        window.earningsChart.destroy();
    }

    window.earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => formatDate(date)),
            datasets: [{
                label: 'Revenue',
                data: revenues,
                borderColor: '#4993ee',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return formatDate(timestamp);
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function toggleDropdown(button) {
    const dropdown = button.nextElementSibling;
    dropdown.classList.toggle('active');

    // Close other dropdowns
    document.querySelectorAll('.dropdown-content').forEach(content => {
        if (content !== dropdown) {
            content.classList.remove('active');
        }
    });
}

// Handle sign out
function handleSignOut() {
    auth.signOut()
        .then(() => {
            window.location.href = 'signin.html';
        })
        .catch((error) => {
            console.error("Sign out error:", error);
            showToast('Error signing out', 'error');
        });
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An error occurred. Please refresh the page.', 'error');
});

// Connection status
window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
    location.reload();
});

window.addEventListener('offline', () => {
    showToast('Connection lost. Some features may be unavailable.', 'error');
});


// Authentication Check
function checkAuth() {
    showLoading();
    auth.onAuthStateChanged(async (user) => {
        try {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // Check if user is an instructor
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.get();
            const userData = snapshot.val();

            if (!userData || userData.role !== 'instructor') {
                // Not an instructor
                await auth.signOut();
                window.location.href = 'login.html';
                return;
            }

            // User is authenticated and is an instructor
            currentUser = user;
            await updateUserDisplay(userData);
            await initializeInstructorPortal(userData);
        } catch (error) {
            console.error("Auth check error:", error);
            showToast('Error verifying credentials', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Initialize Instructor Portal
async function initializeInstructorPortal(userData) {
    try {
        // Update profile UI
        await updateUserDisplay(userData);
        
        // Set up real-time listeners
        setupDataListeners(userData.uid);
        
        // Load initial dashboard data
        await loadDashboardData(userData.uid);
    } catch (error) {
        console.error("Error initializing portal:", error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Update User Display
async function updateUserDisplay(userData) {
    if (!userData) return;
    
    // Update profile elements if they exist
    const profileElements = {
        'userName': userData.name,
        'userEmail': userData.email,
        'welcomeMessage': `Welcome back, ${userData.name}! 👋`
    };

    for (const [id, value] of Object.entries(profileElements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // Update profile image if exists
    if (userData.avatar) {
        const profileImage = document.getElementById('userProfileImage');
        if (profileImage) profileImage.src = userData.avatar;
    }
}

// Section Navigation Function
function switchSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected section and nav link
    const selectedSection = document.getElementById(`${sectionId}-section`);
    const selectedLink = document.querySelector(`[href="#${sectionId}"]`);
    
    if (selectedSection) selectedSection.classList.add('active');
    if (selectedLink) selectedLink.classList.add('active');
    
    currentSection = sectionId;

    // Load section-specific data
    loadSectionData(sectionId);
}

// Settings Tab Function
function switchSettingsTab(tabId) {
    // Remove active class from all panels and links
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.settings-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected panel and link
    const selectedPanel = document.getElementById(`${tabId}-settings`);
    const selectedLink = document.querySelector(`[href="#${tabId}"]`);
    
    if (selectedPanel) selectedPanel.classList.add('active');
    if (selectedLink) selectedLink.classList.add('active');
}

// Announcement Submit Handler
function handleAnnouncementSubmit(event) {
    event.preventDefault();
    if (!currentUser) return;

    showLoading();
    try {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);
        
        // Create announcement
        const announcementRef = database.ref(`instructorAnnouncements/${currentUser.uid}`).push();
        
        announcementRef.set({
            ...data,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            author: {
                id: currentUser.uid,
                name: currentUser.displayName || 'Instructor'
            }
        });

        showToast('Announcement posted successfully!', 'success');
        closeModal('createAnnouncementModal');
        event.target.reset();
    } catch (error) {
        console.error('Error posting announcement:', error);
        showToast('Error posting announcement', 'error');
    } finally {
        hideLoading();
    }
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });

    // Settings navigation event listeners
    document.querySelectorAll('.settings-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('href').substring(1);
            switchSettingsTab(tabId);
        });
    });

    // Check authentication status
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Check if user is an instructor
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.get();
            const userData = snapshot.val();

            if (!userData || userData.role !== 'instructor') {
                await auth.signOut();
                window.location.href = 'login.html';
                return;
            }

            currentUser = user;
            initializeInstructorPortal(userData);
        } catch (error) {
            console.error('Auth check error:', error);
            showToast('Error verifying credentials', 'error');
            window.location.href = 'login.html';
        }
    });
});


function handleAvatarUpload(event) {
    // Get the file from the input.
    const file = event.target.files[0];
  
    // Basic error handling - ensure file is selected.
    if (!file) {
      console.error("No file selected.");
      return;
    }
  
    // Add your file handling logic here.
    console.log("File selected:", file);
    // Example: You could now upload the file to a server or display a preview.
  }