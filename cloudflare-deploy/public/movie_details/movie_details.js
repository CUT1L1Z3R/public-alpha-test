//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

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

// Function to fetch detailed information using its TMDb ID
async function fetchMovieDetails(id) {
    // If it's anime type, get data from localStorage instead of API
    if (media === "anime") {
        const animeData = JSON.parse(localStorage.getItem('current_anime'));
        if (animeData && animeData.id.toString() === id) {
            // Store the episode ID if available
            if (animeData.episodeId) {
                localStorage.setItem('current_anime_episode_id', animeData.episodeId);
            }
            return animeData;
        }

        // If no anime data in localStorage, try to fetch from Jikan API
        try {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
            const result = await response.json();
            const anime = result.data;

            // Get best available image URL
            let imageUrl = null;

            // Try different image sources in order of preference
            if (anime.images) {
                if (anime.images.jpg) {
                    if (anime.images.jpg.large_image_url) {
                        imageUrl = anime.images.jpg.large_image_url;
                    } else if (anime.images.jpg.image_url) {
                        imageUrl = anime.images.jpg.image_url;
                    }
                }

                // If we still don't have an image, try webp format
                if (!imageUrl && anime.images.webp) {
                    if (anime.images.webp.large_image_url) {
                        imageUrl = anime.images.webp.large_image_url;
                    } else if (anime.images.webp.image_url) {
                        imageUrl = anime.images.webp.image_url;
                    }
                }

                // If still no specific format, try any available image
                if (!imageUrl) {
                    for (const format in anime.images) {
                        if (anime.images[format] && typeof anime.images[format] === 'object') {
                            for (const size in anime.images[format]) {
                                if (anime.images[format][size] && typeof anime.images[format][size] === 'string') {
                                    imageUrl = anime.images[format][size];
                                    break;
                                }
                            }
                            if (imageUrl) break;
                        }
                    }
                }
            }

            // For direct image in case of API structure change
            if (!imageUrl && anime.image_url) {
                imageUrl = anime.image_url;
            }

            if (!imageUrl) {
                imageUrl = 'https://via.placeholder.com/500x750?text=No+Image+Available';
            }

            // Format data to match our expected format
            const formattedAnime = {
                id: anime.mal_id,
                title: anime.title,
                name: anime.title,
                overview: anime.synopsis,
                poster_path: imageUrl,
                backdrop_path: imageUrl,
                vote_average: anime.score || 0,
                release_date: anime.aired?.from ? anime.aired.from.substring(0, 10) : '',
                first_air_date: anime.aired?.from ? anime.aired.from.substring(0, 10) : '',
                genres: anime.genres.map(g => ({ name: g.name })),
                spoken_languages: [{ english_name: 'Japanese' }],
                media_type: 'anime'
            };

            // Extract episode ID from URL parameters if available
            const params = new URLSearchParams(window.location.search);
            const episodeId = params.get('episodeId');
            if (episodeId) {
                formattedAnime.episodeId = episodeId;
                localStorage.setItem('current_anime_episode_id', episodeId);
            }

            return formattedAnime;

        } catch (error) {
            console.error('Error fetching anime details from Jikan:', error);
            return {
                id: id,
                title: 'Anime Details',
                name: 'Anime Details',
                overview: 'Unable to load anime details.',
                vote_average: 0,
                genres: [],
                spoken_languages: []
            };
        }
    }

    // For regular movies and TV shows, use TMDB API
    const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}?api_key=${api_Key}`);
    const data = await response.json();
    return data;
}

// Function to fetch video details (trailers) for a movie or TV show
async function fetchVideoDetails(id) {
    const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/videos?api_key=${api_Key}`);
    const data = await response.json();
    return data.results;
}

