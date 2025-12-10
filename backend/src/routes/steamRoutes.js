const { Pool, types } = require('pg');
const path = require('path');
const config = require(path.join(__dirname, '../../config.json'));

// Log config loading (without sensitive data)
console.log('SteamRoutes: Config loaded, database:', config.rds_db || 'not set');

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
  
  // Column is 'name', not 'game_name'
  connection.query(`
    SELECT * FROM "Steam"
    WHERE game_id = $1
  `, [game_id], (err, data) => {
    if (err) {
      console.error('getGame: Database error:', err);
      res.status(500).json({ error: 'Database error', message: err.message });
    } else if (data.rows.length === 0) {
      res.status(404).json({message: 'Game not found'});
    } else {
      // The column is already 'name', so no need to alias
      res.json(data.rows[0]);
    }
  });
};

// Route 5: GET /games
// Get games with pagination and optional search
// Query params: limit (default 50), offset (default 0), search (optional search term)
const getAllGames = async function(req, res) {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  
  console.log(`getAllGames: limit=${limit}, offset=${offset}, search="${search}"`);
  
  // Build query with optional search
  // Use a subquery approach to handle unknown column names
  let query;
  const params = [];
  
  if (search) {
    // Search in name, genres, genre_list, and game_id (actual column names from schema)
    query = `
      SELECT * FROM "Steam"
      WHERE (
        CAST(game_id AS TEXT) ILIKE $1 OR
        name ILIKE $1 OR
        genres ILIKE $1 OR
        genre_list ILIKE $1 OR
        main_genre ILIKE $1
      )
      ORDER BY game_id
      LIMIT $2 OFFSET $3
    `;
    params.push(`%${search}%`, limit, offset);
  } else {
    query = `
      SELECT * FROM "Steam"
      ORDER BY game_id
      LIMIT $1 OFFSET $2
    `;
    params.push(limit, offset);
  }
  
  connection.query(query, params, (err, data) => {
    if (err) {
      console.error('getAllGames: Database error:', err);
      res.status(500).json({ error: 'Database error', message: err.message });
    } else {
      // Add 'name' alias - the column is actually 'name', so we can use it directly
      const games = data.rows.map(game => {
        // The column is 'name', so use it directly
        if (game.name && !game.name) {
          // Already has name, no need to alias
        }
        return game;
      });
      
      console.log(`getAllGames: Returning ${games.length} games (limit=${limit}, offset=${offset}${search ? `, search="${search}"` : ''})`);
      res.json(games);
    }
  });
};

// Route 6: GET /recommends/:game_id
// Get recommended tracks from Recommendations table (API spec Route 6)
const recommendedTracks = async function(req, res) {
  const game_id = req.params.game_id;
  
  console.log(`[Route 6] GET /recommends/${game_id} - Fetching from Recommendations table`);
  
  connection.query(`
    SELECT 
      game_id,
      track_id,
      match_score
    FROM "Recommendations"
    WHERE game_id = $1
    ORDER BY match_score DESC
  `, [game_id], (err, data) => {
    if (err) {
      console.error('[Route 6] Database error:', err);
      res.status(500).json({ error: 'Database error', message: err.message });
    } else {
      console.log(`[Route 6] Query successful: Found ${data.rows.length} recommendations for game_id: ${game_id}`);
      if (data.rows.length === 0) {
        console.log(`[Route 6] No recommendations found in Recommendations table for game_id: ${game_id}`);
      } else {
        console.log(`[Route 6] Sample recommendation:`, data.rows[0]);
      }
      res.json(data.rows);
    }
  });
};

// Route 12.1: GET /games/:game_id/recommended_tracks
// Get recommended tracks for a game based on session duration and audio features (with full track details)
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
  
  console.log(`getGameRecommendedTracks: game_id=${game_id}, session=${sessionMinutes}min, energy=${minEnergy}-${maxEnergy}, valence=${minValence}-${maxValence}`);
  
  // First, get the game's genres and map them to music genres
  // Schema: GameGen(game_id, genre), GenMap(game_genre, track_genre), MusicGen(track_id, genre)
  connection.query(`
    SELECT DISTINCT mg.genre AS music_genre
    FROM "GameGen" gg
    JOIN "GenMap" gm ON gg.genre = gm.game_genre
    JOIN "MusicGen" mg ON gm.track_genre = mg.genre
    WHERE gg.game_id = $1
  `, [game_id], (err, genreData) => {
    if (err) {
      console.error('Error fetching game genres:', err);
      res.status(500).json({ error: 'Database error', message: err.message });
      return;
    }
    
    if (genreData.rows.length === 0) {
      console.log(`No genres found for game_id: ${game_id}`);
      res.json([]);
      return;
    }
    
    console.log(`Found ${genreData.rows.length} music genres for game:`, genreData.rows.map(r => r.music_genre));
    
    // Extract music genres
    const musicGenres = genreData.rows.map(row => row.music_genre);
    
    // Use MusicGen table for accurate genre matching (better than text search)
    const genrePlaceholders = musicGenres.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
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
      INNER JOIN "MusicGen" mg ON s.track_id = mg.track_id
      WHERE mg.genre IN (${genrePlaceholders})
        AND s.energy >= $${musicGenres.length + 1}
        AND s.energy <= $${musicGenres.length + 2}
        AND s.valence >= $${musicGenres.length + 3}
        AND s.valence <= $${musicGenres.length + 4}
      ORDER BY s.popularity DESC, s.energy DESC, s.valence DESC
      LIMIT 200
    `;
    
    const params = [...musicGenres, minEnergy, maxEnergy, minValence, maxValence];
    
    console.log(`Querying tracks with ${musicGenres.length} genre patterns`);
    connection.query(query, params, (err, trackData) => {
      if (err) {
        console.error('Error fetching recommended tracks:', err);
        res.status(500).json({ error: 'Database error', message: err.message });
        return;
      }
      
      console.log(`Found ${trackData.rows.length} matching tracks`);
      
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
      
      console.log(`Returning ${selectedTracks.length} tracks (${Math.round(totalDuration/60)} minutes)`);
      res.json(selectedTracks);
    });
  });
};

module.exports = {
  getGame,
  getAllGames,
  recommendedTracks,
  getGameRecommendedTracks
};
