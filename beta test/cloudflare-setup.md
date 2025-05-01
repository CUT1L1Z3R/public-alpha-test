# Deploying Anime Player on Cloudflare

This guide will walk you through deploying your anime player on Cloudflare Pages or Cloudflare Workers.

## Option 1: Deploy to Cloudflare Pages

Cloudflare Pages is best for static sites. While your anime player has server-side code for proxying requests, you can simplify it to work as a static site.

### Step 1: Create a Static Version

1. Create a `public` directory in your project:

```bash
mkdir -p cloudflare-deploy/public
```

2. Copy your HTML, CSS, and client-side JS files to this directory:

```bash
cp -r *.html *.css *.js movie_details/ assests/ cloudflare-deploy/public/
# Don't copy server.js or package.json
```

3. Modify any server-dependent code to use API calls directly from the browser:
   - In the client-side code, remove any references to the local proxy
   - Use CORS-friendly APIs or client-side proxies like CORS Anywhere

### Step 2: Create a Build Configuration

In your `cloudflare-deploy` directory, create a `package.json` file:

```json
{
  "name": "anime-player-cloudflare",
  "version": "1.0.0",
  "scripts": {
    "build": "echo Building completed"
  }
}
```

### Step 3: Deploy to Cloudflare Pages

1. Push your code to a GitHub repository
2. Log in to the Cloudflare dashboard
3. Navigate to Pages > Create a project
4. Select your GitHub repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `public`
6. Click "Save and Deploy"

## Option 2: Deploy as Cloudflare Worker (For API Proxying)

If you need the proxy functionality to handle CORS issues, use Cloudflare Workers.

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Initialize a Worker Project

```bash
mkdir -p cloudflare-worker
cd cloudflare-worker
wrangler init
```

### Step 3: Create a Worker Script

Create a `src/index.js` file:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Serve static files from GitHub or another host
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return fetch('https://your-github-pages.github.io/index.html')
  }

  // Handle proxy requests
  if (url.pathname.startsWith('/proxy')) {
    const targetUrl = url.searchParams.get('url')
    if (!targetUrl) {
      return new Response('URL parameter is required', { status: 400 })
    }

    try {
      const response = await fetch(targetUrl)
      const contentType = response.headers.get('content-type')

      return new Response(response.body, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 500 })
    }
  }

  // Redirect other static assets to your GitHub Pages or other static host
  return fetch(`https://your-github-pages.github.io${url.pathname}`)
}
```

### Step 4: Configure wrangler.toml

Update the `wrangler.toml` file:

```toml
name = "anime-player"
type = "javascript"
account_id = "your-account-id"
workers_dev = true

[build]
command = ""
[build.upload]
format = "service-worker"
```

### Step 5: Deploy the Worker

```bash
wrangler publish
```

## Option 3: Cloudflare Pages with Functions (Best Option)

This combines static site hosting with serverless functions.

### Step 1: Create a Cloudflare Pages project with Functions

1. Create a structure like:
```
├── functions/
│   └── api/
│       └── proxy.js
└── public/
    ├── index.html
    ├── movie_details/
    │   └── ...
    └── ...
```

2. In `functions/api/proxy.js`:
```javascript
export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response('URL parameter is required', { status: 400 })
  }

  try {
    const response = await fetch(targetUrl)
    const contentType = response.headers.get('content-type')

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, { status: 500 })
  }
}
```

3. Update your client-side code to use `/api/proxy?url=...` instead of `/proxy?url=...`

### Step 2: Deploy to Cloudflare Pages

Follow the same steps as Option 1 to deploy to Cloudflare Pages.

## Updating Client Code for Cloudflare Deployment

To make your anime player work on Cloudflare, modify the API calls in your client code:

1. In `movie_details.js`, update the fetchAnimeStreamingSources function:

```javascript
async function fetchAnimeStreamingSources(episodeId, server = "vidstreaming", category = "sub") {
  try {
    // Build the correct API URL
    const apiUrl = `https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=${episodeId}&server=${server}&category=${category}`;

    // Use the Cloudflare proxy if on Cloudflare
    const useProxy = false; // Set to true if you experience CORS issues
    const fetchUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(apiUrl)}` : apiUrl;

    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`API response error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Rest of your code...
  } catch (error) {
    // Error handling...
  }
}
```

## Additional Tips for Cloudflare Deployment

1. **CORS Issues**: If you encounter CORS issues, use the proxy function or add the [CORS Anywhere](https://github.com/Rob--W/cors-anywhere) proxy in front of problematic APIs.

2. **Environment Variables**: Use Cloudflare's environment variables for API keys or configuration:
   ```
   wrangler secret put API_KEY
   ```

3. **Custom Domains**: In the Cloudflare Dashboard, you can set up a custom domain for your Cloudflare Pages or Workers site.

4. **Caching**: Cloudflare provides caching capabilities that can speed up your site. Configure caching rules in the dashboard.

5. **Rate Limiting**: If you're making many API requests, consider implementing rate limiting to avoid hitting API limits.

6. **Analytics**: Cloudflare provides analytics for your deployed sites and apps.

7. **Optimize Assets**: Minimize and compress your JavaScript, CSS, and images for better performance.

8. **HTTP/3**: Cloudflare supports HTTP/3, which can improve loading times.
