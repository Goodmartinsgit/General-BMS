const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const register = async (req, res) => {
  try {
    const { email, password, full_name, role_name } = req.body;
    
    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Get role id (default to 'Staff' if not provided or found, but for now assuming role exists)
    // For prototype, if role_name is provided, try to find it, else default to first role or error
    // Let's insert a default role if not exists in a real app, but here we assume roles table might be empty.
    // Let's ensure at least one role exists.
    let roleId;
    if (role_name) {
      const roleRes = await query('SELECT id FROM roles WHERE role_name = $1', [role_name]);
      if (roleRes.rows.length > 0) roleId = roleRes.rows[0].id;
    }
    
    // If no role found, create a default 'Admin' role for the first user
    if (!roleId) {
        // Simple check if roles exist
        const rolesCount = await query('SELECT COUNT(*) FROM roles');
        if (parseInt(rolesCount.rows[0].count) === 0) {
             const newRole = await query('INSERT INTO roles (role_name, description) VALUES ($1, $2) RETURNING id', ['Super Admin', 'System Administrator']);
             roleId = newRole.rows[0].id;
        } else {
             // Fetch first available role
             const anyRole = await query('SELECT id FROM roles LIMIT 1');
             roleId = anyRole.rows[0].id;
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await query(
      'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role_id',
      [email, hashedPassword, full_name, roleId]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign({ id: user.id, email: user.email, role_id: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ accessToken, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
