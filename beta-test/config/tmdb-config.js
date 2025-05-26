/**
 * TMDB API Configuration
 * Centralized configuration for The Movie Database API integration
 */

// TMDB API Configuration
const TMDB_CONFIG = {
    // API Endpoints
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    
    // Image sizes available from TMDB
    IMAGE_SIZES: {
        POSTER: {
            SMALL: 'w154',
            MEDIUM: 'w300',
            LARGE: 'w500',
            XLARGE: 'w780',
            ORIGINAL: 'original'
        },
        BACKDROP: {
            SMALL: 'w300',
            MEDIUM: 'w780',
            LARGE: 'w1280',
            ORIGINAL: 'original'
        }
    },
    
    // Rate limiting configuration
    RATE_LIMIT: {
        REQUESTS_PER_SECOND: 40, // TMDB allows 40 requests per 10 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 second base delay
    },
    
    // Cache settings
    CACHE: {
        TTL: 3600000, // 1 hour in milliseconds
        MAX_ENTRIES: 1000
    }
};

// API Key management with fallback
function getTMDBApiKey() {
    // Try multiple sources for API key
    const sources = [
        // Environment variable (preferred for production)
        process?.env?.TMDB_API_KEY,
        // Local storage (for client-side apps)
        typeof localStorage !== 'undefined' ? localStorage.getItem('tmdb_api_key') : null,
        // Fallback demo key (limited usage)
        'YOUR_TMDB_API_KEY_HERE' // This should be replaced with actual key
    ];
    
    for (const key of sources) {
        if (key && key !== 'YOUR_TMDB_API_KEY_HERE' && key.length > 10) {
            return key;
        }
    }
    
    console.warn('No valid TMDB API key found. Please set TMDB_API_KEY environment variable or add key to localStorage.');
    return null;
}

// Validate API key format
function isValidApiKey(key) {
    if (!key || typeof key !== 'string') return false;
    // TMDB API keys are typically 32 characters long and contain alphanumeric characters
    return /^[a-fA-F0-9]{32}$/.test(key);
}

// Export configuration
export { TMDB_CONFIG, getTMDBApiKey, isValidApiKey };