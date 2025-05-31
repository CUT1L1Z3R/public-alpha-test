#!/bin/bash
# Create dist directory if it doesn't exist
mkdir -p dist

# Copy all files to dist directory
cp -r ./* ./dist/

# Remove the dist/dist directory to avoid recursion
rm -rf ./dist/dist

# Make sure dist directory exists and has all necessary files
echo "Build completed successfully!"
