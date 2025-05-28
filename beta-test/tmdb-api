// TMDB API Configuration
const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // Free API key for demo purposes
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Cache configuration
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CACHE_KEY = 'freeflix_movie_cards';
const LAST_UPDATE_KEY = 'freeflix_last_update';

// Popular 2025 anime titles to search for
const POPULAR_2025_ANIME = [
    'Solo Leveling',
    'Dandadan',
    'Dragon Ball Daima',
    'The Apothecary Diaries',
    'My Happy Marriage',
    'Kaiju No. 8',
    'Fire Force',
    'Sakamoto Days'
];

class TMDBApi {
    constructor() {
        this.apiKey = TMDB_API_KEY;
        this.baseUrl = TMDB_BASE_URL;
        this.imageBase = TMDB_IMAGE_BASE;
    }

    async fetchTrendingMovies() {
        try {
            const response = await fetch(`${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`);
            const data = await response.json();
            return data.results.slice(0, 4); // Get top 4 trending movies
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            return this.getFallbackMovies();
        }
    }

    async fetchPopularAnime() {
        try {
            // Search for popular 2025 anime
            const animePromises = POPULAR_2025_ANIME.slice(0, 2).map(async (animeName) => {
                const response = await fetch(`${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(animeName)}`);
                const data = await response.json();
                return data.results[0]; // Get first result
            });

            const animeResults = await Promise.all(animePromises);
            return animeResults.filter(anime => anime); // Filter out undefined results
        } catch (error) {
            console.error('Error fetching anime:', error);
            return this.getFallbackAnime();
        }
    }

    async fetchTrendingTVShows() {
        try {
            const response = await fetch(`${this.baseUrl}/trending/tv/week?api_key=${this.apiKey}`);
            const data = await response.json();
            return data.results.slice(0, 2); // Get top 2 trending TV shows
        } catch (error) {
            console.error('Error fetching trending TV shows:', error);
            return this.getFallbackTVShows();
        }
    }

    async fetchMovieCards() {
        try {
            const [movies, tvShows, anime] = await Promise.all([
                this.fetchTrendingMovies(),
                this.fetchTrendingTVShows(),
                this.fetchPopularAnime()
            ]);

            // Ensure we have content for all categories (2 movies, 2 TV shows, 2 anime)
            const movieCards = [];

            // Add 2 trending movies
            movies.slice(0, 2).forEach(movie => {
                movieCards.push({
                    title: movie.title,
                    image: `${this.imageBase}${movie.poster_path}`,
                    info: `${new Date(movie.release_date).getFullYear()} • ⭐${movie.vote_average.toFixed(1)}`,
                    type: 'movie'
                });
            });

            // Add 2 trending TV shows
            tvShows.slice(0, 2).forEach(show => {
                movieCards.push({
                    title: show.name,
                    image: `${this.imageBase}${show.poster_path}`,
                    info: `TV Show • ⭐${show.vote_average.toFixed(1)}`,
                    type: 'tv'
                });
            });

            // Add 2 popular anime
            anime.slice(0, 2).forEach(show => {
                movieCards.push({
                    title: show.name,
                    image: `${this.imageBase}${show.poster_path}`,
                    info: `Anime • ⭐${show.vote_average.toFixed(1)}`,
                    type: 'anime'
                });
            });

            return movieCards;
        } catch (error) {
            console.error('Error fetching movie cards:', error);
            return this.getFallbackCards();
        }
    }

