#!/bin/bash
# Script to prepare the anime player for Cloudflare deployment

echo "Preparing Anime Player for Cloudflare deployment..."

# Create deploy directory
mkdir -p cloudflare-deploy/public
mkdir -p cloudflare-deploy/functions/api

# Copy static files
echo "Copying static files..."
cp -r *.html *.css *.js movie_details/ assests/ cloudflare-deploy/public/
# Don't copy server.js, package.json or hidden files

# Create package.json for Cloudflare Pages
echo "Creating package.json for Cloudflare Pages..."
cat > cloudflare-deploy/package.json << EOL
{
  "name": "anime-player-cloudflare",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo Building completed"
  }
}
EOL

# Create _routes.json file to handle SPA routing
echo "Creating routing configuration..."
cat > cloudflare-deploy/public/_routes.json << EOL
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
EOL

# Create the proxy function for Cloudflare Pages Functions
echo "Creating API proxy function..."
cat > cloudflare-deploy/functions/api/proxy.js << EOL
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is required', {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Add allowed domains for security
  const allowedDomains = [
    'api-anime-rouge.vercel.app',
    'vvf5.d21-anime77.com',
    'lol.aheg-anime.com',
    'api-anime.watch'
  ];

  // Check if domain is allowed
  const targetDomain = new URL(targetUrl).hostname;
  const isDomainAllowed = allowedDomains.some(domain =>
    targetDomain === domain || targetDomain.endsWith(\`.\${domain}\`)
  );

  if (!isDomainAllowed) {
    return new Response(\`Domain \${targetDomain} is not allowed for proxying\`, {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(\`Proxying request to: \${targetUrl}\`);

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'AnimePlayer/1.0 Cloudflare-Worker',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      console.error(\`Proxy target returned error: \${response.status}\`);

      return new Response(
        JSON.stringify({
          error: \`Proxy target returned \${response.status}: \${response.statusText}\`
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

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

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
    console.error(\`Proxy error: \${error.message}\`);

    return new Response(
      JSON.stringify({
        error: \`Proxy error: \${error.message}\`
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
EOL

# Update the movie_details.js file to use the Cloudflare proxy if needed
echo "Updating JavaScript files to use Cloudflare proxy if needed..."
cp cloudflare-deploy/public/movie_details/movie_details.js cloudflare-deploy/public/movie_details/movie_details.original.js

# Add proxy support to movie_details.js
sed -i.bak 's|const apiUrl = `https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}`;|const apiUrl = `https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}`;\n\n        // Use the Cloudflare proxy if needed (set to true to use proxy)\n        const useProxy = false; // Change to true if you encounter CORS issues\n        const fetchUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(apiUrl)}` : apiUrl;|' cloudflare-deploy/public/movie_details/movie_details.js

# Update fetch calls to use the proxy URL if enabled
sed -i.bak 's|const response = await fetch(apiUrl);|const response = await fetch(fetchUrl);|' cloudflare-deploy/public/movie_details/movie_details.js

# Remove backup files
find cloudflare-deploy -name "*.bak" -type f -delete

# Create README with deployment instructions
echo "Creating README with deployment instructions..."
cat > cloudflare-deploy/README.md << EOL
# Anime Player - Cloudflare Deployment

This directory contains the files prepared for Cloudflare Pages deployment with Functions.

## Deployment Steps

1. Push this code to your GitHub repository
2. Log in to the Cloudflare dashboard
3. Navigate to Pages > Create a project
4. Select your GitHub repository
5. Configure the build settings:
   - Build command: \`npm run build\`
   - Build output directory: \`public\`
6. Enable Functions in the project settings
7. Click "Save and Deploy"

## Using the API Proxy

If you experience CORS issues with the anime API, enable the proxy by:

1. Open \`public/movie_details/movie_details.js\`
2. Set \`const useProxy = true;\` (around line 300)
3. Save and redeploy

## Custom Domain

You can set up a custom domain in the Cloudflare Dashboard:

1. Go to your Pages project
2. Click on "Custom domains"
3. Follow the instructions to add your domain
EOL

echo "Deployment files prepared in the cloudflare-deploy directory!"
echo "You can now push this directory to GitHub and deploy it to Cloudflare Pages."
