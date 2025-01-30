// Course Management Class
class CourseManager {
    constructor() {
        this.currentCourse = null;
        this.currentModule = null;
        this.currentLesson = null;
    }

    // Initialize course page
    async initCoursePage(courseId) {
        try {
            const courseData = await this.getCourseDetails(courseId);
            this.currentCourse = courseData;
            this.renderCourseContent(courseData);
            this.initializeProgress();
        } catch (error) {
            console.error('Error initializing course:', error);
            showError('Failed to load course content');
        }
    }

    // Get course details
    async getCourseDetails(courseId) {
        const snapshot = await db.courses.get(courseId).once('value');
        return snapshot.val();
    }

    // Render course content
    renderCourseContent(courseData) {
        const courseContainer = document.getElementById('courseContent');
        courseContainer.innerHTML = `
            <div class="course-header">
                <h1>${courseData.title}</h1>
                <p>${courseData.description}</p>
                <div class="course-meta">
                    <span><i class="icon-user"></i> ${courseData.instructor}</span>
                    <span><i class="icon-clock"></i> ${courseData.duration}</span>
                    <span><i class="icon-level"></i> ${courseData.level}</span>
                </div>
            </div>
            <div class="course-progress">
                <div class="progress-bar">
                    <div class="progress-value" style="width: ${courseData.progress || 0}%"></div>
                </div>
                <span class="progress-text">${courseData.progress || 0}% Complete</span>
            </div>
            <div class="course-content">
                <div class="course-sidebar">
                    ${this.renderModuleList(courseData.modules)}
                </div>
                <div class="content-area">
                    ${this.renderWelcomeScreen()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    // Render module list
    renderModuleList(modules) {
        if (!modules) return '<p>No modules available</p>';

        return `
            <div class="module-list">
                ${Object.entries(modules).map(([moduleId, module]) => `
                    <div class="module-item" data-module-id="${moduleId}">
                        <div class="module-header">
                            <h3>${module.title}</h3>
                            <span class="module-progress">${this.calculateModuleProgress(module)}%</span>
                        </div>
                        <div class="lesson-list">
                            ${this.renderLessonList(module.lessons)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render lesson list
    renderLessonList(lessons) {
        if (!lessons) return '<p>No lessons available</p>';

        return `
            <ul>
                ${Object.entries(lessons).map(([lessonId, lesson]) => `
                    <li class="lesson-item ${lesson.completed ? 'completed' : ''}" 
                        data-lesson-id="${lessonId}">
                        <span class="lesson-title">${lesson.title}</span>
                        <span class="lesson-duration">${lesson.duration}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    // Calculate module progress
    calculateModuleProgress(module) {
        if (!module.lessons) return 0;
        const lessons = Object.values(module.lessons);
        const completedLessons = lessons.filter(lesson => lesson.completed).length;
        return Math.round((completedLessons / lessons.length) * 100);
    }

    // Render welcome screen
    renderWelcomeScreen() {
        return `
            <div class="welcome-screen">
                <h2>Welcome to ${this.currentCourse.title}</h2>
                <p>Select a lesson from the sidebar to begin learning.</p>
                <div class="course-overview">
                    <h3>Course Overview</h3>
                    <ul>
                        ${this.currentCourse.objectives.map(objective => 
                            `<li>${objective}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Load lesson content
    async loadLesson(lessonId) {
        try {
            const lesson = await this.getLessonContent(lessonId);
            this.currentLesson = lesson;
            this.renderLessonContent(lesson);
            this.updateProgress(lessonId);
        } catch (error) {
            console.error('Error loading lesson:', error);
            showError('Failed to load lesson content');
        }
    }

    // Get lesson content
    async getLessonContent(lessonId) {
        const snapshot = await db.content
            .get(this.currentCourse.id, lessonId)
            .once('value');
        return snapshot.val();
    }

    // Render lesson content
    renderLessonContent(lesson) {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="lesson-content">
                <h2>${lesson.title}</h2>
                <div class="lesson-meta">
                    <span>${lesson.duration}</span>
                    <span>${lesson.type}</span>
                </div>
                <div class="lesson-body">
                    ${this.renderContentByType(lesson)}
                </div>
                <div class="lesson-navigation">
                    ${this.renderLessonNavigation()}
                </div>
            </div>
        `;
    }

    // Render content based on type
    renderContentByType(lesson) {
        switch (lesson.type) {
            case 'video':
                return this.renderVideoContent(lesson);
            case 'text':
                return this.renderTextContent(lesson);
            case 'quiz':
                return this.renderQuizContent(lesson);
            default:
                return `<p>Content type not supported</p>`;
        }
    }

    // Render video content
    renderVideoContent(lesson) {
        return `
            <div class="video-container">
                <video controls>
                    <source src="${lesson.videoUrl}" type="video/mp4">
                    Your browser does not support video playback.
                </video>
            </div>
            <div class="video-transcript">
                <h3>Transcript</h3>
                <p>${lesson.transcript}</p>
            </div>
        `;
    }

    // Render text content
    renderTextContent(lesson) {
        return `
            <div class="text-content">
                ${lesson.content}
            </div>
            ${lesson.attachments ? this.renderAttachments(lesson.attachments) : ''}
        `;
    }

    // Render quiz content
    renderQuizContent(lesson) {
        return `
            <div class="quiz-container">
                <h3>${lesson.quiz.title}</h3>
                <form id="quizForm">
                    ${lesson.quiz.questions.map((question, index) => `
                        <div class="quiz-question">
                            <p>${index + 1}. ${question.text}</p>
                            <div class="quiz-options">
                                ${question.options.map((option, optIndex) => `
                                    <label class="quiz-option">
                                        <input type="radio" 
                                               name="question${index}" 
                                               value="${optIndex}">
                                        ${option}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <button type="submit" class="btn-primary">Submit Quiz</button>
                </form>
            </div>
        `;
    }

    // Update progress
    async updateProgress(lessonId) {
        try {
            const userId = auth.getCurrentUser().uid;
            await db.enrollments.updateProgress(
                userId,
                this.currentCourse.id,
                {
                    lessonId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    completed: true
                }
            );

            // Check if course is completed
            this.checkCourseCompletion();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    // Check course completion
    async checkCourseCompletion() {
        try {
            const userId = auth.getCurrentUser().uid;
            const enrollment = await db.enrollments
                .get(userId, this.currentCourse.id)
                .once('value');
            
            const progress = enrollment.val().progress;
            
            if (progress === 100) {
                // Generate certificate
                await this.generateCertificate(userId);
                
                // Show completion modal
                this.showCompletionModal();
                
                // Log activity
                await db.activities.create(userId, {
                    type: 'course_completed',
                    courseId: this.currentCourse.id,
                    courseName: this.currentCourse.title
                });
            }
        } catch (error) {
            console.error('Error checking course completion:', error);
        }
    }

    // Generate certificate
    async generateCertificate(userId) {
        try {
            await db.certificates.create(userId, this.currentCourse.id, {
                courseName: this.currentCourse.title,
                studentName: auth.getCurrentUser().displayName,
                instructorName: this.currentCourse.instructor,
                completionDate: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error generating certificate:', error);
            showError('Failed to generate certificate');
        }
    }

    // Show completion modal
    showCompletionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>Congratulations!</h2>
                </div>
                <div class="modal-body">
                    <p>You have successfully completed the course "${this.currentCourse.title}"!</p>
                    <p>Your certificate has been generated and is available in your profile.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="window.location.href='certificates.html'">
                        View Certificate
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Attach event listeners
    attachEventListeners() {
        // Module click handlers
        document.querySelectorAll('.module-item').forEach(module => {
            module.querySelector('.module-header').addEventListener('click', () => {
                module.classList.toggle('expanded');
            });
        });

        // Lesson click handlers
        document.querySelectorAll('.lesson-item').forEach(lesson => {
            lesson.addEventListener('click', () => {
                this.loadLesson(lesson.dataset.lessonId);
            });
        });

        // Quiz form submission
        const quizForm = document.getElementById('quizForm');
        if (quizForm) {
            quizForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuizSubmission(e.target);
            });
        }
    }

    // Handle quiz submission
    async handleQuizSubmission(form) {
        const answers = {};
        const formData = new FormData(form);
        
        for (const [name, value] of formData.entries()) {
            answers[name] = parseInt(value);
        }

        try {
            const score = this.gradeQuiz(answers);
            await this.saveQuizResult(score);
            this.showQuizResults(score);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showError('Failed to submit quiz');
        }
    }

    // Grade quiz
    gradeQuiz(answers) {
        const quiz = this.currentLesson.quiz;
        let correctAnswers = 0;

        quiz.questions.forEach((question, index) => {
            if (answers[`question${index}`] === question.correctAnswer) {
                correctAnswers++;
            }
        });

        return (correctAnswers / quiz.questions.length) * 100;
    }

    // Save quiz result
    async saveQuizResult(score) {
        const userId = auth.getCurrentUser().uid;
        await db.assessments.create(this.currentCourse.id, {
            lessonId: this.currentLesson.id,
            userId,
            score,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // Show quiz results
    showQuizResults(score) {
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'quiz-results';
        resultsDiv.innerHTML = `
            <h3>Quiz Results</h3>
            <p>Your score: ${score}%</p>
            <p>${score >= 70 ? 'Congratulations! You passed!' : 'Please try again.'}</p>
            ${score >= 70 ? 
                '<button class="btn-primary" onclick="courseManager.nextLesson()">Continue</button>' :
                '<button class="btn-secondary" onclick="courseManager.retryQuiz()">Retry Quiz</button>'
            }
        `;

        document.querySelector('.quiz-container').replaceWith(resultsDiv);
    }

    // Navigate to next lesson
    nextLesson() {
        // Implementation for navigation to next lesson
    }

    // Retry quiz
    retryQuiz() {
        this.loadLesson(this.currentLesson.id);
    }

    // Utility functions
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.textContent = message;
        document.querySelector('.content-area').prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    formatDuration(duration) {
        return duration.replace(/PT(\d+H)?(\d+M)?(\d+S)?/, (_, h, m, s) => {
            return [
                h ? h.replace('H', 'h') : '',
                m ? m.replace('M', 'm') : '',
                s ? s.replace('S', 's') : ''
            ].filter(Boolean).join(' ');
        });
    }
}