const express = require("express");
const Slot = require("../models/Slot");
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizeSlotNumber(value) {
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

router.get("/", auth, async (req, res) => {
  try {
    const slots = await Slot.find({}).sort({ slotNumber: 1 });
    return res.json({ slots });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:slotNumber/book", auth, async (req, res) => {
  try {
    const slotNumber = normalizeSlotNumber(req.params.slotNumber);
    const { vehicleNo, vehicleType } = req.body;
    if (!slotNumber || !vehicleNo || !vehicleType) {
      return res.status(400).json({ message: "slotNumber, vehicleNo, vehicleType required" });
    }

    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (slot.status !== "available") {
      return res.status(409).json({ message: "Slot not available" });
    }

    slot.status = "booked";
    slot.vehicleNo = vehicleNo;
    slot.vehicleType = vehicleType;
    slot.bookedAt = new Date();
    slot.occupiedAt = null;
    slot.exitedAt = null;
    await slot.save();

    return res.json({ slot });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:slotNumber/occupy", auth, async (req, res) => {
  try {
    const slotNumber = normalizeSlotNumber(req.params.slotNumber);
    const { vehicleNo, vehicleType } = req.body;
    if (!slotNumber) {
      return res.status(400).json({ message: "slotNumber required" });
    }

    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (slot.status === "occupied") {
      return res.status(409).json({ message: "Slot already occupied" });
    }

    slot.status = "occupied";
    slot.vehicleNo = vehicleNo || slot.vehicleNo;
    slot.vehicleType = vehicleType || slot.vehicleType;
    slot.occupiedAt = new Date();
    slot.exitedAt = null;
    await slot.save();

    return res.json({ slot });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:slotNumber/release", auth, async (req, res) => {
  try {
    const slotNumber = normalizeSlotNumber(req.params.slotNumber);
    const { amount } = req.body;
    if (!slotNumber) {
      return res.status(400).json({ message: "slotNumber required" });
    }

    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (slot.status !== "occupied") {
      return res.status(409).json({ message: "Slot is not occupied" });
    }

    const now = new Date();
    const occupiedAt = slot.occupiedAt || now;
    const durationMinutes = Math.max(0, Math.ceil((now - occupiedAt) / 60000));
    const ratePerHour = slot.ratePerHour || 20;
    const calculatedAmount = Math.max(10, Math.ceil((durationMinutes / 60) * ratePerHour));
    const finalAmount = amount && Number(amount) > 0 ? Number(amount) : calculatedAmount;

    await Payment.create({
      amount: finalAmount,
      slotNumber,
      vehicleNo: slot.vehicleNo,
      vehicleType: slot.vehicleType,
      durationMinutes,
      ratePerHour
    });

    slot.status = "available";
    slot.vehicleNo = "";
    slot.vehicleType = "";
    slot.bookedAt = null;
    slot.occupiedAt = null;
    slot.exitedAt = now;
    await slot.save();

    return res.json({
      slot,
      payment: {
        amount: finalAmount,
        durationMinutes,
        ratePerHour
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:slotNumber/cancel", auth, async (req, res) => {
  try {
    const slotNumber = normalizeSlotNumber(req.params.slotNumber);
    if (!slotNumber) {
      return res.status(400).json({ message: "slotNumber required" });
    }

    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (slot.status !== "booked") {
      return res.status(409).json({ message: "Slot is not booked" });
    }

    slot.status = "available";
    slot.vehicleNo = "";
    slot.vehicleType = "";
    slot.bookedAt = null;
    slot.occupiedAt = null;
    slot.exitedAt = null;
    await slot.save();

    return res.json({ slot });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
