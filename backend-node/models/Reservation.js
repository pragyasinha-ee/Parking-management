const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slotNumber: { type: Number, required: true },
    vehicleNo: { type: String, required: true, trim: true },
    vehicleType: { type: String, required: true },
    customerName: { type: String, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    customerPhone: { type: String, trim: true },
    reservationDate: { type: Date, default: Date.now },
    scheduledTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
