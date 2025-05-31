/*
// FreeFlix Movie Details - Updated for andoks.cc layout
// Selecting the logo element and adding a click event listener to navigate to the homepage
*/
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['iframe.pstream.org', 'vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];
let currentServerIndex = 0;

// Function to show toast notification
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        margin-bottom: 8px;
        font-weight: 500;
        min-width: 250px;
        max-width: 320px;
        text-align: center;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        border-left: 4px solid ${type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : '#be7dc0'};
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Helper function to format runtime
function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Function to handle content download
function handleDownload() {
    let downloadUrl = '';
    let contentType = media === 'movie' ? 'movie' : 'episode';
    showToast(`Preparing your ${contentType} download...`, 'info');
    if (media === 'movie') {
        downloadUrl = `https://dl.vidsrc.vip/movie/${id}`;
    } else if (media === 'tv') {
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/${episodeNumber}`;
        } else if (seasonSelect && seasonSelect.value) {
            const seasonNumber = seasonSelect.value;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/1`;
        } else {
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/1/1`;
        }
    }
    console.log(`Download URL: ${downloadUrl}`);
    if (downloadUrl) {
        const encodedUrl = encodeURIComponent(downloadUrl);
        setTimeout(() => {
            window.location.href = `../download.html?url=${encodedUrl}`;
        }, 800);
    } else {
        showToast("Unable to generate download URL. Please try a different server.", 'error');
    }
}

// Selecting various elements on the page for displaying movie details
const movieTitle = document.getElementById('movieTitle');
const backdropImage = document.getElementById('backdropImage');
const movieYear = document.getElementById('movieYear');
const rating = document.getElementById('rating');
const genre = document.getElementById('genre');
const plot = document.getElementById("plot");
const iframe = document.getElementById("iframe");
const watchListBtn = document.querySelector('.watchlist-btn');
const downloadBtn = document.querySelector('.download-btn');
const playBtn = document.querySelector('.play-btn');
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Season and Episode selectors - updated for new layout
const seasonSelect = document.getElementById('season-select');
const episodesList = document.getElementById('episodesList');
const seasonsCount = document.getElementById('seasonsCount');
const status = document.getElementById('status');

// Movie-specific elements
const runtime = document.getElementById('runtime');
const language = document.getElementById('language');
const movieStatus = document.getElementById('movieStatus');

// Server dropdown elements
const serverDropdown = document.querySelector('.server-dropdown');
const serverDropdownHeader = document.querySelector('.server-dropdown-header');
const serverDropdownContent = document.querySelector('.server-dropdown-content');
const selectedServerName = document.querySelector('.selected-server .server-name');

// Recommendations elements
const recommendationsList = document.getElementById('recommendationsList');

// API key for TMDB API
const api_Key = 'e79515e88dfd7d9f6eeca36e49101ac2';

// Retrieve the TMDb ID and Media from the URL parameter
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const media = params.get('media');

let currentSeason = 1;
let currentEpisode = 1;
let currentServer = 'iframe.pstream.org';
let seasonsData = [];

// Initialize server dropdown functionality
function initializeServerDropdown() {
    serverDropdownHeader?.addEventListener('click', () => {
        serverDropdown?.classList.toggle('open');
    });

    // Handle server selection
    const serverOptions = document.querySelectorAll('.server-option');
    serverOptions.forEach(option => {
        option.addEventListener('click', () => {
            const server = option.dataset.server;
            const serverName = option.querySelector('.server-name').textContent;

            // Update selected server display
            if (selectedServerName) {
                selectedServerName.textContent = serverName;
            }

            // Update server tags in header
            const headerServerTags = document.querySelector('.selected-server');
            const optionServerTags = option.innerHTML;
            if (headerServerTags) {
                headerServerTags.innerHTML = optionServerTags;
            }

            // Change server
            currentServer = server;
            resetServerIndex();
            loadContent();

            // Close dropdown
            serverDropdown?.classList.remove('open');

            showToast(`Switched to ${serverName} server`, 'success');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!serverDropdown?.contains(e.target)) {
            serverDropdown?.classList.remove('open');
        }
    });
}

// Load video content based on current selections
function loadContent() {
    let url = '';

    // Special handling for iframe.pstream.org with proper TMDB format
    if (currentServer === 'iframe.pstream.org') {
        if (media === 'movie') {
            url = `https://iframe.pstream.org/embed/tmdb-movie-${id}?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
        } else if (media === 'tv') {
            url = `https://iframe.pstream.org/embed/tmdb-tv-${id}/${currentSeason}/${currentEpisode}?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
        }
    } else {
        // Default format for other servers
        if (media === 'movie') {
            url = `https://${currentServer}/embed/movie/${id}`;
        } else if (media === 'tv') {
            url = `https://${currentServer}/embed/tv/${id}/${currentSeason}/${currentEpisode}`;
        }
    }

    if (iframe && url) {
        iframe.src = url;
        console.log(`Loading: ${url}`);



        // Set loading timeout for iframe.pstream.org
        let loadingTimeout;
        if (currentServer === 'iframe.pstream.org') {
            loadingTimeout = setTimeout(() => {
                console.warn('iframe.pstream.org loading timeout, trying next server');
                showToast('Server timeout. Trying next server...', 'error');
                tryNextServer();
            }, 10000); // 10 second timeout
        }

        // Add error handling for iframe loading
        iframe.onload = function() {
            console.log('Iframe loaded successfully');
            clearTimeout(loadingTimeout);


        };

        iframe.onerror = function() {
            console.error('Failed to load iframe content');
            clearTimeout(loadingTimeout);
            showToast('Failed to load content. Trying next server...', 'error');
            tryNextServer();
        };
    }
}

