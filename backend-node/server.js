require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const slotRoutes = require("./routes/slots");
const dashboardRoutes = require("./routes/dashboard");
const paymentsRoutes = require("./routes/payments");
const reportsRoutes = require("./routes/reports");
const reservationRoutes = require("./routes/reservations");
const Slot = require("./models/Slot");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "parking-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/reservations", reservationRoutes);

async function start() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    await ensureSlots(50);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

start();

async function ensureSlots(total) {
  const existing = await Slot.countDocuments({});
  if (existing >= total) {
    return;
  }

  const bulk = [];
  for (let i = 1; i <= total; i += 1) {
    bulk.push({
      updateOne: {
        filter: { slotNumber: i },
        update: {
          $setOnInsert: { slotNumber: i, status: "available", ratePerHour: 20 }
        },
        upsert: true
      }
    });
  }
  await Slot.bulkWrite(bulk);
}
