// TMDB API key
const api_Key = '84259f99204eeb7d45c7e3d8e36c6123';

const bannerElement = document.getElementById('banner');
const bannerTitleElement = document.getElementById('banner-title');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');

let bannerItems = [];
let currentBannerIndex = 0;
let bannerInterval;

function fetchTVShows(containerClass, type) {
    const containers = document.querySelectorAll(`.${containerClass}`);

    if (containers.length === 0) {
        console.warn(`No container found with class ${containerClass}`);
        return;
    }

    console.log(`Fetching ${type} TV shows for ${containerClass}`);

    let endpoint = '';

    if (type === 'netflix_originals') {
        endpoint = `discover/tv?api_key=${api_Key}&with_networks=213&sort_by=popularity.desc`;
    } else if (type === 'disney_plus') {
        endpoint = `discover/tv?api_key=${api_Key}&with_networks=2739&sort_by=popularity.desc`;
    } else if (type === 'trending') {
        endpoint = `trending/tv/week?api_key=${api_Key}`;
    } else if (type === 'top_rated') {
        endpoint = `tv/top_rated?api_key=${api_Key}`;
    } else if (type === 'popular') {
        endpoint = `tv/popular?api_key=${api_Key}`;
    } else if (type === 'on_the_air') {
        endpoint = `tv/on_the_air?api_key=${api_Key}`;
    } else {
        let genreId;
        switch (type) {
            case 'comedy':
                genreId = 35;
                break;
            case 'crime':
                genreId = 80;
                break;
            case 'documentary':
                genreId = 99;
                break;
            case 'drama':
                genreId = 18;
                break;
            case 'family':
                genreId = 10751;
                break;
            case 'action':
                genreId = 10759;
                break;
            case 'scifi':
                genreId = 10765;
                break;
            case 'reality':
                genreId = 10764;
                break;
            case 'mystery':
                genreId = 9648;
                break;
            case 'fantasy':
                genreId = 10765;
                break;
            default:
                genreId = null;
        }

        if (genreId) {
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=${genreId}&sort_by=popularity.desc`;
        } else {
            console.warn(`Unknown TV show type: ${type}`);
            return;
        }
    }

    fetch(`https://api.themoviedb.org/3/${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`TMDB API responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Got ${type} data from TMDB, found ${data.results ? data.results.length : 0} items`);
            const tvResults = data.results || [];

            containers.forEach(container => {
                container.innerHTML = '';

                if (tvResults.length === 0) {
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No TV shows available at this time. Please try again later.</div>';
                    return;
                }

                const validResults = tvResults.filter(item => item.poster_path || item.backdrop_path);

                validResults.forEach(show => {
                    const usePoster = containerClass === 'netflix-container';
                    let useBackdropStyle = false;

                    let imageUrl;
                    if (usePoster && show.poster_path) {
                        imageUrl = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
                    } else if (show.backdrop_path) {
                        imageUrl = `https://image.tmdb.org/t/p/w780${show.backdrop_path}`;
                        useBackdropStyle = true;
                    } else {
                        imageUrl = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
                    }

                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    if (useBackdropStyle) {
                        itemElement.style.width = '290px';
                        itemElement.style.height = '170px';
                    }

                    if (usePoster) {
                        itemElement.style.width = '250px';
                        itemElement.style.height = '340px';
                    }

                    itemElement.dataset.mediaType = 'tv';
                    itemElement.dataset.id = show.id;

                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = show.name || 'TV Show';
                    img.loading = 'lazy';

                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = show.name || 'Unknown Title';

                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const voteAverage = show.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';
                    ratingValue.textContent = formattedRating;

                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(overlay);

                    itemElement.appendChild(imgWrapper);

                    container.appendChild(itemElement);

                    itemElement.addEventListener('click', () => {
                        window.location.href = `../movie_details/movie_details.html?media=tv&id=${show.id}`;
                    });
                });
            });
        })
        .catch(error => {
            console.error(`Error fetching ${type} data:`, error);
        });
}

function getRatingColor(rating) {
    if (rating >= 8) {
        return '#4CAF50';
    } else if (rating >= 6) {
        return '#FFC107';
    } else if (rating >= 4) {
        return '#FF9800';
    } else {
        return '#F44336';
    }
}

function updateBannerForSection() {
    if (!bannerElement) return;

    bannerElement.src = '';
    if (bannerTitleElement) bannerTitleElement.textContent = '';

    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    bannerItems = [];
    currentBannerIndex = 0;

    fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
        .then(response => response.json())
        .then(data => {
            const shows = data.results || [];
            bannerItems = shows.filter(show => show.backdrop_path).slice(0, 9);

            if (bannerItems.length > 0) {
                showBannerAtIndex(0);
                startBannerSlideshow();
            }
        })
        .catch(error => console.error('Error updating banner:', error));
}

