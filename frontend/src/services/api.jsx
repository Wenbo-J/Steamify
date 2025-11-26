import config from '../config.json'; // Optional: store BASE_URL here

const BASE_URL = 'http://localhost:8080'; // Change to your actual backend port

// Route 12.1 / Query 1: The core Generator logic
export const getRecommendations = async (gameId, duration) => {
  const res = await fetch(`${BASE_URL}/recommendations?game_id=${gameId}&session_minutes=${duration}`);
  return res.json();
};

// Route 1: Track Details
export const getTrackDetails = async (trackId) => {
  const res = await fetch(`${BASE_URL}/music/track/${trackId}`);
  return res.json();
};

// Route 2.1: Playlist Details
export const getPlaylistDetails = async (playlistId) => {
  const res = await fetch(`${BASE_URL}/music/playlists/${playlistId}`);
  return res.json();
};

// New Helper: Get Games for Browser
// You likely need to add a simple "GET /games?page=X" route to your backend if you haven't yet.
export const fetchGames = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/steam/games?page=${page}&limit=20`);
  return res.json();
};