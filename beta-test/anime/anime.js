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

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing anime page...');
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
    console.log('Initializing anime page...');
    // Update banner for anime section
    updateBannerForAnime();

    // Initialize anime sections
    initializeAnimeSections();
}

// Update banner with Popular This Season anime
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

    // For Anime section, use Popular This Season anime for banner slideshow
    const today = new Date();
    const currentYear = today.getFullYear();

    // Get popular anime from 2022 onwards with broader criteria for better results
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&first_air_date.gte=2022-01-01&first_air_date.lte=${currentYear}-12-31&sort_by=popularity.desc&vote_count.gte=3`)
        .then(response => response.json())
        .then(data => {
            const popularSeasonAnimes = data.results || [];
            console.log('Popular This Season anime fetched:', popularSeasonAnimes.length);
            // Filter to animes with backdrop images, get up to 9 items
            bannerItems = popularSeasonAnimes.filter(anime => anime.backdrop_path).slice(0, 9).map(anime => ({
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
    console.log('Initializing anime sections...');
    fetchAnime('popular-season-container', 'popular_season');
    fetchAnime('latest-episodes-container', 'latest_episodes');
    fetchAnime('top-rated-anime-movie-container', 'top_rated_anime_movies');
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

        // Add "Popular This Season" tag for anime
        extraInfo.push('Popular This Season');

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

                // Style the "Popular This Season" tag for anime section
                if (subtitleElement.textContent.includes('Popular This Season')) {
                    // Create a span to style just the "Popular This Season" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Popular This Season',
                        '<span class="popular-season-badge">Popular This Season</span>'
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.popular-season-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(255, 193, 7, 0.9)'; // Gold/amber for popular content
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
// Function to get supplementary recent anime data
function getRecentAnimeSupplements(containerClass) {
    // Popular 2024-2025 anime IDs from TMDB
    const recentAnimeIds = {
        'popular_season': [136630, 240411, 206584, 158909, 95557, 153312, 221734, 222636, 213774, 208739],
        'top_rated': [136630, 240411, 206584, 158909, 95557, 153312, 221734, 222636, 213774, 208739],
        'upcoming': [240411, 206584, 158909, 95557, 153312, 221734, 222636, 213774, 208739, 136630],
        'latest_episodes': [136630, 240411, 206584, 158909, 95557, 153312, 221734, 222636, 213774, 208739],
        'romance': [206584, 158909, 95557, 153312, 221734, 222636, 213774, 136630],
        'comedy': [240411, 206584, 158909, 95557, 153312, 221734, 222636, 136630],
        'adventure': [136630, 240411, 206584, 158909, 95557, 153312, 221734, 222636],
        'drama': [206584, 158909, 95557, 153312, 221734, 222636, 213774, 136630]
    };

    return recentAnimeIds[containerClass] || recentAnimeIds['popular_season'];
}

// Function to fetch specific anime by IDs
async function fetchAnimeByIds(ids) {
    const animePromises = ids.slice(0, 8).map(async id => {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${api_Key}&append_to_response=external_ids`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log(`Error fetching anime ID ${id}:`, error);
        }
        return null;
    });

    const results = await Promise.all(animePromises);
    return results.filter(result => result !== null);
}

