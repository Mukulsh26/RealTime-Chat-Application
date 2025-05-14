const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message");

router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get("/messages/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;
  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  });
  res.json(messages);
});

router.post("/messages", async (req, res) => {
  const msg = new Message(req.body);
  await msg.save();
  res.status(201).json(msg);
});

router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, username: email.split("@")[0] });
    await user.save();
  }

  res.json(user);
});

module.exports = router;