// Function to fetch TV show seasons
async function fetchTVSeasons(id) {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${api_Key}`);
    const data = await response.json();
    return data.seasons;
}

// Function to fetch episodes for a specific season
async function fetchSeasonEpisodes(tvId, seasonNumber) {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${api_Key}`);
    const data = await response.json();
    return data.episodes;
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
        thumbnail.src = episode.still_path
            ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
            : 'https://via.placeholder.com/300x170?text=No+Image';
        thumbnail.alt = `${episode.name} Thumbnail`;

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

// Function to fetch anime episode streaming sources
async function fetchAnimeStreamingSources(episodeId, server = "vidstreaming", category = "sub") {
    try {
        // Try to use the Anime Rouge API
        console.log(`Fetching sources for: ${episodeId} with server: ${server}, category: ${category}`);

        // Make sure episodeId is in the correct format (anime-name-12345?ep=67890)
        if (!episodeId.includes('?ep=')) {
            console.warn("EpisodeId doesn't have the correct format:", episodeId);
            // If it's just a number, we can't fix it properly
            if (!isNaN(episodeId)) {
                console.error("Cannot fetch with just an episode number, need full anime ID");
                throw new Error("Invalid episode ID format");
            }
            // Default to episode 1
            episodeId = `${episodeId}?ep=1`;
        }

        // Build the correct API URL
        const apiUrl = `https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}`;
        console.log(`Trying API endpoint: ${apiUrl}`);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API response error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API response:", data);

        // Check if we got valid sources
        if (data && data.sources && data.sources.length > 0) {
            // Format the sources to match our expected format
            const formattedSources = data.sources.map(source => ({
                url: source.url,
                isM3U8: source.isM3U8 || source.url.includes('.m3u8'),
                quality: source.quality || "auto"
            }));

            console.log("Using API sources:", formattedSources);
            return formattedSources;
        }

        // Fallback to hardcoded sources if API doesn't return valid sources
        console.warn("API didn't return valid sources, falling back to hardcoded sources");

        // Extract anime name from episodeId if possible
        let animeName = "unknown";
        if (episodeId && episodeId.includes('-')) {
            // Try to extract anime name from episodeId format (e.g. "tokyo-ghoul-114?ep=1778")
            animeName = episodeId.split('?')[0].toLowerCase();
        }

        // Hardcoded direct sources
        const directSources = {
            "tokyo-ghoul-114": [
                {
                    url: "https://vvf5.d21-anime77.com/7d2437233f05a9cf027ad847aa1d43ee9a776be088a06749d32370ca/episodedata/m3u8/t/tokyo-ghoul-episode-1-1648231517.m3u8",
                    isM3U8: true,
                    quality: "auto"
                }
            ],
            "shingeki-no-kyojin-1": [
                {
                    url: "https://lol.aheg-anime.com/90d72e1f7031cc5467854fec01755477fef3951ebb3a8fad02f7a36b/episodedata/m3u8/t/shingeki-no-kyojin-season-1-episode-1-1648239345.m3u8",
                    isM3U8: true,
                    quality: "auto"
                }
            ],
            "one-punch-man": [
                {
                    url: "https://api-anime.watch/v3/streaming/one-punch-man/1/720p.mp4",
                    isM3U8: false,
                    quality: "720p"
                }
            ],
            "my-hero-academia": [
                {
                    url: "https://api-anime.watch/v3/streaming/my-hero-academia/1/720p.mp4",
                    isM3U8: false,
                    quality: "720p"
                }
            ],
            // Fallback for unknown anime
            "default": [
                {
                    url: "https://vvf5.d21-anime77.com/7d2437233f05a9cf027ad847aa1d43ee9a776be088a06749d32370ca/episodedata/m3u8/t/tokyo-ghoul-episode-1-1648231517.m3u8",
                    isM3U8: true,
                    quality: "auto"
                }
            ]
        };

        // Try to match the requested anime with our hardcoded sources
        let matchedSources = null;

        // Check for exact match first
        for (const key in directSources) {
            if (animeName.includes(key)) {
                console.log(`Found exact match for ${animeName} with key ${key}`);
                matchedSources = directSources[key];
                break;
            }
        }

        // If no exact match, use default sources
        if (!matchedSources) {
            console.log(`No exact match found for ${animeName}, using default sources`);
            matchedSources = directSources.default;
        }

        console.log("Using hardcoded sources:", matchedSources);
        return matchedSources;
    } catch (error) {
        console.error('Error in fetchAnimeStreamingSources:', error);

        // If we completely fail, return a fallback source
        return [{
            url: "https://vvf5.d21-anime77.com/7d2437233f05a9cf027ad847aa1d43ee9a776be088a06749d32370ca/episodedata/m3u8/t/tokyo-ghoul-episode-1-1648231517.m3u8",
            isM3U8: true,
            quality: "auto"
        }];
    }
}

