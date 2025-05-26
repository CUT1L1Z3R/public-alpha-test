//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['vidsrc.icu', 'vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];

// Function to show toast notification
function showToast(message, type = 'info') {
    // Check if a toast container already exists
    let toastContainer = document.querySelector('.toast-container');

    // If not, create one
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Function to handle content download (declare early to avoid hoisting issues)
function handleDownload() {
    let downloadUrl = '';
    let contentType = media === 'movie' ? 'movie' : 'episode';

    // Show preparing download notification
    showToast(`Preparing your ${contentType} download...`, 'info');

    // Generate the appropriate download URL based on media type
    if (media === 'movie') {
        // For movies, use the movie download endpoint
        downloadUrl = `https://dl.vidsrc.vip/movie/${id}`;
    } else if (media === 'tv') {
        // For TV shows and anime, need to determine season and episode
        const activeEpisode = document.querySelector('.episode-item.active');

        if (activeEpisode) {
            // If an episode is selected, use that specific episode
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/${episodeNumber}`;
        } else if (seasonSelect && seasonSelect.value) {
            // If no episode selected but season is selected, use first episode of selected season
            const seasonNumber = seasonSelect.value;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/1`;
        } else {
            // Default to first episode of first season if nothing selected
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/1/1`;
        }
    }

    // Log the URL for debugging
    console.log(`Download URL: ${downloadUrl}`);

    // Redirect to the download countdown page with the download URL as parameter
    if (downloadUrl) {
        // Encode the URL to avoid issues with query parameters
        const encodedUrl = encodeURIComponent(downloadUrl);

        // Add a slight delay to show the toast
        setTimeout(() => {
            window.location.href = `../download.html?url=${encodedUrl}`;
        }, 800);
    } else {
        showToast("Unable to generate download URL. Please try a different server.", 'error');
    }
}

// Function to ensure iframe controls are accessible on mobile
function ensureControlsAccessible() {
    if (window.innerWidth <= 560) { // Only on mobile
        const iframe = document.getElementById('iframe');
        const spacer = document.getElementById('player-controls-spacer');

        if (iframe && spacer) {
            // Set spacer height proportionally
            spacer.style.height = '75px';

            // Force iframe to have breathing room for controls
            iframe.style.paddingRight = '50px';

            // Ensure proper minimum height
            iframe.style.minHeight = '220px';
        }
    }
}

// Selecting various elements on the page for displaying movie details
const movieTitle = document.getElementById('movieTitle');
const moviePoster = document.getElementById('moviePoster');
const movieYear = document.getElementById('movieYear');
const rating = document.getElementById('rating');
const genre = document.getElementById('genre');
const plot = document.getElementById("plot");
const language = document.getElementById("language");
const iframe = document.getElementById("iframe");
const watchListBtn = document.querySelector('.watchListBtn');
const downloadBtn = document.querySelector('.downloadBtn');
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Season and Episode selectors
const seasonsContainer = document.getElementById('seasons-container');
const seasonSelect = document.getElementById('season-select');
const episodesList = document.getElementById('episodes-list');

// API key for TMDB API
const api_Key = 'e79515e88dfd7d9f6eeca36e49101ac2';

// Retrieve the TMDb ID and Media from the URL parameter
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const media = params.get("media");

// Function to fetch detailed information using its TMDb ID or AniList ID for anime
async function fetchMovieDetails(id) {
    if (media === "anime") {
        // Use AniList API for anime content
        return await fetchAnimeDetails(id);
    } else {
        // For non-anime content, use TMDB API
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}?api_key=${api_Key}`);
        const data = await response.json();

        // For TV shows, check if we have additional genre info to include
        if (media === "tv" && data) {
            // Check if this is likely anime by looking at genres
            const isAnime = data.genres && data.genres.some(genre => genre.id === 16); // 16 is Animation genre

            if (isAnime) {
                // Mark this as anime content for specialized handling if needed
                data.is_anime = true;
            }
        }

        return data;
    }
}

// Helper function to create anime seasons based on episode count
function createAnimeSeasons(totalEpisodes) {
    if (!totalEpisodes || totalEpisodes === 'Unknown') {
        return [{
            season_number: 1,
            episode_count: 50, // Default to 50 episodes for long-running anime
            name: 'Season 1'
        }];
    }

    const episodesPerSeason = 50; // Group episodes into seasons of 50
    const seasons = [];
    let remainingEpisodes = totalEpisodes;
    let seasonNumber = 1;

    while (remainingEpisodes > 0) {
        const episodesInThisSeason = Math.min(episodesPerSeason, remainingEpisodes);
        seasons.push({
            season_number: seasonNumber,
            episode_count: episodesInThisSeason,
            name: `Episodes ${(seasonNumber - 1) * episodesPerSeason + 1}-${(seasonNumber - 1) * episodesPerSeason + episodesInThisSeason}`
        });

        remainingEpisodes -= episodesInThisSeason;
        seasonNumber++;
    }

    return seasons;
}

// Function to fetch anime details from AniList API
async function fetchAnimeDetails(id) {
    const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                description
                startDate {
                    year
                    month
                    day
                }
                endDate {
                    year
                    month
                    day
                }
                season
                seasonYear
                episodes
                duration
                status
                genres
                averageScore
                popularity
                studios {
                    nodes {
                        name
                    }
                }
                coverImage {
                    large
                    medium
                }
                bannerImage
                format
                source
                countryOfOrigin
            }
        }
    `;

    const variables = {
        id: parseInt(id)
    };

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        const data = await response.json();

        if (data.data && data.data.Media) {
            const anime = data.data.Media;

            // Transform AniList data to match the expected structure
            return {
                id: anime.id,
                title: anime.title.english || anime.title.romaji || anime.title.native,
                name: anime.title.english || anime.title.romaji || anime.title.native,
                overview: anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No description available', // Remove HTML tags
                poster_path: anime.coverImage.large,
                backdrop_path: anime.bannerImage || anime.coverImage.large,
                first_air_date: anime.startDate ? `${anime.startDate.year}-${String(anime.startDate.month || 1).padStart(2, '0')}-${String(anime.startDate.day || 1).padStart(2, '0')}` : 'Unknown',
                vote_average: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
                genres: anime.genres ? anime.genres.map(genre => ({ name: genre })) : [{ name: 'Anime' }],
                spoken_languages: [{ english_name: 'Japanese' }], // Default for anime
                number_of_episodes: anime.episodes || 'Unknown',
                status: anime.status || 'Unknown',
                studios: anime.studios.nodes.map(studio => studio.name).join(', ') || 'Unknown',
                is_anime: true,
                seasons: createAnimeSeasons(anime.episodes)
            };
        } else {
            // Fallback if AniList doesn't have the anime
            return {
                title: 'Anime Not Found',
                name: 'Anime Not Found',
                overview: 'This anime could not be found in the database.',
                poster_path: null,
                backdrop_path: null,
                first_air_date: 'Unknown',
                vote_average: 'N/A',
                genres: [{ name: 'Anime' }],
                spoken_languages: [{ english_name: 'Japanese' }],
                is_anime: true
            };
        }
    } catch (error) {
        console.error('Error fetching anime details from AniList:', error);

        // Fallback error response
        return {
            title: 'Error Loading Anime',
            name: 'Error Loading Anime',
            overview: 'There was an error loading this anime. Please try again later.',
            poster_path: null,
            backdrop_path: null,
            first_air_date: 'Unknown',
            vote_average: 'N/A',
            genres: [{ name: 'Anime' }],
            spoken_languages: [{ english_name: 'Japanese' }],
            is_anime: true
        };
    }
}

// Function to fetch video details (trailers) for a movie or TV show
async function fetchVideoDetails(id) {
    if (media === "anime") {
        // For anime, we don't typically have trailers in AniList, return empty array
        return [];
    } else {
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/videos?api_key=${api_Key}`);
        const data = await response.json();
        return data.results;
    }
}

