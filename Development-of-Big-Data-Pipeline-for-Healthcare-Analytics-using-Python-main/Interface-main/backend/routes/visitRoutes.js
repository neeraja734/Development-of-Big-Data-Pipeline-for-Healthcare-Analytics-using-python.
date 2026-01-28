const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Visit = require("../models/Visit");


// ✅ GET all visits
router.get("/", async (req, res) => {
  try {
    const visits = await Visit.find();
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: "Error fetching visits" });
  }
});

// ✅ POST add visit
router.post("/", async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.json({ message: "Visit saved", visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving visit" });
  }
});


router.post("/bulk", async (req, res) => {
  try {
    const visits = req.body; // array of visits
    const inserted = await Visit.insertMany(visits);
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});






router.post("/bulk", async (req, res) => {
  try {
    const prescriptions = req.body;

    if (!Array.isArray(prescriptions)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const saved = await Prescription.insertMany(prescriptions, {
      ordered: false
    });

    res.status(201).json({
      message: "Prescriptions saved to MongoDB",
      count: saved.length
    });

  } catch (error) {
    console.error("Prescription bulk insert error:", error);
    res.status(500).json({ message: error.message });
  }
});


router.delete("/:visitId", async (req, res) => {
  try {
    let { visitId } = req.params;
    visitId = visitId.trim();

    const deletedVisit = await Visit.findOneAndDelete({
      visit_id: { $regex: `^${visitId}$`, $options: "i" },
    });

    if (!deletedVisit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Visit delete error:", error);
    res.status(500).json({ message: "Error deleting visit" });
  }
});


module.exports = router;

