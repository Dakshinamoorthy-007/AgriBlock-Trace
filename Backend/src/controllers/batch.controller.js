import Batch from "../models/Batch.js";
import crypto from "crypto";

export const createBatch = async (req, res) => {
  try {
    console.log("CREATE BATCH HIT:", req.body);

    const { crop, quantity, location, harvestDate } = req.body;

    const batchCode = `AGRI-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const batch = await Batch.create({
      batchCode,
      crop,
      quantity,
      location,
      harvestDate,
      farmer: req.user._id
    });

    console.log("BATCH CREATED:", batch);

    res.status(201).json(batch);
  } catch (err) {
    console.error("BATCH ERROR:", err);
    res.status(500).json({ message: "Batch creation failed" });
  }
};