// Function to fetch TV show seasons
async function fetchTVSeasons(id) {
    if (media === "anime") {
        // For anime, we'll create seasons based on the episode count from AniList
        const animeDetails = await fetchAnimeDetails(id);
        return animeDetails.seasons || [];
    } else {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${api_Key}`);
        const data = await response.json();
        return data.seasons;
    }
}

// Function to fetch episodes for a specific season
async function fetchSeasonEpisodes(tvId, seasonNumber) {
    if (media === "anime") {
        // For anime, create episodes based on the season structure
        const animeDetails = await fetchAnimeDetails(tvId);
        const seasons = animeDetails.seasons;

        // Find the specific season
        const season = seasons.find(s => s.season_number === parseInt(seasonNumber));
        if (!season) return [];

        const episodes = [];
        const episodesPerSeason = 50;
        const startEpisode = (seasonNumber - 1) * episodesPerSeason + 1;

        for (let i = 0; i < season.episode_count; i++) {
            const episodeNumber = startEpisode + i;
            episodes.push({
                episode_number: episodeNumber, // Global episode number (for the anime server)
                season_number: parseInt(seasonNumber),
                name: `Episode ${episodeNumber}`,
                overview: `Episode ${episodeNumber} of ${animeDetails.title || animeDetails.name}`,
                still_path: animeDetails.backdrop_path || animeDetails.poster_path, // Use anime poster/banner as thumbnail
                air_date: null
            });
        }
        return episodes;
    } else {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${api_Key}`);
        const data = await response.json();
        return data.episodes;
    }
}

document.getElementById('change-server-btn').addEventListener('click', () => {
    const serverSelector = document.getElementById('server-selector');
    serverSelector.style.display = (serverSelector.style.display === 'block') ? 'none' : 'block';

    // Log current state for debugging
    console.log(`Current media type: ${media}, ID: ${id}`);
    if (media === "tv") {
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            console.log(`Active episode - Season: ${activeEpisode.dataset.seasonNumber}, Episode: ${activeEpisode.dataset.episodeNumber}`);
        }
    }
});

document.getElementById('server-selector').addEventListener('click', (e) => {
  if (e.target !== document.getElementById('server')) {
    document.getElementById('server-selector').style.display = 'none';
  }
});

// Add event listener for the close button
document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('server-selector').style.display = 'none';
});

