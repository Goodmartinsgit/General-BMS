const jwt = require('jsonwebtoken');

const STORE_JWT_SECRET = process.env.STORE_JWT_SECRET || 'store-secret-change-in-production';

/**
 * Strict customer auth — requires valid customer token
 */
const storeAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, STORE_JWT_SECRET);
    req.customer = decoded; // { customerId, email, source }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Optional customer auth — attaches customer if token present, continues without it
 */
const optionalStoreAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, STORE_JWT_SECRET);
      req.customer = decoded;
    } catch (err) {
      // Invalid token — proceed as guest
      req.customer = null;
    }
  } else {
    req.customer = null;
  }
  next();
};

/**
 * Generate a customer JWT
 */
const signCustomerToken = (customer) => {
  return jwt.sign(
    { customerId: customer.id, email: customer.email || customer.customer_auth_email, source: 'online' },
    STORE_JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = { storeAuth, optionalStoreAuth, signCustomerToken };
