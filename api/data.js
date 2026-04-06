// api/data.js — GET /api/data, POST /api/data
// Fetches and saves all user app state (workout progress, study progress, overrides)
'use strict';

const { getPool, initSchema } = require('./_db');
const { authenticate, unauthorized } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = authenticate(req);
  if (!payload) return unauthorized(res);

  try {
    await initSchema();
    const pool = getPool();
    const userId = payload.userId;

    // ── GET: fetch all user data ────────────────────────────────────────────
    if (req.method === 'GET') {
      const [dataRes, sheetsRes] = await Promise.all([
        pool.query('SELECT * FROM user_data WHERE user_id = $1', [userId]),
        pool.query('SELECT sheet_id, sheet_data FROM custom_sheets WHERE user_id = $1', [userId]),
      ]);

      const row = dataRes.rows[0] || {};
      const sheets = {};
      sheetsRes.rows.forEach(r => { sheets[r.sheet_id] = r.sheet_data; });

      return res.status(200).json({
        workoutProgress:  row.workout_progress  || {},
        studyProgress:    row.study_progress    || {},
        studyTimeLog:     row.study_time_log    || {},
        dayOverrides:     row.day_overrides     || {},
        generalOverrides: row.general_overrides || {},
        customSheets:     sheets,
      });
    }

    // ── POST: save all user data ────────────────────────────────────────────
    if (req.method === 'POST') {
      const {
        workoutProgress = {},
        studyProgress = {},
        studyTimeLog = {},
        dayOverrides = {},
        generalOverrides = {},
      } = req.body || {};

      await pool.query(
        `INSERT INTO user_data
           (user_id, workout_progress, study_progress, study_time_log,
            day_overrides, general_overrides, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           workout_progress  = $2,
           study_progress    = $3,
           study_time_log    = $4,
           day_overrides     = $5,
           general_overrides = $6,
           updated_at        = NOW()`,
        [
          userId,
          JSON.stringify(workoutProgress),
          JSON.stringify(studyProgress),
          JSON.stringify(studyTimeLog),
          JSON.stringify(dayOverrides),
          JSON.stringify(generalOverrides),
        ]
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Data API error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