function startBannerSlideshow() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    if (bannerItems.length > 1) {
        bannerInterval = setInterval(() => {
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
            showBannerAtIndex(currentBannerIndex);
        }, 8000);
    }
}

function showBannerAtIndex(index) {
    const item = bannerItems[index];
    if (item && item.backdrop_path && bannerElement) {
        bannerElement.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        if (bannerTitleElement) {
            const title = item.name;
            const extraInfo = [];
            if (item.first_air_date) {
                extraInfo.push(new Date(item.first_air_date).getFullYear());
            }
            extraInfo.push('Latest');
            extraInfo.push('TV Show');
            if (item.vote_average) {
                extraInfo.push(`⭐ ${parseFloat(item.vote_average).toFixed(1)}`);
            }

            if (extraInfo.length > 0) {
                bannerTitleElement.innerHTML = `
                    ${title}
                    <div class="banner-subtitle">${extraInfo.join(' • ')}</div>
                `;

                const subtitleElement = bannerTitleElement.querySelector('.banner-subtitle');
                if (subtitleElement) {
                    subtitleElement.style.fontSize = '0.85rem';
                    subtitleElement.style.opacity = '0.8';
                    subtitleElement.style.marginTop = '8px';
                    subtitleElement.style.fontWeight = 'normal';

                    const latestTag = 'Latest';
                    if (subtitleElement.textContent.includes(latestTag)) {
                        subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                            latestTag,
                            `<span class="latest-badge">${latestTag}</span>`
                        );

                        const badge = subtitleElement.querySelector('.latest-badge');
                        if (badge) {
                            badge.style.backgroundColor = 'rgba(231, 76, 60, 0.85)';
                            badge.style.padding = '2px 6px';
                            badge.style.borderRadius = '4px';
                            badge.style.color = 'white';
                            badge.style.fontWeight = 'bold';
                            badge.style.marginRight = '3px';
                            badge.style.marginLeft = '3px';
                            badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
                        }
                    }
                }
            } else {
                bannerTitleElement.textContent = title;
            }
        }

        bannerElement.style.objectFit = 'cover';

        const playButton = document.getElementById('play-button');
        const moreInfoButton = document.getElementById('more-info');

        if (playButton) {
            playButton.onclick = () => {
                window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
            };
        }

        if (moreInfoButton) {
            moreInfoButton.onclick = () => {
                window.location.href = `../movie_details/movie_details.html?media=tv&id=${item.id}`;
            };
        }
    }
}

if (bannerElement) {
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (bannerItems.length > 1) {
                currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;
                showBannerAtIndex(currentBannerIndex);

                if (bannerInterval) {
                    clearInterval(bannerInterval);
                }
                startBannerSlideshow();
            }
        });

        nextButton.addEventListener('click', () => {
            if (bannerItems.length > 1) {
                currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
                showBannerAtIndex(currentBannerIndex);

                if (bannerInterval) {
                    clearInterval(bannerInterval);
                }
                startBannerSlideshow();
            }
        });
    }
}