// Function to create a direct video player instead of using an iframe
function createVideoPlayer(videoUrl, isHLS) {
    console.log(`Creating video player for URL: ${videoUrl}, isHLS: ${isHLS}`);

    // Clear the iframe content
    iframe.src = "";
    iframe.style.display = "none";

    // Remove any previous video player
    const videoContainer = document.querySelector('.movie-poster');
    const existingVideo = videoContainer.querySelector('video');
    if (existingVideo) {
        videoContainer.removeChild(existingVideo);
    }

    // Remove any error message
    const errorMessage = videoContainer.querySelector('.hls-error-message');
    if (errorMessage) {
        videoContainer.removeChild(errorMessage);
    }

    // Display loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'hls-error-message';
    loadingMessage.textContent = 'Loading video...';
    loadingMessage.style.color = 'white';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.textAlign = 'center';
    loadingMessage.style.background = 'rgba(0, 0, 0, 0.7)';
    videoContainer.appendChild(loadingMessage);

    // Create a video element
    const videoElement = document.createElement('video');
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.display = 'none'; // Hide until loaded

    // Error handler for video element
    videoElement.addEventListener('error', (e) => {
        console.error('Video element error:', videoElement.error);

        // Remove loading message
        if (loadingMessage.parentNode) {
            videoContainer.removeChild(loadingMessage);
        }

        // Display detailed error
        const errorMsg = document.createElement('div');
        errorMsg.className = 'hls-error-message';
        errorMsg.textContent = `Error playing video: ${videoElement.error?.message || 'Failed to load because no supported source was found.'}`;
        errorMsg.style.color = 'white';
        errorMsg.style.padding = '20px';
        errorMsg.style.textAlign = 'center';
        errorMsg.style.background = 'rgba(255, 0, 0, 0.7)';
        videoContainer.appendChild(errorMsg);
    });

    // Add video element to container
    videoContainer.appendChild(videoElement);

    // Hide the movie poster when the video is playing
    moviePoster.style.display = "none";

    // If it's an HLS stream, we need to use HLS.js
    if (isHLS) {
        // Check if HLS.js is already available (loaded in the HTML)
        if (typeof Hls !== 'undefined') {
            console.log('HLS.js already loaded, initializing');
            initializeHLS(videoElement, videoUrl, loadingMessage);
        } else {
            console.log('Loading HLS.js script dynamically');
            // Add HLS.js script if not already present
            const hlsScript = document.createElement('script');
            hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            document.head.appendChild(hlsScript);

            // Wait for script to load before initializing HLS
            hlsScript.onload = () => {
                console.log('HLS.js loaded successfully');
                initializeHLS(videoElement, videoUrl, loadingMessage);
            };

            hlsScript.onerror = () => {
                console.error('Failed to load HLS.js');
                if (loadingMessage.parentNode) {
                    videoContainer.removeChild(loadingMessage);
                }
                const errorMsg = document.createElement('div');
                errorMsg.className = 'hls-error-message';
                errorMsg.textContent = 'Failed to load video player library (HLS.js)';
                errorMsg.style.color = 'white';
                errorMsg.style.padding = '20px';
                errorMsg.style.textAlign = 'center';
                errorMsg.style.background = 'rgba(255, 0, 0, 0.7)';
                videoContainer.appendChild(errorMsg);
            };
        }
    } else {
        // If it's a direct video URL, just set the source
        console.log('Setting up direct MP4 source');
        const sourceElement = document.createElement('source');
        sourceElement.src = videoUrl;
        sourceElement.type = 'video/mp4';
        videoElement.appendChild(sourceElement);

        // Listen for when metadata is loaded
        videoElement.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            // Remove loading message
            if (loadingMessage.parentNode) {
                videoContainer.removeChild(loadingMessage);
            }
            videoElement.style.display = 'block';
        });

        videoElement.load();
    }
}

