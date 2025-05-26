/**
 * JavaScript file for the anime page of the FreeFlix streaming site.
 * Handles fetching, displaying, and UI interactions for anime.
 */

// Enhanced TMDB and AniList integration
import tmdbService from '../services/tmdb-service.js';
import posterEnhancer from '../utils/poster-enhancement.js';

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

// AniList GraphQL API endpoint
const ANILIST_API_URL = 'https://graphql.anilist.co';

// Enhancement statistics
let enhancementStats = {
    totalImages: 0,
    enhancedImages: 0,
    errors: 0
};

// Helper function to make AniList API requests with retry logic
async function makeAniListRequest(query, variables = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(ANILIST_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query, variables })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.errors) {
                throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
            }

            return data;
        } catch (error) {
            console.warn(`AniList API request failed (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                throw error;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

// Enhanced poster enhancement function
async function getEnhancedPoster(anime, options = {}) {
    try {
        enhancementStats.totalImages++;
        
        const result = await posterEnhancer.getEnhancedPoster(anime, {
            preferredSize: 'LARGE',
            timeoutMs: 3000,
            ...options
        });
        
        if (result.source === 'tmdb') {
            enhancementStats.enhancedImages++;
            console.log(`🎯 Enhanced poster quality for: ${posterEnhancer.extractTitle(anime)}`);
        }
        
        return result.url;
        
    } catch (error) {
        enhancementStats.errors++;
        console.warn('Poster enhancement failed:', error.message);
        
        // Fallback to AniList image
        return posterEnhancer.extractOriginalPoster(anime) || posterEnhancer.getPlaceholderImage();
    }
}

// Legacy function for backward compatibility
async function getTMDBPoster(animeTitle, year = null) {
    try {
        const fakeAnime = {
            title: { english: animeTitle },
            startDate: { year }
        };
        
        return await getEnhancedPoster(fakeAnime);
    } catch (error) {
        console.warn('Error in legacy TMDB function:', error);
        return null;
    }
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
});

// Initialize the anime page
function initAnimePage() {
    // Update banner for anime section
    updateBannerForAnime();

    // Initialize anime sections
    initializeAnimeSections();
}

// Update banner with upcoming anime using AniList API
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

    // GraphQL query for trending anime
    const query = `
        query {
            Page(page: 1, perPage: 10) {
                media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    bannerImage
                    coverImage {
                        large
                        medium
                    }
                    averageScore
                    startDate {
                        year
                        month
                        day
                    }
                    description
                    status
                    episodes
                    format
                }
            }
        }
    `;

    // Fetch trending anime from AniList
    makeAniListRequest(query)
        .then(data => {
            const animeList = data.data?.Page?.media || [];
            console.log('Trending anime fetched:', animeList.length);

            // Filter to anime with banner images, get up to 9 items
            bannerItems = animeList
                .filter(anime => anime.bannerImage || anime.coverImage?.large)
                .slice(0, 9)
                .map(anime => ({
                    id: anime.id,
                    title: anime.title.english || anime.title.romaji || anime.title.native,
                    backdrop_path: anime.bannerImage,
                    poster_path: anime.coverImage?.large,
                    vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
                    overview: anime.description,
                    mediaType: 'anime',
                    episodes: anime.episodes,
                    status: anime.status,
                    format: anime.format,
                    startDate: anime.startDate
                }));

            if (bannerItems.length > 0) {
                showBannerAtIndex(0); // Show first banner
                startBannerSlideshow(); // Start auto-rotation
            }
        })
        .catch(error => {
            console.error('Error updating anime banner:', error);
            bannerTitle.textContent = 'Failed to load banner. Please try refreshing the page.';
        });

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
            window.location.href = `../movie_details/movie_details.html?media=anime&id=${item.id}`;
        }
    });

    moreInfoButton.addEventListener('click', () => {
        if (bannerItems.length > 0) {
            const item = bannerItems[currentBannerIndex];
            window.location.href = `../movie_details/movie_details.html?media=anime&id=${item.id}`;
        }
    });
}

// Initialize sections for anime
function initializeAnimeSections() {
    // Initialize anime sections
    fetchAnime('anime-upcoming-new-container', 'truly_upcoming');
    fetchAnime('recently-added-anime-container', 'recently_added'); // Add this new section
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
            });
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
    if (item && (item.backdrop_path || item.poster_path)) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        // Set banner image - prefer banner image, fallback to cover image
        const imageUrl = item.backdrop_path || item.poster_path;
        banner.src = imageUrl;

        // Create a more detailed title with additional info
        const title = item.title;

        // Add subtitle information if available
        const extraInfo = [];

        // Add year if available
        if (item.startDate && item.startDate.year) {
            extraInfo.push(item.startDate.year);
        }

        // Add format and status info
        if (item.format) {
            extraInfo.push(item.format);
        }

        if (item.status === 'RELEASING') {
            extraInfo.push('Currently Airing');
        } else if (item.status === 'NOT_YET_RELEASED') {
            extraInfo.push('Upcoming');
        } else if (item.status === 'FINISHED') {
            extraInfo.push('Completed');
        }

        // Add rating if available
        if (item.vote_average && item.vote_average > 0) {
            extraInfo.push(`⭐ ${item.vote_average.toFixed(1)}`);
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

                // Style status badges
                if (subtitleElement.textContent.includes('Currently Airing')) {
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Currently Airing',
                        '<span class="status-badge airing">Currently Airing</span>'
                    );
                } else if (subtitleElement.textContent.includes('Upcoming')) {
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Upcoming',
                        '<span class="status-badge upcoming">Upcoming</span>'
                    );
                }

                // Style the badges
                const badges = subtitleElement.querySelectorAll('.status-badge');
                badges.forEach(badge => {
                    badge.style.padding = '3px 8px';
                    badge.style.borderRadius = '4px';
                    badge.style.color = 'white';
                    badge.style.fontWeight = 'bold';
                    badge.style.marginRight = '3px';
                    badge.style.marginLeft = '3px';
                    badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';

                    if (badge.classList.contains('airing')) {
                        badge.style.backgroundColor = 'rgba(52, 152, 219, 0.9)'; // Blue for airing
                    } else if (badge.classList.contains('upcoming')) {
                        badge.style.backgroundColor = 'rgba(46, 204, 113, 0.9)'; // Green for upcoming
                    }
                });
            }
        } else {
            bannerTitle.textContent = title;
        }

        // Update the banner image to have better display
        banner.style.objectFit = 'cover';
        banner.style.transition = 'opacity 0.5s ease-in-out';
    }
}

// Function to fetch anime from AniList API
function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with AniList API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    // Determine AniList query parameters based on the input
    let query = '';
    let variables = {};

    if (genreOrKeyword === 'recently_added') {
        // Query for recently added anime based on when they were added to AniList database
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: [ID_DESC], isAdult: false, status_in: [FINISHED, RELEASING]) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                        createdAt
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'popular') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'top_rated') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: SCORE_DESC, isAdult: false, averageScore_greater: 70) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'upcoming') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'truly_upcoming') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'top_rated_anime_movies') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, format: MOVIE, sort: SCORE_DESC, isAdult: false, averageScore_greater: 70) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    } else if (genreOrKeyword === 'action') {
        query = `
            query ($page: Int, $perPage: Int, $genre: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, genre_in: $genre, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, genre: ["Action"] };
    } else if (genreOrKeyword === 'adventure') {
        query = `
            query ($page: Int, $perPage: Int, $genre: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, genre_in: $genre, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, genre: ["Adventure"] };
    } else if (genreOrKeyword === 'romance') {
        query = `
            query ($page: Int, $perPage: Int, $genre: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, genre_in: $genre, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, genre: ["Romance"] };
    } else if (genreOrKeyword === 'comedy') {
        query = `
            query ($page: Int, $perPage: Int, $genre: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, genre_in: $genre, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, genre: ["Comedy"] };
    } else if (genreOrKeyword === 'drama') {
        query = `
            query ($page: Int, $perPage: Int, $genre: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, genre_in: $genre, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, genre: ["Drama"] };
    } else {
        // Default query for general anime
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20 };
    }

    // Fetch anime data from AniList
    console.log(`Fetching anime from AniList for ${containerClass}`);
    makeAniListRequest(query, variables)
        .then(data => {
            console.log(`Got anime data from AniList for ${containerClass}, found ${data.data?.Page?.media ? data.data.Page.media.length : 0} items`);
            const animeResults = data.data?.Page?.media || [];

            containers.forEach(async (container) => {
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without cover images
                const validResults = animeResults.filter(item => item.coverImage?.large || item.bannerImage);

                if (validResults.length === 0) {
                    console.warn(`No valid image results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content with images available at this time. Please try again later.</div>';
                    return;
                }

                for (const anime of validResults) {
                    const title = anime.title.english || anime.title.romaji || anime.title.native || 'Unknown Title';

                    // Try to get enhanced TMDB poster first, fallback to AniList image
                    let imageUrl = anime.bannerImage || anime.coverImage?.large || anime.coverImage?.medium;

                    try {
                        const enhancedPoster = await getEnhancedPoster(anime, {
                            preferredSize: 'LARGE',
                            timeoutMs: 2000 // Shorter timeout for list items
                        });
                        
                        if (enhancedPoster) {
                            imageUrl = enhancedPoster;
                        }
                    } catch (error) {
                        console.warn('Failed to get enhanced poster for', title, error);
                    }

                    // Fallback to placeholder if no image
                    if (!imageUrl) {
                        imageUrl = posterEnhancer.getPlaceholderImage();
                    }

                    // Create the main item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply landscape dimensions for all anime containers
                    itemElement.style.width = '290px';  // Landscape width
                    itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)

                    // Set media type
                    if (containerClass === 'top-rated-anime-movie-container') {
                        itemElement.dataset.mediaType = 'movie';
                    } else {
                        itemElement.dataset.mediaType = 'anime';
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
                        this.src = 'https://via.placeholder.com/460x215?text=Image+Error';
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

                    // Format the rating (AniList uses 0-100, convert to 0-10)
                    const anilistScore = anime.averageScore || 0;
                    const formattedRating = anilistScore !== 0 ? (anilistScore / 10).toFixed(1) : 'N/A';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(parseFloat(formattedRating));
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

                    // Add click event to navigate to details page
                    itemElement.addEventListener('click', () => {
                        // For now, use the existing movie details page structure
                        // You might want to create a dedicated anime details page later
                        window.location.href = `../movie_details/movie_details.html?media=anime&id=${anime.id}`;
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching anime data:', error);
            containers.forEach(container => {
                container.innerHTML = `
                    <div style="color: white; padding: 20px; text-align: center; background: rgba(255,107,107,0.1); border: 1px solid #ff6b6b; border-radius: 8px; margin: 10px;">
                        <h3 style="color: #ff6b6b; margin-bottom: 10px;">Failed to load anime content</h3>
                        <p>Unable to connect to AniList API. This might be due to:</p>
                        <ul style="text-align: left; max-width: 300px; margin: 0 auto;">
                            <li>Network connectivity issues</li>
                            <li>AniList API temporary downtime</li>
                            <li>Browser blocking the request</li>
                        </ul>
                        <p style="margin-top: 15px;">
                            <button onclick="location.reload()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                                Try Again
                            </button>
                        </p>
                    </div>
                `;
            });
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

// Function to fetch search results for anime using AniList
async function fetchSearchResults(query) {
    try {
        const searchQuery = `
            query ($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, search: $search, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                            medium
                        }
                        bannerImage
                        averageScore
                        episodes
                        status
                        format
                        startDate {
                            year
                        }
                        description
                    }
                }
            }
        `;

        const variables = {
            search: query,
            page: 1,
            perPage: 6
        };

        const data = await makeAniListRequest(searchQuery, variables);

        // Filter results to only those with cover images
        return (data.data?.Page?.media || [])
            .filter(item => item.coverImage?.large || item.coverImage?.medium)
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
        const shortenedTitle = result.title.english || result.title.romaji || result.title.native || 'Unknown Title';
        const year = result.startDate?.year || '';

        const movieItem = document.createElement('div');
        // Create HTML structure for each item using AniList data
        movieItem.innerHTML = `<div class="search-item-thumbnail">
                                <img src="${result.coverImage?.medium || result.coverImage?.large || 'https://via.placeholder.com/92x138?text=No+Image'}">
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

            // Check if the anime is not already in the WatchList list
            if (!watchlist.find(item => item.id === result.id)) {
                watchlist.push({
                    id: result.id,
                    title: shortenedTitle,
                    poster_path: result.coverImage?.large || result.coverImage?.medium || 'https://via.placeholder.com/500x750?text=No+Image',
                    media_type: 'anime',
                    release_date: result.startDate?.year ? `${result.startDate.year}-01-01` : ''
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
            window.location.href = `../movie_details/movie_details.html?media=anime&id=${result.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=anime&id=${result.id}`;
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
