const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  patient_id: { type: String, required: true },
  full_name: String,
  age: Number,
  gender: String,
  blood_group: String,
  phone_number: String,
  email: String,
  emergency_contact: String,
  hospital_location: String,
  bmi: Number,
  smoker_status: Boolean,
  alcohol_use: Boolean,
  chronic_conditions: [String],
  registration_date: String,
  insurance_type: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
