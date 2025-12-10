// Acknowledgement: using hw4a webdb as a starting point to build our own Spotify Route

const { Pool, types } = require('pg');
const config = require('./config.json')

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

// Route 13: GET /users/:user_id/games
const getUserGames = async function(req, res) {

  connection.query(`
    SELECT g.game_id, g.name
    FROM "Owned" o
    JOIN "Steam" g ON o.game_id = g.game_id
    WHERE o.user_id = $1;
  `, [req.params.user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      res.status(404).json({message: 'Games not found'});
    } else {
      res.json(data.rows);
    }
  }
  )
}

// Route 14: GET /users/:user_id/playlists
const getUserPlaylists = async function(req, res) {

  connection.query(`
    SELECT p.playlist_id, p.playlist_name
    FROM "Saved" s
    JOIN "Playlist" p ON s.playlist_id = p.playlist_id
    WHERE s.user_id = $1;
  `, [req.params.user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else if (data.rows.length === 0) {
      res.status(404).json({message: 'Playlists not found'});
    } else {
      res.json(data.rows);
    }
  }
  )
}

// Route 3: GET /song/:song_id
const song = async function(req, res) {
  // TODO (TASK 4): implement a route that given a song_id, returns all information about the song
  // Hint: unlike route 2, you can directly SELECT * and just return data.rows[0]
  // Most of the code is already written for you, you just need to fill in the query
  connection.query(`
    SELECT *
    FROM songs
    WHERE song_id = '${req.params.song_id}'
    `, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows[0]);
    }
  });
}

