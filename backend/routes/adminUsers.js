import express from "express";
import authAdmin from "../middleware/authAdmin.js";
import {
  createUser,
  getAllUsers,
  deleteUser,
} from "../controllers/adminUserController.js";

const router = express.Router();

router.post("/create", authAdmin, createUser);
router.get("/all", authAdmin, getAllUsers);
router.delete("/:id", authAdmin, deleteUser);

export default router;
