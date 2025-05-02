/**
 * Enhanced navigation for movie sections with smooth scrolling
 */
(function() {
    /**
     * Set up navigation buttons for sections with improved scrolling
     */
    function setupSectionNavigation() {
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

                // Find the parent container
                const container = this.closest('.movie-container');
                if (!container) return;

                // Find the movies box inside this container
                const moviesBox = container.querySelector('.movies-box');
                if (!moviesBox) return;

                // Calculate scroll amount based on device and container width
                const itemWidth = 220; // Base movie item width
                const gap = 15; // Gap between items
                const isSmallScreen = window.innerWidth <= 560;
                const containerWidth = moviesBox.clientWidth;

                // Adjust scroll amount for different screen sizes
                let scrollAmount;

                if (isSmallScreen) {
                    // For mobile, use a smaller scroll amount that feels more natural
                    scrollAmount = containerWidth * 0.85;
                } else if (window.innerWidth <= 780) {
                    // For tablets
                    scrollAmount = containerWidth * 0.7;
                } else {
                    // For desktop
                    scrollAmount = containerWidth * 0.75;
                }

                // Provide visual feedback
                this.classList.add('button-active');
                setTimeout(() => {
                    this.classList.remove('button-active');
                }, 200);

                // Apply the scroll
                if (this.classList.contains('previous')) {
                    moviesBox.scrollBy({
                        left: -scrollAmount,
                        behavior: 'auto' // Use 'auto' instead of 'smooth' for better performance with our custom momentum
                    });
                } else if (this.classList.contains('next')) {
                    moviesBox.scrollBy({
                        left: scrollAmount,
                        behavior: 'auto'
                    });
                }
            });
        });
    }

    /**
     * Set up banner navigation with improved touch handling
     */
    function setupBannerNavigation() {
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        // Only proceed if we have banner items
        if (!window.bannerItems || window.bannerItems.length <= 1) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            return;
        }

        // Show navigation buttons
        if (prevButton) prevButton.style.display = 'flex';
        if (nextButton) nextButton.style.display = 'flex';

        // Set up event handlers with clean replacement to avoid duplicates
        if (prevButton) {
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.getElementById('banner-prev');

            if (newPrevButton) {
                newPrevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show visual feedback
                    this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    setTimeout(() => {
                        this.style.backgroundColor = '';
                    }, 150);

                    // Navigate to previous banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex - 1 + window.bannerItems.length) % window.bannerItems.length;

                        // Use the existing function if available, otherwise use a simpler approach
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        } else if (typeof window.updateBanner === 'function' && window.bannerItems[window.currentBannerIndex]) {
                            window.updateBanner(window.bannerItems[window.currentBannerIndex]);
                        }

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
                            } else if (typeof window.startBannerRotation === 'function') {
                                window.startBannerRotation();
                            }
                        }
                    }
                });
            }
        }

        if (nextButton) {
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.getElementById('banner-next');

            if (newNextButton) {
                newNextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show visual feedback
                    this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    setTimeout(() => {
                        this.style.backgroundColor = '';
                    }, 150);

                    // Navigate to next banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex + 1) % window.bannerItems.length;

                        // Use the existing function if available, otherwise use a simpler approach
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        } else if (typeof window.updateBanner === 'function' && window.bannerItems[window.currentBannerIndex]) {
                            window.updateBanner(window.bannerItems[window.currentBannerIndex]);
                        }

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
                            } else if (typeof window.startBannerRotation === 'function') {
                                window.startBannerRotation();
                            }
                        }
                    }
                });
            }
        }
    }

    /**
     * Add CSS for better navigation button feedback
     */
    function addNavigationButtonStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .navigation-button {
                transition: background-color 0.15s ease-out, opacity 0.2s ease !important;
            }
            .navigation-button:active,
            .button-active {
                background-color: rgba(0, 0, 0, 0.8) !important;
                opacity: 1 !important;
            }
            @media only screen and (max-width: 780px) {
                .navigation-button {
                    opacity: 0.6 !important;
                    background-color: rgba(0, 0, 0, 0.7) !important;
                    width: 40px !important;
                }
                .movie-container:hover .navigation-button {
                    opacity: 0.75 !important;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Initialize everything when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Setup section navigation buttons
        setupSectionNavigation();

        // Setup banner navigation
        setupBannerNavigation();

        // Add styles for navigation buttons
        addNavigationButtonStyles();

        // Fix any window-level functions
        if (window.startBannerRotation && typeof window.startBannerRotation === 'function') {
            const originalFn = window.startBannerRotation;
            window.startBannerRotation = function() {
                if (typeof originalFn === 'function') {
                    originalFn.apply(this, arguments);
                }
                setupBannerNavigation();
            };
        }

        if (window.startBannerSlideshow && typeof window.startBannerSlideshow === 'function') {
            const originalFn = window.startBannerSlideshow;
            window.startBannerSlideshow = function() {
                if (typeof originalFn === 'function') {
                    originalFn.apply(this, arguments);
                }
                setupBannerNavigation();
            };
        }
    });
})();
