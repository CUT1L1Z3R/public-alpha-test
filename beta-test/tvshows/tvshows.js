// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Check for banner element
const bannerElement = document.getElementById('banner');
const bannerTitleElement = document.getElementById('banner-title');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// Function to fetch TV shows from TMDB API
function fetchTVShows(containerClass, type) {
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    console.log(`Fetching ${type} TV shows for ${containerClass}`);

    let endpoint = '';

    // Determine which endpoint to use based on TV show type
    if (type === 'netflix_originals') {
        // For Netflix Originals, use discover with Netflix as network (213 is Netflix's network ID)
        endpoint = `discover/tv?api_key=${api_Key}&with_networks=213&sort_by=popularity.desc`;
    } else if (type === 'disney_plus') {
        // For Disney+, use discover with Disney+ as network (2739 is Disney+'s network ID)
        endpoint = `discover/tv?api_key=${api_Key}&with_networks=2739&sort_by=popularity.desc`;
    } else if (type === 'trending') {
        endpoint = `trending/tv/week?api_key=${api_Key}`;
    } else if (type === 'top_rated') {
        endpoint = `tv/top_rated?api_key=${api_Key}`;
    } else if (type === 'popular') {
        endpoint = `tv/popular?api_key=${api_Key}`;
    } else if (type === 'on_the_air') {
        endpoint = `tv/on_the_air?api_key=${api_Key}`;
    } else {
        // Genre-specific endpoint
        let genreId;
        switch (type) {
            case 'comedy':
                genreId = 35;
                break;
            case 'crime':
                genreId = 80;
                break;
            case 'documentary':
                genreId = 99;
                break;
            case 'drama':
                genreId = 18;
                break;
            case 'family':
                genreId = 10751;
                break;
            case 'action':
                genreId = 10759; // Action & Adventure for TV
                break;
            case 'scifi':
                genreId = 10765; // Sci-Fi & Fantasy for TV
                break;
            case 'reality':
                genreId = 10764; // Reality
                break;
            case 'mystery':
                genreId = 9648;
                break;
            case 'fantasy':
                genreId = 10765; // Sci-Fi & Fantasy for TV, but we'll use it just for fantasy
                break;
            default:
                genreId = null;
        }

        if (genreId) {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=${genreId}&sort_by=popularity.desc`;
        } else {
            console.warn(`Unknown TV show type: ${type}`);
            return;
        }
    }

    // Fetch data from TMDB API
    fetch(`https://api.themoviedb.org/3/${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`TMDB API responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Got ${type} data from TMDB, found ${data.results ? data.results.length : 0} items`);
            const tvResults = data.results || [];

            containers.forEach(container => {
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each TV show item
                if (tvResults.length === 0) {
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No TV shows available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without poster or backdrop images
                const validResults = tvResults.filter(item => item.poster_path || item.backdrop_path);

                validResults.forEach(show => {
                    // Special handling for different containers:
                    // - Netflix originals: Use poster_path for portrait format
                    // - Disney+ and all others: Use backdrop_path for landscape format
                    const usePoster = containerClass === 'netflix-container';
                    let useBackdropStyle = false;

                    let imageUrl;
                    if (usePoster && show.poster_path) {
                        // Use poster images for Netflix originals (portrait format)
                        imageUrl = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
                    } else if (show.backdrop_path) {
                        // Use backdrop images for all other containers (landscape format)
                        imageUrl = `https://image.tmdb.org/t/p/w780${show.backdrop_path}`;
                        useBackdropStyle = true;
                    } else {
                        // Fallback to poster path if backdrop is not available
                        imageUrl = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
                    }

                    // Create TV show item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply landscape dimensions for all containers using backdrop images
                    if (useBackdropStyle) {
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    // Apply portrait dimensions for Netflix originals
                    if (usePoster) {
                        itemElement.style.width = '250px';  // Portrait width
                        itemElement.style.height = '340px'; // Portrait height (movie poster ratio)
                    }

                    itemElement.dataset.mediaType = 'tv';
                    itemElement.dataset.id = show.id;

                    // Create image wrapper
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = show.name || 'TV Show';
                    img.loading = 'lazy';

                    // Error handling for image loading
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    // Create overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = show.name || 'Unknown Title';

                    // Create rating
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    // Add star icon
                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    // Add vote average
                    const voteAverage = show.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    // Build the rating element
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    // Build the overlay
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(overlay);

                    // Add the wrapper to the item
                    itemElement.appendChild(imgWrapper);

                    // Add the item to the container
                    container.appendChild(itemElement);

                    // Add click event to navigate to details page
                    itemElement.addEventListener('click', () => {
                        window.location.href = `../movie_details/movie_details.html?media=tv&id=${show.id}`;
                    });
                });
            });
        })
        .catch(error => {
            console.error(`Error fetching ${type} data:`, error);
        });
}

// Function to determine rating color based on score
function getRatingColor(rating) {
    if (rating >= 8) {
        return '#4CAF50'; // Green for high ratings
    } else if (rating >= 6) {
        return '#FFC107'; // Yellow/amber for decent ratings
    } else if (rating >= 4) {
        return '#FF9800'; // Orange for mediocre ratings
    } else {
        return '#F44336'; // Red for low ratings
    }
}

// Function to update banner slideshow based on section
function updateBannerForSection() {
    if (!bannerElement) return;

    // Clear current banner
    bannerElement.src = '';
    if (bannerTitleElement) bannerTitleElement.textContent = '';

    // Clear existing interval if any
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Reset banner items array
    bannerItems = [];
    currentBannerIndex = 0;

    // For TV Shows section, use trending TV shows
    fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
        .then(response => response.json())
        .then(data => {
            const shows = data.results || [];
            // Filter to shows with backdrop images
            bannerItems = shows.filter(show => show.backdrop_path).slice(0, 9);

            if (bannerItems.length > 0) {
                // Show first banner
                showBannerAtIndex(0);
                // Start auto-rotation
                startBannerSlideshow();
            }
        })
        .catch(error => console.error('Error updating banner:', error));
}

// Function to start auto-rotation of banner items
function startBannerSlideshow() {
    // Clear any existing interval
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Only start if we have multiple items
    if (bannerItems.length > 1) {
        bannerInterval = setInterval(() => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);
        }, 8000); // Change banner every 8 seconds
    }
}

