//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Define server fallback chain
const serverFallbackChain = ['iframe.pstream.org', 'vidsrc.su', 'vidsrc.vip', 'vidlink.pro'];

// Function to show toast notification
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Function to handle content download (declare early to avoid hoisting issues)
function handleDownload() {
    let downloadUrl = '';
    let contentType = media === 'movie' ? 'movie' : 'episode';
    showToast(`Preparing your ${contentType} download...`, 'info');
    if (media === 'movie') {
        downloadUrl = `https://dl.vidsrc.vip/movie/${id}`;
    } else if (media === 'tv') {
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/${episodeNumber}`;
        } else if (seasonSelect && seasonSelect.value) {
            const seasonNumber = seasonSelect.value;
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/${seasonNumber}/1`;
        } else {
            downloadUrl = `https://dl.vidsrc.vip/tv/${id}/1/1`;
        }
    }
    console.log(`Download URL: ${downloadUrl}`);
    if (downloadUrl) {
        const encodedUrl = encodeURIComponent(downloadUrl);
        setTimeout(() => {
            window.location.href = `../download.html?url=${encodedUrl}`;
        }, 800);
    } else {
        showToast("Unable to generate download URL. Please try a different server.", 'error');
    }
}

// Function to ensure iframe controls are accessible on mobile
function ensureControlsAccessible() {
    if (window.innerWidth <= 560) {
        const iframe = document.getElementById('iframe');
        const spacer = document.getElementById('player-controls-spacer');
        if (iframe && spacer) {
            spacer.style.height = '75px';
            iframe.style.paddingRight = '50px';
            iframe.style.minHeight = '220px';
        }
    }
}

// Selecting various elements on the page for displaying movie details
const movieTitle = document.getElementById('movieTitle');
const moviePoster = document.getElementById('moviePoster');
const movieYear = document.getElementById('movieYear');
const rating = document.getElementById('rating');
const genre = document.getElementById('genre');
const plot = document.getElementById("plot");
const language = document.getElementById("language");
const iframe = document.getElementById("iframe");
const watchListBtn = document.querySelector('.watchListBtn');
const downloadBtn = document.querySelector('.downloadBtn');
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Season and Episode selectors
const seasonsContainer = document.getElementById('seasons-container');
const seasonSelect = document.getElementById('season-select');
const episodesList = document.getElementById('episodes-list');

// API key for TMDB API
const api_Key = 'e79515e88dfd7d9f6eeca36e49101ac2';

// Retrieve the TMDb ID and Media from the URL parameter
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const media = params.get("media");

// Function to check if content is actual anime (Japanese origin) vs western animation
function isActualAnime(item) {
    // Check for animation genre first
    if (!item.genre_ids || !item.genre_ids.includes(16)) {
        return false;
    }

    // Check origin country - anime typically originates from Japan
    if (item.origin_country && item.origin_country.includes('JP')) {
        return true;
    }

    // Check original language - anime is typically in Japanese
    if (item.original_language === 'ja') {
        return true;
    }

    // Check production companies for known anime studios (if available)
    if (item.production_companies) {
        const animeStudios = [
            'Studio Ghibli', 'Toei Animation', 'Madhouse', 'Studio Pierrot', 'Bones',
            'MAPPA', 'Wit Studio', 'Production I.G', 'Sunrise', 'A-1 Pictures',
            'Kyoto Animation', 'Shaft', 'Trigger', 'CloverWorks', 'Ufotable'
        ];
        return item.production_companies.some(company =>
            animeStudios.some(studio =>
                company.name.toLowerCase().includes(studio.toLowerCase())
            )
        );
    }

    // For items without enough metadata, use heuristics based on title patterns
    const title = (item.title || item.name || '').toLowerCase();

    // Common western animation patterns to exclude
    const westernPatterns = [
        'teen titans', 'adventure time', 'steven universe', 'gravity falls',
        'rick and morty', 'south park', 'family guy', 'simpsons',
        'american dad', 'futurama', 'bob\'s burgers', 'archer',
        'bojack horseman', 'big mouth', 'f is for family'
    ];

    // If it matches western patterns, it's not anime
    if (westernPatterns.some(pattern => title.includes(pattern))) {
        return false;
    }

    // If it has animation genre but no clear indicators, be conservative
    // Default to false unless we have positive indicators it's anime
    return false;
}

