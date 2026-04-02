import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../models/db.js';

// Register user
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      [name, email, hashed, role]
    );
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'User not found' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// adminLoginController.js
export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  const ADMIN_import { db } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  const { reg_no, password } = req.body;

  const [rows] = await db.query(
    `SELECT u.*, r.role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.role_id 
     WHERE reg_no = ? AND r.role_name = 'ADMIN'`,
    [reg_no]
  );

  if (rows.length === 0)
    return res.status(401).json({ message: "Invalid admin credentials" });

  const admin = rows[0];

  const match =
    admin.password.length === 64
      ? admin.password === require("crypto").createHash("sha256").update(password).digest("hex")
      : await bcrypt.compare(password, admin.password);

  if (!match)
    return res.status(401).json({ message: "Invalid password" });

  const token = jwt.sign(
    {
      user_id: admin.user_id,
      role: "ADMIN",
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    message: "Admin login successful",
    token,
    admin: {
      id: admin.user_id,
      name: admin.name,
      reg_no: admin.reg_no,
    },
  });
};
USERNAME = "Ratheesh";
  const ADMIN_PASSWORD = "Admin@Rath";

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      role: "ADMIN",
      token: "admin-static-token"
    });
  }

  return res.status(401).json({ message: "Invalid Admin Credentials" });
};
