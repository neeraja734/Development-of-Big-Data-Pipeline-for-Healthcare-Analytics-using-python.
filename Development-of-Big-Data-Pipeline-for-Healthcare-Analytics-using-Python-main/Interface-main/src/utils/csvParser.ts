// src/utils/csvParser.ts
import {
  Patient,
  Visit,
  Prescription,
  CHRONIC_CONDITIONS,
  BLOOD_GROUPS,
  Doctor,
} from "@/types/hospital";

export interface CSVParseResult<T> {
  valid: T[];
  errors: { row: number; message: string }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/* =======================
   CSV BASE PARSER
======================= */

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, "").trim());
  });

  return { headers, rows };
}

const parseBool = (value: string) => {
  const v = value?.trim()?.toLowerCase();
  return ["yes", "true", "1"].includes(v);
};

const isValidBool = (value: string) => {
  const v = value?.trim()?.toLowerCase();
  return ["yes", "no", "true", "false", "1", "0"].includes(v);
};

/* =======================
   PATIENT CSV
======================= */

const PATIENT_REQUIRED_HEADERS = [
  "patient_id",
  "full_name",
  "age",
  "gender",
  "blood_group",
  "phone_number",
  "email",
  "emergency_contact",
  "hospital_location",
  "bmi",
  "smoker_status",
  "alcohol_use",
  "chronic_conditions",
  "registration_date",
  "insurance_type",
];

export function parsePatientCSV(
  csvText: string,
  existingPatientIds: string[]
): CSVParseResult<Patient> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Patient[] = [];

  const missingHeaders = PATIENT_REQUIRED_HEADERS.filter(
    (h) => !headers.includes(h)
  );

  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [
        {
          row: 0,
          message: `Missing required columns: ${missingHeaders.join(", ")}`,
        },
      ],
      summary: { total: rows.length, valid: 0, invalid: rows.length },
    };
  }

  const headerIndex = PATIENT_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors: string[] = [];

    const patient_id = row[headerIndex.patient_id]?.trim();
    const full_name = row[headerIndex.full_name]?.trim();
    const ageStr = row[headerIndex.age]?.trim();
    const gender = row[headerIndex.gender]?.trim();
    const blood_group = row[headerIndex.blood_group]?.trim();
    const phone_number = row[headerIndex.phone_number]?.trim();
    const email = row[headerIndex.email]?.trim();
    const emergency_contact = row[headerIndex.emergency_contact]?.trim();
    const hospital_location = row[headerIndex.hospital_location]?.trim();
    const bmiStr = row[headerIndex.bmi]?.trim();
    const smoker_status = row[headerIndex.smoker_status]?.trim();
    const alcohol_use = row[headerIndex.alcohol_use]?.trim();
    const chronic_conditions_str = row[headerIndex.chronic_conditions]?.trim();
    const registration_date = row[headerIndex.registration_date]?.trim();
    const insurance_type = row[headerIndex.insurance_type]?.trim();

    // patient_id
    if (!patient_id) rowErrors.push("patient_id is required");
    else if (
      existingPatientIds.includes(patient_id) ||
      valid.some((p) => p.patient_id === patient_id)
    ) {
      rowErrors.push(`patient_id "${patient_id}" already exists`);
    }

    // full_name
    if (!full_name) rowErrors.push("full_name is required");

    // age
    const age = parseInt(ageStr);
    if (isNaN(age) || age < 0 || age > 150) {
      rowErrors.push("age must be a valid number between 0-150");
    }

    // gender
    if (!["Male", "Female", "Other"].includes(gender)) {
      rowErrors.push("gender must be Male, Female, or Other");
    }

    // blood_group
    if (!BLOOD_GROUPS.includes(blood_group)) {
      rowErrors.push(`blood_group must be one of: ${BLOOD_GROUPS.join(", ")}`);
    }

    // bmi
    const bmi = parseFloat(bmiStr);
    if (isNaN(bmi) || bmi < 10 || bmi > 100) {
      rowErrors.push("bmi must be a valid number between 10-100");
    }

    // smoker_status
    if (!isValidBool(smoker_status)) {
      rowErrors.push("smoker_status must be Yes/No (or True/False/1/0)");
    }

    // alcohol_use
    if (!isValidBool(alcohol_use)) {
      rowErrors.push("alcohol_use must be Yes/No (or True/False/1/0)");
    }

    // chronic_conditions (allow multiple separated by ;)

    // ✅ chronic_conditions
        let chronic_conditions: string[] = [];

        if (chronic_conditions_str) {
          const raw = chronic_conditions_str.trim();

          // ✅ ignore none/null/na/n-a
          if (!["none", "null", "na", "n/a"].includes(raw.toLowerCase())) {
            chronic_conditions = raw
              .split(/[,;]+/) // ✅ supports comma and semicolon
              .map((c) => c.trim())
              .filter(Boolean)
              .map((c) => c.toLowerCase()); // ✅ normalize to lowercase
          }
        }

        // ✅ aliases (your csv values → your CHRONIC_CONDITIONS values)
        const aliases: Record<string, string> = {
          ckd: "kidney disease",
          thyroid: "thyroid disorder",
        };

        // ✅ apply aliases
        chronic_conditions = chronic_conditions.map((c) => aliases[c] || c);

        // ✅ map lowercase -> official CHRONIC_CONDITIONS value
        const conditionMap = new Map(
          CHRONIC_CONDITIONS.map((c) => [c.toLowerCase(), c])
        );

        // ✅ normalized conditions stored in DB
        const normalized_conditions = chronic_conditions
          .map((c) => conditionMap.get(c))
          .filter(Boolean) as string[];

        // ✅ invalid conditions check
        const invalidConditions = chronic_conditions.filter((c) => !conditionMap.has(c));

        if (invalidConditions.length > 0) {
          rowErrors.push(`Invalid chronic conditions: ${invalidConditions.join(",")}`);
        }

          

    // registration_date
    const dateObj = new Date(registration_date);
    if (isNaN(dateObj.getTime())) {
      rowErrors.push("registration_date must be a valid date");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
    } else {
      valid.push({
        patient_id,
        full_name,
        age,
        gender: gender as Patient["gender"],
        blood_group,
        phone_number,
        email,
        emergency_contact,
        hospital_location,
        bmi,
        smoker_status: parseBool(smoker_status),
        alcohol_use: parseBool(alcohol_use),
        chronic_conditions: normalized_conditions,
        registration_date: dateObj.toISOString().split("T")[0],
        insurance_type,
      });
    }
  });

  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length },
  };
}