// Function to create season dropdown items
function createSeasonOptions(seasons) {
    seasonSelect.innerHTML = '';

    seasons.forEach(season => {
        // Skip season 0 which is typically for specials
        if (season.season_number > 0) {
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Season ${season.season_number} (${season.episode_count} Episodes)`;
            seasonSelect.appendChild(option);
        }
    });

    // Set up event listener for season selection
    seasonSelect.addEventListener('change', function() {
        const selectedSeason = this.value;
        loadEpisodes(id, selectedSeason);
    });

    // Load the first season episodes by default
    if (seasons.length > 0) {
        // Find the first regular season (season_number > 0)
        const firstSeason = seasons.find(season => season.season_number > 0);
        if (firstSeason) {
            loadEpisodes(id, firstSeason.season_number);
        }
    }
}

// Function to create episode list items
function createEpisodesList(episodes) {
    episodesList.innerHTML = '';

    episodes.forEach(episode => {
        const episodeItem = document.createElement('div');
        episodeItem.className = 'episode-item';
        episodeItem.dataset.episodeNumber = episode.episode_number;
        episodeItem.dataset.seasonNumber = episode.season_number;

        // Create thumbnail container
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';

        // Create thumbnail image
        const thumbnail = document.createElement('img');
        thumbnail.className = 'episode-thumbnail';
        // Handle different thumbnail sources based on media type
        if (episode.still_path) {
            if (media === 'anime' && !episode.still_path.startsWith('/')) {
                // For anime, still_path might be a full URL from AniList
                thumbnail.src = episode.still_path;
            } else {
                // For TV shows, still_path is TMDb path
                thumbnail.src = `https://image.tmdb.org/t/p/w300${episode.still_path}`;
            }
        } else {
            // Fallback for episodes without thumbnails
            thumbnail.src = `https://via.placeholder.com/300x170/2c0e4c/ffffff?text=Episode+${episode.episode_number}`;
        }
        thumbnail.alt = `${episode.name} Thumbnail`;

        // Add error handling for broken images
        thumbnail.onerror = function() {
            this.src = `https://via.placeholder.com/300x170/2c0e4c/ffffff?text=Episode+${episode.episode_number}`;
        };

        // Add loading attribute for better performance
        thumbnail.loading = 'lazy';

        // Create episode number badge
        const episodeNumber = document.createElement('div');
        episodeNumber.className = 'episode-number';
        episodeNumber.textContent = episode.episode_number;

        // Add thumbnail and number to container
        thumbnailContainer.appendChild(thumbnail);
        thumbnailContainer.appendChild(episodeNumber);

        // Create episode info container
        const episodeInfo = document.createElement('div');
        episodeInfo.className = 'episode-info';

        // Create episode title
        const episodeTitle = document.createElement('div');
        episodeTitle.className = 'episode-title';
        episodeTitle.textContent = episode.name;

        // Create episode description
        const episodeDescription = document.createElement('div');
        episodeDescription.className = 'episode-description';
        episodeDescription.textContent = episode.overview || 'No description available.';

        // Add title and description to info container
        episodeInfo.appendChild(episodeTitle);
        episodeInfo.appendChild(episodeDescription);

        // Add all elements to episode item
        episodeItem.appendChild(thumbnailContainer);
        episodeItem.appendChild(episodeInfo);

        // Add click event to play the episode
        episodeItem.addEventListener('click', () => {
            playEpisode(id, episode.season_number, episode.episode_number);
        });

        episodesList.appendChild(episodeItem);
    });
}

// Function to load episodes for a specific season
async function loadEpisodes(tvId, seasonNumber) {
    try {
        const episodes = await fetchSeasonEpisodes(tvId, seasonNumber);
        createEpisodesList(episodes);
    } catch (error) {
        console.error('Error loading episodes:', error);
        episodesList.innerHTML = '<p>Error loading episodes. Please try again.</p>';
    }
}

// Add code to update player when source changes
function loadMedia(embedURL, server) {
    // Set the source of the iframe to the video URL
    iframe.setAttribute('src', embedURL);

    // Show the iframe and ensure it's visible
    iframe.style.display = "block";

    // Hide the movie poster when the video is loaded
    moviePoster.style.display = "none";

    // Ensure controls are accessible after changing source
    setTimeout(ensureControlsAccessible, 500);
}