// Try next server in fallback chain
function tryNextServer() {
    currentServerIndex++;
    if (currentServerIndex < serverFallbackChain.length) {
        const nextServer = serverFallbackChain[currentServerIndex];
        currentServer = nextServer;

        // Update UI to show current server
        const selectedServerName = document.querySelector('.selected-server .server-name');
        if (selectedServerName) {
            const serverDisplayNames = {
                'iframe.pstream.org': 'SHOUKO',
                'vidsrc.su': 'SHINOMIYA',
                'vidsrc.vip': 'MAFUYU',
                'vidlink.pro': 'MIZUKI'
            };
            selectedServerName.textContent = serverDisplayNames[nextServer] || nextServer;
        }

        showToast(`Switching to ${nextServer}...`, 'info');
        loadContent();
    } else {
        showToast('All servers failed to load content', 'error');
        currentServerIndex = 0; // Reset for next try
    }
}

// Reset server index when manually changing servers
function resetServerIndex() {
    const serverName = currentServer;
    currentServerIndex = serverFallbackChain.indexOf(serverName);
    if (currentServerIndex === -1) currentServerIndex = 0;
}

// Generate episode list in andoks.cc style
function generateEpisodeList(seasonData) {
    if (!episodesList || !seasonData?.episodes) return;

    episodesList.innerHTML = '';

    seasonData.episodes.forEach((episode, index) => {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode-item';
        episodeDiv.dataset.seasonNumber = seasonData.season_number;
        episodeDiv.dataset.episodeNumber = episode.episode_number;

        // Mark first episode as active initially
        if (index === 0) {
            episodeDiv.classList.add('active');
        }

        episodeDiv.innerHTML = `
            <div class="episode-number">${episode.episode_number}</div>
            <img src="https://image.tmdb.org/t/p/w300${episode.still_path || '/default-episode.jpg'}"
                 alt="Episode ${episode.episode_number}"
                 class="episode-thumbnail"
                 onerror="this.src='https://via.placeholder.com/300x169/1a1a1a/ffffff?text=Episode+${episode.episode_number}'">
            <div class="episode-info">
                <div class="episode-title">${episode.name || `Episode ${episode.episode_number}`}</div>
                <div class="episode-description">${episode.overview || 'No description available.'}</div>
            </div>
        `;

        episodeDiv.addEventListener('click', () => {
            // Remove active class from all episodes
            document.querySelectorAll('.episode-item').forEach(ep => ep.classList.remove('active'));

            // Add active class to clicked episode
            episodeDiv.classList.add('active');

            // Update current episode
            currentEpisode = episode.episode_number;

            // Update play button text
            if (playBtn) {
                playBtn.textContent = `▶ Play S${seasonData.season_number}E${episode.episode_number}`;
            }

            // Load the episode
            loadContent();

            showToast(`Now playing: S${seasonData.season_number}E${episode.episode_number}`, 'success');
        });

        episodesList.appendChild(episodeDiv);
    });
}

