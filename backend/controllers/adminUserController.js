import { db } from "../config/db.js";
import bcrypt from "bcrypt";

/* ===============================
   CREATE USER (STUDENT / TEACHER / AFFAIRS)
   =============================== */
export const createUser = async (req, res) => {
  const { name, reg_no, dept, year, role } = req.body;

  if (!name || !reg_no || !role)
    return res.status(400).json({ message: "Missing required fields" });

  // get role id
  const [roleRows] = await db.query(
    "SELECT role_id FROM roles WHERE role_name = ?",
    [role]
  );

  if (roleRows.length === 0)
    return res.status(400).json({ message: "Invalid role" });

  const role_id = roleRows[0].role_id;

  // default password rule (as you specified)
  // dept + year  (example: CSE2)
  const defaultPassword = `${dept}${year}`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await db.query(
    `INSERT INTO users (name, reg_no, dept, year, role_id, password)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, reg_no, dept, year, role_id, hashedPassword]
  );

  res.json({
    message: "User created successfully",
    defaultPassword,
  });
};

/* ===============================
   VIEW ALL USERS
   =============================== */
export const getAllUsers = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.user_id, u.name, u.reg_no, u.dept, u.year, r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     WHERE r.role_name != 'ADMIN'`
  );

  res.json(rows);
};

/* ===============================
   DELETE USER
   =============================== */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM users WHERE user_id = ?", [id]);

  res.json({ message: "User deleted successfully" });
};
