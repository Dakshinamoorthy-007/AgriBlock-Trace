import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "User",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    role: {
      type: String,
      enum: ["farmer", "middleman", "retailer", "consumer", "admin"],
      required: true,
    },

    roleSerial: {
      type: Number,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
  type: String,
  sparse: true,
  },
  firebaseUid: {
    type: String,
    sparse: true,
    index: true,
  },
  },
  { timestamps: true }
  

);

export default mongoose.model("User", userSchema);