// Function to display anime results in containers
function displayAnimeResults(container, animeResults, containerClass) {
    container.innerHTML = ''; // Clear the container first to prevent duplicates

    // Process each anime item
    if (animeResults.length === 0) {
        console.warn(`No anime results found for ${containerClass}`);
        container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
        return;
    }

    // Filter out items without backdrop or poster images and apply anime filtering
    const validResults = animeResults.filter(item => {
        if (!item.poster_path && !item.backdrop_path) {
            return false;
        }

        // Additional anime filtering
        const name = (item.name || item.title || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();

        // Exclude western animation keywords
        const westernKeywords = [
            'disney', 'pixar', 'dreamworks', 'cartoon network', 'nickelodeon',
            'adult swim', 'south park', 'family guy', 'simpsons', 'american dad',
            'rick and morty', 'futurama', 'bob burgers', 'archer',
            'american', 'canadian', 'british', 'french', 'german', 'european',
            'spider-man', 'spiderman', 'spider man', 'across the spider', 'into the spider',
            'marvel', 'dc comics', 'batman', 'superman', 'wonder woman',
            'x-men', 'iron man', 'captain america', 'thor', 'hulk',
            'avengers', 'guardians of the galaxy', 'fantastic four',
            'teenage mutant ninja turtles', 'tmnt', 'transformers',
            'my little pony', 'mlp', 'friendship is magic',
            'spongebob', 'patrick star', 'adventure time', 'regular show',
            'steven universe', 'gravity falls', 'phineas and ferb',
            'kim possible', 'danny phantom', 'fairly oddparents',
            'powerpuff girls', 'dexter laboratory', 'johnny bravo',
            'courage the cowardly dog', 'ed edd and eddy',
            'teen titans go', 'ben 10', 'generator rex',
            'samurai jack', 'foster home', 'chowder',
            'flapjack', 'clarence', 'uncle grandpa', 'we bare bears',
            'over the garden wall', 'infinity train', 'amphibia',
            'the owl house', 'ducktales', 'darkwing duck',
            'gargoyles', 'recess', 'pepper ann', 'house of mouse',
            'lilo and stitch', 'atlantis', 'treasure planet',
            'bolt', 'frozen', 'tangled', 'moana', 'encanto',
            'raya and the last dragon', 'turning red', 'luca',
            'soul', 'onward', 'coco', 'finding nemo', 'finding dory',
            'monsters inc', 'toy story', 'cars', 'wall-e', 'up',
            'inside out', 'the good dinosaur', 'brave', 'ratatouille',
            'the incredibles', 'shrek', 'madagascar', 'kung fu panda',
            'how to train your dragon', 'trolls', 'the croods',
            'minions', 'despicable me', 'sing', 'rio', 'ice age',
            'epic', 'the nut job', 'open season', 'cloudy with',
            'hotel transylvania', 'the smurfs', 'alvin and the chipmunks',
            'scooby-doo', 'tom and jerry', 'looney tunes', 'bugs bunny',
            'daffy duck', 'porky pig', 'tweety', 'sylvester',
            'pepe le pew', 'foghorn leghorn', 'marvin the martian',
            'yosemite sam', 'speedy gonzales', 'road runner',
            'wile e coyote', 'tasmanian devil', 'lola bunny'
        ];

        const hasWesternKeywords = westernKeywords.some(keyword =>
            name.includes(keyword) || overview.includes(keyword)
        );

        if (hasWesternKeywords) {
            return false;
        }

        // Check origin country - prefer Japanese content
        const originCountry = item.origin_country || [];
        const isFromJapan = originCountry.includes('JP');
        const westernCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'NZ'];
        const isFromWesternCountry = westernCountries.some(country =>
            originCountry.includes(country)
        );

        // If from western country, exclude unless it has clear anime indicators
        if (isFromWesternCountry) {
            const animeKeywords = ['anime', 'manga', 'japanese', 'japan'];
            const hasAnimeKeywords = animeKeywords.some(keyword =>
                name.includes(keyword) || overview.includes(keyword)
            );
            return hasAnimeKeywords;
        }

        return true; // Allow other content (including Japanese)
    });

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

        // Add click event to navigate to details page
        itemElement.addEventListener('click', () => {
            if (containerClass === 'top-rated-anime-movie-container') {
                window.location.href = `../movie_details/movie_details.html?media=movie&id=${anime.id}`;
            } else {
                window.location.href = `../movie_details/movie_details.html?media=tv&id=${anime.id}`;
            }
        });
    });
}

