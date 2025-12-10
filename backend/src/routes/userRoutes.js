// Acknowledgement: using hw4a webdb as a starting point to build our own User Route

const { Pool, types } = require('pg');
const path = require('path');
const config = require(path.join(__dirname, '../../config.json'))

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
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

// Route 7.1: POST /users/
// Create or get user (Google OAuth - uses email as identifier)
// Optional: steam_id, steam_name, spotify_id, spotify_name for linking accounts
const createUser = async function(req, res) {
  const { email, name, google_id, steam_id, steam_name, spotify_id, spotify_name } = req.body;

  // First check if user exists (by email stored in steam_name or spotify_name, or we need to add email column)
  // For now, we'll use a simple approach: create user with Google info
  // If email is provided, we can use it to identify users
  
  // Check if user already exists - we'll use a combination approach
  // Since we don't have email column, we'll create new user each time for now
  // In production, you'd want to add email column or use a different identifier
  
  connection.query(`
    INSERT INTO "User" (steam_id, steam_name, spotify_id, spotify_name)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id
  `, [
    steam_id || null, 
    steam_name || (email ? `Google: ${email}` : name || 'User'), 
    spotify_id || null, 
    spotify_name || (email ? email : null)
  ], (err, data) => {
    if (err) {
      console.error('Error creating user:', err);
      // If user already exists or other error, try to get existing user
      // For now, return error - in production you'd want better user lookup
      res.status(500).json({ error: 'Failed to create user', message: err.message });
    } else if (data.rows.length === 0) {
      res.status(500).json({ error: 'User creation failed' });
    } else {
      res.json({
        user_id: data.rows[0].user_id,
        message: 'User created successfully'
      });
    }
  });
}

// Route 7.1.1: POST /auth/google
// Handle Google OAuth sign-in/sign-up
const googleAuth = async function(req, res) {
  const { email, name, picture, google_id } = req.body;
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  
  // Try to find existing user by email (stored in spotify_name or steam_name)
  // This is a workaround since we don't have email column
  connection.query(`
    SELECT user_id, steam_id, steam_name, spotify_id, spotify_name
    FROM "User"
    WHERE spotify_name = $1 OR steam_name LIKE $2
    LIMIT 1
  `, [email, `%${email}%`], (err, existingUser) => {
    if (err) {
      console.error('Error finding user:', err);
      res.status(500).json({ error: 'Database error', message: err.message });
      return;
    }
    
    if (existingUser.rows.length > 0) {
      // User exists, return user info
      const user = existingUser.rows[0];
      res.json({
        user_id: user.user_id,
        email: email,
        name: name,
        picture: picture,
        steam_id: user.steam_id,
        spotify_id: user.spotify_id,
        message: 'User signed in successfully'
      });
    } else {
      // Create new user
      connection.query(`
        INSERT INTO "User" (steam_id, steam_name, spotify_id, spotify_name)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      `, [null, `Google: ${name || email}`, null, email], (err, data) => {
        if (err) {
          console.error('Error creating user:', err);
          res.status(500).json({ error: 'Failed to create user', message: err.message });
        } else {
          res.json({
            user_id: data.rows[0].user_id,
            email: email,
            name: name,
            picture: picture,
            message: 'User created successfully'
          });
        }
      });
    }
  });
}

