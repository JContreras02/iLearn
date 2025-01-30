// Initialize Firebase
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const courseGrid = document.getElementById('courseGrid');
const searchInput = document.getElementById('courseSearch');
const sortSelect = document.getElementById('sortCourses');
const viewToggle = document.querySelector('.view-toggle');
const filterForm = document.querySelector('.filters-sidebar');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const ratingSlider = document.getElementById('ratingFilter');
const coursePreviewModal = document.getElementById('coursePreviewModal');

// State Management
let courses = [];
let currentFilters = {
    categories: [],
    levels: [],
    duration: [],
    rating: 0
};
let currentView = 'grid';
let currentSort = 'popular';
let currentPage = 1;
const itemsPerPage = 12;

// Initialize Catalog
async function initCatalog() {
    await loadCategories();
    await loadCourses();
    setupEventListeners();
    applyFiltersAndSort();
}

// Load Categories
async function loadCategories() {
    try {
        const categoriesRef = database.ref('categories');
        const snapshot = await categoriesRef.once('value');
        const categories = snapshot.val() || {};

        const categoryFilters = document.getElementById('categoryFilters');
        categoryFilters.innerHTML = Object.entries(categories)
            .map(([id, category]) => `
                <label class="checkbox-container">
                    <input type="checkbox" value="${id}">
                    ${category.name}
                </label>
            `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories');
    }
}

// Load Courses
async function loadCourses() {
    try {
        const coursesRef = database.ref('courses')
            .orderByChild('status')
            .equalTo('published');
        
        const snapshot = await coursesRef.once('value');
        courses = [];

        snapshot.forEach(childSnapshot => {
            courses.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        applyFiltersAndSort();
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('Failed to load courses');
    }
}

// Apply Filters and Sort
function applyFiltersAndSort() {
    let filteredCourses = courses.filter(course => {
        return (
            (currentFilters.categories.length === 0 || 
                currentFilters.categories.includes(course.category)) &&
            (currentFilters.levels.length === 0 || 
                currentFilters.levels.includes(course.level)) &&
            (currentFilters.duration.length === 0 || 
                currentFilters.duration.includes(getDurationRange(course.duration))) &&
            (course.rating >= currentFilters.rating)
        );
    });

    // Apply sorting
    filteredCourses = sortCourses(filteredCourses, currentSort);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

    renderCourses(paginatedCourses);
    updatePagination(filteredCourses.length);
}

// Sort Courses
function sortCourses(coursesToSort, sortBy) {
    switch (sortBy) {
        case 'popular':
            return coursesToSort.sort((a, b) => b.enrollments - a.enrollments);
        case 'newest':
            return coursesToSort.sort((a, b) => b.createdAt - a.createdAt);
        case 'rating':
            return coursesToSort.sort((a, b) => b.rating - a.rating);
        case 'price-low':
            return coursesToSort.sort((a, b) => a.price - b.price);
        case 'price-high':
            return coursesToSort.sort((a, b) => b.price - a.price);
        default:
            return coursesToSort;
    }
}

// Render Courses
function renderCourses(coursesToRender) {
    courseGrid.className = `course-grid ${currentView}-view`;
    courseGrid.innerHTML = coursesToRender.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-image">
                <img src="${course.thumbnail}" alt="${course.title}">
                <span class="course-level">${course.level}</span>
            </div>
            <div class="course-content">
                <div class="course-info">
                    <span class="course-category">${course.category}</span>
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-instructor">
                        <img src="${course.instructorAvatar}" alt="${course.instructor}" class="instructor-avatar">
                        <span class="instructor-name">${course.instructor}</span>
                    </div>
                    <div class="course-stats">
                        <span class="stat-item">
                            <i class="icon-star"></i>
                            ${course.rating.toFixed(1)} (${course.reviews} reviews)
                        </span>
                        <span class="stat-item">
                            <i class="icon-users"></i>
                            ${course.enrollments} students
                        </span>
                    </div>
                    <div class="course-price">
                        ${course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn-outline" onclick="previewCourse('${course.id}')">
                        Preview
                    </button>
                    <button class="btn-primary" onclick="enrollCourse('${course.id}')">
                        Enroll Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Preview Course
async function previewCourse(courseId) {
    try {
        const courseRef = database.ref(`courses/${courseId}`);
        const snapshot = await courseRef.once('value');
        const course = snapshot.val();

        if (!course) throw new Error('Course not found');

        const modalContent = coursePreviewModal.querySelector('.modal-body');
        modalContent.innerHTML = `
            <div class="course-preview-content">
                <div class="preview-header">
                    <img src="${course.thumbnail}" alt="${course.title}">
                    <div class="preview-overlay">
                        <h2 class="preview-title">${course.title}</h2>
                        <div class="preview-meta">
                            <span>${course.category}</span>
                            <span>${course.level}</span>
                            <span>${course.duration}</span>
                        </div>
                    </div>
                </div>
                <div class="preview-details">
                    <div class="preview-detail-item">
                        <div class="preview-detail-label">Instructor</div>
                        <div class="preview-detail-value">${course.instructor}</div>
                    </div>
                    <div class="preview-detail-item">
                        <div class="preview-detail-label">Students</div>
                        <div class="preview-detail-value">${course.enrollments}</div>
                    </div>
                    <div class="preview-detail-item">
                        <div class="preview-detail-label">Rating</div>
                        <div class="preview-detail-value">
                            ${course.rating.toFixed(1)} (${course.reviews} reviews)
                        </div>
                    </div>
                    <div class="preview-detail-item">
                        <div class="preview-detail-label">Price</div>
                        <div class="preview-detail-value">
                            ${course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                        </div>
                    </div>
                </div>
                <div class="preview-description">
                    ${course.description}
                </div>
                <div class="preview-curriculum">
                    <h3>Course Curriculum</h3>
                    ${renderCurriculum(course.curriculum)}
                </div>
                <div class="preview-footer">
                    <button class="btn-outline" onclick="closePreview()">Close</button>
                    <button class="btn-primary" onclick="enrollCourse('${courseId}')">
                        Enroll Now
                    </button>
                </div>
            </div>
        `;

        coursePreviewModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading course preview:', error);
        showError('Failed to load course preview');
    }
}

// Render Curriculum
function renderCurriculum(curriculum) {
    if (!curriculum) {
        return '<p>No curriculum available</p>';
    }

    return `
        <div class="curriculum-list">
            ${Object.entries(curriculum).map(([sectionId, section]) => `
                <div class="curriculum-section">
                    <h4>${section.title}</h4>
                    <div class="curriculum-items">
                        ${section.items.map(item => `
                            <div class="curriculum-item">
                                <span>
                                    <i class="icon-${item.type}"></i>
                                    ${item.title}
                                </span>
                                <span>${formatDuration(item.duration)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Close Preview Modal
function closePreview() {
    coursePreviewModal.style.display = 'none';
}

// Enroll Course
async function enrollCourse(courseId) {
    try {
        const userId = auth.getCurrentUser().uid;
        const courseRef = database.ref(`courses/${courseId}`);
        const userRef = database.ref(`users/${userId}`);
        
        // Get course and user data
        const [courseSnapshot, userSnapshot] = await Promise.all([
            courseRef.once('value'),
            userRef.once('value')
        ]);
        
        const course = courseSnapshot.val();
        const user = userSnapshot.val();

        if (!course) {
            throw new Error('Course not found');
        }

        // Check if already enrolled
        const enrollmentRef = database.ref(`enrollments/${userId}/${courseId}`);
        const enrollmentSnapshot = await enrollmentRef.once('value');
        
        if (enrollmentSnapshot.exists()) {
            window.location.href = `course.html?id=${courseId}`;
            return;
        }

        // Handle payment if course is not free
        if (course.price > 0) {
            // Implement payment processing here
            await processPayment(course.price);
        }

        // Create enrollment
        await enrollmentRef.set({
            courseId,
            userId,
            enrolledAt: firebase.database.ServerValue.TIMESTAMP,
            progress: 0,
            status: 'active'
        });

        // Update course enrollment count
        await courseRef.update({
            enrollments: (course.enrollments || 0) + 1
        });

        // Create activity
        await database.ref(`activities/${userId}`).push({
            type: 'enrollment',
            courseId,
            courseName: course.title,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Redirect to course page
        window.location.href = `course.html?id=${courseId}`;

    } catch (error) {
        console.error('Error enrolling in course:', error);
        showError('Failed to enroll in course');
    }
}

// Process Payment
async function processPayment(amount) {
    // Implement payment processing logic here
    return new Promise((resolve) => {
        // Simulating payment processing
        setTimeout(resolve, 1000);
    });
}

// Format Duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
        return `${minutes}min`;
    } else if (minutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${minutes}min`;
    }
}

// Show Error Message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.catalog-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
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

// Mobile Filter Toggle
const filterToggle = document.createElement('button');
filterToggle.className = 'filter-toggle';
filterToggle.innerHTML = '<i class="icon-filter"></i>';
document.body.appendChild(filterToggle);

filterToggle.addEventListener('click', () => {
    filterForm.classList.toggle('active');
});

// Close filters when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && 
        !filterForm.contains(e.target) && 
        !filterToggle.contains(e.target)) {
        filterForm.classList.remove('active');
    }
});

// Initialize catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', initCatalog);