// Enhanced function to handle media loading with sub-to-dub fallback for anime
function loadMediaWithFallback(embedURL, server, type) {
    // Update the iframe source with the correct video URL and set attributes
    iframe.setAttribute('src', embedURL);
    iframe.setAttribute('playsinline', '');
    iframe.setAttribute('webkit-playsinline', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('allowfullscreen', '');

    let hasTriedDub = false;
    let retryTimeout;
    let errorDetectionTimeout;
    let popupObserver;

    // Setup error handling with anime sub-to-dub fallback
    const handleIframeError = () => {
        console.log(`Error loading: ${embedURL}`);

        // Clear any existing timeouts
        if (retryTimeout) {
            clearTimeout(retryTimeout);
        }
        if (errorDetectionTimeout) {
            clearTimeout(errorDetectionTimeout);
        }
        if (popupObserver) {
            popupObserver.disconnect();
        }

        // For anime on vidsrc.icu, try dub version if sub fails
        if (type === "anime" && server === "vidsrc.icu" && !hasTriedDub) {
            hasTriedDub = true;
            console.log("Sub version failed, trying dub version...");

            // Get episode number
            const activeEpisode = document.querySelector('.episode-item.active');
            let episodeNumber = 1;
            if (activeEpisode) {
                episodeNumber = activeEpisode.dataset.episodeNumber || 1;
            }

            // Create dub URL (change 0 to 1)
            const dubURL = `https://vidsrc.icu/embed/anime/${id}/${episodeNumber}/1`;
            console.log(`Trying dub version: ${dubURL}`);

            // Show toast notification
            showToast("Sub version unavailable, switching to dub...", 'info');

            // Try loading dub version
            iframe.setAttribute('src', dubURL);

            // Set up error handling for dub version with improved detection
            retryTimeout = setTimeout(() => {
                checkIframeLoad(dubURL, () => {
                    console.log("Dub version also failed, trying next server");
                    tryNextServer();
                });
            }, 5000);
            return;
        }

        // If dub also fails or not anime/vidsrc.icu, try next server in fallback chain
        tryNextServer();
    };

    const tryNextServer = () => {
        let currentIndex = serverFallbackChain.indexOf(server);
        const nextIndex = currentIndex + 1;
        if (nextIndex < serverFallbackChain.length) {
            const nextServer = serverFallbackChain[nextIndex];
            console.log(`Switching to next server: ${nextServer}`);
            document.getElementById('server').value = nextServer;
            showToast(`Switching to ${nextServer} server...`, 'info');
            changeServer();
        } else {
            showToast("All servers failed to load content", 'error');
        }
    };

    // Enhanced iframe load checking function with better error detection
    const checkIframeLoad = (expectedURL, onFailure) => {
        let checkAttempts = 0;
        const maxAttempts = 4;
        let hasFoundError = false;

        const performCheck = () => {
            checkAttempts++;
            console.log(`Check attempt ${checkAttempts} for URL: ${expectedURL}`);

            try {
                // Enhanced detection for vidsrc.icu popup errors and other indicators
                const errorSelectors = [
                    // Browser native popup/alert detection
                    '[role="dialog"]',
                    '[role="alert"]',
                    '[role="alertdialog"]',
                    // Common popup/modal classes
                    '.popup',
                    '.modal',
                    '.dialog',
                    '.alert',
                    '.error-popup',
                    '.notification',
                    // Elements with specific text content
                    '*'
                ];

                const errorElements = document.querySelectorAll(errorSelectors.join(','));
                for (let element of errorElements) {
                    const text = element.textContent || element.innerText || '';
                    const isVisible = element.offsetParent !== null &&
                                    window.getComputedStyle(element).visibility !== 'hidden' &&
                                    window.getComputedStyle(element).display !== 'none';

                    // Enhanced error patterns specifically for vidsrc.icu popup
                    const errorPatterns = [
                        'An embedded page at vidsrc.icu says',
                        'An error occurred while loading the video',
                        'vidsrc.icu says',
                        'Please try again later',
                        'Error loading video',
                        'Video not found',
                        'Content unavailable',
                        'Server error',
                        'Failed to load',
                        'Network error',
                        'Connection timeout',
                        '502 Bad Gateway',
                        '404 Not Found',
                        '500 Internal Server Error',
                        'Service temporarily unavailable',
                        'Unable to play video',
                        'Video player error',
                        'Stream not available',
                        'Content blocked',
                        'Access denied'
                    ];

                    if (isVisible && errorPatterns.some(pattern =>
                        text.toLowerCase().includes(pattern.toLowerCase()))) {
                        console.log("Enhanced error detected in page content:", {
                            text: text.substring(0, 100),
                            element: element.className || element.tagName,
                            isVisible: isVisible
                        });
                        hasFoundError = true;
                        if (onFailure) onFailure();
                        return;
                    }
                }

                // Check for loading indicators that persist too long
                const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="load"], [class*="spin"]');
                let hasLoadingIndicator = false;
                for (let element of loadingElements) {
                    if (element.style.display !== 'none' && element.offsetParent !== null) {
                        hasLoadingIndicator = true;
                        break;
                    }
                }

                // If still loading after many attempts, consider it a failure
                if (hasLoadingIndicator && checkAttempts >= maxAttempts) {
                    console.log("Loading indicator persists, considering as failure");
                    if (onFailure) onFailure();
                    return;
                }

                // Check if URL changed unexpectedly
                const currentSrc = iframe.getAttribute('src');
                if (currentSrc !== expectedURL) {
                    console.log("URL changed, considering as potential failure");
                    if (onFailure) onFailure();
                    return;
                }

                // Check iframe dimensions and visibility
                const iframeRect = iframe.getBoundingClientRect();
                if (iframeRect.width === 0 || iframeRect.height === 0) {
                    console.log("Iframe has no dimensions, potential failure");
                    if (checkAttempts >= maxAttempts && onFailure) {
                        onFailure();
                        return;
                    }
                }

                // Check iframe content window (this will usually throw cross-origin error for successful loads)
                if (iframe.contentWindow) {
                    try {
                        const location = iframe.contentWindow.location.href;
                        if (location === 'about:blank' || location.includes('error')) {
                            console.log("Iframe showing blank or error page");
                            if (checkAttempts >= maxAttempts && onFailure) {
                                onFailure();
                                return;
                            }
                        }
                    } catch (e) {
                        // Cross-origin error usually means content loaded successfully
                        // But we should still check for other error indicators
                        if (!hasFoundError && checkAttempts >= 2) {
                            console.log("Content appears to be loaded (cross-origin restriction detected)");
                            return; // Consider this a success
                        }
                    }
                }

                // If we've reached max attempts without detecting success, call failure handler
                if (checkAttempts >= maxAttempts && !hasFoundError && onFailure) {
                    console.log("Max attempts reached, considering as failure for anime sub-to-dub fallback");
                    onFailure();
                }
            } catch (error) {
                console.log("Error checking iframe content:", error);
                if (checkAttempts >= maxAttempts && onFailure) {
                    onFailure();
                }
            }
        };

        // Check immediately and then at intervals
        setTimeout(performCheck, 500);  // Quick initial check
        setTimeout(performCheck, 2000); // Early check
        setTimeout(performCheck, 5000); // Medium check
        setTimeout(performCheck, 8000); // Final check
    };

    // Set up iframe error detection
    iframe.onerror = handleIframeError;

    // Enhanced load event handler
    iframe.onload = () => {
        console.log(`Successfully loaded: ${embedURL}`);
        // Clear any pending retry timeouts
        if (retryTimeout) {
            clearTimeout(retryTimeout);
        }
        // Reset error handlers for future loads
        hasTriedDub = false;

        // Show success message for dub fallback
        if (hasTriedDub && type === "anime") {
            showToast("Successfully loaded dub version", 'success');
        }
    };

    // Add message listener for iframe errors and browser alerts
    const messageListener = (event) => {
        // Listen for error messages from iframe
        if (event.data && typeof event.data === 'string') {
            const errorPatterns = [
                'error',
                'failed',
                'An error occurred while loading the video',
                'vidsrc.icu says',
                'Please try again later',
                '404',
                '502',
                '500'
            ];

            if (errorPatterns.some(pattern =>
                event.data.toLowerCase().includes(pattern.toLowerCase()))) {
                console.log("Error message received from iframe:", event.data);
                handleIframeError();
            }
        }
    };

    // Override browser alert functions to catch vidsrc.icu popup errors
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    const alertInterceptor = (message) => {
        console.log("Alert intercepted:", message);
        if (message && typeof message === 'string') {
            const errorPatterns = [
                'An embedded page at vidsrc.icu says',
                'An error occurred while loading the video',
                'vidsrc.icu says',
                'Please try again later'
            ];

            if (errorPatterns.some(pattern =>
                message.toLowerCase().includes(pattern.toLowerCase()))) {
                console.log("vidsrc.icu error alert detected, triggering fallback");
                handleIframeError();
                return; // Don't show the alert
            }
        }
        return originalAlert.call(window, message);
    };

    const confirmInterceptor = (message) => {
        console.log("Confirm intercepted:", message);
        if (message && typeof message === 'string') {
            const errorPatterns = [
                'An embedded page at vidsrc.icu says',
                'An error occurred while loading the video',
                'vidsrc.icu says',
                'Please try again later'
            ];

            if (errorPatterns.some(pattern =>
                message.toLowerCase().includes(pattern.toLowerCase()))) {
                console.log("vidsrc.icu error confirm detected, triggering fallback");
                handleIframeError();
                return false; // Don't show the confirm
            }
        }
        return originalConfirm.call(window, message);
    };

    // Temporarily override alert/confirm
    window.alert = alertInterceptor;
    window.confirm = confirmInterceptor;

    // Add click event listener to detect OK button clicks on error popups
    const clickListener = (event) => {
        const target = event.target;
        if (target && (target.textContent === 'OK' || target.textContent === 'ok' ||
                      target.className.includes('ok') || target.className.includes('button'))) {
            // Check if this click is on an error popup
            const popup = target.closest('[role="dialog"], .popup, .modal, .alert');
            if (popup) {
                const popupText = popup.textContent || '';
                if (popupText.includes('vidsrc.icu says') ||
                    popupText.includes('An error occurred while loading the video')) {
                    console.log("OK button clicked on vidsrc.icu error popup");
                    setTimeout(handleIframeError, 100); // Small delay after popup closes
                }
            }
        }
    };

    document.addEventListener('click', clickListener, true);

    // Add the listener
    window.addEventListener('message', messageListener);

    // Enhanced DOM Observer to detect error popups/dialogs with better patterns
    popupObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    const text = node.textContent || node.innerText || '';
                    const classList = node.className || '';
                    const nodeName = node.nodeName.toLowerCase();

                    // Enhanced error patterns for vidsrc.icu
                    const errorPatterns = [
                        'An embedded page at vidsrc.icu says',
                        'An error occurred while loading the video',
                        'vidsrc.icu says',
                        'Please try again later',
                        'Error loading video',
                        'Video not found',
                        'Content unavailable',
                        'Server error',
                        'Failed to load',
                        'Network error',
                        'Connection timeout',
                        '502 Bad Gateway',
                        '404 Not Found',
                        '500 Internal Server Error',
                        'Service temporarily unavailable',
                        'Unable to play video',
                        'Video player error',
                        'Stream not available',
                        'Content blocked',
                        'Access denied'
                    ];

                    // Check for common popup/modal/dialog elements
                    const isPopupElement = classList.includes('popup') ||
                                         classList.includes('modal') ||
                                         classList.includes('dialog') ||
                                         classList.includes('alert') ||
                                         classList.includes('error') ||
                                         classList.includes('notification') ||
                                         nodeName === 'dialog' ||
                                         node.getAttribute('role') === 'dialog' ||
                                         node.getAttribute('role') === 'alert';

                    // Check if text matches any error pattern
                    const hasErrorText = errorPatterns.some(pattern =>
                        text.toLowerCase().includes(pattern.toLowerCase())
                    );

                    if (hasErrorText || (isPopupElement && text.length > 10)) {
                        console.log("Enhanced error popup detected:", {
                            text: text.substring(0, 100),
                            classList: classList,
                            nodeName: nodeName,
                            isPopupElement: isPopupElement
                        });

                        // Immediate error handling for critical errors
                        if (hasErrorText) {
                            setTimeout(handleIframeError, 500);
                        } else if (isPopupElement) {
                            // For popup elements without clear error text, wait a bit longer
                            setTimeout(handleIframeError, 1500);
                        }
                    }
                }
            });
        });
    });

    // Start observing with more comprehensive options
    popupObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    // Clean up listeners after some time
    setTimeout(() => {
        window.removeEventListener('message', messageListener);
        document.removeEventListener('click', clickListener, true);
        if (popupObserver) {
            popupObserver.disconnect();
        }
        if (errorDetectionTimeout) {
            clearTimeout(errorDetectionTimeout);
        }
        // Restore original alert/confirm functions
        window.alert = originalAlert;
        window.confirm = originalConfirm;
    }, 15000);

    // Enhanced immediate error checking with iframe-specific selectors
    const performImmediateErrorCheck = () => {
        // Check iframe content and surrounding elements
        const iframeContainer = iframe.parentElement;
        const possibleErrorElements = [
            ...document.querySelectorAll('[class*="error"]'),
            ...document.querySelectorAll('[class*="popup"]'),
            ...document.querySelectorAll('[class*="modal"]'),
            ...document.querySelectorAll('[class*="dialog"]'),
            ...document.querySelectorAll('[class*="alert"]'),
            ...document.querySelectorAll('div[style*="position: fixed"]'),
            ...document.querySelectorAll('div[style*="position: absolute"]'),
            ...(iframeContainer ? [iframeContainer] : [])
        ];

        const errorPatterns = [
            'An embedded page at vidsrc.icu says',
            'An error occurred while loading the video',
            'vidsrc.icu says',
            'Please try again later',
            'Error loading video',
            'Video not found',
            'Content unavailable',
            'Server error',
            'Failed to load',
            'Network error',
            'Connection timeout',
            '502 Bad Gateway',
            '404 Not Found',
            'Service temporarily unavailable',
            'Unable to play video',
            'Video player error',
            'Stream not available'
        ];

        for (let element of possibleErrorElements) {
            const text = element.textContent || element.innerText || '';
            const isVisible = element.offsetParent !== null ||
                            window.getComputedStyle(element).display !== 'none';

            if (isVisible && errorPatterns.some(pattern =>
                text.toLowerCase().includes(pattern.toLowerCase()))) {
                console.log("Immediate error detected:", {
                    text: text.substring(0, 100),
                    element: element.className || element.tagName
                });
                handleIframeError();
                return true;
            }
        }
        return false;
    };

    // Quick initial check
    setTimeout(performImmediateErrorCheck, 100);

    // Additional checks at intervals for popup errors that appear with delay
    errorDetectionTimeout = setTimeout(performImmediateErrorCheck, 500);
    setTimeout(performImmediateErrorCheck, 1500);
    setTimeout(performImmediateErrorCheck, 3000);

    // Enhanced error detection with timeout - start checking immediately
    retryTimeout = setTimeout(() => {
        if (!performImmediateErrorCheck()) {
            checkIframeLoad(embedURL, handleIframeError);
        }
    }, 1000);

    // Ensure iframe is visible and sized correctly
    iframe.style.display = "block";  // Show the iframe

    // Hide the movie poster when the video is playing
    moviePoster.style.display = "none";  // Hide the movie poster image

    // Ensure controls are accessible after changing source
    setTimeout(ensureControlsAccessible, 500);
}

