/**
 * Additional fix for TV Shows navigation buttons
 * Ensures all navigation buttons work correctly and have the proper height
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fix for Netflix Originals navigation buttons
    function fixNetflixNavigationButtons() {
        const netflixPrevBtn = document.querySelector('.netflix-previous');
        const netflixNextBtn = document.querySelector('.netflix-next');
        const netflixContainer = document.querySelector('.netflix-container');

        if (netflixPrevBtn && netflixNextBtn && netflixContainer) {
            // Ensure proper height
            netflixPrevBtn.style.height = '340px';
            netflixNextBtn.style.height = '340px';

            // Ensure container has proper height
            netflixContainer.style.minHeight = '380px';

            // Add event listeners to ensure they work
            netflixPrevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                netflixContainer.scrollBy({
                    left: -800,
                    behavior: 'smooth'
                });
            });

            netflixNextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                netflixContainer.scrollBy({
                    left: 800,
                    behavior: 'smooth'
                });
            });
        }
    }

    // Fix for all other navigation buttons
    function fixAllNavigationButtons() {
        const scrollDistance = 800;
        const allSections = document.querySelectorAll('.movie-section, .tv-section');

        allSections.forEach(section => {
            const prevButton = section.querySelector('.navigation-button.previous');
            const nextButton = section.querySelector('.navigation-button.next');
            const moviesBox = section.querySelector('.movies-box');

            if (prevButton && moviesBox && !prevButton.classList.contains('netflix-previous')) {
                prevButton.style.height = '170px';
                prevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    moviesBox.scrollBy({
                        left: -scrollDistance,
                        behavior: 'smooth'
                    });
                });
            }

            if (nextButton && moviesBox && !nextButton.classList.contains('netflix-next')) {
                nextButton.style.height = '170px';
                nextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    moviesBox.scrollBy({
                        left: scrollDistance,
                        behavior: 'smooth'
                    });
                });
            }
        });
    }

    // Run the fixes
    setTimeout(() => {
        fixNetflixNavigationButtons();
        fixAllNavigationButtons();
    }, 1500); // Ensure content is loaded first
});
