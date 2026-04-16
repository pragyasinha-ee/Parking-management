const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "booked", "occupied"],
      default: "available"
    },
    vehicleNo: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    ratePerHour: { type: Number, default: 20 },
    bookedAt: { type: Date, default: null },
    occupiedAt: { type: Date, default: null },
    exitedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slot", slotSchema);
