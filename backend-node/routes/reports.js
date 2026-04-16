const express = require("express");
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

const router = express.Router();

function startFromDays(days) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return start;
}

async function buildReport(days) {
  const start = startFromDays(days);
  const [agg, count] = await Promise.all([
    Payment.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } }
    ]),
    Payment.countDocuments({ createdAt: { $gte: start } })
  ]);

  return {
    vehicles: count,
    revenue: agg[0]?.sum || 0,
    since: start
  };
}

router.get("/daily", auth, async (req, res) => {
  try {
    const report = await buildReport(1);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/weekly", auth, async (req, res) => {
  try {
    const report = await buildReport(7);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/monthly", auth, async (req, res) => {
  try {
    const report = await buildReport(30);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
