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


// Route 4: GET /games/:game_id
const album = async function(req, res) {

    const game_id = req.params.game_id;
    
    connection.query(`
        SELECT *
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
        }
    );
}

// Route 5: GET /games
const albums = async function(_, res) {
  connection.query(`
    SELECT *
    FROM "Steam"
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