// Function to show banner at specific index with enhanced styling
function showBannerAtIndex(index) {
    const item = bannerItems[index];
    if (item && item.backdrop_path && bannerElement) {

        // Set banner image with high quality
        bannerElement.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        if (bannerTitleElement) {
            // Create a more detailed title with additional info
            const title = item.name;

            // Add subtitle information if available
            const extraInfo = [];
            if (item.first_air_date) {
                extraInfo.push(new Date(item.first_air_date).getFullYear());
            }

            // Add media type (TV Show)
            extraInfo.push('Latest');
            extraInfo.push('TV Show');

            // Add rating if available
            if (item.vote_average) {
                extraInfo.push(`⭐ ${parseFloat(item.vote_average).toFixed(1)}`);
            }

            if (extraInfo.length > 0) {
                bannerTitleElement.innerHTML = `
                    ${title}
                    <div class="banner-subtitle">${extraInfo.join(' • ')}</div>
                `;

                // Add some CSS to the subtitle for better appearance
                const subtitleElement = bannerTitleElement.querySelector('.banner-subtitle');
                if (subtitleElement) {
                    subtitleElement.style.fontSize = '0.85rem';
                    subtitleElement.style.opacity = '0.8';
                    subtitleElement.style.marginTop = '8px';
                    subtitleElement.style.fontWeight = 'normal';

                    // Style all "Latest" tags
                    const latestTag = 'Latest';
                    if (subtitleElement.textContent.includes(latestTag)) {
                        // Create a span to style just the "Latest" text
                        subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                            latestTag,
                            `<span class="latest-badge">${latestTag}</span>`
                        );

                        // Style the badge
                        const badge = subtitleElement.querySelector('.latest-badge');
                        if (badge) {
                            badge.style.backgroundColor = 'rgba(231, 76, 60, 0.85)'; // Red for trending content
                            badge.style.padding = '2px 6px';
                            badge.style.borderRadius = '4px';
                            badge.style.color = 'white';
                            badge.style.fontWeight = 'bold';
                            badge.style.marginRight = '3px';
                            badge.style.marginLeft = '3px';
                            badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
                        }
                    }
                }
            } else {
                bannerTitleElement.textContent = title;
            }
        }

        // Update the banner image to have better display
        bannerElement.style.objectFit = 'cover';

        // Add click event listeners to the play and more info buttons
        const playButton = document.getElementById('play-button');
        const moreInfoButton = document.getElementById('more-info');

        if (playButton) {
            playButton.onclick = () => {
                window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
            };
        }

        if (moreInfoButton) {
            moreInfoButton.onclick = () => {
                window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
            };
        }
    }
}

