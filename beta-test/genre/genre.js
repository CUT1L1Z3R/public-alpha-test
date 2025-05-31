/**
 * JavaScript file for genre-specific pages on FreeFlix
 * Handles fetching and displaying content based on genre
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');
const genreGridContainer = document.getElementById('genre-grid-container');
const genreTitle = document.getElementById('genre-title');
const loadingIndicator = document.getElementById('loading-indicator');
const noResults = document.getElementById('no-results');
const pageIndicator = document.getElementById('page-indicator');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const filterPopular = document.getElementById('filter-popular');
const filterTopRated = document.getElementById('filter-top-rated');
const filterNewest = document.getElementById('filter-newest');

// TMDB API key - use the same key from movies.js
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Genre mapping for IDs
const genreMap = {
    // Movie genres
    'action': 28,
    'adventure': 12,
    'animation': 16,
    'comedy': 35,
    'crime': 80,
    'documentary': 99,
    'drama': 18,
    'family': 10751,
    'fantasy': 14,
    'history': 36,
    'horror': 27,
    'music': 10402,
    'mystery': 9648,
    'romance': 10749,
    'science-fiction': 878,
    'sci-fi': 878,
    'tv-movie': 10770,
    'thriller': 53,
    'war': 10752,
    'western': 37,
    // TV show genres
    'action-adventure': 10759,
    'kids': 10762,
    'news': 10763,
    'reality': 10764,
    'sci-fi': 10765,
    'science-fiction': 10765,
    'animation': 16, // Added animation genre for TV shows
    'western': 37, // Added western genre for TV shows
    'soap': 10766,
    'talk': 10767,
    'politics': 10768,
    'war-politics': 10768
};

// Current state
let currentPage = 1;
let totalPages = 1;
let currentGenre = '';
let currentMediaType = 'movie';
let currentSort = 'popularity.desc';

// Document ready event
document.addEventListener('DOMContentLoaded', () => {
    console.log('Genre page loaded');

    // Verify API connection first
    verifyApiConnection();

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentGenre = urlParams.get('genre') || '';
    currentMediaType = urlParams.get('type') || 'movie'; // Default to movie if not specified

    console.log(`URL params: genre=${currentGenre}, type=${currentMediaType}`);

    // Initialize the genre page
    initGenrePage(currentGenre, currentMediaType);

    // Set up watchlist button
    goToWatchlistBtn.addEventListener('click', () => {
        window.location.href = '../watchList/watchlist.html';
    });

    // Initialize filter buttons
    initFilterButtons();

    // Initialize pagination
    initPagination();

    // Initialize search
    initSearch();

    // Initialize back to top button
    addBackToTopButton();
});

// Verify API connection
function verifyApiConnection() {
    // Test connection with a simple API call
    fetch(`https://api.themoviedb.org/3/configuration?api_key=${api_Key}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`TMDB API connection failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API connection successful:', data);
        })
        .catch(error => {
            console.error('API connection error:', error);
            showError('Error connecting to movie database. Please try again later.');
        });
}

// Initialize the genre page
function initGenrePage(genre, mediaType) {
    if (!genre) {
        showError('No genre specified. Please select a genre.');
        return;
    }

    // Update UI to show which genre we're displaying
    updatePageTitle(genre, mediaType);

    // Fetch content for the specified genre and media type
    fetchGenreContent(genre, mediaType, currentSort, currentPage);
}

// Initialize filter buttons
function initFilterButtons() {
    // Popular filter (default)
    filterPopular.addEventListener('click', () => {
        setActiveFilter(filterPopular);
        currentSort = 'popularity.desc';
        currentPage = 1;
        fetchGenreContent(currentGenre, currentMediaType, currentSort, currentPage);
    });

    // Top rated filter
    filterTopRated.addEventListener('click', () => {
        setActiveFilter(filterTopRated);
        currentSort = 'vote_average.desc';
        currentPage = 1;
        fetchGenreContent(currentGenre, currentMediaType, currentSort, currentPage);
    });

    // Newest filter
    filterNewest.addEventListener('click', () => {
        setActiveFilter(filterNewest);
        currentSort = 'release_date.desc';
        currentPage = 1;
        fetchGenreContent(currentGenre, currentMediaType, currentSort, currentPage);
    });
}

// Set active filter
function setActiveFilter(activeButton) {
    // Remove active class from all filter buttons
    filterPopular.classList.remove('active');
    filterTopRated.classList.remove('active');
    filterNewest.classList.remove('active');

    // Add active class to selected button
    activeButton.classList.add('active');
}

// Initialize pagination
function initPagination() {
    // Previous page button
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchGenreContent(currentGenre, currentMediaType, currentSort, currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Next page button
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchGenreContent(currentGenre, currentMediaType, currentSort, currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// Update page title and header based on genre and media type
function updatePageTitle(genre, mediaType) {
    // Format the genre for display (capitalize first letter of each word)
    const formattedGenre = genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Update the page title
    document.title = `${formattedGenre} ${mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Shows' : 'Anime'} - FreeFlix`;

    // Update the header text
    genreTitle.textContent = `${formattedGenre} ${mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Shows' : 'Anime'}`;
}

// Update pagination UI
function updatePaginationUI(currentPage, totalPages) {
    // Update page indicator
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;

    // Enable/disable previous button
    prevPageBtn.disabled = currentPage <= 1;

    // Enable/disable next button
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Fetch content for specified genre and media type
function fetchGenreContent(genre, mediaType, sortBy, page) {
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    genreGridContainer.innerHTML = '';
    noResults.style.display = 'none';

    console.log(`Fetching content for genre: ${genre}, mediaType: ${mediaType}, sort: ${sortBy}, page: ${page}`);

    // Get genre ID from genreMap based on media type
    let genreId;

    // Check if we need to handle special cases for genres in both TV shows and movies
    if (genre.toLowerCase() === 'sci-fi' || genre.toLowerCase() === 'science-fiction') {
        if (mediaType === 'tv') {
            genreId = 10765; // Sci-Fi & Fantasy genre ID for TV shows
            console.log(`Using TV-specific sci-fi genre ID: ${genreId}`);
        } else if (mediaType === 'movie') {
            genreId = 878; // Science Fiction genre ID for movies
            console.log(`Using movie-specific sci-fi genre ID: ${genreId}`);
        } else {
            genreId = genreMap[genre.toLowerCase()];
        }
    } else if (genre.toLowerCase() === 'western') {
        genreId = 37; // Western genre ID (same for both movies and TV)
        console.log(`Using western genre ID: ${genreId}`);
    } else if (genre.toLowerCase() === 'war') {
        genreId = 10752; // War genre ID for movies
        console.log(`Using war genre ID: ${genreId}`);
    } else if (genre.toLowerCase() === 'tv-movie') {
        genreId = 10770; // TV Movie genre ID
        console.log(`Using TV Movie genre ID: ${genreId}`);
    } else {
        genreId = genreMap[genre.toLowerCase()];
    }

    if (!genreId) {
        console.error(`Genre ID not found for: ${genre}`);
        showError(`Genre "${genre}" not found. Please select a valid genre.`);
        return;
    }

    console.log(`Found genre ID: ${genreId} for genre: ${genre} and media type: ${mediaType}`);

    // Create an array to store demo content in case the API fails
    let demoContent = [];
    for (let i = 1; i <= 20; i++) {
        demoContent.push({
            id: i,
            title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Movie ${i}`,
            name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Show ${i}`,
            backdrop_path: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png', // Placeholder image
            poster_path: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png', // Placeholder image
            vote_average: Math.random() * 10
        });
    }

    // Determine which API endpoint to use based on media type
    let endpoint = '';
    if (mediaType === 'tv') {
        // For TV shows, ensure we're using the correct genre IDs
        // Some genres like sci-fi have different IDs for TV vs movies
        let tvGenreId = genreId;

        // Double check if we need a TV-specific genre ID
        if (genre.toLowerCase() === 'sci-fi' || genre.toLowerCase() === 'science-fiction') {
            tvGenreId = 10765; // Sci-Fi & Fantasy genre ID for TV
        } else if (genre.toLowerCase() === 'animation') {
            tvGenreId = 16; // Animation genre ID is the same for TV and movies
        } else if (genre.toLowerCase() === 'western') {
            tvGenreId = 37; // Western genre ID is the same for TV and movies
        } else if (genre.toLowerCase() === 'war') {
            tvGenreId = 10752; // War genre ID is the same for TV and movies
        } else if (genre.toLowerCase() === 'tv-movie') {
            tvGenreId = 10770; // TV Movie genre ID
        }

        endpoint = `discover/tv?api_key=${api_Key}&with_genres=${tvGenreId}&sort_by=${sortBy}&page=${page}`;
        console.log(`Using TV endpoint with genre ID: ${tvGenreId}`);
    } else if (mediaType === 'anime') {
        // For anime, use animation genre (16) + specified genre + anime keyword (210024)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,${genreId}&with_keywords=210024&sort_by=${sortBy}&page=${page}`;
    } else {
        // Default to movies
        endpoint = `discover/movie?api_key=${api_Key}&with_genres=${genreId}&sort_by=${sortBy}&page=${page}`;
    }

    console.log(`Using API endpoint: https://api.themoviedb.org/3/${endpoint}`);

    // Fetch data from TMDB API
    fetch(`https://api.themoviedb.org/3/${endpoint}`)
        .then(response => {
            console.log(`API response status:`, response.status);
            if (!response.ok) {
                throw new Error(`TMDB API responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';

            console.log(`API response data:`, data);
            const results = data.results || [];
            console.log(`Found ${results.length} results for ${genre} ${mediaType}`);

            if (results.length === 0) {
                if (mediaType === 'anime') {
                    // For anime, try with just the animation genre (16) if no results with combined genres
                    console.log('No anime results with combined genres, trying with just animation genre');
                    const fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=${sortBy}&page=${page}`;
                    fetch(`https://api.themoviedb.org/3/${fallbackEndpoint}`)
                        .then(response => response.json())
                        .then(fallbackData => {
                            const fallbackResults = fallbackData.results || [];
                            if (fallbackResults.length > 0) {
                                console.log(`Found ${fallbackResults.length} fallback anime results`);
                                currentPage = fallbackData.page || 1;
                                totalPages = fallbackData.total_pages || 1;
                                totalPages = Math.min(totalPages, 500);
                                updatePaginationUI(currentPage, totalPages);
                                displayResults(fallbackResults, mediaType);
                            } else {
                                console.log('No fallback anime results found, showing demo content');
                                displayResults(demoContent, mediaType);
                                currentPage = 1;
                                totalPages = 1;
                                updatePaginationUI(currentPage, totalPages);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching fallback anime content:', error);
                            displayResults(demoContent, mediaType);
                            currentPage = 1;
                            totalPages = 1;
                            updatePaginationUI(currentPage, totalPages);
                        });
                    return;
                } else {
                    // For non-anime, show no results
                    noResults.style.display = 'block';
                    currentPage = 1;
                    totalPages = 1;
                    updatePaginationUI(currentPage, totalPages);
                    return;
                }
            }

            // Update pagination information
            currentPage = data.page || 1;
            totalPages = data.total_pages || 1;

            // Cap total pages to 500 (TMDB API limit)
            totalPages = Math.min(totalPages, 500);

            // Update pagination UI
            updatePaginationUI(currentPage, totalPages);

            // Process and display the results
            displayResults(results, mediaType);
        })
        .catch(error => {
            console.error('Error fetching genre content:', error);
            loadingIndicator.style.display = 'none';

            // If API fails, use demo content instead
            console.log('Falling back to demo content');
            displayResults(demoContent, mediaType);

            // Update pagination for demo content
            currentPage = 1;
            totalPages = 1;
            updatePaginationUI(currentPage, totalPages);
        });
}

// Display results in the grid container
function displayResults(results, mediaType) {
    // Clear the container first
    genreGridContainer.innerHTML = '';

    if (results.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    // Filter out items without poster or backdrop images
    let validResults = results.filter(item => item.poster_path || item.backdrop_path);

    // If no valid results, use all results
    if (validResults.length === 0) {
        validResults = results;
    }

    validResults.forEach(item => {
        // Create movie/show item element
        const itemElement = document.createElement('div');
        itemElement.className = 'movie-item';
        itemElement.dataset.mediaType = mediaType;
        itemElement.dataset.id = item.id;

        // Create image wrapper
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'image-wrapper';

        // Create and add the image
        const img = document.createElement('img');
        // Prefer backdrop_path for landscape format, fallback to poster_path
        img.src = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
            : item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : 'https://via.placeholder.com/780x440?text=No+Image+Available';
        img.alt = item.title || item.name || 'Content';
        img.loading = 'lazy';

        // Error handling for image loading
        img.onerror = function() {
            this.onerror = null;
            this.src = 'https://via.placeholder.com/780x440?text=Image+Error';
        };

        imgWrapper.appendChild(img);
        itemElement.appendChild(imgWrapper);
        genreGridContainer.appendChild(itemElement);

        // Add click event to navigate to details page
        itemElement.addEventListener('click', () => {
            const mediaId = item.id;
            window.location.href = `../movie_details/movie_details.html?media=${mediaType === 'anime' ? 'tv' : mediaType}&id=${mediaId}`;
        });

        // Create overlay with position at bottom
        const overlay = document.createElement('div');
        overlay.className = 'movie-overlay';
        overlay.style.bottom = '0'; // Ensure it's at the bottom
        overlay.style.top = 'auto'; // Remove any top positioning
        overlay.style.padding = '30px 15px 10px'; // Increased top padding to push content further down
        overlay.style.justifyContent = 'flex-end'; // Align content to bottom
        overlay.style.minHeight = '100px'; // Increased height to push content down

        // Create title-rating container for side-by-side layout
        const titleRatingContainer = document.createElement('div');
        titleRatingContainer.className = 'title-rating-container';
        titleRatingContainer.style.marginTop = '10px'; // Increased space above container

        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = 'movie-title';
        titleElement.textContent = item.title || item.name || 'Unknown Title';

        // Enhanced star rating visibility
        const rating = document.createElement('div');
        rating.className = 'movie-rating';

        // Add star icon
        const star = document.createElement('span');
        star.className = 'rating-star';
        star.innerHTML = '★';

        // Add vote average
        const voteAverage = item.vote_average || 0;
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

        // Add title and rating to the container
        titleRatingContainer.appendChild(titleElement);
        titleRatingContainer.appendChild(rating);

        // Build the overlay with title-rating container
        overlay.appendChild(titleRatingContainer);

        // Add overlay to the image wrapper
        imgWrapper.appendChild(overlay);

        // Add hover effect for the movie item
        itemElement.addEventListener('mouseenter', () => {
            overlay.style.background = 'linear-gradient(to top, rgba(141, 22, 201, 0.8) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.2) 100%)';
        });

        itemElement.addEventListener('mouseleave', () => {
            overlay.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0) 100%)';
        });
    });

    // Always show the overlay on these genre pages
    const movieItems = document.querySelectorAll('.movie-item');
    movieItems.forEach(item => {
        const overlay = item.querySelector('.movie-overlay');
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.bottom = '0'; // Ensure it's at the bottom
            overlay.style.transform = 'translateY(0)'; // No transform
            overlay.style.padding = '30px 15px 10px'; // Increased top padding to push content further down
            overlay.style.justifyContent = 'flex-end'; // Align content to bottom
            overlay.style.minHeight = '100px'; // Increased height to push content down

            // Also adjust the title-rating container
            const titleRatingContainer = overlay.querySelector('.title-rating-container');
            if (titleRatingContainer) {
                titleRatingContainer.style.marginTop = '10px'; // Increased space above container
            }

            // Add hover effects programmatically as well
            const movieItem = item;
            movieItem.addEventListener('mouseenter', () => {
                overlay.style.background = 'linear-gradient(to top, rgba(141, 22, 201, 0.8) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.2) 100%)';
            });

            movieItem.addEventListener('mouseleave', () => {
                overlay.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0) 100%)';
            });
        }
    });
}

// Show error message
function showError(message) {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';

    // Display error message in container
    genreGridContainer.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">${message}</div>`;
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

// Function to handle search - reusing code from movies.js
function initSearch() {
    if (!searchInput) {
        console.error('Search input element not found!');
        return;
    }

    // Make sure the search results container exists and is properly configured
    if (searchResults) {
        // Initialize the search results container - use CSS classes instead of inline styles
        // Let the CSS handle the positioning and styling
        searchResults.className = "search-results";
        searchResults.innerHTML = '';
    }

    // Add a click event to ensure the search input is visible and focused
    searchInput.addEventListener('click', () => {
        searchInput.focus();
    });

    // Input event for real-time search
    searchInput.addEventListener('input', () => {
        handleSearchInput();
    });

    // Add event listener for Enter key press in search input
    searchInput.addEventListener('keyup', async event => {
        if (event.key === 'Enter') {
            handleSearchInput();
        }
    });

    // Event listener for search input focus to reshow results if there was a query
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value;
        if (query.length > 2) {
            // Re-show search results if they were previously hidden
            fetchSearchResults(query).then(results => {
                displaySearchResults(results);
            });
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', event => {
        // Check if the click is on search input - don't close if it is
        if (event.target === searchInput) {
            return;
        }

        // Don't close search if clicking on search results or one of their children
        if (searchResults && searchResults.contains(event.target)) {
            return;
        }

        // Close the search results if clicking elsewhere
        if (searchResults) {
            searchResults.style.display = "none";
        }
    });

    // Handle window resize events to ensure search results position correctly
    window.addEventListener('resize', () => {
        if (searchResults.style.display === "block" && searchInput.value.length > 2) {
            // Reposition search results based on current viewport
            positionSearchResults();
        }
    });
}

// Function to position search results based on device size
function positionSearchResults() {
    // Use this function to position search results appropriately for the current device
    if (window.innerWidth <= 480) {
        // Mobile view - center under search bar
        searchResults.style.display = "block";
        searchResults.style.visibility = "visible";
    } else {
        // Desktop view - default positioning from CSS
        searchResults.style.display = "block";
        searchResults.style.visibility = "visible";
    }
}

// Function to handle search input
async function handleSearchInput() {
    const query = searchInput.value;

    if (query.length > 2) {
        const results = await fetchSearchResults(query);

        // Display the results
        displaySearchResults(results);
    } else {
        searchResults.innerHTML = '';
        if (searchResults) {
            searchResults.style.display = "none";
        }
    }
}

// Function to fetch search results
async function fetchSearchResults(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${query}`);
        const data = await response.json();

        // Filter results to only movies and TV shows, with valid poster/backdrop images
        return data.results.filter(item =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            (item.poster_path || item.backdrop_path)
        ).slice(0, 6); // Limit to 6 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';

    // Position search results appropriately for current device
    positionSearchResults();

    if (results.length === 0) {
        searchResults.innerHTML = '<p style="padding: 10px; text-align: center;">No results found</p>';
        return;
    }

    results.forEach(result => {
        const shortenedTitle = result.title || result.name || 'Unknown Title';
        const date = result.release_date || result.first_air_date || '';
        let year = '';
        if (date) {
            year = new Date(date).getFullYear();
        }

        const mediaType = result.media_type === 'movie' ? 'movie' : 'tv';

        const item = document.createElement('div');
        // Create HTML structure for each item
        item.innerHTML = `<div class="search-item-thumbnail">
                            <img src="${result.poster_path
                                ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                                : result.backdrop_path
                                    ? `https://image.tmdb.org/t/p/w300${result.backdrop_path}`
                                    : 'https://via.placeholder.com/92x138?text=No+Image'}">
                        </div>
                        <div class="search-item-info">
                            <h3>${shortenedTitle}</h3>
                            <p>${mediaType} <span> &nbsp; ${year}</span></p>
                        </div>
                        <button class="watchListBtn" id="${result.id}">Add</button>`;

        const watchListBtn = item.querySelector('.watchListBtn');

        // Style the button to be more mobile-friendly
        if (window.innerWidth <= 480) {
            watchListBtn.style.padding = "4px 8px";
            watchListBtn.style.fontSize = "12px";
            watchListBtn.style.minWidth = "50px";
        }

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to parent elements

            // Get the watchlist from local storage
            const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

            // Check if the item is not already in the WatchList list
            if (!watchlist.find(item => item.id === result.id)) {
                watchlist.push({
                    id: result.id,
                    title: shortenedTitle,
                    poster_path: result.poster_path
                        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                        : result.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${result.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image',
                    media_type: mediaType,
                    release_date: date
                });
                localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
                watchListBtn.textContent = "Go";
                watchListBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent click from bubbling
                    window.location.href = '../watchList/watchlist.html'; // Navigate to the WatchList page
                });
            } else {
                window.location.href = '../watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = item.querySelector('.search-item-thumbnail');
        const info = item.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=${mediaType}&id=${result.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=${mediaType}&id=${result.id}`;
        });

        item.setAttribute('class', 'movie-list');

        // Append item to search results
        searchResults.appendChild(item);
    });
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