// Function to check if current content is actual anime
function isCurrentContentAnime() {
    if (!currentMovieDetails || !currentMovieDetails.genres) {
        return false;
    }

    // Must have animation genre
    const hasAnimationGenre = currentMovieDetails.genres.some(genre => genre.id === 16);
    if (!hasAnimationGenre) {
        return false;
    }

    // Check for Japanese origin indicators
    return (currentMovieDetails.origin_country && currentMovieDetails.origin_country.includes('JP')) ||
           (currentMovieDetails.original_language === 'ja') ||
           (currentMovieDetails.production_companies &&
            currentMovieDetails.production_companies.some(company => {
                const animeStudios = [
                    'Studio Ghibli', 'Toei Animation', 'Madhouse', 'Studio Pierrot', 'Bones',
                    'MAPPA', 'Wit Studio', 'Production I.G', 'Sunrise', 'A-1 Pictures',
                    'Kyoto Animation', 'Shaft', 'Trigger', 'CloverWorks', 'Ufotable'
                ];
                return animeStudios.some(studio =>
                    company.name.toLowerCase().includes(studio.toLowerCase())
                );
            }));
}

// Function to fetch detailed information using its TMDb ID
async function fetchMovieDetails(id) {
    const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}?api_key=${api_Key}`);
    const data = await response.json();
    if (media === "tv" && data) {
        const isAnime = data.genres && data.genres.some(genre => genre.id === 16);
        if (isAnime) {
            data.is_anime = true;
        }
    }
    return data;
}

// Function to fetch video details (trailers) for a movie or TV show
async function fetchVideoDetails(id) {
    const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/videos?api_key=${api_Key}`);
    const data = await response.json();
    return data.results;
}

// Function to fetch TV show seasons
async function fetchTVSeasons(id) {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${api_Key}`);
    const data = await response.json();
    return data.seasons;
}

// Function to fetch episodes for a specific season
async function fetchSeasonEpisodes(tvId, seasonNumber) {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${api_Key}`);
    const data = await response.json();
    return data.episodes;
}

document.getElementById('change-server-btn').addEventListener('click', () => {
    const serverSelector = document.getElementById('server-selector');
    serverSelector.style.display = (serverSelector.style.display === 'block') ? 'none' : 'block';
    console.log(`Current media type: ${media}, ID: ${id}`);
    if (media === "tv") {
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            console.log(`Active episode - Season: ${activeEpisode.dataset.seasonNumber}, Episode: ${activeEpisode.dataset.episodeNumber}`);
        }
    }
});

document.getElementById('server-selector').addEventListener('click', (e) => {
  if (e.target !== document.getElementById('server')) {
    document.getElementById('server-selector').style.display = 'none';
  }
});

document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('server-selector').style.display = 'none';
});

