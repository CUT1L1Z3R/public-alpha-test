/**
 * Main JavaScript file for the movie/anime streaming site.
 * Handles fetching, displaying, and UI interactions for movies, TV shows, and anime.
 */

// Modified cache busting mechanism that doesn't cause auto-reloads
(function() {
  // Generate a unique timestamp for cache busting
  const cacheBuster = new Date().getTime();

  // Add cache-busting parameter to all API requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      // Don't modify URLs that already have cache busting
      if (url.indexOf('?v=') === -1 && url.indexOf('&v=') === -1 &&
          url.includes('api.themoviedb.org')) { // Only add cache busting to API calls
        url += (url.indexOf('?') === -1 ? '?v=' : '&v=') + cacheBuster;
      }
    }
    return originalFetch.apply(this, arguments);
  };

  // No force reload after service worker update
  // Auto reload functionality removed to prevent the site from refreshing itself
})();

// Register Service Worker for better performance and offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js?v=1.0.5')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);

                // Check for updates to the service worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Service worker update found!');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content is available, refresh to update.');
                            // Popup notification removed to avoid interfering with website content
                        }
                    });
                });
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                console.log('Update available, version:', event.data.version);
                // Popup notification removed to avoid interfering with website content
            }
        });
    });
}

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');
const navItems = document.querySelectorAll('.nav-item');
const movieSections = document.querySelectorAll('.movie-section');
const animeSections = document.querySelectorAll('.anime-section');

