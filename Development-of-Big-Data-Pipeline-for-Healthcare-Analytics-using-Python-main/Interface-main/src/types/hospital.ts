// Backend-ready data models (MongoDB-compatible)

export interface Patient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  phone_number: string;
  email: string;
  emergency_contact: string;
  hospital_location: string;
  bmi: number;
  smoker_status: boolean;
  alcohol_use: boolean;
  chronic_conditions: string[];
  registration_date: string;
  insurance_type: string;
}

export interface Doctor {
  doctor_id: string;
  doctor_name: string;
  user_id: string;
  
  doctor_speciality: string;
}

export interface Visit {
  visit_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_speciality: string;
  visit_date: string;
  severity_score: number; // 0-5 integer
  visit_type: 'OP' | 'IP';
  length_of_stay: number;
  lab_result_glucose: number;
  lab_result_bp: number;
  previous_visit_gap_days: number;
  readmitted_within_30_days: boolean;
  visit_cost: number;
}

export interface Prescription {
  prescription_id: string;
  visit_id: string;
  patient_id: string;
  doctor_name: string;
  diagnosis_id: string;
  diagnosis_description: string;
  drug_name: string;
  drug_category: string;
  dosage: string;
  quantity: number;
  days_supply: number;
  prescribed_date: string;
  cost: number;
}

export type UserRole = 'admin' | 'doctor';

export interface User {
  user_id: string;
  role: UserRole;
  doctor_id?: string;
  doctor_name?: string;
  doctor_speciality?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type SeverityChange = 'increased' | 'improved' | 'unchanged' | 'first-visit';

// Static data
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CHRONIC_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Arthritis',
  'COPD',
  'Kidney Disease',
  'Thyroid Disorder',
  'Depression',
  'Anxiety'
];

export const DOCTOR_SPECIALTIES = [
  'cardiology',
  'neurology',
  'orthopedics',
  'pediatrics',
  'dermatology',
  'gastroenterology',
  'oncology',
  'psychiatry',
  'general',
  'surgery',
  'endocrinology',
  'pulmonology',
  'nephrology'
];