// Load recommendations in sidebar format
async function loadRecommendations() {
    if (!recommendationsList) return;

    try {
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/recommendations?api_key=${api_Key}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            recommendationsList.innerHTML = '';

            // Show only first 10 recommendations for sidebar
            data.results.slice(0, 10).forEach(item => {
                const recDiv = document.createElement('div');
                recDiv.className = 'recommendation-item';
                recDiv.innerHTML = `
                    <img src="https://image.tmdb.org/t/p/w200${item.poster_path}"
                         alt="${item.title || item.name}"
                         class="recommendation-poster"
                         onerror="this.src='https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Image'">
                    <div class="recommendation-info">
                        <div class="recommendation-title">${item.title || item.name}</div>
                        <div class="recommendation-year">${(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</div>
                        <div class="recommendation-rating">
                            <span class="rating-star">⭐</span>
                            <span class="rating-value">${item.vote_average?.toFixed(1) || 'N/A'}</span>
                        </div>
                    </div>
                `;

                recDiv.addEventListener('click', () => {
                    const mediaType = item.title ? 'movie' : 'tv';
                    window.location.href = `movie_details.html?media=${mediaType}&id=${item.id}`;
                });

                recommendationsList.appendChild(recDiv);
            });
        } else {
            recommendationsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No recommendations available</p>';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        recommendationsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Failed to load recommendations</p>';
    }
}

// Fetch movie/TV show details from TMDB API
async function fetchMediaDetails() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}?api_key=${api_Key}`);
        const data = await response.json();

        // Update basic info
        if (movieTitle) movieTitle.textContent = data.title || data.name;
        if (movieYear) movieYear.textContent = (data.release_date || data.first_air_date)?.split('-')[0] || 'N/A';
        if (rating) rating.textContent = data.vote_average?.toFixed(1) || 'N/A';
        if (genre) genre.textContent = data.genres?.[0]?.name || 'Unknown';
        if (plot) plot.textContent = data.overview || 'No description available.';

        // Update backdrop image
        if (backdropImage && data.backdrop_path) {
            backdropImage.src = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
        }

        // TV Show specific updates
        if (media === 'tv') {
            // Show TV-specific elements
            const tvOnlyElements = document.querySelectorAll('.tv-only');
            const movieOnlyElements = document.querySelectorAll('.movie-only');

            tvOnlyElements.forEach(el => el.style.display = 'flex');
            movieOnlyElements.forEach(el => el.style.display = 'none');

            if (seasonsCount) seasonsCount.textContent = data.number_of_seasons || 'N/A';
            if (status) status.textContent = data.status || 'Unknown';

            // Load season data
            if (data.seasons && data.seasons.length > 0) {
                seasonsData = data.seasons.filter(season => season.season_number > 0);
                await loadSeasonSelector();

                // Load first season episodes by default
                if (seasonsData.length > 0) {
                    await loadSeasonEpisodes(seasonsData[0].season_number);
                }
            }
        } else {
            // Movie specific updates
            const tvOnlyElements = document.querySelectorAll('.tv-only');
            const movieOnlyElements = document.querySelectorAll('.movie-only');

            tvOnlyElements.forEach(el => el.style.display = 'none');
            movieOnlyElements.forEach(el => el.style.display = 'flex');

            // Hide TV-specific elements for movies
            const seasonSelector = document.querySelector('.season-selector');
            if (seasonSelector) seasonSelector.style.display = 'none';

            // Update movie-specific content
            if (runtime) runtime.textContent = formatRuntime(data.runtime);
            if (language) {
                const primaryLanguage = data.spoken_languages?.[0]?.english_name || 'English';
                language.textContent = primaryLanguage;
            }
            if (movieStatus) movieStatus.textContent = data.status || 'Released';

            if (playBtn) playBtn.textContent = '▶ Play Movie';
        }

        // Load recommendations
        await loadRecommendations();

        // Load initial content
        loadContent();

    } catch (error) {
        console.error('Error fetching media details:', error);
        showToast('Failed to load content details', 'error');
    }
}

// Load season selector dropdown
async function loadSeasonSelector() {
    if (!seasonSelect || !seasonsData.length) return;

    seasonSelect.innerHTML = '';

    for (const season of seasonsData) {
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = `Season ${season.season_number} (${season.episode_count} Episodes)`;
        seasonSelect.appendChild(option);
    }

    // Add change event listener
    seasonSelect.addEventListener('change', async () => {
        const selectedSeason = parseInt(seasonSelect.value);
        currentSeason = selectedSeason;
        await loadSeasonEpisodes(selectedSeason);
    });
}

// Load episodes for a specific season
async function loadSeasonEpisodes(seasonNumber) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${api_Key}`);
        const seasonData = await response.json();

        generateEpisodeList(seasonData);

        // Reset to first episode of the season
        currentEpisode = 1;
        if (playBtn) {
            playBtn.textContent = `▶ Play S${seasonNumber}E1`;
        }

    } catch (error) {
        console.error('Error loading season episodes:', error);
        showToast('Failed to load episodes', 'error');
    }
}

