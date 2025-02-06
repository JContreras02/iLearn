// database-service.js
class DatabaseService {
    constructor() {
        this.database = firebase.database();
    }

    // Course Operations
    async createCourse(instructorId, courseData) {
        try {
            const courseRef = this.database.ref('courses').push();
            const course = {
                ...courseData,
                instructorId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'draft',
                enrollmentCount: 0,
                ratings: {
                    average: 0,
                    count: 0
                }
            };
            await courseRef.set(course);
            return courseRef.key;
        } catch (error) {
            throw new Error(`Failed to create course: ${error.message}`);
        }
    }

    async updateCourse(courseId, courseData) {
        try {
            await this.database.ref(`courses/${courseId}`).update({
                ...courseData,
                updatedAt: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to update course: ${error.message}`);
        }
    }

    async getCourse(courseId) {
        try {
            const snapshot = await this.database.ref(`courses/${courseId}`).once('value');
            return snapshot.val();
        } catch (error) {
            throw new Error(`Failed to get course: ${error.message}`);
        }
    }

    async deleteCourse(courseId) {
        try {
            await this.database.ref(`courses/${courseId}`).remove();
        } catch (error) {
            throw new Error(`Failed to delete course: ${error.message}`);
        }
    }

    // Enrollment Operations
    async enrollStudent(courseId, userId) {
        try {
            const enrollmentRef = this.database.ref(`enrollments/${courseId}/${userId}`);
            await enrollmentRef.set({
                enrolledAt: Date.now(),
                status: 'active',
                progress: 0,
                lastAccessed: Date.now()
            });

            // Update course enrollment count
            const courseRef = this.database.ref(`courses/${courseId}/enrollmentCount`);
            await courseRef.transaction(current => (current || 0) + 1);
        } catch (error) {
            throw new Error(`Failed to enroll student: ${error.message}`);
        }
    }

    async updateEnrollmentStatus(courseId, userId, status) {
        try {
            await this.database.ref(`enrollments/${courseId}/${userId}`).update({
                status,
                updatedAt: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to update enrollment status: ${error.message}`);
        }
    }

    // Progress Tracking
    async updateProgress(courseId, userId, progress) {
        try {
            await this.database.ref(`progress/${courseId}/${userId}`).update({
                ...progress,
                lastUpdated: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to update progress: ${error.message}`);
        }
    }

    async getProgress(courseId, userId) {
        try {
            const snapshot = await this.database.ref(`progress/${courseId}/${userId}`).once('value');
            return snapshot.val();
        } catch (error) {
            throw new Error(`Failed to get progress: ${error.message}`);
        }
    }

    // Assignment Operations
    async createAssignment(courseId, assignmentData) {
        try {
            const assignmentRef = this.database.ref(`assignments/${courseId}`).push();
            const assignment = {
                ...assignmentData,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await assignmentRef.set(assignment);
            return assignmentRef.key;
        } catch (error) {
            throw new Error(`Failed to create assignment: ${error.message}`);
        }
    }

    async submitAssignment(courseId, assignmentId, userId, submissionData) {
        try {
            await this.database.ref(`submissions/${courseId}/${assignmentId}/${userId}`).set({
                ...submissionData,
                submittedAt: Date.now(),
                status: 'submitted'
            });
        } catch (error) {
            throw new Error(`Failed to submit assignment: ${error.message}`);
        }
    }

    async gradeAssignment(courseId, assignmentId, userId, gradeData) {
        try {
            await this.database.ref(`submissions/${courseId}/${assignmentId}/${userId}`).update({
                ...gradeData,
                gradedAt: Date.now(),
                status: 'graded'
            });
        } catch (error) {
            throw new Error(`Failed to grade assignment: ${error.message}`);
        }
    }

    // Analytics Operations
    async updateAnalytics(courseId, analyticsData) {
        try {
            const date = new Date().toISOString().split('T')[0];
            await this.database.ref(`analytics/courses/${courseId}/daily/${date}`).update({
                ...analyticsData,
                timestamp: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to update analytics: ${error.message}`);
        }
    }

    async getAnalytics(courseId, startDate, endDate) {
        try {
            const snapshot = await this.database.ref(`analytics/courses/${courseId}/daily`)
                .orderByKey()
                .startAt(startDate)
                .endAt(endDate)
                .once('value');
            return snapshot.val();
        } catch (error) {
            throw new Error(`Failed to get analytics: ${error.message}`);
        }
    }

    // Rating Operations
    async addRating(courseId, userId, rating, review) {
        try {
            // Add the new rating
            await this.database.ref(`ratings/${courseId}/${userId}`).set({
                rating,
                review,
                timestamp: Date.now()
            });

            // Update course average rating
            const ratingsRef = this.database.ref(`ratings/${courseId}`);
            const snapshot = await ratingsRef.once('value');
            const ratings = snapshot.val() || {};
            
            const ratingValues = Object.values(ratings).map(r => r.rating);
            const averageRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

            await this.database.ref(`courses/${courseId}/ratings`).update({
                average: averageRating,
                count: ratingValues.length
            });
        } catch (error) {
            throw new Error(`Failed to add rating: ${error.message}`);
        }
    }

    // Notification Operations
    async addNotification(userId, notification) {
        try {
            const notificationRef = this.database.ref(`notifications/${userId}`).push();
            await notificationRef.set({
                ...notification,
                timestamp: Date.now(),
                read: false
            });
            return notificationRef.key;
        } catch (error) {
            throw new Error(`Failed to add notification: ${error.message}`);
        }
    }

    async markNotificationAsRead(userId, notificationId) {
        try {
            await this.database.ref(`notifications/${userId}/${notificationId}`).update({
                read: true,
                readAt: Date.now()
            });
        } catch (error) {
            throw new Error(`Failed to mark notification as read: ${error.message}`);
        }
    }

    // Real-time Listeners
    onCourseUpdated(courseId, callback) {
        return this.database.ref(`courses/${courseId}`).on('value', snapshot => {
            callback(snapshot.val());
        });
    }

    onProgressUpdated(courseId, userId, callback) {
        return this.database.ref(`progress/${courseId}/${userId}`).on('value', snapshot => {
            callback(snapshot.val());
        });
    }

    onNewNotification(userId, callback) {
        return this.database.ref(`notifications/${userId}`).on('child_added', snapshot => {
            callback(snapshot.val());
        });
    }

    // Cleanup
    detachListener(path) {
        this.database.ref(path).off();
    }
}

// Export as singleton
export const databaseService = new DatabaseService();