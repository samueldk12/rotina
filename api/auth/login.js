// api/auth/login.js — POST /api/auth/login
'use strict';

const bcrypt = require('bcryptjs');
const { getPool, initSchema } = require('../_db');
const { signToken } = require('../_auth');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }

  try {
    await initSchema();
    const pool = getPool();

    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username ou senha inválidos' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Username ou senha inválidos' });
    }

    const token = signToken({ userId: user.id, username: user.username });

    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
