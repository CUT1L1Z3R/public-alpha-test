/**
 * Global navigation fixes for mobile devices
 * Ensures navigation buttons are properly positioned and sized in all containers
 */

// Fix for iOS and Android touch navigation issues
(function() {
    // Fix for movie sections scrolling
    const containers = document.querySelectorAll('.movies-box');

    containers.forEach(container => {
        // Ensure containers are scrollable
        container.style.overflowX = 'auto';
        container.style.webkitOverflowScrolling = 'touch';

        // Add passive touch events for better performance
        container.addEventListener('touchstart', function() {}, {passive: true});
        container.addEventListener('touchmove', function() {}, {passive: true});
    });

    // Fix for banner navigation on touch devices
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        let startX, startY, startTime;
        let isDragging = false;

        // Touch start event
        bannerContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = new Date().getTime();
            isDragging = true;
        }, {passive: true});

        // Touch move event
        bannerContainer.addEventListener('touchmove', function(e) {
            if (!isDragging) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            // Detect horizontal swipe (if more horizontal than vertical)
            const diffX = startX - touchX;
            const diffY = Math.abs(startY - touchY);

            // Only handle horizontal swipes
            if (diffY > Math.abs(diffX) * 0.8) return;

            // Prevent default only if it's a horizontal swipe
            e.preventDefault();
        }, {passive: false});

        // Navigation fix for FreeFlixx website
        // This prevents the error when clicking on the "All" section twice
        document.addEventListener('DOMContentLoaded', () => {
            // Find all navigation links
            const navLinks = document.querySelectorAll('nav a');

            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    // If we're already on the same page and it's the active link,
                    // prevent the default navigation which causes the error
                    const href = link.getAttribute('href');
                    const section = link.getAttribute('data-section');

                    // Special handling for "All" section on index page
                    if (section === 'all' && isCurrentPage(href)) {
                        console.log('Preventing navigation - already on index page');
                        e.preventDefault();
                        return false;
                    }
                });
            });
        });

        // Helper function to check if the link is marked as active
        function isActiveLink(link) {
            return link.classList.contains('active') ||
                link.parentElement.classList.contains('active');
        }

        // Helper function to check if we're already on the page the link points to
        function isCurrentPage(href) {
            if (!href) return false;

            // Get the current path and filename
            const currentPath = window.location.pathname;
            const currentFilename = currentPath.split('/').pop() || 'index.html';

            // Get the target filename
            const targetFilename = href.split('/').pop();

            // Check if we're already on the page the link points to
            return currentFilename === targetFilename ||
                (currentFilename === '' && targetFilename === 'index.html') ||
                (currentPath.endsWith('/') && targetFilename === 'index.html') ||
                (currentPath === '/' && targetFilename === 'index.html');
        }

        // Touch end event
        bannerContainer.addEventListener('touchend', function(e) {
            if (!isDragging) return;

            const endX = e.changedTouches[0].clientX;
            const endTime = new Date().getTime();
            const diffX = startX - endX;
            const elapsedTime = endTime - startTime;

            // If quick, horizontal swipe detected
            if (elapsedTime < 300 && Math.abs(diffX) > 30) {
                // Get navigation buttons
                const prevButton = document.getElementById('banner-prev');
                const nextButton = document.getElementById('banner-next');

                // Trigger the appropriate button click
                if (diffX > 0 && nextButton) {
                    // Swipe left - go to next banner
                    nextButton.click();
                } else if (diffX < 0 && prevButton) {
                    // Swipe right - go to previous banner
                    prevButton.click();
                }
            }

            isDragging = false;
        }, {passive: true});
    }
})();

// Improved navigation button positioning for mobile, especially for portrait banners
document.addEventListener('DOMContentLoaded', function() {
    function fixNavigationButtons() {
        // Fix for TVShow Netflix Originals container
        const netflixContainers = document.querySelectorAll('.netflix-container');

        netflixContainers.forEach(container => {
            // Get existing or create navigation buttons
            let prevButton = container.querySelector('.netflix-previous');
            let nextButton = container.querySelector('.netflix-next');

            // Ensure buttons exist - if not, create them
            if (!prevButton) {
                prevButton = document.createElement('button');
                prevButton.className = 'navigation-button netflix-previous';
                prevButton.textContent = '<';
                container.appendChild(prevButton);
            }

            if (!nextButton) {
                nextButton = document.createElement('button');
                nextButton.className = 'navigation-button netflix-next';
                nextButton.textContent = '>';
                container.appendChild(nextButton);
            }

            // Set correct positioning, especially for mobile
            if (window.innerWidth <= 768) {
                // Mobile positioning
                prevButton.style.position = 'absolute';
                prevButton.style.left = '0';
                prevButton.style.top = '50%';
                prevButton.style.transform = 'translateY(-50%)';
                nextButton.style.position = 'absolute';
                nextButton.style.right = '0';
                nextButton.style.top = '50%';
                nextButton.style.transform = 'translateY(-50%)';

                // Set higher z-index to ensure visibility
                prevButton.style.zIndex = '15';
                nextButton.style.zIndex = '15';

                // Ensure opacity is visible enough on mobile
                prevButton.style.opacity = '0.7';
                nextButton.style.opacity = '0.7';
            } else {
                // Reset for desktop
                prevButton.style.position = '';
                prevButton.style.left = '';
                prevButton.style.top = '';
                prevButton.style.transform = '';
                prevButton.style.zIndex = '';
                prevButton.style.opacity = '';
                nextButton.style.position = '';
                nextButton.style.right = '';
                nextButton.style.top = '';
                nextButton.style.transform = '';
                nextButton.style.zIndex = '';
                nextButton.style.opacity = '';
            }
        });

        // Fix for all movie containers to ensure buttons are aligned correctly
        const movieContainers = document.querySelectorAll('.movie-container');

        movieContainers.forEach(container => {
            // Get navigation buttons
            const prevButton = container.querySelector('.previous');
            const nextButton = container.querySelector('.next');

            if (prevButton && nextButton) {
                if (window.innerWidth <= 768) {
                    // Mobile positioning
                    prevButton.style.position = 'absolute';
                    prevButton.style.left = '0';
                    prevButton.style.top = '50%';
                    prevButton.style.transform = 'translateY(-50%)';
                    nextButton.style.position = 'absolute';
                    nextButton.style.right = '0';
                    nextButton.style.top = '50%';
                    nextButton.style.transform = 'translateY(-50%)';

                    // Set higher z-index to ensure visibility
                    prevButton.style.zIndex = '15';
                    nextButton.style.zIndex = '15';

                    // Ensure opacity is visible enough on mobile
                    prevButton.style.opacity = '0.7';
                    nextButton.style.opacity = '0.7';
                } else {
                    // Reset for desktop
                    prevButton.style.position = '';
                    prevButton.style.left = '';
                    prevButton.style.top = '';
                    prevButton.style.transform = '';
                    prevButton.style.zIndex = '';
                    prevButton.style.opacity = '';
                    nextButton.style.position = '';
                    nextButton.style.right = '';
                    nextButton.style.top = '';
                    nextButton.style.transform = '';
                    nextButton.style.zIndex = '';
                    nextButton.style.opacity = '';
                }
            }
        });
    }

    // Run the fix initially
    fixNavigationButtons();

    // Re-run the fix on window resize to handle orientation changes
    window.addEventListener('resize', fixNavigationButtons);
});
