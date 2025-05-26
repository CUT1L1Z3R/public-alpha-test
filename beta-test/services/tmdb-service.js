/**
 * Enhanced TMDB Service
 * Provides robust integration with The Movie Database API
 * Features: Caching, Error Handling, Rate Limiting, Fallbacks
 */

import { TMDB_CONFIG, getTMDBApiKey, isValidApiKey } from '../config/tmdb-config.js';

class TMDBService {
    constructor() {
        this.apiKey = getTMDBApiKey();
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.lastRequestTime = 0;
        this.requestCount = 0;
        this.resetTime = Date.now();
        
        // Initialize service
        this.init();
    }
    
    init() {
        if (!this.apiKey) {
            console.warn('TMDB Service: No API key provided. Service will return fallback responses.');
            return;
        }
        
        if (!isValidApiKey(this.apiKey)) {
            console.warn('TMDB Service: Invalid API key format detected.');
            this.apiKey = null;
            return;
        }
        
        console.log('TMDB Service: Initialized successfully');
    }
    
    /**
     * Set API key dynamically
     * @param {string} key - TMDB API key
     */
    setApiKey(key) {
        if (isValidApiKey(key)) {
            this.apiKey = key;
            console.log('TMDB Service: API key updated successfully');
            return true;
        }
        console.error('TMDB Service: Invalid API key provided');
        return false;
    }
    
    /**
     * Check if service is ready to make API calls
     */
    isReady() {
        return this.apiKey !== null;
    }
    
