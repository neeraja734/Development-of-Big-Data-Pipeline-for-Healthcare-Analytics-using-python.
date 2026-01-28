import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Patient, BLOOD_GROUPS, CHRONIC_CONDITIONS } from '@/types/hospital';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface PatientFormProps {
  onClose: () => void;
  patient?: Patient;
}

export function PatientForm({ onClose, patient }: PatientFormProps) {
  const { addPatient, updatePatient, generatePatientId, isPatientIdUnique } = useHospital();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Patient>>({
    patient_id: patient?.patient_id || generatePatientId(),
    full_name: patient?.full_name || '',
    age: patient?.age || 0,
    gender: patient?.gender || 'Male',
    blood_group: patient?.blood_group || 'O+',
    phone_number: patient?.phone_number || '',
    email: patient?.email || '',
    emergency_contact: patient?.emergency_contact || '',
    hospital_location: patient?.hospital_location || '',
    bmi: patient?.bmi || 0,
    smoker_status: patient?.smoker_status || false,
    alcohol_use: patient?.alcohol_use || false,
    chronic_conditions: patient?.chronic_conditions || [],
    registration_date: patient?.registration_date || new Date().toISOString().split('T')[0],
    insurance_type: patient?.insurance_type || '',
  });

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id) newErrors.patient_id = 'Patient ID is required';
    else if (!patient && !isPatientIdUnique(formData.patient_id)) {
      newErrors.patient_id = 'Patient ID already exists';
    }
    if (!formData.full_name?.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.age || formData.age < 0 || formData.age > 150) {
      newErrors.age = 'Age must be between 0-150';
    }
    if (!formData.phone_number?.trim()) newErrors.phone_number = 'Phone number is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.emergency_contact?.trim()) newErrors.emergency_contact = 'Emergency contact is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hospital_location?.trim()) newErrors.hospital_location = 'Hospital location is required';
    if (!formData.bmi || formData.bmi < 10 || formData.bmi > 100) {
      newErrors.bmi = 'BMI must be between 10-100';
    }
    if (!formData.registration_date) newErrors.registration_date = 'Registration date is required';
    if (!formData.insurance_type?.trim()) newErrors.insurance_type = 'Insurance type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };
  
const handleSubmit = async () => {
  if (!validateStep2()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: patient ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to save patient");
    }

    const savedPatient = await response.json();
    console.log("Saved to MongoDB:", savedPatient);
    addPatient(savedPatient.patient);


    toast.success(patient ? "Patient updated successfully" : "Patient added successfully");
    
    onClose();
  } catch (error) {
    console.error(error);
    toast.error("Error saving patient to database");


  }
};


  const handleConditionToggle = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions?.includes(condition)
        ? prev.chronic_conditions.filter(c => c !== condition)
        : [...(prev.chronic_conditions || []), condition],
    }));
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {step > 1 ? <Check className="w-4 h-4" /> : '1'}
        </div>
        <div className={`w-20 h-1 mx-2 rounded ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-6">
        {step === 1 ? 'Step 1: Personal Details' : 'Step 2: Clinical & Registration'}
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Patient ID
              </label>
              <input
                type="text"
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className={`input-healthcare ${errors.patient_id ? 'border-destructive' : ''}`}
              />
              {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`input-healthcare ${errors.full_name ? 'border-destructive' : ''}`}
              />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Age</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className={`input-healthcare ${errors.age ? 'border-destructive' : ''}`}
              />
              {errors.age && <p className="text-xs text-destructive mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Patient['gender'] })}
                className="input-healthcare"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="input-healthcare"
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className={`input-healthcare ${errors.phone_number ? 'border-destructive' : ''}`}
            />
            {errors.phone_number && <p className="text-xs text-destructive mt-1">{errors.phone_number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input-healthcare ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Emergency Contact</label>
            <input
              type="text"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              className={`input-healthcare ${errors.emergency_contact ? 'border-destructive' : ''}`}
            />
            {errors.emergency_contact && <p className="text-xs text-destructive mt-1">{errors.emergency_contact}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Hospital Location</label>
            <input
              type="text"
              value={formData.hospital_location}
              onChange={(e) => setFormData({ ...formData, hospital_location: e.target.value })}
              className={`input-healthcare ${errors.hospital_location ? 'border-destructive' : ''}`}
            />
            {errors.hospital_location && <p className="text-xs text-destructive mt-1">{errors.hospital_location}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">BMI</label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi || ''}
                onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                className={`input-healthcare ${errors.bmi ? 'border-destructive' : ''}`}
              />
              {errors.bmi && <p className="text-xs text-destructive mt-1">{errors.bmi}</p>}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smoker_status}
                  onChange={(e) => setFormData({ ...formData, smoker_status: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Smoker</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alcohol_use}
                  onChange={(e) => setFormData({ ...formData, alcohol_use: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Alcohol Use</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Chronic Conditions
            </label>
            <div className="flex flex-wrap gap-2">
              {CHRONIC_CONDITIONS.map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => handleConditionToggle(condition)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.chronic_conditions?.includes(condition)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Registration Date</label>
              <input
                type="date"
                value={formData.registration_date}
                onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                className={`input-healthcare ${errors.registration_date ? 'border-destructive' : ''}`}
              />
              {errors.registration_date && <p className="text-xs text-destructive mt-1">{errors.registration_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Insurance Type</label>
              <input
                type="text"
                value={formData.insurance_type}
                onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                className={`input-healthcare ${errors.insurance_type ? 'border-destructive' : ''}`}
              />
              {errors.insurance_type && <p className="text-xs text-destructive mt-1">{errors.insurance_type}</p>}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" /> {patient ? 'Update' : 'Add'} Patient
              
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
}
