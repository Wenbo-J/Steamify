const { Pool, types } = require('pg');
const config = require('../config.json');

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, (val) => parseInt(val, 10)); // DO NOT DELETE THIS

const pool = new Pool(config);

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
 *  - game_id (required): Steam game_id
 *  - session_duration_s (optional, default 1800): target session length in seconds
 *  - min_energy (optional, default 25)
 *  - max_energy (optional, default 35)
 *  - min_valence (optional, default 25)
 *  - max_valence (optional, default 35)
 */
const search_songs = async function (req, res) {

  const gameName = req.query.game_name;
  if (!gameName) {
    return res.status(400).json({ error: 'Missing required parameter: game_name' });
  }

  const sessionDuration = Number(req.query.session_duration_s ?? 1800); // 30 min default
  const sessionMinutes = sessionDuration / 60.0;

  const minEnergy = Number(req.query.min_energy ?? 25);
  const maxEnergy = Number(req.query.max_energy ?? 75);
  const minValence = Number(req.query.min_valence ?? 25);
  const maxValence = Number(req.query.max_valence ?? 75);

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
           MIN(cum_duration_s) FILTER (
               WHERE cum_duration_s >= ($6 * 60)
           ) OVER () AS cutoff_s
       FROM ranked
    )
    SELECT
       track_name,
       tempo,
       energy,
       valence,
       ROUND(fit_score) AS fit_score
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

module.exports = { search_songs };