    /**
     * Rate limiting implementation
     */
    async waitForRateLimit() {
        const now = Date.now();
        
        // Reset counter every 10 seconds
        if (now - this.resetTime >= 10000) {
            this.requestCount = 0;
            this.resetTime = now;
        }
        
        // Check if we've hit the rate limit
        if (this.requestCount >= TMDB_CONFIG.RATE_LIMIT.REQUESTS_PER_SECOND) {
            const waitTime = 10000 - (now - this.resetTime);
            if (waitTime > 0) {
                console.log(`TMDB Service: Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.requestCount = 0;
                this.resetTime = Date.now();
            }
        }
        
        this.requestCount++;
    }
    
    /**
     * Get cached result or execute function
     */
    async getFromCacheOrFetch(cacheKey, fetchFunction, ttl = TMDB_CONFIG.CACHE.TTL) {
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < ttl) {
            console.log(`TMDB Service: Cache hit for ${cacheKey}`);
            return cached.data;
        }
        
        // Fetch new data
        const data = await fetchFunction();
        
        // Store in cache
        if (data) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            // Clean old cache entries
            this.cleanCache();
        }
        
        return data;
    }
    
    /**
     * Clean old cache entries
     */
    cleanCache() {
        if (this.cache.size <= TMDB_CONFIG.CACHE.MAX_ENTRIES) return;
        
        const now = Date.now();
        const entriesToDelete = [];
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > TMDB_CONFIG.CACHE.TTL) {
                entriesToDelete.push(key);
            }
        }
        
        entriesToDelete.forEach(key => this.cache.delete(key));
    }
    
    /**
     * Make API request with retry logic
     */
    async makeRequest(url, retries = TMDB_CONFIG.RATE_LIMIT.RETRY_ATTEMPTS) {
        if (!this.isReady()) {
            throw new Error('TMDB Service not ready: No valid API key');
        }
        
        await this.waitForRateLimit();
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`TMDB API Request (attempt ${attempt}): ${url}`);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid API key');
                    }
                    if (response.status === 429) {
                        // Rate limited, wait and retry
                        const waitTime = Math.pow(2, attempt) * 1000;
                        console.log(`Rate limited, waiting ${waitTime}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`TMDB API Success: Retrieved data for ${url}`);
                return data;
                
            } catch (error) {
                console.warn(`TMDB API attempt ${attempt} failed:`, error.message);
                
                if (attempt === retries) {
                    throw error;
                }
                
                // Wait before retry
                const waitTime = Math.pow(2, attempt) * TMDB_CONFIG.RATE_LIMIT.RETRY_DELAY;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    /**
     * Search for anime/TV shows on TMDB
     */
    async searchTV(query, year = null) {
        if (!query) return null;
        
        const cacheKey = `search_tv_${query}_${year || 'no_year'}`;
        
        return await this.getFromCacheOrFetch(cacheKey, async () => {
            const searchUrl = `${TMDB_CONFIG.BASE_URL}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;
            
            try {
                const data = await this.makeRequest(searchUrl);
                const results = data.results || [];
                
                // Find best match
                let bestMatch = null;
                
                if (year) {
                    // Try to find exact year match first
                    bestMatch = results.find(result => {
                        const resultYear = result.first_air_date ? 
                            new Date(result.first_air_date).getFullYear() : null;
                        return resultYear === year;
                    });
                }
                
                // If no year match or no year provided, take the first result
                if (!bestMatch && results.length > 0) {
                    bestMatch = results[0];
                }
                
                return bestMatch;
                
            } catch (error) {
                console.error('TMDB Search Error:', error.message);
                return null;
            }
        });
    }
    
    /**
     * Get high-quality poster URL for anime
     */
    async getAnimePoster(animeTitle, year = null, size = 'LARGE') {
        try {
            const result = await this.searchTV(animeTitle, year);
            
            if (!result || !result.poster_path) {
                console.log(`No TMDB poster found for: ${animeTitle}`);
                return null;
            }
            
            const imageSize = TMDB_CONFIG.IMAGE_SIZES.POSTER[size] || TMDB_CONFIG.IMAGE_SIZES.POSTER.LARGE;
            const posterUrl = `${TMDB_CONFIG.IMAGE_BASE_URL}/${imageSize}${result.poster_path}`;
            
            console.log(`TMDB poster found for ${animeTitle}: ${posterUrl}`);
            return posterUrl;
            
        } catch (error) {
            console.error('Error getting TMDB poster:', error.message);
            return null;
        }
    }
    
    /**
     * Get high-quality backdrop URL for anime
     */
    async getAnimeBackdrop(animeTitle, year = null, size = 'LARGE') {
        try {
            const result = await this.searchTV(animeTitle, year);
            
            if (!result || !result.backdrop_path) {
                console.log(`No TMDB backdrop found for: ${animeTitle}`);
                return null;
            }
            
            const imageSize = TMDB_CONFIG.IMAGE_SIZES.BACKDROP[size] || TMDB_CONFIG.IMAGE_SIZES.BACKDROP.LARGE;
            const backdropUrl = `${TMDB_CONFIG.IMAGE_BASE_URL}/${imageSize}${result.backdrop_path}`;
            
            console.log(`TMDB backdrop found for ${animeTitle}: ${backdropUrl}`);
            return backdropUrl;
            
        } catch (error) {
            console.error('Error getting TMDB backdrop:', error.message);
            return null;
        }
    }
    
    /**
     * Get enhanced anime data with TMDB information
     */
    async getEnhancedAnimeData(animeTitle, year = null) {
        try {
            const result = await this.searchTV(animeTitle, year);
            
            if (!result) {
                return null;
            }
            
            return {
                tmdb_id: result.id,
                title: result.name,
                overview: result.overview,
                poster: result.poster_path ? 
                    `${TMDB_CONFIG.IMAGE_BASE_URL}/${TMDB_CONFIG.IMAGE_SIZES.POSTER.LARGE}${result.poster_path}` : null,
                backdrop: result.backdrop_path ? 
                    `${TMDB_CONFIG.IMAGE_BASE_URL}/${TMDB_CONFIG.IMAGE_SIZES.BACKDROP.LARGE}${result.backdrop_path}` : null,
                vote_average: result.vote_average,
                vote_count: result.vote_count,
                first_air_date: result.first_air_date,
                popularity: result.popularity,
                genre_ids: result.genre_ids
            };
            
        } catch (error) {
            console.error('Error getting enhanced anime data:', error.message);
            return null;
        }
    }
    
    /**
     * Batch process multiple anime titles
     */
    async batchGetPosters(animeList, maxConcurrent = 5) {
        const results = [];
        
        for (let i = 0; i < animeList.length; i += maxConcurrent) {
            const batch = animeList.slice(i, i + maxConcurrent);
            
            const batchPromises = batch.map(async (anime) => {
                const poster = await this.getAnimePoster(anime.title, anime.year);
                return {
                    ...anime,
                    tmdb_poster: poster
                };
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Small delay between batches
            if (i + maxConcurrent < animeList.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }
    
    /**
     * Get service statistics
     */
    getStats() {
        return {
            isReady: this.isReady(),
            cacheSize: this.cache.size,
            requestCount: this.requestCount,
            hasApiKey: !!this.apiKey
        };
    }
}

// Create singleton instance
const tmdbService = new TMDBService();

// Export both the class and instance
export { TMDBService, tmdbService };
export default tmdbService;