// Function to initialize HLS.js for m3u8 streams
function initializeHLS(videoElement, videoUrl, loadingMessage) {
    console.log(`Initializing HLS with URL: ${videoUrl}`);

    const videoContainer = document.querySelector('.movie-poster');

    if (window.Hls && window.Hls.isSupported()) {
        try {
            const hls = new window.Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                xhrSetup: function(xhr) {
                    xhr.withCredentials = false; // Disable passing cookies for cross-origin requests
                }
            });

            // Set up error handler
            hls.on(window.Hls.Events.ERROR, function(event, data) {
                console.error('HLS.js error:', event, data);

                // Handle fatal errors
                if (data.fatal) {
                    switch(data.type) {
                        case window.Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('HLS network error:', data.details);
                            // Show error message
                            if (loadingMessage.parentNode) {
                                videoContainer.removeChild(loadingMessage);
                            }
                            const networkError = document.createElement('div');
                            networkError.className = 'hls-error-message';
                            networkError.textContent = `Network error: ${data.details}. This may be due to CORS restrictions.`;
                            networkError.style.color = 'white';
                            networkError.style.padding = '20px';
                            networkError.style.textAlign = 'center';
                            networkError.style.background = 'rgba(255, 0, 0, 0.7)';
                            videoContainer.appendChild(networkError);

                            // Try to recover
                            hls.startLoad();
                            break;
                        case window.Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('HLS media error, attempting to recover:', data.details);
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('HLS fatal error:', data.details);
                            if (loadingMessage.parentNode) {
                                videoContainer.removeChild(loadingMessage);
                            }
                            const fatalError = document.createElement('div');
                            fatalError.className = 'hls-error-message';
                            fatalError.textContent = `Fatal error: ${data.details}. Please try a different server or video source.`;
                            fatalError.style.color = 'white';
                            fatalError.style.padding = '20px';
                            fatalError.style.textAlign = 'center';
                            fatalError.style.background = 'rgba(255, 0, 0, 0.7)';
                            videoContainer.appendChild(fatalError);
                            hls.destroy();
                            break;
                    }
                }
            });

            // Set up load handler
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed, starting playback');
                // Remove loading message
                if (loadingMessage.parentNode) {
                    videoContainer.removeChild(loadingMessage);
                }
                videoElement.style.display = 'block';
                videoElement.play().catch(err => {
                    console.error('Error starting playback:', err);
                });
            });

            // Load the source and attach to video element
            console.log('Loading HLS source:', videoUrl);
            hls.loadSource(videoUrl);
            hls.attachMedia(videoElement);
        } catch (error) {
            console.error('Error initializing HLS.js:', error);
            // Show error message
            if (loadingMessage.parentNode) {
                videoContainer.removeChild(loadingMessage);
            }
            const hlsError = document.createElement('div');
            hlsError.className = 'hls-error-message';
            hlsError.textContent = `Error initializing video player: ${error.message}`;
            hlsError.style.color = 'white';
            hlsError.style.padding = '20px';
            hlsError.style.textAlign = 'center';
            hlsError.style.background = 'rgba(255, 0, 0, 0.7)';
            videoContainer.appendChild(hlsError);
        }
    }
    // For browsers that natively support HLS (like Safari)
    else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS support');
        videoElement.src = videoUrl;
        videoElement.addEventListener('loadedmetadata', () => {
            console.log('Native HLS video metadata loaded');
            // Remove loading message
            if (loadingMessage.parentNode) {
                videoContainer.removeChild(loadingMessage);
            }
            videoElement.style.display = 'block';
            videoElement.play().catch(err => {
                console.error('Error starting native HLS playback:', err);
            });
        });

        // Handle errors
        videoElement.addEventListener('error', () => {
            console.error('Native HLS error:', videoElement.error);
            if (loadingMessage.parentNode) {
                videoContainer.removeChild(loadingMessage);
            }
            const nativeError = document.createElement('div');
            nativeError.className = 'hls-error-message';
            nativeError.textContent = `Error playing video: ${videoElement.error?.message || 'Unknown error with native HLS'}`;
            nativeError.style.color = 'white';
            nativeError.style.padding = '20px';
            nativeError.style.textAlign = 'center';
            nativeError.style.background = 'rgba(255, 0, 0, 0.7)';
            videoContainer.appendChild(nativeError);
        });
    } else {
        console.error('HLS is not supported in this browser');
        // Show error message
        if (loadingMessage.parentNode) {
            videoContainer.removeChild(loadingMessage);
        }

        // Fallback message
        const errorMessage = document.createElement('div');
        errorMessage.textContent = 'Your browser does not support HLS playback. Please try a different browser or server.';
        errorMessage.className = 'hls-error-message';
        errorMessage.style.color = 'white';
        errorMessage.style.padding = '20px';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.background = 'rgba(255, 0, 0, 0.7)';
        videoContainer.appendChild(errorMessage);
    }
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
        try {
            // Get episodeId from localStorage or URL parameters
            let episodeId = localStorage.getItem('current_anime_episode_id');

            // If no episodeId in localStorage, check URL parameters
            if (!episodeId) {
                const params = new URLSearchParams(window.location.search);
                episodeId = params.get('episodeId');

                if (episodeId) {
                    localStorage.setItem('current_anime_episode_id', episodeId);
                }
            }

            // If we still don't have an episodeId, try to use a typical format based on anime ID
            if (!episodeId) {
                // Default to anime ID plus first episode
                // This is a fallback and might not work for all animes
                episodeId = `${id}?ep=1`;
                console.warn("Using fallback episodeId, may not work correctly:", episodeId);
            }

            // Try to fix episodeId format if needed
            // The format should be: anime-name-12345?ep=67890
            if (!episodeId.includes('?ep=')) {
                console.warn("EpisodeId doesn't have the correct format, trying to fix:", episodeId);
                // If it's just a number, assume it's the episode number for current anime
                if (!isNaN(episodeId)) {
                    episodeId = `${id}?ep=${episodeId}`;
                } else {
                    // Default to first episode
                    episodeId = `${id}?ep=1`;
                }
            }

            // Map your server names to API server names
            // First log the server selection for debugging
            console.log(`Selected server: ${server} for ${media} type with episodeId: ${episodeId}`);

            // Consistently map server names to API server names
            let apiServer;
            switch(server) {
                case "vidlink.pro":
                    apiServer = "vidstreaming";
                    break;
                case "vidsrc.cc":
                    apiServer = "streamsb";
                    break;
                case "player.videasy.net":
                    apiServer = "vidcdn";
                    break;
                case "vidstreaming":
                case "streamsb":
                case "vidcdn":
                    apiServer = server;
                    break;
                default:
                    apiServer = "vidstreaming"; // Default to vidstreaming
                    break;
            }

            console.log(`Mapped server ${server} to API server: ${apiServer}`);

            console.log(`Using episodeId: ${episodeId} with server: ${apiServer}`);
            const sources = await fetchAnimeStreamingSources(episodeId, apiServer, "sub");

            if (sources && sources.length > 0) {
                // If sources are available from the API, use the first source
                const source = sources[0];

                // Check if it's an m3u8 source (HLS) or direct MP4
                if (source.isM3U8 || source.url.includes('.m3u8')) {
                    // Use a player that supports m3u8 (HLS) or set up HLS.js
                    createVideoPlayer(source.url, true);
                    return;
                } else {
                    // Direct video URL
                    createVideoPlayer(source.url, false);
                    return;
                }
            } else {
                console.warn("No streaming sources found from API");
            }

            // If API fetch fails or no sources found, fall back to existing embed options
            throw new Error("No streaming sources available, falling back to embeds");

        } catch (error) {
            console.error("Error using anime API:", error);

            // Fall back to the existing embed options if API fails
            switch (server) {
                case "vidlink.pro":
                    embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                    break;
                case "vidsrc.cc":
                    embedURL = `https://vidsrc.cc/v2/embed/anime/${id}`;
                    break;
                case "vidsrc.me":
                    embedURL = `https://vidsrc.net/embed/anime/?mal=${id}`;
                    break;
                case "player.videasy.net":
                    embedURL = `https://player.videasy.net/anime/${id}`;
                    break;
                case "2embed":
                    embedURL = `https://www.2embed.cc/embed/anime/${id}`;
                    break;
                case "movieapi.club":
                    embedURL = `https://moviesapi.club/anime/${id}`;
                    break;
                default:
                    // Fallback to a generic anime provider
                    embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                    break;
            }

            // Display a user-friendly error message
            const videoContainer = document.querySelector('.movie-poster');
            const errorMessage = document.createElement('div');
            errorMessage.className = 'hls-error-message';
            errorMessage.textContent = `Could not load direct video stream. Falling back to embedded player. Error: ${error.message}`;
            errorMessage.style.position = 'absolute';
            errorMessage.style.top = '0';
            errorMessage.style.left = '0';
            errorMessage.style.padding = '10px';
            errorMessage.style.background = 'rgba(255, 0, 0, 0.7)';
            errorMessage.style.zIndex = '100';
            errorMessage.style.width = '100%';

            // Remove after 5 seconds
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 5000);

            videoContainer.appendChild(errorMessage);
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
            case "player.videasy.net":
                embedURL = `https://player.videasy.net/${type}/${id}`;
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

    // Update the iframe source with the correct video URL
    iframe.src = embedURL;

    // Ensure iframe is visible and sized correctly
    iframe.style.display = "block";  // Show the iframe

    // Hide the movie poster when the video is playing
    moviePoster.style.display = "none";  // Hide the movie poster image

    // Remove any custom video player if present
    const videoContainer = document.querySelector('.movie-poster');
    const existingVideo = videoContainer.querySelector('video');
    if (existingVideo) {
        videoContainer.removeChild(existingVideo);
    }
    // Remove any error message
    const errorMessage = videoContainer.querySelector('.hls-error-message');
    if (errorMessage) {
        videoContainer.removeChild(errorMessage);
    }
}

