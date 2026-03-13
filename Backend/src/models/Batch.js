import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    crop: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Farmer's selling price — for supply chain transparency
    sellingPricePerKg: {
      type: Number,
      default: null,
    },
    totalSellingPrice: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);