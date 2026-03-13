import mongoose from "mongoose";

const traceStepSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
    action: String,
    actorRole: String,
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: String,
    description: String,
  },
  { timestamps: true }
);

export default mongoose.model("TraceStep", traceStepSchema);
