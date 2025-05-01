// GET Anime Episode Streaming Source Links - CORRECT FORMAT
// Endpoint - NOTE: Use 'aniwatch' instead of 'anime' in the path
// https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id={episodeId}&server={server}&category={category}

// Query Parameters
// Parameter: id (string) - episode Id - Required: Yes - Default: --
// Parameter: server (string) - server name - Required: No - Default: "vidstreaming"
// Parameter: category (string) - The category of the episode ('sub' or 'dub') - Required: No - Default: "sub"

// Request sample - CORRECT FORMAT
const fetchAnimeEpisode = async () => {
  try {
    // The URL format is /aniwatch/episode-srcs not /anime/episode-srcs
    const res = await fetch(
      "https://api-anime-rouge.vercel.app/aniwatch/episode-srcs?id=solo-leveling-18718?ep=120094&server=vidstreaming&category=sub"
    );

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log(data);

    // Example response structure
    /*
    {
      "headers": {...},
      "sources": [
        {
          "url": "https://example.com/video/source.mp4",
          "isM3U8": false,
          "quality": "1080p"
        },
        ...
      ],
      "download": "https://example.com/download/video.mp4",
      "m3u8": "https://example.com/hls/playlist.m3u8", // May be provided for HLS streams
    }
    */

    return data;
  } catch (error) {
    console.error("Error fetching anime episode:", error);
    return null;
  }
};

// Export the function for use in other files
if (typeof module !== 'undefined') {
  module.exports = {
    fetchAnimeEpisode
  };
}
