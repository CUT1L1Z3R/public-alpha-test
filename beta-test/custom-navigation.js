/**
 * Custom navigation script for FreeFlixx
 * Enhances navigation and mobile experience
 * Fixed genre dropdown scrolling issue
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fix for Safari/mobile scrolling issues with genre dropdown
    let genreDropdownVisible = false;

    // Global handler to ensure dropdown content stays visible when scrolling
    function fixVisibility(e) {
        if (!genreDropdownVisible) return;

        const dropdown = document.getElementById('genre-dropdown');
        if (!dropdown) return;

        // Force all elements to be visible
        const elements = dropdown.querySelectorAll('*');
        elements.forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';

            // Use appropriate display value based on element type
            if (el.tagName === 'UL') {
                el.style.display = 'block';
            } else if (el.tagName === 'LI') {
                el.style.display = 'list-item';
            } else if (el.tagName === 'A') {
                el.style.display = 'block';
            } else if (el.classList.contains('dropdown-column')) {
                el.style.display = 'block';
            }
        });
    }

    // Add global event listeners to fix visibility
    ['scroll', 'touchmove', 'touchstart', 'touchend'].forEach(eventType => {
        document.addEventListener(eventType, fixVisibility, { passive: true });
    });

    // Handle mobile navigation menu
    const navItems = document.querySelectorAll('.nav-item');

    // Set the active navigation item based on the current page
    const currentPath = window.location.pathname;

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
        }

        // Add special handling for genre dropdown
        if (section === 'genres') {
            // Handle dropdown toggling on click for both mobile and desktop
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Create or toggle the dropdown genre menu
                let genreDropdown = document.getElementById('genre-dropdown');

                if (genreDropdown && genreDropdown.style.display === 'block') {
                    // If dropdown is visible, hide it
                    genreDropdown.style.display = 'none';
                    document.body.classList.remove('dropdown-active');
                    genreDropdownVisible = false;
                } else {
                    // If dropdown doesn't exist, create it
                    if (!genreDropdown) {
                        createGenreDropdown();
                        genreDropdown = document.getElementById('genre-dropdown');
                    }

                    // Show the dropdown
                    genreDropdown.style.display = 'block';
                    genreDropdownVisible = true;

                    // Apply consistent positioning for all devices
                    genreDropdown.style.position = 'fixed';
                    genreDropdown.style.top = '50%';
                    genreDropdown.style.left = '50%';
                    genreDropdown.style.transform = 'translate(-50%, -50%)';
                    genreDropdown.style.zIndex = '9999';
                    genreDropdown.style.maxHeight = '80vh';

                    // Force visibility and normal scrolling
                    genreDropdown.style.overflowY = 'auto';
                    genreDropdown.style.overflowX = 'hidden';
                    genreDropdown.style.webkitOverflowScrolling = 'touch';

                    // Apply device-specific styles
                    if (window.innerWidth <= 768) {
                        // Mobile adjustments
                        genreDropdown.style.width = '85%';
                        genreDropdown.style.maxWidth = '350px';
                    } else {
                        // Desktop adjustments
                        genreDropdown.style.width = '90%';
                        genreDropdown.style.maxWidth = '1000px';
                    }

                    // Add dark overlay when dropdown is shown
                    document.body.classList.add('dropdown-active');

                    // Outside click to close dropdown
                    setTimeout(() => {
                        const closeDropdown = function(event) {
                            if (!genreDropdown.contains(event.target) && !link.contains(event.target)) {
                                genreDropdown.style.display = 'none';
                                document.body.classList.remove('dropdown-active');
                                document.removeEventListener('click', closeDropdown);
                                document.removeEventListener('touchend', closeDropdown);
                                genreDropdownVisible = false;
                            }
                        };
                        document.addEventListener('click', closeDropdown);
                        document.addEventListener('touchend', closeDropdown);
                    }, 100);

                    // Force visibility on all elements
                    fixVisibility();
                }
            });

            // Function to create the genres dropdown with improved visibility
            function createGenreDropdown() {
                // Create dropdown container
                const dropdown = document.createElement('div');
                dropdown.id = 'genre-dropdown';
                dropdown.style.display = 'none';
                dropdown.style.backgroundColor = 'rgba(20, 20, 20, 0.92)';
                dropdown.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.65)';
                dropdown.style.border = '1px solid rgba(141, 22, 201, 0.5)';
                dropdown.style.backdropFilter = 'blur(15px)';
                dropdown.style.webkitBackdropFilter = 'blur(15px)';
                dropdown.style.padding = '28px';
                dropdown.style.borderRadius = '16px';

                // CRITICAL FIX: These properties fix the mobile scrolling issues
                dropdown.style.overflowY = 'auto';
                dropdown.style.webkitOverflowScrolling = 'touch';
                dropdown.style.overscrollBehavior = 'contain';
                dropdown.style.position = 'fixed';
                dropdown.style.zIndex = '9999';

                // Flexbox layout for better rendering
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column';
                dropdown.style.alignItems = 'center';

                // Add CSS styles for the dark background overlay
                const overlayStyle = document.createElement('style');
                overlayStyle.textContent = `
                    body.dropdown-active::after {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(3px);
                        z-index: 999;
                    }

                    /* Fix for disappearing text when scrolling */
                    #genre-dropdown * {
                        visibility: visible !important;
                        opacity: 1 !important;
                        transform: translateZ(0);
                        backface-visibility: hidden;
                        will-change: transform;
                    }

                    #genre-dropdown .dropdown-column {
                        display: block !important;
                    }

                    #genre-dropdown ul {
                        display: block !important;
                    }

                    #genre-dropdown li {
                        display: list-item !important;
                    }

                    #genre-dropdown a {
                        display: block !important;
                    }
                `;
                document.head.appendChild(overlayStyle);

                // Title with gradient effect - responsive sizing
                const title = document.createElement('h3');
                title.textContent = 'Browse by Genre';
                title.style.color = 'rgb(164, 57, 207)';

                // Adjust title size based on screen size
                if (window.innerWidth <= 480) {
                    title.style.fontSize = '18px';
                    title.style.marginBottom = '15px';
                    title.style.paddingBottom = '8px';
                } else {
                    title.style.fontSize = '22px';
                    title.style.marginBottom = '25px';
                    title.style.paddingBottom = '10px';
                }

                title.style.borderBottom = 'none';
                title.style.fontWeight = '600';
                title.style.letterSpacing = '1px';
                title.style.textAlign = 'center';
                title.style.background = 'linear-gradient(90deg, rgba(164, 57, 207, 1) 0%, rgba(141, 22, 201, 1) 100%)';
                title.style.webkitBackgroundClip = 'text';
                title.style.webkitTextFillColor = 'transparent';
                title.style.backgroundClip = 'text';
                title.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                title.style.width = '100%';
                title.style.maxWidth = window.innerWidth <= 480 ? '200px' : '400px';
                title.style.position = 'relative';
                title.style.margin = '0 auto';
                title.style.textAlign = 'center';
                dropdown.appendChild(title);

                // Create genre container with improved layout
                const container = document.createElement('div');
                container.className = 'genre-dropdown-container';

                // Use flexbox instead of grid for better mobile rendering
                container.style.display = 'flex';
                container.style.flexWrap = 'nowrap';
                container.style.width = '100%';

                // Adjust layout based on screen size
                if (window.innerWidth <= 768) {
                    container.style.flexDirection = 'column';
                    container.style.alignItems = 'center';
                    container.style.gap = '15px';
                    container.style.width = '95%';
                } else {
                    container.style.flexDirection = 'row';
                    container.style.justifyContent = 'center';
                    container.style.gap = '30px';
                    container.style.width = '100%';
                }

                // Updated genre categories based on the user's specifications
                const genreCategories = {
                    'Movies': [
                        { title: 'Action', url: '/genre/index.html?genre=action&type=movie' },
                        { title: 'Comedy', url: '/genre/index.html?genre=comedy&type=movie' },
                        { title: 'Horror', url: '/genre/index.html?genre=horror&type=movie' },
                        { title: 'Thriller', url: '/genre/index.html?genre=thriller&type=movie' },
                        { title: 'Drama', url: '/genre/index.html?genre=drama&type=movie' },
                        { title: 'Romance', url: '/genre/index.html?genre=romance&type=movie' },
                        { title: 'Sci-Fi', url: '/genre/index.html?genre=science-fiction&type=movie' },
                        { title: 'Fantasy', url: '/genre/index.html?genre=fantasy&type=movie' },
                        { title: 'Mystery', url: '/genre/index.html?genre=mystery&type=movie' },
                        { title: 'Western', url: '/genre/index.html?genre=western&type=movie' },
                        { title: 'War', url: '/genre/index.html?genre=war&type=movie' },
                        { title: 'TV Movie', url: '/genre/index.html?genre=tv-movie&type=movie' }
                    ],
                    'TV Shows': [
                        { title: 'Drama', url: '/genre/index.html?genre=drama&type=tv' },
                        { title: 'Comedy', url: '/genre/index.html?genre=comedy&type=tv' },
                        { title: 'Crime', url: '/genre/index.html?genre=crime&type=tv' },
                        { title: 'Action & Adventure', url: '/genre/index.html?genre=action-adventure&type=tv' },
                        { title: 'Mystery', url: '/genre/index.html?genre=mystery&type=tv' },
                        { title: 'Animation', url: '/genre/index.html?genre=animation&type=tv' },
                        { title: 'Reality TV', url: '/genre/index.html?genre=reality&type=tv' },
                        { title: 'Sci-Fi', url: '/genre/index.html?genre=science-fiction&type=tv' },
                        { title: 'Documentary', url: '/genre/index.html?genre=documentary&type=tv' },
                        { title: 'Western', url: '/genre/index.html?genre=western&type=tv' }
                    ],
                    'Anime': [
                        { title: 'Action', url: '/genre/index.html?genre=action&type=anime' },
                        { title: 'Adventure', url: '/genre/index.html?genre=adventure&type=anime' },
                        { title: 'Comedy', url: '/genre/index.html?genre=comedy&type=anime' },
                        { title: 'Drama', url: '/genre/index.html?genre=drama&type=anime' },
                        { title: 'Romance', url: '/genre/index.html?genre=romance&type=anime' },
                        { title: 'Fantasy', url: '/genre/index.html?genre=fantasy&type=anime' },
                        { title: 'Sci-Fi', url: '/genre/index.html?genre=sci-fi&type=anime' },
                        { title: 'Horror', url: '/genre/index.html?genre=horror&type=anime' },
                        { title: 'Mystery', url: '/genre/index.html?genre=mystery&type=anime' }
                    ]
                };

                // Create a column for each category with fixed styling
                Object.keys(genreCategories).forEach((category) => {
                    // Create column div with fixed styling
                    const categoryColumn = document.createElement('div');
                    categoryColumn.className = 'dropdown-column';

                    // Critical fixes to prevent disappearing content
                    categoryColumn.style.position = 'relative';
                    categoryColumn.style.display = 'block';
                    categoryColumn.style.visibility = 'visible';
                    categoryColumn.style.opacity = '1';
                    categoryColumn.style.transform = 'translateZ(0)';
                    categoryColumn.style.backfaceVisibility = 'hidden';
                    categoryColumn.style.willChange = 'transform';

                    // Adjust styling based on screen size
                    if (window.innerWidth <= 480) {
                        categoryColumn.style.padding = '12px 10px';
                        categoryColumn.style.width = '85%';
                        categoryColumn.style.maxWidth = '85%';
                        categoryColumn.style.minWidth = 'auto';
                        categoryColumn.style.margin = '0 auto';
                    } else if (window.innerWidth <= 768) {
                        categoryColumn.style.padding = '12px';
                        categoryColumn.style.width = '90%';
                        categoryColumn.style.maxWidth = '90%';
                        categoryColumn.style.minWidth = 'auto';
                        categoryColumn.style.margin = '0 auto';
                    } else {
                        categoryColumn.style.padding = '15px';
                        categoryColumn.style.width = '30%';
                        categoryColumn.style.maxWidth = '280px';
                        categoryColumn.style.minWidth = '220px';
                        categoryColumn.style.display = 'block';
                        categoryColumn.style.margin = '0';
                    }

                    categoryColumn.style.background = 'rgba(30, 30, 30, 0.6)';
                    categoryColumn.style.borderRadius = '12px';
                    categoryColumn.style.backdropFilter = 'blur(5px)';
                    categoryColumn.style.border = '1px solid rgba(141, 22, 201, 0.2)';
                    categoryColumn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    categoryColumn.style.transition = 'all 0.3s ease';

                    // Category header with responsive sizing
                    const categoryHeader = document.createElement('h4');
                    categoryHeader.textContent = category.toUpperCase();
                    categoryHeader.style.color = '#FFFFFF';
                    categoryHeader.style.marginTop = '0';
                    categoryHeader.style.visibility = 'visible';
                    categoryHeader.style.display = 'block';

                    // Adjust font size based on screen size
                    if (window.innerWidth <= 480) {
                        categoryHeader.style.fontSize = '15px';
                        categoryHeader.style.marginBottom = '10px';
                        categoryHeader.style.paddingBottom = '5px';
                    } else {
                        categoryHeader.style.fontSize = '17px';
                        categoryHeader.style.marginBottom = '15px';
                        categoryHeader.style.paddingBottom = '8px';
                    }

                    categoryHeader.style.borderBottom = '1px solid rgba(141, 22, 201, 0.4)';
                    categoryHeader.style.fontWeight = '600';
                    categoryHeader.style.letterSpacing = '1px';
                    categoryHeader.style.textAlign = 'center';
                    categoryHeader.style.background = 'linear-gradient(90deg, #a710e0 0%, #8a14ca 100%)';
                    categoryHeader.style.webkitBackgroundClip = 'text';
                    categoryHeader.style.webkitTextFillColor = 'transparent';
                    categoryHeader.style.backgroundClip = 'text';
                    categoryHeader.style.textShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    categoryHeader.style.padding = '3px 0 8px';

                    categoryColumn.appendChild(categoryHeader);

                    // Create a list container with fixed visibility
                    const genreList = document.createElement('ul');
                    genreList.style.listStyle = 'none';
                    genreList.style.padding = '0';
                    genreList.style.margin = '0';
                    genreList.style.width = '100%';
                    genreList.style.display = 'block';
                    genreList.style.visibility = 'visible';
                    genreList.style.opacity = '1';
                    genreList.style.webkitTransform = 'translateZ(0)';

                    // Add genre links for this category
                    genreCategories[category].forEach(genre => {
                        const genreItem = document.createElement('li');
                        genreItem.style.margin = '8px 0';
                        genreItem.style.visibility = 'visible';
                        genreItem.style.opacity = '1';
                        genreItem.style.display = 'list-item';
                        genreItem.style.transform = 'translateZ(0)';
                        genreItem.setAttribute('data-genre-title', genre.title);

                        const genreLink = document.createElement('a');
                        genreLink.href = genre.url;
                        genreLink.textContent = genre.title;
                        genreLink.style.color = '#fff';
                        genreLink.style.visibility = 'visible';
                        genreLink.style.opacity = '1';
                        genreLink.style.display = 'block';
                        genreLink.style.webkitTransform = 'translateZ(0)';

                        // Responsive genre link size and spacing
                        if (window.innerWidth <= 480) {
                            genreLink.style.fontSize = '13px';
                            genreLink.style.padding = '6px 25px';
                        } else {
                            genreLink.style.fontSize = '14px';
                            genreLink.style.padding = '7px 25px';
                        }

                        genreLink.style.display = 'block';
                        genreLink.style.textDecoration = 'none';
                        genreLink.style.transition = 'all 0.2s cubic-bezier(.4,0,.2,1)';
                        genreLink.style.borderRadius = '8px';
                        genreLink.style.fontWeight = '400';
                        genreLink.style.position = 'relative';
                        genreLink.style.overflow = 'hidden';
                        genreLink.style.zIndex = '1';
                        genreLink.style.textAlign = 'left';
                        genreLink.style.background = 'rgba(30, 30, 30, 0.4)';
                        genreLink.style.borderLeft = '3px solid rgba(141, 22, 201, 0.4)';

                        // Add enhanced hover effect with gradient
                        genreLink.onmouseover = function() {
                            this.style.color = '#fff';
                            this.style.background = 'linear-gradient(45deg, rgba(141, 22, 201, 0.7) 0%, rgba(164, 57, 207, 0.7) 100%)';
                            this.style.boxShadow = '0 2px 8px rgba(141, 22, 201, 0.4)';
                            this.style.transform = 'translateX(5px)';
                            this.style.borderLeft = '3px solid rgba(164, 57, 207, 0.8)';
                        };

                        genreLink.onmouseout = function() {
                            this.style.color = '#fff';
                            this.style.background = 'rgba(30, 30, 30, 0.4)';
                            this.style.boxShadow = 'none';
                            this.style.transform = 'translateX(0)';
                            this.style.borderLeft = '3px solid rgba(141, 22, 201, 0.4)';
                        };

                        genreItem.appendChild(genreLink);
                        genreList.appendChild(genreItem);
                    });

                    categoryColumn.appendChild(genreList);
                    container.appendChild(categoryColumn);
                });

                dropdown.appendChild(container);

                // Add close button with improved styling
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '&times;';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '15px';
                closeBtn.style.right = '15px';
                closeBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
                closeBtn.style.border = '1px solid rgba(141, 22, 201, 0.3)';
                closeBtn.style.color = 'rgba(255,255,255,0.9)';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.width = '32px';
                closeBtn.style.height = '32px';
                closeBtn.style.display = 'flex';
                closeBtn.style.alignItems = 'center';
                closeBtn.style.justifyContent = 'center';
                closeBtn.style.borderRadius = '50%';
                closeBtn.style.transition = 'all 0.2s ease';
                closeBtn.style.zIndex = '1001';
                closeBtn.title = 'Close';
                closeBtn.style.outline = 'none';
                closeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

                closeBtn.onmouseover = function() {
                    this.style.color = '#fff';
                    this.style.backgroundColor = 'rgba(141, 22, 201, 0.8)';
                    this.style.transform = 'scale(1.1) rotate(90deg)';
                    this.style.boxShadow = '0 4px 12px rgba(141, 22, 201, 0.5)';
                };

                closeBtn.onmouseout = function() {
                    this.style.color = 'rgba(255,255,255,0.9)';
                    this.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
                    this.style.transform = 'scale(1) rotate(0)';
                    this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                };

                closeBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.style.display = 'none';
                    document.body.classList.remove('dropdown-active');
                    genreDropdownVisible = false;
                };

                dropdown.appendChild(closeBtn);
                document.body.appendChild(dropdown);

                // Add enhanced animation
                dropdown.style.animation = 'dropdownFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

                // Event handlers to fix visibility issues when scrolling
                dropdown.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                }, { passive: true });

                dropdown.addEventListener('touchmove', function(e) {
                    e.stopPropagation();
                    fixVisibility();
                }, { passive: true });

                dropdown.addEventListener('scroll', fixVisibility, { passive: true });

                const styleElement = document.createElement('style');
                styleElement.textContent = `
                    @keyframes dropdownFadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-15px) scale(0.98);
                            filter: blur(5px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                            filter: blur(0);
                        }
                    }

                    .dropdown-column:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 20px rgba(0,0,0,0.25);
                        border: 1px solid rgba(141, 22, 201, 0.3);
                    }

                    /* Add a dark overlay to the background when dropdown is active */
                    body.dropdown-active::after {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(3px);
                        z-index: 9998;
                    }

                    /* FIX FOR MOBILE SCROLLING ISSUES */
                    #genre-dropdown {
                        -webkit-overflow-scrolling: touch !important;
                        overflow-y: auto !important;
                        overscroll-behavior: contain !important;
                    }

                    #genre-dropdown * {
                        visibility: visible !important;
                        opacity: 1 !important;
                    }

                    #genre-dropdown .dropdown-column {
                        display: block !important;
                    }

                    #genre-dropdown ul {
                        display: block !important;
                    }

                    #genre-dropdown li {
                        display: list-item !important;
                    }

                    #genre-dropdown a {
                        display: block !important;
                    }
                `;
                document.head.appendChild(styleElement);
            }

            // Handle existing dropdown menu for backward compatibility
            const dropdown = link.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-content')) {
                // We'll keep this element in the DOM but hidden, as it might contain important data
                dropdown.style.display = 'none';
                dropdown.style.opacity = '0';
                dropdown.style.pointerEvents = 'none';
            }
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
        const genreDropdown = document.getElementById('genre-dropdown');
        if (genreDropdown && genreDropdown.style.display === 'block' && e.target.closest('#genre-dropdown')) {
            // If we're in the dropdown and scrolling, prevent body scrolling
            e.stopPropagation();

            // Force visibility of all elements
            fixVisibility();
        } else if (e.target.closest('.movie-container')) {
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
