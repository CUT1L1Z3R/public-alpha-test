/**
 * Cloudflare Worker for serving the anime video player application
 */

// Define MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Add CORS headers to the response
function addCorsHeaders(response) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Proxy function to handle CORS issues
async function proxyRequest(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Proxy target returned ${response.status}: ${response.statusText}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const contentType = response.headers.get('content-type');
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Proxy error: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Get MIME type based on file extension
function getMimeType(filename) {
  const ext = filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  return ext ? MIME_TYPES[`.${ext}`] || 'application/octet-stream' : 'application/octet-stream';
}

// Main event handler
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Handle proxy requests
  if (path.startsWith('/proxy') && url.searchParams.has('url')) {
    const targetUrl = url.searchParams.get('url');
    return proxyRequest(targetUrl);
  }

  // Normalize path
  let normalizedPath = path === '/' ? '/index.html' : path;

  // Handle specific routes
  if (path === '/movie-details') {
    normalizedPath = '/movie_details/movie_details.html';
  } else if (path === '/anime-test') {
    normalizedPath = '/anime_test.html';
  } else if (path === '/anime-direct-player') {
    normalizedPath = '/anime_direct_player.html';
  } else if (path === '/hls-test') {
    normalizedPath = '/hls_test.html';
  }

  // Try to serve the file from Cloudflare Pages
  try {
    const response = await fetch(`${url.origin}${normalizedPath}`);

    if (!response.ok) {
      return new Response(`File not found: ${normalizedPath}`, { status: 404 });
    }

    const contentType = getMimeType(normalizedPath);

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new Response(`Error serving file: ${error.message}`, { status: 500 });
  }
}