// Function to play a specific episode
function playEpisode(tvId, seasonNumber, episodeNumber) {
    const server = document.getElementById('server').value;
    let embedURL = "";

    // Update the URL for each server to include season and episode parameters
    switch (server) {
        case "player.videasy.net":
            embedURL = `https://player.videasy.net/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
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

    if (embedURL) {
        // Log the URL for debugging
        console.log(`Loading TV episode from: ${embedURL}`);

        // Update the iframe source with the episode URL
        iframe.src = embedURL;
        iframe.style.display = "block";
        moviePoster.style.display = "none";

        // Remove any custom video player if present
        const videoContainer = document.querySelector('.movie-poster');
        const existingVideo = videoContainer.querySelector('video');
        if (existingVideo) {
            videoContainer.removeChild(existingVideo);
        }
        // Remove any error message
        const errorMessage = videoContainer.querySelector('.hls-error-message');
        if (errorMessage) {
            videoContainer.removeChild(errorMessage);
        }

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

        // If this is a TV show, setup the seasons and episodes section
        if (media === "tv") {
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
    const dropdownArrow = document.querySelector('.dropdown-arrow');

    if (!serverDropdownHeader) return; // Exit if elements don't exist

    // Toggle dropdown when clicking the header
    serverDropdownHeader.addEventListener('click', function(event) {
        event.stopPropagation();
        serverDropdownContent.classList.toggle('show');
        serverDropdownHeader.classList.toggle('active');
        dropdownArrow.classList.toggle('up');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.server-dropdown')) {
            serverDropdownContent.classList.remove('show');
            serverDropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
        }
    });

    // Toggle visibility of anime-specific servers based on media type
    const animeServers = document.querySelectorAll('.anime-server');
    const regularServers = document.querySelectorAll('.server-option:not(.anime-server)');

    // Show/hide appropriate server options based on media type
    if (media === "anime") {
        // Show anime servers, hide regular servers
        animeServers.forEach(server => server.style.display = "flex");
        regularServers.forEach(server => server.style.display = "none");

        // Set default anime server if none selected
        const serverSelect = document.getElementById('server');
        if (serverSelect) {
            serverSelect.value = "vidstreaming"; // Use the default anime API server
        }
    } else {
        // Show regular servers, hide anime servers
        animeServers.forEach(server => server.style.display = "none");
        regularServers.forEach(server => server.style.display = "flex");
    }

    // Handle server selection
    const serverOptions = document.querySelectorAll('.server-option');
    const selectedServerDisplay = document.querySelector('.selected-server');

    serverOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Skip if this option is not visible (wrong media type)
            if (this.style.display === "none") return;

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

            // Call the existing changeServer function
            changeServer();
        });
    });

    // Set initial active server based on media type
    const initialServer = document.getElementById('server').value;
    let initialServerOption;

    if (media === "anime") {
        // For anime, find the anime server
        initialServerOption = document.querySelector(`.anime-server[data-server="${initialServer}"]`) ||
                              document.querySelector('.anime-server');  // Default to first anime server
    } else {
        // For movies/TV shows, find the regular server
        initialServerOption = document.querySelector(`.server-option:not(.anime-server)[data-server="${initialServer}"]`) ||
                              document.querySelector('.server-option:not(.anime-server)');  // Default to first regular server
    }

    if (initialServerOption) {
        initialServerOption.classList.add('active');
        selectedServerDisplay.innerHTML = initialServerOption.innerHTML;
        // Also update the hidden select value
        document.getElementById('server').value = initialServerOption.getAttribute('data-server');
    }
}

// Function to handle changes when server selection is made
document.getElementById('server').addEventListener('change', () => {
    changeServer();
});

// Add window resize listener to ensure responsive video size
window.addEventListener('resize', () => {
    // Only update if iframe is visible
    if (iframe.style.display === "block") {
        changeServer();
    }
});

// Initialize everything when the window loads
window.addEventListener('load', function() {
    console.log(`Initializing with media type: ${media}`);

    // Set a default server if none is selected
    const serverSelect = document.getElementById('server');
    if (serverSelect && !serverSelect.value) {
        if (media === "anime") {
            serverSelect.value = "vidstreaming";  // Default anime server
            console.log("Set default anime server: vidstreaming");
        } else {
            serverSelect.value = "vidlink.pro";   // Default movie/TV server
            console.log("Set default movie/TV server: vidlink.pro");
        }
    } else {
        console.log(`Current server value: ${serverSelect ? serverSelect.value : 'server select not found'}`);
    }

    // Initialize server dropdown
    initServerDropdown();

    // Display movie details
    displayMovieDetails();

    // Add a direct console message for debugging
    setTimeout(() => {
        console.log("------------ DEBUG INFO ------------");
        console.log(`Media Type: ${media}`);
        console.log(`ID: ${id}`);
        console.log(`Selected Server: ${document.getElementById('server').value}`);
        console.log(`HLS.js Available: ${typeof Hls !== 'undefined'}`);
        console.log("-----------------------------------");
    }, 2000);
});
