/*
// Get references to HTML elements
*/
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');
const navItems = document.querySelectorAll('.nav-item');
const movieSections = document.querySelectorAll('.movie-section');
const animeSections = document.querySelectorAll('.anime-section');

// Add a new variable to track the current active section
let currentSection = 'all'; // Default to 'all'

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// Event listener to navigate to WatchList page
goToWatchlistBtn.addEventListener('click', () => {
    window.location.href = 'watchList/watchlist.html';
});

// Function to update banner slideshow based on section
function updateBannerForSection(section) {
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

    if (section === 'all') {
        // For "All" section, we'll use Netflix originals
        fetch(`https://api.themoviedb.org/3/discover/tv?with_networks=213&api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const items = data.results || [];
                // Filter to items with backdrop images
                bannerItems = items.filter(item => item.backdrop_path).slice(0, 5).map(item => ({
                    ...item,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'movies') {
        // For Movies section, use trending movies
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                // Filter to movies with backdrop images
                bannerItems = movies.filter(movie => movie.backdrop_path).slice(0, 5).map(movie => ({
                    ...movie,
                    mediaType: 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'tv') {
        // For TV Shows section, use trending TV shows
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const shows = data.results || [];
                // Filter to shows with backdrop images
                bannerItems = shows.filter(show => show.backdrop_path).slice(0, 5).map(show => ({
                    ...show,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'anime') {
        // Clear any existing fetch timeouts
        if (window.animeFetchTimeout) {
            clearTimeout(window.animeFetchTimeout);
        }

        // Add spacing below the banner
        const bannerContainer = document.getElementById('banner-container');
        if (bannerContainer) {
            bannerContainer.style.marginBottom = '40px';
        }

        // Get high resolution anime content using TMDB API instead of Jikan
        // TMDB provides higher resolution images
        console.log('Fetching high-resolution anime content for banner...');

        // Use a combination of TMDB keywords for anime and animation to get high quality content
        Promise.all([
            // Fetch anime content from TMDB using anime keywords
            fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_keywords=210024&sort_by=popularity.desc`), // Anime keyword

            // Add a small delay then fetch popular animation
            new Promise(resolve => {
                setTimeout(() => {
                    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&sort_by=popularity.desc`) // Animation genre
                        .then(response => response.json())
                        .then(data => resolve(data))
                        .catch(error => {
                            console.error('Error fetching animation content:', error);
                            resolve({ results: [] });
                        });
                }, 500);
            }),

            // Get specific anime titles that we know have high quality images
            new Promise(resolve => {
                setTimeout(() => {
                    // Use search to get specific high-quality anime titles
                    const popularAnimeShows = [
                        'fullmetal alchemist',
                        'attack on titan',
                        'one piece',
                        'demon slayer',
                        'naruto',
                        'one punch man',
                        'my hero academia',
                        'death note',
                        'dragon ball'
                    ];

                    // Pick a random anime from our curated list
                    const randomAnime = popularAnimeShows[Math.floor(Math.random() * popularAnimeShows.length)];

                    fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${encodeURIComponent(randomAnime)}`)
                        .then(response => response.json())
                        .then(data => resolve(data))
                        .catch(error => {
                            console.error('Error fetching specific anime:', error);
                            resolve({ results: [] });
                        });
                }, 1000);
            })
        ])
        .then(async ([animeDataResponse, animationData, specificAnimeData]) => {
            // animeDataResponse is a fetch Response, need to .json()
            let animeData;
            if (animeDataResponse && typeof animeDataResponse.json === 'function') {
                animeData = await animeDataResponse.json();
            } else {
                animeData = animeDataResponse;
            }
            // Combine results
            let allResults = [];

            // Helper function to identify anime content by checking the overview and title
            const isLikelyAnime = (item) => {
                const animeKeywords = ['anime', 'manga', 'japan', 'japanese', 'ninja', 'samurai', 'shonen', 'shojo'];
                const title = (item.name || item.title || '').toLowerCase();
                const overview = (item.overview || '').toLowerCase();

                return animeKeywords.some(keyword => title.includes(keyword) || overview.includes(keyword));
            };

            // Process anime keyword results
            if (animeData && animeData.results) {
                console.log(`Found ${animeData.results.length} anime keyword results`);
                allResults = allResults.concat(animeData.results);
            }

            // Process animation genre results - only include likely anime
            if (animationData && animationData.results) {
                console.log(`Found ${animationData.results.length} animation genre results`);
                const animeResults = animationData.results.filter(item => isLikelyAnime(item));
                allResults = allResults.concat(animeResults);
            }

            // Process specific anime search results - prioritize these
            if (specificAnimeData && specificAnimeData.results) {
                console.log(`Found ${specificAnimeData.results.length} specific anime results`);

                // Add specific anime results with highest priority
                specificAnimeData.results.forEach(item => {
                    // Push to beginning of array to prioritize these high-quality results
                    allResults.unshift(item);
                });
            }

            console.log(`Combined ${allResults.length} total potential anime items`);

            // Build a Set of unique IDs to avoid duplicates
            const uniqueIds = new Set();
            const uniqueResults = [];

            allResults.forEach(item => {
                // Only add items with backdrop images and not already processed
                if (item.backdrop_path && !uniqueIds.has(item.id)) {
                    uniqueIds.add(item.id);
                    uniqueResults.push(item);
                }
            });

            // Sort by popularity and take top results
            const highQualityResults = uniqueResults
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 5);

            console.log(`Selected ${highQualityResults.length} high-quality anime with backdrops`);

            if (highQualityResults.length > 0) {
                // Convert to banner items format
                bannerItems = highQualityResults.map(item => ({
                    id: item.id,
                    title: item.name || item.title,
                    overview: item.overview,
                    backdrop_path: item.backdrop_path,
                    vote_average: item.vote_average || 0,
                    mediaType: 'tv', // Use TV since most anime are TV shows in TMDB
                    first_air_date: item.first_air_date,
                    release_date: item.release_date,
                    popularity: item.popularity
                }));

                // Show the first banner and start the slideshow
                showBannerAtIndex(0);
                startBannerSlideshow();
            } else {
                // Fallback to our specific anime list as a last resort
                console.warn('No high-quality anime results found. Using fallback approach...');

                // Try fetching directly with specific anime titles one by one
                const fetchSpecificAnime = async () => {
                    const popularAnime = [
                        'fullmetal alchemist brotherhood',
                        'attack on titan',
                        'demon slayer',
                        'naruto shippuden',
                        'one piece',
                        'my hero academia',
                        'jujutsu kaisen'
                    ];

                    const results = [];

                    for (const anime of popularAnime) {
                        try {
                            const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${encodeURIComponent(anime)}`);
                            const data = await response.json();

                            if (data.results && data.results.length > 0) {
                                // Find the first result with a backdrop
                                const resultWithBackdrop = data.results.find(item => item.backdrop_path);
                                if (resultWithBackdrop) {
                                    results.push(resultWithBackdrop);
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching specific anime "${anime}":`, error);
                        }

                        // Break early if we've got enough results
                        if (results.length >= 5) break;
                    }

                    if (results.length > 0) {
                        bannerItems = results.map(item => ({
                            id: item.id,
                            title: item.name || item.title,
                            overview: item.overview,
                            backdrop_path: item.backdrop_path,
                            vote_average: item.vote_average || 0,
                            mediaType: 'tv'
                        }));

                        showBannerAtIndex(0);
                        startBannerSlideshow();
                    }
                };

                fetchSpecificAnime();
            }
        })
        .catch(error => {
            console.error('Error fetching anime banner data:', error);
        });
    }
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

            // Show the banner (now we use the same function for all banners)
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

        // Add media type (Movie or TV Show)
        if (item.mediaType === 'movie') {
            extraInfo.push('Movie');
        } else if (item.mediaType === 'tv') {
            extraInfo.push('TV Show');
        }

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
            }
        } else {
            bannerTitle.textContent = title;
        }

        // Update the banner image to have better display
        banner.style.objectFit = 'cover';
        banner.style.objectPosition = 'center top';

        // Apply a subtle gradient overlay to make text more readable if not already added
        const bannerContainer = document.getElementById('banner-container');
        if (bannerContainer) {
            // Make sure the container has relative positioning for the overlay to work
            bannerContainer.style.position = 'relative';

            // Look for an existing overlay or create one
            let overlay = document.getElementById('banner-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'banner-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 80%)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '1';

                // Insert overlay as the first child, behind other content
                bannerContainer.insertBefore(overlay, bannerContainer.firstChild);

                // Make sure detail elements appear above the overlay
                const detailsContainer = document.getElementById('details-container');
                if (detailsContainer) {
                    detailsContainer.style.zIndex = '2';
                    detailsContainer.style.position = 'relative';
                }
            }
        }

        // Update button click events
        document.getElementById('play-button').onclick = () => {
            window.location.href = `movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
        };
        document.getElementById('more-info').onclick = () => {
            window.location.href = `movie_details/movie_details.html?media=${item.mediaType}&id=${item.id}`;
        };

        // Update current index
        currentBannerIndex = index;
        updateBannerIndicators();
    }
}

// Function to show anime banner at specific index with enhanced display
function showAnimeBannerAtIndex(index) {
    // Deprecated: All banners now use showBannerAtIndex
    showBannerAtIndex(index);
}

// Create banner navigation indicators
function createBannerIndicators() {
    // Create container for indicators if it doesn't exist
    let indicatorsContainer = document.getElementById('banner-indicators');
    if (!indicatorsContainer) {
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.id = 'banner-indicators';
        indicatorsContainer.style.position = 'absolute';
        indicatorsContainer.style.bottom = '20px';
        indicatorsContainer.style.left = '50%';
        indicatorsContainer.style.transform = 'translateX(-50%)';
        indicatorsContainer.style.display = 'flex';
        indicatorsContainer.style.gap = '10px';
        indicatorsContainer.style.zIndex = '2';

        // Add it to the banner container
        document.getElementById('banner-container').appendChild(indicatorsContainer);
    }

    // Clear existing indicators
    indicatorsContainer.innerHTML = '';

    // Create indicator for each banner item
    bannerItems.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'banner-indicator';
        indicator.style.width = '12px';
        indicator.style.height = '12px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = index === currentBannerIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)';
        indicator.style.cursor = 'pointer';
        indicator.style.transition = 'background-color 0.3s';

        // Add click event to navigate to this banner
        indicator.addEventListener('click', () => {
            showBannerAtIndex(index);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });

        indicatorsContainer.appendChild(indicator);
    });
}

// Update the indicators to show current active banner
function updateBannerIndicators() {
    createBannerIndicators();
}

// Helper function to update banner with a movie or TV show item
function updateBannerWithItem(item, mediaType) {
    // This function is now replaced by the more comprehensive banner slideshow system
    showBannerAtIndex(currentBannerIndex);
}

// Navigation menu functionality
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));

        // Add active class to clicked item
        item.classList.add('active');

        // Get the section to show
        const section = item.querySelector('a').getAttribute('data-section');
        currentSection = section; // Update the current section

        // Update the banner slideshow for the selected section
        updateBannerForSection(section);

        // Show/hide sections based on selection
        if (section === 'all') {
            // Show all sections
            movieSections.forEach(section => section.style.display = 'block');
        } else if (section === 'anime') {
            // Show only anime sections
            movieSections.forEach(section => {
                if (section.classList.contains('anime-section')) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        } else if (section === 'movies') {
            // Show only movie sections (not TV or anime)
            movieSections.forEach(section => {
                if (section.classList.contains('anime-section')) {
                    section.style.display = 'none';
                } else if (section.id && section.id.includes('tv')) {
                    section.style.display = 'none';
                } else {
                    // Check if the section contains "Netflix" which is TV shows
                    const sectionTitle = section.querySelector('h1');
                    if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                        section.style.display = 'none';
                    } else {
                        section.style.display = 'block';
                    }
                }
            });
        } else if (section === 'tv') {
            // Show only TV show sections (not movies or anime)
            movieSections.forEach(section => {
                if (section.classList.contains('anime-section')) {
                    section.style.display = 'none';
                } else {
                    // Check if the section contains "Netflix" which is TV shows
                    const sectionTitle = section.querySelector('h1');
                    if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                        section.style.display = 'block';
                    } else if (section.classList.contains('tv-section')) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                }
            });
        }
    });
});

const scrollDistance = 1200;

// Get references to the header and other elements
const header = document.querySelector('.header');
let lastScrollTop = 0; // Keep track of the last scroll position

// Function to handle scroll events
window.addEventListener('scroll', () => {
    let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > lastScrollTop) {
        // Scrolling down: hide the header and nav
        header.style.top = "-120px"; // Move the header out of view
        document.querySelector('.nav-menu').style.top = "-50px"; // Move nav out of view
    } else {
        // Scrolling up: show the header and nav
        header.style.top = "0px"; // Reset the header position to the top
        document.querySelector('.nav-menu').style.top = "70px"; // Place nav under header
    }

    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // Prevent negative scroll value
});

// Define a function to handle scrolling
function setupScroll(containerClass, previousButtonClass, nextButtonClass) {
    const previousButtons = document.querySelectorAll(`.${previousButtonClass}`);
    const nextButtons = document.querySelectorAll(`.${nextButtonClass}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container, index) => {
        const previousButton = previousButtons[index];
        const nextButton = nextButtons[index];

        nextButton.addEventListener('click', () => {
            container.scrollBy({
                left: scrollDistance,
                behavior: 'smooth',
            });
        });

        previousButton.addEventListener('click', () => {
            container.scrollBy({
                left: -scrollDistance,
                behavior: 'smooth',
            });
        });
    });
}