// Route 4: GET /album/:album_id
const album = async function(req, res) {
  // TODO (TASK 5): implement a route that given a album_id, returns all information about the album
  connection.query(`
    SELECT *
    FROM albums
    WHERE album_id = '${req.params.album_id}'
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json({});
      } else {
        res.json(data.rows[0]);
      }
    }
  );
}

// Route 5: GET /albums
const albums = async function(req, res) {
  // TODO (TASK 6): implement a route that returns all albums ordered by release date (descending)
  // Note that in this case you will need to return multiple albums, so you will need to return an array of objects
  connection.query(`
    SELECT *
    FROM albums
    ORDER BY release_date DESC
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
}

// Route 6: GET /album_songs/:album_id
const album_songs = async function(req, res) {
  // TODO (TASK 7): implement a route that given an album_id, returns all songs on that album ordered by track number (ascending)
  connection.query(
    `
    SELECT song_id, title, number, duration, plays
    FROM songs
    WHERE album_id = '${req.params.album_id}'
    ORDER BY number
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
}

// Route 7: GET /top_songs
const top_songs = async function(req, res) {
  const page = req.query.page;
  // TODO (TASK 8): use the ternary (or nullish) operator to set the pageSize based on the query or default to 10
  const pageSize = req.query.page_size ?? 10;

  if (!page) {
    // TODO (TASK 9)): query the database and return all songs ordered by number of plays (descending)
    // Hint: you will need to use a JOIN to get the album title as well
    connection.query(
      `
      SELECT s.song_id AS song_id, s.title AS title, a.album_id AS album_id, a.title AS album, s.plays AS plays
      FROM songs s JOIN albums a ON s.album_id = a.album_id
      ORDER BY plays DESC
      `, (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  } else {
    // TODO (TASK 10): reimplement TASK 9 with pagination
    // Hint: use LIMIT and OFFSET (see https://www.w3schools.com/php/php_mysql_select_limit.asp)
    connection.query(
      `
      SELECT s.song_id AS song_id, s.title AS title, a.album_id AS album_id, a.title AS album, s.plays AS plays
      FROM songs s JOIN albums a ON s.album_id = a.album_id
      ORDER BY plays DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `, (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  }
}

// Route 8: GET /top_albums
const top_albums = async function(req, res) {
  // TODO (TASK 11): return the top albums ordered by aggregate number of plays of all songs on the album (descending), with optional pagination (as in route 7)
  // Hint: you will need to use a JOIN and aggregation to get the total plays of songs in an album
  const page = req.query.page;
  const pageSize = req.query.page_size ?? 10;
  
  if (!page) {
    connection.query(
      `
      SELECT a.album_id AS album_id, a.title AS title, SUM(s.plays) AS plays
      FROM albums a JOIN songs s ON a.album_id = s.album_id
      GROUP BY a.album_id, a.title
      ORDER BY plays DESC
      `, (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  } else {
    connection.query(
      `
      SELECT a.album_id AS album_id, a.title AS title, SUM(s.plays) AS plays
      FROM albums a JOIN songs s ON a.album_id = s.album_id
      GROUP BY a.album_id, a.title
      ORDER BY plays DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `, (err, data) => {
        if (err) {
          console.log(err);
          res.json([]);
        } else {
          res.json(data.rows);
        }
      }
    );
  }
}

// Route 9: GET /search_songs
const search_songs = async function(req, res) {
  // TODO (TASK 12): return all songs that match the given search query with parameters defaulted to those specified in API spec ordered by title (ascending)
  // Some default parameters have been provided for you, but you will need to fill in the rest
  const title = req.query.title ?? '';
  const durationLow = req.query.duration_low ?? 60;
  const durationHigh = req.query.duration_high ?? 660;
  const playsLow = req.query.plays_low ?? 0;
  const playsHigh = req.query.plays_high ?? 1100000000;
  const danceabilityLow = req.query.danceability_low ?? 0;
  const danceabilityHigh = req.query.danceability_high ?? 1;
  const energyLow = req.query.energy_low ?? 0;
  const energyHigh = req.query.energy_high ?? 1;
  const valenceLow = req.query.valence_low ?? 0;
  const valenceHigh = req.query.valence_high ?? 1;
  const explicit = req.query.explicit === 'true' ? 1 : 0;

  connection.query(
    `
    SELECT *
    FROM songs
    WHERE title LIKE '%${title}%'
      AND duration BETWEEN ${durationLow} AND ${durationHigh}
      AND plays BETWEEN ${playsLow} AND ${playsHigh}
      AND danceability BETWEEN ${danceabilityLow} AND ${danceabilityHigh}
      AND energy BETWEEN ${energyLow} AND ${energyHigh}
      AND valence BETWEEN ${valenceLow} AND ${valenceHigh}
      AND explicit <= ${explicit}
    ORDER BY title ASC
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
}

/**
 * Route 10: GET /playlist/entrance_songs - Wedding entrance playlist
 *
 * Let's celebrate the wedding of Travis and Taylor!
 *
 * Travis Kelce is cooking up some slow danceable songs with Taylors before the
 * highly anticipated Wedding entrance. Travis decides that a slow danceable
 * song is one with: maximum energy of 0.5 and a minimum danceability of at least 0.73
 * Let's design a wedding entrance playlist for Travis to pass to the DJ
 */
const entrance_songs = async function(req, res) {
  // TODO (TASK 13): return a selection of songs that meet the criteria above
  // You should allow the user to specify how many songs they want (limit) with a default of 10
  const limit = req.query.limit || 10;
  const maxEnergy = req.query.max_energy || 0.5;
  const minDanceability = req.query.min_danceability || 0.73;

  connection.query(
    `
    SELECT s.song_id AS song_id, s.title AS title, a.title AS album,
       s.danceability AS danceability, s.energy AS energy, s.valence AS valence
    FROM songs s JOIN albums a ON s.album_id = a.album_id
    WHERE energy <= ${maxEnergy} AND danceability >= ${minDanceability}
    ORDER BY valence DESC, danceability DESC
    LIMIT ${limit}
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data.rows);
      }
    }
  );
}

module.exports = {
  author,
  random,
  song,
  album,
  albums,
  album_songs,
  top_songs,
  top_albums,
  search_songs,
  entrance_songs
}
