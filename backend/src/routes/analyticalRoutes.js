const { Pool, types } = require('pg');
const path = require('path');
const config = require(path.join(__dirname, '../../config.json'));

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, (val) => parseInt(val, 10)); // DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
const pool = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Analytical Query Route 1:
 * Retrieve a playlist of recommended tracks for a given game, such that:
 *  - Tracks come from the Recommendations table for that game_id
 *  - Tracks are filtered by energy and valence ranges
 *  - Tracks are ranked by a “fit_score” combining match_score, energy, and valence
 *  - Tracks are accumulated in descending fit_score order until the desired
 *    session_duration_s is reached
 *
 * Query parameters:
 *  - game_name (required): Steam game name
 *  - session_duration_s (optional, default 1800): target session length in seconds
 *  - min_energy (optional, default 0): accepts 0-100 (converted to 0-1) or 0-1 directly
 *  - max_energy (optional, default 1): accepts 0-100 (converted to 0-1) or 0-1 directly
 *  - min_valence (optional, default 0): accepts 0-100 (converted to 0-1) or 0-1 directly
 *  - max_valence (optional, default 1): accepts 0-100 (converted to 0-1) or 0-1 directly
 */
const search_songs = async function (req, res) {

  const gameName = req.query.game_name;
  if (!gameName) {
    return res.status(400).json({ error: 'Missing required parameter: game_name' });
  }

  const sessionDuration = Number(req.query.session_duration_s ?? 1800); // 30 min default
  const sessionMinutes = sessionDuration / 60.0;

  // Frontend sends 0-100, but database stores 0-1, so convert if values are > 1
  // Defaults: 0-1 scale (0.25-0.75 = 25-75 on 0-100 scale)
  const rawMinEnergy = Number(req.query.min_energy ?? 0);
  const rawMaxEnergy = Number(req.query.max_energy ?? 1);
  const rawMinValence = Number(req.query.min_valence ?? 0);
  const rawMaxValence = Number(req.query.max_valence ?? 1);
  
  // Convert from 0-100 scale to 0-1 scale if needed
  const minEnergy = rawMinEnergy > 1 ? rawMinEnergy / 100 : rawMinEnergy;
  const maxEnergy = rawMaxEnergy > 1 ? rawMaxEnergy / 100 : rawMaxEnergy;
  const minValence = rawMinValence > 1 ? rawMinValence / 100 : rawMinValence;
  const maxValence = rawMaxValence > 1 ? rawMaxValence / 100 : rawMaxValence;

  const query = `
    WITH candidate_tracks AS (
       SELECT
           r.game_id,
           sg.name AS game_name,
           sp.track_id,
           sp.name AS track_name,
           sp.duration_s AS track_duration_s,
           sp.tempo,
           sp.energy,
           sp.valence,
           r.match_score,
           (0.5 * r.match_score + 0.25 * sp.energy + 0.25 * sp.valence) AS fit_score
       FROM "Recommendations" AS r
       JOIN "Steam"   sg ON r.game_id = sg.game_id
       JOIN "Spotify" sp ON r.track_id = sp.track_id
       WHERE sg.name = $1
         AND sp.energy  BETWEEN $2 AND $3
         AND sp.valence BETWEEN $4 AND $5
    ),
    ranked AS (
       SELECT
           *,
           SUM(track_duration_s) OVER (
               ORDER BY fit_score DESC
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           ) AS cum_duration_s
       FROM candidate_tracks
    ),
    ranked_with_cutoff AS (
       SELECT
           *,
           COALESCE(
             MIN(cum_duration_s) FILTER (
               WHERE cum_duration_s >= ($6 * 60)
             ) OVER (),
             MAX(cum_duration_s) OVER ()
           ) AS cutoff_s
       FROM ranked
    )
    SELECT
       track_id,
       track_name,
       track_duration_s,
       tempo,
       energy,
       valence,
       ROUND(fit_score) AS fit_score,
       match_score
    FROM ranked_with_cutoff
    WHERE cum_duration_s <= cutoff_s
    ORDER BY fit_score DESC;
  `;

  const params = [
    gameName, // $1: game_name
    minEnergy, // $2: min_energy
    maxEnergy, // $3: max_energy
    minValence, // $4: min_valence
    maxValence, // $5: max_valence
    sessionMinutes // $6: session duration in minutes
  ];

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error running search_songs query:', err);
    res.status(500).json([]);
  }
};


/**
 * Analytical Query Route 2:
 * Aggregate Spotify audio features by game genre using only recommended tracks.
 *
 * Returns, for each game genre:
 *  - Number of distinct recommended tracks
 *  - Average tempo, energy, valence, danceability, acousticness, popularity
 *
 * Filters:
 *  - Only genres with at least 50 distinct tracks
 *
 * No query parameters required.
 */
const get_genre_audio_profile = async function (req, res) {

  const query = `
    SELECT
       gg.genre AS game_genre,
       COUNT(DISTINCT r.track_id)          AS num_tracks,
       ROUND(AVG(sp.tempo))               AS avg_tempo,
       ROUND(AVG(sp.energy))              AS avg_energy,
       ROUND(AVG(sp.valence))             AS avg_valence,
       ROUND(AVG(sp.danceability))        AS avg_danceability,
       ROUND(AVG(sp.acousticness))        AS avg_acousticness,
       ROUND(AVG(sp.popularity))          AS avg_popularity
    FROM "GameGen" gg
        JOIN "Steam"            s  ON s.game_id  = gg.game_id
        JOIN "Recommendations" r  ON r.game_id  = gg.game_id
        JOIN "Spotify"         sp ON sp.track_id = r.track_id
    GROUP BY gg.genre
    HAVING COUNT(DISTINCT r.track_id) >= 50
    ORDER BY avg_popularity DESC;
  `;

  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error running get_genre_audio_profile query:', err);
    res.status(500).json([]);
  }
};