setupScroll('trending-container', 'trending-previous', 'trending-next');
setupScroll('netflix-container', 'netflix-previous', 'netflix-next');
setupScroll('top-container', 'top-previous', 'top-next');
setupScroll('horror-container', 'horror-previous', 'horror-next');
setupScroll('comedy-container', 'comedy-previous', 'comedy-next');
setupScroll('action-container', 'action-previous', 'action-next');
// TV genres scroll
setupScroll('drama-tv-container', 'drama-tv-previous', 'drama-tv-next');
setupScroll('crime-tv-container', 'crime-tv-previous', 'crime-tv-next');
setupScroll('scifi-tv-container', 'scifi-tv-previous', 'scifi-tv-next');
// Anime scroll
setupScroll('anime-popular-container', 'anime-popular-previous', 'anime-popular-next');
setupScroll('anime-top-container', 'anime-top-previous', 'anime-top-next');
setupScroll('anime-upcoming-container', 'anime-upcoming-previous', 'anime-upcoming-next');

// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple (main theme color) for good ratings
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display movies or TV shows
function fetchMedia(containerClass, endpoint, mediaType, usePosterPath = false) {
    console.log(`Fetching ${mediaType} for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        fetch(`https://api.themoviedb.org/3/${endpoint}api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                console.log(`Got ${mediaType} data for ${containerClass}, found ${movies.length} items`);
                container.innerHTML = ''; // Clear the container

                movies.forEach(movie => {
                    // Skip if no image is available
                    const imageUrl = usePosterPath
                        ? movie.poster_path
                        : movie.backdrop_path;
                    if (!imageUrl) return;

                    let pathToUse = usePosterPath ? movie.poster_path : movie.backdrop_path;
                    // Create item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = mediaType || 'movie';

                    // Using a wrapper for the image to maintain aspect ratio
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = `https://image.tmdb.org/t/p/w780${pathToUse}`;
                    img.alt = movie.title || movie.name;
                    img.loading = 'lazy'; // Add lazy loading for better performance

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to movie details
                    itemElement.addEventListener('click', () => {
                        const mediaId = movie.id;
                        const mediaToUse = mediaType || (movie.first_air_date ? 'tv' : 'movie');
                        window.location.href = `movie_details/movie_details.html?media=${mediaToUse}&id=${mediaId}`;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = movie.title || movie.name;

                    // Enhanced star rating visibility
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = movie.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    // Build the rating element
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    // Build the overlay
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });

                // Banner setting code removed from here
            })
            .catch(error => {
                console.error('Error fetching media data:', error);
            });
    });
}

