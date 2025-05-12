/**
 * JavaScript file for the movies page of the FreeFlixx streaming site.
 * Handles fetching, displaying, and UI interactions for movies.
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');

// Set current section to movies
const currentSection = 'movies';

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the movies page
    initMoviesPage();

    // Set up watchlist button
    goToWatchlistBtn.addEventListener('click', () => {
        // Get the watchlist from local storage
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

        // If the watchlist has items, display them
        if (watchlist.length > 0) {
            // Redirect to watchlist page or show a modal
            alert('Watchlist feature is coming soon!');
        } else {
            // Show a message if the watchlist is empty
            alert('Your watchlist is empty. Add items to your watchlist by clicking the "Add to Watchlist" button on movie details pages.');
        }
    });

    // Initialize search
    initSearch();

    // Initialize back to top button
    addBackToTopButton();
});

// Initialize the movies page
function initMoviesPage() {
    // Update banner for movies section
    updateBannerForMovies();

    // Initialize movie sections
    initializeMovieSections();
}

// Update banner with trending movies
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

    // Add click handlers to banner navigation buttons
    const bannerPrev = document.getElementById('banner-prev');
    const bannerNext = document.getElementById('banner-next');

    bannerPrev.addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
        showBannerAtIndex(currentBannerIndex);
    });

    bannerNext.addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
        showBannerAtIndex(currentBannerIndex);
    });

    // Add click handlers to play and info buttons
    const playButton = document.getElementById('play-button');
    const moreInfoButton = document.getElementById('more-info');

    playButton.addEventListener('click', () => {
        if (bannerItems.length > 0) {
            const item = bannerItems[currentBannerIndex];
            window.location.href = `../movie_details/movie_details.html?media=movie&id=${item.id}`;
        }
    });

    moreInfoButton.addEventListener('click', () => {
        if (bannerItems.length > 0) {
            const item = bannerItems[currentBannerIndex];
            window.location.href = `../movie_details/movie_details.html?media=movie&id=${item.id}`;
        }
    });
}

// Initialize sections for movies
function initializeMovieSections() {
    // Initialize trending movies
    fetchMovies('trending-container', 'trending');

    // Initialize top rated movies
    fetchMovies('top-container', 'top_rated');

    // Initialize genre-specific movie categories
    fetchMovies('horror-container', 'horror');
    fetchMovies('comedy-container', 'comedy');
    fetchMovies('thriller-container', 'thriller');
    fetchMovies('adventure-container', 'adventure');
    fetchMovies('action-container', 'action');
    fetchMovies('drama-container', 'drama');
    fetchMovies('fantasy-container', 'fantasy');
    fetchMovies('romance-container', 'romance');
    fetchMovies('mystery-container', 'mystery');

    // Set up navigation buttons for each section
    setupNavigationButtons();
}

// Function to set up navigation buttons for scrolling through movie lists
function setupNavigationButtons() {
    const movieSections = document.querySelectorAll('.movie-section');

    movieSections.forEach(section => {
        const container = section.querySelector('.movies-box');
        const prevButton = section.querySelector('.navigation-button.previous');
        const nextButton = section.querySelector('.navigation-button.next');

        if (container && prevButton && nextButton) {
            // Set up click handlers
            prevButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -300,
                    behavior: 'smooth'
                });
            });

            nextButton.addEventListener('click', () => {
                container.scrollBy({
                    left: 300,
                    behavior: 'smooth'
                });
            });

            // Adjust navigation button heights for proper alignment with landscape images
            prevButton.style.height = '170px'; // Match the height of backdrop images
            nextButton.style.height = '170px';

            // Set minimum height for the container
            container.style.minHeight = '190px'; // Allow space for items plus margin
        }
    });
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
        banner.style.transition = 'opacity 0.5s ease-in-out';
    }
}

// Function to fetch movies from TMDB API
function fetchMovies(containerClass, type) {
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    console.log(`Fetching ${type} movies for ${containerClass}`);

    let endpoint = '';

    // Determine which endpoint to use based on movie type
    if (type === 'trending') {
        endpoint = `trending/movie/week?api_key=${api_Key}`;
    } else if (type === 'top_rated') {
        endpoint = `movie/top_rated?api_key=${api_Key}`;
    } else if (type === 'popular') {
        endpoint = `movie/popular?api_key=${api_Key}`;
    } else if (type === 'upcoming') {
        endpoint = `movie/upcoming?api_key=${api_Key}`;
    } else if (type === 'now_playing') {
        endpoint = `movie/now_playing?api_key=${api_Key}`;
    } else {
        // Genre-specific endpoint
        let genreId;
        switch (type) {
            case 'horror':
                genreId = 27;
                break;
            case 'comedy':
                genreId = 35;
                break;
            case 'thriller':
                genreId = 53;
                break;
            case 'adventure':
                genreId = 12;
                break;
            case 'action':
                genreId = 28;
                break;
            case 'drama':
                genreId = 18;
                break;
            case 'fantasy':
                genreId = 14;
                break;
            case 'romance':
                genreId = 10749;
                break;
            case 'mystery':
                genreId = 9648;
                break;
            default:
                genreId = null;
        }

        if (genreId) {
            endpoint = `discover/movie?api_key=${api_Key}&with_genres=${genreId}&sort_by=popularity.desc`;
        } else {
            console.warn(`Unknown movie type: ${type}`);
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
            const movieResults = data.results || [];

            containers.forEach(container => {
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each movie item
                if (movieResults.length === 0) {
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No movies available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without poster or backdrop images
                const validResults = movieResults.filter(item => item.poster_path || item.backdrop_path);

                validResults.forEach(movie => {
                    // Create movie item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = 'movie';
                    itemElement.dataset.id = movie.id;

                    // Set landscape dimensions for better visual appearance
                    if (movie.backdrop_path) {
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    // Create image wrapper
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    // Prefer backdrop_path for landscape format, fallback to poster_path
                    img.src = movie.backdrop_path
                        ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                        : `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
                    img.alt = movie.title || 'Movie';
                    img.loading = 'lazy';

                    // Error handling for image loading
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to movie details
                    itemElement.addEventListener('click', () => {
                        const mediaId = movie.id;
                        window.location.href = `../movie_details/movie_details.html?media=movie&id=${mediaId}`;
                    });

                    // Create overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = movie.title;

                    // Enhanced star rating visibility
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    // Add star icon
                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    // Add vote average
                    const voteAverage = movie.vote_average || 0;
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
                    imgWrapper.appendChild(overlay);
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
        return '#FF9800'; // Orange for average ratings
    } else {
        return '#F44336'; // Red for poor ratings
    }
}

// Function to handle search
function initSearch() {
    searchInput.addEventListener('input', () => {
        handleSearchInput();
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Function to handle search input
async function handleSearchInput() {
    const query = searchInput.value;
    if (query.length > 2) {
        const results = await fetchSearchResults(query);
        if (results.length !== 0) {
            displaySearchResults(results);
        } else {
            searchResults.innerHTML = '<p>No results found</p>';
            searchResults.style.display = 'block';
        }
    } else {
        searchResults.style.display = 'none';
    }
}

// Function to fetch search results
async function fetchSearchResults(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${query}`);
        const data = await response.json();
        // Filter results to only movies, with valid poster/backdrop images
        return data.results.filter(item =>
            item.media_type === 'movie' && (item.poster_path || item.backdrop_path)
        ).slice(0, 6); // Limit to 6 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';

        const img = document.createElement('img');
        img.src = result.poster_path
            ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
            : result.backdrop_path
                ? `https://image.tmdb.org/t/p/w300${result.backdrop_path}`
                : 'https://via.placeholder.com/92x138?text=No+Image';
        img.alt = result.title || result.name;

        const textContainer = document.createElement('div');
        textContainer.className = 'search-result-text';

        const title = document.createElement('h3');
        title.textContent = result.title || result.name;

        const details = document.createElement('p');

        // Add year if available
        let year = '';
        if (result.release_date) {
            year = new Date(result.release_date).getFullYear();
        } else if (result.first_air_date) {
            year = new Date(result.first_air_date).getFullYear();
        }

        details.textContent = year ? `${year}` : '';

        // Add rating if available
        if (result.vote_average) {
            details.textContent += details.textContent ? ` • ⭐ ${result.vote_average.toFixed(1)}` : `⭐ ${result.vote_average.toFixed(1)}`;
        }

        textContainer.appendChild(title);
        textContainer.appendChild(details);

        resultItem.appendChild(img);
        resultItem.appendChild(textContainer);

        // Add click event
        resultItem.addEventListener('click', () => {
            searchResults.style.display = 'none';
            window.location.href = `../movie_details/movie_details.html?media=movie&id=${result.id}`;
        });

        searchResults.appendChild(resultItem);
    });

    searchResults.style.display = 'block';
}

// Function to add back to top button
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