// Add a new variable to track the current active section
let currentSection = 'all'; // Default to 'all'

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Function to update banner slideshow based on section
function updateBannerForSection(section) {
    const banner = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');

    // Clear current banner
    banner.src = '';
    bannerTitle.textContent = '';

    // Clear existing interval if any
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Reset banner items array
    bannerItems = [];
    currentBannerIndex = 0;

    if (section === 'all') {
        // For "All" section, we'll use trending content across all media types
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const items = data.results || [];
                // Filter to items with backdrop images
                bannerItems = items.filter(item => item.backdrop_path).slice(0, 9).map(item => ({
                    ...item,
                    mediaType: item.media_type || 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'movies') {
        // For Movies section, use trending movies
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                // Filter to movies with backdrop images
                bannerItems = movies.filter(movie => movie.backdrop_path).slice(0, 9).map(movie => ({
                    ...movie,
                    mediaType: 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'tv') {
        // For TV Shows section, use trending TV shows
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const shows = data.results || [];
                // Filter to shows with backdrop images
                bannerItems = shows.filter(show => show.backdrop_path).slice(0, 9).map(show => ({
                    ...show,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'anime') {
        // For Anime section, use upcoming anime for banner slideshow
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

        const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Get anime that will air after today but before 6 months from now
        fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`)
            .then(response => response.json())
            .then(data => {
                const upcomingAnimes = data.results || [];
                console.log('Upcoming anime fetched:', upcomingAnimes.length);
                // Filter to animes with backdrop images, get up to 9 items
                bannerItems = upcomingAnimes.filter(anime => anime.backdrop_path).slice(0, 9).map(anime => ({
                    ...anime,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating anime banner:', error));
    }
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
    if (item && item.backdrop_path) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        // Set banner image with high quality
        banner.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        // Create a more detailed title with additional info
        const title = item.title || item.name;

        // Add subtitle information if available
        const extraInfo = [];
        if (item.release_date) {
            extraInfo.push(new Date(item.release_date).getFullYear());
        } else if (item.first_air_date) {
            extraInfo.push(new Date(item.first_air_date).getFullYear());
        }

        // Add media type (Movie, TV Show, or Latest Update based on section)
        if (item.mediaType === 'movie') {
            extraInfo.push('Latest');
            extraInfo.push('Movie');
        } else if (item.mediaType === 'tv') {
            // Check which section we're in
            if (currentSection === 'anime') {
                extraInfo.push('Latest Update');
            } else {
                extraInfo.push('Latest');
                extraInfo.push('TV Show');
            }
        }

        // Add rating if available
        if (item.vote_average) {
            extraInfo.push(`⭐ ${parseFloat(item.vote_average).toFixed(1)}`);
        }

        if (extraInfo.length > 0) {
            bannerTitle.innerHTML = `
                ${title}
                <div class="banner-subtitle">${extraInfo.join(' • ')}</div>
            `;

            // Add some CSS to the subtitle for better appearance
            const subtitleElement = bannerTitle.querySelector('.banner-subtitle');
            if (subtitleElement) {
                subtitleElement.style.fontSize = '0.85rem';
                subtitleElement.style.opacity = '0.8';
                subtitleElement.style.marginTop = '8px';
                subtitleElement.style.fontWeight = 'normal';

                // Style all "Latest" tags - works for all sections
                const latestTag = 'Latest';
                if (subtitleElement.textContent.includes(latestTag) && currentSection !== 'anime') {
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

                // Handle the "Latest Update" tag for anime section separately
                if (currentSection === 'anime' && subtitleElement.textContent.includes('Latest Update')) {
                    // Create a span to style just the "Latest Update" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Latest Update',
                        '<span class="latest-update-badge">Latest Update</span>'
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-update-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(52, 152, 219, 0.9)'; // Blue for latest updates
                        badge.style.padding = '3px 8px';
                        badge.style.borderRadius = '4px';
                        badge.style.color = 'white';
                        badge.style.fontWeight = 'bold';
                        badge.style.marginRight = '3px';
                        badge.style.marginLeft = '3px';
                        badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    }
                }
            }
        } else {
            bannerTitle.textContent = title;
        }

        // Update the banner image to have better display
        banner.style.objectFit = 'cover';
        banner.style.objectPosition = 'center top';

        // Apply a subtle gradient overlay to make text more readable if not already added
        const bannerContainer = document.getElementById('banner-container');
        if (bannerContainer) {
            // Make sure the container has relative positioning for the overlay to work
            bannerContainer.style.position = 'relative';

            // Look for an existing overlay or create one
            let overlay = document.getElementById('banner-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'banner-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 80%)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '1';

                // Insert overlay as the first child, behind other content
                bannerContainer.insertBefore(overlay, bannerContainer.firstChild);

                // Make sure detail elements appear above the overlay
                const detailsContainer = document.getElementById('details-container');
                if (detailsContainer) {
                    detailsContainer.style.zIndex = '2';
                    detailsContainer.style.position = 'relative';
                }
            }
        }

        // Update button click events
        const playButton = document.getElementById('play-button');
        const moreInfoButton = document.getElementById('more-info');

        // Clear any existing event listeners
        playButton.replaceWith(playButton.cloneNode(true));
        moreInfoButton.replaceWith(moreInfoButton.cloneNode(true));

        // Get fresh references to the buttons
        const newPlayButton = document.getElementById('play-button');
        const newMoreInfoButton = document.getElementById('more-info');

        // Add multiple event types for better mobile compatibility
        ['click', 'touchstart'].forEach(eventType => {
            newPlayButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
            }, {passive: false});

            newMoreInfoButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
            }, {passive: false});
        });

        // Update current index
        currentBannerIndex = index;
        updateBannerIndicators();
    }
}

// Banner indicators have been removed as requested

// This function is kept empty to maintain compatibility with existing code
function updateBannerIndicators() {
    // Indicators functionality has been removed
}

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple (main theme color) for good ratings
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display movies or TV shows
function fetchMedia(containerClass, endpoint, mediaType, usePosterPath = false) {
    console.log(`Fetching ${mediaType} for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Fix: Ensure only one '?' in the URL, and always append api_key as a parameter
        let url = `https://api.themoviedb.org/3/${endpoint}`;
        if (url.includes('?')) {
            // Already has '?', so just append with '&'
            url += `&api_key=${api_Key}`;
        } else {
            // No '?', so add it
            url += `?api_key=${api_Key}`;
        }
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                console.log(`Got ${mediaType} data for ${containerClass}, found ${movies.length} items`);
                container.innerHTML = ''; // Clear the container

                movies.forEach(movie => {
                    // Check which path to use:
                    // - Use poster_path for Netflix originals
                    // - For all others, prefer backdrop_path but fall back to poster_path if needed
                    let useBackdropStyle = false;
                    let pathToUse;

                    if (containerClass === 'netflix-container') {
                        // Netflix originals use portrait format (poster_path)
                        pathToUse = movie.poster_path;
                    } else {
                        // All other containers use landscape format (backdrop_path)
                        pathToUse = movie.backdrop_path || movie.poster_path;
                        useBackdropStyle = movie.backdrop_path != null;
                    }

                    // Skip if no image is available
                    if (!pathToUse) return;
                    // Create item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = mediaType || 'movie';

                    // Set appropriate dimensions based on image type
                    if (containerClass === 'netflix-container') {
                        // Portrait dimensions for Netflix originals
                        itemElement.style.width = '250px';  // Portrait width
                        itemElement.style.height = '340px'; // Portrait height
                    } else if (useBackdropStyle) {
                        // Landscape dimensions for everything else using backdrop images
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    // Using a wrapper for the image to maintain aspect ratio
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = `https://image.tmdb.org/t/p/w780${pathToUse}`;
                    img.alt = movie.title || movie.name;
                    img.loading = 'lazy'; // Add lazy loading for better performance

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to movie details
                    itemElement.addEventListener('click', () => {
                        const mediaId = movie.id;
                        const mediaToUse = mediaType || (movie.first_air_date ? 'tv' : 'movie');
                        window.location.href = `movie_details/movie_details.html?media=${mediaToUse}&id=${mediaId}`;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = movie.title || movie.name;

                    // Enhanced star rating visibility
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = movie.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
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
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching media data:', error);
            });
    });
}

// Set up scroll distance
const scrollDistance = 1200;

// Fix for navigation buttons in all containers
function fixNavigationButtons() {
    const scrollDistance = 800; // Amount to scroll on each button click
    const allPrevButtons = document.querySelectorAll('.navigation-button.previous');
    const allNextButtons = document.querySelectorAll('.navigation-button.next');

    // Make sure all navigation buttons work by directly adding event listeners
    allPrevButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Try to find the correct container for both movies and TV/anime sections
            let container = this.nextElementSibling;
            // If not found, try to find the next sibling with class 'movies-box' or 'anime-box' or 'tv-box'
            while (container && !(container.classList.contains('movies-box') || container.classList.contains('anime-box') || container.classList.contains('tv-box'))) {
                container = container.nextElementSibling;
            }
            if (container && (container.classList.contains('movies-box') || container.classList.contains('anime-box') || container.classList.contains('tv-box'))) {
                container.scrollBy({
                    left: -scrollDistance,
                    behavior: 'smooth',
                });
            }
        });
    });

    allNextButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Try to find the correct container for both movies and TV/anime sections
            let container = this.previousElementSibling;
            // If not found, try to find the previous sibling with class 'movies-box' or 'anime-box' or 'tv-box'
            while (container && !(container.classList.contains('movies-box') || container.classList.contains('anime-box') || container.classList.contains('tv-box'))) {
                container = container.previousElementSibling;
            }
            if (container && (container.classList.contains('movies-box') || container.classList.contains('anime-box') || container.classList.contains('tv-box'))) {
                container.scrollBy({
                    left: scrollDistance,
                    behavior: 'smooth',
                });
            }
        });
    });
}

// Call the fix function when DOM is loaded
document.addEventListener('DOMContentLoaded', fixNavigationButtons);

// Get references to the header and other elements
// (header and navMenu are now defined below for scroll behavior)

// Retrieve watchlist from local storage or create an empty array if it doesn't exist
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Function to fetch and display anime from TMDB API
function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with TMDB API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Build the base URL with the API key
        const baseUrl = "https://api.themoviedb.org/3/";
        let url = "";

        if (genreOrKeyword === 'popular') {
            // For popular anime, use discover with animation genre + anime keyword and sort by popularity
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'top_rated') {
            // For top rated anime, use discover with animation genre + anime keyword sorted by rating
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (genreOrKeyword === 'upcoming') {
            // For ongoing anime (renamed from upcoming), use discover with recent and ongoing air dates
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.lte=${dateStr}&with_status=0&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'truly_upcoming') {
            // For truly upcoming anime, use discover with future air dates
            const today = new Date();
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

            const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // Get anime that will air after today but before 6 months from now
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`;
        } else if (genreOrKeyword === 'action') {
            // Action anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,28&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'romance') {
            // Romance anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'comedy') {
            // Comedy anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'fantasy') {
            // Fantasy anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,14&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'sci_fi') {
            // Sci-Fi anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,878&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'movie') {
            // Anime movies: animation genre (16) + movie type
            url = `${baseUrl}discover/movie?api_key=${api_Key}&with_genres=16&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'top_rated_anime_movies') {
            // Top rated anime movies
            url = `${baseUrl}discover/movie?api_key=${api_Key}&with_genres=16&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (genreOrKeyword === 'adventure') {
            // Adventure anime (update genre ID to 10759 for TV genre)
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,10759&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'drama') {
            // Drama anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16,18&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'sports') {
            // Sports anime (no direct sports TV genre; fallback to use keyword 210024 for anime, or another approach if available)
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024,sports&sort_by=popularity.desc`;
        } else {
            // Default endpoint for general anime
            url = `${baseUrl}discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        }

        // Fetch anime data from TMDB
        console.log(`Fetching anime from TMDB with endpoint: ${url}`);
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`TMDB API responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Got anime data from TMDB for ${containerClass}, found ${data.results ? data.results.length : 0} items`);
                const animeResults = data.results || [];
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without backdrop or poster images
                const validResults = animeResults.filter(item => item.poster_path || item.backdrop_path);

                console.log(`Processing ${validResults.length} valid anime items for ${containerClass}`);
                validResults.forEach((anime, index) => {
                    const title = anime.name || anime.title || 'Unknown Title';
                    console.log(`Processing anime ${index + 1}/${validResults.length}: ${title}`);

                    // Get image URL - use backdrop (landscape) for all anime containers
                    let useBackdrop = containerClass === 'anime-comedy-container' ||
                                      containerClass === 'anime-upcoming-new-container' ||
                                      containerClass === 'anime-romance-container' ||
                                      containerClass === 'anime-popular-container' ||
                                      containerClass === 'anime-top-container' ||
                                      containerClass === 'anime-upcoming-container' ||
                                      containerClass === 'anime-container' ||
                                      containerClass === 'anime-movie-container' ||
                                      containerClass === 'top-rated-anime-movie-container' ||
                                      containerClass === 'adventure-anime-container' ||
                                      containerClass === 'drama-anime-container' ||
                                      containerClass === 'sports-anime-container';

                    const imageUrl = useBackdrop && anime.backdrop_path
                        ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}` // Use higher quality for landscape
                        : anime.poster_path
                            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                            : anime.backdrop_path
                                ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}`
                                : 'https://via.placeholder.com/780x439?text=No+Image+Available'; // 16:9 aspect ratio

                    // Create the main item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply landscape dimensions for all anime containers
                    if (useBackdrop) {
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    // For anime-movie-container and top-rated-anime-movie-container, set mediaType to 'movie', else 'tv'
                    if (containerClass === 'anime-movie-container' || containerClass === 'top-rated-anime-movie-container') {
                        itemElement.dataset.mediaType = 'movie';
                    } else {
                        itemElement.dataset.mediaType = 'tv'; // Using TV since most anime are TV shows in TMDB
                    }
                    itemElement.dataset.id = anime.id;

                    // Create a wrapper for the image
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = title;
                    img.loading = 'lazy';

                    // Error handling for image loading
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to details page
                    itemElement.addEventListener('click', () => {
                        if (containerClass === 'anime-movie-container' || containerClass === 'top-rated-anime-movie-container') {
                            window.location.href = `movie_details/movie_details.html?media=movie&id=${anime.id}`;
                        } else {
                            window.location.href = `movie_details/movie_details.html?media=tv&id=${anime.id}`;
                        }
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = title;

                    // Enhanced star rating
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = anime.vote_average || 0;

                    // Show actual ratings for all anime including upcoming ones
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    ratingValue.textContent = formattedRating;

                    // Build the overlay
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching anime data from TMDB:', error);
                container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error loading anime content. Please try again later.</div>';
            });
    });
}

// Initial fetch of movies
fetchMedia('netflix-container', 'discover/tv?with_networks=213', 'tv', true); // Netflix originals with poster_path
fetchMedia('trending-container', 'trending/movie/week', 'movie');
fetchMedia('top-container', 'movie/top_rated', 'movie');
fetchMedia('horror-container', 'discover/movie?with_genres=27', 'movie');
fetchMedia('comedy-container', 'discover/movie?with_genres=35', 'movie');
fetchMedia('action-container', 'discover/movie?with_genres=28', 'movie');
fetchMedia('drama-container', 'discover/movie?with_genres=18', 'movie');
fetchMedia('fantasy-container', 'discover/movie?with_genres=14', 'movie');
fetchMedia('romance-container', 'discover/movie?with_genres=10749', 'movie');
fetchMedia('mystery-container', 'discover/movie?with_genres=9648', 'movie');

// Additional movie genres
fetchMedia('thriller-container', 'discover/movie?with_genres=53', 'movie'); // Thriller movies
fetchMedia('adventure-container', 'discover/movie?with_genres=12', 'movie'); // Adventure movies
fetchMedia('fantasy-movie-container', 'discover/movie?with_genres=14', 'movie'); // Fantasy movies
fetchMedia('scifi-movie-container', 'discover/movie?with_genres=878', 'movie'); // Sci-Fi movies

// Initial fetch of TV shows by genre
fetchMedia('drama-tv-container', 'discover/tv?with_genres=18', 'tv'); // Drama (18)
fetchMedia('crime-tv-container', 'discover/tv?with_genres=80', 'tv'); // Crime (80)
fetchMedia('scifi-tv-container', 'discover/tv?with_genres=10765', 'tv'); // Sci-Fi & Fantasy (10765)
fetchMedia('comedy-tv-container', 'discover/tv?with_genres=35', 'tv'); // Comedy TV (35)
fetchMedia('documentary-tv-container', 'discover/tv?with_genres=99', 'tv'); // Documentary (99)

// Fetch contents for Disney+ and new TV Show containers
fetchMedia('disney-container', 'discover/tv?with_networks=2739&sort_by=popularity.desc', 'tv'); // Disney+ network ID: 2739
fetchMedia('actionadventure-container', 'discover/tv?with_genres=10759&sort_by=popularity.desc', 'tv'); // Genre 10759: Action & Adventure
fetchMedia('mystery-container', 'discover/tv?with_genres=9648&sort_by=popularity.desc', 'tv'); // Genre 9648: Mystery
fetchMedia('fantasy-container', 'discover/tv?with_genres=10765&sort_by=popularity.desc', 'tv'); // Genre 10765: Sci-Fi & Fantasy (most include Fantasy shows)
fetchMedia('reality-container', 'discover/tv?with_genres=10764&sort_by=popularity.desc', 'tv'); // Genre 10764: Reality



// Function to fetch search results from TMDB API
async function fetchSearchResults(query) {
    try {
        // Now just use TMDB multi-search API to get results for everything including anime
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${encodeURIComponent(query)}`);
        const tmdbData = await tmdbResponse.json();

        // Also specifically search for anime with a dedicated request that includes the animation genre and anime keyword
        const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${encodeURIComponent(query)}&with_genres=16&with_keywords=210024`);
        const animeData = await animeResponse.json();

        // Combine and format results
        let combinedResults = [];

        // Format TMDB multi-search results
        if (tmdbData.results) {
            tmdbData.results.forEach(item => {
                if (item.poster_path || item.backdrop_path) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.title || item.name,
                        poster_path: posterPath,
                        media_type: item.media_type,
                        release_date: item.release_date || item.first_air_date,
                        isAnime: false,
                        url: null
                    });
                }
            });
        }

        // Format dedicated anime search results
        if (animeData.results) {
            animeData.results.forEach(item => {
                // Check if this item is not already in results (to avoid duplicates)
                if (!combinedResults.some(result => result.id === item.id)) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.name || 'Unknown Title',
                        poster_path: posterPath,
                        media_type: 'tv', // Use 'tv' instead of 'anime' since TMDB treats anime as TV shows
                        release_date: item.first_air_date || '',
                        isAnime: true, // Mark as anime for specific handling
                        url: null
                    });
                }
            });
        }

        // Sort by popularity if available
        combinedResults.sort((a, b) => {
            if (a.popularity && b.popularity) {
                return b.popularity - a.popularity;
            }
            return 0;
        });

        return combinedResults;
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Define a function to handle scrolling
function setupScroll(containerClass, previousButtonClass, nextButtonClass) {
    const previousButtons = document.querySelectorAll(`.${previousButtonClass}`);
    const nextButtons = document.querySelectorAll(`.${nextButtonClass}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container, index) => {
        const previousButton = previousButtons[index];
        const nextButton = nextButtons[index];

        if (previousButton && nextButton) {
            nextButton.addEventListener('click', () => {
                container.scrollBy({
                    left: scrollDistance,
                    behavior: 'smooth',
                });
            });

            previousButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -scrollDistance,
                    behavior: 'smooth',
                });
            });
        }
    });
}