// Initialize banner navigation
if (bannerElement) {
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (bannerItems.length > 1) {
                // Move to previous banner
                currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
                showBannerAtIndex(currentBannerIndex);

                // Reset auto-rotation timer
                if (bannerInterval) {
                    clearInterval(bannerInterval);
                }
                startBannerSlideshow();
            }
        });

        nextButton.addEventListener('click', () => {
            if (bannerItems.length > 1) {
                // Move to next banner
                currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
                showBannerAtIndex(currentBannerIndex);

                // Reset auto-rotation timer
                if (bannerInterval) {
                    clearInterval(bannerInterval);
                }
                startBannerSlideshow();
            }
        });
    }
}

// Set up search functionality
if (searchInput) {
    searchInput.addEventListener('input', function() {
        // Add search functionality if needed
    });
}

// Set up watchlist button
if (goToWatchlistBtn) {
    goToWatchlistBtn.addEventListener('click', function() {
        window.location.href = '../watchList/watchlist.html';
    });
}

// Function to load all content
function loadContent() {
    console.log('Loading TV show content...');

    // Update banner
    updateBannerForSection();

    // Fetch TV content for each section
    fetchTVShows('netflix-container', 'netflix_originals');
    fetchTVShows('disney-container', 'disney_plus');
    fetchTVShows('drama-tv-container', 'drama');
    fetchTVShows('crime-tv-container', 'crime');
    fetchTVShows('comedy-tv-container', 'comedy');
    fetchTVShows('actionadventure-container', 'action');
    fetchTVShows('mystery-container', 'mystery');
    fetchTVShows('fantasy-container', 'fantasy');
    fetchTVShows('reality-container', 'reality');
    fetchTVShows('scifi-tv-container', 'scifi');
    fetchTVShows('documentary-tv-container', 'documentary');

    // Adjust navigation button heights for all containers
    setTimeout(() => {
        // Netflix originals (portrait format)
        const netflixPrevBtn = document.querySelector('.netflix-previous');
        const netflixNextBtn = document.querySelector('.netflix-next');
        const netflixContainer = document.querySelector('.netflix-container');

        if (netflixPrevBtn && netflixNextBtn) {
            // Set the correct height for Netflix navigation buttons
            netflixPrevBtn.style.height = '340px';
            netflixNextBtn.style.height = '340px';
            // Add click event listeners to ensure they work properly
            netflixPrevBtn.addEventListener('click', function() {
                const container = document.querySelector('.netflix-container');
                if (container) {
                    container.scrollBy({
                        left: -800,
                        behavior: 'smooth'
                    });
                }
            });
            netflixNextBtn.addEventListener('click', function() {
                const container = document.querySelector('.netflix-container');
                if (container) {
                    container.scrollBy({
                        left: 800,
                        behavior: 'smooth'
                    });
                }
            });
        }

        if (netflixContainer) {
            netflixContainer.style.minHeight = '380px';
        }

        // Set landscape height for other navigation buttons
        const navButtons = document.querySelectorAll('.navigation-button:not(.netflix-previous):not(.netflix-next)');
        navButtons.forEach(button => {
            button.style.height = '170px'; // Match the height of backdrop images
        });

        // Ensure proper min-height for other containers
        const otherContainers = document.querySelectorAll('.movies-box:not(.netflix-container)');
        otherContainers.forEach(container => {
            container.style.minHeight = '190px'; // Allow space for the items plus margin
        });
    }, 1000); // Small delay to ensure content is loaded
}

// Initialize content loading when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    loadContent();

    // Implement back to top button functionality
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        // Initially hide the button
        backToTopBtn.style.display = 'none';

        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });

        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