// Button event listeners
if (watchListBtn) {
    watchListBtn.addEventListener('click', () => {
        // Watchlist functionality
        const isInWatchlist = watchlist.some(item => item.id === id);
        if (isInWatchlist) {
            showToast('Already in watchlist!', 'info');
        } else {
            watchlist.push({ id, media, title: movieTitle?.textContent || 'Unknown' });
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            showToast('Added to watchlist!', 'success');
        }
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', handleDownload);
}

if (playBtn) {
    playBtn.addEventListener('click', () => {
        // Scroll to video player
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!id || !media) {
        showToast('Invalid content ID or media type', 'error');
        return;
    }

    initializeServerDropdown();
    fetchMediaDetails();
});

// Add some responsive behavior
window.addEventListener('resize', () => {
    // Handle any responsive adjustments if needed
});

console.log('FreeFlix Movie Details - andoks.cc Layout Loaded');

// Mobile-specific functionality
let isMobileCollapsed = false;
const MOBILE_EPISODE_LIMIT = 3; // Show only first 3 episodes on mobile by default

// Mobile navigation functions
function scrollToSection(sectionName) {
    let targetElement;

    switch(sectionName) {
        case 'overview':
            targetElement = document.querySelector('.overview-section');
            break;
        case 'episodes':
            targetElement = document.querySelector('.episodes-container');
            break;
        case 'recommendations':
            targetElement = document.querySelector('.recommendations-sidebar');
            break;
        default:
            return;
    }

    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });

        // Update active pill
        document.querySelectorAll('.nav-pill').forEach(pill => pill.classList.remove('active'));
        event.target.classList.add('active');
    }
}

