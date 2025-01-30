// Get DOM elements
const termsLinks = document.querySelectorAll('a[href="#terms"]');
const privacyLinks = document.querySelectorAll('a[href="#privacy"]');
const legalModal = document.createElement('div');
legalModal.className = 'legal-modal';

// Create modal structure
legalModal.innerHTML = `
    <div class="modal-content">
        <button class="modal-close" aria-label="Close modal">&times;</button>
        <div class="modal-body"></div>
    </div>
`;

// Add modal to document
document.body.appendChild(legalModal);

// Fetch legal content
async function fetchLegalContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch content');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.querySelector('.legal-content .container').innerHTML;
    } catch (error) {
        console.error('Error loading content:', error);
        return '<p>Failed to load content. Please try again later.</p>';
    }
}

// Show modal
function showModal(content) {
    legalModal.querySelector('.modal-body').innerHTML = content;
    legalModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus trap
    const focusableElements = legalModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length) {
        focusableElements[0].focus();
    }
}

// Close modal
function closeModal() {
    legalModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Setup event listeners
function setupEventListeners() {
    // Terms links
    termsLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const content = await fetchLegalContent('terms.html');
            showModal(content);
        });
        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', 'View Terms of Service');
    });

    // Privacy links
    privacyLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const content = await fetchLegalContent('privacy.html');
            showModal(content);
        });
        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', 'View Privacy Policy');
    });

    // Close button click
    legalModal.querySelector('.modal-close').addEventListener('click', closeModal);

    // Click outside modal
    legalModal.addEventListener('click', (e) => {
        if (e.target === legalModal) {
            closeModal();
        }
    });

    // Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && legalModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Prevent scroll propagation
    const modalContent = legalModal.querySelector('.modal-content');
    modalContent.addEventListener('wheel', (e) => {
        const scrollTop = modalContent.scrollTop;
        const scrollHeight = modalContent.scrollHeight;
        const height = modalContent.clientHeight;

        // Allow scroll if not at top or bottom
        if ((scrollTop === 0 && e.deltaY < 0) || 
            (scrollTop + height >= scrollHeight && e.deltaY > 0)) {
            e.preventDefault();
        }
        e.stopPropagation();
    });

    // Handle modal content scroll
    modalContent.addEventListener('scroll', () => {
        const scrolled = modalContent.scrollTop > 0;
        modalContent.classList.toggle('scrolled', scrolled);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    // Setup signup form behavior if on signup page
    if (window.location.pathname.includes('signup.html')) {
        const termsCheckbox = document.getElementById('terms');
        const submitButton = document.querySelector('button[type="submit"]');
        
        if (termsCheckbox && submitButton) {
            // Update submit button state based on checkbox
            const updateSubmitButton = () => {
                submitButton.disabled = !termsCheckbox.checked;
            };

            termsCheckbox.addEventListener('change', updateSubmitButton);
            updateSubmitButton(); // Initial state
        }
    }
});