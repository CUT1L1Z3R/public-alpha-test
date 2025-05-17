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
        // No-op: with new dropdown, this is not needed, but kept for compatibility
    }

    // Add global event listeners to fix visibility
    ['scroll', 'touchmove', 'touchstart', 'touchend'].forEach(eventType => {
        document.addEventListener(eventType, fixVisibility, { passive: true });
    });

    // Handle mobile navigation menu
    const navItems = document.querySelectorAll('.nav-item');

    // Set the active navigation item based on the current page
    const currentPath = window.location.pathname;

    // Replace the existing dropdown implementation with a more mobile-friendly approach
    // that doesn't suffer from the scrolling visibility issues
    function createGenreDropdown() {
        // Remove any existing dropdown
        const existingDropdown = document.getElementById('genre-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create the main container with responsive design
        const dropdown = document.createElement('div');
        dropdown.id = 'genre-dropdown';

        // Different styling for desktop vs mobile
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile styling - full screen overlay using classes
            dropdown.classList.add('mobile-view');
        } else {
            // Desktop styling - more like the original design
            dropdown.style.position = 'fixed';
            dropdown.style.top = '50%';
            dropdown.style.left = '50%';
            dropdown.style.transform = 'translate(-50%, -50%)';
            dropdown.style.width = '90%';
            dropdown.style.maxWidth = '1000px';
            dropdown.style.backgroundColor = 'rgba(20, 20, 20, 0.92)';
            dropdown.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.65)';
            dropdown.style.border = '1px solid rgba(141, 22, 201, 0.5)';
            dropdown.style.backdropFilter = 'blur(15px)';
            dropdown.style.webkitBackdropFilter = 'blur(15px)';
            dropdown.style.padding = '28px';
            dropdown.style.borderRadius = '16px';
            dropdown.style.zIndex = '9999';
            dropdown.style.display = 'block';

            // Ensure proper scrolling without disappearing content
            dropdown.style.overflowY = 'auto';
            dropdown.style.maxHeight = '85vh';
            dropdown.style.webkitOverflowScrolling = 'touch';
        }

        // Create title with responsive styling
        const title = document.createElement('h3');
        title.textContent = 'Browse by Genre';

        if (isMobile) {
            title.className = 'genre-title';
        } else {
            title.style.color = 'rgb(164, 57, 207)';
            title.style.fontSize = '22px';
            title.style.textAlign = 'center';
            title.style.marginBottom = '20px';
            title.style.background = 'linear-gradient(90deg, rgba(164, 57, 207, 1) 0%, rgba(141, 22, 201, 1) 100%)';
            title.style.webkitBackgroundClip = 'text';
            title.style.webkitTextFillColor = 'transparent';
            title.style.backgroundClip = 'text';
            title.style.fontWeight = '600';
        }

        // Close button (using the close-btn class for mobile)
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';

        if (isMobile) {
            closeBtn.className = 'close-btn';
        } else {
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
            closeBtn.style.zIndex = '1001';
        }

        closeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.style.display = 'none';
            document.body.classList.remove('dropdown-active');
            genreDropdownVisible = false;
        };

        if (!isMobile) {
            // Hover effect for close button (desktop only)
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
        }

        // Content container
        const content = document.createElement('div');
        content.className = isMobile ? 'content' : '';

        if (!isMobile) {
            // Desktop: 3-column grid layout
            content.style.width = '100%';
            content.style.display = 'grid';
            content.style.gridTemplateColumns = 'repeat(3, 1fr)';
            content.style.gap = '30px';
            content.style.justifyItems = 'center';
        }

        // Genre categories
        const genreCategories = {
            'MOVIES': [
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
            'TV SHOWS': [
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
            'ANIME': [
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

        // Create sections for each category
        Object.keys(genreCategories).forEach(category => {
            // Section
            const section = document.createElement('div');
            section.className = isMobile ? 'genre-section' : '';

            if (!isMobile) {
                section.style.marginBottom = '20px';
                section.style.background = 'rgba(30, 30, 30, 0.6)';
                section.style.borderRadius = '12px';
                section.style.border = '1px solid rgba(141, 22, 201, 0.2)';
                section.style.padding = '10px';
                section.style.width = '100%';
                section.style.maxWidth = '300px';
                section.style.minWidth = '250px';
            }

            // Category header
            const header = document.createElement('h4');
            header.textContent = category;

            if (!isMobile) {
                header.style.color = 'rgb(164, 57, 207)';
                header.style.fontSize = '18px';
                header.style.textAlign = 'center';
                header.style.marginBottom = '10px';
                header.style.background = 'linear-gradient(90deg, #a710e0 0%, #8a14ca 100%)';
                header.style.webkitBackgroundClip = 'text';
                header.style.webkitTextFillColor = 'transparent';
                header.style.backgroundClip = 'text';
                header.style.fontWeight = '600';
                header.style.borderBottom = '1px solid rgba(141, 22, 201, 0.4)';
                header.style.paddingBottom = '5px';
            }

            section.appendChild(header);

            // Genre list
            const list = document.createElement('ul');

            if (!isMobile) {
                list.style.listStyle = 'none';
                list.style.padding = '0';
                list.style.margin = '0';
            }

            genreCategories[category].forEach(genre => {
                const item = document.createElement('li');

                if (!isMobile) {
                    item.style.margin = '8px 0';
                }

                const link = document.createElement('a');
                link.href = genre.url;
                link.textContent = genre.title;

                if (!isMobile) {
                    link.style.color = '#fff';
                    link.style.display = 'block';
                    link.style.textDecoration = 'none';
                    link.style.padding = '8px 10px';
                    link.style.borderRadius = '8px';
                    link.style.borderLeft = '3px solid rgba(141, 22, 201, 0.4)';
                    link.style.background = 'rgba(30, 30, 30, 0.4)';

                    // Hover effect
                    link.onmouseover = function() {
                        this.style.background = 'linear-gradient(45deg, rgba(141, 22, 201, 0.7) 0%, rgba(164, 57, 207, 0.7) 100%)';
                        this.style.transform = 'translateX(5px)';
                        this.style.transition = 'all 0.2s ease';
                    };

                    link.onmouseout = function() {
                        this.style.background = 'rgba(30, 30, 30, 0.4)';
                        this.style.transform = 'translateX(0)';
                    };
                }

                item.appendChild(link);
                list.appendChild(item);
            });

            section.appendChild(list);
            content.appendChild(section);
        });

        dropdown.appendChild(closeBtn);
        dropdown.appendChild(title);
        dropdown.appendChild(content);
        document.body.appendChild(dropdown);

        // Add CSS for overlay and mobile view
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            body.dropdown-active::after {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(3px);
                z-index: 9998;
            }

            @keyframes dropdownFadeIn {
                from {
                    opacity: 0;
                    transform: ${window.innerWidth > 768 ? 'translate(-50%, -55%)' : 'translateY(-15px)'};
                }
                to {
                    opacity: 1;
                    transform: ${window.innerWidth > 768 ? 'translate(-50%, -50%)' : 'translateY(0)'};
                }
            }

            #genre-dropdown {
                animation: dropdownFadeIn 0.3s ease forwards;
            }

            /* Mobile view styles for genre dropdown */
            #genre-dropdown.mobile-view {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                overflow-y: auto;
                display: block;
                padding: 0;
                box-sizing: border-box;
            }
            #genre-dropdown.mobile-view .close-btn {
                position: absolute;
                top: 18px;
                right: 18px;
                background: rgba(30,30,30,0.7);
                border: 1px solid rgba(141,22,201,0.3);
                color: #fff;
                font-size: 32px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1001;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: background 0.2s, color 0.2s, transform 0.2s;
            }
            #genre-dropdown.mobile-view .close-btn:active {
                background: rgba(141,22,201,0.8);
                color: #fff;
                transform: scale(1.1) rotate(90deg);
            }
            #genre-dropdown.mobile-view .genre-title {
                color: rgb(164, 57, 207);
                font-size: 20px;
                text-align: center;
                margin: 32px 0 18px 0;
                background: linear-gradient(90deg, rgba(164, 57, 207, 1) 0%, rgba(141, 22, 201, 1) 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            #genre-dropdown.mobile-view .content {
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
                padding: 0 10px 30px 10px;
                box-sizing: border-box;
            }
            #genre-dropdown.mobile-view .genre-section {
                margin-bottom: 22px;
                background: rgba(30,30,30,0.7);
                border-radius: 12px;
                border: 1px solid rgba(141,22,201,0.18);
                padding: 10px 0 10px 0;
            }
            #genre-dropdown.mobile-view .genre-section h4 {
                color: rgb(164, 57, 207);
                font-size: 17px;
                text-align: center;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #a710e0 0%, #8a14ca 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
                border-bottom: 1px solid rgba(141,22,201,0.22);
                padding-bottom: 5px;
                letter-spacing: 0.2px;
            }
            #genre-dropdown.mobile-view .genre-section ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            #genre-dropdown.mobile-view .genre-section li {
                margin: 7px 0;
            }
            #genre-dropdown.mobile-view .genre-section a {
                color: #fff;
                display: block;
                text-decoration: none;
                padding: 10px 12px;
                border-radius: 8px;
                border-left: 3px solid rgba(141,22,201,0.32);
                background: rgba(30,30,30,0.4);
                font-size: 16px;
                transition: background 0.18s, transform 0.18s;
            }
            #genre-dropdown.mobile-view .genre-section a:active {
                background: linear-gradient(45deg, rgba(141,22,201,0.7) 0%, rgba(164,57,207,0.7) 100%);
                transform: translateX(5px);
            }
        `;
        document.head.appendChild(styleElement);

        return dropdown;
    }

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
                        genreDropdown = createGenreDropdown();
                    } else {
                        genreDropdown.style.display = 'block';
                    }

                    genreDropdownVisible = true;
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
                }
            });

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
