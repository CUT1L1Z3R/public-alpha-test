/**
 * Shared Search Functionality for FreeFlix
 * This file contains common search functions that work across all pages
 */

// TMDB API key
const SEARCH_API_KEY = '84259f99204eeb7d45c7e3d8e36c6123';

// Initialize watchlist from localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

/**
 * Fetch search results from TMDB API
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of search results
 */
async function fetchSearchResults(query) {
    if (!query || query.length < 2) return [];

    try {
        // Search for movies, TV shows, and anime
        const [movieResults, tvResults] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/movie?api_key=${SEARCH_API_KEY}&query=${encodeURIComponent(query)}`).then(res => res.json()),
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${SEARCH_API_KEY}&query=${encodeURIComponent(query)}`).then(res => res.json())
        ]);

        // Combine and format results
        const movies = (movieResults.results || []).map(item => ({
            ...item,
            media_type: 'movie',
            title: item.title,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/assets/freeflix.png',
            isAnime: false
        }));

        const tvShows = (tvResults.results || []).map(item => ({
            ...item,
            media_type: 'tv',
            title: item.name,
            release_date: item.first_air_date,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/assets/freeflix.png',
            isAnime: item.genre_ids && item.genre_ids.includes(16) // Animation genre
        }));

        // Combine and limit results
        const allResults = [...movies, ...tvShows];
        return allResults.slice(0, 10); // Limit to 10 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

/**
 * Display search results in the search dropdown
 * @param {Array} results - Array of search results
 * @param {HTMLElement} searchResults - The search results container element
 */
function displaySearchResults(results, searchResults) {
    if (!searchResults) return;

    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    results.forEach(item => {
        const shortenedTitle = item.title || 'Unknown Title';
        const date = item.release_date || '';

        let buttonText = "Add to WatchList";

        // Check if the item is already in watchlist
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList";
        }

        const movieItem = document.createElement('div');
        movieItem.className = 'search-item';
        movieItem.innerHTML = `
            <div class="search-item-thumbnail">
                <img src="${item.poster_path}" alt="${shortenedTitle}" loading="lazy">
            </div>
            <div class="search-item-info">
                <h3>${shortenedTitle}</h3>
                <p>${item.media_type || 'unknown'} <span>&nbsp;${date}</span></p>
            </div>
            <button class="watchListBtn" data-id="${item.id}">${buttonText}</button>
        `;

        const watchListBtn = movieItem.querySelector('.watchListBtn');
        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to watchlist button
        watchListBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
                watchListBtn.textContent = "Go to WatchList";
            } else {
                navigateToWatchList();
            }
        });

        // Add event listeners to navigate to details page
        const navigateToDetails = () => {
            if (item.isAnime) {
                window.location.href = `${getBasePath()}movie_details/movie_details.html?media=tv&id=${item.id}`;
            } else {
                window.location.href = `${getBasePath()}movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        };

        thumbnail.addEventListener('click', navigateToDetails);
        info.addEventListener('click', navigateToDetails);

        searchResults.appendChild(movieItem);
    });
}

/**
 * Add item to watchlist
 * @param {Object} item - The item to add to watchlist
 */
function addToWatchList(item) {
    if (!watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
        watchlist.push(item);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));

        // Show success message
        showToast && showToast('Added to watchlist!', 'success');
    }
}

/**
 * Navigate to watchlist page
 */
function navigateToWatchList() {
    window.location.href = `${getBasePath()}watchList/watchlist.html`;
}

/**
 * Get the base path for navigation based on current page
 * @returns {string} The base path
 */
function getBasePath() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/movies/')) return '../';
    if (currentPath.includes('/tvshows/')) return '../';
    if (currentPath.includes('/anime/')) return '../';
    if (currentPath.includes('/movie_details/')) return '../';
    if (currentPath.includes('/watchList/')) return '../';
    if (currentPath.includes('/genre/')) return '../';

    return './'; // For index.html
}

/**
 * Initialize search functionality for any page
 * @param {string} searchInputId - ID of the search input element
 * @param {string} searchResultsId - ID of the search results container element
 */
function initializeSearch(searchInputId = 'searchInput', searchResultsId = 'searchResults') {
    const searchInput = document.getElementById(searchInputId);
    const searchResults = document.getElementById(searchResultsId);

    if (!searchInput || !searchResults) {
        console.warn('Search elements not found:', { searchInputId, searchResultsId });
        return;
    }

    // Handle search input changes
    const handleSearchInput = async () => {
        const query = searchInput.value.trim();
        if (query.length > 2) {
            const results = await fetchSearchResults(query);
            if (results.length > 0) {
                searchResults.style.visibility = "visible";
                searchResults.style.display = "block";
            }
            displaySearchResults(results, searchResults);
        } else {
            searchResults.innerHTML = '';
            searchResults.style.visibility = "hidden";
            searchResults.style.display = "none";
        }
    };

    // Event listeners
    searchInput.addEventListener('input', handleSearchInput);

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length > 2) {
            fetchSearchResults(query).then(results => {
                if (results.length > 0) {
                    displaySearchResults(results, searchResults);
                    searchResults.style.visibility = "visible";
                    searchResults.style.display = "block";
                }
            });
        }
    });

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleSearchInput();
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target === searchInput) return;

        if (!searchResults.contains(event.target)) {
            searchResults.style.visibility = "hidden";
            searchResults.style.display = "none";
        }
    });
}

/**
 * Create search HTML structure for pages that don't have it
 * @param {string} placeholder - Placeholder text for search input
 * @returns {string} HTML string for search component
 */
function createSearchHTML(placeholder = "Search movies, series, anime...") {
    return `
        <div class="header-center">
            <div class="search-container">
                <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input type="text" class="search-input" placeholder="${placeholder}" id="searchInput">
            </div>
            <div class="search-results" id="searchResults"></div>
        </div>
    `;
}

// Auto-initialize search if elements exist
document.addEventListener('DOMContentLoaded', () => {
    // Try different search input IDs that might exist
    const searchInputIds = ['searchInput', 'header-search'];
    const searchResultsIds = ['searchResults', 'search-results'];

    for (let inputId of searchInputIds) {
        for (let resultsId of searchResultsIds) {
            const input = document.getElementById(inputId);
            const results = document.getElementById(resultsId);

            if (input && results) {
                initializeSearch(inputId, resultsId);
                return;
            }
        }
    }
});
