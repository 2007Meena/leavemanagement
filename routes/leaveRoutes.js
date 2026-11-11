
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register a user
router.post("/register", async (req, res) => {
  try {
    const { username, email, rollNumber } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const user = await User.create({
      username,
      email,
      rollNumber
    });

    res.status(201).json({
      message: "Registration successful",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login using email
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please register first."
      });
    }

    res.json({
      userId: user._id,
      username: user.username,
      rollNumber: user.rollNumber,
      casualLeave: user.casualLeave,
      medicalLeave: user.medicalLeave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leave balance
router.get("/leave-balance/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      casualLeave: user.casualLeave,
      medicalLeave: user.medicalLeave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for leave
router.post("/apply-leave/:userId", async (req, res) => {
  try {
    const { type, days } = req.body;
    const numberOfDays = Number(days);

    if (
      !Number.isInteger(numberOfDays) ||
      numberOfDays <= 0 ||
      !["casual", "medical"].includes(type)
    ) {
      return res.status(400).json({
        message: "Invalid leave type or number of days"
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const field =
      type === "casual" ? "casualLeave" : "medicalLeave";

    if (numberOfDays > user[field]) {
      return res.status(400).json({
        message: "Insufficient leave balance"
      });
    }

    user[field] -= numberOfDays;
    await user.save();

    res.json({
      message: "Leave applied successfully",
      casualLeave: user.casualLeave,
      medicalLeave: user.medicalLeave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
