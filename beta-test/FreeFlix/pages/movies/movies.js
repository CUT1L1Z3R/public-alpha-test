/**
 * JavaScript file for the Movies page.
 * Handles fetching, displaying, and UI interactions for movie content.
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Initialize watchlist from localStorage or create empty array
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Function to update banner slideshow
function updateBannerForMovies() {
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
}

// Function to display banner at specific index
function showBannerAtIndex(index) {
    if (bannerItems.length === 0 || index >= bannerItems.length) {
        return;
    }

    const item = bannerItems[index];
    if (!item || !item.backdrop_path) {
        return;
    }

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
    }

    // Add media type
    extraInfo.push('Latest');
    extraInfo.push('Movie');

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
        bannerTitle.textContent = title;
    }

    // Update the banner image to have better display
    banner.style.objectFit = 'cover';

    // Set up event handlers for the banner buttons
    setupBannerButtons(item);

    // Update current index
    currentBannerIndex = index;
}

// Function to start banner slideshow
function startBannerSlideshow() {
    // Clear any existing interval
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Set up automatic slideshow rotation every 5 seconds
    bannerInterval = setInterval(() => {
        // Calculate next index with wraparound
        const nextIndex = (currentBannerIndex + 1) % bannerItems.length;
        showBannerAtIndex(nextIndex);
    }, 5000);
}

// Function to set up banner button event handlers
function setupBannerButtons(item) {
    const playButton = document.getElementById('play-button');
    const moreInfoButton = document.getElementById('more-info');

    // Clear existing event listeners using cloneNode
    const newPlayButton = playButton.cloneNode(true);
    const newMoreInfoButton = moreInfoButton.cloneNode(true);

    playButton.parentNode.replaceChild(newPlayButton, playButton);
    moreInfoButton.parentNode.replaceChild(newMoreInfoButton, moreInfoButton);

    // Add event listeners for mobile/touch and desktop
    const eventType = 'ontouchstart' in window ? 'touchend' : 'click';

    newPlayButton.addEventListener(eventType, function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `../../movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
    }, {passive: false});

    newMoreInfoButton.addEventListener(eventType, function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `../../movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
    }, {passive: false});
}

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple (main theme color) for good ratings
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display movies
function fetchMovies(containerClass, endpoint, usePosterPath = false) {
    console.log(`Fetching movies for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        fetch(`https://api.themoviedb.org/3/${endpoint}api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                console.log(`Got movie data for ${containerClass}, found ${movies.length} items`);
                container.innerHTML = ''; // Clear the container

                movies.forEach(movie => {
                    // Skip if no image is available
                    const imageUrl = usePosterPath
                        ? movie.poster_path
                        : movie.backdrop_path;
                    if (!imageUrl) return;

                    let pathToUse = usePosterPath ? movie.poster_path : movie.backdrop_path;
                    // Create item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = 'movie';

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
                        window.location.href = `../../movie_details/movie_details.html?media=movie&id=${mediaId}`;
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

                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching movie data:', error);
                container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error loading content. Please try again later.</div>';
            });
    });
}

// Function to handle horizontal scrolling for movie containers
function setupScroll(containerClass, prevButtonClass, nextButtonClass) {
    const containers = document.querySelectorAll(`.${containerClass}`);
    const prevButtons = document.querySelectorAll(`.${prevButtonClass}`);
    const nextButtons = document.querySelectorAll(`.${nextButtonClass}`);

    containers.forEach((container, index) => {
        const prevButton = prevButtons[index];
        const nextButton = nextButtons[index];

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const scrollDistance = container.clientWidth * 0.8;
                container.scrollBy({
                    left: scrollDistance,
                    behavior: 'smooth',
                });
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                const scrollDistance = container.clientWidth * 0.8;
                container.scrollBy({
                    left: -scrollDistance,
                    behavior: 'smooth',
                });
            });
        }
    });
}

// Function to fetch search results
async function fetchSearchResults(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        const results = data.results || [];

        // Filter for Movies Only and ensure each has an image
        return results
            .filter(item => item.media_type === 'movie' && item.poster_path)
            .map(item => ({
                ...item,
                poster_path: `https://image.tmdb.org/t/p/w92${item.poster_path}`
            }));
    } catch (error) {
        console.error('Error searching:', error);
        return [];
    }
}

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
                                    <p>Movie <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = '../../watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            window.location.href = `../../movie_details/movie_details.html?media=movie&id=${item.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../../movie_details/movie_details.html?media=movie&id=${item.id}`;
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
                window.location.href = '../../watchList/watchlist.html'; // Navigate to the WatchList page
            });
        }
    }
}

// Event listener for search input changes
searchInput.addEventListener('input', handleSearchInput);

// Event listener for Enter key press in search input
searchInput.addEventListener('keyup', async event => {
    if (event.key === 'Enter') {
        handleSearchInput();
    }
});

// Event listener to close search results when clicking outside
document.addEventListener('click', event => {
    if (!searchResults.contains(event.target)) {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
});

// Event listener to navigate to WatchList page
goToWatchlistBtn.addEventListener('click', () => {
    window.location.href = '../../watchList/watchlist.html';
});

// Add banner navigation button handlers
const prevButton = document.getElementById('banner-prev');
const nextButton = document.getElementById('banner-next');

if (prevButton) {
    prevButton.addEventListener('click', () => {
        // Move to previous banner
        let prevIndex = currentBannerIndex - 1;
        if (prevIndex < 0) prevIndex = bannerItems.length - 1;
        showBannerAtIndex(prevIndex);
    });
}

if (nextButton) {
    nextButton.addEventListener('click', () => {
        // Move to next banner
        let nextIndex = (currentBannerIndex + 1) % bannerItems.length;
        showBannerAtIndex(nextIndex);
    });
}

// Initialize the movies page
document.addEventListener('DOMContentLoaded', () => {
    // Update banner for movies section
    updateBannerForMovies();

    // Fetch movie data for each section
    fetchMovies('trending-container', 'trending/movie/week?&');
    fetchMovies('top-container', 'movie/top_rated?&');
    fetchMovies('horror-container', 'discover/movie?with_genres=27&');
    fetchMovies('comedy-container', 'discover/movie?with_genres=35&');
    fetchMovies('thriller-container', 'discover/movie?with_genres=53&');
    fetchMovies('adventure-container', 'discover/movie?with_genres=12&');
    fetchMovies('action-container', 'discover/movie?with_genres=28&');
    fetchMovies('drama-container', 'discover/movie?with_genres=18&');
    fetchMovies('fantasy-container', 'discover/movie?with_genres=14&');
    fetchMovies('romance-container', 'discover/movie?with_genres=10749&');
    fetchMovies('mystery-container', 'discover/movie?with_genres=9648&');

    // Setup scroll functionality for each container
    setupScroll('trending-container', 'trending-previous', 'trending-next');
    setupScroll('top-container', 'top-previous', 'top-next');
    setupScroll('horror-container', 'horror-previous', 'horror-next');
    setupScroll('comedy-container', 'comedy-previous', 'comedy-next');
    setupScroll('thriller-container', 'thriller-previous', 'thriller-next');
    setupScroll('adventure-container', 'adventure-previous', 'adventure-next');
    setupScroll('action-container', 'action-previous', 'action-next');
    setupScroll('drama-container', 'drama-previous', 'drama-next');
    setupScroll('fantasy-container', 'fantasy-previous', 'fantasy-next');
    setupScroll('romance-container', 'romance-previous', 'romance-next');
    setupScroll('mystery-container', 'mystery-previous', 'mystery-next');

    // Add back to top button
    addBackToTopButton();
});

// Function to add Back to Top button
function addBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top-btn');

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