// Enhanced episode list generation with mobile collapse functionality
function generateEpisodeListMobile(seasonData) {
    if (!episodesList || !seasonData?.episodes) return;

    const episodesListContainer = document.getElementById('episodesListContainer');
    const episodesCountInfo = document.getElementById('episodesCountInfo');
    const episodesToggleBtn = document.getElementById('episodesToggleBtn');
    const episodesNavPill = document.getElementById('episodesNavPill');

    if (!episodesListContainer) return;

    episodesListContainer.innerHTML = '';

    // Show episodes nav pill for TV shows
    if (media === 'tv' && episodesNavPill) {
        episodesNavPill.style.display = 'inline-block';
    }

    // Show episode count info
    if (episodesCountInfo && seasonData.episodes.length > MOBILE_EPISODE_LIMIT) {
        episodesCountInfo.style.display = 'block';
        episodesCountInfo.textContent = `${seasonData.episodes.length} episodes in this season`;
    }

    seasonData.episodes.forEach((episode, index) => {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode-item';
        episodeDiv.dataset.seasonNumber = seasonData.season_number;
        episodeDiv.dataset.episodeNumber = episode.episode_number;

        // Check if episode should be hidden on mobile initially
        const isMobile = window.innerWidth <= 768;
        if (isMobile && index >= MOBILE_EPISODE_LIMIT) {
            episodeDiv.classList.add('hidden-mobile');
        }

        // Mark first episode as active initially
        if (index === 0) {
            episodeDiv.classList.add('active');
        }

        episodeDiv.innerHTML = `
            <div class="episode-number">${episode.episode_number}</div>
            <img src="https://image.tmdb.org/t/p/w300${episode.still_path || '/default-episode.jpg'}"
                 alt="Episode ${episode.episode_number}"
                 class="episode-thumbnail"
                 onerror="this.src='https://via.placeholder.com/300x169/1a1a1a/ffffff?text=Episode+${episode.episode_number}'">
            <div class="episode-info">
                <div class="episode-title">${episode.name || `Episode ${episode.episode_number}`}</div>
                <div class="episode-description">${episode.overview || 'No description available.'}</div>
            </div>
        `;

        episodeDiv.addEventListener('click', () => {
            // Remove active class from all episodes
            document.querySelectorAll('.episode-item').forEach(ep => ep.classList.remove('active'));

            // Add active class to clicked episode
            episodeDiv.classList.add('active');

            // Update current episode
            currentEpisode = episode.episode_number;

            // Update play button text
            if (playBtn) {
                playBtn.textContent = `▶ Play S${seasonData.season_number}E${episode.episode_number}`;
            }

            // Load the episode
            loadContent();

            showToast(`Now playing: S${seasonData.season_number}E${episode.episode_number}`, 'success');
        });

        episodesListContainer.appendChild(episodeDiv);
    });

    // Setup mobile collapse functionality
    setupMobileEpisodeToggle(seasonData.episodes.length);
}

// Setup mobile episode toggle functionality
function setupMobileEpisodeToggle(totalEpisodes) {
    const episodesToggleBtn = document.getElementById('episodesToggleBtn');
    const episodesListContainer = document.getElementById('episodesListContainer');

    if (!episodesToggleBtn || !episodesListContainer) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile && totalEpisodes > MOBILE_EPISODE_LIMIT) {
        episodesToggleBtn.style.display = 'inline-block';
        isMobileCollapsed = true;
        episodesListContainer.classList.add('mobile-collapsed');
        episodesToggleBtn.textContent = `Show All ${totalEpisodes} Episodes`;

        episodesToggleBtn.addEventListener('click', toggleMobileEpisodes);
    } else {
        episodesToggleBtn.style.display = 'none';
        episodesListContainer.classList.remove('mobile-collapsed');
    }
}

