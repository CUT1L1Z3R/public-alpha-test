/**
 * Custom navigation script for FreeFlixx
 * Enhances navigation and mobile experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle mobile navigation menu
    const navItems = document.querySelectorAll('.nav-item');

    // Set the active navigation item based on the current page
    const currentPath = window.location.pathname;

    // Handle active state for genres page
    const isGenresPage = currentPath.includes('/genres.html');

    // Fix navigation links to handle Cloudflare Pages routing
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const href = link.getAttribute('href');
        const section = link.getAttribute('data-section');

        // Fix links to handle index.html properly
        if (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '')) {
            // Already on index page, just add active class
            item.classList.add('active');
        } else if (currentPath.includes('/movies/') && section === 'movies') {
            item.classList.add('active');
        } else if (currentPath.includes('/tvshows/') && section === 'tv') {
            item.classList.add('active');
        } else if (currentPath.includes('/anime/') && section === 'anime') {
            item.classList.add('active');
        } else if (isGenresPage && section === 'genres') {
            item.classList.add('active');
        }

        // Add special handling for genre dropdown
        if (section === 'genres') {
            // Handle dropdown toggling on click for both mobile and desktop
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.nextElementSibling;
                if (dropdown) {
                    // Toggle dropdown display
                    const isOpen = dropdown.classList.contains('active');

                    if (isOpen) {
                        // Close the dropdown
                        dropdown.classList.remove('active');
                        dropdown.style.display = 'none';
                        dropdown.style.opacity = '0';
                        dropdown.style.pointerEvents = 'none';
                        if (window.innerWidth <= 768) {
                            dropdown.style.transform = 'translateY(10px)';
                        } else {
                            dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                        }
                    } else {
                        // Open the dropdown
                        dropdown.classList.add('active');
                        dropdown.style.display = 'flex';
                        dropdown.style.opacity = '1';
                        dropdown.style.pointerEvents = 'auto';
                        if (window.innerWidth <= 768) {
                            dropdown.style.transform = 'translateY(0)';
                        } else {
                            dropdown.style.transform = 'translateX(-50%) translateY(0)';
                        }

                        // Position dropdown properly
                        const rect = item.getBoundingClientRect();
                        dropdown.style.top = '100%';

                        // Close dropdown when clicking outside of it
                        const closeDropdown = function(event) {
                            if (!dropdown.contains(event.target) && !link.contains(event.target)) {
                                dropdown.classList.remove('active');
                                dropdown.style.display = 'none';
                                dropdown.style.opacity = '0';
                                dropdown.style.pointerEvents = 'none';
                                if (window.innerWidth <= 768) {
                                    dropdown.style.transform = 'translateY(10px)';
                                } else {
                                    dropdown.style.transform = 'translateX(-50%) translateY(10px)';
                                }
                                document.removeEventListener('click', closeDropdown);
                            }
                        };

                        // Add event listener with a small delay to prevent immediate closing
                        setTimeout(() => {
                            document.addEventListener('click', closeDropdown);
                        }, 100);
                    }
                }
            });

            // Close dropdown when clicking on a genre link
            const dropdownLinks = item.querySelectorAll('.dropdown-content a');
            dropdownLinks.forEach(dropLink => {
                dropLink.addEventListener('click', function(e) {
                    // Allow normal navigation for genre links
                    // The dropdown will close because of the click outside handler
                });
            });
        } else {
            // Enhance navigation with error handling
            link.addEventListener('click', function(e) {
                // Check if we're already on this page - prevent navigation to avoid the error
                const isIndexPage = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '';

                // If we're already on the index page and clicking "All", prevent the navigation
                if (href === 'index.html' && isIndexPage && section === 'all') {
                    e.preventDefault();
                    return false;
                }

                // Always ensure the link isn't broken for sub-pages
                if (href === 'index.html' && (currentPath === '/anime/' || currentPath === '/movies/' || currentPath === '/tvshows/')) {
                    e.preventDefault();
                    window.location.href = '../index.html';
                }
            });
        }

        // Add touch-friendly navigation
        item.addEventListener('touchstart', function() {
            this.classList.add('nav-touch');
        });

        item.addEventListener('touchend', function() {
            this.classList.remove('nav-touch');
        });
    });

    // Improve mobile scrolling experience
    const header = document.querySelector('.header');
    const navMenu = document.querySelector('.nav-menu');

    if (header && navMenu) {
        let lastScrollTop = 0;

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (window.innerWidth <= 768) {
                // Mobile behavior
                if (scrollTop > lastScrollTop && scrollTop > 50) {
                    // Scrolling down - hide header
                    header.style.transform = 'translateY(-100%)';
                    navMenu.style.top = '0';
                } else {
                    // Scrolling up - show header
                    header.style.transform = 'translateY(0)';
                    navMenu.style.top = '60px';
                }
            } else {
                // Reset for desktop
                header.style.transform = 'translateY(0)';
                navMenu.style.top = '70px';
            }

            lastScrollTop = scrollTop;
        });
    }

    // Fix for iOS Safari bounce effect
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.closest('.movie-container')) {
            e.stopPropagation();
        }
    }, { passive: true });

    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
