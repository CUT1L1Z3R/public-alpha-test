// Enhanced SEO metadata for FreeFlix
document.addEventListener('DOMContentLoaded', function() {
  // Determine current page type
  const path = window.location.pathname;
  const isHomepage = path === '/' || path === '/index.html';
  const isMoviesPage = path.includes('/movies/');
  const isTVShowsPage = path.includes('/tvshows/');
  const isAnimePage = path.includes('/anime/');
  const isMovieDetails = path.includes('/movie_details/');
  const isWatchList = path.includes('/watchList/');

  // Base metadata for all pages
  updateMetaTag('viewport', 'width=device-width, initial-scale=1');
  updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  updateMetaTag('author', 'FreeFlix');

  // Set canonical URL
  const canonicalUrl = `https://freeflix.top${path}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonicalUrl;

  // Page-specific metadata
  if (isHomepage) {
    setHomePageMetadata();
  } else if (isMoviesPage) {
    setMoviesPageMetadata();
  } else if (isTVShowsPage) {
    setTVShowsPageMetadata();
  } else if (isAnimePage) {
    setAnimePageMetadata();
  } else if (isMovieDetails) {
    setMovieDetailsMetadata();
  } else if (isWatchList) {
    setWatchListMetadata();
  }

  // Add Open Graph and Twitter Card metadata
  setupSocialMetadata();

  // Add favicon links if not already present
  setupFavicons();

  // Functions to set page-specific metadata
  function setHomePageMetadata() {
    document.title = 'FreeFlix - #1 Free Movies & TV Shows Streaming Site | Watch Online Free';
    updateMetaTag('description', 'Stream unlimited free movies and TV shows on FreeFlix - Watch HD blockbusters, trending series, popular anime with no subscription fees. Best free streaming site 2025!');
    updateMetaTag('keywords', 'free movies, free streaming, watch movies online, free TV shows, Netflix alternatives, HD movies free, no subscription movies, free anime');
  }

  function setMoviesPageMetadata() {
    document.title = 'FreeFlix Movies - Watch Free HD Movies Online | No Account Required';
    updateMetaTag('description', 'Browse and stream thousands of free movies in HD quality - action, comedy, horror, thriller, drama & more. No account, no subscription, completely free.');
    updateMetaTag('keywords', 'free movies, watch movies online, stream movies free, HD movies, action movies, comedy movies, no registration movies');
  }

  function setTVShowsPageMetadata() {
    document.title = 'FreeFlix TV Shows - Stream Popular Series Free | All Episodes Free';
    updateMetaTag('description', 'Watch popular TV shows and series for free - Netflix originals, drama, comedy, crime shows and more. Stream all episodes with no account or subscription.');
    updateMetaTag('keywords', 'free TV shows, watch series online, stream TV episodes, Netflix shows free, popular series, drama shows, comedy series');
  }

  function setAnimePageMetadata() {
    document.title = 'FreeFlix Anime - Watch Free Anime Online | Subbed & Dubbed Available';
    updateMetaTag('description', 'Stream the latest anime series and classics completely free - subbed and dubbed versions available. No account needed, watch on any device.');
    updateMetaTag('keywords', 'free anime, watch anime online, anime streaming, dubbed anime, subbed anime, anime episodes, popular anime');
  }

  function setMovieDetailsMetadata() {
    // Try to extract movie title from page
    const movieTitle = document.querySelector('.movie-title')?.textContent || 'Movie Details';
    document.title = `${movieTitle} - Watch Free on FreeFlix | HD Streaming`;

    // Try to extract movie description
    const movieDesc = document.querySelector('.movie-description')?.textContent ||
                     'Watch this movie for free in HD quality on FreeFlix. No account or subscription required.';
    updateMetaTag('description', movieDesc);

    // Try to extract genre
    const genre = document.querySelector('.genre')?.textContent || '';
    const keywords = `watch ${movieTitle}, ${movieTitle} free, stream ${movieTitle}, ${genre} movies, free movies online`;
    updateMetaTag('keywords', keywords);
  }

  function setWatchListMetadata() {
    document.title = 'My Watchlist - FreeFlix | Save & Organize Your Favorite Content';
    updateMetaTag('description', 'Manage your personalized watchlist on FreeFlix. Save your favorite movies, TV shows, and anime to watch later - all for free.');
    updateMetaTag('keywords', 'movie watchlist, TV show collection, save movies, organize watchlist, free streaming watchlist');
  }

  function setupSocialMetadata() {
    // Get page title and description
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || '';

    // Find a relevant image on the page
    let image = document.querySelector('.hero-img img')?.src ||
               document.querySelector('.movie-poster img')?.src ||
               'https://freeflix.top/assets/freeflix.png';

    // Open Graph metadata
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', canonicalUrl, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:type', isMovieDetails ? 'video.movie' : 'website', 'property');
    updateMetaTag('og:site_name', 'FreeFlix', 'property');

    // Twitter Card metadata
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', image, 'name');
  }

  function setupFavicons() {
    // Add various favicon formats for different devices/browsers
    const favicons = [
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/freeflix.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/assets/freeflix.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/freeflix.png' },
      { rel: 'mask-icon', href: '/assets/freeflix.png', color: '#5bbad5' }
    ];

    favicons.forEach(favicon => {
      if (!document.querySelector(`link[rel="${favicon.rel}"][sizes="${favicon.sizes || ''}"]`)) {
        const link = document.createElement('link');
        link.rel = favicon.rel;
        if (favicon.type) link.type = favicon.type;
        if (favicon.sizes) link.sizes = favicon.sizes;
        link.href = favicon.href;
        if (favicon.color) link.color = favicon.color;
        document.head.appendChild(link);
      }
    });
  }

  // Helper function to update or create meta tags
  function updateMetaTag(name, content, attributeName = 'name') {
    let meta = document.querySelector(`meta[${attributeName}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attributeName, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
});