// Function to create season dropdown items
function createSeasonOptions(seasons) {
    seasonSelect.innerHTML = '';
    seasons.forEach(season => {
        if (season.season_number > 0) {
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Season ${season.season_number} (${season.episode_count} Episodes)`;
            seasonSelect.appendChild(option);
        }
    });
    seasonSelect.addEventListener('change', function() {
        const selectedSeason = this.value;
        loadEpisodes(id, selectedSeason);
    });
    if (seasons.length > 0) {
        const firstSeason = seasons.find(season => season.season_number > 0);
        if (firstSeason) {
            loadEpisodes(id, firstSeason.season_number);
        }
    }
}

// Function to create episode list items
function createEpisodesList(episodes) {
    episodesList.innerHTML = '';
    episodes.forEach(episode => {
        const episodeItem = document.createElement('div');
        episodeItem.className = 'episode-item';
        episodeItem.dataset.episodeNumber = episode.episode_number;
        episodeItem.dataset.seasonNumber = episode.season_number;
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';
        const thumbnail = document.createElement('img');
        thumbnail.className = 'episode-thumbnail';
        thumbnail.src = episode.still_path
            ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
            : 'https://via.placeholder.com/300x170?text=No+Image';
        thumbnail.alt = `${episode.name} Thumbnail`;
        const episodeNumber = document.createElement('div');
        episodeNumber.className = 'episode-number';
        episodeNumber.textContent = episode.episode_number;
        thumbnailContainer.appendChild(thumbnail);
        thumbnailContainer.appendChild(episodeNumber);
        const episodeInfo = document.createElement('div');
        episodeInfo.className = 'episode-info';
        const episodeTitle = document.createElement('div');
        episodeTitle.className = 'episode-title';
        episodeTitle.textContent = episode.name;
        const episodeDescription = document.createElement('div');
        episodeDescription.className = 'episode-description';
        episodeDescription.textContent = episode.overview || 'No description available.';
        episodeInfo.appendChild(episodeTitle);
        episodeInfo.appendChild(episodeDescription);
        episodeItem.appendChild(thumbnailContainer);
        episodeItem.appendChild(episodeInfo);
        episodeItem.addEventListener('click', () => {
            playEpisode(id, episode.season_number, episode.episode_number);
        });
        episodesList.appendChild(episodeItem);
    });
}

// Function to load episodes for a specific season
async function loadEpisodes(tvId, seasonNumber) {
    try {
        const episodes = await fetchSeasonEpisodes(tvId, seasonNumber);
        createEpisodesList(episodes);
    } catch (error) {
        console.error('Error loading episodes:', error);
        episodesList.innerHTML = '<p>Error loading episodes. Please try again.</p>';
    }
}

// Add code to update player when source changes
function loadMedia(embedURL, server) {
    iframe.setAttribute('src', embedURL);
    iframe.style.display = "block";
    moviePoster.style.display = "none";
    setTimeout(ensureControlsAccessible, 500);
}

// Function to handle video source change based on selected server
async function changeServer() {
    const server = document.getElementById('server').value;
    const type = media === "movie" ? "movie" : (media === "anime" ? "anime" : "tv");
    if (type === "tv" && seasonsContainer.style.display === "flex") {
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            playEpisode(id, seasonNumber, episodeNumber);
            return;
        }
    }
    let embedURL = "";
    if (type === "anime") {
        switch (server) {
            case "vidlink.pro":
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/anime/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/anime/?mal=${id}`;
                break;
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/anime/${id}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/anime/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/anime/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/anime/${id}`;
                break;
            default:
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
        }
    } else {
        switch (server) {
            case "vidlink.pro":
                if (type === "tv") {
                    embedURL = `https://vidlink.pro/tv/${id}/1/1?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                } else {
                    embedURL = `https://vidlink.pro/movie/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                }
                break;
            case "iframe.pstream.org":
                if (type === "tv") {
                    embedURL = `https://iframe.pstream.org/embed/tmdb-tv-${id}/1/1?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
                } else {
                    embedURL = `https://iframe.pstream.org/embed/tmdb-movie-${id}?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
                }
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
                break;
            case "vidsrc.su":
                embedURL = `https://vidsrc.su/embed/${type}/${id}`;
                break;
            case "vidsrc.vip":
                embedURL = `https://vidsrc.vip/${type}/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/${type}/${id}`;
                break;
            default:
                if (type === "tv") {
                    embedURL = `https://iframe.pstream.org/embed/tmdb-tv-${id}/1/1?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
                } else {
                    embedURL = `https://iframe.pstream.org/embed/tmdb-movie-${id}?theme=grape&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
                }
                break;
        }
    }
    console.log(`Loading ${type} from: ${embedURL}`);
    iframe.setAttribute('src', embedURL);
    iframe.setAttribute('playsinline', '');
    iframe.setAttribute('webkit-playsinline', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('allowfullscreen', '');
    let currentIndex = serverFallbackChain.indexOf(server);
    iframe.onerror = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < serverFallbackChain.length) {
            const nextServer = serverFallbackChain[nextIndex];
            document.getElementById('server').value = nextServer;
            currentIndex = nextIndex;
            changeServer();
        }
    };
    iframe.style.display = "block";
    moviePoster.style.display = "none";
    setTimeout(ensureControlsAccessible, 500);
}

