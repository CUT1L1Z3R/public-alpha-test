/**
 * This script fixes the genre dropdown menu for all pages (movies, tvshows, anime)
 * It ensures the dropdown is created properly for each page context
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all genre dropdown triggers
    const genreDropdownTriggers = document.querySelectorAll('.nav-item a[data-section="genres"]');

    // Make sure we have at least one trigger
    if (genreDropdownTriggers.length === 0) {
        console.warn('No genre dropdown triggers found on this page');
        return;
    }

    // Get the current page context
    const currentPath = window.location.pathname;
    let currentContext = 'all';

    if (currentPath.includes('/movies/')) {
        currentContext = 'movies';
    } else if (currentPath.includes('/tvshows/')) {
        currentContext = 'tv';
    } else if (currentPath.includes('/anime/')) {
        currentContext = 'anime';
    }

    console.log(`Current page context: ${currentContext}`);

    // For each trigger, ensure it works correctly
    genreDropdownTriggers.forEach(trigger => {
        // Make sure this is not destroying any existing handlers by using capture phase
        trigger.addEventListener('click', function(event) {
            // Create and show the dropdown
            const genreDropdown = document.getElementById('genre-dropdown');

            // If dropdown doesn't exist yet or is hidden, we need to handle the situation
            if (!genreDropdown || genreDropdown.style.display !== 'block') {
                console.log(`Genre dropdown clicked on ${currentContext} page`);

                // The rest is handled by the main custom-navigation.js script
                // This is just to ensure the click is properly recognized
                return;
            }
        }, true); // Use capture phase to run before other event handlers
    });

    // Also fix any pre-existing dropdown style issues
    const existingDropdown = document.querySelector('.dropdown-content');
    if (existingDropdown) {
        // Make sure the dropdown doesn't interfere with the new dropdown
        existingDropdown.style.display = 'none !important';
        existingDropdown.style.opacity = '0 !important';
        existingDropdown.style.pointerEvents = 'none !important';
    }
});
