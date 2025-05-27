/**
 * Navigation fix for mobile devices
 * Ensures navigation buttons are properly positioned and visible
 */

document.addEventListener('DOMContentLoaded', function() {
  // Fix for mobile navigation buttons
  function fixMobileNavigation() {
    // Only apply fixes if on mobile
    if (window.innerWidth <= 768) {
      // Get all movie containers
      const movieContainers = document.querySelectorAll('.movie-container');

      // Process each container
      movieContainers.forEach(container => {
        // Make sure container has proper styles
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.position = 'relative';
        container.style.padding = '0';

        // Get the previous and next buttons
        const prevButton = container.querySelector('.navigation-button.previous');
        const nextButton = container.querySelector('.navigation-button.next');

        // Ensure buttons are properly visible and positioned
        if (prevButton) {
          prevButton.style.opacity = '0.8';
          prevButton.style.left = '0';
          prevButton.style.zIndex = '15';
          prevButton.style.position = 'absolute';
          prevButton.style.top = '50%';
          prevButton.style.transform = 'translateY(-50%)';
        }

        if (nextButton) {
          nextButton.style.opacity = '0.8';
          nextButton.style.right = '0';
          nextButton.style.zIndex = '15';
          nextButton.style.position = 'absolute';
          nextButton.style.top = '50%';
          nextButton.style.transform = 'translateY(-50%)';
        }

        // Get the movies-box
        const moviesBox = container.querySelector('.movies-box');
        if (moviesBox) {
          moviesBox.style.paddingLeft = '0';
          moviesBox.style.paddingRight = '0';
          moviesBox.style.overflowX = 'auto';
          moviesBox.style.webkitOverflowScrolling = 'touch';
        }
      });
    } else {
      // Reset styles for desktop
      const movieContainers = document.querySelectorAll('.movie-container');
      movieContainers.forEach(container => {
        container.style.display = '';
        container.style.alignItems = '';
        container.style.position = '';
        container.style.padding = '';
        const prevButton = container.querySelector('.navigation-button.previous');
        const nextButton = container.querySelector('.navigation-button.next');
        if (prevButton) {
          prevButton.style.opacity = '';
          prevButton.style.left = '';
          prevButton.style.zIndex = '';
          prevButton.style.position = '';
          prevButton.style.top = '';
          prevButton.style.transform = '';
        }
        if (nextButton) {
          nextButton.style.opacity = '';
          nextButton.style.right = '';
          nextButton.style.zIndex = '';
          nextButton.style.position = '';
          nextButton.style.top = '';
          nextButton.style.transform = '';
        }
        const moviesBox = container.querySelector('.movies-box');
        if (moviesBox) {
          moviesBox.style.paddingLeft = '';
          moviesBox.style.paddingRight = '';
          moviesBox.style.overflowX = '';
          moviesBox.style.webkitOverflowScrolling = '';
        }
      });
    }
  }

  // Run the fix initially
  fixMobileNavigation();

  // Also run on resize
  window.addEventListener('resize', fixMobileNavigation);

  // Also run on orientation change for mobile devices
  window.addEventListener('orientationchange', fixMobileNavigation);
});
