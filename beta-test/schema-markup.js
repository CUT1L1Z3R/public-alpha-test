// Schema.org markup for better SEO
document.addEventListener('DOMContentLoaded', function() {
  // Function to detect if we're on the homepage
  const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';

  // Function to detect if we're on a movie details page
  const isMovieDetails = window.location.pathname.includes('/movie_details/');

  // Function to detect if we're on a category page
  const isMoviesPage = window.location.pathname.includes('/movies/');
  const isTVShowsPage = window.location.pathname.includes('/tvshows/');
  const isAnimePage = window.location.pathname.includes('/anime/');

  // Add website schema for all pages
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FreeFlix",
    "url": "https://freeflix.top/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://freeflix.top/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "description": "Stream Unlimited Free Movies and TV Shows on FreeFlix - Watch HD blockbusters, trending series, popular anime with no subscription fees."
  };

  // Add organization schema for all pages
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FreeFlix",
    "url": "https://freeflix.top/",
    "logo": "https://freeflix.top/assets/freeflix.png",
    "sameAs": []
  };

  // Add homepage specific schema
  if (isHomepage) {
    const movieListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": []
    };

    // Find all movie/show cards on the homepage
    const movieCards = document.querySelectorAll('.slider-card');
    let position = 1;

    movieCards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent?.trim() || '';
      const url = card.querySelector('a')?.href || '';
      const image = card.querySelector('img')?.src || '';
      const rating = card.querySelector('.rating')?.textContent?.trim() || '';

      if (title && url) {
        movieListSchema.itemListElement.push({
          "@type": "ListItem",
          "position": position,
          "item": {
            "@type": "Movie",
            "name": title,
            "url": url,
            "image": image,
            "aggregateRating": rating ? {
              "@type": "AggregateRating",
              "ratingValue": rating,
              "bestRating": "10",
              "worstRating": "1",
              "ratingCount": "100"
            } : undefined
          }
        });
        position++;
      }
    });

    // Add the schemas to the page
    addJsonLdScript(websiteSchema);
    addJsonLdScript(organizationSchema);
    addJsonLdScript(movieListSchema);
  }

  // Add movie details page schema
  if (isMovieDetails) {
    // Get the movie details from the page
    const title = document.querySelector('.movie-title')?.textContent?.trim() || 'Movie Title';
    const description = document.querySelector('.movie-description')?.textContent?.trim() || '';
    const image = document.querySelector('.movie-poster img')?.src || '';
    const rating = document.querySelector('.rating')?.textContent?.trim() || '';
    const genre = document.querySelector('.genre')?.textContent?.trim() || '';
    const year = document.querySelector('.year')?.textContent?.trim() || '';

    const movieSchema = {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": title,
      "description": description,
      "image": image,
      "url": window.location.href,
      "aggregateRating": rating ? {
        "@type": "AggregateRating",
        "ratingValue": rating,
        "bestRating": "10",
        "worstRating": "1",
        "ratingCount": "100"
      } : undefined,
      "genre": genre,
      "datePublished": year
    };

    // Add the schemas to the page
    addJsonLdScript(websiteSchema);
    addJsonLdScript(organizationSchema);
    addJsonLdScript(movieSchema);
  }

  // Add category page schemas
  if (isMoviesPage || isTVShowsPage || isAnimePage) {
    let pageType = isMoviesPage ? "Movie Collection" : isTVShowsPage ? "TV Series Collection" : "Anime Collection";
    let pageDesc = isMoviesPage ? "Browse and stream free movies in HD quality" :
                  isTVShowsPage ? "Watch popular TV shows and series for free" :
                  "Stream the latest anime series and classics";

    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `FreeFlix ${pageType}`,
      "description": pageDesc,
      "url": window.location.href,
      "isPartOf": {
        "@type": "WebSite",
        "name": "FreeFlix",
        "url": "https://freeflix.top/"
      }
    };

    // Add the schemas to the page
    addJsonLdScript(websiteSchema);
    addJsonLdScript(organizationSchema);
    addJsonLdScript(collectionSchema);
  }

  // Helper function to add schema to the page
  function addJsonLdScript(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }
});
