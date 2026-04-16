const express = require("express");
const Slot = require("../models/Slot");
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const [totalSlots, occupied, booked] = await Promise.all([
      Slot.countDocuments({}),
      Slot.countDocuments({ status: "occupied" }),
      Slot.countDocuments({ status: "booked" })
    ]);

    const available = totalSlots - occupied - booked;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [revenueTotalAgg, revenueTodayAgg, recentPayments] = await Promise.all([
      Payment.aggregate([{ $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } }
      ]),
      Payment.find({}).sort({ createdAt: -1 }).limit(5)
    ]);

    const revenueTotal = revenueTotalAgg[0]?.sum || 0;
    const revenueToday = revenueTodayAgg[0]?.sum || 0;

    return res.json({
      totalSlots,
      occupied,
      booked,
      available,
      revenueTotal,
      revenueToday,
      recentPayments
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
