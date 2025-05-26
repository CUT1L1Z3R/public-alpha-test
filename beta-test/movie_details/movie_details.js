//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];

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
            case "iframe.pstream.org":
                if (type === "tv") {
                    // For TV shows, default to first episode of first season
                    embedURL = `https://iframe.pstream.org/media/tmdb-tv-${id}-1-1`;
                } else {
                    embedURL = `https://iframe.pstream.org/media/tmdb-movie-${id}`;
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

    // Update the iframe source with the correct video URL and set attributes
    iframe.setAttribute('src', embedURL);
    iframe.setAttribute('playsinline', '');
    iframe.setAttribute('webkit-playsinline', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
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

    // Ensure controls are accessible after changing source
    setTimeout(ensureControlsAccessible, 500);
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
        case "iframe.pstream.org":
            embedURL = `https://iframe.pstream.org/media/tmdb-tv-${tvId}-${seasonNumber}-${episodeNumber}`;
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

        // Update the iframe source with the episode URL and set attributes
        iframe.setAttribute('src', embedURL);
        iframe.setAttribute('playsinline', '');
        iframe.setAttribute('webkit-playsinline', 'true');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
        iframe.setAttribute('allowfullscreen', '');
        // Setup fallback chain on error for episodes
        let epIndex = serverFallbackChain.indexOf(server);
        iframe.onerror = () => {
            const nextEp = epIndex + 1;
            if (nextEp < serverFallbackChain.length) {
                const nextSrv = serverFallbackChain[nextEp];
                document.getElementById('server').value = nextSrv;
                epIndex = nextEp;
                changeServer();
            }
        };

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
