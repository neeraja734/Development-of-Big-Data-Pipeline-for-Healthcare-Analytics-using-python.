const express = require("express");
const router = express.Router();

const Prescription = require("../models/Prescription");
const Visit = require("../models/Visit");

// ✅ POST add prescription (auto-fill doctor_name + patient_id from Visit)
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const visit = await Visit.findOne({ visit_id: data.visit_id });

    if (!visit) {
      return res
        .status(400)
        .json({ message: "Invalid visit_id. Visit not found." });
    }

    const prescription = new Prescription({
      ...data,
      doctor_name: visit.doctor_name, // ✅ ONLY THIS
      patient_id: visit.patient_id,   // ✅ also safest auto-fill
    });

    await prescription.save();

    res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (err) {
    console.error("SAVE PRESCRIPTION ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ GET all prescriptions
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find();
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ BULK upload prescriptions
router.post("/bulk", async (req, res) => {
  try {
    await Prescription.insertMany(req.body);
    res.status(201).json({ message: "Prescriptions saved to MongoDB" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE prescription
router.delete("/:prescriptionId", async (req, res) => {
  try {
    let { prescriptionId } = req.params;
    prescriptionId = prescriptionId.trim();

    console.log("Deleting prescription:", prescriptionId);

    const deletedPrescription = await Prescription.findOneAndDelete({
      prescription_id: prescriptionId,
    });

    if (!deletedPrescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    res.json({
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Prescription delete error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
