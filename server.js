require("dotenv").config();
const express = require("express");

const sendEmail = require("./services/emailService");
const sendSMS = require("./services/smsService");

const app = express();
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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
