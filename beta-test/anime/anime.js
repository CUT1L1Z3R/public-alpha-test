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

// AniList GraphQL API endpoint
const ANILIST_API_URL = 'https://graphql.anilist.co';

// TMDB API configuration
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE'; // Replace with your actual TMDB API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280'; // Use highest quality images

// Jikan API configuration (MyAnimeList API)
const JIKAN_API_URL = 'https://api.jikan.moe/v4';

// Kitsu API configuration
const KITSU_API_URL = 'https://kitsu.io/api/edge';

// Rate limiting for API calls
const API_CALL_DELAY = 200; // 200ms delay between API calls
let lastAPICall = 0;

// Helper function to enforce rate limiting
async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - lastAPICall;
    if (timeSinceLastCall < API_CALL_DELAY) {
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY - timeSinceLastCall));
    }
    lastAPICall = Date.now();
}

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

// Helper function to search Jikan API for anime titles
async function searchJikanForAnime(title, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            // Enforce rate limiting
            await enforceRateLimit();
            
            // Clean the title for better search results
            const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
            const encodedTitle = encodeURIComponent(cleanTitle);

            const url = `${JIKAN_API_URL}/anime?q=${encodedTitle}&limit=5&type=tv`;

            console.log(`Searching Jikan for: ${cleanTitle}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Jikan HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Look for the best match based on title similarity
            const animeResults = data.data?.filter(result => {
                return result.images && 
                       (result.images.jpg || result.images.webp) && 
                       result.title;
            }) || [];

            if (animeResults.length > 0) {
                // Return the first match with the highest quality images
                const match = animeResults[0];
                console.log(`Found Jikan match for "${title}": ${match.title}`);
                
                // Get the highest quality images available
                const images = match.images;
                const jpgImages = images.jpg || {};
                const webpImages = images.webp || {};
                
                return {
                    // Prefer WebP for better quality and compression
                    large_image_url: webpImages.large_image_url || jpgImages.large_image_url,
                    image_url: webpImages.image_url || jpgImages.image_url,
                    small_image_url: webpImages.small_image_url || jpgImages.small_image_url,
                    jikan_id: match.mal_id,
                    jikan_title: match.title,
                    trailer: match.trailer
                };
            }

            console.log(`No Jikan results found for: ${title}`);
            return null;
        } catch (error) {
            console.warn(`Jikan search failed for "${title}" (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                return null;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Helper function to search Kitsu API for anime titles
async function searchKitsuForAnime(title, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            // Enforce rate limiting
            await enforceRateLimit();
            
            // Clean the title for better search results
            const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
            const encodedTitle = encodeURIComponent(cleanTitle);

            const url = `${KITSU_API_URL}/anime?filter[text]=${encodedTitle}&page[limit]=3`;

            console.log(`Searching Kitsu for: ${cleanTitle}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Kitsu HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.data && data.data.length > 0) {
                // Return the first match with the highest quality images
                const match = data.data[0];
                const attributes = match.attributes;
                
                console.log(`Found Kitsu match for "${title}": ${attributes.canonicalTitle}`);
                
                // Get the highest quality images available
                const posterImage = attributes.posterImage;
                const coverImage = attributes.coverImage;
                
                return {
                    // Prefer original size, then large, then medium
                    poster_original: posterImage?.original,
                    poster_large: posterImage?.large,
                    poster_medium: posterImage?.medium,
                    cover_original: coverImage?.original,
                    cover_large: coverImage?.large,
                    cover_medium: coverImage?.medium,
                    kitsu_id: match.id,
                    kitsu_title: attributes.canonicalTitle
                };
            }

            console.log(`No Kitsu results found for: ${title}`);
            return null;
        } catch (error) {
            console.warn(`Kitsu search failed for "${title}" (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                return null;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Helper function to search TMDB for anime titles
async function searchTMDBForAnime(title, retries = 2) {
    // Skip TMDB search if API key is not configured
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE' || !TMDB_API_KEY) {
        console.log('TMDB API key not configured, skipping TMDB search');
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            // Enforce rate limiting
            await enforceRateLimit();
            
            // Clean the title for better TMDB search results
            const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
            const encodedTitle = encodeURIComponent(cleanTitle);

            const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodedTitle}&with_genres=16&language=en-US`;

            console.log(`Searching TMDB for: ${cleanTitle}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`TMDB HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Filter results by Animation genre (genre ID 16) and look for close title matches
            const animeResults = data.results?.filter(result => {
                return result.genre_ids?.includes(16) && // Animation genre
                       result.poster_path && // Has poster image
                       result.name; // Has a name
            }) || [];

            if (animeResults.length > 0) {
                // Return the first match
                const match = animeResults[0];
                console.log(`Found TMDB match for "${title}": ${match.name}`);
                return {
                    poster_path: TMDB_IMAGE_BASE_URL + match.poster_path,
                    // Use the highest quality backdrop available
                    backdrop_path: match.backdrop_path ? 'https://image.tmdb.org/t/p/original' + match.backdrop_path : null,
                    tmdb_id: match.id,
                    tmdb_name: match.name
                };
            }

            console.log(`No TMDB results found for: ${title}`);
            return null;
        } catch (error) {
            console.warn(`TMDB search failed for "${title}" (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                return null;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Helper function to get the best banner image from multiple sources
async function getBestBannerImage(anime, type = 'banner') {
    const title = anime.title?.english || anime.title?.romaji || anime.title?.native || anime.title;
    console.log(`\n🔍 Searching for ${type} images for: ${title}`);
    
    const imageOptions = [];
    
    // 1. Try Jikan API first (MyAnimeList has high-quality images)
    try {
        const jikanResult = await searchJikanForAnime(title);
        if (jikanResult) {
            if (jikanResult.large_image_url) {
                imageOptions.push({
                    url: jikanResult.large_image_url,
                    source: 'Jikan (large)',
                    quality: 'high'
                });
            }
            if (jikanResult.image_url && jikanResult.image_url !== jikanResult.large_image_url) {
                imageOptions.push({
                    url: jikanResult.image_url,
                    source: 'Jikan (medium)',
                    quality: 'medium'
                });
            }
        }
    } catch (error) {
        console.warn('Jikan search failed:', error);
    }
    
    // 1.5. Try Kitsu API (often has high-quality cover images)
    try {
        const kitsuResult = await searchKitsuForAnime(title);
        if (kitsuResult) {
            if (type === 'banner' && kitsuResult.cover_original) {
                imageOptions.push({
                    url: kitsuResult.cover_original,
                    source: 'Kitsu (cover original)',
                    quality: 'high'
                });
            }
            if (kitsuResult.poster_original) {
                imageOptions.push({
                    url: kitsuResult.poster_original,
                    source: 'Kitsu (poster original)',
                    quality: 'high'
                });
            }
            if (type === 'banner' && kitsuResult.cover_large) {
                imageOptions.push({
                    url: kitsuResult.cover_large,
                    source: 'Kitsu (cover large)',
                    quality: 'medium-high'
                });
            }
            if (kitsuResult.poster_large) {
                imageOptions.push({
                    url: kitsuResult.poster_large,
                    source: 'Kitsu (poster large)',
                    quality: 'medium-high'
                });
            }
        }
    } catch (error) {
        console.warn('Kitsu search failed:', error);
    }
    
    // 2. Try TMDB for backdrop if looking for banner
    if (type === 'banner') {
        try {
            const tmdbResult = await searchTMDBForAnime(title);
            if (tmdbResult?.backdrop_path) {
                imageOptions.push({
                    url: tmdbResult.backdrop_path,
                    source: 'TMDB (backdrop)',
                    quality: 'high'
                });
            }
        } catch (error) {
            console.warn('TMDB search failed:', error);
        }
    }
    
    // 3. AniList banner (if available)
    if (anime.bannerImage) {
        imageOptions.push({
            url: anime.bannerImage,
            source: 'AniList (banner)',
            quality: 'variable'
        });
    }
    
    // 4. AniList cover images as fallback
    if (anime.coverImage?.extraLarge) {
        imageOptions.push({
            url: anime.coverImage.extraLarge,
            source: 'AniList (extraLarge)',
            quality: 'high'
        });
    }
    if (anime.coverImage?.large) {
        imageOptions.push({
            url: anime.coverImage.large,
            source: 'AniList (large)',
            quality: 'medium'
        });
    }
    
    // Test each image option and return the first one that loads successfully
    for (const option of imageOptions) {
        console.log(`📊 Testing image: ${option.source} - ${option.url}`);
        
        try {
            const isValid = await testImageURL(option.url);
            if (isValid) {
                console.log(`✅ Using ${option.source} for ${title}: ${option.url}`);
                return option.url;
            }
        } catch (error) {
            console.warn(`❌ Failed to load ${option.source}:`, error.message);
        }
    }
    
    // Final fallback
    const fallbackUrl = 'https://via.placeholder.com/1920x800/333333/ffffff?text=Image+Not+Available';
    console.log(`🔄 Using fallback image for ${title}`);
    return fallbackUrl;
}

// Helper function to test if an image URL is valid and accessible
function testImageURL(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log(`📐 Image loaded: ${img.naturalWidth}x${img.naturalHeight} - ${url}`);
            resolve(true);
        };
        
        img.onerror = function() {
            reject(new Error(`Failed to load image: ${url}`));
        };
        
        // Set timeout to avoid hanging
        setTimeout(() => {
            reject(new Error(`Image load timeout: ${url}`));
        }, 10000);
        
        img.src = url;
    });
}

// Helper function to get the best poster image with improved quality
async function getBestPosterImage(anime) {
    return await getBestBannerImage(anime, 'poster');
}

// Function to run image quality tests and report findings
async function runImageQualityTest() {
    console.log('\n🧪 Running Banner Image Quality Test...\n');
    
    const testTitles = [
        'Attack on Titan',
        'Demon Slayer',
        'One Piece', 
        'Naruto',
        'Dragon Ball'
    ];
    
    for (const title of testTitles) {
        console.log(`\n🔍 Testing image sources for: ${title}`);
        
        // Test each API source
        const sources = [];
        
        try {
            const jikan = await searchJikanForAnime(title);
            if (jikan?.large_image_url) {
                sources.push({ name: 'Jikan', url: jikan.large_image_url });
            }
        } catch (e) {
            console.warn('Jikan test failed:', e.message);
        }
        
        try {
            const kitsu = await searchKitsuForAnime(title);
            if (kitsu?.poster_original) {
                sources.push({ name: 'Kitsu', url: kitsu.poster_original });
            }
        } catch (e) {
            console.warn('Kitsu test failed:', e.message);
        }
        
        try {
            const tmdb = await searchTMDBForAnime(title);
            if (tmdb?.backdrop_path) {
                sources.push({ name: 'TMDB', url: tmdb.backdrop_path });
            }
        } catch (e) {
            console.warn('TMDB test failed:', e.message);
        }
        
        // Test each source
        for (const source of sources) {
            try {
                const isValid = await testImageURL(source.url);
                if (isValid) {
                    console.log(`✅ ${source.name}: Working`);
                } else {
                    console.log(`❌ ${source.name}: Failed`);
                }
            } catch (error) {
                console.log(`❌ ${source.name}: ${error.message}`);
            }
        }
    }
    
    console.log('\n🏁 Image Quality Test Complete\n');
}

// Add test function to window for manual testing
if (typeof window !== 'undefined') {
    window.runImageQualityTest = runImageQualityTest;
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
                        extraLarge
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
                .filter(anime => anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large)
                .slice(0, 9)
                .map(anime => ({
                    id: anime.id,
                    title: anime.title.english || anime.title.romaji || anime.title.native,
                    backdrop_path: anime.bannerImage,
                    poster_path: anime.coverImage?.extraLarge || anime.coverImage?.large,
                    vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
                    overview: anime.description,
                    mediaType: 'anime',
                    episodes: anime.episodes,
                    status: anime.status,
                    format: anime.format,
                    startDate: anime.startDate,
                    originalAnime: anime // Keep reference to original data
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

    bannerPrev.addEventListener('click', async () => {
        currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
        await showBannerAtIndex(currentBannerIndex);
    });

    bannerNext.addEventListener('click', async () => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
        await showBannerAtIndex(currentBannerIndex);
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
async function initializeAnimeSections() {
    // Initialize anime sections - run in parallel for better performance
    const sectionPromises = [
        fetchAnime('anime-popular-season-container', 'popular_season'),
        fetchAnime('anime-latest-episodes-container', 'latest_episodes'),
        fetchAnime('anime-recently-added-container', 'recently_added'),
        fetchAnime('anime-upcoming-new-container', 'truly_upcoming'),
        fetchAnime('top-rated-anime-movie-container', 'top_rated_anime_movies'),
        fetchAnime('anime-popular-container', 'popular'),
        fetchAnime('anime-top-container', 'top_rated'),
        fetchAnime('anime-upcoming-container', 'upcoming'),
        fetchAnime('adventure-anime-container', 'adventure'),
        fetchAnime('drama-anime-container', 'drama'),
        fetchAnime('anime-comedy-container', 'comedy'),
        fetchAnime('anime-romance-container', 'romance')
    ];

    // Wait for all sections to load
    try {
        await Promise.all(sectionPromises);
        console.log('All anime sections loaded successfully');
    } catch (error) {
        console.error('Error loading some anime sections:', error);
    }

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
        bannerInterval = setInterval(async () => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            await showBannerAtIndex(currentBannerIndex);
        }, 8000); // Change banner every 8 seconds
    }
}

// Function to show banner at specific index with enhanced styling
async function showBannerAtIndex(index) {
    const item = bannerItems[index];
    if (item) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        console.log(`\n🎬 Loading banner for: ${item.title}`);
        
        // Set loading state
        banner.style.opacity = '0.3';
        
        try {
            // Use our enhanced image selection function
            const imageUrl = await getBestBannerImage(item.originalAnime || item, 'banner');
            
            // Preload the image to ensure it's fully loaded before displaying
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = function() {
                banner.src = imageUrl;
                banner.style.opacity = '1';
                console.log(`🎉 Successfully loaded banner: ${img.naturalWidth}x${img.naturalHeight} - ${imageUrl}`);
            };

            img.onerror = function() {
                console.error(`💥 Failed to load final banner image: ${imageUrl}`);
                banner.src = 'https://via.placeholder.com/1920x800/333333/ffffff?text=Image+Not+Available';
                banner.style.opacity = '1';
            };

            img.src = imageUrl;
        } catch (error) {
            console.error('Error loading banner:', error);
            banner.src = 'https://via.placeholder.com/1920x800/333333/ffffff?text=Error+Loading+Image';
            banner.style.opacity = '1';
        }

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
async function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with AniList API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    // Determine AniList query parameters based on the input
    let query = '';
    let variables = {};

    if (genreOrKeyword === 'popular_season') {
        // Get current season and year
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        // Determine season based on month
        let season;
        if (currentMonth >= 1 && currentMonth <= 3) {
            season = 'WINTER';
        } else if (currentMonth >= 4 && currentMonth <= 6) {
            season = 'SPRING';
        } else if (currentMonth >= 7 && currentMonth <= 9) {
            season = 'SUMMER';
        } else {
            season = 'FALL';
        }

        query = `
            query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
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
                            month
                            day
                        }
                        description
                        season
                        seasonYear
                    }
                }
            }
        `;
        variables = { page: 1, perPage: 20, season: season, year: currentYear };
    } else if (genreOrKeyword === 'latest_episodes') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    airingSchedules(sort: TIME_DESC, notYetAired: false) {
                        id
                        airingAt
                        episode
                        media {
                            id
                            title {
                                romaji
                                english
                                native
                            }
                            coverImage {
                                extraLarge
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
                                month
                                day
                            }
                            description
                            nextAiringEpisode {
                                episode
                                airingAt
                            }
                        }
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
    } else if (genreOrKeyword === 'recently_added') {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: START_DATE_DESC, isAdult: false, status_in: [FINISHED, RELEASING]) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            extraLarge
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
                            month
                            day
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
                            extraLarge
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
        .then(async data => {
            let animeResults = [];

            if (genreOrKeyword === 'latest_episodes') {
                // Handle airingSchedules data structure
                const airingSchedules = data.data?.Page?.airingSchedules || [];
                console.log(`Got airing schedules from AniList for ${containerClass}, found ${airingSchedules.length} items`);

                // Extract unique media from airing schedules
                const seenIds = new Set();
                animeResults = airingSchedules
                    .filter(schedule => schedule.media && !seenIds.has(schedule.media.id))
                    .map(schedule => {
                        seenIds.add(schedule.media.id);
                        return {
                            ...schedule.media,
                            lastEpisode: schedule.episode,
                            lastAiredAt: schedule.airingAt
                        };
                    });
            } else {
                // Handle normal media data structure
                animeResults = data.data?.Page?.media || [];
                console.log(`Got anime data from AniList for ${containerClass}, found ${animeResults.length} items`);
            }

            // Process each container
            for (const container of containers) {
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    continue;
                }

                // Filter out items without cover images
                const validResults = animeResults.filter(item => item.coverImage?.extraLarge || item.coverImage?.large || item.bannerImage);

                if (validResults.length === 0) {
                    console.warn(`No valid image results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content with images available at this time. Please try again later.</div>';
                    continue;
                }

                // Process anime items with TMDB integration
                const processAnimeItem = async (anime, container) => {
                    const title = anime.title.english || anime.title.romaji || anime.title.native || 'Unknown Title';

                    // Get the best poster image using TMDB fallback
                    const imageUrl = await getBestPosterImage(anime);

                    // Create the main item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply portrait dimensions for all anime containers
                    itemElement.style.width = '200px';  // Portrait width
                    itemElement.style.height = '300px'; // Portrait height (2:3 aspect ratio)

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
                        this.src = 'https://via.placeholder.com/200x300?text=Image+Error';
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
                };

                // Process items in small batches to prevent overwhelming TMDB API
                const batchSize = 5;
                for (let i = 0; i < validResults.length; i += batchSize) {
                    const batch = validResults.slice(i, i + batchSize);
                    const promises = batch.map(anime => processAnimeItem(anime, container));
                    await Promise.all(promises);

                    // Small delay between batches to be respectful to APIs
                    if (i + batchSize < validResults.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
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
    searchInput.addEventListener('focus', async () => {
        const query = searchInput.value;
        if (query.length > 2) {
            // Re-show search results if they were previously hidden
            try {
                const results = await fetchSearchResults(query);
                if (results.length !== 0) {
                    await displaySearchResults(results);
                    searchResults.style.visibility = "visible";
                }
            } catch (error) {
                console.error('Error re-showing search results:', error);
            }
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
        await displaySearchResults(results);
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
                            extraLarge
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
            .filter(item => item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium)
            .slice(0, 6); // Limit to 6 results
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
async function displaySearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found</p>';
        searchResults.style.visibility = "visible";
        return;
    }

    // Process search results with TMDB integration
    for (const result of results) {
        const shortenedTitle = result.title.english || result.title.romaji || result.title.native || 'Unknown Title';
        const year = result.startDate?.year || '';

        // Get the best poster image using TMDB fallback
        const imageUrl = await getBestPosterImage(result);

        const movieItem = document.createElement('div');
        // Create HTML structure for each item using enhanced image data
        movieItem.innerHTML = `<div class="search-item-thumbnail">
                                <img src="${imageUrl}">
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
                    poster_path: result.coverImage?.extraLarge || result.coverImage?.large || result.coverImage?.medium || 'https://via.placeholder.com/500x750?text=No+Image',
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
    }

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
