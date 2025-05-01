# Deploying to Cloudflare

This guide explains how to deploy the Anime Video Player to Cloudflare Pages or Cloudflare Workers.

## Option 1: Deploy to Cloudflare Pages (Recommended)

Cloudflare Pages is the simplest way to deploy this static site.

### Prerequisites

1. A Cloudflare account
2. Node.js and npm installed

### Deployment Steps

1. **Install Wrangler CLI**

   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**

   ```bash
   wrangler login
   ```

3. **Deploy from your local machine**

   ```bash
   # Navigate to the project directory
   cd /path/to/anime-video-player

   # Deploy to Cloudflare Pages
   wrangler pages deploy .
   ```

4. **Configure the project settings**

   - After deployment, go to the Cloudflare Dashboard
   - Navigate to Pages > Your Project > Settings
   - Set up any environment variables if needed

## Option 2: Deploy as a Cloudflare Worker

For more control over routing and server-side functionality, you can deploy as a Worker.

### Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Login to Cloudflare**

   ```bash
   npx wrangler login
   ```

3. **Configure wrangler.toml**

   The `wrangler.toml` file is already set up with basic configuration. You may need to update the `name` field to something unique.

4. **Test locally**

   ```bash
   npm run dev
   ```

5. **Deploy to Cloudflare Workers**

   ```bash
   npm run deploy
   ```

## Troubleshooting

### CORS Issues

If you experience CORS errors when fetching the API:

1. The Worker script includes a CORS proxy at `/proxy?url=YOUR_URL_HERE`
2. You can modify this in the `worker.js` file to add any additional headers

### HLS Streaming Issues

Some HLS streams might not work on Cloudflare due to CORS restrictions:

1. Use the HLS test page (`/hls-test`) to verify if streams work
2. Try different stream sources or servers (vidstreaming, streamsb, vidcdn)

### 404 Errors on Pages

If you're getting 404 errors for your routes:

1. Check that the file exists in your local directory
2. Ensure the path is correct in the `worker.js` handleRequest function
3. Try adding a custom route in the Cloudflare Pages settings

## Customizing the Worker

You can customize the Worker in `worker.js` to add more features:

- Add server-side caching
- Implement custom authentication
- Create additional API proxies

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
