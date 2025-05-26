#!/usr/bin/env node

/**
 * TMDB API Key Test Script
 * Tests if your TMDB API key is valid and working
 * 
 * Usage:
 *   node scripts/test-api-key.js YOUR_API_KEY
 *   node scripts/test-api-key.js (reads from TMDB_API_KEY env var)
 */

const https = require('https');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateApiKeyFormat(apiKey) {
    if (!apiKey) {
        return { valid: false, error: 'API key is required' };
    }
    
    if (typeof apiKey !== 'string') {
        return { valid: false, error: 'API key must be a string' };
    }
    
    if (apiKey.length !== 32) {
        return { valid: false, error: `API key must be 32 characters long (got ${apiKey.length})` };
    }
    
    if (!/^[a-fA-F0-9]+$/.test(apiKey)) {
        return { valid: false, error: 'API key must contain only hexadecimal characters (0-9, a-f, A-F)' };
    }
    
    return { valid: true };
}

function makeHttpsRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({
                        statusCode: response.statusCode,
                        data: parsedData,
                        headers: response.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: response.statusCode,
                        data: data,
                        headers: response.headers
                    });
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testTMDBApiKey(apiKey) {
    log('\n🎬 TMDB API Key Test', 'bright');
    log('='.repeat(50), 'blue');
    
    // 1. Validate API key format
    log('\n1. Validating API key format...', 'blue');
    const formatValidation = validateApiKeyFormat(apiKey);
    
    if (!formatValidation.valid) {
        log(`❌ Invalid format: ${formatValidation.error}`, 'red');
        return false;
    }
    
    log('✅ API key format is valid', 'green');
    
    // 2. Test API connectivity
    log('\n2. Testing TMDB API connectivity...', 'blue');
    
    try {
        const configUrl = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`;
        const response = await makeHttpsRequest(configUrl);
        
        if (response.statusCode === 200) {
            log('✅ Successfully connected to TMDB API', 'green');
            log(`📊 Rate limit remaining: ${response.headers['x-ratelimit-remaining'] || 'Unknown'}`, 'blue');
            
            // Display some configuration info
            if (response.data && response.data.images) {
                const imageConfig = response.data.images;
                log(`🖼️  Image base URL: ${imageConfig.base_url}`, 'blue');
                log(`📏 Available poster sizes: ${imageConfig.poster_sizes.join(', ')}`, 'blue');
            }
            
        } else if (response.statusCode === 401) {
            log('❌ Authentication failed - Invalid API key', 'red');
            log('💡 Make sure your API key is approved by TMDB', 'yellow');
            return false;
            
        } else {
            log(`❌ API request failed with status ${response.statusCode}`, 'red');
            if (response.data && response.data.status_message) {
                log(`📝 Error message: ${response.data.status_message}`, 'yellow');
            }
            return false;
        }
        
    } catch (error) {
        log(`❌ Connection error: ${error.message}`, 'red');
        log('💡 Check your internet connection and try again', 'yellow');
        return false;
    }
    
    // 3. Test search functionality
    log('\n3. Testing search functionality...', 'blue');
    
    try {
        const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=Attack%20on%20Titan`;
        const searchResponse = await makeHttpsRequest(searchUrl);
        
        if (searchResponse.statusCode === 200 && searchResponse.data.results) {
            const results = searchResponse.data.results;
            log(`✅ Search test successful - Found ${results.length} results`, 'green');
            
            if (results.length > 0) {
                const firstResult = results[0];
                log(`📺 First result: "${firstResult.name}" (${firstResult.first_air_date})`, 'blue');
                
                if (firstResult.poster_path) {
                    log(`🖼️  Poster available: https://image.tmdb.org/t/p/w500${firstResult.poster_path}`, 'blue');
                } else {
                    log('⚠️  No poster available for this result', 'yellow');
                }
            }
            
        } else {
            log('❌ Search test failed', 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Search test error: ${error.message}`, 'red');
        return false;
    }
    
    // 4. Test rate limiting
    log('\n4. Testing rate limiting behavior...', 'blue');
    
    try {
        const testRequests = 3;
        const startTime = Date.now();
        
        const promises = Array.from({ length: testRequests }, (_, i) => {
            const testUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=test${i}`;
            return makeHttpsRequest(testUrl);
        });
        
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const successfulRequests = responses.filter(r => r.statusCode === 200).length;
        log(`✅ Rate limiting test: ${successfulRequests}/${testRequests} requests successful in ${duration}ms`, 'green');
        
        // Check for rate limit headers
        const lastResponse = responses[responses.length - 1];
        if (lastResponse.headers['x-ratelimit-remaining']) {
            log(`📊 Rate limit remaining: ${lastResponse.headers['x-ratelimit-remaining']}`, 'blue');
        }
        
    } catch (error) {
        log(`⚠️  Rate limiting test failed: ${error.message}`, 'yellow');
    }
    
    // Summary
    log('\n🎉 API Key Test Summary', 'bright');
    log('='.repeat(50), 'blue');
    log('✅ Your TMDB API key is working correctly!', 'green');
    log('💡 You can now use this key in your anime streaming application', 'blue');
    log('\n📖 Next steps:', 'blue');
    log('   1. Copy your API key to your .env file or application config', 'reset');
    log('   2. Run the enhanced test page (test-tmdb.html) to see poster comparisons', 'reset');
    log('   3. Integrate the poster enhancement into your application', 'reset');
    
    return true;
}

function printUsage() {
    log('\n🔧 TMDB API Key Tester', 'bright');
    log('Usage:', 'blue');
    log('  node scripts/test-api-key.js YOUR_API_KEY', 'reset');
    log('  node scripts/test-api-key.js  (uses TMDB_API_KEY environment variable)', 'reset');
    log('\nGet your free API key from:', 'blue');
    log('  https://www.themoviedb.org/settings/api', 'green');
    log('\nExample:', 'blue');
    log('  node scripts/test-api-key.js a1b2c3d4e5f6789012345678901234567', 'reset');
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    let apiKey = args[0] || process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        printUsage();
        process.exit(1);
    }
    
    // Hide API key in logs (show only first and last 4 characters)
    const maskedKey = apiKey.length > 8 ? 
        `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 
        '****';
    log(`\n🔑 Testing API key: ${maskedKey}`, 'blue');
    
    try {
        const success = await testTMDBApiKey(apiKey);
        process.exit(success ? 0 : 1);
    } catch (error) {
        log(`\n💥 Unexpected error: ${error.message}`, 'red');
        log('Please check your internet connection and try again', 'yellow');
        process.exit(1);
    }
}

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    log(`\n💥 Unhandled rejection: ${reason}`, 'red');
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main();
}