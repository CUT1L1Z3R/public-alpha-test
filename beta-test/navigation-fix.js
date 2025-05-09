// Enhanced navigation functionality for both banner and sections
(function() {
    // Function to set up both banner and section navigation
    function setupAllNavigationButtons() {
        console.log("Setting up all navigation buttons");
        // 1. Set up banner navigation buttons
        setupBannerNavigation();

        // 2. Set up section navigation buttons (for movie rows)
        setupSectionNavigation();
    }

    // Function to set up section navigation (for movie rows)
    function setupSectionNavigation() {
        console.log("Setting up section navigation buttons");

        // Get all navigation buttons
        const navButtons = document.querySelectorAll('.navigation-button');

        // Remove existing event listeners to avoid duplicates
        navButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });

        // Set up event listeners for all navigation buttons
        document.querySelectorAll('.navigation-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navigation button clicked:', this.className);

                // Find the parent container
                const container = this.closest('.movie-container');
                if (!container) return;

                // Find the movies box inside this container
                const moviesBox = container.querySelector('.movies-box');
                if (!moviesBox) return;

                // Calculate scroll amount - 80% of container width for better visual movement
                const scrollAmount = moviesBox.clientWidth * 0.8;

                if (this.classList.contains('previous')) {
                    // Scroll left
                    moviesBox.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                } else if (this.classList.contains('next')) {
                    // Scroll right
                    moviesBox.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Improved banner navigation setup
    function setupBannerNavigation() {
        console.log("Setting up banner navigation buttons");
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        // Make sure bannerItems array is not empty
        if (!window.bannerItems || window.bannerItems.length <= 1) {
            console.log("Not enough banner items to enable navigation");
            // Hide navigation if we don't have multiple items
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            return;
        }

        // Show navigation buttons
        if (prevButton) prevButton.style.display = 'flex';
        if (nextButton) nextButton.style.display = 'flex';

        // Remove any existing event listeners to avoid duplicates
        if (prevButton) {
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.getElementById('banner-prev');

            if (newPrevButton) {
                console.log("Adding event listener to banner prev button");
                newPrevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Banner prev button clicked");

                    // Move to previous banner
                    window.currentBannerIndex = (window.currentBannerIndex - 1 + window.bannerItems.length) % window.bannerItems.length;

                    // Show the banner
                    updateBanner(window.bannerItems[window.currentBannerIndex]);

                    // Reset interval to prevent quick transitions
                    if (window.bannerInterval) {
                        clearInterval(window.bannerInterval);
                        startBannerRotation();
                    }
                });
            }
        }

        if (nextButton) {
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.getElementById('banner-next');

            if (newNextButton) {
                console.log("Adding event listener to banner next button");
                newNextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Banner next button clicked");

                    // Move to next banner
                    window.currentBannerIndex = (window.currentBannerIndex + 1) % window.bannerItems.length;

                    // Show the banner
                    updateBanner(window.bannerItems[window.currentBannerIndex]);

                    // Reset interval to prevent quick transitions
                    if (window.bannerInterval) {
                        clearInterval(window.bannerInterval);
                        startBannerRotation();
                    }
                });
            }
        }
    }

    // When document is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded - setting up navigation");
        // Setup all navigation buttons
        setupAllNavigationButtons();

        // Override the original startBannerRotation to include our enhanced navigation
        const originalStartBannerRotation = window.startBannerRotation;
        window.startBannerRotation = function() {
            if (typeof originalStartBannerRotation === 'function') {
                originalStartBannerRotation();
            }
            // Make sure banner navigation works
            setupBannerNavigation();
        };
    });

    // Make functions available globally
    window.setupAllNavigationButtons = setupAllNavigationButtons;
    window.setupBannerNavigation = setupBannerNavigation;
    window.setupSectionNavigation = setupSectionNavigation;
})();