/**
 * Analytical Query Route 3:
 * For each Steam game genre, find the top 3 matching Spotify genres
 * based on how many recommended tracks fall into that mapping.
 *
 * No query parameters.
 *
 * Returns:
 *  - game_genre      (Steam genre)
 *  - spotify_genre   (mapped Spotify genre)
 *  - num_tracks      (# of distinct tracks in that pair)
 */
const get_top_genre_pairs = async function (req, res) {
  const query = `
    WITH steam_to_spotify_genres AS (
      -- Map each Steam genre to its possible Spotify genres via GenMap
      SELECT DISTINCT
          gg.genre        AS game_genre,    -- Steam genre
          gm.track_genre  AS spotify_genre  -- mapped Spotify genre
      FROM "GameGen" gg
      JOIN "GenMap" gm
        ON LOWER(gg.genre) = LOWER(gm.game_genre)
    ),
    genre_pair_tracks AS (
      SELECT
        ssg.game_genre,
        ssg.spotify_genre,
        r.track_id
      FROM steam_to_spotify_genres ssg
      JOIN "GameGen" gg2
        ON gg2.genre = ssg.game_genre
      JOIN "Recommendations" r
        ON r.game_id = gg2.game_id
      JOIN "MusicGen" mg
        ON mg.track_id = r.track_id
       AND LOWER(mg.genre) = LOWER(ssg.spotify_genre)
    ),
    agg_pairs AS (
      SELECT
        game_genre,
        spotify_genre,
        COUNT(DISTINCT track_id) AS num_tracks
      FROM genre_pair_tracks
      GROUP BY game_genre, spotify_genre
    ),
    ranked_pairs AS (
      -- Rank Spotify genres within each Steam genre by number of tracks
      SELECT
        game_genre,
        spotify_genre,
        num_tracks,
        ROW_NUMBER() OVER (
          PARTITION BY game_genre
          ORDER BY num_tracks DESC
        ) AS genre_rank
      FROM agg_pairs
    )
    SELECT
      game_genre,      -- Steam genre
      spotify_genre,   -- top Spotify genre(s) for that Steam genre
      num_tracks
    FROM ranked_pairs
    WHERE genre_rank <= 3
    ORDER BY game_genre, num_tracks DESC;
  `;

  try {
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error running get_top_genre_pairs query:', err);
    res.status(500).json([]);
  }
};

/**
 * Analytical Query Route 4:
 * Recommend tracks for a given user based on "similar users" who share
 * at least 2 playlists with them.
 *
 * Logic:
 *  - Find all playlists saved by the current user
 *  - Find other users who share at least 2 of those playlists
 *  - Collect tracks from those users' saved playlists
 *  - Exclude tracks the current user has already saved
 *  - Rank by (# similar users who saved the track, then Spotify popularity)
 *  - Return top 30 tracks
 *
 * Query parameters:
 *  - user_id (required): current user id
 */
const get_social_recommendations = async function (req, res) {
  const userId = Number(req.query.user_id);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Missing or invalid required parameter: user_id' });
  }

  const query = `
    WITH current_playlists AS (
      SELECT playlist_id
      FROM "Saved"
      WHERE user_id = $1
    ),
    -- find the users who share at least two playlists with me
    similar_users AS (
      SELECT
        s2.user_id AS similar_user_id,
        COUNT(DISTINCT s2.playlist_id) AS shared_playlists
      FROM "Saved" s2
      JOIN current_playlists cp
        ON s2.playlist_id = cp.playlist_id
      WHERE s2.user_id <> $1
      GROUP BY s2.user_id
      HAVING COUNT(DISTINCT s2.playlist_id) >= 2
    ),
    -- select the soundtracks saved by my similar users
    candidate_tracks AS (
      SELECT
        c.track_id,
        COUNT(DISTINCT su.similar_user_id) AS num_similar_users
      FROM "Saved" s
      JOIN similar_users su
        ON s.user_id = su.similar_user_id
      JOIN "Contains" c
        ON c.playlist_id = s.playlist_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM "Saved" s_me
        JOIN "Contains" c_me
          ON c_me.playlist_id = s_me.playlist_id
        WHERE s_me.user_id = $1
          AND c_me.track_id = c.track_id
      )
      GROUP BY c.track_id
    ),
    ranked AS (
      SELECT
        ct.track_id,
        ct.num_similar_users,
        sp.name,
        sp.artists,
        sp.energy,
        sp.valence,
        sp.popularity,
        ROW_NUMBER() OVER (
          ORDER BY ct.num_similar_users DESC, sp.popularity DESC
        ) AS rec_rank
      FROM candidate_tracks ct
      JOIN "Spotify" sp
        ON ct.track_id = sp.track_id
    )
    SELECT
      track_id,
      name,
      artists,
      energy,
      valence,
      popularity,
      num_similar_users
    FROM ranked
    WHERE rec_rank <= 30;
  `;

  try {
    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error running get_social_recommendations query:', err);
    res.status(500).json([]);
  }
};


module.exports = {
  search_songs,
  get_genre_audio_profile,
  get_top_genre_pairs,
  get_social_recommendations,
};