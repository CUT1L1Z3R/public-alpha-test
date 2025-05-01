#!/bin/bash

echo "Deploying to Cloudflare Pages..."
echo "================================="

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare if needed
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
wrangler pages deploy . --project-name anime-video-player

echo "Deployment completed!"
echo "Check the output above for your deployment URL."
echo "You can also find your deployment in the Cloudflare Dashboard under Pages."
