// Navigation handling
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links and sections
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Show corresponding section
        const sectionId = link.getAttribute('href').substring(1) + '-section';
        document.getElementById(sectionId).classList.add('active');
    });
});

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        button.classList.add('active');
        // Add filtering logic here
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

// Add interactivity for dashboard elements
document.querySelectorAll('.continue-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Handle course continuation
        window.location.href = '#courses';
    });
});

document.querySelector('.clear-all').addEventListener('click', () => {
    // Handle clearing activity list
    const activityList = document.querySelector('.activity-list');
    activityList.innerHTML = '<p class="text-center text-gray-500">No recent activity</p>';
});

// Add hover effects for course progress items
document.querySelectorAll('.course-progress-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-2px)';
        item.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
    });

    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = 'none';
    });
});

