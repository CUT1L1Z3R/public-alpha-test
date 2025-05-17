/**
 * Custom navigation script for FreeFlixx
 * Enhances navigation and mobile experience
 */

document.addEventListener('DOMContentLoaded', function() {
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
                } else {
                    // If dropdown doesn't exist, create it
                    if (!genreDropdown) {
                        createGenreDropdown();
                        genreDropdown = document.getElementById('genre-dropdown');
                    }

                    // Show the dropdown
                    genreDropdown.style.display = 'block';

                    // Position differently based on device
                    if (window.innerWidth <= 768) {
                        // Mobile centered positioning
                        genreDropdown.style.position = 'fixed';
                        genreDropdown.style.top = '50%';
                        genreDropdown.style.left = '50%';
                        genreDropdown.style.transform = 'translate(-50%, -50%)';
                        genreDropdown.style.width = window.innerWidth <= 480 ? '80%' : '75%'; // Made width smaller
                        genreDropdown.style.maxWidth = '390px'; // Reduced max width
                        genreDropdown.style.maxHeight = '90vh'; // Increased from 80vh to 90vh
                        genreDropdown.style.overflowY = 'auto';
                        genreDropdown.style.overscrollBehavior = 'contain'; // Prevent scroll chaining
                        genreDropdown.style.WebkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
                        genreDropdown.style.zIndex = '9999';
                        genreDropdown.style.marginRight = '15px'; // Right margin
                        genreDropdown.style.marginLeft = '15px'; // Added equal left margin
                    } else {
                        // Desktop positioning - below genre link and centered
                        const rect = link.getBoundingClientRect();
                        genreDropdown.style.position = 'fixed';
                        genreDropdown.style.top = '50%';
                        genreDropdown.style.left = '50%';
                        genreDropdown.style.transform = 'translate(-50%, -50%)';
                        genreDropdown.style.width = '95%';
                        genreDropdown.style.maxWidth = '1000px'; // Further increased max width for more space
                        genreDropdown.style.zIndex = '9999';
                        genreDropdown.style.display = 'flex';
                        genreDropdown.style.flexDirection = 'column';
                        genreDropdown.style.alignItems = 'center';
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
                            }
                        };
                        document.addEventListener('click', closeDropdown);
                        document.addEventListener('touchend', closeDropdown);
                    }, 100);
                }
            });

            // Function to create the genres dropdown
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
                dropdown.style.padding = '28px';  // Increased padding
                dropdown.style.borderRadius = '16px';
                dropdown.style.display = 'flex';  // Use flexbox for centering
                dropdown.style.flexDirection = 'column';
                dropdown.style.alignItems = 'center';
                dropdown.style.justifyContent = 'flex-start'; // Changed from center to flex-start

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

                title.style.borderBottom = 'none'; // Removed the purple line
                title.style.fontWeight = '600';
                title.style.letterSpacing = '1px';
                title.style.textAlign = 'center';
                title.style.background = 'linear-gradient(90deg, rgba(164, 57, 207, 1) 0%, rgba(141, 22, 201, 1) 100%)';
                title.style.webkitBackgroundClip = 'text';
                title.style.webkitTextFillColor = 'transparent';
                title.style.backgroundClip = 'text';
                title.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
                title.style.width = '100%';
                title.style.maxWidth = window.innerWidth <= 480 ? '250px' : '400px';
                title.style.position = 'relative';
                title.style.margin = '0 auto';
                title.style.textAlign = 'center';
                dropdown.appendChild(title);

                // Create genre container with 3 columns layout
                const container = document.createElement('div');
                container.className = 'genre-dropdown-container';
                container.style.display = 'grid';

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

                // Set grid columns based on screen size
                if (window.innerWidth <= 480) {
                    container.style.gridTemplateColumns = '1fr';
                    container.style.gap = '15px';
                    container.style.width = '100%';
                    container.style.maxWidth = '100%';
                    container.style.padding = '0';
                    container.style.marginBottom = '15px'; // Add margin at the bottom for spacing
                    container.style.overflowY = 'auto'; // Allow container to scroll independently
                    container.style.maxHeight = '70vh'; // Set max height for scrollable area
                } else if (window.innerWidth <= 768) {
                    container.style.gridTemplateColumns = '1fr';
                    container.style.gap = '20px'; // Increased gap for better spacing
                    container.style.width = '100%';
                    container.style.maxWidth = '100%';
                    container.style.padding = '0';
                } else {
                    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
                    container.style.gap = '30px'; // Increased gap for better spacing
                    container.style.justifyItems = 'center'; // Center items in the grid
                    container.style.padding = '0'; // Remove padding
                    container.style.width = '95%'; // Increased width to 95%
                    container.style.margin = '0 auto'; // Center the container
                }

                // Create a column for each category with enhanced styling
                Object.keys(genreCategories).forEach((category) => {
                    // Create column div with responsive styling
                    const categoryColumn = document.createElement('div');
                    categoryColumn.className = 'dropdown-column';
                    categoryColumn.style.position = 'relative';

                    // Adjust padding based on screen size
                    if (window.innerWidth <= 480) {
                        categoryColumn.style.padding = '10px';
                        categoryColumn.style.width = '90%';
                        categoryColumn.style.maxWidth = '90%';
                        categoryColumn.style.minWidth = 'auto';
                        categoryColumn.style.margin = '0 auto';
                        categoryColumn.style.display = 'block'; // Ensure block display
                        categoryColumn.style.height = 'auto'; // Allow height to adjust to content
                    } else if (window.innerWidth <= 768) {
                        categoryColumn.style.padding = '12px';
                        categoryColumn.style.width = '90%';
                        categoryColumn.style.maxWidth = '90%';
                        categoryColumn.style.minWidth = 'auto';
                        categoryColumn.style.margin = '0 auto';
                    } else {
                        categoryColumn.style.padding = '15px';
                        categoryColumn.style.width = '100%';
                        categoryColumn.style.maxWidth = '280px';
                        categoryColumn.style.minWidth = '220px';
                        categoryColumn.style.display = 'flex';
                        categoryColumn.style.flexDirection = 'column';
                        categoryColumn.style.margin = '0 auto';
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

                    // Create a list container
                    const genreList = document.createElement('ul');
                    genreList.style.listStyle = 'none';
                    genreList.style.padding = '0';
                    genreList.style.margin = '0';
                    genreList.style.width = '100%';
                    genreList.style.display = 'block';

                    // Add genre links for this category
                    genreCategories[category].forEach(genre => {
                        const genreItem = document.createElement('li');
                        genreItem.style.margin = '8px 0';

                        const genreLink = document.createElement('a');
                        genreLink.href = genre.url;
                        genreLink.textContent = genre.title;
                        genreLink.style.color = '#fff';

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

                // Add scroll indicator for mobile
                if (window.innerWidth <= 480) {
                    const scrollIndicator = document.createElement('div');
                    scrollIndicator.style.width = '100%';
                    scrollIndicator.style.textAlign = 'center';
                    scrollIndicator.style.marginTop = '5px';
                    scrollIndicator.style.fontSize = '12px';
                    scrollIndicator.style.color = 'rgba(255,255,255,0.6)';
                    scrollIndicator.innerHTML = 'Scroll for more';
                    dropdown.appendChild(scrollIndicator);
                }

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
                };

                dropdown.appendChild(closeBtn);
                document.body.appendChild(dropdown);

                // Add enhanced animation
                dropdown.style.animation = 'dropdownFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
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

                    /* Responsive grid for genre dropdown */
                    @media (max-width: 480px) {
                        .genre-dropdown-container {
                            display: grid !important;
                            grid-template-columns: 1fr !important;
                            gap: 20px !important; /* Increased gap */
                            padding: 0 !important;
                        }
                        .dropdown-column {
                            max-width: 90% !important;
                            min-width: auto !important;
                            padding: 15px !important;
                            margin: 0 auto 15px auto !important; /* Center and add margin */
                        }
                        #genre-dropdown {
                            margin-right: 15px !important; /* Right margin for mobile */
                            margin-left: 15px !important; /* Equal left margin for balance */
                        }
                    }
                    @media (min-width: 481px) and (max-width: 768px) {
                        .genre-dropdown-container {
                            display: grid !important;
                            grid-template-columns: 1fr !important; /* Change to 1fr to match mobile layout */
                            gap: 20px !important; /* Increased gap */
                            padding: 0 !important;
                        }
                        .dropdown-column {
                            max-width: 90% !important;
                            min-width: auto !important;
                            padding: 12px !important;
                            margin: 0 auto 15px auto !important; /* Center and add margin */
                        }
                        #genre-dropdown {
                            margin-right: 15px !important; /* Right margin for mobile */
                            margin-left: 15px !important; /* Equal left margin for balance */
                        }
                    }
                    @media (min-width: 769px) {
                        .genre-dropdown-container {
                            display: grid !important;
                            grid-template-columns: repeat(3, 1fr) !important;
                            gap: 30px !important; /* Increased gap */
                            padding: 0 !important; /* Removed padding */
                            justify-items: center !important;
                            width: 95% !important; /* Increased width to 95% */
                            margin: 0 auto !important; /* Center the container */
                        }
                        .dropdown-column {
                            max-width: 280px !important; /* Adjusted max width */
                            min-width: 220px !important;
                            padding: 15px !important;
                            display: flex !important;
                            flex-direction: column !important;
                            width: 100% !important; /* Make columns take full width */
                        }
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
