const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  doctor_id: String,
  doctor_name: String,
  user_id: String,
  password: String,
  doctor_speciality: String,
});

module.exports = mongoose.model("Doctor", DoctorSchema);

