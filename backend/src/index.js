const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({ message: "Backend is running" });
});

// User Routes
app.post("/users/", userRoutes.createUser);
app.get("/users/:user_id", userRoutes.userAccounts);
app.patch("/users/:user_id", userRoutes.updateUser);
app.post("/music/playlists/:playlist_id/save", userRoutes.savePlaylist);
app.delete("/music/playlists/:playlist_id/save", userRoutes.deleteSavedPlaylist);
app.get("/users/:user_id/games", userRoutes.getUserGames);
app.get("/users/:user_id/playlists", userRoutes.getUserPlaylists);

app.listen(5000, () => console.log("Server running on port 5000"));
