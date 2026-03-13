import mongoose from "mongoose";

const middlemanActionSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actionType: {
      type: String,
      enum: ["TRANSPORT", "PRICE_UPDATE", "STORAGE", "SALE"],
      required: true
    },
    location: String,
    price: Number,
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("MiddlemanAction", middlemanActionSchema);
