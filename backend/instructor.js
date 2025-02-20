// Global State
let currentSection = 'dashboard';
let currentTopicId = null;
let currentCourseId = null;

// Navigation Functions
function switchSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected section and nav link
    document.getElementById(`${sectionId}-section`).classList.add('active');
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
    
    currentSection = sectionId;
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toast Notifications
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
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Dropdown Functions
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

// Form Handling
function handleFormSubmission(formId, successCallback, errorCallback) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            successCallback(Object.fromEntries(formData.entries()));
            form.reset();
        } catch (error) {
            errorCallback(error);
        }
    });
}

// File Upload
function handleFileUpload(inputId, previewId, callback) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                if (callback) callback(file);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Data Export
function exportData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });

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
                modal.classList.remove('active');
            }
        });
    });

    // Initialize toast container
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toast Function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="toast-message">${message}</span>
    `;

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Dashboard Button Handlers
function handleCreateCourse() {
    openModal('createCourseModal');
}

function submitCourseForm(event) {
    event.preventDefault();
    // Handle form submission
    showToast('Course created successfully!');
    closeModal('createCourseModal');
}

function viewCourseDetails(courseId) {
    // Navigate to course details
    showToast('Navigating to course details...');
}

function viewEngagementDetails() {
    // Navigate to analytics section
    showToast('Viewing engagement details...');
}

function viewAllReviews() {
    // Show all reviews
    showToast('Loading all reviews...');
}

function addNewEvent() {
    openModal('addEventModal');
}

function submitEventForm(event) {
    event.preventDefault();
    // Handle event submission
    showToast('Event added successfully!');
    closeModal('addEventModal');
}

function viewEventDetails(eventId) {
    // Show event details
    showToast('Viewing event details...');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});

// Filter Functions
function filterCourses(status) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter courses
    document.querySelectorAll('.course-item').forEach(course => {
        if (status === 'all' || course.dataset.status === status) {
            course.style.display = 'flex';
        } else {
            course.style.display = 'none';
        }
    });
}

// Search Function
function searchCourses(query) {
    const courses = document.querySelectorAll('.course-item');
    courses.forEach(course => {
        const title = course.querySelector('h3').textContent.toLowerCase();
        const description = course.querySelector('.course-description').textContent.toLowerCase();
        
        if (title.includes(query.toLowerCase()) || description.includes(query.toLowerCase())) {
            course.style.display = 'flex';
        } else {
            course.style.display = 'none';
        }
    });
}

// Course Actions
function editCourse(courseId) {
    currentCourseId = courseId;
    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = courseId;
    
    // Simulate getting course data
    const courseData = {
        title: 'Web Development Bootcamp',
        description: 'Complete web development course...',
        category: 'web-development',
        level: 'intermediate',
        price: 99.99,
        duration: 42
    };

    // Fill form with course data
    document.getElementById('courseTitle').value = courseData.title;
    document.getElementById('courseDescription').value = courseData.description;
    document.getElementById('courseCategory').value = courseData.category;
    document.getElementById('courseLevel').value = courseData.level;
    document.getElementById('coursePrice').value = courseData.price;
    document.getElementById('courseDuration').value = courseData.duration;

    openModal('createCourseModal');
}

function viewCourse(courseId) {
    showToast('Navigating to course content...');
    // Navigate to course content page
}

function previewCourse(courseId) {
    showToast('Opening course preview...');
    // Open course preview
}

function duplicateCourse(courseId) {
    showToast('Duplicating course...', 'success');
    // Duplicate course logic
}

function archiveCourse(courseId) {
    showToast('Course archived successfully', 'success');
    // Archive course logic
}

function deleteCourse(courseId) {
    currentCourseId = courseId;
    openModal('deleteConfirmModal');
}

function confirmDelete() {
    showToast('Course deleted successfully', 'success');
    closeModal('deleteConfirmModal');
    // Delete course logic
    document.querySelector(`[data-course-id="${currentCourseId}"]`)?.remove();
}

function publishCourse(courseId) {
    showToast('Course published successfully', 'success');
    // Publish course logic
}

// Dropdown Toggle
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

// Form Submit Handler
function handleCourseSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Simulate API call
    setTimeout(() => {
        showToast('Course saved successfully!', 'success');
        closeModal('createCourseModal');
        event.target.reset();
    }, 1000);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Filter Functions
function filterStudentsByCourse(courseId) {
    const rows = document.querySelectorAll('.student-row');
    rows.forEach(row => {
        if (courseId === 'all' || row.dataset.course === courseId) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterStudentsByStatus(status) {
    const rows = document.querySelectorAll('.student-row');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search Function
function searchStudents(query) {
    const rows = document.querySelectorAll('.student-row');
    rows.forEach(row => {
        const name = row.querySelector('.student-name').textContent.toLowerCase();
        const email = row.querySelector('.student-email').textContent.toLowerCase();
        if (name.includes(query.toLowerCase()) || email.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Checkbox Functions
function toggleSelectAll(checkbox) {
    const studentCheckboxes = document.querySelectorAll('.select-student');
    studentCheckboxes.forEach(box => {
        box.checked = checkbox.checked;
    });
}

// Student Actions
function viewStudentProgress(studentId) {
    // Simulate loading student data
    const studentData = {
        name: 'John Smith',
        email: 'john@example.com',
        progress: 75,
        assignments: '15/20',
        grade: '92%'
    };

    // Update modal with student data
    document.getElementById('modalStudentName').textContent = studentData.name;
    document.getElementById('modalStudentEmail').textContent = studentData.email;
    
    openModal('studentProgressModal');
}

function sendMessage(studentId) {
    document.getElementById('messageRecipient').value = 'John Smith <john@example.com>';
    openModal('messageModal');
}

function viewAssignments(studentId) {
    showToast('Loading assignments...');
    // Implementation for viewing assignments
}

function downloadReport(studentId) {
    showToast('Generating report...');
    setTimeout(() => {
        showToast('Report downloaded successfully', 'success');
    }, 1500);
}

function manageAccess(studentId) {
    openModal('accessModal');
}

// Form Submissions
function sendMessageSubmit(event) {
    event.preventDefault();
    showToast('Message sent successfully', 'success');
    closeModal('messageModal');
}

function updateAccess(event) {
    event.preventDefault();
    showToast('Access updated successfully', 'success');
    closeModal('accessModal');
}

// Export Function
function exportStudentData() {
    showToast('Preparing export...', 'info');
    setTimeout(() => {
        showToast('Data exported successfully', 'success');
    }, 1500);
}

// Tab Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Implementation for loading tab content
    showToast(`Loading ${tab} data...`);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});


  // Filter Functions
  function filterAssignmentsByCourse(courseId) {
    const cards = document.querySelectorAll('.assignment-card');
    cards.forEach(card => {
        if (courseId === 'all' || card.dataset.course === courseId) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterAssignmentsByStatus(status) {
    const cards = document.querySelectorAll('.assignment-card');
    cards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterAssignmentsByType(type) {
    const cards = document.querySelectorAll('.assignment-card');
    cards.forEach(card => {
        if (type === 'all' || card.dataset.type === type) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Search Function
function searchAssignments(query) {
    const cards = document.querySelectorAll('.assignment-card');
    cards.forEach(card => {
        const title = card.querySelector('.assignment-title').textContent.toLowerCase();
        if (title.includes(query.toLowerCase())) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Assignment Actions
function editAssignment(assignmentId) {
    document.getElementById('assignmentModalTitle').textContent = 'Edit Assignment';
    document.getElementById('assignmentId').value = assignmentId;
    
    // Simulate getting assignment data
    const assignmentData = {
        title: 'Final Project: Full-Stack Application',
        course: 'web-dev',
        type: 'project',
        points: 100,
        description: 'Create a full-stack application...'
    };

    // Fill form with assignment data
    document.getElementById('assignmentTitle').value = assignmentData.title;
    document.getElementById('assignmentCourse').value = assignmentData.course;
    document.getElementById('assignmentType').value = assignmentData.type;
    document.getElementById('assignmentPoints').value = assignmentData.points;
    document.getElementById('assignmentDescription').value = assignmentData.description;

    openModal('createAssignmentModal');
}

function duplicateAssignment(assignmentId) {
    showToast('Duplicating assignment...', 'success');
}

function previewAssignment(assignmentId) {
    showToast('Opening assignment preview...');
}

function archiveAssignment(assignmentId) {
    showToast('Assignment archived successfully', 'success');
}

function deleteAssignment(assignmentId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        showToast('Assignment deleted successfully', 'success');
    }
}

function gradeAssignments(assignmentId) {
    // Load submissions and open grading modal
    openModal('gradeSubmissionsModal');
    loadSubmissions(assignmentId);
}

function loadSubmissions(assignmentId) {
    // Simulate loading submissions
    const submissionsList = document.querySelector('.submissions-list');
    submissionsList.innerHTML = '<p>Loading submissions...</p>';
    
    // Add submission loading logic here
}

// Form Submit Handler
function handleAssignmentSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Simulate API call
    setTimeout(() => {
        showToast('Assignment saved successfully!', 'success');
        closeModal('createAssignmentModal');
        event.target.reset();
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});

// Analytics Functions
function updateTimeRange(days) {
    showToast('Updating time range...');
    // Update all charts and stats based on new time range
    updateAllCharts(days);
}

function updateAllCharts(days) {
    // Update each chart with new data
    updateRevenueChart(days);
    updateEngagementChart(days);
    updateGeoMap(days);
}

function updateChartView(view) {
    const buttons = document.querySelectorAll('.chart-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    showToast(`Updating chart view to ${view}...`);
    // Update chart based on selected view
}

function updateEngagementView(period) {
    showToast(`Updating engagement view to ${period}...`);
    // Update engagement metrics based on selected period
}

function updateMapView(metric) {
    showToast(`Updating map view to show ${metric}...`);
    // Update geographic map based on selected metric
}

function exportAnalytics() {
    showToast('Preparing analytics report...');
    setTimeout(() => {
        showToast('Analytics report downloaded successfully', 'success');
    }, 1500);
}

// Chart Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all charts
    initializeCharts();
});

function initializeCharts() {
    // Initialize Revenue Chart
    const revenueChart = document.getElementById('revenueChart');
    if (revenueChart) {
        // Initialize chart library and create chart
    }

    // Initialize Engagement Chart
    const engagementChart = document.getElementById('engagementChart');
    if (engagementChart) {
        // Initialize chart library and create chart
    }

    // Initialize Geographic Map
    const geoMap = document.getElementById('geoMap');
    if (geoMap) {
        // Initialize map library and create map
    }
}

// Discussion Functions
function filterDiscussions(type) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const cards = document.querySelectorAll('.discussion-card');
    cards.forEach(card => {
        if (type === 'all' || card.dataset.type === type) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchDiscussions(query) {
    const cards = document.querySelectorAll('.discussion-card');
    cards.forEach(card => {
        const title = card.querySelector('.topic-title').textContent.toLowerCase();
        const content = card.querySelector('.topic-preview').textContent.toLowerCase();
        if (title.includes(query.toLowerCase()) || content.includes(query.toLowerCase())) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortDiscussions(criteria) {
    showToast(`Sorting discussions by ${criteria}...`);
    // Implement sorting logic
}

function handleAnnouncementSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Simulate API call
    setTimeout(() => {
        showToast('Announcement posted successfully!', 'success');
        closeModal('createAnnouncementModal');
        event.target.reset();
    }, 1000);
}

function quickReply(topicId) {
    currentTopicId = topicId;
    openModal('quickReplyModal');
}

function handleReplySubmit(event) {
    event.preventDefault();
    showToast('Posting reply...');
    
    setTimeout(() => {
        showToast('Reply posted successfully!', 'success');
        closeModal('quickReplyModal');
        event.target.reset();
    }, 1000);
}

function viewThread(topicId) {
    openModal('threadViewModal');
    document.getElementById('threadTitle').textContent = 'Loading...';
    
    // Simulate loading thread content
    setTimeout(() => {
        const threadContent = document.querySelector('.thread-content');
        threadContent.innerHTML = `
            <div class="thread-loading">Loading thread content...</div>
        `;
        // Load actual thread content here
    }, 500);
}

function pinTopic(topicId) {
    showToast('Pinning topic...', 'info');
    setTimeout(() => {
        showToast('Topic pinned successfully!', 'success');
    }, 1000);
}

function unpinTopic(topicId) {
    showToast('Unpinning topic...', 'info');
    setTimeout(() => {
        showToast('Topic unpinned successfully!', 'success');
    }, 1000);
}

function markAsAnswer(topicId) {
    showToast('Marking as answer...', 'info');
    setTimeout(() => {
        showToast('Marked as answer successfully!', 'success');
    }, 1000);
}

function lockTopic(topicId) {
    if (confirm('Are you sure you want to lock this topic?')) {
        showToast('Topic locked successfully', 'success');
    }
}

function deleteTopic(topicId) {
    if (confirm('Are you sure you want to delete this topic?')) {
        showToast('Topic deleted successfully', 'success');
    }
}

function viewForum(forumId) {
    showToast('Loading forum...', 'info');
    // Implement forum view navigation
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize rich text editor if available
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '.rich-editor',
            // Rich text editor configuration
        });
    }
});


// Earnings Functions
function updateEarningsRange(days) {
    showToast('Updating earnings data...');
    // Update earnings data based on selected time range
    setTimeout(() => {
        showToast('Earnings data updated', 'success');
    }, 1000);
}

function updateEarningsPeriod(period) {
    showToast('Updating earnings period...');
    // Update earnings based on selected period
    setTimeout(() => {
        showToast('Earnings period updated', 'success');
    }, 1000);
}

function initiateWithdrawal() {
    openModal('withdrawalModal');
}

function handleWithdrawal(event) {
    event.preventDefault();
    showToast('Processing withdrawal...');
    
    setTimeout(() => {
        showToast('Withdrawal initiated successfully', 'success');
        closeModal('withdrawalModal');
    }, 1500);
}

function exportEarningsReport() {
    showToast('Generating earnings report...');
    setTimeout(() => {
        showToast('Report downloaded successfully', 'success');
    }, 1500);
}

function updateRevenueView(view) {
    const buttons = document.querySelectorAll('.chart-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    showToast(`Updating revenue view to ${view}...`);
    // Update revenue chart based on selected view
}

function viewAllTransactions() {
    showToast('Loading all transactions...');
    // Implement view all transactions logic
}

function filterPayouts(status) {
    showToast('Filtering payouts...');
    // Implement payout filtering logic
}

// Initialize Charts
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Revenue Chart
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (ctx) {
        // Initialize chart with data
    }
});

// Settings Navigation
function switchSettingsTab(tab) {
    // Remove active class from all links and panels
    document.querySelectorAll('.settings-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
    
    // Add active class to clicked link
    document.querySelector(`[href="#${tab}"]`).classList.add('active');
    
    // Show corresponding panel
    document.getElementById(`${tab}-settings`).classList.add('active');
}

// Profile Functions
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profileImage').src = e.target.result;
            showToast('Profile picture updated successfully', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function handleProfileUpdate(event) {
    event.preventDefault();
    
    showToast('Saving changes...');
    setTimeout(() => {
        showToast('Profile updated successfully', 'success');
    }, 1000);
}

// Security Functions
function handlePasswordUpdate(event) {
    event.preventDefault();
    
    // Add password validation logic here
    showToast('Updating password...');
    setTimeout(() => {
        showToast('Password updated successfully', 'success');
        event.target.reset();
    }, 1000);
}

function toggle2FA(enabled) {
    if (enabled) {
        showToast('Setting up 2FA...', 'info');
        // Show 2FA setup modal/process
    } else {
        showToast('2FA disabled', 'success');
    }
}

function endSession(sessionId) {
    if (confirm('Are you sure you want to end this session?')) {
        showToast('Ending session...', 'info');
        setTimeout(() => {
            showToast('Session ended successfully', 'success');
            // Remove session from list
        }, 1000);
    }
}

// Notification Functions
function updateNotificationSetting(setting, enabled) {
    showToast('Updating notification settings...');
    setTimeout(() => {
        showToast('Notification settings updated', 'success');
    }, 500);
}

function updateEmailFrequency(frequency) {
    showToast('Updating email frequency...');
    setTimeout(() => {
        showToast('Email frequency updated', 'success');
    }, 500);
}

// Payment Method Functions
function editPaymentMethod(method) {
    document.getElementById('paymentMethodType').value = 
        method === 'paypal' ? 'PayPal' : 'Bank Transfer';
    
    document.getElementById('paypalFields').style.display = 
        method === 'paypal' ? 'block' : 'none';
        document.getElementById('bankFields').style.display = 
        method === 'bank' ? 'block' : 'none';
    
    openModal('paymentMethodModal');
}

function handlePaymentMethodUpdate(event) {
    event.preventDefault();
    showToast('Updating payment method...');
    
    setTimeout(() => {
        showToast('Payment method updated successfully', 'success');
        closeModal('paymentMethodModal');
    }, 1000);
}

function updatePayoutSchedule(schedule) {
    showToast('Updating payout schedule...');
    setTimeout(() => {
        showToast('Payout schedule updated', 'success');
    }, 500);
}

// Utility Functions
function resetForm(formId) {
    document.getElementById(formId).reset();
    showToast('Changes discarded', 'info');
}

// Revenue Chart
const revenueCtx = document.getElementById('revenueChart').getContext('2d');
const revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: '#4993ee',
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Student Engagement Chart
const engagementCtx = document.getElementById('engagementChart').getContext('2d');
const engagementChart = new Chart(engagementCtx, {
    type: 'doughnut',
    data: {
        labels: ['Active', 'Inactive', 'Completed'],
        datasets: [{
            data: [65, 20, 15],
            backgroundColor: ['#4993ee', '#64748b', '#22c55e']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

// Geographic Distribution Map
const map = L.map('geoMap').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add some sample data points
const sampleData = [
    { lat: 40.7128, lng: -74.0060, students: 150 },
    { lat: 51.5074, lng: -0.1278, students: 89 },
    { lat: 28.6139, lng: 77.2090, students: 120 }
];

sampleData.forEach(point => {
    L.circleMarker([point.lat, point.lng], {
        radius: Math.sqrt(point.students) * 0.5,
        fillColor: '#4993ee',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    })
    .bindPopup(`${point.students} students`)
    .addTo(map);
});

// Progress Ring Animation
function setProgressRing(percent) {
    const circle = document.querySelector('.progress-ring .progress');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;
}

// Initialize progress rings
document.querySelectorAll('.progress-ring').forEach(ring => {
    const percent = ring.dataset.value || 0;
    setProgressRing(percent);
});

// Add these functions to your instructor.js file

function toggleNotifications() {
    const dropdown = document.querySelector('.notification-dropdown');
    dropdown.classList.toggle('show');

    // Close when clicking outside
    document.addEventListener('click', function closeNotif(e) {
        if (!e.target.closest('.notification-wrapper')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeNotif);
        }
    });
}

function markAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.classList.remove('unread');
    updateNotificationCount();
}

function markAllAsRead() {
    document.querySelectorAll('.notification-item.unread')
        .forEach(item => item.classList.remove('unread'));
    updateNotificationCount();
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.notification-badge');
    
    if (unreadCount === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'block';
        badge.textContent = unreadCount;
    }
}

// Initialize notification count
document.addEventListener('DOMContentLoaded', () => {
    updateNotificationCount();
});