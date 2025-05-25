/**
 * Anime Watch Page JavaScript - Rive Style Multi-Server Player
 * Integrates with FreeFlix and provides RiveStream-inspired functionality
 */

// Server providers inspired by RiveStream
const VIDEO_PROVIDERS = [
    { name: 'FLOWCAST', status: 'fetching', quality: 'HD', featured: true },
    { name: 'SHADOW', status: 'available', quality: 'HD' },
    { name: 'ASIACLOUD', status: 'available', quality: 'HD' },
    { name: 'HINDICAST', status: 'available', quality: 'HD' },
    { name: 'ANIME', status: 'available', quality: 'HD' },
    { name: 'ANIMEZ', status: 'available', quality: 'HD' },
    { name: 'GUARD', status: 'available', quality: 'HD' },
    { name: 'CURVE', status: 'available', quality: 'HD' },
    { name: 'HQ', status: 'available', quality: 'HD' },
    { name: 'NINJA', status: 'available', quality: 'HD' },
    { name: 'ALPHA', status: 'available', quality: 'HD' },
    { name: 'KAZE', status: 'available', quality: 'HD' },
    { name: 'ZENITH', status: 'available', quality: 'HD' },
    { name: 'CAST', status: 'available', quality: 'HD' },
    { name: 'GHOST', status: 'available', quality: 'HD' },
    { name: 'HALO', status: 'available', quality: 'HD' },
    { name: 'KINOECHO', status: 'available', quality: 'HD' },
    { name: 'EE3', status: 'available', quality: 'HD' },
    { name: 'VOLT', status: 'available', quality: 'HD' },
    { name: 'PUTAFILME', status: 'available', quality: 'HD' },
    { name: 'OPHIM', status: 'available', quality: 'HD' },
    { name: 'KAGE', status: 'available', quality: 'HD' }
];

// Global variables
let currentAnime = null;
let currentSeason = 1;
let currentEpisode = 1;
let selectedServer = null;
let embedMode = 'false';
let loadingTimer = null;

// TMDB API key (reuse from anime.js)
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const playerContent = document.getElementById('playerContent');
const animeTitle = document.getElementById('animeTitle');
const episodeInfo = document.getElementById('episodeInfo');
const serverSelect = document.getElementById('serverSelect');
const embedSelect = document.getElementById('embedSelect');
const serverList = document.getElementById('serverList');
const featuredServer = document.getElementById('featuredServer');
const animeDetails = document.getElementById('animeDetails');
const playerStatus = document.getElementById('playerStatus');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWatchPage();
    setupEventListeners();
    populateServers();
    simulateLoading();
});

// Initialize the watch page
function initializeWatchPage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id') || '281623';
    const season = urlParams.get('season') || '1';
    const episode = urlParams.get('episode') || '1';
    const type = urlParams.get('type') || 'tv';

    currentSeason = parseInt(season);
    currentEpisode = parseInt(episode);

    // Update episode info immediately
    episodeInfo.textContent = `Season ${currentSeason} • Episode ${currentEpisode}`;

    // Fetch anime details
    fetchAnimeDetails(animeId, type);
}

// Setup event listeners
function setupEventListeners() {
    // Server selection
    serverSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            selectServer(e.target.value);
        }
    });

    // Embed mode toggle
    embedSelect.addEventListener('change', (e) => {
        embedMode = e.target.value;
        updatePlayerMode();
    });

    // Episode navigation
    document.getElementById('prevEpisodeBtn').addEventListener('click', () => {
        if (currentEpisode > 1) {
            currentEpisode--;
            updateEpisode();
        }
    });

    document.getElementById('nextEpisodeBtn').addEventListener('click', () => {
        currentEpisode++;
        updateEpisode();
    });

    // Torrent button
    document.getElementById('torrentBtn').addEventListener('click', () => {
        showTorrentOptions();
    });

    // More options
    document.getElementById('moreOptionsBtn').addEventListener('click', () => {
        showMoreOptions();
    });
}

// Populate server lists
function populateServers() {
    // Populate server select dropdown
    VIDEO_PROVIDERS.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.name;
        option.textContent = provider.name;
        serverSelect.appendChild(option);
    });

    // Populate server list panel
    const regularServers = VIDEO_PROVIDERS.filter(p => !p.featured);

    regularServers.forEach(provider => {
        const serverItem = createServerItem(provider);
        serverList.appendChild(serverItem);
    });

    // Update server count
    document.getElementById('serverCount').textContent = `${VIDEO_PROVIDERS.length} servers available`;
}

