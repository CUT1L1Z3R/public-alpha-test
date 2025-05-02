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
            // Add multiple event types for better mobile compatibility
            ['click', 'touchend'].forEach(eventType => {
                button.addEventListener(eventType, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Navigation button clicked:', this.className);

                    // Find the parent container
                    const container = this.closest('.movie-container');
                    if (!container) return;

                    // Find the movies box inside this container
                    const moviesBox = container.querySelector('.movies-box');
                    if (!moviesBox) return;

                    // Get the available width and calculate better scroll behavior
                    // Use visible item count to determine scroll amount for smooth motion
                    const containerWidth = moviesBox.clientWidth;
                    const firstItem = moviesBox.querySelector('.movie-item');

                    let scrollAmount = containerWidth * 0.8; // Default: 80% of container width

                    // For mobile devices, use a more appropriate scroll amount
                    if (window.innerWidth <= 768) {
                        // Get more accurate scroll amount based on item width + gap
                        if (firstItem) {
                            const itemWidth = firstItem.offsetWidth;
                            const itemGap = parseInt(getComputedStyle(moviesBox).columnGap || 20);
                            const visibleItems = Math.floor(containerWidth / (itemWidth + itemGap));

                            // Scroll exactly the number of fully visible items for better UX
                            scrollAmount = visibleItems * (itemWidth + itemGap);

                            // Ensure we scroll at least one item on very small screens
                            if (scrollAmount < itemWidth) scrollAmount = itemWidth + itemGap;
                        }
                    }

                    // Add a visual feedback class for button press
                    this.classList.add('button-active');

                    // Apply the scroll with enhanced smooth behavior
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

                    // Remove the visual feedback class after animation completes
                    setTimeout(() => {
                        this.classList.remove('button-active');
                    }, 300);
                }, { passive: false });
            });
        });

        // Improve loading performance by preloading visible movie items
        const movieBoxes = document.querySelectorAll('.movies-box');

        // Use Intersection Observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const images = container.querySelectorAll('img[loading="lazy"]');

                    // Preload first few visible images
                    for (let i = 0; i < Math.min(5, images.length); i++) {
                        images[i].loading = 'eager';
                    }

                    // Stop observing once loaded
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.1 });

        // Observe each movie container
        movieBoxes.forEach(box => {
            observer.observe(box);
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

        // Add CSS for button press feedback
        const style = document.createElement('style');
        style.textContent = `
            .button-active {
                transform: scale(0.95);
                opacity: 1 !important;
                background-color: rgba(0, 0, 0, 0.8) !important;
                transition: transform 0.1s ease-in-out, opacity 0.1s ease-in-out, background-color 0.1s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    });

    // Make functions available globally
    window.setupAllNavigationButtons = setupAllNavigationButtons;
    window.setupBannerNavigation = setupBannerNavigation;
    window.setupSectionNavigation = setupSectionNavigation;
})();