// Function to handle video source change based on selected server
async function changeServer() {
    const server = document.getElementById('server').value; // Get the selected server
    const type = media === "movie" ? "movie" : (media === "anime" ? "anime" : "tv"); // Movie, TV, or Anime type

    // Check if we're viewing a TV show with episode selected
    if (type === "tv" && seasonsContainer.style.display === "flex") {
        // If an episode is already selected (playing), update it with the new server
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            playEpisode(id, seasonNumber, episodeNumber);
            return;
        }
    }

    let embedURL = "";  // URL to embed video from the selected server

    // Set the video URL depending on the selected server and media type
    if (type === "anime") {
        // For anime, check for episode information to build proper vidsrc.icu URL
        const activeEpisode = document.querySelector('.episode-item.active');
        let episodeNumber = 1;

        if (activeEpisode) {
            episodeNumber = activeEpisode.dataset.episodeNumber || 1;
        }

        switch (server) {
            case "vidsrc.icu":
                // Use the dedicated anime server format: https://vidsrc.icu/embed/anime/{id}/{episode}/{dub}
                // dub: 0 = sub, 1 = dub
                const dubValue = 0; // Default to sub (0)
                embedURL = `https://vidsrc.icu/embed/anime/${id}/${episodeNumber}/${dubValue}`;
                break;
            case "vidsrc.su":
                // Use SHINOMIYA server for non-anime or fallback
                embedURL = `https://vidsrc.su/embed/anime/${id}`;
                break;
            case "vidlink.pro":
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/anime/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/anime/?mal=${id}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/anime/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/anime/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/anime/${id}`;
                break;
            default:
                // Default to vidsrc.icu for anime content
                const defaultDubValue = 0; // Default to sub (0)
                embedURL = `https://vidsrc.icu/embed/anime/${id}/${episodeNumber}/${defaultDubValue}`;
                break;
        }
    } else {
        // For movies and TV shows, use the existing providers
        switch (server) {
            case "vidlink.pro":
                if (type === "tv") {
                    // For TV shows, default to first episode of first season
                    embedURL = `https://vidlink.pro/tv/${id}/1/1?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                } else {
                    embedURL = `https://vidlink.pro/movie/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                }
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
                break;
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/${type}/${id}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/${type}/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/${type}/${id}`;
                break;
            default:
                // Default to vidlink.pro as a fallback
                if (type === "tv") {
                    embedURL = `https://vidlink.pro/tv/${id}/1/1?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                } else {
                    embedURL = `https://vidlink.pro/movie/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                }
                break;
        }
    }

    // Log the URL for debugging
    console.log(`Loading ${type} from: ${embedURL}`);

    // Load media with sub-to-dub fallback for anime
    loadMediaWithFallback(embedURL, server, type);
}

// Function to play a specific episode
function playEpisode(tvId, seasonNumber, episodeNumber) {
    const server = document.getElementById('server').value;
    const type = media === "anime" ? "anime" : "tv";
    let embedURL = "";

    // Handle anime content differently for vidsrc.icu
    if (type === "anime") {
        const dubValue = 0; // 0 = sub, 1 = dub (default to sub)

        switch (server) {
            case "vidsrc.icu":
                // Use anime-specific URL format for vidsrc.icu
                embedURL = `https://vidsrc.icu/embed/anime/${tvId}/${episodeNumber}/${dubValue}`;
                break;
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/anime/${tvId}`;
                break;
            case "vidlink.pro":
                embedURL = `https://vidlink.pro/anime/${tvId}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/anime/${tvId}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/anime/?mal=${tvId}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/anime/${tvId}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/anime/${tvId}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/anime/${tvId}`;
                break;
            default:
                // Default to vidsrc.icu for anime
                const defaultDubValue = 0; // Default to sub (0)
                embedURL = `https://vidsrc.icu/embed/anime/${tvId}/${episodeNumber}/${defaultDubValue}`;
                break;
        }
    } else {
        // Update the URL for each server to include season and episode parameters for TV shows
        switch (server) {
            case "vidsrc.icu":
                // For non-anime TV shows, fallback to regular TV format
                embedURL = `https://vidsrc.vip/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
                break;
            case "vidlink.pro":
                embedURL = `https://vidlink.pro/tv/${tvId}/${seasonNumber}/${episodeNumber}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/tv/?tmdb=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`;
                break;
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embedtv/${tvId}&s=${seasonNumber}&e=${episodeNumber}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
                break;
            default:
                // Default to vidlink.pro as a fallback
                embedURL = `https://vidlink.pro/tv/${tvId}/${seasonNumber}/${episodeNumber}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
        }
    }

    if (embedURL) {
        // Log the URL for debugging
        console.log(`Loading TV episode from: ${embedURL}`);

        // Use the enhanced fallback mechanism for episodes
        loadMediaWithFallback(embedURL, server, type);

        iframe.style.display = "block";
        moviePoster.style.display = "none";

        // Ensure controls are accessible after changing source
        setTimeout(ensureControlsAccessible, 500);

        // Mark the selected episode as active
        const episodes = document.querySelectorAll('.episode-item');
        episodes.forEach(item => item.classList.remove('active'));

        const currentEpisode = document.querySelector(`.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`);
        if (currentEpisode) {
            currentEpisode.classList.add('active');

            // Scroll to the active episode for better UX
            episodesList.scrollTop = currentEpisode.offsetTop - episodesList.offsetTop - 10;
        }

        // Scroll to top of video for better mobile experience
        if (window.innerWidth <= 740) {
            window.scrollTo({
                top: iframe.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }
}

// Function to display movie details on the page
async function displayMovieDetails() {
    try {
        const movieDetails = await fetchMovieDetails(id);

        var spokenlanguage = movieDetails.spoken_languages ? movieDetails.spoken_languages.map(language => language.english_name) : ['Unknown'];
        language.textContent = spokenlanguage.join(', ');

        var genreNames = movieDetails.genres ? movieDetails.genres.map(genre => genre.name) : ['Unknown'];
        genre.innerText = genreNames.join(', ');

        // For anime, display a special message if we're using a placeholder
        if (media === "anime" && movieDetails.overview === 'Unable to load anime details.') {
            plot.textContent = "This anime is available for viewing. Click the Play button to start.";
        } else if (movieDetails.overview && movieDetails.overview.length > 290) {
            plot.textContent = `${movieDetails.overview.substring(0, 290)}...`;
        } else {
            plot.textContent = movieDetails.overview || 'No description available';
        }

        movieTitle.textContent = movieDetails.name || movieDetails.title;

        if (movieDetails.backdrop_path) {
            if (movieDetails.backdrop_path.startsWith('http')) {
                moviePoster.src = movieDetails.backdrop_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`;
            }
        } else if (movieDetails.poster_path) {
            if (movieDetails.poster_path.startsWith('http')) {
                moviePoster.src = movieDetails.poster_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
            }
        } else {
            moviePoster.src = 'https://via.placeholder.com/500x281?text=No+Image+Available';
        }

        movieYear.textContent = `${movieDetails.release_date || movieDetails.first_air_date || 'Unknown'}`;
        rating.textContent = movieDetails.vote_average || 'N/A';

        // If this is a TV show or anime, setup the seasons and episodes section
        if (media === "tv" || media === "anime") {
            const seasons = await fetchTVSeasons(id);
            if (seasons && seasons.length > 0) {
                createSeasonOptions(seasons);
                // Display the seasons container
                seasonsContainer.style.display = "flex";
            }
        }

        // Call the changeServer function to update the video source
        changeServer();

        // Updating the favorite button text and adding a click event listener to toggle favorites
        if (watchlist.some(favoriteMovie => favoriteMovie.id === movieDetails.id)) {
            watchListBtn.textContent = "Remove From WatchList";
        } else {
            watchListBtn.textContent = "Add To WatchList";
        }

        watchListBtn.addEventListener('click', () => toggleFavorite(movieDetails));

        // Add event listener for the download button
        downloadBtn.addEventListener('click', handleDownload);

    } catch (error) {
        console.error('Error displaying movie details:', error);
        movieTitle.textContent = "Details are not available right now! Please try after some time.";
    }
}

