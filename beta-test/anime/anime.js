/**
 * JavaScript file for the anime page of the FreeFlix streaming site.
 * Handles fetching, displaying, and UI interactions for anime.
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');

// Set current section to anime
const currentSection = 'anime';

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// RiveStream server configuration for anime
const RIVESTREAM_CONFIG = {
    apiUrl: 'https://rivestream.net/api/backendfetch',
    secretKey: 'LTUfm4fmX2ZTIwY2Uz',
    service: 'ee3',
    proxyMode: 'noProxy'
};

// Function to get RiveStream server URL for anime
async function getRiveStreamServer(tmdbId, season = 1, episode = 1) {
    try {
        const params = new URLSearchParams({
            requestID: 'tvVideoProvider',
            id: tmdbId,
            season: season,
            episode: episode,
            service: RIVESTREAM_CONFIG.service,
            secretKey: RIVESTREAM_CONFIG.secretKey,
            proxyMode: RIVESTREAM_CONFIG.proxyMode
        });

        const response = await fetch(`${RIVESTREAM_CONFIG.apiUrl}?${params}`);
        const data = await response.json();

        if (data && data.source) {
            return {
                success: true,
                url: data.source,
                quality: data.quality || 'HD',
                server: 'RiveStream'
            };
        }

        return { success: false, error: 'No source found' };
    } catch (error) {
        console.error('Error fetching RiveStream server:', error);
        return { success: false, error: error.message };
    }
}

// Function to create server buttons for anime
function createServerButtons(tmdbId, mediaType = 'tv', container) {
    if (mediaType !== 'tv') return; // Only for TV shows/anime

    const serverContainer = document.createElement('div');
    serverContainer.className = 'server-buttons-container';
    serverContainer.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        background: rgba(0,0,0,0.8);
        border-radius: 10px;
        border: 1px solid #333;
    `;

    const serverTitle = document.createElement('h3');
    serverTitle.textContent = 'Available Servers';
    serverTitle.style.cssText = `
        color: #fff;
        margin-bottom: 15px;
        font-size: 1.2rem;
    `;

    const serverButtonsRow = document.createElement('div');
    serverButtonsRow.style.cssText = `
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
    `;

    // Season and episode selectors
    const seasonSelect = document.createElement('select');
    seasonSelect.style.cssText = `
        padding: 8px 12px;
        border-radius: 5px;
        border: none;
        background: #444;
        color: #fff;
        margin-right: 10px;
    `;

    const episodeSelect = document.createElement('select');
    episodeSelect.style.cssText = `
        padding: 8px 12px;
        border-radius: 5px;
        border: none;
        background: #444;
        color: #fff;
        margin-right: 15px;
    `;

    // Default options
    for (let i = 1; i <= 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        seasonSelect.appendChild(option);
    }

    for (let i = 1; i <= 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Episode ${i}`;
        episodeSelect.appendChild(option);
    }

    // RiveStream server button
    const riveStreamBtn = document.createElement('button');
    riveStreamBtn.textContent = 'RiveStream Server';
    riveStreamBtn.style.cssText = `
        padding: 10px 20px;
        background: linear-gradient(45deg, #e74c3c, #c0392b);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    `;

    riveStreamBtn.onmouseover = () => {
        riveStreamBtn.style.background = 'linear-gradient(45deg, #c0392b, #a93226)';
        riveStreamBtn.style.transform = 'translateY(-2px)';
    };

    riveStreamBtn.onmouseout = () => {
        riveStreamBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        riveStreamBtn.style.transform = 'translateY(0)';
    };

    riveStreamBtn.addEventListener('click', async () => {
        const season = seasonSelect.value;
        const episode = episodeSelect.value;

        riveStreamBtn.textContent = 'Loading...';
        riveStreamBtn.disabled = true;

        try {
            const serverData = await getRiveStreamServer(tmdbId, season, episode);

            if (serverData.success) {
                // Create video player modal
                createVideoPlayer(serverData.url, `Season ${season} Episode ${episode}`);
            } else {
                alert(`Server error: ${serverData.error}`);
            }
        } catch (error) {
            alert('Failed to load server. Please try again.');
            console.error('Server loading error:', error);
        } finally {
            riveStreamBtn.textContent = 'RiveStream Server';
            riveStreamBtn.disabled = false;
        }
    });

    const selectorsContainer = document.createElement('div');
    selectorsContainer.style.cssText = 'display: flex; align-items: center; margin-right: 15px;';

    const seasonLabel = document.createElement('label');
    seasonLabel.textContent = 'Season: ';
    seasonLabel.style.cssText = 'color: #fff; margin-right: 5px;';

    const episodeLabel = document.createElement('label');
    episodeLabel.textContent = 'Episode: ';
    episodeLabel.style.cssText = 'color: #fff; margin-right: 5px; margin-left: 10px;';

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

// Function to create video player modal
function createVideoPlayer(videoUrl, title) {
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
    playerContainer.style.cssText = `
        width: 100%;
        max-width: 1200px;
        background: #000;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: #333;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        color: #fff;
        margin: 0;
        font-size: 1.1rem;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
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
    `;

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    const videoElement = document.createElement('video');
    videoElement.style.cssText = `
        width: 100%;
        height: 60vh;
        background: #000;
    `;
    videoElement.controls = true;
    videoElement.autoplay = true;
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
}

// Function to add server buttons to anime detail pages
function addServerButtonsToDetailsPage() {
    // Check if we're on a details page
    const urlParams = new URLSearchParams(window.location.search);
    const mediaType = urlParams.get('media');
    const id = urlParams.get('id');

    if (mediaType === 'tv' && id) {
        // Find a suitable container to add server buttons
        const detailsContainer = document.querySelector('.movie-details') ||
                                document.querySelector('.details-container') ||
                                document.querySelector('.main-content') ||
                                document.body;

        if (detailsContainer) {
            // Add server buttons after a short delay to ensure page content is loaded
            setTimeout(() => {
                const serverButtons = createServerButtons(id, mediaType, null);
                if (serverButtons) {
                    detailsContainer.appendChild(serverButtons);
                }
            }, 1000);
        }
    }
}

// Function to create a modal with server buttons for anime items on the main page
function createAnimeServerModal(anime) {
    // Remove existing modal if any
    const existingModal = document.getElementById('anime-server-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'anime-server-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: #181818;
        border-radius: 12px;
        padding: 32px 24px 24px 24px;
        min-width: 340px;
        max-width: 95vw;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 16px;
        background: none;
        border: none;
        color: #fff;
        font-size: 2rem;
        cursor: pointer;
        z-index: 2;
    `;
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Anime title
    const title = document.createElement('h2');
    title.textContent = anime.name || anime.title || 'Anime';
    title.style.cssText = `
        color: #fff;
        margin-bottom: 18px;
        font-size: 1.3rem;
        text-align: center;
    `;

    // Poster image
    const img = document.createElement('img');
    img.src = anime.backdrop_path
        ? `https://image.tmdb.org/t/p/w500${anime.backdrop_path}`
        : anime.poster_path
            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
            : 'https://via.placeholder.com/500x281?text=No+Image';
    img.alt = title.textContent;
    img.style.cssText = `
        width: 320px;
        max-width: 90vw;
        border-radius: 8px;
        margin-bottom: 18px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        object-fit: cover;
    `;

    // Server buttons
    const serverButtons = createServerButtons(anime.id, 'tv', null);

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(img);
    content.appendChild(serverButtons);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close modal when clicking outside content
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
}

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the anime page
    initAnimePage();

    // Set up watchlist button
    goToWatchlistBtn.addEventListener('click', () => {
        // Get the watchlist from local storage
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

        // If the watchlist has items, display them
        if (watchlist.length > 0) {
            // Redirect to watchlist page or show a modal
            alert('Watchlist feature is coming soon!');
        } else {
            // Show a message if the watchlist is empty
            alert('Your watchlist is empty. Add items to your watchlist by clicking the "Add to Watchlist" button on anime details pages.');
        }
    });

    // Initialize search
    initSearch();

    // Initialize back to top button
    addBackToTopButton();

    // Add server buttons to details page if on details page
    addServerButtonsToDetailsPage();
});

// Initialize the anime page
function initAnimePage() {
    // Update banner for anime section
    updateBannerForAnime();

    // Initialize anime sections
    initializeAnimeSections();
}

// Update banner with upcoming anime
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

    // For Anime section, use upcoming anime for banner slideshow
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

    const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Get anime that will air after today but before 6 months from now
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`)
        .then(response => response.json())
        .then(data => {
            const upcomingAnimes = data.results || [];
            console.log('Upcoming anime fetched:', upcomingAnimes.length);
            // Filter to animes with backdrop images, get up to 9 items
            bannerItems = upcomingAnimes.filter(anime => anime.backdrop_path).slice(0, 9).map(anime => ({
                ...anime,
                mediaType: 'tv'
            }));

            if (bannerItems.length > 0) {
                showBannerAtIndex(0); // Show first banner
                startBannerSlideshow(); // Start auto-rotation
            }
        })
        .catch(error => console.error('Error updating anime banner:', error));

    // Add click handlers to banner navigation buttons
    const bannerPrev = document.getElementById('banner-prev');
    const bannerNext = document.getElementById('banner-next');

    bannerPrev.addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
        showBannerAtIndex(currentBannerIndex);
    });

    bannerNext.addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
        showBannerAtIndex(currentBannerIndex);
    });

    // Add click handlers to play and info buttons
    const playButton = document.getElementById('play-button');
    const moreInfoButton = document.getElementById('more-info');

    playButton.addEventListener('click', () => {
        if (bannerItems.length > 0) {
            const item = bannerItems[currentBannerIndex];
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
        }
    });

    moreInfoButton.addEventListener('click', () => {
        if (bannerItems.length > 0) {
            const item = bannerItems[currentBannerIndex];
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
        }
    });
}

// Initialize sections for anime
function initializeAnimeSections() {
    // Initialize anime sections
    fetchAnime('anime-upcoming-new-container', 'truly_upcoming');
    fetchAnime('top-rated-anime-movie-container', 'top_rated_anime_movies');
    fetchAnime('anime-popular-container', 'popular');
    fetchAnime('anime-top-container', 'top_rated');
    fetchAnime('anime-upcoming-container', 'upcoming');
    fetchAnime('adventure-anime-container', 'adventure');
    fetchAnime('drama-anime-container', 'drama');
    fetchAnime('anime-comedy-container', 'comedy');
    fetchAnime('anime-romance-container', 'romance');

    // Set up navigation buttons for each section
    setupNavigationButtons();
}

// Function to set up navigation buttons for scrolling through anime lists
function setupNavigationButtons() {
    const animeSections = document.querySelectorAll('.movie-section');

    animeSections.forEach(section => {
        const container = section.querySelector('.movies-box');
        const prevButton = section.querySelector('.navigation-button.previous');
        const nextButton = section.querySelector('.navigation-button.next');

        if (container && prevButton && nextButton) {
            // Set up click handlers
            prevButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -300,
                    behavior: 'smooth'
                });
            });

            nextButton.addEventListener('click', () => {
                container.scrollBy({
                    left: 300,
                    behavior: 'smooth'
                });
            }
        }
    });
}

// Function to start auto-rotation of banner items
function startBannerSlideshow() {
    // Clear any existing interval
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Only start if we have multiple items
    if (bannerItems.length > 1) {
        bannerInterval = setInterval(() => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);
        }, 8000); // Change banner every 8 seconds
    }
}

// Function to show banner at specific index with enhanced styling
function showBannerAtIndex(index) {
    const item = bannerItems[index];
    if (item && item.backdrop_path) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        // Set banner image with high quality
        banner.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        // Create a more detailed title with additional info
        const title = item.title || item.name;

        // Add subtitle information if available
        const extraInfo = [];
        if (item.release_date) {
            extraInfo.push(new Date(item.release_date).getFullYear());
        } else if (item.first_air_date) {
            extraInfo.push(new Date(item.first_air_date).getFullYear());
        }

        // Add "Latest Update" tag for anime
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

                // Style the "Latest Update" tag for anime section
                if (subtitleElement.textContent.includes('Latest Update')) {
                    // Create a span to style just the "Latest Update" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Latest Update',
                        '<span class="latest-update-badge">Latest Update</span>'
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-update-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(52, 152, 219, 0.9)'; // Blue for latest updates
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
        banner.style.transition = 'opacity 0.5s ease-in-out';
    }
}

// Function to fetch anime from TMDB API
function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with TMDB API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    // Determine which TMDB endpoint to use based on the input
    let endpoint = '';

    if (genreOrKeyword === 'popular') {
        // For popular anime, use discover with animation genre + anime keyword and sort by popularity
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'top_rated') {
        // For top rated anime, use discover with animation genre + anime keyword sorted by rating
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
    } else if (genreOrKeyword === 'upcoming') {
        // For ongoing anime (renamed from upcoming), use discover with recent and ongoing air dates
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.lte=${dateStr}&with_status=0&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'truly_upcoming') {
        // For truly upcoming anime, use discover with future air dates
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

        const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Get anime that will air after today but before 6 months from now
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`;
    } else if (genreOrKeyword === 'action') {
        // Action anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,28&with_keywords=210024&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'romance') {
        // Romance anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'comedy') {
        // Comedy anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'top_rated_anime_movies') {
        // Top rated anime movies
        endpoint = `discover/movie?api_key=${api_Key}&with_genres=16&sort_by=vote_average.desc&vote_count.gte=100`;
    } else if (genreOrKeyword === 'adventure') {
        // Action & Adventure anime - combining action and adventure genres
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10759&with_keywords=210024&sort_by=popularity.desc&vote_count.gte=50`;
        // Genres: 16=Animation, 28=Action, 12=Adventure
    } else if (genreOrKeyword === 'drama') {
        // Drama anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,18&with_keywords=210024&sort_by=popularity.desc`;
    } else {
        // Default endpoint for general anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
    }

    // Fetch anime data from TMDB
    console.log(`Fetching anime with endpoint: https://api.themoviedb.org/3/${endpoint}`);
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

            containers.forEach(container => {
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without backdrop or poster images
                const validResults = animeResults.filter(item => item.poster_path || item.backdrop_path);

                if (validResults.length === 0) {
                    console.warn(`No valid image results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content with images available at this time. Please try again later.</div>';
                    return;
                }

                validResults.forEach(anime => {
                    const title = anime.name || anime.title || 'Unknown Title';

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
                    if (containerClass === 'top-rated-anime-movie-container') {
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

                    // Create an overlay for anime info
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Add the title
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = title;

                    // Add the rating
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = anime.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    // Build the rating element
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    // Add overlay elements
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(overlay);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to details page or show server modal
                    itemElement.addEventListener('click', () => {
                        if (containerClass === 'top-rated-anime-movie-container') {
                            window.location.href = `../movie_details/movie_details.html?media=movie&id=${anime.id}`;
                        } else {
                            // For anime TV shows, create a modal with server options instead of redirecting
                            createAnimeServerModal(anime);
                        }
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching anime data:', error);

            // Special handling for adventure anime container if it fails
            if (containerClass === 'adventure-anime-container') {
                containers.forEach(container => {
                    // Try a fallback query for adventure anime
                    console.log("Attempting fallback query for adventure anime");
                    const fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&sort_by=popularity.desc&vote_count.gte=100`;

                    fetch(`https://api.themoviedb.org/3/${fallbackEndpoint}`)
                        .then(response => response.json())
                        .then(data => {
                            const animeResults = data.results || [];
                            if (animeResults.length > 0) {
                                container.innerHTML = ''; // Clear error message

                                // Just show the first 15 most popular anime
                                const validResults = animeResults
                                    .filter(item => item.poster_path || item.backdrop_path)
                                    .slice(0, 15);

                                if (validResults.length > 0) {
                                    validResults.forEach(anime => {
                                        const title = anime.name || anime.title || 'Unknown Title';
                                        const imageUrl = anime.backdrop_path
                                            ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}`
                                            : anime.poster_path
                                                ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                                                : 'https://via.placeholder.com/780x439?text=No+Image+Available';

                                        const itemElement = document.createElement('div');
                                        itemElement.className = 'movie-item';
                                        itemElement.style.width = '290px';
                                        itemElement.style.height = '170px';
                                        itemElement.dataset.mediaType = 'tv';
                                        itemElement.dataset.id = anime.id;

                                        const imgWrapper = document.createElement('div');
                                        imgWrapper.className = 'image-wrapper';

                                        const img = document.createElement('img');
                                        img.src = imageUrl;
                                        img.alt = title;
                                        img.loading = 'lazy';

                                        const overlay = document.createElement('div');
                                        overlay.className = 'movie-overlay';

                                        const titleElement = document.createElement('div');
                                        titleElement.className = 'movie-title';
                                        titleElement.textContent = title;

                                        overlay.appendChild(titleElement);
                                        imgWrapper.appendChild(img);
                                        imgWrapper.appendChild(overlay);
                                        itemElement.appendChild(imgWrapper);
                                        container.appendChild(itemElement);

                                        itemElement.addEventListener('click', () => {
                                            window.location.href = `../movie_details/movie_details.html?media=tv&id=${anime.id}`;
                                        });
                                    });
                                }
                            }
                        })
                        .catch(err => {
                            console.error('Error with fallback adventure anime fetch:', err);
                        });
                });
            }
        });
}

// Function to determine rating color based on score
function getRatingColor(rating) {
    if (rating >= 8) {
        return '#4CAF50'; // Green for high ratings
    } else if (rating >= 6) {
        return '#FFC107'; // Yellow/amber for decent ratings
    } else if (rating >= 4) {
        return '#FF9800'; // Orange for average ratings
    } else {
        return '#F44336'; // Red for poor ratings
    }
}

// Function to handle search
function initSearch() {
    searchInput.addEventListener('input', () => {
        handleSearchInput();
    });

    // Add event listener for Enter key press in search input
    searchInput.addEventListener('keyup', async event => {
        if (event.key === 'Enter') {
            handleSearchInput();
        }
    });

    // Event listener for search input focus to reshow results if there was a query
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value;
        if (query.length > 2) {
            // Re-show search results if they were previously hidden
            fetchSearchResults(query).then(results => {
                if (results.length !== 0) {
                    displaySearchResults(results);
                    searchResults.style.visibility = "visible";
                }
            });
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', event => {
        // Check if the click is on search input - don't close if it is
        if (event.target === searchInput) {
            return;
        }

        // Don't close search if clicking on search results or one of their children
        if (searchResults.contains(event.target)) {
            return;
        }

        // Close the search results if clicking elsewhere
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    });
}

// Function to handle search input
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

// Function to fetch search results for anime
async function fetchSearchResults(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${query}&with_genres=16`);
        const data = await response.json();

        // Filter results to only those with posters/backdrops
        return (data.results || [])
            .filter(item => item.poster_path || item.backdrop_path)
            .slice(0, 6); // Limit to 6 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found</p>';
        searchResults.style.visibility = "visible";
        return;
    }

    results.forEach(result => {
        const shortenedTitle = result.name || result.title || 'Unknown Title';
        const date = result.first_air_date || result.release_date || '';
        let year = '';
        if (date) {
            year = new Date(date).getFullYear();
        }

        const movieItem = document.createElement('div');
        // Create HTML structure for each item
        movieItem.innerHTML = `<div class="search-item-thumbnail">
                                <img src="${result.poster_path
                                    ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                                    : result.backdrop_path
                                        ? `https://image.tmdb.org/t/p/w300${result.backdrop_path}`
                                        : 'https://via.placeholder.com/92x138?text=No+Image'}">
                            </div>
                            <div class="search-item-info">
                                <h3>${shortenedTitle}</h3>
                                <p>anime <span> &nbsp; ${year}</span></p>
                            </div>
                            <button class="watchListBtn" id="${result.id}">Add to WatchList</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            // Get the watchlist from local storage
            const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

            // Check if the movie is not already in the WatchList list
            if (!watchlist.find(item => item.id === result.id)) {
                watchlist.push({
                    id: result.id,
                    title: shortenedTitle,
                    poster_path: result.poster_path
                        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                        : result.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${result.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image',
                    media_type: 'tv',
                    release_date: date
                });
                localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
                watchListBtn.textContent = "Go to WatchList";
                watchListBtn.addEventListener('click', () => {
                    window.location.href = '../watchList/watchlist.html'; // Navigate to the WatchList page
                });
            } else {
                window.location.href = '../watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${result.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${result.id}`;
        });

        movieItem.setAttribute('class', 'movie-list');

        // Append movie item to search results
        searchResults.appendChild(movieItem);
    });

    searchResults.style.visibility = "visible";
}

// Function to add back to top button
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
