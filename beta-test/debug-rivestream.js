/**
 * Debug script for RiveStream API testing
 * This helps identify the correct parameters and API endpoint
 */

const RIVESTREAM_VARIANTS = [
    {
        name: 'Original Config',
        config: {
            apiUrl: 'https://rivestream.net/api/backendfetch',
            secretKey: 'LTUfm4fmX2ZTIwY2Uz',
            service: 'ee3',
            proxyMode: 'noProxy'
        }
    },
    {
        name: 'Alternative Service',
        config: {
            apiUrl: 'https://rivestream.net/api/backendfetch',
            secretKey: 'LTUfm4fmX2ZTIwY2Uz',
            service: 'ee1',
            proxyMode: 'noProxy'
        }
    },
    {
        name: 'No Proxy Mode',
        config: {
            apiUrl: 'https://rivestream.net/api/backendfetch',
            secretKey: 'LTUfm4fmX2ZTIwY2Uz',
            service: 'ee3',
            proxyMode: ''
        }
    },
    {
        name: 'Different Endpoint',
        config: {
            apiUrl: 'https://rivestream.net/api/fetch',
            secretKey: 'LTUfm4fmX2ZTIwY2Uz',
            service: 'ee3',
            proxyMode: 'noProxy'
        }
    }
];

// Test IDs that are known to work
const TEST_IDS = [
    { id: 1399, name: 'Game of Thrones', season: 1, episode: 1 },
    { id: 94605, name: 'Arcane', season: 1, episode: 1 },
    { id: 85271, name: 'WandaVision', season: 1, episode: 1 },
    { id: 60735, name: 'The Flash', season: 1, episode: 1 }
];

async function debugRiveStreamAPI() {
    console.log('🔍 Starting RiveStream API Debug Session');
    console.log('=====================================');
    
    for (const variant of RIVESTREAM_VARIANTS) {
        console.log(`\n🧪 Testing: ${variant.name}`);
        console.log(`URL: ${variant.config.apiUrl}`);
        console.log(`Service: ${variant.config.service}`);
        console.log(`Proxy Mode: ${variant.config.proxyMode}`);
        
        for (const testCase of TEST_IDS.slice(0, 2)) { // Test only first 2 to avoid spam
            console.log(`\n📺 Testing with: ${testCase.name} (ID: ${testCase.id})`);
            
            try {
                const result = await testAPIVariant(variant.config, testCase);
                if (result.success) {
                    console.log(`✅ SUCCESS: Found source URL`);
                    console.log(`   URL: ${result.url}`);
                    console.log(`   Quality: ${result.quality}`);
                    return { variant, testCase, result }; // Return first successful result
                } else {
                    console.log(`❌ FAILED: ${result.error}`);
                }
            } catch (error) {
                console.log(`💥 ERROR: ${error.message}`);
            }
            
            // Wait between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n❌ No working configuration found');
    return null;
}

async function testAPIVariant(config, testCase) {
    const params = new URLSearchParams({
        requestID: 'tvVideoProvider',
        id: testCase.id,
        season: testCase.season,
        episode: testCase.episode,
        service: config.service,
        secretKey: config.secretKey
    });
    
    if (config.proxyMode) {
        params.append('proxyMode', config.proxyMode);
    }

    const url = `${config.apiUrl}?${params}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`   HTTP Status: ${response.status}`);
        
        if (!response.ok) {
            const text = await response.text();
            return { success: false, error: `HTTP ${response.status}: ${text}` };
        }

        const data = await response.json();
        
        if (data && data.source) {
            return {
                success: true,
                url: data.source,
                quality: data.quality || 'Unknown',
                data: data
            };
        } else {
            return { 
                success: false, 
                error: 'No source in response',
                response: data 
            };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Alternative API testing function
async function testAlternativeApis() {
    console.log('\n🔄 Testing Alternative APIs');
    console.log('============================');
    
    const alternatives = [
        {
            name: 'TMDB API Test',
            test: async () => {
                const response = await fetch(`https://api.themoviedb.org/3/tv/1399?api_key=84259f99204eeb7d45c7e3d8e36c6123`);
                const data = await response.json();
                return { success: true, data: data.name };
            }
        },
        {
            name: 'CORS Test',
            test: async () => {
                const response = await fetch('https://httpbin.org/get');
                return { success: response.ok, data: 'CORS working' };
            }
        }
    ];
    
    for (const alt of alternatives) {
        try {
            console.log(`\n🧪 Testing: ${alt.name}`);
            const result = await alt.test();
            if (result.success) {
                console.log(`✅ SUCCESS: ${result.data}`);
            } else {
                console.log(`❌ FAILED: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`💥 ERROR: ${error.message}`);
        }
    }
}

// Main debug function
async function runFullDebug() {
    console.log('🚀 Starting Full RiveStream Debug');
    console.log('=================================');
    
    // Test basic connectivity first
    await testAlternativeApis();
    
    // Test RiveStream API variants
    const workingConfig = await debugRiveStreamAPI();
    
    if (workingConfig) {
        console.log('\n🎉 FOUND WORKING CONFIGURATION!');
        console.log('================================');
        console.log(`Variant: ${workingConfig.variant.name}`);
        console.log(`Test Case: ${workingConfig.testCase.name}`);
        console.log(`URL: ${workingConfig.result.url}`);
        
        // Update the global config if in browser environment
        if (typeof window !== 'undefined' && window.RIVESTREAM_CONFIG) {
            Object.assign(window.RIVESTREAM_CONFIG, workingConfig.variant.config);
            console.log('✅ Updated global RIVESTREAM_CONFIG');
        }
    }
    
    return workingConfig;
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debugRiveStreamAPI, testAlternativeApis, runFullDebug };
} else if (typeof window !== 'undefined') {
    window.debugRiveStream = { debugRiveStreamAPI, testAlternativeApis, runFullDebug };
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined') {
    console.log('🔧 RiveStream Debug Tools Loaded');
    console.log('Run: debugRiveStream.runFullDebug() to start debugging');
}