// Function to toggle adding/removing from favorites
function toggleFavorite(movieDetails) {
    const index = watchlist.findIndex(movie => movie.id === movieDetails.id);
    if (index !== -1) {
        watchlist.splice(index, 1);
        watchListBtn.textContent = "Add To WatchList";
    } else {
        watchlist.push(movieDetails);
        watchListBtn.textContent = "Remove From WatchList";
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Enhanced server dropdown UI functionality
function initServerDropdown() {
    // Setup server dropdown toggle
    const serverDropdownHeader = document.querySelector('.server-dropdown-header');
    const serverDropdownContent = document.querySelector('.server-dropdown-content');
    const serverDropdown = document.querySelector('.server-dropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');

    if (!serverDropdownHeader) return; // Exit if elements don't exist

    // Toggle dropdown when clicking the header
    serverDropdownHeader.addEventListener('click', function(event) {
        event.stopPropagation();

        // Toggle visibility
        const isShowing = !serverDropdownContent.classList.contains('show');
        serverDropdownContent.classList.toggle('show');
        serverDropdownHeader.classList.toggle('active');
        dropdownArrow.classList.toggle('up');

        // Add/remove dedicated space class
        if (isShowing) {
            serverDropdown.classList.add('has-open-dropdown');

            // Scroll to ensure the dropdown is visible if needed
            setTimeout(() => {
                const contentRect = serverDropdownContent.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                // If dropdown extends below viewport, scroll it into view
                if (contentRect.bottom > viewportHeight) {
                    window.scrollBy({
                        top: Math.min(contentRect.height, contentRect.bottom - viewportHeight + 20),
                        behavior: 'smooth'
                    });
                }
            }, 50);
        } else {
            serverDropdown.classList.remove('has-open-dropdown');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.server-dropdown')) {
            serverDropdownContent.classList.remove('show');
            serverDropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
            serverDropdown.classList.remove('has-open-dropdown');
        }
    });

    // Handle server selection
    const serverOptions = document.querySelectorAll('.server-option');
    const selectedServerDisplay = document.querySelector('.selected-server');

    serverOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Update the hidden select for compatibility with existing code
            const serverValue = this.getAttribute('data-server');
            document.getElementById('server').value = serverValue;

            // Update selected server display in header
            selectedServerDisplay.innerHTML = this.innerHTML;

            // Remove active class from all options
            serverOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');

            // Close the dropdown
            serverDropdownContent.classList.remove('show');
            serverDropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
            serverDropdown.classList.remove('has-open-dropdown');

            // Call the existing changeServer function
            changeServer();
        });
    });

    // Set initial active server
    const initialServer = document.getElementById('server').value;
    const initialServerOption = document.querySelector(`.server-option[data-server="${initialServer}"]`);
    if (initialServerOption) {
        initialServerOption.classList.add('active');
        selectedServerDisplay.innerHTML = initialServerOption.innerHTML;
    } else {
        // If no server option found, set default based on content type
        const urlParams = new URLSearchParams(window.location.search);
        const pageMedia = urlParams.get('media');

        if (pageMedia === "anime") {
            const animeServerOption = document.querySelector('.server-option[data-server="vidsrc.icu"]');
            if (animeServerOption) {
                animeServerOption.classList.add('active');
                selectedServerDisplay.innerHTML = animeServerOption.innerHTML;
            }
        } else {
            const defaultServerOption = document.querySelector('.server-option[data-server="vidsrc.su"]');
            if (defaultServerOption) {
                defaultServerOption.classList.add('active');
                selectedServerDisplay.innerHTML = defaultServerOption.innerHTML;
            }
        }
    }
}

