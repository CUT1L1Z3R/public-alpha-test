/**
 * Improvements for RiveStream integration in anime.js
 * This file contains enhanced functions to replace existing ones for better user experience
 */

// Enhanced RiveStream server function with better error handling
async function getRiveStreamServerEnhanced(tmdbId, season = 1, episode = 1) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            showToast('Connecting to RiveStream server...', 'info');
            
            const params = new URLSearchParams({
                requestID: 'tvVideoProvider',
                id: tmdbId,
                season: season,
                episode: episode,
                service: RIVESTREAM_CONFIG.service,
                secretKey: RIVESTREAM_CONFIG.secretKey,
                proxyMode: RIVESTREAM_CONFIG.proxyMode
            });

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${RIVESTREAM_CONFIG.apiUrl}?${params}`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.source) {
                showToast('Stream source found successfully!', 'success');
                return {
                    success: true,
                    url: data.source,
                    quality: data.quality || 'HD',
                    server: 'RiveStream'
                };
            } else if (data && data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('No source found in response');
            }
        } catch (error) {
            attempt++;
            console.error(`RiveStream API attempt ${attempt} failed:`, error);
            
            if (error.name === 'AbortError') {
                showToast('Request timeout. Retrying...', 'error');
            } else if (attempt === maxRetries) {
                showToast(`Failed to connect after ${maxRetries} attempts: ${error.message}`, 'error');
                return { success: false, error: error.message };
            } else {
                showToast(`Attempt ${attempt} failed. Retrying...`, 'error');
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    return { success: false, error: 'Maximum retries exceeded' };
}

// Enhanced toast notification system
function showToast(message, type = 'info', duration = 4000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.anime-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `anime-toast ${type}`;
    
    // Add loading spinner for info messages about connecting
    if (type === 'info' && message.includes('Connecting')) {
        toast.innerHTML = `<span class="anime-loading"></span>${message}`;
    } else {
        toast.textContent = message;
    }

    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Enhanced video player with better controls and error handling
function createVideoPlayerEnhanced(videoUrl, title) {
    // Remove existing player if any
    const existingPlayer = document.getElementById('anime-video-player-modal');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'anime-video-player-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    const playerContainer = document.createElement('div');
    playerContainer.className = 'player-container';
    playerContainer.style.cssText = `
        width: 100%;
        max-width: 1200px;
        background: #000;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 8px 32px rgba(0,0,0,0.7);
    `;

    const header = document.createElement('div');
    header.className = 'player-header';
    header.style.cssText = `
        background: linear-gradient(135deg, #333 0%, #444 100%);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #555;
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        color: #fff;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close-btn';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        transition: all 0.3s ease;
    `;

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    const videoElement = document.createElement('video');
    videoElement.style.cssText = `
        width: 100%;
        height: 60vh;
        background: #000;
        outline: none;
    `;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.preload = 'metadata';

    // Enhanced error handling for video
    videoElement.addEventListener('error', (e) => {
        console.error('Video error:', e);
        showToast('Video playback error. The stream may be unavailable.', 'error');
    });

    videoElement.addEventListener('loadstart', () => {
        showToast('Loading video stream...', 'info', 2000);
    });

    videoElement.addEventListener('canplay', () => {
        showToast('Video ready to play!', 'success', 2000);
    });

    videoElement.addEventListener('waiting', () => {
        showToast('Buffering...', 'info', 1000);
    });

    // Set video source
    videoElement.src = videoUrl;

    header.appendChild(titleElement);
    header.appendChild(closeBtn);
    playerContainer.appendChild(header);
    playerContainer.appendChild(videoElement);
    modal.appendChild(playerContainer);

    document.body.appendChild(modal);

    // Close modal when clicking outside player
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close modal on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Focus on video for better accessibility
    setTimeout(() => {
        videoElement.focus();
    }, 100);
}

// Enhanced server button creation with better UX
function createServerButtonsEnhanced(tmdbId, mediaType = 'tv', container) {
    if (mediaType !== 'tv') return; // Only for TV shows/anime

    const serverContainer = document.createElement('div');
    serverContainer.className = 'server-buttons-container';

    const serverTitle = document.createElement('h3');
    serverTitle.textContent = 'Available Servers';

    const serverButtonsRow = document.createElement('div');
    serverButtonsRow.style.cssText = `
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    `;

    // Season and episode selectors with improved styling
    const seasonSelect = document.createElement('select');
    seasonSelect.id = `season-select-${tmdbId}`;
    const episodeSelect = document.createElement('select');
    episodeSelect.id = `episode-select-${tmdbId}`;

    // Populate season options (1-10 seasons by default)
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        seasonSelect.appendChild(option);
    }

    // Populate episode options (1-50 episodes by default)
    for (let i = 1; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Episode ${i}`;
        episodeSelect.appendChild(option);
    }

    // RiveStream server button with enhanced styling
    const riveStreamBtn = document.createElement('button');
    riveStreamBtn.textContent = 'RiveStream Server';
    riveStreamBtn.id = `rivestream-btn-${tmdbId}`;

    let isLoading = false;

    riveStreamBtn.addEventListener('click', async () => {
        if (isLoading) return;

        const season = seasonSelect.value;
        const episode = episodeSelect.value;

        isLoading = true;
        riveStreamBtn.textContent = 'Loading...';
        riveStreamBtn.disabled = true;

        try {
            const serverData = await getRiveStreamServerEnhanced(tmdbId, season, episode);

            if (serverData.success) {
                createVideoPlayerEnhanced(serverData.url, `Season ${season} Episode ${episode}`);
            } else {
                showToast(`Server error: ${serverData.error}`, 'error');
            }
        } catch (error) {
            showToast('Failed to load server. Please try again.', 'error');
            console.error('Server loading error:', error);
        } finally {
            riveStreamBtn.textContent = 'RiveStream Server';
            riveStreamBtn.disabled = false;
            isLoading = false;
        }
    });

    const selectorsContainer = document.createElement('div');
    selectorsContainer.className = 'selectors-container';

    const seasonLabel = document.createElement('label');
    seasonLabel.textContent = 'Season: ';
    seasonLabel.htmlFor = `season-select-${tmdbId}`;

    const episodeLabel = document.createElement('label');
    episodeLabel.textContent = 'Episode: ';
    episodeLabel.htmlFor = `episode-select-${tmdbId}`;

    selectorsContainer.appendChild(seasonLabel);
    selectorsContainer.appendChild(seasonSelect);
    selectorsContainer.appendChild(episodeLabel);
    selectorsContainer.appendChild(episodeSelect);

    serverButtonsRow.appendChild(selectorsContainer);
    serverButtonsRow.appendChild(riveStreamBtn);

    serverContainer.appendChild(serverTitle);
    serverContainer.appendChild(serverButtonsRow);

    if (container) {
        container.appendChild(serverContainer);
    }

    return serverContainer;
}

