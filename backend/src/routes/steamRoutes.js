const { Pool, types } = require('pg');
const path = require('path');
const config = require(path.join(__dirname, '../../config.json'));

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

// Route 4: GET /games/:game_id
// Get a specific game by ID
const getGame = async function(req, res) {
  const game_id = req.params.game_id;
  
  connection.query(`
    SELECT 
      game_id,
      game_name AS name,
      game_name,
      genres,
      genre_list,
      rating,
      release_date,
      developer,
      publisher
    FROM "Steam"
    WHERE game_id = $1
  `, [game_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      res.status(404).json({message: 'Game not found'});
    } else {
      res.json(data.rows[0]);
    }
  });
};

// Route 5: GET /games
// Get all games
const getAllGames = async function(_, res) {
  connection.query(`
    SELECT 
      game_id,
      game_name AS name,
      game_name,
      genres,
      genre_list,
      rating,
      release_date,
      developer,
      publisher
    FROM "Steam"
    ORDER BY game_name
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
};

// Route 6 / 12.1: GET /games/:game_id/recommended_tracks
// Get recommended tracks for a game based on session duration and audio features
const getGameRecommendedTracks = async function(req, res) {
  const game_id = req.params.game_id;
  
  // Get query parameters with defaults
  const sessionMinutes = parseInt(req.query.session_minutes) || 60;
  // Frontend sends 0-100, convert to 0-1 for database (which stores 0-1)
  const minEnergy = (parseFloat(req.query.min_energy) || 0) / 100;
  const maxEnergy = (parseFloat(req.query.max_energy) || 100) / 100;
  const minValence = (parseFloat(req.query.min_valence) || 0) / 100;
  const maxValence = (parseFloat(req.query.max_valence) || 100) / 100;
  
  // Calculate target duration in seconds
  const targetDurationSeconds = sessionMinutes * 60;
  
  // First, get the game's genres and map them to music genres
  connection.query(`
    SELECT DISTINCT mg.music_genre
    FROM "GameGen" gg
    JOIN "GenMap" gm ON gg.game_genre = gm.game_genre
    JOIN "MusicGen" mg ON gm.music_genre = mg.music_genre
    WHERE gg.game_id = $1
  `, [game_id], (err, genreData) => {
    if (err) {
      console.log('Error fetching game genres:', err);
      res.json([]);
      return;
    }
    
    if (genreData.rows.length === 0) {
      console.log('No genres found for game');
      res.json([]);
      return;
    }
    
    // Extract music genres
    const musicGenres = genreData.rows.map(row => row.music_genre);
    
    // Build genre matching condition - handle both array and text column types
    // Try using array overlap first, fallback to LIKE if needed
    const genrePatterns = musicGenres.map(g => `%${g}%`);
    
    // Build the query with proper parameterization
    let query = `
      SELECT DISTINCT
        s.track_id,
        s.name,
        s.artists,
        s.genres,
        s.duration_s AS duration,
        s.tempo,
        s.energy,
        s.valence,
        s.loudness_db AS loudness,
        s.danceability,
        s.instrumentalness,
        s.acousticness,
        s.popularity
      FROM "Spotify" s
      WHERE (
    `;
    
    // Add genre conditions
    const genreConditions = [];
    for (let i = 0; i < musicGenres.length; i++) {
      genreConditions.push(`s.genres LIKE $${i + 1}`);
    }
    query += genreConditions.join(' OR ') + ')';
    
    // Add energy and valence filters
    query += ` AND s.energy >= $${musicGenres.length + 1}`;
    query += ` AND s.energy <= $${musicGenres.length + 2}`;
    query += ` AND s.valence >= $${musicGenres.length + 3}`;
    query += ` AND s.valence <= $${musicGenres.length + 4}`;
    query += ` ORDER BY s.popularity DESC, s.energy DESC, s.valence DESC LIMIT 200`;
    
    const params = [...genrePatterns, minEnergy, maxEnergy, minValence, maxValence];
    
    connection.query(query, params, (err, trackData) => {
      if (err) {
        console.log('Error fetching recommended tracks:', err);
        res.json([]);
        return;
      }
      
      // Filter tracks to approximately match session duration
      let selectedTracks = [];
      let totalDuration = 0;
      
      for (const track of trackData.rows) {
        const trackDuration = track.duration || 0;
        if (totalDuration + trackDuration <= targetDurationSeconds * 1.2) {
          selectedTracks.push(track);
          totalDuration += trackDuration;
        }
        if (totalDuration >= targetDurationSeconds * 0.8) {
          break; // We have enough tracks
        }
      }
      
      res.json(selectedTracks);
    });
  });
};

module.exports = {
  getGame,
  getAllGames,
  getGameRecommendedTracks
};
