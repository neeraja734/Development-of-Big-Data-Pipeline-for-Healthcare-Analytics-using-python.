const mongoose = require("mongoose");

const VisitSchema = new mongoose.Schema(
  {
    visit_id: { type: String, unique: true, required: true },
    patient_id: { type: String, required: true },
    visit_date: Date,

    severity_score: Number,
    visit_type: String,

    length_of_stay: Number,
    lab_result_glucose: Number,
    lab_result_bp: Number,

    previous_visit_gap_days: Number,
    readmitted_within_30_days: String,

    visit_cost: Number,

    doctor_name: { type: String, required: true },
    doctor_speciality: { type: String, required: true },
  },
  { strict: true }
);

module.exports = mongoose.model("Visit", VisitSchema);
