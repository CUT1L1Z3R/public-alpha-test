/**
 * JavaScript for FreeFlix Anime Watch Page
 * Handles server selection, video streaming, and episode navigation
 */

// Global variables
let currentAnime = null;
let currentSeason = 1;
let currentEpisode = 1;
let selectedServer = null;
let embedMode = false;
let episodes = [];
let serverProviders = [];

// Server configurations
const servers = {
    FLOWCAST: {
        name: 'FLOWCAST',
        baseUrl: 'https://flowcast.example.com/embed/',
        priority: 1,
        status: 'fetching'
    },
    SHADOW: {
        name: 'SHADOW',
        baseUrl: 'https://shadow.example.com/embed/',
        priority: 2,
        status: 'available'
    },
    ASIACLOUD: {
        name: 'ASIACLOUD',
        baseUrl: 'https://asiacloud.example.com/embed/',
        priority: 3,
        status: 'available'
    },
    HINDICAST: {
        name: 'HINDICAST',
        baseUrl: 'https://hindicast.example.com/embed/',
        priority: 4,
        status: 'available'
    },
    ANIME: {
        name: 'ANIME',
        baseUrl: 'https://anime.example.com/embed/',
        priority: 5,
        status: 'available'
    },
    ANIMEZ: {
        name: 'ANIMEZ',
        baseUrl: 'https://animez.example.com/embed/',
        priority: 6,
        status: 'available'
    },
    GUARD: {
        name: 'GUARD',
        baseUrl: 'https://guard.example.com/embed/',
        priority: 7,
        status: 'available'
    },
    CURVE: {
        name: 'CURVE',
        baseUrl: 'https://curve.example.com/embed/',
        priority: 8,
        status: 'available'
    },
    HQ: {
        name: 'HQ',
        baseUrl: 'https://hq.example.com/embed/',
        priority: 9,
        status: 'available'
    },
    NINJA: {
        name: 'NINJA',
        baseUrl: 'https://ninja.example.com/embed/',
        priority: 10,
        status: 'available'
    },
    ALPHA: {
        name: 'ALPHA',
        baseUrl: 'https://alpha.example.com/embed/',
        priority: 11,
        status: 'available'
    },
    KAZE: {
        name: 'KAZE',
        baseUrl: 'https://kaze.example.com/embed/',
        priority: 12,
        status: 'available'
    },
    ZENITH: {
        name: 'ZENITH',
        baseUrl: 'https://zenith.example.com/embed/',
        priority: 13,
        status: 'available'
    },
    CAST: {
        name: 'CAST',
        baseUrl: 'https://cast.example.com/embed/',
        priority: 14,
        status: 'available'
    },
    GHOST: {
        name: 'GHOST',
        baseUrl: 'https://ghost.example.com/embed/',
        priority: 15,
        status: 'available'
    },
    HALO: {
        name: 'HALO',
        baseUrl: 'https://halo.example.com/embed/',
        priority: 16,
        status: 'available'
    },
    KINOECHO: {
        name: 'KINOECHO',
        baseUrl: 'https://kinoecho.example.com/embed/',
        priority: 17,
        status: 'available'
    },
    EE3: {
        name: 'EE3',
        baseUrl: 'https://ee3.example.com/embed/',
        priority: 18,
        status: 'available'
    },
    VOLT: {
        name: 'VOLT',
        baseUrl: 'https://volt.example.com/embed/',
        priority: 19,
        status: 'available'
    },
    PUTAFILME: {
        name: 'PUTAFILME',
        baseUrl: 'https://putafilme.example.com/embed/',
        priority: 20,
        status: 'available'
    },
    OPHIM: {
        name: 'OPHIM',
        baseUrl: 'https://ophim.example.com/embed/',
        priority: 21,
        status: 'available'
    },
    KAGE: {
        name: 'KAGE',
        baseUrl: 'https://kage.example.com/embed/',
        priority: 22,
        status: 'available'
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeWatchPage();
    setupEventListeners();
    loadAnimeFromURL();
});

// Initialize the watch page
function initializeWatchPage() {
    console.log('Initializing anime watch page...');

    // Setup server select dropdown
    setupServerSelect();

    // Initialize server providers
    initializeServerProviders();

    // Set default embed mode
    embedMode = document.getElementById('embedMode').value === 'true';
}