// Route 7.2: GET /users/:user_id
// Given an user id, return the user's accounts info
const userAccounts = async function(req, res) {
  const user_id = req.params.user_id;

  connection.query(`
    SELECT user_id, spotify_id, spotify_name, steam_id, steam_name
    FROM "User"
    WHERE user_id = $1
  `, [user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('User not found');
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 7.3: PATCH /users/:user_id
// Update an existing user's info with their newly provided steam id / name and spotify id / name
const updateUser = async function(req, res) {
  const user_id = req.params.user_id;
  const { steam_id, steam_name, spotify_id, spotify_name } = req.body;

  connection.query(`
    UPDATE "User"
    SET steam_id = $1, steam_name = $2, spotify_id = $3, spotify_name = $4
    WHERE user_id = $5
    RETURNING user_id, steam_id, steam_name, spotify_id, spotify_name
  `, [steam_id, steam_name, spotify_id, spotify_name, user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      console.log('User not found');
      res.json({});
    } else if (data.rows.length === 0) {
      res.status(404).json({message: 'Playlists not found'});
    } else {
      res.json({
        ...data.rows[0],
        message: 'User updated successfully'
      });
    }
  }
  )
}

// Route 8: POST /music/playlists/:playlist_id/save
// Save an already created playlist for a specified user
const savePlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  const { user_id } = req.body;

  // First check if playlist exists
  connection.query(`
    SELECT playlist_id FROM "Playlist" WHERE playlist_id = $1
  `, [playlist_id], (err, playlistData) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (playlistData.rows.length === 0) {
      console.log('Playlist does not exist');
      res.json({});
    } else {
      // Check if user exists
      connection.query(`
        SELECT user_id FROM "User" WHERE user_id = $1
      `, [user_id], (err, userData) => {
        if (err) {
          console.log(err);
          res.json({});
        } else if (userData.rows.length === 0) {
          console.log('User does not exist');
          res.json({});
        } else {
          // Check if playlist is already saved by the user
          connection.query(`
            SELECT user_id, playlist_id FROM "Saved" 
            WHERE user_id = $1 AND playlist_id = $2
          `, [user_id, playlist_id], (err, savedData) => {
            if (err) {
              console.log(err);
              res.json({});
            } else if (savedData.rows.length > 0) {
              console.log('Playlist already saved by the user');
              res.json({});
            } else {
              // Insert into Saved table
              connection.query(`
                INSERT INTO "Saved" (user_id, playlist_id)
                VALUES ($1, $2)
                RETURNING user_id, playlist_id
              `, [user_id, playlist_id], (err, insertData) => {
                if (err) {
                  console.log(err);
                  res.json({});
                } else {
                  res.json({
                    user_id: insertData.rows[0].user_id,
                    playlist_id: insertData.rows[0].playlist_id,
                    message: 'Playlist saved successfully'
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

// Route 9: DELETE /music/playlists/:playlist_id/save
// Delete a previously saved playlist for the specified user
const deleteSavedPlaylist = async function(req, res) {
  const playlist_id = req.params.playlist_id;
  const { user_id } = req.body;

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
}

// Route 10: GET /users/:user_id/games
// Given an user_id, return all games they own on their Steam account
const getUserGames = async function(req, res) {
  const user_id = req.params.user_id;

  // First verify user exists
  connection.query(`
    SELECT user_id FROM "User" WHERE user_id = $1
  `, [user_id], (err, userData) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (userData.rows.length === 0) {
      console.log('User not found');
      res.json({});
    } else {
      // Get all games owned by the user
      // Assuming there's an Owns table that links users to games
      connection.query(`
        SELECT g.game_id AS game_id, g.game_name AS game_name
        FROM "Game" g
        JOIN "Owns" o ON g.game_id = o.game_id
        WHERE o.user_id = $1
      `, [user_id], (err, data) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json(data.rows);
        }
      });
    }
  });
}

// Route 11: GET /users/:user_id/playlists
// Given an user_id, return all playlists they saved before
const getUserPlaylists = async function(req, res) {
  const user_id = req.params.user_id;

  // First verify user exists
  connection.query(`
    SELECT user_id FROM "User" WHERE user_id = $1
  `, [user_id], (err, userData) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (userData.rows.length === 0) {
      console.log('User not found');
      res.json({});
    } else {
      // Get all playlists saved by the user
      connection.query(`
        SELECT p.playlist_id AS playlist_id, p.playlist_name AS playlist_name
        FROM "Playlist" p
        JOIN "Saved" s ON p.playlist_id = s.playlist_id
        WHERE s.user_id = $1
      `, [user_id], (err, data) => {
        if (err) {
          console.log(err);
          res.json({});
        } else {
          res.json(data.rows);
        }
      });
    }
  });
}

module.exports = {
  createUser,
  googleAuth,
  userAccounts,
  updateUser,
  savePlaylist,
  deleteSavedPlaylist,
  getUserGames,
  getUserPlaylists
}
