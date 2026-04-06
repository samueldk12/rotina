// api/sheets.js — GET, POST, DELETE /api/sheets
// CRUD for user-created custom workout sheets
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

    // ── GET: all custom sheets ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT sheet_id, sheet_data FROM custom_sheets WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );
      const sheets = {};
      result.rows.forEach(r => { sheets[r.sheet_id] = r.sheet_data; });
      return res.status(200).json(sheets);
    }

    // ── POST: create or update a sheet ─────────────────────────────────────
    if (req.method === 'POST') {
      const { sheet } = req.body || {};
      if (!sheet || !sheet.id) {
        return res.status(400).json({ error: 'Campo sheet com id é obrigatório' });
      }

      await pool.query(
        `INSERT INTO custom_sheets (user_id, sheet_id, sheet_data, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, sheet_id) DO UPDATE SET
           sheet_data = $3, updated_at = NOW()`,
        [userId, sheet.id, JSON.stringify(sheet)]
      );

      return res.status(200).json({ ok: true });
    }

    // ── DELETE: remove a sheet ──────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const sheetId = req.query?.sheetId || (req.body || {}).sheetId;
      if (!sheetId) {
        return res.status(400).json({ error: 'sheetId é obrigatório' });
      }

      await pool.query(
        'DELETE FROM custom_sheets WHERE user_id = $1 AND sheet_id = $2',
        [userId, sheetId]
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Sheets API error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
