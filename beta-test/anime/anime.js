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
    fetchAnime('anime-popular-container', 'popular');
    fetchAnime('anime-latest-episodes-container', 'latest_episodes');
    fetchAnime('latest-episodes-container', 'latest_episodes');
    fetchAnime('popular-season-container', 'popular_season');
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
// Function to display anime results in containers
function displayAnimeResults(container, animeResults, containerClass) {
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
        container.innerHTML = '<div style="color: white; padding: 40px; text-align: center; font-size: 1.1rem;"><div style="margin-bottom: 15px;">🔄 Loading latest anime episodes...</div><div style="font-size: 0.9rem; color: #ccc;">Fetching episodes from the past 1-2 weeks • Super recent content priority</div></div>';
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
        // Currently airing TODAY - highest priority
        `tv/airing_today?api_key=${api_Key}&with_genres=16`,

        // Anime that aired in the past 3 days (super recent)
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${past3Days}&air_date.lte=${todayStr}&sort_by=first_air_date.desc&vote_count.gte=1`,

        // Anime that aired this week (past 7 days)
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastWeek}&air_date.lte=${todayStr}&sort_by=first_air_date.desc&vote_count.gte=3`,

        // Anime that aired in the past 2 weeks (maximum range)
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastTwoWeeks}&air_date.lte=${todayStr}&sort_by=first_air_date.desc&vote_count.gte=5`,

        // Currently ongoing series with very recent episodes
        `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_status=0&air_date.gte=${pastWeek}&sort_by=first_air_date.desc&vote_count.gte=8`
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

        // Remove duplicates based on ID and filter for very recent content only
        const uniqueAnime = allAnime.filter((anime, index, self) => {
            // Remove duplicates
            if (index !== self.findIndex(a => a.id === anime.id)) {
                return false;
            }

            // Only include anime that aired within the past 14 days
            const airDate = new Date(anime.first_air_date || anime.air_date || '1970-01-01');
            const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

            return airDate >= twoWeeksAgo;
        });

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

        console.log(`Filtered to ${latestAnime.length} anime episodes from the past 1-2 weeks (super recent content)`);

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
    } else if (genreOrKeyword === 'latest_episodes') {
        // Latest anime episodes - show very recent anime with emphasis on currently airing
        const today = new Date();
        const pastMonth = new Date();
        pastMonth.setMonth(pastMonth.getMonth() - 1); // Past month for more recent content

        const futureMonth = new Date();
        futureMonth.setMonth(futureMonth.getMonth() + 1); // Next month for upcoming episodes

        const todayStr = today.toISOString().split('T')[0];
        const pastMonthStr = pastMonth.toISOString().split('T')[0];
        const futureMonthStr = futureMonth.toISOString().split('T')[0];

        // Get anime that are currently airing or very recently aired with higher popularity threshold
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${pastMonthStr}&air_date.lte=${futureMonthStr}&with_status=0,1&sort_by=first_air_date.desc&vote_count.gte=10`;
    } else if (genreOrKeyword === 'popular_season') {
        // Popular this season - current year's most popular anime
        const today = new Date();
        const currentYear = today.getFullYear();

        // Get popular anime from current year with broader criteria for better results
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&first_air_date.gte=${currentYear}-01-01&first_air_date.lte=${currentYear}-12-31&sort_by=popularity.desc&vote_count.gte=5`;
    } else {
        // Default endpoint for general anime
        endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
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
        .then(data => {
            console.log(`Got anime data from TMDB for ${containerClass}, found ${data.results ? data.results.length : 0} items`);
            const animeResults = data.results || [];

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
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&with_status=0&sort_by=popularity.desc&vote_count.gte=10`;
                    } else if (containerClass === 'popular-season-container') {
                        // For popular season fallback, use popular anime
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&sort_by=popularity.desc&vote_count.gte=50`;
                    } else {
                        // Default fallback for adventure anime
                        fallbackEndpoint = `discover/tv?api_key=${api_Key}&with_genres=16&sort_by=popularity.desc&vote_count.gte=50`;
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
