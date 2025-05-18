/**
 * Mobile viewport and fullscreen optimizations
 */
// Add mobile viewport optimization
function setOptimizedViewport() {
    // Check if we're on a mobile device
    if (window.innerWidth <= 768) {
        // Find existing viewport meta tag
        let viewportMeta = document.querySelector('meta[name="viewport"]');

        // Update or create viewport meta tag with settings that ensure video controls are visible
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
        } else {
            viewportMeta = document.createElement('meta');
            viewportMeta.setAttribute('name', 'viewport');
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
            document.head.appendChild(viewportMeta);
        }

        // Add additional mobile optimizations
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.overflowX = 'hidden';
    }
}

// Ensure iframe is properly configured for fullscreen
function optimizeIframeForFullscreen() {
    const iframeElement = document.getElementById('iframe');
    if (iframeElement) {
        // Ensure all fullscreen attributes are properly set
        iframeElement.setAttribute('allowfullscreen', 'true');
        iframeElement.setAttribute('webkitallowfullscreen', 'true');
        iframeElement.setAttribute('mozallowfullscreen', 'true');
        iframeElement.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');

        // For iOS Safari specific fixes
        iframeElement.setAttribute('playsinline', 'true');
    }
}

// Function to ensure iframe containers are properly sized for mobile video controls
function adjustPlayerForMobile() {
    // Only apply for mobile devices
    if (window.innerWidth <= 768) {
        const iframe = document.getElementById('iframe');
        let iframeContainer = document.getElementById('iframe-container');

        if (iframe && !iframeContainer) {
            // If we don't have a container yet (compatibility with existing code)
            // Create a container element
            const container = document.createElement('div');
            container.id = 'iframe-container';

            // Move the iframe inside the container
            const parent = iframe.parentNode;
            parent.insertBefore(container, iframe);
            container.appendChild(iframe);

            // Add a spacer for controls
            const spacer = document.createElement('div');
            spacer.className = 'controls-spacer';
            container.appendChild(spacer);

            iframeContainer = container;
        }

        // Adjust iframe height to ensure controls are visible
        if (iframe) {
            // Make sure iframe is tall enough
            const minHeight = Math.max(250, window.innerWidth * 0.5625 + 45); // 16:9 + controls
            iframe.style.minHeight = `${minHeight}px`;

            // Ensure our container has the correct layout
            if (iframeContainer) {
                iframeContainer.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
                iframeContainer.style.height = '0';
                iframeContainer.style.position = 'relative';
                iframeContainer.style.marginBottom = '50px';
                iframeContainer.style.overflow = 'visible';

                // Position iframe absolutely within container
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
            }
        }
    }
}

// Mobile video player fullscreen fix
function fixMobileVideoControls() {
    // Check if we're on mobile
    if (window.innerWidth <= 560) {
        const videoIframe = document.getElementById('iframe');
        if (videoIframe) {
            // Direct style overrides to ensure controls are visible
            videoIframe.style.minHeight = '300px';
            videoIframe.style.marginBottom = '60px';
            videoIframe.style.position = 'relative';
            videoIframe.style.zIndex = '5';

            // Special handling for iOS
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                // iOS needs extra space
                videoIframe.style.minHeight = '320px';
                videoIframe.style.marginBottom = '70px';

                // This forces iOS to render the controls correctly
                document.body.style.paddingBottom = '70px';

                // Try to fix the bottom bar overlapping controls
                const poster = document.querySelector('.movie-poster');
                if (poster) {
                    poster.style.marginBottom = '80px';
                }

                // Create a fix for the fullscreen button
                let fullscreenFix = document.createElement('div');
                fullscreenFix.style.height = '60px';
                fullscreenFix.style.width = '100%';
                fullscreenFix.style.position = 'relative';
                fullscreenFix.style.clear = 'both';
                fullscreenFix.style.display = 'block';
                fullscreenFix.style.marginTop = '-40px';
                fullscreenFix.style.pointerEvents = 'none';

                // Add it after the iframe
                if (!videoIframe.nextSibling || videoIframe.nextSibling !== fullscreenFix) {
                    videoIframe.parentNode.insertBefore(fullscreenFix, videoIframe.nextSibling);
                }
            }
        }
    }
}

// Run optimizations when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setOptimizedViewport();
    optimizeIframeForFullscreen();
    adjustPlayerForMobile();

    // Add our new mobile fix
    fixMobileVideoControls();

    // Add resize listener to handle orientation changes
    window.addEventListener('resize', function() {
        setOptimizedViewport();
        adjustPlayerForMobile();
        fixMobileVideoControls();
    });

    // Delayed application for mobile fixes
    setTimeout(fixMobileVideoControls, 1000);
});

//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];

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
    // For all media types including anime, use TMDB API
    const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}?api_key=${api_Key}`);
    const data = await response.json();

    // For anime check if we have additional genre info to include
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

// Add to the loadMedia function to better handle mobile video
function loadMedia(embedURL, server) {
    // Set the video URL
    iframe.setAttribute('src', embedURL);
    iframe.setAttribute('playsinline', '');
    iframe.setAttribute('webkit-playsinline', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('webkitallowfullscreen', 'true');
    iframe.setAttribute('mozallowfullscreen', 'true');
    // Setup fallback chain on error
    let currentIndex = serverFallbackChain.indexOf(server);
    iframe.onerror = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < serverFallbackChain.length) {
            const nextServer = serverFallbackChain[nextIndex];
            document.getElementById('server').value = nextServer;
            currentIndex = nextIndex;
            changeServer();
        }
    };
    // Ensure iframe is visible and sized correctly
    iframe.style.display = "block";  // Show the iframe

    // Hide the movie poster when the video is playing
    moviePoster.style.display = "none";  // Hide the movie poster image

    // Ensure fullscreen attributes are set
    optimizeIframeForFullscreen();

    // Apply fixes for mobile video controls
    fixMobileVideoControls();

    // Delayed reapplication of fixes for when video starts playing
    setTimeout(fixMobileVideoControls, 500);
    setTimeout(fixMobileVideoControls, 1500);
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
        // For anime, we'll use Gogo-anime, 9anime or other anime-specific providers
        // This is a placeholder implementation - these URLs are examples and may not work
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
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/anime/${id}`;
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
                // Fallback to a generic anime provider
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
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

    // Use the new loadMedia function for loading and adjusting
    loadMedia(embedURL, server);
}

// Function to play a specific episode
function playEpisode(tvId, seasonNumber, episodeNumber) {
    const server = document.getElementById('server').value;
    let embedURL = "";

    // Update the URL for each server to include season and episode parameters
    switch (server) {
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

    if (embedURL) {
        // Log the URL for debugging
        console.log(`Loading TV episode from: ${embedURL}`);

        // Use the new loadMedia function for loading and adjusting
        loadMedia(embedURL, server);

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
    }
}

// Function to handle changes when server selection is made
document.getElementById('server').addEventListener('change', () => {
    changeServer();
});

// Initialize everything when the window loads
window.addEventListener('load', function() {
    // Set a default server if none is selected
    const serverSelect = document.getElementById('server');
    if (serverSelect && !serverSelect.value) {
        serverSelect.value = "vidlink.pro";
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