    // Smart caching system
    async fetchMovieCardsWithCache() {
        try {
            // Check if we have cached data and if it's still valid
            const cachedData = localStorage.getItem(CACHE_KEY);
            const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
            const now = Date.now();

            if (cachedData && lastUpdate) {
                const cacheAge = now - parseInt(lastUpdate);
                if (cacheAge < CACHE_DURATION) {
                    console.log('Using cached movie cards data');
                    return JSON.parse(cachedData);
                }
            }

            // If no cache or cache is expired, fetch fresh data
            console.log('Fetching fresh movie cards data from TMDB');
            const freshData = await this.fetchMovieCards();

            // Store in cache with current timestamp
            localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
            localStorage.setItem(LAST_UPDATE_KEY, now.toString());

            return freshData;
        } catch (error) {
            console.error('Error with smart caching:', error);
            // Try to use cached data even if expired, or fallback
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                console.log('Using expired cache as fallback');
                return JSON.parse(cachedData);
            }
            return this.getFallbackCards();
        }
    }

    getFallbackMovies() {
        return [
            {
                title: 'Avengers: Endgame',
                poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
                release_date: '2019-04-24',
                vote_average: 8.4
            },
            {
                title: 'Spider-Man: No Way Home',
                poster_path: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
                release_date: '2021-12-15',
                vote_average: 8.2
            },
            {
                title: 'The Batman',
                poster_path: '/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
                release_date: '2022-03-01',
                vote_average: 7.8
            },
            {
                title: 'Top Gun: Maverick',
                poster_path: '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
                release_date: '2022-05-24',
                vote_average: 8.3
            }
        ];
    }

    getFallbackTVShows() {
        return [
            {
                name: 'The Bear',
                poster_path: '/7vxDdJKEk7i8LCSlBWwUIyFb6JM.jpg',
                vote_average: 8.7,
                first_air_date: '2022-06-23'
            },
            {
                name: 'House of the Dragon',
                poster_path: '/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
                vote_average: 8.4,
                first_air_date: '2022-08-21'
            }
        ];
    }

    getFallbackAnime() {
        return [
            {
                name: 'Solo Leveling',
                poster_path: '/jzo8MfgYXNl0kdgmX7EjkJpLnTE.jpg',
                vote_average: 8.6
            },
            {
                name: 'Dandadan',
                poster_path: '/cX8MPBaXoOUKN3n9FnKgZNp8Qe1.jpg',
                vote_average: 8.4
            }
        ];
    }

    getFallbackCards() {
        const fallbackMovies = this.getFallbackMovies();
        const fallbackTVShows = this.getFallbackTVShows();
        const fallbackAnime = this.getFallbackAnime();

        const cards = [];

        // Add 2 movies
        fallbackMovies.slice(0, 2).forEach(movie => {
            cards.push({
                title: movie.title,
                image: `${this.imageBase}${movie.poster_path}`,
                info: `${new Date(movie.release_date).getFullYear()} • ⭐${movie.vote_average.toFixed(1)}`,
                type: 'movie'
            });
        });

        // Add 2 TV shows
        fallbackTVShows.forEach(show => {
            cards.push({
                title: show.name,
                image: `${this.imageBase}${show.poster_path}`,
                info: `TV Show • ⭐${show.vote_average.toFixed(1)}`,
                type: 'tv'
            });
        });

        // Add 2 anime
        fallbackAnime.forEach(show => {
            cards.push({
                title: show.name,
                image: `${this.imageBase}${show.poster_path}`,
                info: `Anime • ⭐${show.vote_average.toFixed(1)}`,
                type: 'anime'
            });
        });

        return cards;
    }
}

// Initialize and update movie cards
async function updateMovieCards() {
    try {
        const tmdb = new TMDBApi();
        const movieCards = await tmdb.fetchMovieCardsWithCache();

        const movieCardElements = document.querySelectorAll('.movie-card');

        movieCards.forEach((card, index) => {
            if (movieCardElements[index] && card) {
                const img = movieCardElements[index].querySelector('img');
                const title = movieCardElements[index].querySelector('.movie-card-title');
                const info = movieCardElements[index].querySelector('.movie-card-info');

                // Only update if we have valid data
                if (card.image && !card.image.includes('null')) {
                    if (img) {
                        img.src = card.image;
                        img.alt = card.title;
                        img.onerror = function() {
                            // Fallback to a placeholder if image fails to load
                            this.src = 'https://via.placeholder.com/500x750/1a1a1b/8b5cf6?text=' + encodeURIComponent(card.title);
                        };
                    }
                }
                if (title && card.title) title.textContent = card.title;
                if (info && card.info) info.textContent = card.info;

                // Add a loading effect
                movieCardElements[index].style.opacity = '0';
                setTimeout(() => {
                    movieCardElements[index].style.transition = 'opacity 0.5s ease';
                    movieCardElements[index].style.opacity = '1';
                }, index * 100);
            }
        });

        console.log('Movie cards updated successfully with TMDB data');
    } catch (error) {
        console.error('Failed to update movie cards:', error);
        // Cards will maintain their fallback content
    }
}

// Function to manually refresh cache
function refreshMovieCards() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(LAST_UPDATE_KEY);
    console.log('Cache cleared, refreshing movie cards...');
    updateMovieCards();
}

// Function to get cache status
function getCacheStatus() {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    if (!lastUpdate) return 'No cache';

    const cacheAge = Date.now() - parseInt(lastUpdate);
    const hoursAgo = Math.floor(cacheAge / (60 * 60 * 1000));
    const minutesAgo = Math.floor((cacheAge % (60 * 60 * 1000)) / (60 * 1000));

    if (hoursAgo > 0) {
        return `Updated ${hoursAgo}h ${minutesAgo}m ago`;
    } else {
        return `Updated ${minutesAgo}m ago`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TMDBApi, updateMovieCards, refreshMovieCards, getCacheStatus };
}
