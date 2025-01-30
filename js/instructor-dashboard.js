// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// DOM Elements
const courseGrid = document.getElementById('courseGrid');
const courseModal = document.getElementById('courseModal');
const courseForm = document.getElementById('courseForm');
const createCourseBtn = document.getElementById('createCourse');
const saveCourseBtn = document.getElementById('saveCourse');
const modalCloseBtn = document.querySelector('.modal-close');
const filterSelect = document.querySelector('.filter-select');

// Chart.js Configuration
let analyticsChart;

// Check Authentication State
auth.onAuthStateChanged((user) => {
    if (user) {
        checkInstructorRole(user.uid);
        loadInstructorData(user);
        setupRealtimeListeners(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

// Check if user is an instructor
async function checkInstructorRole(uid) {
    try {
        const snapshot = await database.ref(`users/${uid}`).once('value');
        const userData = snapshot.val();
        if (!userData || userData.role !== 'instructor') {
            window.location.href = 'student-dashboard.html';
        }
    } catch (error) {
        console.error('Error checking instructor role:', error);
        showError('Authentication error');
    }
}

// Load Instructor Data
async function loadInstructorData(user) {
    try {
        const userRef = database.ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData) {
            document.querySelector('.user-name').textContent = userData.name || 'Instructor';
            if (userData.photoURL) {
                document.querySelector('.user-profile img').src = userData.photoURL;
            }

            loadCourses(user.uid);
            loadAnalytics(user.uid);
            loadReviews(user.uid);
            loadStudentActivities(user.uid);
        }
    } catch (error) {
        console.error('Error loading instructor data:', error);
        showError('Failed to load instructor data');
    }
}

// Load Instructor's Courses
async function loadCourses(instructorId) {
    try {
        const coursesRef = database.ref('courses').orderByChild('instructorId').equalTo(instructorId);
        const snapshot = await coursesRef.once('value');
        const courses = snapshot.val() || {};

        courseGrid.innerHTML = ''; // Clear existing courses

        Object.entries(courses).forEach(([id, course]) => {
            addCourseCard(id, course);
        });

        updateStatistics(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Create Course Card
function addCourseCard(id, course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.courseId = id;
    card.innerHTML = `
        <img src="${course.thumbnail || '../assets/course-placeholder.jpg'}" alt="${course.title}">
        <div class="course-info">
            <div class="course-header">
                <h3>${course.title}</h3>
                <span class="badge ${course.status === 'published' ? 'badge-success' : 'badge-warning'}">
                    ${course.status}
                </span>
            </div>
            <p class="course-stats">
                <span><i class="icon-users"></i> ${course.enrollments || 0} students</span>
                <span><i class="icon-star"></i> ${course.rating || 0}</span>
            </p>
            <div class="course-actions">
                <button class="btn-outline btn-sm" onclick="editCourse('${id}')">Edit</button>
                <button class="btn-primary btn-sm" onclick="manageCourse('${id}')">Manage</button>
            </div>
        </div>
    `;
    courseGrid.appendChild(card);
}

// Course Creation Modal Handlers
createCourseBtn.addEventListener('click', () => {
    courseModal.style.display = 'flex';
});

modalCloseBtn.addEventListener('click', () => {
    courseModal.style.display = 'none';
});

saveCourseBtn.addEventListener('click', async () => {
    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;
    const category = document.getElementById('courseCategory').value;
    const price = document.getElementById('coursePrice').value;

    if (!title || !description || !category || !price) {
        showError('Please fill in all fields');
        return;
    }

    try {
        const user = auth.currentUser;
        const courseRef = database.ref('courses').push();
        
        await courseRef.set({
            title,
            description,
            category,
            price: parseFloat(price),
            instructorId: user.uid,
            status: 'draft',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });

        courseModal.style.display = 'none';
        courseForm.reset();
        showSuccess('Course created successfully');
    } catch (error) {
        console.error('Error creating course:', error);
        showError('Failed to create course');
    }
});

// Load Analytics
function loadAnalytics(instructorId) {
    const ctx = document.getElementById('courseAnalytics').getContext('2d');
    
    // Destroy existing chart if it exists
    if (analyticsChart) {
        analyticsChart.destroy();
    }

    // Create new chart
    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'New Enrollments',
                data: [12, 19, 3, 5, 2, 3, 7],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load Reviews
async function loadReviews(instructorId) {
    try {
        const reviewsRef = database.ref('reviews')
            .orderByChild('instructorId')
            .equalTo(instructorId)
            .limitToLast(5);
            
        const snapshot = await reviewsRef.once('value');
        const reviews = snapshot.val() || {};

        const reviewList = document.querySelector('.review-list');
        reviewList.innerHTML = '';

        Object.entries(reviews)
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .forEach(([id, review]) => {
                addReviewItem(review);
            });
    } catch (error) {
        console.error('Error loading reviews:', error);
        showError('Failed to load reviews');
    }
}

// Load Student Activities
async function loadStudentActivities(instructorId) {
    try {
        const activitiesRef = database.ref('activities')
            .orderByChild('instructorId')
            .equalTo(instructorId)
            .limitToLast(5);
            
        const snapshot = await activitiesRef.once('value');
        const activities = snapshot.val() || {};

        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = '';

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

// Update Statistics
function updateStatistics(courses) {
    let totalStudents = 0;
    let totalEarnings = 0;
    let totalRatings = 0;
    let ratingCount = 0;

    Object.values(courses).forEach(course => {
        totalStudents += course.enrollments || 0;
        totalEarnings += (course.price * (course.enrollments || 0));
        if (course.rating) {
            totalRatings += course.rating;
            ratingCount++;
        }
    });

    const avgRating = ratingCount ? (totalRatings / ratingCount).toFixed(1) : '0.0';

    document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = totalStudents;
    document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = Object.keys(courses).length;
    document.querySelector('.stat-card:nth-child(3) .stat-number').textContent = `$${totalEarnings.toFixed(2)}`;
    document.querySelector('.stat-card:nth-child(4) .stat-number').textContent = avgRating;
}

// Utility Functions
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
}

function showError(message) {
    // Implementation similar to student dashboard
}

function showSuccess(message) {
    // Implementation similar to student dashboard but with success styling
}

// Course Management Functions
function editCourse(courseId) {
    // Implement course editing functionality
    console.log('Edit course:', courseId);
}

function manageCourse(courseId) {
    // Implement course management functionality
    console.log('Manage course:', courseId);
}

// Setup Realtime Listeners
function setupRealtimeListeners(instructorId) {
    // Listen for new reviews
    database.ref('reviews').orderByChild('instructorId')
        .equalTo(instructorId)
        .on('child_added', (snapshot) => {
            const review = snapshot.val();
            addReviewItem(review);
        });

    // Listen for new enrollments
    database.ref('enrollments').on('child_added', (snapshot) => {
        const enrollment = snapshot.val();
        if (enrollment.instructorId === instructorId) {
            // Update analytics
            loadAnalytics(instructorId);
        }
    });
}

// Filter courses based on status
filterSelect.addEventListener('change', (e) => {
    const status = e.target.value;
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach(card => {
        const courseStatus = card.querySelector('.badge').textContent.trim().toLowerCase();
        if (status === 'all' || courseStatus === status) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === courseModal) {
        courseModal.style.display = 'none';
    }
});