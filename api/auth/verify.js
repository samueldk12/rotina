// api/auth/verify.js — GET /api/auth/verify
// Used by the client on startup to check if the stored token is still valid
'use strict';

const { authenticate, unauthorized } = require('../_auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const payload = authenticate(req);
  if (!payload) return unauthorized(res, 'Token inválido ou expirado');

  return res.status(200).json({
    valid: true,
    user: { id: payload.userId, username: payload.username },
  });
};
