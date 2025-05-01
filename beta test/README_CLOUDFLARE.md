# Anime Video Player - Cloudflare Deployment Guide

This project is configured to be easily deployed to Cloudflare. You have two main options:

1. Cloudflare Pages (recommended for static hosting)
2. Cloudflare Workers (for more advanced server-side features)

## Quick Start - Cloudflare Pages

### One-Click Deployment

1. **Run the provided deployment script:**

   ```bash
   # Make the script executable first
   chmod +x deploy-to-cloudflare.sh

   # Run the script
   ./deploy-to-cloudflare.sh
   ```

2. **Follow the on-screen instructions** to log in to Cloudflare if needed.

3. **Access your deployed site** using the URL provided after deployment.

### Manual Deployment

1. **Install Wrangler CLI:**

   ```bash
   npm install -g wrangler
   ```

2. **Log in to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Deploy to Cloudflare Pages:**

   ```bash
   wrangler pages deploy . --project-name anime-video-player
   ```

## Project Structure for Cloudflare

- **_headers**: Sets CORS headers for all files
- **_routes.json**: Configures custom routes
- **wrangler.toml**: Configuration for Cloudflare Workers
- **worker.js**: Server-side logic for the Worker

## Accessing Your App

Your application will be available at:
- **Main URL**: https://[your-project-name].pages.dev
- **Movie Details**: https://[your-project-name].pages.dev/movie-details
- **Anime Test**: https://[your-project-name].pages.dev/anime-test
- **HLS Test**: https://[your-project-name].pages.dev/hls-test
- **Direct Player**: https://[your-project-name].pages.dev/anime-direct-player

## Troubleshooting

### CORS Issues

If you're experiencing CORS issues when accessing the API:

1. Use the built-in proxy: `/proxy?url=YOUR_API_URL`
2. Or modify the `_headers` file to add additional CORS configurations

### 404 Errors

If some pages return 404:

1. Check if the file paths in `_routes.json` match your project structure
2. Try accessing the direct file path instead of the custom route

### Streaming Issues

If HLS streams don't work:

1. Make sure the HLS.js library is loaded correctly
2. Try using different stream sources or servers
3. Test with the HLS test page (/hls-test)

## For More Information

See the detailed [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) file for advanced configurations and more deployment options.
