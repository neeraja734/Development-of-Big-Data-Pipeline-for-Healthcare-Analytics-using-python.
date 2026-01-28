const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// ADD doctor
router.post("/", async (req, res) => {
  try {
    // 1️⃣ Find the last doctor (highest doctor_id)
    const lastDoctor = await Doctor.findOne()
      .sort({ doctor_id: -1 })
      .lean();

    // 2️⃣ Decide next doctor_id
    let nextDoctorId = "DOC001";

    if (lastDoctor && lastDoctor.doctor_id) {
      const lastNumber = parseInt(lastDoctor.doctor_id.replace("DOC", ""));
      const newNumber = lastNumber + 1;
      nextDoctorId = "DOC" + String(newNumber).padStart(3, "0");
    }

    // 3️⃣ Create doctor
    const doctor = new Doctor({
      doctor_id: nextDoctorId,
      doctor_name: req.body.doctor_name,
      user_id: req.body.user_id,
      password: req.body.password,
      doctor_speciality: req.body.doctor_speciality,
    });

    await doctor.save();

    res.status(201).json(doctor);
  } catch (err) {
    console.error("SAVE DOCTOR ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DOCTOR LOGIN
router.post("/login", async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ message: "user_id and password required" });
    }

    const doctor = await Doctor.findOne({ user_id: user_id.trim() });

    if (!doctor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (doctor.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      doctor,
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:doctorId", async (req, res) => {
  try {
    let { doctorId } = req.params;
    doctorId = doctorId.trim();

    console.log("Deleting doctor with doctor_id:", doctorId);

    const deletedDoctor = await Doctor.findOneAndDelete({
      doctor_id: doctorId,
    });

    if (!deletedDoctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.json({
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Doctor delete error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