export const DRUGS_BY_SPECIALTY: Record<string, { name: string; category: string }[]> = {
  'cardiology': [
    { name: 'Aspirin', category: 'Antiplatelet' },
    { name: 'Atorvastatin', category: 'Statin' },
    { name: 'Metoprolol', category: 'Beta Blocker' },
    { name: 'Lisinopril', category: 'ACE Inhibitor' },
    { name: 'Amlodipine', category: 'Calcium Channel Blocker' },
    { name: 'Warfarin', category: 'Anticoagulant' },
    { name: 'Clopidogrel', category: 'Antiplatelet' },
    { name: 'Furosemide', category: 'Diuretic' },
    { name: 'Digoxin', category: 'Cardiac Glycoside' },
    { name: 'Nitroglycerin', category: 'Nitrate' },
    { name: 'Carvedilol', category: 'Beta Blocker' },
    { name: 'Losartan', category: 'ARB' },
    { name: 'Spironolactone', category: 'Diuretic' },
    { name: 'Rivaroxaban', category: 'Anticoagulant' },
    { name: 'Amiodarone', category: 'Antiarrhythmic' },
  ],
  'neurology': [
    { name: 'Levodopa', category: 'Dopamine Precursor' },
    { name: 'Gabapentin', category: 'Anticonvulsant' },
    { name: 'Topiramate', category: 'Anticonvulsant' },
    { name: 'Donepezil', category: 'Cholinesterase Inhibitor' },
    { name: 'Sumatriptan', category: 'Triptan' },
    { name: 'Pregabalin', category: 'Anticonvulsant' },
    { name: 'Carbamazepine', category: 'Anticonvulsant' },
    { name: 'Valproic Acid', category: 'Anticonvulsant' },
    { name: 'Memantine', category: 'NMDA Antagonist' },
    { name: 'Ropinirole', category: 'Dopamine Agonist' },
    { name: 'Lamotrigine', category: 'Anticonvulsant' },
    { name: 'Rizatriptan', category: 'Triptan' },
    { name: 'Baclofen', category: 'Muscle Relaxant' },
    { name: 'Phenytoin', category: 'Anticonvulsant' },
    { name: 'Riluzole', category: 'Neuroprotective' },
  ],
  'orthopedics': [
    { name: 'Ibuprofen', category: 'NSAID' },
    { name: 'Naproxen', category: 'NSAID' },
    { name: 'Celecoxib', category: 'COX-2 Inhibitor' },
    { name: 'Tramadol', category: 'Opioid' },
    { name: 'Cyclobenzaprine', category: 'Muscle Relaxant' },
    { name: 'Meloxicam', category: 'NSAID' },
    { name: 'Diclofenac', category: 'NSAID' },
    { name: 'Acetaminophen', category: 'Analgesic' },
    { name: 'Methocarbamol', category: 'Muscle Relaxant' },
    { name: 'Alendronate', category: 'Bisphosphonate' },
    { name: 'Tizanidine', category: 'Muscle Relaxant' },
    { name: 'Hydrocodone', category: 'Opioid' },
    { name: 'Prednisone', category: 'Corticosteroid' },
    { name: 'Risedronate', category: 'Bisphosphonate' },
    { name: 'Ketorolac', category: 'NSAID' },
  ],
  'pediatrics': [
    { name: 'Amoxicillin', category: 'Antibiotic' },
    { name: 'Azithromycin', category: 'Antibiotic' },
    { name: 'Acetaminophen', category: 'Analgesic' },
    { name: 'Ibuprofen', category: 'NSAID' },
    { name: 'Cetirizine', category: 'Antihistamine' },
    { name: 'Albuterol', category: 'Bronchodilator' },
    { name: 'Diphenhydramine', category: 'Antihistamine' },
    { name: 'Prednisolone', category: 'Corticosteroid' },
    { name: 'Cephalexin', category: 'Antibiotic' },
    { name: 'Loratadine', category: 'Antihistamine' },
    { name: 'Fluticasone', category: 'Corticosteroid' },
    { name: 'Montelukast', category: 'Leukotriene Inhibitor' },
    { name: 'Omeprazole', category: 'PPI' },
    { name: 'Ondansetron', category: 'Antiemetic' },
    { name: 'Cefdinir', category: 'Antibiotic' },
  ],
  'dermatology': [
    { name: 'Hydrocortisone', category: 'Corticosteroid' },
    { name: 'Tretinoin', category: 'Retinoid' },
    { name: 'Clindamycin', category: 'Antibiotic' },
    { name: 'Ketoconazole', category: 'Antifungal' },
    { name: 'Benzoyl Peroxide', category: 'Keratolytic' },
    { name: 'Tacrolimus', category: 'Immunomodulator' },
    { name: 'Clobetasol', category: 'Corticosteroid' },
    { name: 'Isotretinoin', category: 'Retinoid' },
    { name: 'Doxycycline', category: 'Antibiotic' },
    { name: 'Terbinafine', category: 'Antifungal' },
    { name: 'Mupirocin', category: 'Antibiotic' },
    { name: 'Adapalene', category: 'Retinoid' },
    { name: 'Fluocinonide', category: 'Corticosteroid' },
    { name: 'Azelaic Acid', category: 'Keratolytic' },
    { name: 'Methotrexate', category: 'Immunosuppressant' },
  ],
  'gastroenterology': [
    { name: 'Omeprazole', category: 'PPI' },
    { name: 'Pantoprazole', category: 'PPI' },
    { name: 'Metoclopramide', category: 'Prokinetic' },
    { name: 'Mesalamine', category: 'Aminosalicylate' },
    { name: 'Ondansetron', category: 'Antiemetic' },
    { name: 'Lactulose', category: 'Laxative' },
    { name: 'Sucralfate', category: 'Mucosal Protectant' },
    { name: 'Loperamide', category: 'Antidiarrheal' },
    { name: 'Infliximab', category: 'Biologic' },
    { name: 'Ursodiol', category: 'Bile Acid' },
    { name: 'Famotidine', category: 'H2 Blocker' },
    { name: 'Rifaximin', category: 'Antibiotic' },
    { name: 'Adalimumab', category: 'Biologic' },
    { name: 'Budesonide', category: 'Corticosteroid' },
    { name: 'PEG 3350', category: 'Laxative' },
  ],
  'oncology': [
    { name: 'Paclitaxel', category: 'Chemotherapy' },
    { name: 'Cisplatin', category: 'Chemotherapy' },
    { name: 'Doxorubicin', category: 'Chemotherapy' },
    { name: 'Tamoxifen', category: 'Hormone Therapy' },
    { name: 'Imatinib', category: 'Targeted Therapy' },
    { name: 'Rituximab', category: 'Immunotherapy' },
    { name: 'Methotrexate', category: 'Chemotherapy' },
    { name: 'Pembrolizumab', category: 'Immunotherapy' },
    { name: 'Letrozole', category: 'Hormone Therapy' },
    { name: 'Ondansetron', category: 'Antiemetic' },
    { name: 'Filgrastim', category: 'Growth Factor' },
    { name: 'Bevacizumab', category: 'Targeted Therapy' },
    { name: 'Carboplatin', category: 'Chemotherapy' },
    { name: 'Anastrozole', category: 'Hormone Therapy' },
    { name: 'Trastuzumab', category: 'Targeted Therapy' },
  ],
  'psychiatry': [
    { name: 'Sertraline', category: 'SSRI' },
    { name: 'Fluoxetine', category: 'SSRI' },
    { name: 'Escitalopram', category: 'SSRI' },
    { name: 'Quetiapine', category: 'Antipsychotic' },
    { name: 'Alprazolam', category: 'Benzodiazepine' },
    { name: 'Bupropion', category: 'Antidepressant' },
    { name: 'Lorazepam', category: 'Benzodiazepine' },
    { name: 'Risperidone', category: 'Antipsychotic' },
    { name: 'Venlafaxine', category: 'SNRI' },
    { name: 'Lithium', category: 'Mood Stabilizer' },
    { name: 'Aripiprazole', category: 'Antipsychotic' },
    { name: 'Duloxetine', category: 'SNRI' },
    { name: 'Clonazepam', category: 'Benzodiazepine' },
    { name: 'Olanzapine', category: 'Antipsychotic' },
    { name: 'Trazodone', category: 'Antidepressant' },
  ],
  'general': [
    { name: 'Amoxicillin', category: 'Antibiotic' },
    { name: 'Metformin', category: 'Antidiabetic' },
    { name: 'Lisinopril', category: 'ACE Inhibitor' },
    { name: 'Atorvastatin', category: 'Statin' },
    { name: 'Levothyroxine', category: 'Thyroid Hormone' },
    { name: 'Omeprazole', category: 'PPI' },
    { name: 'Amlodipine', category: 'Calcium Channel Blocker' },
    { name: 'Metoprolol', category: 'Beta Blocker' },
    { name: 'Prednisone', category: 'Corticosteroid' },
    { name: 'Gabapentin', category: 'Anticonvulsant' },
    { name: 'Losartan', category: 'ARB' },
    { name: 'Hydrochlorothiazide', category: 'Diuretic' },
    { name: 'Ciprofloxacin', category: 'Antibiotic' },
    { name: 'Azithromycin', category: 'Antibiotic' },
    { name: 'Tramadol', category: 'Opioid' },
  ],
  'surgery': [
    { name: 'Cefazolin', category: 'Antibiotic' },
    { name: 'Morphine', category: 'Opioid' },
    { name: 'Ketorolac', category: 'NSAID' },
    { name: 'Heparin', category: 'Anticoagulant' },
    { name: 'Ondansetron', category: 'Antiemetic' },
    { name: 'Metoclopramide', category: 'Prokinetic' },
    { name: 'Fentanyl', category: 'Opioid' },
    { name: 'Enoxaparin', category: 'Anticoagulant' },
    { name: 'Vancomycin', category: 'Antibiotic' },
    { name: 'Hydromorphone', category: 'Opioid' },
    { name: 'Metronidazole', category: 'Antibiotic' },
    { name: 'Famotidine', category: 'H2 Blocker' },
    { name: 'Acetaminophen', category: 'Analgesic' },
    { name: 'Oxycodone', category: 'Opioid' },
    { name: 'Ceftriaxone', category: 'Antibiotic' },
  ],
  endocrinology: [
    { name: "Metformin", category: "Antidiabetic" },
    { name: "Insulin", category: "Hormone" },
    { name: "Glimepiride", category: "Antidiabetic" },
    { name: "Sitagliptin", category: "Antidiabetic" },
    { name: "Levothyroxine", category: "Thyroid Hormone" },
  ],
  pulmonology: [
    { name: "Albuterol", category: "Bronchodilator" },
    { name: "Budesonide", category: "Corticosteroid" },
    { name: "Montelukast", category: "Leukotriene Inhibitor" },
    { name: "Tiotropium", category: "Bronchodilator" },
    { name: "Prednisone", category: "Corticosteroid" },
  ],
  
   nephrology: [
    { name: "Furosemide", category: "Diuretic" },
    { name: "Erythropoietin", category: "Hormone" },
    { name: "Sevelamer", category: "Phosphate Binder" },
    { name: "Losartan", category: "ARB" },
    { name: "Amlodipine", category: "Calcium Channel Blocker" },
  ],

};

// Demo credentials
export const DEMO_CREDENTIALS = {
  admin: { user_id: 'admin_hospital', password: 'admin123' },
  doctors: [
    { user_id: 'dr_cardiology', password: 'doctor123', doctor_id: 'DOC001', doctor_name: 'Dr. Sarah Johnson', doctor_speciality: 'Cardiology' },
    { user_id: 'dr_neuro', password: 'doctor123', doctor_id: 'DOC002', doctor_name: 'Dr. Michael Chen', doctor_speciality: 'Neurology' },
  ]
};