// Toggle mobile episodes visibility
function toggleMobileEpisodes() {
    const episodesToggleBtn = document.getElementById('episodesToggleBtn');
    const episodesListContainer = document.getElementById('episodesListContainer');
    const hiddenEpisodes = document.querySelectorAll('.episode-item.hidden-mobile');

    if (!episodesToggleBtn || !episodesListContainer) return;

    if (isMobileCollapsed) {
        // Show all episodes
        episodesListContainer.classList.remove('mobile-collapsed');
        hiddenEpisodes.forEach(episode => episode.style.display = 'flex');
        episodesToggleBtn.textContent = 'Show Less';
        isMobileCollapsed = false;
    } else {
        // Hide episodes beyond limit
        episodesListContainer.classList.add('mobile-collapsed');
        hiddenEpisodes.forEach(episode => episode.style.display = 'none');
        const totalEpisodes = document.querySelectorAll('.episode-item').length;
        episodesToggleBtn.textContent = `Show All ${totalEpisodes} Episodes`;
        isMobileCollapsed = true;

        // Scroll to episodes section
        document.querySelector('.episodes-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Override the original generateEpisodeList function
const originalGenerateEpisodeList = generateEpisodeList;
function generateEpisodeList(seasonData) {
    // Use the mobile-enhanced version
    generateEpisodeListMobile(seasonData);
}

// Handle window resize for mobile responsiveness
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    const episodesToggleBtn = document.getElementById('episodesToggleBtn');
    const episodesListContainer = document.getElementById('episodesListContainer');

    if (isMobile) {
        // Reset mobile collapse state when switching to mobile
        const totalEpisodes = document.querySelectorAll('.episode-item').length;
        if (totalEpisodes > MOBILE_EPISODE_LIMIT) {
            setupMobileEpisodeToggle(totalEpisodes);
        }
    } else {
        // Show all episodes on desktop
        if (episodesToggleBtn) episodesToggleBtn.style.display = 'none';
        if (episodesListContainer) episodesListContainer.classList.remove('mobile-collapsed');
        document.querySelectorAll('.episode-item.hidden-mobile').forEach(episode => {
            episode.style.display = 'flex';
        });
    }
});

// Add smooth scrolling behavior for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Global function to make it accessible from HTML onclick
window.scrollToSection = scrollToSection;

// Search functionality for header search
const headerSearchInput = document.getElementById('header-search');

// TMDB API key for search (use a different key for search as per edit)
const searchApiKey = '84259f99204eeb7d45c7e3d8e36c6123';

// Function to fetch search results from TMDB API
async function fetchSearchResults(query) {
    try {
        // Use TMDB multi-search API to get results for everything including anime
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${searchApiKey}&query=${encodeURIComponent(query)}`);
        const tmdbData = await tmdbResponse.json();

        // Also specifically search for anime with a dedicated request
        const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${searchApiKey}&query=${encodeURIComponent(query)}&with_genres=16&with_keywords=210024`);
        const animeData = await animeResponse.json();

        // Format TMDB multi-search results
        const tmdbResults = tmdbData.results.map(item => ({
            id: item.id,
            title: item.title || item.name,
            year: item.release_date ? new Date(item.release_date).getFullYear() :
                  item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300',
            rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            type: item.media_type === 'movie' ? 'movie' : 'tv'
        }));

        // Format dedicated anime search results
        const animeResults = animeData.results.map(item => ({
            id: item.id,
            title: item.name,
            year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300',
            rating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
            type: 'tv'
        }));

        // Combine results and remove duplicates
        const allResults = [...tmdbResults, ...animeResults];
        const uniqueResults = allResults.filter((item, index, self) =>
            index === self.findIndex(t => t.id === item.id && t.type === item.type)
        );

        return uniqueResults.slice(0, 8); // Limit to 8 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to create search results dropdown
function createSearchDropdown() {
    let dropdown = document.getElementById('search-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'search-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(16, 16, 17, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(141, 22, 201, 0.3);
            border-radius: 15px;
            margin-top: 5px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        `;
        headerSearchInput.parentElement.appendChild(dropdown);
    }
    return dropdown;
}

// Function to display search results
function displaySearchResults(results) {
    const dropdown = createSearchDropdown();
    dropdown.innerHTML = '';

    if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No results found</div>';
        dropdown.style.display = 'block';
        return;
    }

    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        resultItem.innerHTML = `
            <img src="${item.poster}" alt="${item.title}" style="
                width: 40px;
                height: 60px;
                object-fit: cover;
                border-radius: 6px;
                flex-shrink: 0;
            ">
            <div style="flex: 1; min-width: 0;">
                <div style="color: #fff; font-weight: 500; font-size: 14px; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${item.title}
                </div>
                <div style="color: #888; font-size: 12px;">
                    ${item.year} • ${item.type === 'movie' ? 'Movie' : 'TV Show'} • ⭐ ${item.rating}
                </div>
            </div>
        `;

        resultItem.addEventListener('mouseenter', () => {
            resultItem.style.backgroundColor = 'rgba(141, 22, 201, 0.2)';
        });

        resultItem.addEventListener('mouseleave', () => {
            resultItem.style.backgroundColor = 'transparent';
        });

        resultItem.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=${item.type}&id=${item.id}`;
        });

        dropdown.appendChild(resultItem);
    });

    dropdown.style.display = 'block';
}

// Function to handle search input
async function handleHeaderSearch() {
    const query = headerSearchInput.value.trim();

    if (query.length > 2) {
        const results = await fetchSearchResults(query);
        displaySearchResults(results);
    } else {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
}

// Add event listeners for search
if (headerSearchInput) {
    headerSearchInput.addEventListener('input', handleHeaderSearch);

    headerSearchInput.addEventListener('focus', () => {
        if (headerSearchInput.value.trim().length > 2) {
            handleHeaderSearch();
        }
    });

    headerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleHeaderSearch();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!headerSearchInput.parentElement.contains(e.target)) {
            const dropdown = document.getElementById('search-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
}
