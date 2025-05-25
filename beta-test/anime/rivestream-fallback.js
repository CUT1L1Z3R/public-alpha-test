/**
 * RiveStream Fallback System
 * Provides alternative streaming sources when the main RiveStream API is unavailable
 */

// Alternative streaming sources configuration
const FALLBACK_CONFIGS = [
    {
        name: 'Primary RiveStream',
        enabled: true,
        apiUrl: 'https://rivestream.net/api/backendfetch',
        secretKey: 'LTUfm4fmX2ZTIwY2Uz',
        service: 'ee3',
        proxyMode: 'noProxy'
    },
    {
        name: 'RiveStream Alternative',
        enabled: true,
        apiUrl: 'https://rivestream.net/api/fetch',
        secretKey: 'LTUfm4fmX2ZTIwY2Uz',
        service: 'ee1',
        proxyMode: ''
    },
    {
        name: 'Demo Source',
        enabled: true,
        type: 'demo',
        sources: [
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        ]
    }
];

// Fallback manager
class RiveStreamFallback {
    constructor() {
        this.workingConfig = null;
        this.tested = false;
        this.cache = new Map();
    }

    async getRiveStreamServer(tmdbId, season = 1, episode = 1) {
        const cacheKey = `${tmdbId}-${season}-${episode}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Try to find a working configuration
        const result = await this.tryConfigurations(tmdbId, season, episode);
        
        // Cache the result
        this.cache.set(cacheKey, result);
        
        return result;
    }

    async tryConfigurations(tmdbId, season, episode) {
        for (const config of FALLBACK_CONFIGS) {
            if (!config.enabled) continue;

            try {
                console.log(`Trying ${config.name}...`);
                
                if (config.type === 'demo') {
                    return this.getDemoSource(config, tmdbId, season, episode);
                } else {
                    const result = await this.tryRiveStreamConfig(config, tmdbId, season, episode);
                    if (result.success) {
                        this.workingConfig = config;
                        return result;
                    }
                }
            } catch (error) {
                console.warn(`${config.name} failed:`, error.message);
                continue;
            }
        }

        return {
            success: false,
            error: 'All streaming sources are currently unavailable'
        };
    }

    async tryRiveStreamConfig(config, tmdbId, season, episode) {
        const params = new URLSearchParams({
            requestID: 'tvVideoProvider',
            id: tmdbId,
            season: season,
            episode: episode,
            service: config.service,
            secretKey: config.secretKey
        });

        if (config.proxyMode) {
            params.append('proxyMode', config.proxyMode);
        }

        const url = `${config.apiUrl}?${params}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data && data.source) {
                return {
                    success: true,
                    url: data.source,
                    quality: data.quality || 'HD',
                    server: config.name
                };
            } else {
                throw new Error('No source in response');
            }
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    getDemoSource(config, tmdbId, season, episode) {
        // Select a demo video based on the anime ID
        const index = (tmdbId + season + episode) % config.sources.length;
        const selectedSource = config.sources[index];

        return {
            success: true,
            url: selectedSource,
            quality: 'HD',
            server: 'Demo Player',
            note: 'This is a demo video. In production, this would be the actual anime episode.'
        };
    }

    // Test all configurations and return status
    async testAllConfigurations() {
        const results = [];
        
        for (const config of FALLBACK_CONFIGS) {
            if (!config.enabled) {
                results.push({
                    name: config.name,
                    status: 'disabled',
                    message: 'Configuration disabled'
                });
                continue;
            }

            try {
                if (config.type === 'demo') {
                    results.push({
                        name: config.name,
                        status: 'available',
                        message: 'Demo sources available'
                    });
                } else {
                    const result = await this.tryRiveStreamConfig(config, 1399, 1, 1); // Test with Game of Thrones
                    results.push({
                        name: config.name,
                        status: result.success ? 'available' : 'failed',
                        message: result.success ? 'Working' : result.error || 'Failed'
                    });
                }
            } catch (error) {
                results.push({
                    name: config.name,
                    status: 'error',
                    message: error.message
                });
            }
        }

        return results;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        this.workingConfig = null;
        this.tested = false;
    }
}

// Create global instance
const riveStreamFallback = new RiveStreamFallback();

// Enhanced getRiveStreamServer function that uses fallback
async function getRiveStreamServerWithFallback(tmdbId, season = 1, episode = 1) {
    console.log(`Requesting stream for TMDB ID: ${tmdbId}, Season: ${season}, Episode: ${episode}`);
    
    try {
        return await riveStreamFallback.getRiveStreamServer(tmdbId, season, episode);
    } catch (error) {
        console.error('Fallback system error:', error);
        return {
            success: false,
            error: 'Streaming service temporarily unavailable'
        };
    }
}

// Function to test the fallback system
async function testFallbackSystem() {
    console.log('🧪 Testing RiveStream Fallback System');
    
    const testCases = [
        { id: 1399, season: 1, episode: 1, name: 'Game of Thrones' },
        { id: 94605, season: 1, episode: 1, name: 'Arcane' }
    ];

    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.name}`);
        const result = await getRiveStreamServerWithFallback(testCase.id, testCase.season, testCase.episode);
        
        if (result.success) {
            console.log(`✅ Success: ${result.server}`);
            console.log(`   URL: ${result.url}`);
            if (result.note) {
                console.log(`   Note: ${result.note}`);
            }
        } else {
            console.log(`❌ Failed: ${result.error}`);
        }
    }

    // Test configuration status
    console.log('\n📊 Configuration Status:');
    const configStatus = await riveStreamFallback.testAllConfigurations();
    configStatus.forEach(status => {
        const emoji = status.status === 'available' ? '✅' : 
                     status.status === 'disabled' ? '⏸️' : '❌';
        console.log(`${emoji} ${status.name}: ${status.message}`);
    });
}

// Replace the original function if it exists
if (typeof window !== 'undefined') {
    // Store original function as backup
    if (typeof window.getRiveStreamServer !== 'undefined') {
        window.getRiveStreamServerOriginal = window.getRiveStreamServer;
    }
    
    // Replace with fallback version
    window.getRiveStreamServer = getRiveStreamServerWithFallback;
    window.riveStreamFallback = riveStreamFallback;
    window.testFallbackSystem = testFallbackSystem;
    
    console.log('🔄 RiveStream Fallback System loaded');
    console.log('📝 Use testFallbackSystem() to test all configurations');
}

// Auto-test when loaded in development
if (typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    
    // Add a test button for development
    document.addEventListener('DOMContentLoaded', () => {
        const testBtn = document.createElement('button');
        testBtn.textContent = '🧪 Test Fallback';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            z-index: 1000;
            padding: 8px 12px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 11px;
        `;
        testBtn.onclick = testFallbackSystem;
        document.body.appendChild(testBtn);
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        RiveStreamFallback, 
        getRiveStreamServerWithFallback, 
        testFallbackSystem,
        riveStreamFallback 
    };
}