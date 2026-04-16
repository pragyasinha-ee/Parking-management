const express = require("express");
const Reservation = require("../models/Reservation");
const Slot = require("../models/Slot");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all reservations
router.get("/", auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.reservationDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const reservations = await Reservation.find(filter)
      .populate("userId", "name email")
      .sort({ reservationDate: -1, createdAt: -1 });
    
    return res.json({ reservations });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Get single reservation
router.get("/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("userId", "name email");
    
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    return res.json({ reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Create reservation
router.post("/", auth, async (req, res) => {
  try {
    const { slotNumber, vehicleNo, vehicleType, customerName, customerEmail, customerPhone, scheduledTime, notes } = req.body;
    
    console.log("Creating reservation:", { slotNumber, vehicleNo, vehicleType, customerName, scheduledTime });
    
    if (!slotNumber || !vehicleNo || !vehicleType || !scheduledTime) {
      return res.status(400).json({ message: "slotNumber, vehicleNo, vehicleType, and scheduledTime are required" });
    }

    // Check if slot exists
    const slot = await Slot.findOne({ slotNumber });
    if (!slot) {
      console.log("Slot not found:", slotNumber);
      return res.status(404).json({ message: "Slot not found" });
    }

    // Check slot availability
    if (slot.status !== "available" && slot.status !== "booked") {
      console.log("Slot not available:", slot.status);
      return res.status(409).json({ message: "Slot is not available for reservation" });
    }

    console.log("Creating reservation in database...");
    const reservation = await Reservation.create({
      userId: req.user.id,
      slotNumber,
      vehicleNo,
      vehicleType,
      customerName,
      customerEmail,
      customerPhone,
      scheduledTime: new Date(scheduledTime),
      notes
    });
    
    console.log("Reservation created:", reservation._id);

    // Update slot status to booked
    slot.status = "booked";
    slot.vehicleNo = vehicleNo;
    slot.vehicleType = vehicleType;
    slot.bookedAt = new Date();
    await slot.save();

    return res.status(201).json({ reservation });
  } catch (err) {
    console.error("Reservation creation error:", err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Update reservation
router.put("/:id", auth, async (req, res) => {
  try {
    const { vehicleNo, vehicleType, scheduledTime, status, notes } = req.body;
    
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (vehicleNo) reservation.vehicleNo = vehicleNo;
    if (vehicleType) reservation.vehicleType = vehicleType;
    if (scheduledTime) reservation.scheduledTime = new Date(scheduledTime);
    if (status) reservation.status = status;
    if (notes !== undefined) reservation.notes = notes;

    await reservation.save();

    return res.json({ reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Cancel reservation
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status === "cancelled") {
      return res.status(409).json({ message: "Reservation already cancelled" });
    }

    reservation.status = "cancelled";
    await reservation.save();

    // Free up the slot
    const slot = await Slot.findOne({ slotNumber: reservation.slotNumber });
    if (slot && slot.status === "booked") {
      slot.status = "available";
      slot.vehicleNo = "";
      slot.vehicleType = "";
      slot.bookedAt = null;
      await slot.save();
    }

    return res.json({ reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete reservation
router.delete("/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Free up the slot if booked
    const slot = await Slot.findOne({ slotNumber: reservation.slotNumber });
    if (slot && slot.status === "booked") {
      slot.status = "available";
      slot.vehicleNo = "";
      slot.vehicleType = "";
      slot.bookedAt = null;
      await slot.save();
    }

    await Reservation.findByIdAndDelete(req.params.id);

    return res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Get reservations by date
router.get("/date/:date", auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      reservationDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("userId", "name email")
      .sort({ scheduledTime: 1 });

    return res.json({ reservations });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
