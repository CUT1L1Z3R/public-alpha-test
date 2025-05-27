// FreeFlix Movie Details
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['iframe.pstream.org', 'vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];

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

    if (media === 'movie') {
        url = `https://${currentServer}/embed/movie/${id}`;
    } else if (media === 'tv') {
        url = `https://${currentServer}/embed/tv/${id}/${currentSeason}/${currentEpisode}`;
    }

    if (iframe && url) {
        iframe.src = url;
        console.log(`Loading: ${url}`);
    }
}

// Generate episode list in style
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

console.log('FreeFlix Movie Details - Layout Loaded');

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
