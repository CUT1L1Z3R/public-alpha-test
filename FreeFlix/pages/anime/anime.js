/**
 * JavaScript file for the Anime page.
 * Handles fetching, displaying, and UI interactions for anime content.
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

// Function to update banner slideshow for anime
function updateBannerForAnime() {
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

    // For Anime section, use popular anime with the term "anime" and animation genre
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_keywords=210024&sort_by=popularity.desc&with_genres=16`)
        .then(response => response.json())
        .then(data => {
            const animeShows = data.results || [];
            // Filter to shows with backdrop images
            bannerItems = animeShows.filter(show => show.backdrop_path).slice(0, 9).map(show => ({
                ...show,
                mediaType: 'tv',
                isAnime: true
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
    if (item.first_air_date) {
        extraInfo.push(new Date(item.first_air_date).getFullYear());
    }

    // Add media type
    extraInfo.push('Latest Update');

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

            // Handle the "Latest Update" tag for anime section
            if (subtitleElement.textContent.includes('Latest Update')) {
                // Create a span to style just the "Latest Update" text
                subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                    'Latest Update',
                    '<span class="latest-update-badge">Latest Update</span>'
                );

                // Style the badge
                const badge = subtitleElement.querySelector('.latest-update-badge');
                if (badge) {
                    badge.style.backgroundColor = 'rgba(141, 22, 201, 0.85)'; // Purple for anime content
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
        window.location.href = `../../movie_details/movie_details.html?media=tv&id=${item.id}`;
    }, {passive: false});

    newMoreInfoButton.addEventListener(eventType, function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `../../movie_details/movie_details.html?media=tv&id=${item.id}`;
    }, {passive: false});
}

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple for good ratings (anime)
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display anime
function fetchAnime(containerClass, type) {
    console.log(`Fetching anime for ${containerClass} with type ${type}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        let endpoint = '';

        // Determine endpoint based on type
        if (type === 'popular') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        } else if (type === 'top_rated') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (type === 'upcoming') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=first_air_date.desc`;
        } else if (type === 'truly_upcoming') {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + 6);

            const formattedToday = today.toISOString().split('T')[0];
            const formattedFuture = futureDate.toISOString().split('T')[0];

            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${formattedToday}&air_date.lte=${formattedFuture}&sort_by=popularity.desc`;
        } else if (type === 'top_rated_anime_movies') {
            endpoint = `discover/movie?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (type === 'adventure') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,12&with_keywords=210024&sort_by=popularity.desc`;
        } else if (type === 'drama') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,18&with_keywords=210024&sort_by=popularity.desc`;
        } else if (type === 'comedy') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&sort_by=popularity.desc`;
        } else if (type === 'romance') {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&sort_by=popularity.desc`;
        } else {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        }

        // Fetch anime data from TMDB
        console.log(`Fetching anime from TMDB with endpoint: https://api.themoviedb.org/3/${endpoint}`);
        fetch(`https://api.themoviedb.org/3/${endpoint}`)
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
                    let useBackdrop = true;

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
                    if (type === 'top_rated_anime_movies') {
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
                        if (type === 'top_rated_anime_movies') {
                            window.location.href = `../../movie_details/movie_details.html?media=movie&id=${anime.id}`;
                        } else {
                            window.location.href = `../../movie_details/movie_details.html?media=tv&id=${anime.id}`;
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

        // Get all results that might be anime
        const potentialAnime = results
            .filter(item => {
                // Include TV shows and movies with animation genre
                if (item.genre_ids && item.genre_ids.includes(16) && item.poster_path) {
                    return true;
                }
                // Include items with specific anime keywords in the title
                const title = (item.title || item.name || '').toLowerCase();
                const animeKeywords = ['anime', 'manga', 'shonen', 'shōnen', 'shojo', 'shōjo', 'seinen', 'otaku', 'kun', 'chan', 'san', 'sensei'];
                return animeKeywords.some(keyword => title.includes(keyword)) && item.poster_path;
            })
            .map(item => ({
                ...item,
                poster_path: `https://image.tmdb.org/t/p/w92${item.poster_path}`,
                isAnime: true
            }));

        return potentialAnime;
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
        const shortenedTitle = item.title || item.name || 'Unknown Title';
        const date = item.release_date || item.first_air_date || '';
        const mediaType = item.media_type === 'movie' ? 'Movie' : 'TV Show';

        let buttonText = "Add to WatchList"; // Set default button text

        // Check if the anime is already in WatchList
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList"; // Change button text
        }

        const animeItem = document.createElement('div');
        // Create HTML structure for each item
        animeItem.innerHTML = `<div class = "search-item-thumbnail">
                                    <img src ="${item.poster_path}">
                                </div>
                                <div class ="search-item-info">
                                    <h3>${shortenedTitle}</h3>
                                    <p>Anime ${mediaType} <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = animeItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = '../../watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = animeItem.querySelector('.search-item-thumbnail');
        const info = animeItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            window.location.href = `../../movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../../movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
        });

        animeItem.setAttribute('class', 'movie-list');

        // Append item to search results
        searchResults.appendChild(animeItem);
    });
}

// Function to add an anime to WatchList
function addToWatchList(anime) {
    // Check if the anime is not already in the WatchList list
    if (!watchlist.find(watchlistItem => watchlistItem.id === anime.id)) {
        watchlist.push(anime);
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
        const watchListBtn = document.querySelector(`[id="${anime.id}"]`);
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

// Initialize the anime page
document.addEventListener('DOMContentLoaded', () => {
    // Update banner for anime section
    updateBannerForAnime();

    // Fetch anime data for each section
    fetchAnime('anime-upcoming-new-container', 'truly_upcoming'); // Latest anime
    fetchAnime('top-rated-anime-movie-container', 'top_rated_anime_movies'); // Top rated anime movies
    fetchAnime('anime-popular-container', 'popular'); // Popular anime
    fetchAnime('anime-top-container', 'top_rated'); // Top rated anime
    fetchAnime('anime-upcoming-container', 'upcoming'); // Ongoing anime
    fetchAnime('adventure-anime-container', 'adventure'); // Adventure anime
    fetchAnime('drama-anime-container', 'drama'); // Drama anime
    fetchAnime('anime-comedy-container', 'comedy'); // Comedy anime
    fetchAnime('anime-romance-container', 'romance'); // Romance anime

    // Setup scroll functionality for each container
    setupScroll('anime-upcoming-new-container', 'anime-upcoming-new-previous', 'anime-upcoming-new-next');
    setupScroll('top-rated-anime-movie-container', 'top-rated-anime-movie-previous', 'top-rated-anime-movie-next');
    setupScroll('anime-popular-container', 'anime-popular-previous', 'anime-popular-next');
    setupScroll('anime-top-container', 'anime-top-previous', 'anime-top-next');
    setupScroll('anime-upcoming-container', 'anime-upcoming-previous', 'anime-upcoming-next');
    setupScroll('adventure-anime-container', 'adventure-anime-previous', 'adventure-anime-next');
    setupScroll('drama-anime-container', 'drama-anime-previous', 'drama-anime-next');
    setupScroll('anime-comedy-container', 'anime-comedy-previous', 'anime-comedy-next');
    setupScroll('anime-romance-container', 'anime-romance-previous', 'anime-romance-next');

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
