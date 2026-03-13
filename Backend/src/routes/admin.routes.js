import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
  "/ping",
  authMiddleware,
  allowRoles("Admin"),
  (req, res) => {
    res.json({ message: "Admin route working" });
  }
);


export default router;