/* =======================
   VISIT CSV
   ✅ doctor_name + doctor_speciality (NO doctor_id in CSV)
   ✅ lab_result_bp is number
======================= */

const VISIT_REQUIRED_HEADERS = [
  "visit_id",
  "patient_id",
  "doctor_name",
  "doctor_speciality",
  "visit_date",
  "severity_score",
  "visit_type",
  "length_of_stay",
  "lab_result_glucose",
  "lab_result_bp",
  "previous_visit_gap_days",
  "readmitted_within_30_days",
  "visit_cost",
];

export function parseVisitCSV(
  csvText: string,
  existingVisitIds: string[],
  existingPatientIds: string[],
  doctors: Doctor[]
): CSVParseResult<Visit> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Visit[] = [];

  const missingHeaders = VISIT_REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [
        { row: 0, message: `Missing required columns: ${missingHeaders.join(", ")}` },
      ],
      summary: { total: rows.length, valid: 0, invalid: rows.length },
    };
  }

  const headerIndex = VISIT_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors: string[] = [];

    const visit_id = row[headerIndex.visit_id]?.trim();
    const patient_id = row[headerIndex.patient_id]?.trim();

    const doctor_name = row[headerIndex.doctor_name]?.trim();
    const doctor_speciality = row[headerIndex.doctor_speciality]?.trim();

    const visit_date = row[headerIndex.visit_date]?.trim();
    const severity_score_str = row[headerIndex.severity_score]?.trim();
    const visit_type = row[headerIndex.visit_type]?.trim()?.toUpperCase();
    const length_of_stay_str = row[headerIndex.length_of_stay]?.trim();

    const lab_result_glucose_str = row[headerIndex.lab_result_glucose]?.trim();
    const lab_result_bp_str = row[headerIndex.lab_result_bp]?.trim();

    const previous_visit_gap_days_str = row[headerIndex.previous_visit_gap_days]?.trim();
    const readmitted_str = row[headerIndex.readmitted_within_30_days]?.trim();
    const visit_cost_str = row[headerIndex.visit_cost]?.trim();

    // ✅ visit_id
    if (!visit_id) rowErrors.push("visit_id is required");
    else if (
      existingVisitIds.includes(visit_id) ||
      valid.some((v) => v.visit_id === visit_id)
    ) {
      rowErrors.push(`visit_id "${visit_id}" already exists`);
    }

    // ✅ patient_id
    if (!existingPatientIds.includes(patient_id)) {
      rowErrors.push(`patient_id "${patient_id}" does not exist`);
    }

    // ✅ doctor_name + doctor_speciality required
    if (!doctor_name) rowErrors.push("doctor_name is required");
    if (!doctor_speciality) rowErrors.push("doctor_speciality is required");

    // ✅ Find doctor from DB list
    const matchedDoctor = doctors.find(
      (d) =>
        d.doctor_name?.toLowerCase() === doctor_name?.toLowerCase() &&
        d.doctor_speciality?.toLowerCase() === doctor_speciality?.toLowerCase()
    );

    if (!matchedDoctor) {
      rowErrors.push(
        `Doctor not found in DB: "${doctor_name}" (${doctor_speciality})`
      );
    }

    // ✅ visit_date
    const dateObj = new Date(visit_date);
    if (isNaN(dateObj.getTime())) {
      rowErrors.push("visit_date must be a valid date");
    }

    // ✅ severity_score
    const severity_score = parseInt(severity_score_str);
    if (
      isNaN(severity_score) ||
      severity_score < 0 ||
      severity_score > 5 ||
      !Number.isInteger(severity_score)
    ) {
      rowErrors.push("severity_score must be an integer between 0-5");
    }

    // ✅ visit_type
    if (!["OP", "IP"].includes(visit_type)) {
      rowErrors.push("visit_type must be OP or IP");
    }

    // ✅ length_of_stay
    const length_of_stay = parseInt(length_of_stay_str);
    if (isNaN(length_of_stay) || length_of_stay < 0) {
      rowErrors.push("length_of_stay must be a non-negative integer");
    }
    
    // ✅ glucose
    const lab_result_glucose = parseFloat(lab_result_glucose_str);
    if (isNaN(lab_result_glucose)) {
      rowErrors.push("lab_result_glucose must be a valid number");
    }

    // ✅ BP number
    const lab_result_bp = parseFloat(lab_result_bp_str);
    if (isNaN(lab_result_bp)) {
      rowErrors.push("lab_result_bp must be a valid number (example: 120)");
    }

    // ✅ gap days
    const previous_visit_gap_days = parseInt(previous_visit_gap_days_str);
    if (isNaN(previous_visit_gap_days) || previous_visit_gap_days < 0) {
      rowErrors.push("previous_visit_gap_days must be a non-negative integer");
    }

    // ✅ readmitted
    if (!isValidBool(readmitted_str)) {
      rowErrors.push("readmitted_within_30_days must be Yes/No (or True/False/1/0)");
    }
    const readmitted_within_30_days = parseBool(readmitted_str);

    if (visit_type === "OP" && readmitted_within_30_days) {
      rowErrors.push("readmitted_within_30_days should be No for OP visits");
    }

    // ✅ visit_cost
    const visit_cost = parseFloat(visit_cost_str);
    if (isNaN(visit_cost) || visit_cost < 0) {
      rowErrors.push("visit_cost must be a non-negative number");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
    } else {
      valid.push({
        visit_id,
        patient_id,

        // ✅ auto fill doctor_id from DB matched doctor
        doctor_id: matchedDoctor!.doctor_id,

        visit_date: dateObj.toISOString().split("T")[0],
        severity_score,
        visit_type: visit_type as Visit["visit_type"],
        length_of_stay,
        lab_result_glucose,
        lab_result_bp,
        previous_visit_gap_days,
        readmitted_within_30_days,
        visit_cost,

        // ✅ keep these also (your interface requires it)
        doctor_name: matchedDoctor!.doctor_name,
        doctor_speciality: matchedDoctor!.doctor_speciality,
      });
    }
  });

  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length },
  };
}


