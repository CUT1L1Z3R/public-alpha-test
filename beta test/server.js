const express = require('express');
const path = require('path');
const cors = require('cors');
// Using the global fetch API (Node.js 18+)

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/movie-details', (req, res) => {
  res.sendFile(path.join(__dirname, 'movie_details/movie_details.html'));
});

app.get('/anime-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'anime_test.html'));
});

app.get('/anime-direct-player', (req, res) => {
  res.sendFile(path.join(__dirname, 'anime_direct_player.html'));
});

app.get('/hls-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'hls_test.html'));
});

// Proxy endpoint for CORS issues (optional)
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Proxy target returned ${response.status}: ${response.statusText}`
      });
    }

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'application/octet-stream');

    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