// Setup scroll for movie sections
setupScroll('trending-container', 'trending-previous', 'trending-next');
setupScroll('netflix-container', 'netflix-previous', 'netflix-next');
setupScroll('top-container', 'top-previous', 'top-next');
setupScroll('horror-container', 'horror-previous', 'horror-next');
setupScroll('comedy-container', 'comedy-previous', 'comedy-next');
setupScroll('action-container', 'action-previous', 'action-next');

// Setup scroll for new movie genre sections
setupScroll('thriller-container', 'thriller-previous', 'thriller-next');
setupScroll('adventure-container', 'adventure-previous', 'adventure-next');
setupScroll('fantasy-movie-container', 'fantasy-movie-previous', 'fantasy-movie-next');
setupScroll('scifi-movie-container', 'scifi-movie-previous', 'scifi-movie-next');

// TV genres scroll
setupScroll('drama-tv-container', 'drama-tv-previous', 'drama-tv-next');
setupScroll('crime-tv-container', 'crime-tv-previous', 'crime-tv-next');
setupScroll('scifi-tv-container', 'scifi-tv-previous', 'scifi-tv-next');
setupScroll('comedy-tv-container', 'comedy-tv-previous', 'comedy-tv-next');
setupScroll('documentary-tv-container', 'documentary-tv-previous', 'documentary-tv-next');

