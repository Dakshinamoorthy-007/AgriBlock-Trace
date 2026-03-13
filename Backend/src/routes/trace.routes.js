import express from "express";
import Batch from "../models/Batch.js";
import MiddlemanAction from "../models/MiddlemanAction.js";

const router = express.Router();

/**
 * GET /api/trace/:batchCode
 * Public trace API
 */
router.get("/:batchCode", async (req, res) => {
  try {
    const { batchCode } = req.params;

    const batch = await Batch.findOne({ batchCode })
      .populate("farmer", "phone role");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const actions = await MiddlemanAction.find({ batch: batch._id })
      .populate("actor", "phone role")
      .sort({ createdAt: 1 });

    res.json({
      batch,
      actions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Trace failed" });
  }
});

export default router;
