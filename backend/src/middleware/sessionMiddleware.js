/**
 * Session middleware for guest cart tracking.
 * Reads X-Session-Id header and attaches it to req.sessionId.
 */
const sessionMiddleware = (req, res, next) => {
  req.sessionId = req.headers['x-session-id'] || null;
  next();
};

module.exports = sessionMiddleware;
