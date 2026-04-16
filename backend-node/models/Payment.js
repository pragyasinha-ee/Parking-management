const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    slotNumber: { type: Number, required: true },
    vehicleNo: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    durationMinutes: { type: Number, default: 0 },
    ratePerHour: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
