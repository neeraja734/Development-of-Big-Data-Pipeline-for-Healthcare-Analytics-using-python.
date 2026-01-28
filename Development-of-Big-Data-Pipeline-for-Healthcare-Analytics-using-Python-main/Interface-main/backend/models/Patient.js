const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true
  },
  blood_group: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  emergency_contact: {
    type: String,
    required: true
  },
  hospital_location: {
    type: String,
    required: true
  },
  bmi: {
    type: Number,
    required: true
  },
  smoker_status: {
    type: Boolean,
    default: false
  },
  alcohol_use: {
    type: Boolean,
    default: false
  },
  chronic_conditions: {
    type: [String],
    default: []
  },
  registration_date: {
    type: String, // frontend sends string, NOT Date object
    required: true
  },
  insurance_type: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