/* =======================
   PRESCRIPTION CSV
======================= */

const PRESCRIPTION_REQUIRED_HEADERS = [
  "prescription_id",
  "visit_id",
  "doctor_name", // ✅ from CSV
  "diagnosis_id",
  "diagnosis_description",
  "drug_name",
  "dosage",
  "quantity",
  "days_supply",
  "prescribed_date",
  "cost",
];

export function parsePrescriptionCSV(
  csvText: string,
  existingPrescriptionIds: string[],
  existingVisitIds: string[] // ✅ use this to validate visit exists
): CSVParseResult<Prescription> {
  const { headers, rows } = parseCSV(csvText);
  const errors: { row: number; message: string }[] = [];
  const valid: Prescription[] = [];

  const missingHeaders = PRESCRIPTION_REQUIRED_HEADERS.filter(
    (h) => !headers.includes(h)
  );

  if (missingHeaders.length > 0) {
    return {
      valid: [],
      errors: [
        {
          row: 0,
          message: `Missing required columns: ${missingHeaders.join(", ")}`,
        },
      ],
      summary: { total: rows.length, valid: 0, invalid: rows.length },
    };
  }

  const headerIndex = PRESCRIPTION_REQUIRED_HEADERS.reduce((acc, h) => {
    acc[h] = headers.indexOf(h);
    return acc;
  }, {} as Record<string, number>);

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors: string[] = [];

    const prescription_id = row[headerIndex.prescription_id]?.trim();
    const visit_id = row[headerIndex.visit_id]?.trim();
    const doctor_name = row[headerIndex.doctor_name]?.trim();
    const diagnosis_id = row[headerIndex.diagnosis_id]?.trim();
    const diagnosis_description = row[headerIndex.diagnosis_description]?.trim();
    const drug_name = row[headerIndex.drug_name]?.trim();
    const dosage = row[headerIndex.dosage]?.trim();
    const quantity_str = row[headerIndex.quantity]?.trim();
    const days_supply_str = row[headerIndex.days_supply]?.trim();
    const prescribed_date = row[headerIndex.prescribed_date]?.trim();
    const cost_str = row[headerIndex.cost]?.trim();

    // ✅ prescription_id
    if (!prescription_id) rowErrors.push("prescription_id is required");
    else if (
      existingPrescriptionIds.includes(prescription_id) ||
      valid.some((p) => p.prescription_id === prescription_id)
    ) {
      rowErrors.push(`prescription_id "${prescription_id}" already exists`);
    }

    // ✅ visit_id
    if (!visit_id) rowErrors.push("visit_id is required");
    else if (!existingVisitIds.includes(visit_id)) {
      rowErrors.push(`visit_id "${visit_id}" does not exist`);
    }

    // ✅ doctor_name
    if (!doctor_name) rowErrors.push("doctor_name is required");

    // ✅ diagnosis
    if (!diagnosis_id) rowErrors.push("diagnosis_id is required");
    if (!diagnosis_description) rowErrors.push("diagnosis_description is required");

    // ✅ drug
    if (!drug_name) rowErrors.push("drug_name is required");
    if (!dosage) rowErrors.push("dosage is required");

    // ✅ date
    const dateObj = new Date(prescribed_date);
    if (isNaN(dateObj.getTime())) {
      rowErrors.push("prescribed_date must be a valid date");
    }

    // ✅ quantity
    const quantity = parseInt(quantity_str);
    if (isNaN(quantity) || quantity <= 0) {
      rowErrors.push("quantity must be a positive integer");
    }

    // ✅ days_supply
    const days_supply = parseInt(days_supply_str);
    if (isNaN(days_supply) || days_supply <= 0) {
      rowErrors.push("days_supply must be a positive integer");
    }

    // ✅ cost
    const cost = parseFloat(cost_str);
    if (isNaN(cost) || cost < 0) {
      rowErrors.push("cost must be a non-negative number");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
    } else {
      valid.push({
        prescription_id,
        visit_id,

        // ✅ backend can overwrite patient_id later if needed
        patient_id: "",

        // ✅ store doctor_name from CSV
        doctor_name,

        diagnosis_id,
        diagnosis_description,

        drug_name,

        // ✅ not in CSV, so empty (or backend can fill)
        drug_category: "",

        dosage,
        quantity,
        days_supply,
        prescribed_date: dateObj.toISOString().split("T")[0],
        cost,
      });
    }
  });

  return {
    valid,
    errors,
    summary: { total: rows.length, valid: valid.length, invalid: errors.length },
  };
}
