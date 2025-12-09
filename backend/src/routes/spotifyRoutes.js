const { Pool, types } = require('pg');
const config = require('../../config.json');

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

// Route 1: GET /music/track/:track_id
// Description: Given a track_id, return all info about the track on spotify
const track = async function(req, res) {
  const track_id = req.params.track_id;

  connection.query(`
    SELECT 
      track_id,
      name,
      artists,
      genres,
      duration_s AS duration,
      tempo,
      energy,
      valence,
      loudness_db AS loudness,
      danceability,
      instrumentalness,
      acousticness,
      popularity
    FROM "Spotify"
    WHERE track_id = $1
  `, [track_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Track not found');
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
};

// Route 2.1: GET /music/playlists/:playlist_id
// Description: Given a playlist_id, return all info about the playlist
const playlist = async function(req, res) {
  const playlist_id = req.params.playlist_id;

  connection.query(`
    SELECT 
      playlist_id,
      playlist_name,
      total_duration_minutes,
      total_tracks
    FROM "Playlist"
    WHERE playlist_id = $1
  `, [playlist_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Playlist not found');
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
};

// Route 2.2: POST /music/playlists
// Description: Create a new playlist with user defined name and an optional list of track_ids
const createPlaylist = async function(req, res) {
  const { playlist_name, track_id } = req.body;
  
  if (!playlist_name) {
    console.log('playlist_name is required');
    res.json({});
    return;
  }

  // Convert track_id to array if it's provided
  const track_ids = track_id || [];

  // Use transaction to ensure atomicity (read committed)
  const client = await connection.connect();
  
  try {
    await client.query('BEGIN');

    // Use the CTE approach from Query 0
    const result = await client.query(`
      WITH
      -- 1. Validate tracks exist
      valid_tracks AS (
        SELECT track_id, duration_s
        FROM "Spotify"
        WHERE track_id = ANY($1::text[])
      ),
      -- 2. Check if any track is missing
      missing AS (
        SELECT t.track_id
        FROM unnest($1::text[]) AS t(track_id)
        LEFT JOIN valid_tracks v USING(track_id)
        WHERE v.track_id IS NULL
      ),
      -- 3. Insert playlist only if no tracks are missing
      insert_playlist AS (
        INSERT INTO "Playlist" (playlist_name, total_duration_minutes, total_tracks)
          SELECT
            $2,
            COALESCE(SUM(v.duration_s) / 60.0, 0) AS total_duration_minutes,
            COUNT(v.track_id) AS total_tracks
          FROM valid_tracks v
          WHERE NOT EXISTS (SELECT 1 FROM missing)
          RETURNING playlist_id, playlist_name, total_duration_minutes, total_tracks
      ),
      -- 4. Insert track associations into Contains
      insert_contains AS (
        INSERT INTO "Contains" (playlist_id, track_id)
          SELECT
            p.playlist_id,
            v.track_id
          FROM insert_playlist p
          CROSS JOIN valid_tracks v
          RETURNING playlist_id, track_id
      )
      -- 5. Final output
      SELECT
        p.playlist_id,
        p.playlist_name,
        p.total_duration_minutes,
        p.total_tracks
      FROM insert_playlist p
    `, [track_ids, playlist_name]);

    if (result.rows.length === 0) {
      throw new Error('Failed to create playlist - possibly invalid track_ids');
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.json({});
  } finally {
    client.release();
  }
};

// Route 2.3: DELETE /music/playlists/:playlist_id
// Description: Delete a playlist in the database given a playlist_id
const deletePlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;

  connection.query(`
    DELETE FROM "Playlist" 
    WHERE playlist_id = $1 
    RETURNING playlist_id
  `, [playlist_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Playlist not found');
      res.json({});
    } else {
      res.json({
        playlist_id: data.rows[0].playlist_id,
        message: 'Playlist deleted successfully'
      });
    }
  });
};

// Route 3.1: POST /music/playlists/:playlist_id/tracks
// Description: Given a playlist_id and track_id, insert the song into Contains
const insertTrackFromPlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  const { track_id } = req.body;

  if (!track_id) {
    console.log('track_id is required');
    res.json({});
    return;
  }

  connection.query(`
    INSERT INTO "Contains" (playlist_id, track_id)
    VALUES ($1, $2)
    RETURNING playlist_id, track_id
  `, [playlist_id, track_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Failed to insert track');
      res.json({});
    } else {
      // Update playlist totals
      connection.query(`
        UPDATE "Playlist" p
        SET 
          total_tracks = (SELECT COUNT(*) FROM "Contains" WHERE playlist_id = p.playlist_id),
          total_duration_minutes = (
            SELECT COALESCE(SUM(s.duration_s), 0) / 60.0
            FROM "Contains" c
            JOIN "Spotify" s ON c.track_id = s.track_id
            WHERE c.playlist_id = p.playlist_id
          )
        WHERE p.playlist_id = $1
      `, [playlist_id], (updateErr) => {
        if (updateErr) {
          console.log('Error updating playlist totals:', updateErr);
        }
      });

      res.json({
        playlist_id: data.rows[0].playlist_id,
        track_id: data.rows[0].track_id,
        message: 'Track added to playlist successfully'
      });
    }
  });
};

// Route 3.2: DELETE /music/playlists/:playlist_id/tracks
// Description: Given a playlist_id and track_id, delete the song from playlist
const deleteTrackFromPlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  // Accept track_id from query parameter (more RESTful for DELETE) or body
  const track_id = req.query.track_id || req.body.track_id;

  if (!track_id) {
    console.log('track_id is required');
    res.json({});
    return;
  }

  connection.query(`
    DELETE FROM "Contains"
    WHERE playlist_id = $1 AND track_id = $2
    RETURNING playlist_id, track_id
  `, [playlist_id, track_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Track not found in playlist');
      res.json({});
    } else {
      // Update playlist totals
      connection.query(`
        UPDATE "Playlist" p
        SET 
          total_tracks = (SELECT COUNT(*) FROM "Contains" WHERE playlist_id = p.playlist_id),
          total_duration_minutes = (
            SELECT COALESCE(SUM(s.duration_s), 0) / 60.0
            FROM "Contains" c
            JOIN "Spotify" s ON c.track_id = s.track_id
            WHERE c.playlist_id = p.playlist_id
          )
        WHERE p.playlist_id = $1
      `, [playlist_id], (updateErr) => {
        if (updateErr) {
          console.log('Error updating playlist totals:', updateErr);
        }
      });

      res.json({
        playlist_id: data.rows[0].playlist_id,
        track_id: data.rows[0].track_id,
        message: 'Track removed from playlist successfully'
      });
    }
  });
};