// Function to handle changes when server selection is made
document.getElementById('server').addEventListener('change', () => {
    changeServer();
});

document.addEventListener('DOMContentLoaded', function() {
    // Ensure our controls are accessible on mobile
    ensureControlsAccessible();

    // Add resize event
    window.addEventListener('resize', function() {
        ensureControlsAccessible();
    });

    // Also call it a bit after page load (helpful for mobile browsers)
    setTimeout(ensureControlsAccessible, 1000);

    // Add ripple effect to download button
    const downloadBtn = document.querySelector('.downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';

            ripple.classList.add('active');

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
});

// Initialize everything when the window loads
window.addEventListener('load', function() {
    // Set a default server if none is selected, prioritizing vidsrc.icu for anime
    const serverSelect = document.getElementById('server');
    if (serverSelect && !serverSelect.value) {
        // Check if this is anime content
        const urlParams = new URLSearchParams(window.location.search);
        const pageMedia = urlParams.get('media');

        if (pageMedia === "anime") {
            serverSelect.value = "vidsrc.icu"; // Default to anime dedicated server
        } else {
            serverSelect.value = "vidsrc.su"; // Default to shinomiya for other content
        }
    }

    // Initialize server dropdown
    initServerDropdown();

    // Display movie details
    displayMovieDetails();
    // Show server change notice banner on load
    const banner = document.getElementById('server-notice-banner');
    const bannerClose = document.getElementById('banner-close-btn');
    if (banner) {
        // Scroll to bottom to ensure banner is visible on mobile
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        banner.style.display = 'flex';
        bannerClose.addEventListener('click', () => {
            banner.style.display = 'none';
        });
        // Auto close banner after 4 seconds
        setTimeout(() => { banner.style.display = 'none'; }, 7000);
    }
});
