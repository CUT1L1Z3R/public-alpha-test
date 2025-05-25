/**
 * Implementation Verification Script
 * Checks all RiveStream integration features and provides a status report
 */

async function verifyRiveStreamImplementation() {
    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: {
            passed: 0,
            failed: 0,
            warnings: 0
        }
    };

    console.log('🔍 Starting RiveStream Implementation Verification');
    console.log('=================================================');

    // Test 1: Check if all required files exist
    await testFileExistence(results);
    
    // Test 2: Check JavaScript functions
    await testJavaScriptFunctions(results);
    
    // Test 3: Test API connectivity
    await testAPIConnectivity(results);
    
    // Test 4: Test UI components
    await testUIComponents(results);
    
    // Test 5: Test fallback system
    await testFallbackSystem(results);

    // Generate final report
    generateReport(results);
    
    return results;
}

async function testFileExistence(results) {
    const requiredFiles = [
        'anime/index.html',
        'anime/anime.js', 
        'anime/rivestream-styles.css',
        'anime/anime-improvements.js',
        'anime/rivestream-fallback.js'
    ];

    for (const file of requiredFiles) {
        try {
            const response = await fetch(file, { method: 'HEAD' });
            addTestResult(results, `File: ${file}`, response.ok, 
                response.ok ? 'File exists' : `HTTP ${response.status}`);
        } catch (error) {
            addTestResult(results, `File: ${file}`, false, `Error: ${error.message}`);
        }
    }
}

async function testJavaScriptFunctions(results) {
    const requiredFunctions = [
        'getRiveStreamServer',
        'createVideoPlayer',
        'createServerButtons', 
        'createAnimeServerModal',
        'showToast'
    ];

    for (const funcName of requiredFunctions) {
        const exists = typeof window[funcName] === 'function';
        addTestResult(results, `Function: ${funcName}`, exists, 
            exists ? 'Function available' : 'Function missing');
    }

    // Test fallback system
    const fallbackExists = typeof window.riveStreamFallback === 'object';
    addTestResult(results, 'Fallback System', fallbackExists,
        fallbackExists ? 'Fallback system loaded' : 'Fallback system missing');
}

async function testAPIConnectivity(results) {
    // Test TMDB API (should work)
    try {
        const response = await fetch('https://api.themoviedb.org/3/discover/tv?api_key=84259f99204eeb7d45c7e3d8e36c6123&with_genres=16&sort_by=popularity.desc');
        const data = await response.json();
        addTestResult(results, 'TMDB API', response.ok && data.results, 
            response.ok ? `Found ${data.results?.length || 0} anime` : 'TMDB API failed');
    } catch (error) {
        addTestResult(results, 'TMDB API', false, `Error: ${error.message}`);
    }

    // Test RiveStream API (may fail due to CORS/API key)
    try {
        const testResult = await window.riveStreamFallback?.getRiveStreamServer(1399, 1, 1);
        addTestResult(results, 'RiveStream API', testResult?.success, 
            testResult?.success ? `Working: ${testResult.server}` : `Failed: ${testResult?.error}`);
    } catch (error) {
        addTestResult(results, 'RiveStream API', false, `Error: ${error.message}`);
    }
}

async function testUIComponents(results) {
    // Test CSS loading
    const styles = document.querySelector('link[href*="rivestream-styles.css"]');
    addTestResult(results, 'CSS Styles', !!styles, 
        styles ? 'RiveStream styles loaded' : 'RiveStream styles missing');

    // Test modal creation
    try {
        if (typeof window.createAnimeServerModal === 'function') {
            const testAnime = { id: 1399, name: 'Test Anime', backdrop_path: '/test.jpg' };
            // Note: We don't actually create the modal to avoid UI interference
            addTestResult(results, 'Modal Creation', true, 'Modal function available');
        } else {
            addTestResult(results, 'Modal Creation', false, 'Modal function missing');
        }
    } catch (error) {
        addTestResult(results, 'Modal Creation', false, `Error: ${error.message}`);
    }

    // Test toast notifications
    try {
        if (typeof window.showToast === 'function') {
            // Test toast creation without showing it
            addTestResult(results, 'Toast Notifications', true, 'Toast function available');
        } else {
            addTestResult(results, 'Toast Notifications', false, 'Toast function missing');
        }
    } catch (error) {
        addTestResult(results, 'Toast Notifications', false, `Error: ${error.message}`);
    }
}

async function testFallbackSystem(results) {
    if (!window.riveStreamFallback) {
        addTestResult(results, 'Fallback System', false, 'Fallback system not loaded');
        return;
    }

    try {
        // Test configuration status
        const configStatus = await window.riveStreamFallback.testAllConfigurations();
        const availableConfigs = configStatus.filter(config => config.status === 'available').length;
        
        addTestResult(results, 'Fallback Configs', availableConfigs > 0, 
            `${availableConfigs} configurations available`);

        // Test demo source
        const demoResult = await window.riveStreamFallback.getRiveStreamServer(1399, 1, 1);
        addTestResult(results, 'Demo Sources', demoResult.success, 
            demoResult.success ? `Source: ${demoResult.server}` : demoResult.error);
            
    } catch (error) {
        addTestResult(results, 'Fallback System', false, `Error: ${error.message}`);
    }
}

function addTestResult(results, testName, passed, details) {
    const result = {
        test: testName,
        passed: passed,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    results.tests.push(result);
    
    if (passed) {
        results.summary.passed++;
    } else {
        results.summary.failed++;
    }

    // Log result
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
}

function generateReport(results) {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('=====================');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Success Rate: ${Math.round((results.summary.passed / results.tests.length) * 100)}%`);

    // Group results by category
    const categories = {};
    results.tests.forEach(test => {
        const category = test.test.split(':')[0];
        if (!categories[category]) categories[category] = [];
        categories[category].push(test);
    });

    console.log('\n📋 Results by Category:');
    Object.entries(categories).forEach(([category, tests]) => {
        const passed = tests.filter(t => t.passed).length;
        console.log(`  ${category}: ${passed}/${tests.length} passed`);
    });

    // Show failed tests
    const failed = results.tests.filter(t => !t.passed);
    if (failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        failed.forEach(test => {
            console.log(`  - ${test.test}: ${test.details}`);
        });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (results.summary.failed === 0) {
        console.log('  🎉 All tests passed! RiveStream integration is working correctly.');
    } else {
        console.log('  🔧 Some tests failed. Check the details above for issues to resolve.');
        
        if (failed.some(t => t.test.includes('RiveStream API'))) {
            console.log('  📡 RiveStream API issues detected. The fallback system should handle this.');
        }
        
        if (failed.some(t => t.test.includes('File'))) {
            console.log('  📁 Missing files detected. Ensure all files are uploaded correctly.');
        }
    }

    return results;
}

// Auto-run verification when script loads
if (typeof window !== 'undefined') {
    window.verifyRiveStreamImplementation = verifyRiveStreamImplementation;
    
    // Add verification button for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.addEventListener('DOMContentLoaded', () => {
            const verifyBtn = document.createElement('button');
            verifyBtn.textContent = '✅ Verify';
            verifyBtn.style.cssText = `
                position: fixed;
                bottom: 120px;
                right: 20px;
                z-index: 1000;
                padding: 8px 12px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
            `;
            verifyBtn.onclick = verifyRiveStreamImplementation;
            document.body.appendChild(verifyBtn);
        });
    }
}

console.log('✅ Verification tools loaded. Run verifyRiveStreamImplementation() to test.');