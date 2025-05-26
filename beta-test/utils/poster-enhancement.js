/**
 * Poster Enhancement Utility
 * Enhances anime poster quality using TMDB API with AniList fallbacks
 */

import tmdbService from '../services/tmdb-service.js';

class PosterEnhancer {
    constructor() {
        this.fallbackImages = new Map();
        this.processingQueue = new Set();
        this.successRate = {
            total: 0,
            enhanced: 0
        };
    }
    
    /**
     * Get enhanced poster URL with fallback chain
     * @param {Object} anime - Anime object from AniList
     * @param {Object} options - Enhancement options
     */
    async getEnhancedPoster(anime, options = {}) {
        const {
            preferredSize = 'LARGE',
            enableCache = true,
            timeoutMs = 5000,
            fallbackToOriginal = true
        } = options;
        
        // Extract anime information
        const title = this.extractTitle(anime);
        const year = this.extractYear(anime);
        const originalPoster = this.extractOriginalPoster(anime);
        
        console.log(`Enhancing poster for: ${title} (${year || 'no year'})`);
        
        // Create cache key
        const cacheKey = `enhanced_${title}_${year}_${preferredSize}`;
        
        // Check if already processing this anime
        if (this.processingQueue.has(cacheKey)) {
            console.log(`Already processing poster for: ${title}`);
            return originalPoster;
        }
        
        this.processingQueue.add(cacheKey);
        
        try {
            // Try to get TMDB poster with timeout
            const tmdbPoster = await Promise.race([
                tmdbService.getAnimePoster(title, year, preferredSize),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
                )
            ]);
            
            this.successRate.total++;
            
            if (tmdbPoster) {
                console.log(`✅ Enhanced poster found for: ${title}`);
                this.successRate.enhanced++;
                
                return {
                    url: tmdbPoster,
                    source: 'tmdb',
                    quality: 'enhanced',
                    originalUrl: originalPoster
                };
            }
            
        } catch (error) {
            console.log(`❌ TMDB enhancement failed for ${title}:`, error.message);
        } finally {
            this.processingQueue.delete(cacheKey);
        }
        
        // Fallback to original AniList poster
        if (fallbackToOriginal && originalPoster) {
            console.log(`🔄 Using AniList fallback for: ${title}`);
            return {
                url: originalPoster,
                source: 'anilist',
                quality: 'original',
                originalUrl: originalPoster
            };
        }
        
        // Final fallback to placeholder
        return {
            url: this.getPlaceholderImage(),
            source: 'placeholder',
            quality: 'fallback',
            originalUrl: originalPoster
        };
    }
    
    /**
     * Extract title from anime object
     */
    extractTitle(anime) {
        if (!anime || !anime.title) return 'Unknown';
        
        // Prefer English title, fallback to romaji, then native
        return anime.title.english || 
               anime.title.romaji || 
               anime.title.native || 
               'Unknown';
    }
    
    /**
     * Extract year from anime object
     */
    extractYear(anime) {
        if (!anime || !anime.startDate) return null;
        
        return anime.startDate.year || null;
    }
    
    /**
     * Extract original poster from anime object
     */
    extractOriginalPoster(anime) {
        if (!anime) return null;
        
        // Try different AniList image sources
        const sources = [
            anime.coverImage?.extraLarge,
            anime.coverImage?.large,
            anime.coverImage?.medium,
            anime.bannerImage
        ];
        
        return sources.find(url => url && url.trim() !== '') || null;
    }
    
    /**
     * Get placeholder image URL
     */
    getPlaceholderImage() {
        return 'https://via.placeholder.com/460x650/2a2a2a/ffffff?text=No+Image+Available';
    }
    
    /**
     * Batch enhance multiple anime posters
     */
    async enhanceMultiplePosters(animeList, options = {}) {
        const {
            maxConcurrent = 3,
            progressCallback = null
        } = options;
        
        const results = [];
        let processed = 0;
        
        console.log(`Starting batch enhancement for ${animeList.length} anime`);
        
        for (let i = 0; i < animeList.length; i += maxConcurrent) {
            const batch = animeList.slice(i, i + maxConcurrent);
            
            const batchPromises = batch.map(async (anime) => {
                try {
                    const enhanced = await this.getEnhancedPoster(anime, options);
                    processed++;
                    
                    if (progressCallback) {
                        progressCallback(processed, animeList.length);
                    }
                    
                    return {
                        anime,
                        enhanced,
                        success: enhanced.source !== 'placeholder'
                    };
                } catch (error) {
                    console.error('Error enhancing poster:', error);
                    processed++;
                    
                    if (progressCallback) {
                        progressCallback(processed, animeList.length);
                    }
                    
                    return {
                        anime,
                        enhanced: {
                            url: this.extractOriginalPoster(anime) || this.getPlaceholderImage(),
                            source: 'error',
                            quality: 'fallback'
                        },
                        success: false,
                        error: error.message
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Small delay between batches to be respectful
            if (i + maxConcurrent < animeList.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        console.log(`Batch enhancement complete: ${results.filter(r => r.success).length}/${results.length} successful`);
        return results;
    }
    
    /**
     * Preload images for better UX
     */
    async preloadImage(url) {
        return new Promise((resolve, reject) => {
            if (!url) {
                reject(new Error('No URL provided'));
                return;
            }
            
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });
    }
    
    /**
     * Smart image loading with fallback
     */
    async loadImageWithFallback(primaryUrl, fallbackUrl) {
        try {
            await this.preloadImage(primaryUrl);
            return primaryUrl;
        } catch (error) {
            console.warn('Primary image failed, trying fallback:', error.message);
            
            if (fallbackUrl) {
                try {
                    await this.preloadImage(fallbackUrl);
                    return fallbackUrl;
                } catch (fallbackError) {
                    console.warn('Fallback image also failed:', fallbackError.message);
                }
            }
            
            return this.getPlaceholderImage();
        }
    }
    
    /**
     * Get enhancement statistics
     */
    getStats() {
        const enhancementRate = this.successRate.total > 0 ? 
            (this.successRate.enhanced / this.successRate.total * 100).toFixed(1) : 0;
        
        return {
            totalProcessed: this.successRate.total,
            enhanced: this.successRate.enhanced,
            enhancementRate: `${enhancementRate}%`,
            queueSize: this.processingQueue.size,
            tmdbServiceReady: tmdbService.isReady()
        };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.successRate = { total: 0, enhanced: 0 };
        this.processingQueue.clear();
    }
}

// Create singleton instance
const posterEnhancer = new PosterEnhancer();

export { PosterEnhancer, posterEnhancer };
export default posterEnhancer;