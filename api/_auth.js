// api/_auth.js — JWT helpers and request authentication
'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '30d'; // 30 day session

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the decoded payload or null if invalid/missing.
 */
function authenticate(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

/** Sends a 401 response */
function unauthorized(res, msg = 'Não autorizado') {
  res.status(401).json({ error: msg });
}

module.exports = { signToken, verifyToken, authenticate, unauthorized };
