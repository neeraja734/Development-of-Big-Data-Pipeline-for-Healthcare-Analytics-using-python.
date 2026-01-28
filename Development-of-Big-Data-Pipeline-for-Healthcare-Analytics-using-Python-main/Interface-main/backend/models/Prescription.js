const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
  prescription_id: { type: String, required: true, unique: true },

  visit_id: { type: String, required: true },
  patient_id: { type: String, required: true },
  doctor_name: { type: String, required: true },
  diagnosis_id: { type: String, required: true },
  diagnosis_description: { type: String, required: true },

  drug_name: { type: String, required: true },
  drug_category: { type: String, required: true },

  dosage: { type: String, required: true },
  quantity: { type: Number, required: true },
  days_supply: { type: Number, required: true },

  prescribed_date: { type: String, required: true },
  cost: { type: Number, required: true }
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);