// Setup event listeners
function setupEventListeners() {
    // Server selection
    document.querySelectorAll('.video-provider').forEach(provider => {
        provider.addEventListener('click', function() {
            if (!this.classList.contains('unavailable')) {
                selectServer(this.dataset.server);
            }
        });
    });

    // Embed mode change
    document.getElementById('embedMode').addEventListener('change', function() {
        embedMode = this.value === 'true';
        updateNonEmbedMessage();
        if (selectedServer) {
            loadVideoPlayer();
        }
    });

    // Server dropdown change
    document.getElementById('serverSelect').addEventListener('change', function() {
        if (this.value) {
            selectServer(this.value);
        }
    });

    // Episode navigation
    document.getElementById('prevEpisode').addEventListener('click', function() {
        navigateEpisode(-1);
    });

    document.getElementById('nextEpisode').addEventListener('click', function() {
        navigateEpisode(1);
    });

    // Episode list toggle
    document.getElementById('episodeList').addEventListener('click', function() {
        toggleEpisodeList();
    });
}

// Setup server select dropdown
function setupServerSelect() {
    const serverSelect = document.getElementById('serverSelect');

    Object.keys(servers).forEach(serverKey => {
        const option = document.createElement('option');
        option.value = serverKey;
        option.textContent = servers[serverKey].name;
        serverSelect.appendChild(option);
    });
}

// Initialize server providers
function initializeServerProviders() {
    console.log('Initializing server providers...');

    // Simulate server status checking
    setTimeout(() => {
        // Update FLOWCAST status
        const flowcastProvider = document.querySelector('[data-server="FLOWCAST"]');
        if (flowcastProvider) {
            flowcastProvider.classList.remove('fetching');
            flowcastProvider.classList.add('available');
            flowcastProvider.querySelector('.video-provider-status').textContent = 'available';
            servers.FLOWCAST.status = 'available';
        }
    }, 2000);

    // Set initial selected server to FLOWCAST
    setTimeout(() => {
        selectServer('FLOWCAST');
    }, 2500);
}

// Select a server
function selectServer(serverName) {
    console.log('Selecting server:', serverName);

    if (!servers[serverName] || servers[serverName].status === 'unavailable') {
        console.warn('Server not available:', serverName);
        return;
    }

    // Update UI
    document.querySelectorAll('.video-provider').forEach(provider => {
        provider.classList.remove('selected');
    });

    const selectedProvider = document.querySelector(`[data-server="${serverName}"]`);
    if (selectedProvider) {
        selectedProvider.classList.add('selected');
    }

    // Update dropdown
    document.getElementById('serverSelect').value = serverName;

    selectedServer = serverName;
    loadVideoPlayer();
}

// Load video player
function loadVideoPlayer() {
    if (!selectedServer || !currentAnime) {
        console.warn('Cannot load video player: missing server or anime data');
        return;
    }

    const videoPlayer = document.getElementById('videoPlayer');
    const placeholder = document.querySelector('.video-placeholder');

    // Generate video URL
    const videoUrl = generateVideoUrl(selectedServer, currentAnime.id, currentSeason, currentEpisode);

    console.log('Loading video:', videoUrl);

    // Hide placeholder and show player
    placeholder.style.display = 'none';
    videoPlayer.style.display = 'block';
    videoPlayer.src = videoUrl;

    // Update status
    updateServerStatus(selectedServer, 'loading');

    // Simulate loading completion
    setTimeout(() => {
        updateServerStatus(selectedServer, 'playing');
    }, 3000);
}

// Generate video URL
function generateVideoUrl(serverName, animeId, season, episode) {
    const server = servers[serverName];
    if (!server) return '';

    // For demo purposes, we'll use a placeholder video
    // In a real implementation, this would connect to actual streaming servers
    const demoUrls = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    ];

    // Select demo video based on episode
    const demoIndex = (episode - 1) % demoUrls.length;

    if (embedMode) {
        // Return embedded player URL
        return `data:text/html;charset=utf-8,
            <html>
                <body style="margin:0;padding:0;background:#000;">
                    <video width="100%" height="100%" controls autoplay>
                        <source src="${demoUrls[demoIndex]}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </body>
            </html>`;
    } else {
        // Return direct video URL for non-embed mode
        return demoUrls[demoIndex];
    }
}

// Update server status
function updateServerStatus(serverName, status) {
    const provider = document.querySelector(`[data-server="${serverName}"]`);
    if (!provider) return;

    const statusElement = provider.querySelector('.video-provider-status');
    if (!statusElement) return;

    // Remove existing status classes
    provider.classList.remove('fetching', 'available', 'unavailable', 'loading', 'playing');

    // Add new status
    provider.classList.add(status);

    switch (status) {
        case 'fetching':
            statusElement.textContent = 'fetching';
            break;
        case 'loading':
            statusElement.textContent = 'loading';
            break;
        case 'playing':
            statusElement.textContent = 'playing';
            break;
        case 'available':
            statusElement.textContent = 'available';
            break;
        case 'unavailable':
            statusElement.textContent = 'unavailable';
            break;
        default:
            statusElement.textContent = 'unknown';
    }

    servers[serverName].status = status;
}

