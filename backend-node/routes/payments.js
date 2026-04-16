const express = require("express");
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { amount, slotNumber, vehicleNo, vehicleType } = req.body;
    if (!amount || !slotNumber) {
      return res.status(400).json({ message: "amount and slotNumber required" });
    }

    const payment = await Payment.create({
      amount: Number(amount),
      slotNumber: Number(slotNumber),
      vehicleNo: vehicleNo || "",
      vehicleType: vehicleType || ""
    });

    return res.status(201).json({ payment });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/recent", auth, async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 }).limit(10);
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
