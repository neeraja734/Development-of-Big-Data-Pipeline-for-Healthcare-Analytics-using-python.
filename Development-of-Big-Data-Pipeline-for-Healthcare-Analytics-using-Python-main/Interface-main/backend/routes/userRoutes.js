const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
// schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});


const User = mongoose.model("User", UserSchema);


router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});


router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ message: "User saved", user });
  } catch (err) {
    res.status(500).json({ message: "Error saving user" });
  }
});

module.exports = router;
