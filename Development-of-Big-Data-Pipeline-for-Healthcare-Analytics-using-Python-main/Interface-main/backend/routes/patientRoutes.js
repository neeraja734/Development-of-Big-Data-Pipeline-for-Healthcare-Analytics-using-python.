
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const  Patient = require("../models/Patient");



router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: "Error fetching patients" });
  }
});


router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.json({ message: "Patient saved", patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving patient" });
  }
});


router.post("/bulk", async (req, res) => {
  try {
    const patients = await Patient.insertMany(req.body);
    res.status(201).json(patients);
  } catch (error) {
    res.status(500).json({ message: "Bulk insert failed" });
  }
});

router.get("/", async (req, res) => {
  const patients = await Patient.find();
  res.json(patients);
});



router.delete("/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const deleted = await Patient.findOneAndDelete({
      patient_id: patientId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.json({
      message: "Patient deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete patient",
    });
  }
});




module.exports = router;
