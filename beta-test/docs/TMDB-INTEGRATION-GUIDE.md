# 🎬 TMDB API Integration Guide

## Overview

This guide explains how to set up and use the enhanced TMDB (The Movie Database) API integration for improved anime poster quality in your streaming website. The system provides intelligent fallbacks to AniList images when TMDB posters are unavailable.

## 🚀 Features

- **Enhanced Poster Quality**: High-resolution posters from TMDB
- **Intelligent Fallbacks**: Graceful degradation to AniList images
- **Robust Error Handling**: Continues working even when APIs fail
- **Rate Limiting**: Respects TMDB API limits
- **Caching System**: Reduces API calls and improves performance
- **Batch Processing**: Efficiently handles multiple anime requests
- **Real-time Statistics**: Monitor enhancement success rates

## 📋 Prerequisites

1. **TMDB Account**: You need a free TMDB account
2. **API Key**: Obtain a valid TMDB API key
3. **Modern Browser**: For ES6 module support

## 🔧 Setup Instructions

### Step 1: Get Your TMDB API Key

1. **Create TMDB Account**
   - Visit [TMDB](https://www.themoviedb.org/)
   - Click "Join TMDB" to create an account
   - Verify your email address

2. **Request API Key**
   - Go to your account settings
   - Click on "API" in the left sidebar
   - Click "Create" and select "Developer"
   - Fill out the application form:
     - **Application Name**: Your website name
     - **Application URL**: Your website URL
     - **Application Summary**: Brief description of your anime streaming site
     - **Choose the API type**: Select "Personal" for non-commercial use

3. **Wait for Approval**
   - TMDB typically approves API requests within 24 hours
   - You'll receive an email confirmation
   - Your API key will be available in your account settings

### Step 2: Configure the Integration

1. **Set Your API Key**
   ```javascript
   // Option 1: Environment variable (recommended for production)
   process.env.TMDB_API_KEY = 'your_32_character_api_key_here';
   
   // Option 2: Local storage (for client-side apps)
   localStorage.setItem('tmdb_api_key', 'your_32_character_api_key_here');
   
   // Option 3: Direct configuration (development only)
   tmdbService.setApiKey('your_32_character_api_key_here');
   ```

2. **Include Required Files**
   ```html
   <!-- Add to your HTML head -->
   <script type="module">
     import tmdbService from './services/tmdb-service.js';
     import posterEnhancer from './utils/poster-enhancement.js';
   </script>
   ```

### Step 3: Test the Integration

1. **Open the Test Page**
   - Navigate to `test-tmdb.html` in your browser
   - Enter your API key in the configuration section
   - Click "Set API Key" to validate it

2. **Run Enhancement Tests**
   - Click "Run Enhancement Tests"
   - Watch the progress bar and statistics
   - Review the side-by-side poster comparisons

## 💻 Usage Examples

### Basic Poster Enhancement

```javascript
import posterEnhancer from './utils/poster-enhancement.js';

// Single anime poster enhancement
const anime = {
    title: { english: 'Attack on Titan' },
    startDate: { year: 2013 },
    coverImage: { large: 'anilist_image_url' }
};

const enhanced = await posterEnhancer.getEnhancedPoster(anime);
console.log('Enhanced poster URL:', enhanced.url);
console.log('Source:', enhanced.source); // 'tmdb', 'anilist', or 'placeholder'
console.log('Quality:', enhanced.quality); // 'enhanced', 'original', or 'fallback'
```

### Batch Processing

```javascript
// Process multiple anime at once
const animeList = [
    { title: { english: 'One Piece' }, startDate: { year: 1999 } },
    { title: { english: 'Naruto' }, startDate: { year: 2002 } },
    // ... more anime
];

const results = await posterEnhancer.enhanceMultiplePosters(animeList, {
    maxConcurrent: 3,
    progressCallback: (current, total) => {
        console.log(`Progress: ${current}/${total}`);
    }
});

// Results contain enhanced poster data for each anime
results.forEach(result => {
    if (result.success) {
        console.log(`Enhanced: ${result.anime.title.english}`);
    }
});
```

### Advanced Configuration

```javascript
// Custom enhancement options
const enhanced = await posterEnhancer.getEnhancedPoster(anime, {
    preferredSize: 'XLARGE',      // 'SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'ORIGINAL'
    timeoutMs: 5000,              // Request timeout in milliseconds
    fallbackToOriginal: true,     // Use AniList image if TMDB fails
    enableCache: true             // Use caching system
});
```

## 🛠️ Integration with Existing Code

### Update Your Anime Loading Function

```javascript
// Before: Using only AniList images
function createAnimeItem(anime) {
    const imageUrl = anime.coverImage?.large || 'placeholder.jpg';
    // ... rest of the function
}

// After: Using enhanced poster system
async function createAnimeItem(anime) {
    const enhanced = await posterEnhancer.getEnhancedPoster(anime, {
        timeoutMs: 2000 // Shorter timeout for list items
    });
    
    const imageUrl = enhanced.url;
    // ... rest of the function
    
    // Optional: Add quality indicator
    if (enhanced.source === 'tmdb') {
        item.classList.add('enhanced-poster');
    }
}
```

### Error Handling Best Practices

```javascript
async function safeGetEnhancedPoster(anime) {
    try {
        return await posterEnhancer.getEnhancedPoster(anime);
    } catch (error) {
        console.warn('Poster enhancement failed:', error.message);
        
        // Fallback to AniList image
        return {
            url: anime.coverImage?.large || posterEnhancer.getPlaceholderImage(),
            source: 'fallback',
            quality: 'original'
        };
    }
}
```

## 📊 Monitoring and Statistics

### Get Enhancement Statistics

```javascript
// Get current statistics
const stats = posterEnhancer.getStats();
console.log(`Enhancement rate: ${stats.enhancementRate}`);
console.log(`Total processed: ${stats.totalProcessed}`);
console.log(`Enhanced: ${stats.enhanced}`);

// Get TMDB service status
const serviceStats = tmdbService.getStats();
console.log('Service ready:', serviceStats.isReady);
console.log('Cache size:', serviceStats.cacheSize);
```

### Performance Monitoring

```javascript
// Track enhancement performance
let enhancementMetrics = {
    startTime: Date.now(),
    totalRequests: 0,
    successfulEnhancements: 0,
    errors: 0
};

// In your enhancement function
async function trackEnhancement(anime) {
    enhancementMetrics.totalRequests++;
    
    try {
        const result = await posterEnhancer.getEnhancedPoster(anime);
        
        if (result.source === 'tmdb') {
            enhancementMetrics.successfulEnhancements++;
        }
        
        return result;
    } catch (error) {
        enhancementMetrics.errors++;
        throw error;
    }
}
```

## ⚠️ Important Considerations

### Rate Limiting
- TMDB allows 40 requests per 10 seconds
- The service automatically handles rate limiting
- Use batch processing for multiple anime

### Caching
- Enhanced posters are cached for 1 hour by default
- Cache reduces API calls and improves performance
- Clear cache periodically to get updated images

### Error Handling
- Always implement fallbacks to AniList images
- Handle network timeouts gracefully
- Log errors for debugging but don't break user experience

### Performance
- Use shorter timeouts (2-3 seconds) for list items
- Longer timeouts (5-10 seconds) for detailed views
- Consider lazy loading for better user experience

## 🐛 Troubleshooting

### Common Issues

1. **Invalid API Key Error**
   ```
   Error: Invalid API key: You must be granted a valid key
   ```
   - Verify your API key is 32 characters long
   - Check if the key is approved by TMDB
   - Ensure you're not using the example key from documentation

2. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded
   ```
   - The service automatically handles this with delays
   - Reduce concurrent requests if needed
   - Check if multiple instances are using the same key

3. **No Posters Found**
   - Anime might not be in TMDB database
   - Try different title variations (English vs Romaji)
   - TMDB focuses more on popular/mainstream anime

4. **Timeout Errors**
   - Increase timeout duration for better results
   - Check your internet connection
   - TMDB API might be experiencing issues

### Debug Mode

```javascript
// Enable debug logging
posterEnhancer.debugMode = true;
tmdbService.debugMode = true;

// This will provide detailed logs about the enhancement process
```

## 📈 Best Practices

1. **Gradual Implementation**
   - Start with a small subset of anime
   - Monitor success rates and performance
   - Gradually expand to full catalog

2. **User Experience**
   - Show AniList images immediately
   - Enhance to TMDB images when available
   - Use loading indicators for better UX

3. **Fallback Strategy**
   ```
   TMDB Enhanced Poster → AniList Image → Placeholder
   ```

4. **Performance Optimization**
   - Implement lazy loading
   - Use smaller image sizes for thumbnails
   - Preload critical posters

## 🔄 Future Enhancements

- **Image Quality Analysis**: Automatically choose best quality source
- **Multiple Sources**: Integrate additional poster databases
- **Machine Learning**: Learn user preferences for poster selection
- **CDN Integration**: Cache enhanced posters on CDN

## 📞 Support

If you encounter issues with the TMDB integration:

1. Check the browser console for error messages
2. Verify your API key is valid and approved
3. Test with the provided test page (`test-tmdb.html`)
4. Review the troubleshooting section above

For TMDB API specific issues, visit the [TMDB Support Forum](https://www.themoviedb.org/talk/category/5047958519c29526b50017d6).