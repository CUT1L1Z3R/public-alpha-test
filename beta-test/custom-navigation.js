/**
 * Enhanced navigation for FreeFlix - inspired by andoks.cc
 * Custom navigation for movie sections with smooth scrolling and improved button handling
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

        // Ensure navigation buttons match container heights
        adjustNavigationButtonHeights();

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
                const containerWidth = moviesBox.clientWidth;
                const isSmallScreen = window.innerWidth <= 560;

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
                    scrollAmount = containerWidth * 0.65; // Slightly less than original for a more elegant feel
                }

                // Provide visual feedback
                this.classList.add('button-active');
                setTimeout(() => {
                    this.classList.remove('button-active');
                }, 200);

                // Create a smooth scroll animation
                if (this.classList.contains('previous')) {
                    smoothScroll(moviesBox, -scrollAmount);
                } else if (this.classList.contains('next')) {
                    smoothScroll(moviesBox, scrollAmount);
                }
            });
        });
    }

    /**
     * Custom smooth scroll function with easing for better visual effect
     */
    function smoothScroll(element, amount) {
        const startTime = performance.now();
        const startPosition = element.scrollLeft;
        const duration = 400; // ms - not too slow, not too fast

        // Easing function - easeOutQuad
        function easeOutQuad(t) {
            return t * (2 - t);
        }

        function step(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuad(progress);

            element.scrollLeft = startPosition + amount * easedProgress;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    /**
     * Adjust navigation button heights to match their containers
     */
    function adjustNavigationButtonHeights() {
        // Process each movie container to match button heights
        document.querySelectorAll('.movie-container').forEach(container => {
            // Get the actual height of the first movie item (if exists)
            const movieItem = container.querySelector('.movie-item');
            if (!movieItem) return;

            const movieHeight = movieItem.offsetHeight;

            // Get navigation buttons in this container
            const buttons = container.querySelectorAll('.navigation-button');

            // Set the buttons to match the movie height
            buttons.forEach(button => {
                button.style.height = `${movieHeight}px`;
            });
        });
    }

    /**
     * Creates the banner indicator dots
     */
    function createBannerIndicators() {
        if (!window.bannerItems || window.bannerItems.length <= 1) return;

        const indicators = document.getElementById('banner-indicators');
        if (!indicators) return;

        // Clear any existing indicators
        indicators.innerHTML = '';

        // Create indicator dots for each banner
        window.bannerItems.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'banner-dot';
            dot.setAttribute('data-index', index);

            // Add click event to navigate to specific banner
            dot.addEventListener('click', function() {
                const targetIndex = parseInt(this.getAttribute('data-index'));

                // Show navigation buttons when indicator dots are clicked
                const prevButton = document.getElementById('banner-prev');
                const nextButton = document.getElementById('banner-next');
                if (prevButton) prevButton.classList.add('active');
                if (nextButton) nextButton.classList.add('active');

                // Check if we're on mobile
                const isMobile = window.innerWidth <= 480;

                // Hide buttons after delay - longer on mobile for better touch interaction
                setTimeout(() => {
                    if (prevButton) prevButton.classList.remove('active');
                    if (nextButton) nextButton.classList.remove('active');
                }, isMobile ? 2500 : 1500);

                // Update current banner index
                window.currentBannerIndex = targetIndex;

                // Update banner using the appropriate function
                if (typeof window.showBannerAtIndex === 'function') {
                    window.showBannerAtIndex(targetIndex);
                }

                // Reset any auto-rotation
                if (window.bannerInterval) {
                    clearInterval(window.bannerInterval);
                    if (typeof window.startBannerSlideshow === 'function') {
                        window.startBannerSlideshow();
                    }
                }

                // Update active indicator
                updateActiveIndicator();
            });

            indicators.appendChild(dot);
        });

        // Initialize with current active indicator
        updateActiveIndicator();
    }

    /**
     * Updates which indicator dot is active based on current banner index
     */
    function updateActiveIndicator() {
        if (window.currentBannerIndex === undefined) return;

        const indicators = document.querySelectorAll('.banner-dot');

        // Remove active class from all dots
        indicators.forEach(dot => {
            dot.classList.remove('active');
        });

        // Add active class to current dot
        const activeDot = document.querySelector(`.banner-dot[data-index="${window.currentBannerIndex}"]`);
        if (activeDot) {
            activeDot.classList.add('active');
        }
    }

    /**
     * Set up banner navigation with improved touch handling
     */
    function setupBannerNavigation() {
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');
        const bannerIndicators = document.getElementById('banner-indicators');

        // Only proceed if we have banner items
        if (!window.bannerItems || window.bannerItems.length <= 1) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            if (bannerIndicators) bannerIndicators.style.display = 'none';
            return;
        }

        // Show navigation buttons but keep them initially hidden with CSS opacity
        if (prevButton) {
            prevButton.style.display = 'flex';
            prevButton.classList.remove('active');
        }
        if (nextButton) {
            nextButton.style.display = 'flex';
            nextButton.classList.remove('active');
        }

        // Set up event handlers with clean replacement to avoid duplicates
        if (prevButton) {
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.getElementById('banner-prev');

            if (newPrevButton) {
                newPrevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show both navigation buttons when one is clicked
                    const prevButton = document.getElementById('banner-prev');
                    const nextButton = document.getElementById('banner-next');
                    if (prevButton) prevButton.classList.add('active');
                    if (nextButton) nextButton.classList.add('active');

                    // Check if we're on mobile
                    const isMobile = window.innerWidth <= 480;

                    // Hide the buttons after a delay - longer on mobile for better accessibility
                    setTimeout(() => {
                        if (prevButton) prevButton.classList.remove('active');
                        if (nextButton) nextButton.classList.remove('active');
                    }, isMobile ? 2500 : 1500);

                    // Navigate to previous banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex - 1 + window.bannerItems.length) % window.bannerItems.length;

                        // Use the existing function if available
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        }

                        // Update the indicator dots
                        updateActiveIndicator();

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
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

                    // Show both navigation buttons when one is clicked
                    const prevButton = document.getElementById('banner-prev');
                    const nextButton = document.getElementById('banner-next');
                    if (prevButton) prevButton.classList.add('active');
                    if (nextButton) nextButton.classList.add('active');

                    // Check if we're on mobile
                    const isMobile = window.innerWidth <= 480;

                    // Hide the buttons after a delay - longer on mobile for better accessibility
                    setTimeout(() => {
                        if (prevButton) prevButton.classList.remove('active');
                        if (nextButton) nextButton.classList.remove('active');
                    }, isMobile ? 2500 : 1500);

                    // Navigate to next banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex + 1) % window.bannerItems.length;

                        // Use the existing function if available
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        }

                        // Update the indicator dots
                        updateActiveIndicator();

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
                            }
                        }
                    }
                });
            }
        }

        // Create the banner indicators
        createBannerIndicators();
    }

    /**
     * Briefly show and then hide banner navigation buttons
     * This gives users a hint that navigation is available
     */
    function showNavigationButtonsHint() {
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        // Only proceed if we have buttons and banner items
        if ((!prevButton || !nextButton) || !window.bannerItems || window.bannerItems.length <= 1) {
            return;
        }

        // Check if we're on mobile
        const isMobile = window.innerWidth <= 480;

        // Briefly show the buttons
        if (prevButton) prevButton.classList.add('active');
        if (nextButton) nextButton.classList.add('active');

        // Hide them after a delay - longer on mobile for better accessibility
        setTimeout(() => {
            if (prevButton) prevButton.classList.remove('active');
            if (nextButton) nextButton.classList.remove('active');
        }, isMobile ? 2500 : 1500);
    }

    // Make functions globally accessible for other scripts
    window.updateActiveIndicator = updateActiveIndicator;
    window.setupBannerNavigation = setupBannerNavigation;
    window.createBannerIndicators = createBannerIndicators;

    // Initialize everything when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Setup section navigation buttons
        setupSectionNavigation();

        // Make sure navigation button heights are set correctly
        adjustNavigationButtonHeights();

        // Setup banner navigation
        setupBannerNavigation();

        // Show a hint about navigation buttons after a short delay
        setTimeout(() => {
            showNavigationButtonsHint();
        }, 2000);

        // Also update the original update banner function to update indicators
        if (window.updateBanner && typeof window.updateBanner === 'function') {
            const originalUpdateBanner = window.updateBanner;
            window.updateBanner = function(banner) {
                if (typeof originalUpdateBanner === 'function') {
                    originalUpdateBanner.apply(this, arguments);
                }
                updateActiveIndicator();
            };
        }

        // Add window resize listener to adjust button heights when screen size changes
        let resizeTimeout;
        window.addEventListener('resize', function() {
            // Debounce to avoid excessive calls
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                adjustNavigationButtonHeights();
            }, 200);
        });
    });
})();