// Navigate episodes
function navigateEpisode(direction) {
    const newEpisode = currentEpisode + direction;

    if (newEpisode < 1 || newEpisode > episodes.length) {
        console.warn('Episode out of range:', newEpisode);
        return;
    }

    currentEpisode = newEpisode;
    updateEpisodeDisplay();

    if (selectedServer) {
        loadVideoPlayer();
    }
}

// Update episode display
function updateEpisodeDisplay() {
    document.getElementById('currentSeason').textContent = currentSeason;
    document.getElementById('currentEpisode').textContent = currentEpisode;

    // Update episode list
    updateEpisodeList();
}

// Update episode list
function updateEpisodeList() {
    const episodeListContainer = document.getElementById('episodeList');
    episodeListContainer.innerHTML = '';

    episodes.forEach((episode, index) => {
        const episodeItem = document.createElement('div');
        episodeItem.className = 'episode-item';
        if (index + 1 === currentEpisode) {
            episodeItem.classList.add('active');
        }

        episodeItem.innerHTML = `
            <div>
                <div class="episode-number">Episode ${index + 1}</div>
                <div class="episode-title">${episode.title || `Episode ${index + 1}`}</div>
            </div>
            <div class="episode-duration">${episode.duration || '24 min'}</div>
        `;

        episodeItem.addEventListener('click', function() {
            currentEpisode = index + 1;
            updateEpisodeDisplay();
            if (selectedServer) {
                loadVideoPlayer();
            }
        });

        episodeListContainer.appendChild(episodeItem);
    });
}

// Toggle episode list
function toggleEpisodeList() {
    const episodeListContainer = document.querySelector('.episode-list-container');
    episodeListContainer.style.display = episodeListContainer.style.display === 'none' ? 'block' : 'none';
}

// Update non-embed message
function updateNonEmbedMessage() {
    const message = document.querySelector('.non-embed-switch-msg p');
    if (embedMode) {
        message.textContent = 'Embed Mode: Some ads may be present';
    } else {
        message.textContent = 'If Server not found, Then system will automatically switch to Embed Mode in 10 seconds';
    }
}

// Load anime from URL parameters
function loadAnimeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id') || '281623';
    const season = parseInt(urlParams.get('season')) || 1;
    const episode = parseInt(urlParams.get('episode')) || 1;
    const type = urlParams.get('type') || 'tv';

    currentSeason = season;
    currentEpisode = episode;

    // Load anime data
    loadAnimeData(animeId, type);
}

// Load anime data
function loadAnimeData(animeId, type) {
    console.log('Loading anime data for ID:', animeId);

    // For demo purposes, use sample anime data
    // In real implementation, this would fetch from an anime database
    currentAnime = {
        id: animeId,
        title: 'SHIROHIYO - Reincarnated as a Neglected Noble',
        year: '2024',
        genres: ['Drama', 'Fantasy', 'Romance'],
        rating: '8.2',
        description: 'A heartwarming story about a person reincarnated as a neglected noble who decides to raise their baby brother with memories from their past life.',
        type: type,
        seasons: 1,
        totalEpisodes: 12
    };

    // Generate episode list
    episodes = [];
    for (let i = 1; i <= currentAnime.totalEpisodes; i++) {
        episodes.push({
            number: i,
            title: `Episode ${i}`,
            duration: '24 min'
        });
    }

    // Update UI
    updateAnimeInfo();
    updateEpisodeDisplay();
}

// Update anime information display
function updateAnimeInfo() {
    if (!currentAnime) return;

    document.getElementById('animeTitle').textContent = currentAnime.title;
    document.getElementById('animeYear').textContent = currentAnime.year;
    document.getElementById('animeGenres').textContent = currentAnime.genres.join(', ');
    document.getElementById('animeRating').textContent = `★ ${currentAnime.rating}`;
    document.getElementById('animeDescription').textContent = currentAnime.description;

    // Update page title
    document.title = `FreeFlix - ${currentAnime.title} S${currentSeason}E${currentEpisode}`;
}

// Auto-fallback to embed mode
function autoFallbackToEmbedMode() {
    if (!embedMode) {
        console.log('Auto-switching to embed mode...');
        document.getElementById('embedMode').value = 'true';
        embedMode = true;
        updateNonEmbedMessage();

        if (selectedServer) {
            loadVideoPlayer();
        }
    }
}

// Simulate server timeout and fallback
setTimeout(() => {
    if (selectedServer && servers[selectedServer].status === 'fetching') {
        console.log('Server timeout detected, falling back to embed mode');
        autoFallbackToEmbedMode();
    }
}, 10000);

// Export functions for global access
window.AnimePlayer = {
    selectServer,
    navigateEpisode,
    updateEpisodeDisplay,
    loadAnimeData
};
