// Test script for the Anime Rouge API

// Function to test API endpoints
async function testAnimeRougeAPI() {
    console.log("Testing Anime Rouge API...");

    // Test the episode-srcs endpoint
    const testEndpoint = async (episodeId, server = "vidstreaming", category = "sub") => {
        try {
            const apiUrl = `https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}`;
            console.log(`Testing API URL: ${apiUrl}`);

            const response = await fetch(apiUrl);

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            console.log("API response:", data);

            return data;
        } catch (error) {
            console.error("API test error:", error);
            return null;
        }
    };

    // Test with multiple examples
    const examples = [
        "tokyo-ghoul-114?ep=1778",
        "jujutsu-kaisen-2nd-season-18413?ep=110325",
        "spy-x-family-17631?ep=99548"
    ];

    for (const example of examples) {
        console.log(`\n----- Testing: ${example} -----`);

        // Test with different servers
        const servers = ["vidstreaming", "streamsb", "vidcdn"];

        for (const server of servers) {
            console.log(`\nTesting with server: ${server}`);
            const result = await testEndpoint(example, server);

            if (result && result.sources && result.sources.length > 0) {
                console.log(`✅ Success with ${server}! Found ${result.sources.length} sources.`);
                console.log(`First source URL: ${result.sources[0].url.substring(0, 50)}...`);
            } else {
                console.log(`❌ Failed with ${server}. No valid sources returned.`);
            }
        }
    }
}

// Execute the test
testAnimeRougeAPI();

// Note: To run this test script, use Node.js:
// node anime_api_test.js
