require("dotenv").config();
const express = require("express");
const cors = require("cors");

const sendEmail = require("./services/emailService");
const sendSMS = require("./services/smsService");

const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: [
      "https://cmrhyd.up.railway.app",
      "http://localhost:5173",
      "*"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// EMAIL API
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    await sendEmail(to, subject, message);
    res.json({ success: true, msg: "Email sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SMS API
app.post("/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;
    await sendSMS(to, message);
    res.json({ success: true, msg: "SMS sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