// Function to fetch and display anime from Jikan API
function fetchAnime(containerClass, endpoint) {
    console.log(`Fetching anime for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Add delay to avoid rate limiting (Jikan API has a limit of 3 requests/sec)
        setTimeout(() => {
            console.log(`Fetching anime from: https://api.jikan.moe/v4/${endpoint}`);
            fetch(`https://api.jikan.moe/v4/${endpoint}`)
                .then(response => {
                    // Log response status for debugging
                    console.log(`Anime API response status for ${containerClass}: ${response.status}`);
                    if (!response.ok) {
                        throw new Error(`Anime API responded with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Got anime data for ${containerClass}, found ${data.data ? data.data.length : 0} items`);
                    if (data.data && data.data.length > 0) {
                        console.log('Sample anime data structure:', JSON.stringify(data.data[0], null, 2));
                        // Check specifically for image data structure
                        if (data.data[0].images) {
                            console.log('Images structure:', JSON.stringify(data.data[0].images, null, 2));
                        } else {
                            console.warn('No images property found in anime data');
                            // Look for any property that might contain image URLs
                            const sampleAnime = data.data[0];
                            for (const prop in sampleAnime) {
                                if (typeof sampleAnime[prop] === 'string' &&
                                    (sampleAnime[prop].includes('.jpg') ||
                                     sampleAnime[prop].includes('.jpeg') ||
                                     sampleAnime[prop].includes('.png') ||
                                     sampleAnime[prop].includes('.webp'))) {
                                    console.log(`Found potential image URL in property ${prop}:`, sampleAnime[prop]);
                                }
                            }
                        }
                    } else {
                        console.warn(`No anime data found for ${containerClass} using endpoint ${endpoint}`);
                    }
                    const animeResults = data.data || [];
                    container.innerHTML = ''; // Clear the container first to prevent duplicates

                    // Process each anime item
                    if (animeResults.length === 0) {
                        console.warn(`No anime results found for ${containerClass}`);
                        container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                        return;
                    }

                    // Filter out duplicate anime (same ID) to prevent showing the same poster multiple times
                    const uniqueAnimeResults = [];
                    const seenIds = new Set();

                    animeResults.forEach(anime => {
                        if (!seenIds.has(anime.mal_id)) {
                            uniqueAnimeResults.push(anime);
                            seenIds.add(anime.mal_id);
                        } else {
                            console.log(`Filtered out duplicate anime: ${anime.title} (ID: ${anime.mal_id})`);
                        }
                    });

                    console.log(`Processing ${uniqueAnimeResults.length} unique anime items for ${containerClass} (filtered ${animeResults.length - uniqueAnimeResults.length} duplicates)`);
                    uniqueAnimeResults.forEach((anime, index) => {
                        console.log(`Processing anime ${index + 1}/${uniqueAnimeResults.length}: ${anime.title || 'Unknown Title'}`);
                        // Add a small delay between processing items to prevent browser freezing
                        setTimeout(() => {
                        // Fix: Ensure we're getting a valid image URL
                        let imageUrl = null;

                        // Try different image sources in order of preference
                        if (anime.images) {
                            if (anime.images.jpg) {
                                if (anime.images.jpg.large_image_url) {
                                    imageUrl = anime.images.jpg.large_image_url;
                                } else if (anime.images.jpg.image_url) {
                                    imageUrl = anime.images.jpg.image_url;
                                }
                            }

                            // If we still don't have an image, try webp format
                            if (!imageUrl && anime.images.webp) {
                                if (anime.images.webp.large_image_url) {
                                    imageUrl = anime.images.webp.large_image_url;
                                } else if (anime.images.webp.image_url) {
                                    imageUrl = anime.images.webp.image_url;
                                }
                            }

                            // If still no specific format, try any available image
                            if (!imageUrl) {
                                for (const format in anime.images) {
                                    if (anime.images[format] && typeof anime.images[format] === 'object') {
                                        for (const size in anime.images[format]) {
                                            if (anime.images[format][size] && typeof anime.images[format][size] === 'string') {
                                                imageUrl = anime.images[format][size];
                                                break;
                                            }
                                        }
                                        if (imageUrl) break;
                                    }
                                }
                            }
                        }

                        // For direct image in case of API structure change
                        if (!imageUrl && anime.image_url) {
                            imageUrl = anime.image_url;
                        }

                        // If still no image, use a placeholder
                        if (!imageUrl) {
                            imageUrl = 'https://via.placeholder.com/500x750?text=No+Image+Available';
                            console.log(`No image available for anime: ${anime.title || 'Unknown'}`);
                        }

                        const title = anime.title || anime.title_english || 'Unknown Title';
                        console.log(`Processing anime: ${title} with image: ${imageUrl}`);

                        // Create the main item element with fixed dimensions
                        const itemElement = document.createElement('div');
                        itemElement.className = 'movie-item'; // Add a specific class for styling
                        itemElement.dataset.mediaType = 'anime';
                        itemElement.dataset.animeId = anime.mal_id;

                        // Using poster style for anime
                        itemElement.style.width = '250px';
                        itemElement.style.height = '340px';
                        itemElement.style.flexShrink = '0'; // Prevent shrinking
                        itemElement.style.margin = '20px 0';

                        // Create a wrapper for the image to maintain aspect ratio
                        const imgWrapper = document.createElement('div');
                        imgWrapper.className = 'image-wrapper';
                        imgWrapper.style.width = '100%';
                        imgWrapper.style.height = '100%';
                        imgWrapper.style.overflow = 'hidden';
                        imgWrapper.style.borderRadius = '5px';
                        imgWrapper.style.position = 'relative';
                        imgWrapper.style.backgroundColor = '#222'; // Add background color

                        // Create and add the image
                        const img = document.createElement('img');
                        img.alt = title;
                        img.loading = 'lazy'; // Add lazy loading for better performance
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '5px';
                        img.style.transition = 'all 0.5s ease-in-out';

                        // Add a temporary placeholder while the image loads
                        img.src = 'https://via.placeholder.com/500x750?text=Loading...';

                        // Enhanced error handling for images with retries
                        let retryCount = 0;
                        const maxRetries = 2;

                        const loadImage = () => {
                            // Set the real image URL
                            img.src = imageUrl;

                            img.onerror = function() {
                                retryCount++;
                                console.log(`Image error for: ${title}, retry: ${retryCount}`);

                                if (retryCount <= maxRetries) {
                                    // Try a different cache-busting approach
                                    setTimeout(() => {
                                        // Add a cache-buster
                                        img.src = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
                                    }, 500);
                                } else {
                                    // After max retries, use placeholder
                                    this.onerror = null; // Prevent infinite loop
                                    this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                                    console.error(`Failed to load image after ${maxRetries} retries: ${title}`);
                                }
                            };

                            // Log successful image loads for debugging
                            img.onload = function() {
                                console.log(`Successfully loaded image for: ${title}`);
                            };
                        };

                        // Start loading the real image
                        loadImage();

                        imgWrapper.appendChild(img);

                        // Add the image wrapper to the item element
                        itemElement.appendChild(imgWrapper);

                        // Add the item to the container
                        container.appendChild(itemElement);

                        // Add click event to navigate to anime details in our site
                        itemElement.addEventListener('click', () => {
                            // Create a custom anime object to pass to movie_details
                            const animeDetails = {
                                id: anime.mal_id,
                                title: anime.title,
                                overview: anime.synopsis,
                                poster_path: imageUrl,
                                backdrop_path: imageUrl,
                                vote_average: anime.score || 0,
                                media_type: 'anime'
                            };

                            // Store the anime details in localStorage to retrieve in movie_details
                            localStorage.setItem('current_anime', JSON.stringify(animeDetails));

                            // Navigate to movie details page with custom parameters
                            window.location.href = `movie_details/movie_details.html?media=anime&id=${anime.mal_id}`;
                        });

                        // Create overlay with title and rating
                        const overlay = document.createElement('div');
                        overlay.className = 'movie-overlay';
                        overlay.style.position = 'absolute';
                        overlay.style.bottom = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 70%)';
                        overlay.style.borderTop = '2px solid rgba(141, 22, 201, 0.6)';
                        overlay.style.color = 'white';
                        overlay.style.padding = '10px 12px';
                        overlay.style.borderRadius = '0 0 5px 5px';
                        overlay.style.boxSizing = 'border-box';
                        overlay.style.zIndex = '10';
                        overlay.style.display = 'flex';
                        overlay.style.justifyContent = 'space-between';
                        overlay.style.alignItems = 'center';
                        overlay.style.pointerEvents = 'none';

                        // Create title element
                        const titleElement = document.createElement('div');
                        titleElement.className = 'movie-title';
                        titleElement.textContent = title;
                        titleElement.style.color = 'white';
                        titleElement.style.fontSize = '14px';
                        titleElement.style.fontWeight = 'bold';
                        titleElement.style.margin = '0';
                        titleElement.style.maxWidth = '70%';
                        titleElement.style.whiteSpace = 'nowrap';
                        titleElement.style.overflow = 'hidden';
                        titleElement.style.textOverflow = 'ellipsis';
                        titleElement.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 1)';
                        titleElement.style.letterSpacing = '0.5px';

                        // Enhanced star rating visibility
                        const rating = document.createElement('div');
                        rating.className = 'movie-rating';
                        rating.style.display = 'flex';
                        rating.style.alignItems = 'center';
                        rating.style.gap = '2px';
                        rating.style.marginLeft = 'auto';

                        const star = document.createElement('span');
                        star.className = 'rating-star';
                        star.innerHTML = '★';
                        star.style.fontSize = '15px';
                        star.style.textShadow = '0px 0px 3px rgba(0, 0, 0, 0.8)';

                        const ratingValue = document.createElement('span');
                        ratingValue.className = 'rating-value';
                        ratingValue.style.fontSize = '13px';
                        ratingValue.style.fontWeight = 'bold';
                        ratingValue.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 1)';
                        ratingValue.style.color = 'white';

                        // Format the rating to show only one decimal place
                        const voteAverage = anime.score || 0;
                        const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                        ratingValue.textContent = formattedRating;

                        // Set color based on rating
                        if (formattedRating !== 'N/A') {
                            star.style.color = getRatingColor(voteAverage);
                        }

                        // Build the overlay structure
                        rating.appendChild(star);
                        rating.appendChild(ratingValue);
                        overlay.appendChild(titleElement);
                        overlay.appendChild(rating);

                        // Add overlay to the image wrapper
                        imgWrapper.appendChild(overlay);
                        console.log(`Added overlay for ${title}`);
                        }, index * 50); // Add a small delay based on item index
                    });

                    // Banner setting code removed from here
                })
                .catch(error => {
                    console.error('Error fetching anime data:', error);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error loading anime content. Please try again later.</div>';

                    // Try fallback endpoint if the main one fails
                    if (endpoint.includes('anime?')) {
                        console.log('Trying fallback anime endpoint...');
                        // Use a different endpoint as fallback
                        tryFallbackAnimeApi(containerClass, 'top/anime?limit=20');
                    }
                });
        }, containerClass.includes('popular') ? 0 : containerClass.includes('top') ? 1000 : 2000); // Stagger requests to avoid rate limiting
    });
}