// Anime scroll (updated to reflect removed sections)
setupScroll('anime-popular-container', 'anime-popular-previous', 'anime-popular-next');
setupScroll('anime-top-container', 'anime-top-previous', 'anime-top-next');
setupScroll('anime-upcoming-container', 'anime-upcoming-previous', 'anime-upcoming-next');
setupScroll('anime-upcoming-new-container', 'anime-upcoming-new-previous', 'anime-upcoming-new-next');
setupScroll('anime-comedy-container', 'anime-comedy-previous', 'anime-comedy-next');
setupScroll('anime-romance-container', 'anime-romance-previous', 'anime-romance-next');

// Top rated anime movies scroll
setupScroll('top-rated-anime-movie-container', 'top-rated-anime-movie-previous', 'top-rated-anime-movie-next');

// Adventure anime scroll
setupScroll('adventure-anime-container', 'adventure-anime-previous', 'adventure-anime-next');

// Drama anime scroll
setupScroll('drama-anime-container', 'drama-anime-previous', 'drama-anime-next');

// Event listener to navigate to WatchList page
goToWatchlistBtn.addEventListener('click', () => {
    window.location.href = 'watchList/watchlist.html';
});

// Add header scroll behavior
let prevScrollPos = window.scrollY;
const header = document.querySelector('.header');
const navMenu = document.querySelector('.nav-menu');

