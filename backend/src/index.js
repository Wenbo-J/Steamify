const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");
const steamRoutes = require("./routes/steamRoutes");
const analyticalRoutes = require("./routes/analyticalRoutes");

const app = express();
// CORS configuration - allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/api", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Spotify/Music Routes
app.get("/music/track/:track_id", spotifyRoutes.track);
app.get("/music/tracks", spotifyRoutes.getAllTracks);
app.get("/music/playlists/:playlist_id", spotifyRoutes.playlist);
app.get("/music/playlists/:playlist_id/tracks", spotifyRoutes.getPlaylistTracks);
app.post("/music/playlists", spotifyRoutes.createPlaylist);
app.patch("/music/playlists/:playlist_id", spotifyRoutes.renamePlaylist);
app.delete("/music/playlists/:playlist_id", spotifyRoutes.deletePlaylist);
app.post("/music/playlists/:playlist_id/tracks", spotifyRoutes.insertTrackFromPlaylist);
app.delete("/music/playlists/:playlist_id/tracks", spotifyRoutes.deleteTrackFromPlaylist);
app.post("/music/playlists/:playlist_id/save", spotifyRoutes.savePlaylist);
app.delete("/music/playlists/:playlist_id/save", spotifyRoutes.deleteSavedPlaylist);

// Steam/Game Routes
// Support both with and without trailing slash
app.get("/games", steamRoutes.getAllGames);
app.get("/games/", steamRoutes.getAllGames);
app.get("/games/:game_id", steamRoutes.getGame);
app.get("/games/:game_id/recommended_tracks", steamRoutes.getGameRecommendedTracks);

// Recommendation Routes (API spec Route 6)
app.get("/recommends/:game_id", steamRoutes.recommendedTracks);

// Analytics Routes
app.get("/analytics/genres/audio_profile", analyticalRoutes.get_genre_audio_profile);
app.get("/analytics/genres/top_pairs", analyticalRoutes.get_top_genre_pairs);
app.get("/analytics/social/recommendations", analyticalRoutes.get_social_recommendations);
app.get("/analytics/search/songs", analyticalRoutes.search_songs);

// User Routes
app.post("/users/", userRoutes.createUser);
app.post("/auth/google", userRoutes.googleAuth);
app.get("/users/:user_id", userRoutes.userAccounts);
app.patch("/users/:user_id", userRoutes.updateUser);
app.get("/users/:user_id/games", userRoutes.getUserGames);
app.get("/users/:user_id/playlists", userRoutes.getUserPlaylists);

// Use port 5001 to avoid conflict with AirPlay on port 5000
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api`);
  console.log(`Games endpoint: http://localhost:${PORT}/games/`);
});