// Route 8: POST /music/playlists/:playlist_id/save
// Description: Save an already created playlist for a specified user
const savePlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  const { user_id } = req.body;

  if (!user_id) {
    console.log('user_id is required');
    res.json({});
    return;
  }

  // First check if playlist exists
  connection.query(`
    SELECT playlist_id FROM "Playlist" WHERE playlist_id = $1
  `, [playlist_id], (err, playlistData) => {
    if (err) {
      console.log(err);
      res.json({});
      return;
    }
    
    if (playlistData.rows.length === 0) {
      console.log('Playlist does not exist');
      res.json({});
      return;
    }

    // Check if user exists
    connection.query(`
      SELECT user_id FROM "User" WHERE user_id = $1
    `, [user_id], (err, userData) => {
      if (err) {
        console.log(err);
        res.json({});
        return;
      }
      
      if (userData.rows.length === 0) {
        console.log('User does not exist');
        res.json({});
        return;
      }

      // Check if already saved
      connection.query(`
        SELECT * FROM "Saved" WHERE user_id = $1 AND playlist_id = $2
      `, [user_id, playlist_id], (err, savedData) => {
        if (err) {
          console.log(err);
          res.json({});
          return;
        }
        
        if (savedData.rows.length > 0) {
          console.log('Playlist already saved by user');
          res.json({});
          return;
        }

        // Insert into Saved
        connection.query(`
          INSERT INTO "Saved" (user_id, playlist_id)
          VALUES ($1, $2)
          RETURNING user_id, playlist_id
        `, [user_id, playlist_id], (err, data) => {
          if (err) {
            console.log(err);
            res.json({});
          } else {
            res.json({
              user_id: data.rows[0].user_id,
              playlist_id: data.rows[0].playlist_id,
              message: 'Playlist saved successfully'
            });
          }
        });
      });
    });
  });
};

// Route 9: DELETE /music/playlists/:playlist_id/save
// Description: Delete a previously saved playlist for the specified user
const deleteSavedPlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  const { user_id } = req.body;

  if (!user_id) {
    console.log('user_id is required');
    res.json({});
    return;
  }

  connection.query(`
    DELETE FROM "Saved"
    WHERE user_id = $1 AND playlist_id = $2
    RETURNING user_id, playlist_id
  `, [user_id, playlist_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('Saved playlist not found');
      res.json({});
    } else {
      res.json({
        user_id: data.rows[0].user_id,
        playlist_id: data.rows[0].playlist_id,
        message: 'Saved playlist deleted successfully'
      });
    }
  });
};

// Route 11: GET /users/:user_id/playlists
// Description: Given an user_id, return all playlists they saved before
const getUserPlaylists = async function(req, res) {
  const user_id = req.params.user_id;

  connection.query(`
    SELECT 
      p.playlist_id,
      p.playlist_name
    FROM "Saved" s
    JOIN "Playlist" p ON s.playlist_id = p.playlist_id
    WHERE s.user_id = $1
  `, [user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
};

module.exports = {
  track,
  playlist,
  createPlaylist,
  deletePlaylist,
  insertTrackFromPlaylist,
  deleteTrackFromPlaylist,
  savePlaylist,
  deleteSavedPlaylist,
  getUserPlaylists
};
