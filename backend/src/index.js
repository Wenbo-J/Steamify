const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");
const steamRoutes = require("./routes/steamRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Spotify/Music Routes
app.get("/music/track/:track_id", spotifyRoutes.track);
app.get("/music/playlists/:playlist_id", spotifyRoutes.playlist);
app.post("/music/playlists", spotifyRoutes.createPlaylist);
app.delete("/music/playlists/:playlist_id", spotifyRoutes.deletePlaylist);
app.post("/music/playlists/:playlist_id/tracks", spotifyRoutes.insertTrackFromPlaylist);
app.delete("/music/playlists/:playlist_id/tracks", spotifyRoutes.deleteTrackFromPlaylist);
app.post("/music/playlists/:playlist_id/save", spotifyRoutes.savePlaylist);
app.delete("/music/playlists/:playlist_id/save", spotifyRoutes.deleteSavedPlaylist);

// Steam/Game Routes (if implemented)
// Note: These routes may need to be implemented in steamRoutes.js
// app.get("/games/", steamRoutes.allGames);
// app.get("/games/:game_id", steamRoutes.game);
// app.get("/games/:game_id/recommended_tracks", steamRoutes.getGameSessionTracks);

// Recommendation Routes (if implemented)
// app.get("/recommends/:game_id", steamRoutes.recommended_tracks);

// Analytics Routes (if implemented)
// app.get("/genres/steam/audio_profile", steamRoutes.getGenreAudioProfile);
// app.get("/genres/Spotify/topRecommendations", steamRoutes.getTopAudioGenres);
// app.get("/playlist/similarUsers", steamRoutes.getSimilarUserPlaylist);

// User Routes
app.post("/users/", userRoutes.createUser);
app.get("/users/:user_id", userRoutes.userAccounts);
app.patch("/users/:user_id", userRoutes.updateUser);
app.get("/users/:user_id/games", userRoutes.getUserGames);
app.get("/users/:user_id/playlists", userRoutes.getUserPlaylists);

app.listen(5000, () => console.log("Server running on port 5000"));
