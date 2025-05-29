// SEO performance improvements
document.addEventListener('DOMContentLoaded', function() {
  // 1. Implement lazy loading for images
  implementLazyLoading();

  // 2. Add page preloading for common navigation paths
  addPagePreloading();

  // 3. Optimize external resources loading
  optimizeResourceLoading();

  // 4. Improve accessibility for better SEO
  improveAccessibility();

  // 5. Add breadcrumb navigation when appropriate
  addBreadcrumbNavigation();

  // Implementation functions
  function implementLazyLoading() {
    // Find all images that don't already have loading="lazy"
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      // Skip small images that are likely to be icons
      if (img.height > 50 && img.width > 50) {
        img.setAttribute('loading', 'lazy');

        // Add a fallback for older browsers
        if (!('loading' in HTMLImageElement.prototype)) {
          // Use data-src to store the real image source
          const src = img.src;
          img.setAttribute('data-src', src);
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

          // Observe when the image comes into view
          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const lazyImage = entry.target;
                lazyImage.src = lazyImage.getAttribute('data-src');
                observer.unobserve(lazyImage);
              }
            });
          });

          observer.observe(img);
        }
      }
    });
  }

  function addPagePreloading() {
    // Get current page path
    const currentPath = window.location.pathname;

    // Define likely next pages based on current page
    let likelyNextPages = [];

    if (currentPath === '/' || currentPath === '/index.html') {
      // From homepage, users likely go to Movies, TV Shows, or Anime
      likelyNextPages = ['/movies/', '/tvshows/', '/anime/'];
    } else if (currentPath.includes('/movies/')) {
      // From movies page, users likely go to movie details
      const movieLinks = Array.from(document.querySelectorAll('.movie-card a, .slider-card a'))
        .slice(0, 3) // Limit to first 3 links
        .map(link => link.href);
      likelyNextPages = movieLinks;
    } else if (currentPath.includes('/tvshows/')) {
      // From TV shows page, users likely go to TV show details
      const showLinks = Array.from(document.querySelectorAll('.tv-card a, .slider-card a'))
        .slice(0, 3) // Limit to first 3 links
        .map(link => link.href);
      likelyNextPages = showLinks;
    } else if (currentPath.includes('/anime/')) {
      // From anime page, users likely go to anime details
      const animeLinks = Array.from(document.querySelectorAll('.anime-card a, .slider-card a'))
        .slice(0, 3) // Limit to first 3 links
        .map(link => link.href);
      likelyNextPages = animeLinks;
    }

    // Add preload links for likely next pages
    likelyNextPages.forEach(url => {
      if (url && !url.includes('#') && url.startsWith('http')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'document';
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }

  function optimizeResourceLoading() {
    // 1. Add preconnect for external domains
    const externalDomains = [
      'https://image.tmdb.org',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    externalDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // 2. Defer non-critical scripts
    const scripts = document.querySelectorAll('script:not([async]):not([defer])');
    scripts.forEach(script => {
      if (!script.src.includes('schema-markup') &&
          !script.src.includes('seo-metadata') &&
          !script.src.includes('seo-performance')) {
        script.defer = true;
      }
    });

    // 3. Preload critical CSS
    const criticalCSSFiles = ['/index.css', '/custom-search.css'];
    criticalCSSFiles.forEach(cssFile => {
      if (!document.querySelector(`link[rel="preload"][href="${cssFile}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = cssFile;
        document.head.appendChild(link);
      }
    });
  }

  function improveAccessibility() {
    // 1. Add missing alt text to images
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      // Try to determine a reasonable alt text from context
      let altText = '';
      const parentTitle = img.closest('[title]')?.getAttribute('title');
      const nearbyHeading = img.closest('div')?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent;
      const cardTitle = img.closest('.card')?.querySelector('.card-title')?.textContent;

      altText = parentTitle || nearbyHeading || cardTitle || 'Movie thumbnail';
      img.alt = altText;
    });

    // 2. Add ARIA labels to navigation elements
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    navElements.forEach(nav => {
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Main navigation');
      }
    });

    // 3. Add appropriate heading structure if missing
    if (!document.querySelector('h1')) {
      // If no H1 exists, create one for the page title and make it visually hidden
      const pageTitle = document.title.split(' - ')[0];
      const h1 = document.createElement('h1');
      h1.textContent = pageTitle;
      h1.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
      document.body.prepend(h1);
    }
  }

  function addBreadcrumbNavigation() {
    // Only add breadcrumbs on deeper pages, not on homepage
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      return;
    }

    // Check if breadcrumbs already exist
    if (document.querySelector('.breadcrumbs')) {
      return;
    }

    // Determine page category and structure
    let breadcrumbItems = [];
    breadcrumbItems.push({ label: 'Home', url: '/' });

    if (path.includes('/movies/')) {
      breadcrumbItems.push({ label: 'Movies', url: '/movies/' });

      // Check if we're on a specific movie page with a genre parameter
      const urlParams = new URLSearchParams(window.location.search);
      const genre = urlParams.get('genre');
      if (genre) {
        breadcrumbItems.push({ label: capitalizeFirstLetter(genre), url: `/movies/?genre=${genre}` });
      }
    } else if (path.includes('/tvshows/')) {
      breadcrumbItems.push({ label: 'TV Shows', url: '/tvshows/' });

      // Check if we're on a specific TV show page with a genre parameter
      const urlParams = new URLSearchParams(window.location.search);
      const genre = urlParams.get('genre');
      if (genre) {
        breadcrumbItems.push({ label: capitalizeFirstLetter(genre), url: `/tvshows/?genre=${genre}` });
      }
    } else if (path.includes('/anime/')) {
      breadcrumbItems.push({ label: 'Anime', url: '/anime/' });

      // Check if we're on a specific anime page with a genre parameter
      const urlParams = new URLSearchParams(window.location.search);
      const genre = urlParams.get('genre');
      if (genre) {
        breadcrumbItems.push({ label: capitalizeFirstLetter(genre), url: `/anime/?genre=${genre}` });
      }
    } else if (path.includes('/movie_details/')) {
      breadcrumbItems.push({ label: 'Movies', url: '/movies/' });

      // Add the movie title if available
      const movieTitle = document.querySelector('.movie-title')?.textContent;
      if (movieTitle) {
        breadcrumbItems.push({ label: movieTitle, url: '#' });
      } else {
        breadcrumbItems.push({ label: 'Movie Details', url: '#' });
      }
    } else if (path.includes('/watchList/')) {
      breadcrumbItems.push({ label: 'Watchlist', url: '#' });
    }

    // Create breadcrumb HTML
    const breadcrumbNav = document.createElement('nav');
    breadcrumbNav.className = 'breadcrumbs';
    breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');

    const breadcrumbList = document.createElement('ol');
    breadcrumbList.style.cssText = 'display:flex;list-style:none;padding:10px 20px;margin:0;background-color:rgba(0,0,0,0.2);color:white;';

    // Hide breadcrumbs on desktop (768px and above)
    const mediaQueryStyle = document.createElement('style');
    mediaQueryStyle.textContent = `
      @media (min-width: 768px) {
        .breadcrumbs {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(mediaQueryStyle);

    // Create breadcrumb items
    breadcrumbItems.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.style.cssText = 'margin-right:5px;';

      const isLast = index === breadcrumbItems.length - 1;

      if (isLast) {
        // Current page (no link)
        listItem.innerHTML = `<span aria-current="page">${item.label}</span>`;
      } else {
        // Link to previous level
        listItem.innerHTML = `<a href="${item.url}" style="color:white;text-decoration:none;">${item.label}</a>`;

        // Add separator except for the last item
        if (index < breadcrumbItems.length - 1) {
          listItem.innerHTML += ' <span aria-hidden="true" style="margin:0 5px;">/</span> ';
        }
      }

      breadcrumbList.appendChild(listItem);
    });

    breadcrumbNav.appendChild(breadcrumbList);

    // Add breadcrumb schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": item.url !== '#' ? `https://freeflix.top${item.url}` : undefined
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    // Insert breadcrumbs after header or at the top of main content
    const header = document.querySelector('header');
    const mainContent = document.querySelector('main') || document.querySelector('.main-content');

    if (header && header.nextSibling) {
      header.parentNode.insertBefore(breadcrumbNav, header.nextSibling);
    } else if (mainContent) {
      mainContent.prepend(breadcrumbNav);
    } else {
      // Fallback: insert after body's first child
      const firstChild = document.body.firstChild;
      if (firstChild) {
        document.body.insertBefore(breadcrumbNav, firstChild.nextSibling);
      } else {
        document.body.prepend(breadcrumbNav);
      }
    }
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
