import { auth, database } from './firebase.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

class DashboardManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadDashboard();
    }

    initializeElements() {
        // Profile elements
        this.profileName = document.getElementById('profileName');
        this.welcomeName = document.getElementById('welcomeName');
        this.profileImage = document.getElementById('profileImage');

        // Stats elements
        this.inProgressCount = document.getElementById('inProgressCount');
        this.completedCount = document.getElementById('completedCount');
        this.hoursCount = document.getElementById('hoursCount');
        this.averageScore = document.getElementById('averageScore');

        // Content containers
        this.coursesGrid = document.getElementById('coursesGrid');
        this.deadlinesList = document.getElementById('deadlinesList');
        this.activitiesList = document.getElementById('activitiesList');

        // Logout button
        this.logoutBtn = document.getElementById('logoutBtn');
    }

    setupEventListeners() {
        // Handle logout
        this.logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error signing out:', error);
                this.showError('Failed to sign out');
            }
        });

        // Profile dropdown toggle
        document.getElementById('profileBtn').addEventListener('click', () => {
            document.getElementById('profileDropdown').classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.matches('.profile-btn')) {
                const dropdown = document.getElementById('profileDropdown');
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        });
    }

    async loadDashboard() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Load user data
            const userRef = ref(database, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    this.updateUserInfo(userData);
                }
            });

            // Load courses
            this.loadCourses(user.uid);

            // Load deadlines
            this.loadDeadlines(user.uid);

            // Load activities
            this.loadActivities(user.uid);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    updateUserInfo(userData) {
        // Update profile display
        this.profileName.textContent = userData.name;
        this.welcomeName.textContent = userData.name.split(' ')[0];
        
        if (userData.photoURL) {
            this.profileImage.src = userData.photoURL;
        }
    }

    async loadCourses(userId) {
        const enrollmentsRef = ref(database, `enrollments/${userId}`);
        
        onValue(enrollmentsRef, async (snapshot) => {
            const enrollments = snapshot.val() || {};
            this.coursesGrid.innerHTML = ''; // Clear existing content

            // Update stats
            let inProgress = 0;
            let completed = 0;
            let totalHours = 0;

            for (const [courseId, enrollment] of Object.entries(enrollments)) {
                try {
                    const courseSnapshot = await get(ref(database, `courses/${courseId}`));
                    const courseData = courseSnapshot.val();

                    if (courseData) {
                        // Update stats
                        if (enrollment.completed) {
                            completed++;
                            totalHours += courseData.duration || 0;
                        } else {
                            inProgress++;
                        }

                        // Create course card
                        this.createCourseCard(courseData, enrollment);
                    }
                } catch (error) {
                    console.error(`Error loading course ${courseId}:`, error);
                }
            }

            // Update stats display
            this.updateStats(inProgress, completed, totalHours);
        });
    }

    createCourseCard(course, enrollment) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <img src="${course.thumbnail || '../assets/course-placeholder.jpg'}" 
                 alt="${course.title}" 
                 class="course-image">
            <div class="course-content">
                <h3 class="course-title">${course.title}</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${enrollment.progress || 0}%"></div>
                </div>
                <p>Progress: ${enrollment.progress || 0}%</p>
                <button class="btn btn-primary mt-2">Continue</button>
            </div>
        `;

        this.coursesGrid.appendChild(card);
    }

    loadDeadlines(userId) {
        const deadlinesRef = ref(database, `deadlines/${userId}`);
        
        onValue(deadlinesRef, (snapshot) => {
            const deadlines = snapshot.val() || {};
            this.deadlinesList.innerHTML = ''; // Clear existing content

            Object.entries(deadlines)
                .sort(([, a], [, b]) => new Date(a.dueDate) - new Date(b.dueDate))
                .forEach(([id, deadline]) => {
                    const deadlineEl = this.createDeadlineElement(deadline);
                    this.deadlinesList.appendChild(deadlineEl);
                });
        });
    }

    createDeadlineElement(deadline) {
        const element = document.createElement('div');
        element.className = 'deadline-item';
        element.innerHTML = `
            <h4>${deadline.title}</h4>
            <p>Due ${this.formatDate(deadline.dueDate)} • ${deadline.courseName}</p>
        `;
        return element;
    }

    loadActivities(userId) {
        const activitiesRef = ref(database, `activities/${userId}`);
        
        onValue(activitiesRef, (snapshot) => {
            const activities = snapshot.val() || {};
            this.activitiesList.innerHTML = ''; // Clear existing content

            Object.entries(activities)
                .sort(([, a], [, b]) => b.timestamp - a.timestamp)
                .slice(0, 5) // Show only last 5 activities
                .forEach(([id, activity]) => {
                    const activityEl = this.createActivityElement(activity);
                    this.activitiesList.appendChild(activityEl);
                });
        });
    }

    createActivityElement(activity) {
        const element = document.createElement('div');
        element.className = 'activity-item';
        element.innerHTML = `
            <h4>${activity.title}</h4>
            <p>${this.formatTimeAgo(activity.timestamp)}</p>
        `;
        return element;
    }

    updateStats(inProgress, completed, totalHours) {
        this.inProgressCount.textContent = inProgress;
        this.completedCount.textContent = completed;
        this.hoursCount.textContent = Math.round(totalHours);
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === now.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
            });
        }
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;

        // Convert to minutes/hours/days
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) {
            return minutes <= 1 ? 'just now' : `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showSuccess(message) {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Remove after delay
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Profile Management
    initializeProfileModal() {
        const modal = document.getElementById('profileModal');
        const openBtn = document.getElementById('editProfile');
        const closeBtn = modal.querySelector('.close-modal');
        const saveBtn = document.getElementById('saveProfile');
        const profileForm = document.getElementById('profileForm');

        // Open modal
        openBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            this.loadUserProfile();
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Handle profile image upload
        const profilePicture = document.getElementById('profilePicture');
        profilePicture.addEventListener('change', (e) => {
            this.handleProfileImageUpload(e.target.files[0]);
        });

        // Handle form submission
        saveBtn.addEventListener('click', async () => {
            await this.saveUserProfile();
            modal.style.display = 'none';
        });
    }

    async loadUserProfile() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await get(ref(database, `users/${user.uid}`));
            const userData = snapshot.val();

            if (userData) {
                document.getElementById('displayName').value = userData.name || '';
                document.getElementById('bio').value = userData.bio || '';
                
                if (userData.photoURL) {
                    document.getElementById('profilePreview').src = userData.photoURL;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile');
        }
    }

    async handleProfileImageUpload(file) {
        if (!file) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profilePreview').src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Upload to Firebase Storage
            const storageRef = ref(storage, `profile_images/${user.uid}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);

            // Update user profile
            await updateProfile(user, { photoURL });
            await update(ref(database, `users/${user.uid}`), { photoURL });

            this.showSuccess('Profile picture updated');
        } catch (error) {
            console.error('Error uploading profile image:', error);
            this.showError('Failed to upload profile image');
        }
    }

    async saveUserProfile() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const displayName = document.getElementById('displayName').value;
            const bio = document.getElementById('bio').value;

            // Update database
            await update(ref(database, `users/${user.uid}`), {
                name: displayName,
                bio: bio,
                updatedAt: new Date().toISOString()
            });

            // Update profile
            await updateProfile(user, { displayName });

            this.showSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError('Failed to save profile');
        }
    }
}

// Initialize dashboard
const dashboard = new DashboardManager();