// Function to handle search
function initSearch() {
    if (!searchInput) {
        console.error('Search input element not found!');
        return;
    }

    console.log('Initializing search functionality for TV shows');

    // Make sure the search results container exists and is properly configured
    if (searchResults) {
        // Initialize the search results container
        searchResults.style.position = "absolute";
        searchResults.style.top = "70px";  // Position it below the search input
        searchResults.style.left = "50%";  // Center it horizontally
        searchResults.style.right = "auto"; // Override any right positioning
        searchResults.style.transform = "translateX(-50%)"; // Ensure perfect centering
        searchResults.style.width = "300px";
        searchResults.style.backgroundColor = "#141414";
        searchResults.style.color = "white";
        searchResults.style.borderRadius = "5px";
        searchResults.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
        searchResults.style.zIndex = "1000";
        searchResults.style.maxHeight = "80vh";
        searchResults.style.overflowY = "auto";
        searchResults.style.border = "1px solid #8d16c9";
        searchResults.innerHTML = '';
    } else {
        console.error('Search results container not found!');
    }

    // Add a click event to ensure the search input is visible and focused
    searchInput.addEventListener('click', () => {
        searchInput.focus();
    });

    // Input event for real-time search
    searchInput.addEventListener('input', () => {
        console.log('Input event triggered with query:', searchInput.value);
        handleSearchInput();
    });

    // Add event listener for Enter key press in search input
    searchInput.addEventListener('keyup', async event => {
        if (event.key === 'Enter') {
            console.log('Enter key pressed with query:', searchInput.value);
            handleSearchInput();
        }
    });

    // Event listener for search input focus to reshow results if there was a query
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value;
        if (query.length > 2) {
            // Re-show search results if they were previously hidden
            fetchSearchResults(query).then(results => {
                console.log('Focus triggered search, found results:', results.length);
                displaySearchResults(results);
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
        if (searchResults && searchResults.contains(event.target)) {
            return;
        }

        // Close the search results if clicking elsewhere
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    });
}

// Function to handle search input
async function handleSearchInput() {
    const query = searchInput.value;
    console.log(`Handling search input: "${query}"`);

    if (query.length > 2) {
        console.log('Query is long enough, fetching results...');
        const results = await fetchSearchResults(query);
        console.log(`Got ${results.length} search results`);

        // Display the results
        displaySearchResults(results);
    } else {
        console.log('Query too short, hiding results');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
}

// Function to fetch search results
async function fetchSearchResults(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${query}`);
        const data = await response.json();
        return data.results.filter(item =>
            item.media_type === 'tv' && (item.poster_path || item.backdrop_path)
        ).slice(0, 6);
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Function to display search results
function displaySearchResults(results) {
    if (!searchResults) return;

    searchResults.innerHTML = '';
    searchResults.style.display = "block";
    searchResults.style.visibility = "visible";

    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found</p>';
        return;
    }

    results.forEach(result => {
        const shortenedTitle = result.name || 'Unknown Title';
        const date = result.first_air_date || '';
        let year = '';
        if (date) {
            year = new Date(date).getFullYear();
        }

        const movieItem = document.createElement('div');
        movieItem.innerHTML = `<div class="search-item-thumbnail">
                                <img src="${result.poster_path
                                    ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                                    : result.backdrop_path
                                        ? `https://image.tmdb.org/t/p/w300${result.backdrop_path}`
                                        : 'https://via.placeholder.com/92x138?text=No+Image'}">
                            </div>
                            <div class="search-item-info">
                                <h3>${shortenedTitle}</h3>
                                <p>tv <span> &nbsp; ${year}</span></p>
                            </div>
                            <button class="watchListBtn" id="${result.id}">Add to WatchList</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        watchListBtn.addEventListener('click', () => {
            const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
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
                localStorage.setItem('watchlist', JSON.stringify(watchlist));
                watchListBtn.textContent = "Go to WatchList";
                watchListBtn.addEventListener('click', () => {
                    window.location.href = '../watchList/watchlist.html';
                });
            } else {
                window.location.href = '../watchList/watchlist.html';
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        thumbnail.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${result.id}`;
        });

        info.addEventListener('click', () => {
            window.location.href = `../movie_details/movie_details.html?media=tv&id=${result.id}`;
        });

        movieItem.setAttribute('class', 'movie-list');

        searchResults.appendChild(movieItem);
    });

    searchResults.style.visibility = "visible";
}

if (goToWatchlistBtn) {
    goToWatchlistBtn.addEventListener('click', function() {
        window.location.href = '../watchList/watchlist.html';
    });
}

initSearch();

function loadContent() {
    console.log('Loading TV show content...');

    updateBannerForSection();

    fetchTVShows('netflix-container', 'netflix_originals');
    fetchTVShows('disney-container', 'disney_plus');
    fetchTVShows('drama-tv-container', 'drama');
    fetchTVShows('crime-tv-container', 'crime');
    fetchTVShows('comedy-tv-container', 'comedy');
    fetchTVShows('actionadventure-container', 'action');
    fetchTVShows('mystery-container', 'mystery');
    fetchTVShows('fantasy-container', 'fantasy');
    fetchTVShows('reality-container', 'reality');
    fetchTVShows('scifi-tv-container', 'scifi');
    fetchTVShows('documentary-tv-container', 'documentary');

    setTimeout(() => {
        const netflixPrevBtn = document.querySelector('.netflix-previous');
        const netflixNextBtn = document.querySelector('.netflix-next');
        const netflixContainer = document.querySelector('.netflix-container');

        if (netflixPrevBtn && netflixNextBtn) {
            netflixPrevBtn.style.height = '340px';
            netflixNextBtn.style.height = '340px';
            netflixPrevBtn.addEventListener('click', function() {
                const container = document.querySelector('.netflix-container');
                if (container) {
                    container.scrollBy({
                        left: -800,
                        behavior: 'smooth'
                    });
                }
            });
            netflixNextBtn.addEventListener('click', function() {
                const container = document.querySelector('.netflix-container');
                if (container) {
                    container.scrollBy({
                        left: 800,
                        behavior: 'smooth'
                    });
                }
            });
        }

        if (netflixContainer) {
            netflixContainer.style.minHeight = '380px';
        }

        const navButtons = document.querySelectorAll('.navigation-button:not(.netflix-previous):not(.netflix-next)');
        navButtons.forEach(button => {
            button.style.height = '170px';
        });

        const otherContainers = document.querySelectorAll('.movies-box:not(.netflix-container)');
        otherContainers.forEach(container => {
            container.style.minHeight = '190px';
        });
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadContent();

    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        backToTopBtn.style.display = 'none';

        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });

        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