// Special function to fetch the latest anime episodes using multiple approaches
async function fetchLatestAnimeEpisodes(containers, containerClass) {
    console.log(`Fetching latest anime episodes for ${containerClass} with enhanced TMDB API calls`);

    // Show loading indicator
    containers.forEach(container => {
        container.innerHTML = '<div style="color: white; padding: 40px; text-align: center; font-size: 1.1rem;"><div style="margin-bottom: 15px;">🔄 Loading latest anime episodes...</div><div style="font-size: 0.9rem; color: #ccc;">Fetching most recent content with smart fallbacks</div></div>';
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get current date components for more precise queries
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Focus on super recent content - past 1-2 weeks maximum
    const past3Days = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastTwoWeeks = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const endpoints = [
        // Currently airing anime today - with anime keyword to ensure anime only
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${todayStr}&sort_by=first_air_date.desc`,

        // Anime that aired in the past 3 days (super recent) - no vote requirement
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${past3Days}&air_date.lte=${todayStr}&sort_by=first_air_date.desc`,

        // Anime that aired this week (past 7 days) - minimal vote requirement
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastWeek}&air_date.lte=${todayStr}&sort_by=first_air_date.desc&vote_count.gte=1`,

        // Anime that aired in the past 2 weeks (maximum range)
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastTwoWeeks}&air_date.lte=${todayStr}&sort_by=first_air_date.desc&vote_count.gte=3`,

        // Currently ongoing anime series with recent episodes
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_status=0&air_date.gte=${pastTwoWeeks}&sort_by=first_air_date.desc&vote_count.gte=5`
    ];

    try {
        // Fetch from all endpoints and combine results
        const promises = endpoints.map(endpoint =>
            fetch(`https://api.themoviedb.org/3/${endpoint}`)
                .then(response => response.ok ? response.json() : { results: [] })
                .catch(() => ({ results: [] }))
        );

        const results = await Promise.all(promises);
        let allAnime = [];

        // Combine all results
        results.forEach((data, index) => {
            if (data.results && data.results.length > 0) {
                console.log(`Endpoint ${index + 1} returned ${data.results.length} anime`);
                allAnime = allAnime.concat(data.results);
            }
        });

        // Fallback: If we don't have enough content, fetch popular anime as backup
        if (allAnime.length < 10) {
            console.log(`Only ${allAnime.length} anime found, fetching popular anime as fallback...`);
            try {
                const fallbackResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2024-01-01&sort_by=popularity.desc&vote_count.gte=5`);
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.results) {
                        console.log(`Fallback returned ${fallbackData.results.length} popular anime`);
                        allAnime = allAnime.concat(fallbackData.results);
                    }
                }
            } catch (error) {
                console.log('Fallback request failed:', error);
            }
        }

        // Remove duplicates based on ID
        let uniqueAnime = allAnime.filter((anime, index, self) =>
            index === self.findIndex(a => a.id === anime.id)
        );

        // Additional filtering to ensure only anime content
        uniqueAnime = uniqueAnime.filter(anime => {
            const name = (anime.name || anime.title || '').toLowerCase();
            const overview = (anime.overview || '').toLowerCase();

            // Filter out common non-anime content keywords
            const nonAnimeKeywords = [
                'documentary', 'reality', 'news', 'talk show', 'game show',
                'cooking', 'travel', 'sports', 'politics', 'history channel',
                'discovery', 'national geographic', 'bbc', 'cnn', 'fox news',
                'cooking show', 'reality tv', 'talent show', 'competition',
                'live action', 'western animation', 'american animation',
                'cartoon network', 'nickelodeon', 'disney channel', 'disney',
                'pixar', 'dreamworks', 'adult swim', 'comedy central',
                'south park', 'family guy', 'the simpsons', 'american dad',
                'rick and morty', 'futurama', 'king of the hill',
                'bob burgers', 'archer', 'venture bros', 'robot chicken',
                'american', 'canadian', 'french', 'german', 'british',
                'european', 'western', 'english dub', 'cartoon',
                'animated series', 'animated movie', 'cgi', '3d animation'
            ];

            // Check if it contains non-anime keywords
            const hasNonAnimeKeywords = nonAnimeKeywords.some(keyword =>
                name.includes(keyword) || overview.includes(keyword)
            );

            // Filter out content that's clearly not anime
            if (hasNonAnimeKeywords) {
                return false;
            }

            // Prefer content with Japanese origin indicators or anime-related keywords
            const animeKeywords = [
                'anime', 'manga', 'japanese', 'japan', 'studio', 'toei',
                'mappa', 'madhouse', 'bones', 'wit studio', 'pierrot',
                'shonen', 'seinen', 'shoujo', 'josei', 'ova', 'ona',
                'kyoto animation', 'studio ghibli', 'sunrise', 'trigger',
                'cloverworks', 'a-1 pictures', 'ufotable', 'shaft',
                'silver link', 'doga kobo', 'brains base', 'j.c.staff',
                'production i.g', 'gainax', 'lerche', 'white fox',
                'nippon animation', 'tms entertainment', 'studio deen'
            ];

            const hasAnimeKeywords = animeKeywords.some(keyword =>
                name.includes(keyword) || overview.includes(keyword)
            );

            // If it has anime keywords, definitely include
            if (hasAnimeKeywords) {
                return true;
            }

            // For content without clear indicators, check origin country
            const originCountry = anime.origin_country || [];
            const isFromJapan = originCountry.includes('JP');

            // Exclude content from clearly non-Japanese countries
            const westernCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'NZ'];
            const isFromWesternCountry = westernCountries.some(country =>
                originCountry.includes(country)
            );

            // If it's from a western country and doesn't have anime keywords, exclude it
            if (isFromWesternCountry && !hasAnimeKeywords) {
                return false;
            }

            // Include only if from Japan
            return isFromJapan;
        });

        // First try: Filter for very recent content (past 14 days)
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        let recentAnime = uniqueAnime.filter(anime => {
            const airDate = new Date(anime.first_air_date || anime.air_date || '1970-01-01');
            return airDate >= twoWeeksAgo;
        });

        // Fallback: If not enough recent content, expand to past 2 months but prioritize recent
        if (recentAnime.length < 5) {
            console.log(`Only ${recentAnime.length} anime from past 2 weeks, expanding search range...`);
            const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
            uniqueAnime = uniqueAnime.filter(anime => {
                const airDate = new Date(anime.first_air_date || anime.air_date || '1970-01-01');
                return airDate >= twoMonthsAgo;
            });
        } else {
            uniqueAnime = recentAnime;
        }

        // Sort by most recent air date with heavy preference for super recent content
        uniqueAnime.sort((a, b) => {
            const dateA = new Date(a.first_air_date || a.air_date || '1970-01-01');
            const dateB = new Date(b.first_air_date || b.air_date || '1970-01-01');

            // Calculate how recent each anime is (in days)
            const nowTime = today.getTime();
            const daysAgoA = Math.floor((nowTime - dateA.getTime()) / (24 * 60 * 60 * 1000));
            const daysAgoB = Math.floor((nowTime - dateB.getTime()) / (24 * 60 * 60 * 1000));

            // Give massive priority to anime from past 3 days
            if (daysAgoA <= 3 && daysAgoB > 3) return -1;
            if (daysAgoB <= 3 && daysAgoA > 3) return 1;

            // Then priority to anime from past week
            if (daysAgoA <= 7 && daysAgoB > 7) return -1;
            if (daysAgoB <= 7 && daysAgoA > 7) return 1;

            // Within same time range, sort by date (most recent first)
            if (dateB.getTime() !== dateA.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }

            // Then by popularity as tiebreaker
            return (b.popularity || 0) - (a.popularity || 0);
        });

        // Take top 20 most recent
        const latestAnime = uniqueAnime.slice(0, 20);

        console.log(`Filtered to ${latestAnime.length} anime episodes with recent content priority`);

        // Log air dates of first few items for debugging
        if (latestAnime.length > 0) {
            console.log('Most recent anime:', latestAnime.slice(0, 3).map(anime => ({
                name: anime.name || anime.title,
                air_date: anime.first_air_date || anime.air_date,
                popularity: anime.popularity
            })));
        }

        // Display the results with success message
        console.log(`Successfully fetched and processed ${latestAnime.length} latest anime episodes`);
        containers.forEach(container => {
            displayAnimeResults(container, latestAnime, containerClass);
        });

    } catch (error) {
        console.error('Error fetching latest anime episodes:', error);
        containers.forEach(container => {
            container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Unable to load latest episodes. Please try again later.</div>';
        });
    }
}

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
        // For popular anime, use discover with animation genre + anime keyword and sort by popularity (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'top_rated') {
        // For top rated anime, use discover with animation genre + anime keyword sorted by rating (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=vote_average.desc&vote_count.gte=10`;
    } else if (genreOrKeyword === 'upcoming') {
        // For ongoing anime (renamed from upcoming), use discover with recent and ongoing air dates (from 2022+)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&air_date.lte=${dateStr}&with_status=0&sort_by=popularity.desc`;
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
        // Action anime (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,28&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'romance') {
        // Romance anime (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'comedy') {
        // Comedy anime (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'top_rated_anime_movies') {
        // Top rated anime movies (from 2022+)
        endpoint = `discover/movie?api_key=${api_Key}&with_genres=16&with_origin_country=JP&primary_release_date.gte=2022-01-01&sort_by=vote_average.desc&vote_count.gte=10`;
    } else if (genreOrKeyword === 'adventure') {
        // Action & Adventure anime - combining action and adventure genres (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10759&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc&vote_count.gte=5`;
        // Genres: 16=Animation, 28=Action, 12=Adventure
    } else if (genreOrKeyword === 'drama') {
        // Drama anime (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,18&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    } else if (genreOrKeyword === 'latest_episodes') {
        // Latest anime episodes - show very recent anime with emphasis on currently airing
        const today = new Date();
        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 14); // Past 2 weeks for more recent content

        const futureWeek = new Date();
        futureWeek.setDate(futureWeek.getDate() + 14); // Next 2 weeks for upcoming episodes

        const todayStr = today.toISOString().split('T')[0];
        const pastWeekStr = pastWeek.toISOString().split('T')[0];
        const futureWeekStr = futureWeek.toISOString().split('T')[0];

        // Get anime that are currently airing or very recently aired with lower vote threshold for more results
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastWeekStr}&air_date.lte=${futureWeekStr}&with_status=0,1&sort_by=first_air_date.desc&vote_count.gte=5`;
    } else if (genreOrKeyword === 'popular_season') {
        // Popular this season - 2024-2025 most popular anime
        const today = new Date();
        const currentYear = today.getFullYear();

        // Get popular anime from 2022 onwards with broader criteria for better results
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&first_air_date.gte=2022-01-01&first_air_date.lte=${currentYear}-12-31&sort_by=popularity.desc&vote_count.gte=3`;
    } else {
        // Default endpoint for general anime (from 2022+)
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc`;
    }

    // Special handling for latest episodes to get very recent content
    if (genreOrKeyword === 'latest_episodes') {
        fetchLatestAnimeEpisodes(containers, containerClass);
        return;
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
        .then(async data => {
            console.log(`Got anime data from TMDB for ${containerClass}, found ${data.results ? data.results.length : 0} items`);
            let animeResults = data.results || [];

            // If we have fewer than 8 results, supplement with recent anime
            if (animeResults.length < 8) {
                try {
                    const recentIds = getRecentAnimeSupplements(containerClass);
                    const recentAnime = await fetchAnimeByIds(recentIds);
                    console.log(`Added ${recentAnime.length} supplementary recent anime for ${containerClass}`);
                    animeResults = [...animeResults, ...recentAnime].slice(0, 20);
                } catch (error) {
                    console.log('Error fetching supplementary anime:', error);
                }
            }

            containers.forEach(container => {
                displayAnimeResults(container, animeResults, containerClass);
            });
        })
        .catch(error => {
            console.error('Error fetching anime data:', error);

            // Special handling for containers that might fail
            if (containerClass === 'adventure-anime-container' ||
                containerClass === 'latest-episodes-container' ||
                containerClass === 'popular-season-container') {
                containers.forEach(container => {
                    // Try a fallback query with different content for each section
                    console.log(`Attempting fallback query for ${containerClass}`);
                    let fallbackEndpoint;

                    if (containerClass === 'latest-episodes-container' || containerClass === 'anime-latest-episodes-container') {
                        // For latest episodes fallback, use currently airing anime with high popularity
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&with_status=0&sort_by=popularity.desc&vote_count.gte=10`;
                    } else if (containerClass === 'popular-season-container') {
                        // For popular season fallback, use popular anime
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&sort_by=popularity.desc&vote_count.gte=50`;
                    } else {
                        // Default fallback for adventure anime (from 2022+)
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_origin_country=JP&first_air_date.gte=2022-01-01&sort_by=popularity.desc&vote_count.gte=5`;
                    }

                    fetch(`https://api.themoviedb.org/3/${fallbackEndpoint}`)
                        .then(response => response.json())
                        .then(data => {
                            const animeResults = data.results || [];
                            if (animeResults.length > 0) {
                                container.innerHTML = ''; // Clear error message

                                // Show popular anime as fallback
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
                            console.error(`Error with fallback ${containerClass} fetch:`, err);
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