// Create server item element
function createServerItem(provider) {
    const serverItem = document.createElement('div');
    serverItem.className = 'server-item';
    serverItem.dataset.server = provider.name;

    serverItem.innerHTML = `
        <div class="server-info">
            <div class="server-name">${provider.name}</div>
            <div class="server-status ${provider.status}">${provider.status}</div>
        </div>
        <div class="server-quality">${provider.quality}</div>
    `;

    serverItem.addEventListener('click', () => {
        selectServer(provider.name);
    });

    return serverItem;
}

// Select a server
function selectServer(serverName) {
    selectedServer = serverName;

    // Update UI
    serverSelect.value = serverName;

    // Update active states
    document.querySelectorAll('.server-item').forEach(item => {
        item.classList.remove('active');
    });

    const selectedItem = document.querySelector(`[data-server="${serverName}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }

    // Update featured server if it's FLOWCAST
    if (serverName === 'FLOWCAST') {
        const featuredItem = featuredServer.querySelector('.server-item');
        featuredItem.classList.add('active');
        featuredItem.querySelector('.server-status').textContent = 'active';
        featuredItem.querySelector('.server-status').className = 'server-status available';
    }

    // Start "loading" the stream
    loadingScreen.style.display = 'flex';
    playerContent.style.display = 'none';

    // Simulate server connection
    setTimeout(() => {
        hideLoading();
        updatePlayerStatus(`Connected to ${serverName} server`);
        showAnimeDetails();
    }, 1500);
}

// Update player mode based on embed setting
function updatePlayerMode() {
    const isEmbed = embedMode === 'true';
    const modeText = isEmbed ? 'Embed Mode' : 'NON Embed Mode (AD-free)';

    if (selectedServer) {
        updatePlayerStatus(`${selectedServer} - ${modeText}`);
    }
}

// Simulate initial loading
function simulateLoading() {
    loadingTimer = setTimeout(() => {
        // Update FLOWCAST status after initial load
        const flowcastStatus = featuredServer.querySelector('.server-status');
        flowcastStatus.textContent = 'available';
        flowcastStatus.className = 'server-status available';

        // Auto-select FLOWCAST if no server selected
        if (!selectedServer) {
            playerStatus.textContent = 'FLOWCAST server ready - Click to start watching';
        }
    }, 2000);
}

// Hide loading screen
function hideLoading() {
    loadingScreen.style.display = 'none';
    playerContent.style.display = 'flex';
}

// Update player status
function updatePlayerStatus(message) {
    playerStatus.textContent = message;
}

// Update episode
function updateEpisode() {
    episodeInfo.textContent = `Season ${currentSeason} • Episode ${currentEpisode}`;

    if (selectedServer) {
        // Simulate loading new episode
        loadingScreen.style.display = 'flex';
        playerContent.style.display = 'none';

        setTimeout(() => {
            hideLoading();
            updatePlayerStatus(`${selectedServer} - S${currentSeason}E${currentEpisode}`);
        }, 1000);
    }
}

// Fetch anime details from TMDB
async function fetchAnimeDetails(animeId, type) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/${type}/${animeId}?api_key=${api_Key}`);
        const data = await response.json();

        currentAnime = data;
        updateAnimeInfo(data);

    } catch (error) {
        console.error('Error fetching anime details:', error);
        // Fallback anime info
        animeTitle.textContent = 'SHIROHIYO - Reincarnated as a Neglected Noble';
        updateAnimeInfo({
            name: 'SHIROHIYO - Reincarnated as a Neglected Noble: Raising My Baby Brother with Memories from My Past Life',
            first_air_date: '2024-01-01',
            vote_average: 8.5,
            genres: [{ name: 'Fantasy' }, { name: 'Drama' }, { name: 'Reincarnation' }],
            overview: 'A heartwarming story about reincarnation and family bonds in a fantasy world.'
        });
    }
}

