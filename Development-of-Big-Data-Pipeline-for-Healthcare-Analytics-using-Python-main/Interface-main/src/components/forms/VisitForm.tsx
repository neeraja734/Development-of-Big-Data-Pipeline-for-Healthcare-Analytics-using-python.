import React, { useState, useEffect } from 'react';
import { Check, Search } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Visit } from '@/types/hospital';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface VisitFormProps {
  onClose: () => void;
  visit?: Visit;
}

export function VisitForm({ onClose, visit }: VisitFormProps) {
  const { 
    state, addVisit, updateVisit, generateVisitId, isVisitIdUnique, 
    getPatientById, getDoctorById 
  } = useHospital();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [formData, setFormData] = useState<Partial<Visit>>({
    visit_id: visit?.visit_id || generateVisitId(),
    patient_id: visit?.patient_id || '',
    doctor_id: visit?.doctor_id || '',

    // ✅ NEW: store doctor_name + doctor_speciality
    doctor_name: (visit as any)?.doctor_name || '',
    doctor_speciality: (visit as any)?.doctor_speciality || '',

    visit_date: visit?.visit_date || new Date().toISOString().split('T')[0],
    severity_score: visit?.severity_score || 0,
    visit_type: visit?.visit_type || 'OP',
    length_of_stay: visit?.length_of_stay || 0,
    lab_result_glucose: visit?.lab_result_glucose || 0,

    // ✅ lab_result_bp as number
    lab_result_bp: visit?.lab_result_bp ?? 120,

    previous_visit_gap_days: visit?.previous_visit_gap_days || 0,
    readmitted_within_30_days: visit?.readmitted_within_30_days || false,
    visit_cost: visit?.visit_cost || 0,
  });

  const [selectedPatient, setSelectedPatient] = useState(
    visit ? getPatientById(visit.patient_id) : undefined
  );
  const [selectedDoctor, setSelectedDoctor] = useState(
    visit ? getDoctorById(visit.doctor_id) : undefined
  );

  const filteredPatients = state.patients.filter(p =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    if (formData.visit_type === 'OP') {
      setFormData(prev => ({ ...prev, length_of_stay: 0, readmitted_within_30_days: false }));
    }
  }, [formData.visit_type]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.visit_id) newErrors.visit_id = 'Visit ID is required';
    else if (!visit && !isVisitIdUnique(formData.visit_id)) {
      newErrors.visit_id = 'Visit ID already exists';
    }

    if (!formData.patient_id) newErrors.patient_id = 'Patient is required';
    if (!formData.doctor_id) newErrors.doctor_id = 'Doctor is required';

    // ✅ NEW: validate doctor_name + doctor_speciality also
    if (!formData.doctor_name) newErrors.doctor_id = 'Doctor is required';
    if (!formData.doctor_speciality) newErrors.doctor_id = 'Doctor is required';

    if (!formData.visit_date) newErrors.visit_date = 'Visit date is required';

    if (formData.severity_score === undefined || formData.severity_score < 0 || formData.severity_score > 5) {
      newErrors.severity_score = 'Severity score must be 0-5';
    }

    if (!Number.isInteger(formData.severity_score)) {
      newErrors.severity_score = 'Severity score must be an integer';
    }

    if (formData.visit_type === 'IP' && (!formData.length_of_stay || formData.length_of_stay < 1)) {
      newErrors.length_of_stay = 'Length of stay must be at least 1 for IP';
    }

    if (!formData.lab_result_glucose || formData.lab_result_glucose < 0) {
      newErrors.lab_result_glucose = 'Glucose level is required';
    }

    if (formData.lab_result_bp === undefined || formData.lab_result_bp === null) {
      newErrors.lab_result_bp = 'Blood pressure is required';
    }

    if (formData.visit_cost === undefined || formData.visit_cost < 0) {
      newErrors.visit_cost = 'Visit cost is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/visits`, {
        method: visit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save visit");
      }

      const savedVisit = await response.json();

      // 👇 THIS MAKES IT APPEAR IN UI
      addVisit(savedVisit.visit);

      toast.success(visit ? "Visit updated successfully" : "Visit added successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error saving visit");
    }
  };

  const handlePatientSelect = (patient: typeof state.patients[0]) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patient_id: patient.patient_id });
    setPatientSearch(patient.full_name);
    setShowPatientDropdown(false);
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = getDoctorById(doctorId);
    setSelectedDoctor(doctor);

    // ✅ store doctor_name + speciality into visit
    setFormData({ 
      ...formData, 
      doctor_id: doctorId,
      doctor_name: doctor?.doctor_name || '',
      doctor_speciality: doctor?.doctor_speciality || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Visit ID</label>
          <input
            type="text"
            value={formData.visit_id}
            onChange={(e) => setFormData({ ...formData, visit_id: e.target.value })}
            className={`input-healthcare ${errors.visit_id ? 'border-destructive' : ''}`}
          />
          {errors.visit_id && <p className="text-xs text-destructive mt-1">{errors.visit_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Visit Date</label>
          <input
            type="date"
            value={formData.visit_date}
            onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            className={`input-healthcare ${errors.visit_date ? 'border-destructive' : ''}`}
          />
          {errors.visit_date && <p className="text-xs text-destructive mt-1">{errors.visit_date}</p>}
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">Patient</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setShowPatientDropdown(true);
            }}
            onFocus={() => setShowPatientDropdown(true)}
            placeholder="Search patients..."
            className={`input-healthcare pl-10 ${errors.patient_id ? 'border-destructive' : ''}`}
          />
        </div>
        {showPatientDropdown && filteredPatients.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
            {filteredPatients.map(patient => (
              <button
                key={patient.patient_id}
                type="button"
                onClick={() => handlePatientSelect(patient)}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium text-foreground">{patient.full_name}</p>
                <p className="text-xs text-muted-foreground">{patient.patient_id}</p>
              </button>
            ))}
          </div>
        )}
        {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Doctor</label>
        <select
          value={formData.doctor_id}
          onChange={(e) => handleDoctorSelect(e.target.value)}
          className={`input-healthcare ${errors.doctor_id ? 'border-destructive' : ''}`}
        >
          <option value="">Select a doctor</option>
          {state.doctors.map(doctor => (
            <option key={doctor.doctor_id} value={doctor.doctor_id}>
              {doctor.doctor_name} - {doctor.doctor_speciality}
            </option>
          ))}
        </select>
        {selectedDoctor && (
          <p className="text-xs text-muted-foreground mt-1">Specialty: {selectedDoctor.doctor_speciality}</p>
        )}
        {errors.doctor_id && <p className="text-xs text-destructive mt-1">{errors.doctor_id}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Severity Score (0-5)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            step="1"
            value={formData.severity_score}
            onChange={(e) => setFormData({ ...formData, severity_score: parseInt(e.target.value) || 0 })}
            className={`input-healthcare ${errors.severity_score ? 'border-destructive' : ''}`}
          />
          {errors.severity_score && <p className="text-xs text-destructive mt-1">{errors.severity_score}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Visit Type</label>
          <select
            value={formData.visit_type}
            onChange={(e) => setFormData({ ...formData, visit_type: e.target.value as Visit['visit_type'] })}
            className="input-healthcare"
          >
            <option value="OP">Outpatient (OP)</option>
            <option value="IP">Inpatient (IP)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Length of Stay</label>
          <input
            type="number"
            min="0"
            value={formData.length_of_stay}
            onChange={(e) => setFormData({ ...formData, length_of_stay: parseInt(e.target.value) || 0 })}
            disabled={formData.visit_type === 'OP'}
            className={`input-healthcare ${formData.visit_type === 'OP' ? 'opacity-50' : ''} ${errors.length_of_stay ? 'border-destructive' : ''}`}
          />
          {errors.length_of_stay && <p className="text-xs text-destructive mt-1">{errors.length_of_stay}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Lab Result - Glucose</label>
          <input
            type="number"
            step="0.1"
            value={formData.lab_result_glucose}
            onChange={(e) => setFormData({ ...formData, lab_result_glucose: parseFloat(e.target.value) || 0 })}
            className={`input-healthcare ${errors.lab_result_glucose ? 'border-destructive' : ''}`}
          />
          {errors.lab_result_glucose && <p className="text-xs text-destructive mt-1">{errors.lab_result_glucose}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Lab Result - BP
          </label>

          <input
            type="number"
            placeholder="120"
            value={formData.lab_result_bp}
            onChange={(e) =>
              setFormData({ ...formData, lab_result_bp: Number(e.target.value) })
            }
            className={`input-healthcare ${errors.lab_result_bp ? "border-destructive" : ""}`}
          />

          {errors.lab_result_bp && (
            <p className="text-xs text-destructive mt-1">{errors.lab_result_bp}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Previous Visit Gap (days)</label>
          <input
            type="number"
            min="0"
            value={formData.previous_visit_gap_days}
            onChange={(e) => setFormData({ ...formData, previous_visit_gap_days: parseInt(e.target.value) || 0 })}
            className="input-healthcare"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Visit Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.visit_cost}
            onChange={(e) => setFormData({ ...formData, visit_cost: parseFloat(e.target.value) || 0 })}
            className={`input-healthcare ${errors.visit_cost ? 'border-destructive' : ''}`}
          />
          {errors.visit_cost && <p className="text-xs text-destructive mt-1">{errors.visit_cost}</p>}
        </div>
        <div className="flex items-end">
          <label className={`flex items-center gap-2 cursor-pointer ${formData.visit_type === 'OP' ? 'opacity-50' : ''}`}>
            <input
              type="checkbox"
              checked={formData.readmitted_within_30_days}
              onChange={(e) => setFormData({ ...formData, readmitted_within_30_days: e.target.checked })}
              disabled={formData.visit_type === 'OP'}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Readmitted (30 days)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
          <Check className="w-4 h-4" /> {visit ? 'Update' : 'Add'} Visit
        </button>
      </div>
    </div>
  );
}