// Function to test API connectivity
async function testRiveStreamAPI() {
    try {
        showToast('Testing RiveStream API connectivity...', 'info');
        
        // Test with a popular anime ID
        const testResult = await getRiveStreamServerEnhanced(1399, 1, 1); // Game of Thrones for testing
        
        if (testResult.success) {
            showToast('RiveStream API is working correctly!', 'success');
            console.log('API Test Result:', testResult);
        } else {
            showToast('RiveStream API test failed. Check console for details.', 'error');
            console.error('API Test Failed:', testResult.error);
        }
    } catch (error) {
        showToast('API test error. Check console for details.', 'error');
        console.error('API Test Error:', error);
    }
}

// Enhanced anime server modal with better accessibility
function createAnimeServerModalEnhanced(anime) {
    // Remove existing modal if any
    const existingModal = document.getElementById('anime-server-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'anime-server-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.setAttribute('aria-modal', 'true');

    const content = document.createElement('div');
    content.className = 'modal-content';

    // Close button with better accessibility
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('aria-label', 'Close modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Anime title with proper heading
    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.textContent = anime.name || anime.title || 'Anime';

    // Poster image with proper alt text
    const img = document.createElement('img');
    img.src = anime.backdrop_path
        ? `https://image.tmdb.org/t/p/w500${anime.backdrop_path}`
        : anime.poster_path
            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
            : 'https://via.placeholder.com/500x281?text=No+Image';
    img.alt = `${title.textContent} poster`;

    // Server buttons with enhanced version
    const serverButtons = createServerButtonsEnhanced(anime.id, 'tv', null);

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(img);
    content.appendChild(serverButtons);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Focus management for accessibility
    setTimeout(() => {
        closeBtn.focus();
    }, 100);

    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Enhanced keyboard navigation
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        } else if (e.key === 'Tab') {
            // Keep focus within modal
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Function to initialize enhanced features
function initializeEnhancedFeatures() {
    // Add API test button to page for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test RiveStream API';
        testButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            padding: 10px 15px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        testButton.addEventListener('click', testRiveStreamAPI);
        document.body.appendChild(testButton);
    }

    // Replace original functions with enhanced versions
    if (typeof window.getRiveStreamServer !== 'undefined') {
        window.getRiveStreamServerOriginal = window.getRiveStreamServer;
        window.getRiveStreamServer = getRiveStreamServerEnhanced;
    }

    if (typeof window.createVideoPlayer !== 'undefined') {
        window.createVideoPlayerOriginal = window.createVideoPlayer;
        window.createVideoPlayer = createVideoPlayerEnhanced;
    }

    if (typeof window.createServerButtons !== 'undefined') {
        window.createServerButtonsOriginal = window.createServerButtons;
        window.createServerButtons = createServerButtonsEnhanced;
    }

    if (typeof window.createAnimeServerModal !== 'undefined') {
        window.createAnimeServerModalOriginal = window.createAnimeServerModal;
        window.createAnimeServerModal = createAnimeServerModalEnhanced;
    }

    console.log('Enhanced RiveStream features initialized');
    showToast('Enhanced features loaded successfully!', 'success', 2000);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedFeatures);
} else {
    initializeEnhancedFeatures();
}