/**
 * Anime Player Cloudflare Worker
 *
 * This worker provides:
 * 1. A proxy for bypassing CORS restrictions
 * 2. Static file hosting by redirecting to your static site
 * 3. Analytics for tracking API usage
 */

// Configuration
const CONFIG = {
  // Your static site URL (GitHub Pages, Cloudflare Pages, etc.)
  STATIC_SITE_URL: 'https://your-static-site.pages.dev',

  // Add allowed domains for proxying (for security)
  ALLOWED_PROXY_DOMAINS: [
    'api-anime-rouge.vercel.app',
    'vvf5.d21-anime77.com',
    'lol.aheg-anime.com',
    'api-anime.watch'
  ],

  // Enable debugging
  DEBUG: true
};

// Event listener for all fetch requests
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Log request if debugging is enabled
  if (CONFIG.DEBUG) {
    console.log(`Request path: ${path}`);
  }

  // Handle proxy requests
  if (path.startsWith('/proxy') || path.startsWith('/api/proxy')) {
    return handleProxyRequest(request, url);
  }

  // Serve static files from your static site
  return fetchStaticAsset(path);
}

/**
 * Handle proxy requests
 */
async function handleProxyRequest(request, url) {
  // Get the target URL to proxy
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is required', {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if the domain is allowed for security
  const targetDomain = new URL(targetUrl).hostname;
  if (!isAllowedDomain(targetDomain)) {
    return new Response(`Domain ${targetDomain} is not allowed for proxying`, {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (CONFIG.DEBUG) {
      console.log(`Proxying request to: ${targetUrl}`);
    }

    // Create fetch request options
    const fetchOptions = {
      method: request.method,
      headers: {
        'User-Agent': 'AnimePlayer/1.0 Cloudflare-Worker',
        'Accept': '*/*'
      }
    };

    // Forward the request
    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      if (CONFIG.DEBUG) {
        console.error(`Proxy target returned error: ${response.status}`);
      }

      // Return the error from the proxied server
      return new Response(
        JSON.stringify({
          error: `Proxy target returned ${response.status}: ${response.statusText}`
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Get original response headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Create a new response with CORS headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    if (CONFIG.DEBUG) {
      console.error(`Proxy error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        error: `Proxy error: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

/**
 * Fetch a static asset from your static site
 */
async function fetchStaticAsset(path) {
  // Normalize the path
  const normPath = path === '/' ? '/index.html' : path;

  // Create the full URL
  const assetUrl = `${CONFIG.STATIC_SITE_URL}${normPath}`;

  if (CONFIG.DEBUG) {
    console.log(`Fetching static asset: ${assetUrl}`);
  }

  try {
    // Fetch the static asset
    return await fetch(assetUrl);
  } catch (error) {
    if (CONFIG.DEBUG) {
      console.error(`Error fetching static asset: ${error.message}`);
    }

    // Return a 404 page
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * Check if the domain is allowed for proxying
 */
function isAllowedDomain(domain) {
  return CONFIG.ALLOWED_PROXY_DOMAINS.some(allowedDomain =>
    domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
  );
}