// Function to play a specific episode
function playEpisode(tvId, seasonNumber, episodeNumber) {
    const server = document.getElementById('server').value;
    let embedURL = "";
    switch (server) {
        case "vidsrc.vip":
            embedURL = `https://vidsrc.vip/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        case "vidlink.pro":
            embedURL = `https://vidlink.pro/tv/${tvId}/${seasonNumber}/${episodeNumber}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
            break;
        case "iframe.pstream.org":
            embedURL = `https://iframe.pstream.org/embed/tmdb-tv-${tvId}/${seasonNumber}/${episodeNumber}?theme=purple&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
            break;
        case "vidsrc.cc":
            embedURL = `https://vidsrc.cc/v2/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        case "vidsrc.me":
            embedURL = `https://vidsrc.net/embed/tv/?tmdb=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`;
            break;
        case "vidsrc.su":
            embedURL = `https://vidsrc.su/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        case "2embed":
            embedURL = `https://www.2embed.cc/embedtv/${tvId}&s=${seasonNumber}&e=${episodeNumber}`;
            break;
        case "movieapi.club":
            embedURL = `https://moviesapi.club/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        default:
            embedURL = `https://iframe.pstream.org/embed/tmdb-tv-${tvId}/${seasonNumber}/${episodeNumber}?theme=purple&language=en&logo=false&downloads=false&language-order=en%2Chi%2Cfr%2Cde%2Cnl%2Cpt&allinone=true&scale=1.0&backlink=https%3A%2F%2Ffreeflix.top&fedapi=false&interface-settings=false&tips=false&has-watchparty=false`;
            break;
    }
    if (embedURL) {
        console.log(`Loading TV episode from: ${embedURL}`);
        iframe.setAttribute('src', embedURL);
        iframe.setAttribute('playsinline', '');
        iframe.setAttribute('webkit-playsinline', 'true');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
        iframe.setAttribute('allowfullscreen', '');
        let epIndex = serverFallbackChain.indexOf(server);
        iframe.onerror = () => {
            const nextEp = epIndex + 1;
            if (nextEp < serverFallbackChain.length) {
                const nextSrv = serverFallbackChain[nextEp];
                document.getElementById('server').value = nextSrv;
                epIndex = nextEp;
                changeServer();
            }
        };
        iframe.style.display = "block";
        moviePoster.style.display = "none";
        setTimeout(ensureControlsAccessible, 500);
        const episodes = document.querySelectorAll('.episode-item');
        episodes.forEach(item => item.classList.remove('active'));
        const currentEpisode = document.querySelector(`.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`);
        if (currentEpisode) {
            currentEpisode.classList.add('active');
            episodesList.scrollTop = currentEpisode.offsetTop - episodesList.offsetTop - 10;
        }
        if (window.innerWidth <= 740) {
            window.scrollTo({
                top: iframe.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }
}

// Function to display movie details on the page
async function displayMovieDetails() {
    try {
        const movieDetails = await fetchMovieDetails(id);
        var spokenlanguage = movieDetails.spoken_languages ? movieDetails.spoken_languages.map(language => language.english_name) : ['Unknown'];
        language.textContent = spokenlanguage.join(', ');
        var genreNames = movieDetails.genres ? movieDetails.genres.map(genre => genre.name) : ['Unknown'];
        genre.innerText = genreNames.join(', ');
        if (media === "anime" && movieDetails.overview === 'Unable to load anime details.') {
            plot.textContent = "This anime is available for viewing. Click the Play button to start.";
        } else if (movieDetails.overview && movieDetails.overview.length > 290) {
            plot.textContent = `${movieDetails.overview.substring(0, 290)}...`;
        } else {
            plot.textContent = movieDetails.overview || 'No description available';
        }
        movieTitle.textContent = movieDetails.name || movieDetails.title;
        if (movieDetails.backdrop_path) {
            if (movieDetails.backdrop_path.startsWith('http')) {
                moviePoster.src = movieDetails.backdrop_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`;
            }
        } else if (movieDetails.poster_path) {
            if (movieDetails.poster_path.startsWith('http')) {
                moviePoster.src = movieDetails.poster_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
            }
        } else {
            moviePoster.src = 'https://via.placeholder.com/500x281?text=No+Image+Available';
        }
        movieYear.textContent = `${movieDetails.release_date || movieDetails.first_air_date || 'Unknown'}`;
        rating.textContent = movieDetails.vote_average || 'N/A';
        if (media === "tv") {
            const seasons = await fetchTVSeasons(id);
            if (seasons && seasons.length > 0) {
                createSeasonOptions(seasons);
                seasonsContainer.style.display = "flex";
            }
        }
        changeServer();
        if (watchlist.some(favoriteMovie => favoriteMovie.id === movieDetails.id)) {
            watchListBtn.textContent = "Remove From WatchList";
        } else {
            watchListBtn.textContent = "Add To WatchList";
        }
        watchListBtn.addEventListener('click', () => toggleFavorite(movieDetails));
        downloadBtn.addEventListener('click', handleDownload);
        loadRecommendations(movieDetails);
    } catch (error) {
        console.error('Error displaying movie details:', error);
        movieTitle.textContent = "Details are not available right now! Please try after some time.";
    }
}

// Function to toggle adding/removing from favorites
function toggleFavorite(movieDetails) {
    const index = watchlist.findIndex(movie => movie.id === movieDetails.id);
    if (index !== -1) {
        watchlist.splice(index, 1);
        watchListBtn.textContent = "Add To WatchList";
    } else {
        watchlist.push(movieDetails);
        watchListBtn.textContent = "Remove From WatchList";
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Enhanced server dropdown UI functionality
function initServerDropdown() {
    const serverDropdownHeader = document.querySelector('.server-dropdown-header');
    const serverDropdownContent = document.querySelector('.server-dropdown-content');
    const serverDropdown = document.querySelector('.server-dropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    if (!serverDropdownHeader) return;
    serverDropdownHeader.addEventListener('click', function(event) {
        event.stopPropagation();
        const isShowing = !serverDropdownContent.classList.contains('show');
        serverDropdownContent.classList.toggle('show');
        serverDropdownHeader.classList.toggle('active');
        dropdownArrow.classList.toggle('up');
        if (isShowing) {
            serverDropdown.classList.add('has-open-dropdown');
            setTimeout(() => {
                const contentRect = serverDropdownContent.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                if (contentRect.bottom > viewportHeight) {
                    window.scrollBy({
                        top: Math.min(contentRect.height, contentRect.bottom - viewportHeight + 20),
                        behavior: 'smooth'
                    });
                }
            }, 50);
        } else {
            serverDropdown.classList.remove('has-open-dropdown');
        }
    });
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.server-dropdown')) {
            serverDropdownContent.classList.remove('show');
            serverDropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
            serverDropdown.classList.remove('has-open-dropdown');
        }
    });
    const serverOptions = document.querySelectorAll('.server-option');
    const selectedServerDisplay = document.querySelector('.selected-server');
    serverOptions.forEach(option => {
        option.addEventListener('click', function() {
            const serverValue = this.getAttribute('data-server');
            document.getElementById('server').value = serverValue;
            selectedServerDisplay.innerHTML = this.innerHTML;
            serverOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            serverDropdownContent.classList.remove('show');
            serverDropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
            serverDropdown.classList.remove('has-open-dropdown');
            changeServer();
        });
    });
    const initialServer = document.getElementById('server').value;
    const initialServerOption = document.querySelector(`.server-option[data-server="${initialServer}"]`);
    if (initialServerOption) {
        initialServerOption.classList.add('active');
        selectedServerDisplay.innerHTML = initialServerOption.innerHTML;
    }
}

document.getElementById('server').addEventListener('change', () => {
    changeServer();
});

document.addEventListener('DOMContentLoaded', function() {
    ensureControlsAccessible();
    window.addEventListener('resize', function() {
        ensureControlsAccessible();
    });
    setTimeout(ensureControlsAccessible, 1000);
    const downloadBtn = document.querySelector('.downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
            ripple.classList.add('active');
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
});

window.addEventListener('load', function() {
    const serverSelect = document.getElementById('server');
    if (serverSelect && !serverSelect.value) {
        serverSelect.value = "iframe.pstream.org";
    }
    initServerDropdown();
    displayMovieDetails();
    const banner = document.getElementById('server-notice-banner');
    const bannerClose = document.getElementById('banner-close-btn');
    if (banner) {
        // Removed automatic scroll to bottom - let user stay at current position
        banner.style.display = 'flex';
        bannerClose.addEventListener('click', () => {
            banner.style.display = 'none';
        });
        setTimeout(() => { banner.style.display = 'none'; }, 11000);
    }
});

// --- Enhanced Multi-Category Recommendations System ---

// Global variables for recommendations
let currentMovieDetails = null;
let loadedPages = {
    recommendations: 1,
    similar: 1,
    trending: 1
};
let maxPages = 3; // Limit to prevent too many API calls

// Function to load recommendations based on current movie/show
async function loadRecommendations(currentItem) {
    currentMovieDetails = currentItem;
    Promise.all([
        loadRecommendedForYou(),
        loadSimilarContent(),
        loadTrendingContent()
    ]).then(() => {
        setupLoadMoreButton();
    }).catch(error => {
        console.error('Error loading recommendations:', error);
    });
}

// Function to load "Recommended For You" section
async function loadRecommendedForYou() {
    const grid = document.getElementById('recommendationsGrid');
    const loading = document.getElementById('recommendationsLoading');
    if (!grid || !loading) return;
    try {
        loading.classList.remove('hidden');
        const recommendations = await fetchRecommendations();
        displayContentInGrid(recommendations, grid, loading);
    } catch (error) {
        console.error('Error loading recommended content:', error);
        loading.classList.add('hidden');
    }
}

// Function to load "More Like This" section
async function loadSimilarContent() {
    const grid = document.getElementById('similarGrid');
    const loading = document.getElementById('similarLoading');
    if (!grid || !loading) return;
    try {
        loading.classList.remove('hidden');
        const similar = await fetchSimilarMovies();
        displayContentInGrid(similar, grid, loading);
    } catch (error) {
        console.error('Error loading similar content:', error);
        loading.classList.add('hidden');
    }
}

// Function to load "Trending Now" section
async function loadTrendingContent() {
    const grid = document.getElementById('trendingGrid');
    const loading = document.getElementById('trendingLoading');
    if (!grid || !loading) return;
    try {
        loading.classList.remove('hidden');
        const trending = await fetchTrendingContent();
        displayContentInGrid(trending, grid, loading);
    } catch (error) {
        console.error('Error loading trending content:', error);
        loading.classList.add('hidden');
    }
}



// Enhanced fetch functions for different content types
async function fetchRecommendations() {
    try {
        const recommendations = [];

        // Check if current content is actual anime (not just animation)
        const isCurrentAnime = isCurrentContentAnime();

        // If current content is anime, prioritize anime recommendations
        if (isCurrentAnime) {
            // Fetch anime from discover endpoint with animation genre AND Japanese language
            const animeResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_original_language=ja&page=${loadedPages.recommendations}&sort_by=popularity.desc`);
            const animeData = await animeResponse.json();
            if (animeData.results && animeData.results.length > 0) {
                const filteredAnime = animeData.results.filter(item =>
                    item.id !== parseInt(id) && isActualAnime(item)
                );
                recommendations.push(...filteredAnime.slice(0, 12));
            }
        }

        // Get regular recommendations
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/recommendations?api_key=${api_Key}&page=${loadedPages.recommendations}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            let filteredResults = data.results;

            // If current content is anime, filter to prefer actual anime recommendations
            if (isCurrentAnime) {
                filteredResults = data.results.filter(item => isActualAnime(item));

                // If no anime recommendations found, add some non-anime but keep it minimal
                if (filteredResults.length < 5) {
                    const nonAnime = data.results.filter(item => !isActualAnime(item)).slice(0, 3);
                    filteredResults = [...filteredResults, ...nonAnime];
                }
            }

            const needed = 15 - recommendations.length;
            recommendations.push(...filteredResults.slice(0, needed));
        }

        // If still not enough and it's anime, get more anime content
        if (recommendations.length < 10 && isCurrentAnime) {
            const moreAnimeResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_original_language=ja&page=${loadedPages.recommendations + 1}&sort_by=vote_average.desc&vote_count.gte=100`);
            const moreAnimeData = await moreAnimeResponse.json();
            if (moreAnimeData.results && moreAnimeData.results.length > 0) {
                const filteredMoreAnime = moreAnimeData.results.filter(item =>
                    item.id !== parseInt(id) &&
                    !recommendations.some(rec => rec.id === item.id) &&
                    isActualAnime(item)
                );
                const needed = 15 - recommendations.length;
                recommendations.push(...filteredMoreAnime.slice(0, needed));
            }
        }

        // Fallback to similar content if still not enough
        if (recommendations.length < 10) {
            const similarResponse = await fetch(`https://api.themoviedb.org/3/${media}/${id}/similar?api_key=${api_Key}&page=1`);
            const similarData = await similarResponse.json();
            if (similarData.results && similarData.results.length > 0) {
                let filteredSimilar = similarData.results;

                // Filter for actual anime if current content is anime
                if (isCurrentAnime) {
                    filteredSimilar = similarData.results.filter(item => isActualAnime(item));

                    // If no anime similar content, add limited non-anime
                    if (filteredSimilar.length < 3) {
                        const nonAnimeSimilar = similarData.results.filter(item => !isActualAnime(item)).slice(0, 2);
                        filteredSimilar = [...filteredSimilar, ...nonAnimeSimilar];
                    }
                }

                const alreadyAdded = recommendations.map(r => r.id);
                const uniqueSimilar = filteredSimilar.filter(item => !alreadyAdded.includes(item.id));
                const needed = 15 - recommendations.length;
                recommendations.push(...uniqueSimilar.slice(0, needed));
            }
        }

        return recommendations;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

async function fetchSimilarMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/${media}/${id}/similar?api_key=${api_Key}&page=${loadedPages.similar}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return [];
        }

        // Check if current content is actual anime (not just animation)
        const isCurrentAnime = isCurrentContentAnime();

        let filteredResults = data.results;

        // If current content is anime, prioritize actual anime similar content
        if (isCurrentAnime) {
            const animeResults = data.results.filter(item => isActualAnime(item));

            // If we have anime similar content, use primarily that
            if (animeResults.length > 0) {
                filteredResults = animeResults;

                // If not enough anime similar content, add a few non-anime (max 3)
                if (animeResults.length < 8) {
                    const nonAnimeResults = data.results.filter(item => !isActualAnime(item)).slice(0, 3);
                    filteredResults = [...animeResults, ...nonAnimeResults];
                }
            } else {
                // If no anime in similar results, fetch more anime content from discover with Japanese language
                try {
                    const animeDiscoverResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_original_language=ja&page=${loadedPages.similar}&sort_by=popularity.desc&vote_count.gte=50`);
                    const animeDiscoverData = await animeDiscoverResponse.json();

                    if (animeDiscoverData.results && animeDiscoverData.results.length > 0) {
                        const animeContent = animeDiscoverData.results.filter(item =>
                            item.id !== parseInt(id) && isActualAnime(item)
                        );
                        filteredResults = [...animeContent.slice(0, 10), ...data.results.slice(0, 5)];
                    }
                } catch (error) {
                    console.log('Could not fetch additional anime content, using available similar content');
                }
            }
        }

        return filteredResults.slice(0, 15);
    } catch (error) {
        console.error('Error fetching similar movies:', error);
        return [];
    }
}

async function fetchTrendingContent() {
    try {
        // Check if current content is actual anime (not just animation)
        const isCurrentAnime = isCurrentContentAnime();

        let trendingContent = [];

        // If current content is anime, fetch trending anime first
        if (isCurrentAnime) {
            // Fetch trending anime content with Japanese language filter
            const trendingAnimeResponse = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_original_language=ja&page=${loadedPages.trending}&sort_by=popularity.desc&first_air_date.gte=2020-01-01`);
            const trendingAnimeData = await trendingAnimeResponse.json();

            if (trendingAnimeData.results && trendingAnimeData.results.length > 0) {
                const animeFiltered = trendingAnimeData.results.filter(item =>
                    item.id !== parseInt(id) && isActualAnime(item)
                );
                trendingContent.push(...animeFiltered.slice(0, 10));
            }
        }

        // Get regular trending content
        const response = await fetch(`https://api.themoviedb.org/3/trending/${media}/week?api_key=${api_Key}&page=${loadedPages.trending}`);
        const data = await response.json();
        const filtered = data.results ? data.results.filter(item => item.id !== parseInt(id)) : [];

        if (isCurrentAnime) {
            // For anime content, prioritize actual anime in trending results
            const animeTrending = filtered.filter(item => isActualAnime(item));
            const nonAnimeTrending = filtered.filter(item => !isActualAnime(item));

            // Add anime trending first, then limited non-anime
            trendingContent.push(...animeTrending);
            const remainingSlots = 15 - trendingContent.length;
            if (remainingSlots > 0) {
                trendingContent.push(...nonAnimeTrending.slice(0, Math.min(remainingSlots, 3)));
            }
        } else {
            // For non-anime content, use regular trending
            trendingContent = filtered;
        }

        // Remove duplicates and limit results
        const uniqueContent = trendingContent.filter((item, index, self) =>
            index === self.findIndex(t => t.id === item.id)
        );

        return uniqueContent.slice(0, 15);
    } catch (error) {
        console.error('Error fetching trending content:', error);
        return [];
    }
}



// Enhanced display function
function displayContentInGrid(content, grid, loading) {
    if (!grid || !loading) return;
    loading.classList.add('hidden');
    if (!content || content.length === 0) {
        grid.style.display = 'none';
        return;
    }
    if (!grid.children.length) {
        grid.innerHTML = '';
    }
    content.forEach((item, index) => {
        const card = createRecommendationCard(item);
        card.style.animationDelay = `${(index % 8) * 0.1}s`;
        grid.appendChild(card);
    });
    setTimeout(() => {
        grid.classList.add('loaded');
    }, 100);
}

// Enhanced card creation with more details
function createRecommendationCard(item) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const overview = item.overview || 'No description available.';
    const posterPath = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : 'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Image';
    let genreText = '';
    if (item.genre_ids && item.genre_ids.length > 0) {
        const genreMap = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
            99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
            27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
            10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
            10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
        };
        genreText = genreMap[item.genre_ids[0]] || (media === 'movie' ? 'Movie' : 'TV Show');
    } else {
        genreText = media === 'movie' ? 'Movie' : 'TV Show';
    }
    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" class="recommendation-poster" loading="lazy">
        <div class="recommendation-info">
            <h3 class="recommendation-title">${title}</h3>
            <div class="recommendation-meta">
                <span class="recommendation-year">${year}</span>
                <span class="recommendation-rating">${rating}</span>
            </div>
            <p class="recommendation-overview">${overview}</p>
            <span class="recommendation-genre">${genreText}</span>
        </div>
    `;
    card.addEventListener('click', () => {
        const itemMedia = item.title ? 'movie' : 'tv';
        window.location.href = `movie_details.html?id=${item.id}&media=${itemMedia}`;
    });
    return card;
}

// Load more functionality
function setupLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    loadMoreBtn.addEventListener('click', async () => {
        if (loadMoreBtn.classList.contains('loading')) return;
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.querySelector('span').textContent = 'Loading...';
        try {
            Object.keys(loadedPages).forEach(key => {
                if (loadedPages[key] < maxPages) {
                    loadedPages[key]++;
                }
            });
            await Promise.all([
                loadMoreForCategory('recommendationsGrid', 'recommendationsLoading', fetchRecommendations),
                loadMoreForCategory('similarGrid', 'similarLoading', fetchSimilarMovies),
                loadMoreForCategory('trendingGrid', 'trendingLoading', fetchTrendingContent)
            ]);
            const allPagesLoaded = Object.values(loadedPages).every(page => page >= maxPages);
            if (allPagesLoaded) {
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading more content:', error);
        } finally {
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.querySelector('span').textContent = 'Load More Recommendations';
        }
    });
}

async function loadMoreForCategory(gridId, loadingId, fetchFunction) {
    const grid = document.getElementById(gridId);
    const loading = document.getElementById(loadingId);
    if (!grid || !loading) return;
    try {
        const content = await fetchFunction();
        if (content && content.length > 0) {
            content.forEach((item, index) => {
                const card = createRecommendationCard(item);
                card.style.animationDelay = `${index * 0.1}s`;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error(`Error loading more content for ${gridId}:`, error);
    }
}