// Update anime information
function updateAnimeInfo(anime) {
    const title = anime.name || anime.title || 'Unknown Anime';
    const year = anime.first_air_date || anime.release_date ?
                 new Date(anime.first_air_date || anime.release_date).getFullYear() :
                 '2024';
    const rating = anime.vote_average ? anime.vote_average.toFixed(1) : 'N/A';

    // Update title in loading screen
    animeTitle.textContent = title;

    // Update detailed info
    document.getElementById('animeDetailTitle').textContent = title;
    document.getElementById('animeYear').textContent = year;
    document.getElementById('animeRating').textContent = `★ ${rating}`;
    document.getElementById('animeType').textContent = anime.number_of_seasons ?
                                                      `TV Series` : 'Movie';

    // Update poster
    if (anime.poster_path) {
        document.getElementById('animePoster').innerHTML =
            `<img src="https://image.tmdb.org/t/p/w300${anime.poster_path}" alt="${title}">`;
    }

    // Update genres
    if (anime.genres) {
        const genresContainer = document.getElementById('animeGenres');
        genresContainer.innerHTML = '';
        anime.genres.forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.className = 'genre-tag';
            genreTag.textContent = genre.name;
            genresContainer.appendChild(genreTag);
        });
    }

    // Update description
    if (anime.overview) {
        document.getElementById('animeDescription').textContent = anime.overview;
    }
}

// Show anime details panel
function showAnimeDetails() {
    animeDetails.style.display = 'block';
}

// Show torrent options
function showTorrentOptions() {
    alert('Torrent download feature coming soon!\n\nThis will provide direct download links for offline viewing.');
}

// Show more options
function showMoreOptions() {
    const options = [
        'Report playback issues',
        'Request better quality',
        'Add to watchlist',
        'Share episode',
        'Download for offline'
    ];

    const choice = prompt('More Options:\n\n' + options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') + '\n\nSelect option (1-5):');

    if (choice && choice >= 1 && choice <= 5) {
        alert(`Selected: ${options[choice - 1]}\n\nThis feature is coming soon!`);
    }
}

// Search functionality
function focusSearch() {
    document.getElementById('searchModal').style.display = 'flex';
    document.getElementById('modalSearchInput').focus();
}

function closeSearch() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('modalSearchInput').value = '';
    document.getElementById('modalSearchResults').innerHTML = '';
}

// Search input handler
document.getElementById('modalSearchInput').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length > 2) {
        const results = await searchAnime(query);
        displaySearchResults(results);
    } else {
        document.getElementById('modalSearchResults').innerHTML = '';
    }
});

// Search anime function
async function searchAnime(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${query}&with_genres=16`);
        const data = await response.json();
        return data.results?.slice(0, 5) || [];
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('modalSearchResults');
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #a7a89a;">No results found</div>';
        return;
    }

    results.forEach(anime => {
        const resultItem = document.createElement('div');
        resultItem.style.cssText = `
            display: flex;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            background: #2a2b32;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.3s ease;
        `;

        resultItem.addEventListener('mouseenter', () => {
            resultItem.style.background = '#383e48';
        });

        resultItem.addEventListener('mouseleave', () => {
            resultItem.style.background = '#2a2b32';
        });

        const poster = anime.poster_path ?
                      `https://image.tmdb.org/t/p/w92${anime.poster_path}` :
                      'https://via.placeholder.com/92x138?text=No+Image';

        resultItem.innerHTML = `
            <img src="${poster}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${anime.name || 'Unknown'}</div>
                <div style="font-size: 12px; color: #a7a89a;">
                    ${anime.first_air_date ? new Date(anime.first_air_date).getFullYear() : 'Unknown'} •
                    ★ ${anime.vote_average ? anime.vote_average.toFixed(1) : 'N/A'}
                </div>
            </div>
        `;

        resultItem.addEventListener('click', () => {
            window.location.href = `watch.html?type=tv&id=${anime.id}&season=1&episode=1`;
        });

        container.appendChild(resultItem);
    });
}

// Close search modal when clicking outside
document.getElementById('searchModal').addEventListener('click', (e) => {
    if (e.target.id === 'searchModal') {
        closeSearch();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        focusSearch();
    }

    if (e.key === 'Escape') {
        closeSearch();
    }

    // Arrow keys for episode navigation
    if (e.key === 'ArrowLeft' && currentEpisode > 1) {
        currentEpisode--;
        updateEpisode();
    }

    if (e.key === 'ArrowRight') {
        currentEpisode++;
        updateEpisode();
    }
});

// Auto-hide Discord notification after 10 seconds
setTimeout(() => {
    const notification = document.getElementById('discordNotification');
    if (notification) {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }
}, 10000);

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust layout for mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.player-container').style.height = '400px';
    } else {
        document.querySelector('.player-container').style.height = 'calc(100vh - 140px)';
    }
});