// Fallback function to try a different anime API endpoint if the first one fails
function tryFallbackAnimeApi(containerClass, fallbackEndpoint) {
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Add delay to avoid rate limiting
        setTimeout(() => {
            console.log(`Trying fallback anime API for ${containerClass} with endpoint: ${fallbackEndpoint}`);
            fetch(`https://api.jikan.moe/v4/${fallbackEndpoint}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Fallback anime API responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.data && data.data.length > 0) {
                    console.log(`Fallback successful! Got ${data.data.length} anime items.`);

                    // Clear the container and process each anime item
                    container.innerHTML = '';

                    // Filter out duplicate anime in the fallback results
                    const uniqueAnimeResults = [];
                    const seenIds = new Set();

                    data.data.forEach(anime => {
                        if (!seenIds.has(anime.mal_id)) {
                            uniqueAnimeResults.push(anime);
                            seenIds.add(anime.mal_id);
                        } else {
                            console.log(`Filtered out duplicate anime in fallback: ${anime.title} (ID: ${anime.mal_id})`);
                        }
                    });

                    console.log(`Processing ${uniqueAnimeResults.length} unique anime items in fallback (filtered ${data.data.length - uniqueAnimeResults.length} duplicates)`);

                    uniqueAnimeResults.forEach((anime, index) => {
                        // Get the best image URL using the improved logic from fetchAnime
                        let imageUrl = null;

                        if (anime.images) {
                            if (anime.images.jpg && anime.images.jpg.large_image_url) {
                                imageUrl = anime.images.jpg.large_image_url;
                            } else if (anime.images.jpg && anime.images.jpg.image_url) {
                                imageUrl = anime.images.jpg.image_url;
                            } else if (anime.images.webp && anime.images.webp.large_image_url) {
                                imageUrl = anime.images.webp.large_image_url;
                            } else if (anime.images.webp && anime.images.webp.image_url) {
                                imageUrl = anime.images.webp.image_url;
                            }
                        }

                        if (!imageUrl && anime.image_url) {
                            imageUrl = anime.image_url;
                        }

                        if (!imageUrl) {
                            imageUrl = 'https://via.placeholder.com/500x750?text=No+Image+Available';
                        }

                        // Create and add the anime item to the container (simplified version)
                        const title = anime.title || 'Unknown Title';

                        const itemElement = document.createElement('div');
                        itemElement.className = 'movie-item';
                        itemElement.dataset.mediaType = 'anime';
                        itemElement.dataset.animeId = anime.mal_id;
                        itemElement.style.width = '250px';
                        itemElement.style.height = '340px';
                        itemElement.style.flexShrink = '0';
                        itemElement.style.margin = '20px 0';

                        const imgWrapper = document.createElement('div');
                        imgWrapper.className = 'image-wrapper';
                        imgWrapper.style.width = '100%';
                        imgWrapper.style.height = '100%';
                        imgWrapper.style.overflow = 'hidden';
                        imgWrapper.style.borderRadius = '5px';
                        imgWrapper.style.position = 'relative';
                        imgWrapper.style.backgroundColor = '#222';

                        const img = document.createElement('img');
                        img.alt = title;
                        img.src = imageUrl;
                        img.loading = 'lazy';
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '5px';

                        img.onerror = function() {
                            this.onerror = null;
                            this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                        };

                        imgWrapper.appendChild(img);
                        itemElement.appendChild(imgWrapper);
                        container.appendChild(itemElement);

                        // Add click event to navigate to anime details
                        itemElement.addEventListener('click', () => {
                            const animeDetails = {
                                id: anime.mal_id,
                                title: anime.title,
                                overview: anime.synopsis,
                                poster_path: imageUrl,
                                backdrop_path: imageUrl,
                                vote_average: anime.score || 0,
                                media_type: 'anime'
                            };
                            localStorage.setItem('current_anime', JSON.stringify(animeDetails));
                            window.location.href = `movie_details/movie_details.html?media=anime&id=${anime.mal_id}`;
                        });
                    });
                } else {
                    console.error('Fallback anime API returned no data');
                }
            })
            .catch(error => {
                console.error('Error with fallback anime API:', error);
            });
        }, 3000); // Add a 3 second delay to avoid rate limiting
    });
}

// Initial fetch of movies
fetchMedia('netflix-container', 'discover/tv?with_networks=213&', 'tv', true); // Netflix originals with poster_path
fetchMedia('trending-container', 'trending/all/week?&', 'all');
fetchMedia('top-container', 'movie/top_rated?&', 'movie');
fetchMedia('horror-container', 'discover/movie?with_genres=27&', 'movie');
fetchMedia('comedy-container', 'discover/movie?with_genres=35&', 'movie');
fetchMedia('action-container', 'discover/movie?with_genres=28&', 'movie');

// Initial fetch of TV shows by genre
fetchMedia('drama-tv-container', 'discover/tv?with_genres=18&', 'tv'); // Drama (18)
fetchMedia('crime-tv-container', 'discover/tv?with_genres=80&', 'tv'); // Crime (80)
fetchMedia('scifi-tv-container', 'discover/tv?with_genres=10765&', 'tv'); // Sci-Fi & Fantasy (10765)

// Initial fetch of anime using different queries to prevent duplication
fetchAnime('anime-popular-container', 'anime?order_by=popularity&limit=20');
fetchAnime('anime-top-container', 'top/anime?limit=20');
fetchAnime('anime-upcoming-container', 'seasons/upcoming?limit=20');

// Fetch anime for generic anime container with a different query
const genericAnimeContainer = document.querySelector('.anime-container');
if (genericAnimeContainer) {
    // Use a different category for the generic anime container to prevent duplicates
    fetchAnime('anime-container', 'anime?status=airing&order_by=score&limit=20');
}

// Function to handle search input changes
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

// Function to fetch search results from TMDB API
async function fetchSearchResults(query) {
    // Try to fetch both movie/TV and anime results
    try {
        const [tmdbResponse, animeResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${query}`),
            fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`)
        ]);

        const tmdbData = await tmdbResponse.json();
        const animeData = await animeResponse.json();

        // Combine and format results
        let combinedResults = [];

        // Format TMDB results
        if (tmdbData.results) {
            tmdbData.results.forEach(item => {
                if (item.poster_path) {
                    combinedResults.push({
                        id: item.id,
                        title: item.title || item.name,
                        poster_path: `https://image.tmdb.org/t/p/w780${item.poster_path}`,
                        media_type: item.media_type,
                        release_date: item.release_date || item.first_air_date,
                        isAnime: false,
                        url: null
                    });
                }
            });
        }

        // Format anime results
        if (animeData.data) {
            animeData.data.forEach(item => {
                // Use the same improved image selection logic as in fetchAnime
                let imageUrl = null;

                // Try different image sources in order of preference
                if (item.images) {
                    if (item.images.jpg) {
                        if (item.images.jpg.large_image_url) {
                            imageUrl = item.images.jpg.large_image_url;
                        } else if (item.images.jpg.image_url) {
                            imageUrl = item.images.jpg.image_url;
                        }
                    }

                    // If we still don't have an image, try webp format
                    if (!imageUrl && item.images.webp) {
                        if (item.images.webp.large_image_url) {
                            imageUrl = item.images.webp.large_image_url;
                        } else if (item.images.webp.image_url) {
                            imageUrl = item.images.webp.image_url;
                        }
                    }

                    // If still no specific format, try any available image
                    if (!imageUrl) {
                        for (const format in item.images) {
                            if (item.images[format] && typeof item.images[format] === 'object') {
                                for (const size in item.images[format]) {
                                    if (item.images[format][size] && typeof item.images[format][size] === 'string') {
                                        imageUrl = item.images[format][size];
                                        break;
                                    }
                                }
                                if (imageUrl) break;
                            }
                        }
                    }
                }

                // For direct image in case of API structure change
                if (!imageUrl && item.image_url) {
                    imageUrl = item.image_url;
                }

                if (!imageUrl) {
                    imageUrl = 'https://via.placeholder.com/500x750?text=No+Image+Available';
                }

                combinedResults.push({
                    id: item.mal_id,
                    title: item.title,
                    poster_path: imageUrl,
                    media_type: 'anime',
                    release_date: item.aired ? item.aired.from?.substring(0, 4) : '',
                    isAnime: true,
                    url: item.url
                });
            });
        }

        return combinedResults;
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    results.map(item => {
        const shortenedTitle = item.title || 'Unknown Title';
        const date = item.release_date || '';

        let buttonText = "Add to WatchList"; // Set default button text

        // Check if the movie is already in WatchList
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList"; // Change button text
        }

        const movieItem = document.createElement('div');
        // Create HTML structure for each item
        movieItem.innerHTML = `<div class = "search-item-thumbnail">
                                    <img src ="${item.poster_path}">
                                </div>
                                <div class ="search-item-info">
                                    <h3>${shortenedTitle}</h3>
                                    <p>${item.media_type || 'unknown'} <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            if (item.isAnime && item.url) {
                // Instead of opening external, use our movie_details page for anime
                // Store anime details in localStorage
                const animeDetails = {
                    id: item.id,
                    title: item.title,
                    overview: '', // No synopsis in search, could fetch more if needed
                    poster_path: item.poster_path,
                    backdrop_path: item.poster_path,
                    vote_average: 0,
                    media_type: 'anime'
                };
                localStorage.setItem('current_anime', JSON.stringify(animeDetails));
                window.location.href = `movie_details/movie_details.html?media=anime&id=${item.id}`;
            } else {
                window.location.href = `movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        });

        info.addEventListener('click', () => {
            if (item.isAnime && item.url) {
                // Instead of opening external, use our movie_details page for anime
                const animeDetails = {
                    id: item.id,
                    title: item.title,
                    overview: '', // No synopsis in search, could fetch more if needed
                    poster_path: item.poster_path,
                    backdrop_path: item.poster_path,
                    vote_average: 0,
                    media_type: 'anime'
                };
                localStorage.setItem('current_anime', JSON.stringify(animeDetails));
                window.location.href = `movie_details/movie_details.html?media=anime&id=${item.id}`;
            } else {
                window.location.href = `movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        });

        movieItem.setAttribute('class', 'movie-list');

        // Append movie item to search results
        searchResults.appendChild(movieItem);
    });
}

// Retrieve watchlist from local storage or create an empty array if it doesn't exist
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Initialize the banner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Update the banner based on the active section
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        const section = activeNavItem.querySelector('a').getAttribute('data-section');
        currentSection = section;
        updateBannerForSection(section);
    } else {
        // Default to 'all' if no nav item is active
        updateBannerForSection('all');
    }

    // Ensure proper spacing between the banner and section headings
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        // Force a significant margin to prevent overlap
        bannerContainer.style.marginBottom = '80px';
    }

    // Adjust section headings to be more visible
    const sectionHeadings = document.querySelectorAll('.movie-section h1, .tv-section h1, .anime-section h1');
    sectionHeadings.forEach(heading => {
        heading.style.position = 'relative';
        heading.style.zIndex = '5';
    });

    // Set up banner navigation button handlers
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            // Move to previous banner
            currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }
});

// Event listener for search input changes
searchInput.addEventListener('input', handleSearchInput);

// Event listener for Enter key press in search input
searchInput.addEventListener('keyup', async event => {
    if (event.key === 'Enter') {
        handleSearchInput();
    }
});

// Function to add a movie to WatchList
function addToWatchList(movie) {
    // Check if the movie is not already in the WatchList list
    if (!watchlist.find(watchlistItem => watchlistItem.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
        const watchListBtn = document.querySelector(`[id="${movie.id}"]`);
        if (watchListBtn) {
            watchListBtn.textContent = "Go to WatchList";
            watchListBtn.addEventListener('click', () => {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            });
        }
    }
}

// Event listener to close search results when clicking outside
document.addEventListener('click', event => {
    if (!searchResults.contains(event.target)) {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
});