// Function to handle scroll behavior
function handleScroll() {
    const currentScrollPos = window.scrollY;

    if (window.innerWidth <= 560) { // Only apply this behavior on mobile
        if (prevScrollPos > currentScrollPos) {
            // Scrolling up - show header
            header.style.top = "0";
            navMenu.style.top = "60px";
        } else {
            // Scrolling down - hide header when not at the top
            if (currentScrollPos > 100) {
                header.style.top = "-60px";
                navMenu.style.top = "0";
            }
        }
    } else {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }

    prevScrollPos = currentScrollPos;
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Listen for window resize to adjust behavior
window.addEventListener('resize', function() {
    if (window.innerWidth > 560) {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }
});

// Function to add Back to Top button
function addBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.setAttribute('id', 'back-to-top-btn');
    backToTopBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;

    document.body.appendChild(backToTopBtn);

    // Initially hide the button
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.visibility = 'hidden';

    // Show button when scrolled down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
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

// Add the back to top button
addBackToTopButton();

// Navigation menu functionality
navItems.forEach(item => {
    item.addEventListener('click', (event) => {
        // Get the section to navigate to
        const link = item.querySelector('a');
        const section = link.getAttribute('data-section');
        const href = link.getAttribute('href');

        // Check if we're already on this page - prevent navigation to avoid the error
        const currentPath = window.location.pathname;
        const onIndexPage = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '';

        // If clicking "All" while already on index page, prevent navigation
        if (section === 'all' && onIndexPage) {
            event.preventDefault();
            return false;
        }

        // Update URL based on selected section
        if (section === 'movies') {
            window.location.href = 'movies/index.html';
        } else if (section === 'tv') {
            window.location.href = 'tvshows/index.html';
        } else if (section === 'anime') {
            window.location.href = 'anime/index.html';
        } else if (section === 'all') {
            window.location.href = 'index.html';
        }
    });
});

// Function to handle search input changes
async function handleSearchInput() {
    const query = searchInput.value;
    if (query.length > 2) {
        const results = await fetchSearchResults(query);
        if (results.length !== 0) {
            searchResults.style.visibility = "visible";
        }
        displaySearchResults(results);
    } else {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    results.map(item => {
        const shortenedTitle = item.title || 'Unknown Title';
        const date = item.release_date || '';

        let buttonText = "Add to WatchList"; // Set default button text

        // Check if the movie is already in WatchList
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList"; // Change button text
        }

        const movieItem = document.createElement('div');
        // Create HTML structure for each item
        movieItem.innerHTML = `<div class = "search-item-thumbnail">
                                    <img src ="${item.poster_path}">
                                </div>
                                <div class ="search-item-info">
                                    <h3>${shortenedTitle}</h3>
                                    <p>${item.media_type || 'unknown'} <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            if (item.isAnime) {
                window.location.href = `movie_details/movie_details.html?media=tv&id=${item.id}`;
            } else {
                window.location.href = `movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        });

        info.addEventListener('click', () => {
            if (item.isAnime) {
                window.location.href = `movie_details/movie_details.html?media=tv&id=${item.id}`;
            } else {
                window.location.href = `movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        });

        movieItem.setAttribute('class', 'movie-list');

        // Append movie item to search results
        searchResults.appendChild(movieItem);
    });
}

// Function to add a movie to WatchList
function addToWatchList(movie) {
    // Check if the movie is not already in the WatchList list
    if (!watchlist.find(watchlistItem => watchlistItem.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
        const watchListBtn = document.querySelector(`[id="${movie.id}"]`);
        if (watchListBtn) {
            watchListBtn.textContent = "Go to WatchList";
            watchListBtn.addEventListener('click', () => {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            });
        }
    }
}

// Event listener for search input changes
searchInput.addEventListener('input', handleSearchInput);

// Event listener for search input focus to reshow results if there was a query
searchInput.addEventListener('focus', () => {
    const query = searchInput.value;
    if (query.length > 2) {
        // Re-show search results if they were previously hidden
        fetchSearchResults(query).then(results => {
            if (results.length !== 0) {
                displaySearchResults(results);
                searchResults.style.visibility = "visible";
            }
        });
    }
});

// Event listener for Enter key press in search input
searchInput.addEventListener('keyup', async event => {
    if (event.key === 'Enter') {
        handleSearchInput();
    }
});

// Event listener to close search results when clicking outside
document.addEventListener('click', event => {
    // Check if the click is on search input - don't close if it is
    if (event.target === searchInput) {
        return;
    }

    // Don't close search if clicking on search results or one of their children
    if (searchResults.contains(event.target)) {
        return;
    }

    // Don't close search if clicking on the nav-menu items for desktop
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && navMenu.contains(event.target)) {
        // Only keep search results open on desktop (width > 780px)
        if (window.innerWidth > 780) {
            return;
        }
    }

    // Close the search results if clicking elsewhere
    searchResults.innerHTML = '';
    searchResults.style.visibility = "hidden";
});

// Initialize the banner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add initial fade-in class to all sections
    movieSections.forEach(section => {
        section.classList.add('fade-out');
        // Stagger the animations for a cascade effect on initial load
        setTimeout(() => {
            section.classList.remove('fade-out');
            section.classList.add('fade-in');
        }, Math.random() * 500); // Longer random delay for initial load
    });

    // Update the banner based on the active section
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        const section = activeNavItem.querySelector('a').getAttribute('data-section');
        currentSection = section;
        updateBannerForSection(section);
    } else {
        // Default to 'all' if no nav item is active
        updateBannerForSection('all');
    }

    // Ensure proper spacing between the banner and section headings
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        // Force a significant margin to prevent overlap
        bannerContainer.style.marginBottom = '80px';
    }

    // Adjust section headings to be more visible
    const sectionHeadings = document.querySelectorAll('.movie-section h1, .tv-section h1, .anime-section h1');
    sectionHeadings.forEach(heading => {
        heading.style.position = 'relative';
        heading.style.zIndex = '5';
    });

    // Set up banner navigation button handlers
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            // Move to previous banner
            currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }
});

// Add touch swipe functionality for movie sections
const movieContainers = document.querySelectorAll('.movie-box');

movieContainers.forEach(container => {
    let startX, startTime;
    let isDragging = false;
    let scrollLeft;

    // Touch event handlers
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX;
        startTime = new Date().getTime();
        scrollLeft = container.scrollLeft;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX;
        const dragDistance = startX - x;
        container.scrollLeft = scrollLeft + dragDistance;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        if (!isDragging) return;

        const endX = e.changedTouches[0].pageX;
        const endTime = new Date().getTime();
        const dragDistance = startX - endX;
        const dragDuration = endTime - startTime;

        // If swipe is quick enough and long enough, add momentum
        if (dragDuration < 300 && Math.abs(dragDistance) > 50) {
            // Calculate momentum based on drag speed and distance
            const momentum = (dragDistance * 1.5) * (300 / dragDuration);

            container.scrollBy({
                left: momentum,
                behavior: 'smooth'
            });
        }

        isDragging = false;
    }, { passive: true });
});

/**
 * Add touch swipe functionality for movie sections
 * Enables custom drag-to-scroll and momentum for .movies-box containers on touch devices.
 */

(function injectFadeStyles() {
    if (!document.getElementById('fade-section-styles')) {
        const style = document.createElement('style');
        style.id = 'fade-section-styles';
        style.innerHTML = `
            .fade-in {
                opacity: 1 !important;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
                pointer-events: auto;
            }
            .fade-out {
                opacity: 0 !important;
                transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1);
                pointer-events: none;
            }
            .movie-section, .anime-section {
                opacity: 1;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
            }
        `;
        document.head.appendChild(style);
    }
})();