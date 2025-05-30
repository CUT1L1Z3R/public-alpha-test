// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const dropdownItems = document.querySelectorAll('.dropdown');

    // Toggle mobile navigation
    function toggleMobileNav() {
        mobileNavToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    // Close mobile navigation
    function closeMobileNav() {
        mobileNavToggle.classList.remove('active');
        navMenu.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Close all dropdowns
        dropdownItems.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    // Handle mobile dropdown toggles
    function handleDropdownClick(e) {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            e.stopPropagation();

            const dropdown = e.target.closest('.dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');

                // Close other dropdowns
                dropdownItems.forEach(item => {
                    if (item !== dropdown) {
                        item.classList.remove('active');
                    }
                });
            }
        }
    }

    // Event listeners
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNav);
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileNav);
    }

    // Add event listener for mobile menu close button
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileNav);
    }

    // Handle dropdown clicks on mobile
    dropdownItems.forEach(dropdown => {
        const link = dropdown.querySelector('a[data-section="genres"]');
        if (link) {
            link.addEventListener('click', handleDropdownClick);
        }
    });

    // Handle mobile watchlist button
    const mobileWatchlistBtn = document.getElementById('mobileWatchlistBtn');
    if (mobileWatchlistBtn) {
        mobileWatchlistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger the same function as the desktop watchlist button
            const desktopWatchlistBtn = document.getElementById('goToWatchlist');
            if (desktopWatchlistBtn) {
                desktopWatchlistBtn.click();
            }
            // Close mobile navigation
            closeMobileNav();
        });
    }

    // Close navigation when clicking nav links (except dropdowns and mobile watchlist)
    const navLinks = document.querySelectorAll('.nav-item:not(.dropdown):not(.mobile-watchlist) a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileNav();
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileNav();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMobileNav();
        }
    });
});
