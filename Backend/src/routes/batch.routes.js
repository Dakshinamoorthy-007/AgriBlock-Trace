import express from "express";
import Batch from "../models/Batch.js";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import { generateBatchCode } from "../utils/generateBatchCode.js";
import MiddlemanAction from "../models/MiddlemanAction.js";
import {createBatch} from "../controllers/batch.controller.js";

const router = express.Router();

/**
 * POST /api/batch
 * Farmer only
 */
router.post(
  "/",
  authMiddleware,
  allowRoles("farmer"),
  async (req, res) => {
    try {
      const { crop, quantity, location, harvestDate, sellingPricePerKg, totalSellingPrice } = req.body;

      if (!crop || !quantity || !location || !harvestDate) {
        return res.status(400).json({ message: "All fields required" });
      }

      const batch = await Batch.create({
        batchCode: generateBatchCode(crop),
        crop,
        quantity,
        location,
        harvestDate,
        farmer: req.user._id,
        sellingPricePerKg: sellingPricePerKg ?? null,
        totalSellingPrice: totalSellingPrice ?? null,
      });

      res.status(201).json(batch);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Batch creation failed" });
    }
  }
);
/**
 * GET /api/batch/my
 * Farmer only - view own batches
 */
router.get(
  "/my",
  authMiddleware,
  allowRoles("farmer"),
  async (req, res) => {
    try {
      const batches = await Batch.find({ farmer: req.user._id })
        .sort({ createdAt: -1 });

      res.json(batches);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  }
);
// Add these two routes to your existing batch.route.js

/**
 * GET /api/batch/:batchCode/actions
 * Public - get all middleman actions for a batch (for timeline)
 */
router.get("/:batchCode/actions", async (req, res) => {
  try {
    const { batchCode } = req.params;

    const batch = await Batch.findOne({ batchCode });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const actions = await MiddlemanAction.find({ batch: batch._id })
      .populate("actor", "name phone role")
      .sort({ timestamp: 1 });

    res.json(actions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch actions" });
  }
});

/**
 * GET /api/middleman/actions
 * Middleman only - get all actions logged by this middleman
 */
router.get(
  "/middleman/my-actions",
  authMiddleware,
  allowRoles("middleman"),
  async (req, res) => {
    try {
      const actions = await MiddlemanAction.find({ actor: req.user._id })
        .populate("batch", "batchCode crop location harvestDate")
        .sort({ timestamp: -1 });

      res.json(actions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch actions" });
    }
  }
);

/**
 * GET /api/batch/:batchCode
 * Public trace endpoint
 */
router.get("/:batchCode", async (req, res) => {
  try {
    const { batchCode } = req.params;

    const batch = await Batch.findOne({ batchCode })
      .populate("farmer", "phone role");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json(batch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Trace failed" });
  }
});

/*Middleman Action route*/
router.post(
  "/:batchCode/action",
  authMiddleware,
  allowRoles("middleman"),
  async (req, res) => {
    try {
      const { actionType, location, price, notes } = req.body;
      const { batchCode } = req.params;

      const batch = await Batch.findOne({ batchCode });
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const action = await MiddlemanAction.create({
        batch: batch._id,
        actor: req.user._id,
        actionType,
        location,
        price,
        notes
      });

      res.status(201).json(action);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Action failed" });
    }
  }
);

export default router;
