import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Prescription, DRUGS_BY_SPECIALTY } from '@/types/hospital';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

interface PrescriptionFormProps {
  onClose: () => void;
  doctorId: string;
  doctorSpecialty: string;
}

export function PrescriptionForm({ onClose, doctorId, doctorSpecialty }: PrescriptionFormProps) {
  const { 
    state, addPrescription, generatePrescriptionId, 
    getVisitsByDoctor, getVisitById, getPatientById 
  } = useHospital();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const doctorVisits = getVisitsByDoctor(doctorId);
  const availableDrugs = DRUGS_BY_SPECIALTY[doctorSpecialty] || [];

  const [formData, setFormData] = useState<Partial<Prescription>>({
    prescription_id: generatePrescriptionId(),
    visit_id: '',
    patient_id: '',
    doctor_id: doctorId,
    diagnosis_id: '',
    diagnosis_description: '',
    drug_name: availableDrugs[0]?.name || '',
    drug_category: availableDrugs[0]?.category || '',
    dosage: '',
    quantity: 1,
    days_supply: 7,
    prescribed_date: new Date().toISOString().split('T')[0],
    cost: 0,
  });

  useEffect(() => {
    if (formData.visit_id) {
      const visit = getVisitById(formData.visit_id);
      if (visit) {
        setFormData(prev => ({ ...prev, patient_id: visit.patient_id }));
      }
    }
  }, [formData.visit_id, getVisitById]);

  useEffect(() => {
    const drug = availableDrugs.find(d => d.name === formData.drug_name);
    if (drug) {
      setFormData(prev => ({ ...prev, drug_category: drug.category }));
    }
  }, [formData.drug_name, availableDrugs]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.visit_id) newErrors.visit_id = 'Visit is required';
    if (!formData.diagnosis_id?.trim()) newErrors.diagnosis_id = 'Diagnosis ID is required';
    if (!formData.diagnosis_description?.trim()) newErrors.diagnosis_description = 'Diagnosis description is required';
    if (!formData.drug_name) newErrors.drug_name = 'Drug is required';
    if (!formData.dosage?.trim()) newErrors.dosage = 'Dosage is required';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!formData.days_supply || formData.days_supply < 1) newErrors.days_supply = 'Days supply must be at least 1';
    if (!formData.prescribed_date) newErrors.prescribed_date = 'Date is required';
    if (formData.cost === undefined || formData.cost < 0) newErrors.cost = 'Cost is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to save prescription");
    }

    const saved = await response.json();

    // 👇 THIS MAKES IT APPEAR IN UI IMMEDIATELY
    addPrescription(saved.prescription || saved);

    toast.success("Prescription added successfully");
    onClose();
  } catch (error) {
    console.error(error);
    toast.error("Error saving prescription");
  }
};


  const selectedVisit = formData.visit_id ? getVisitById(formData.visit_id) : null;
  const selectedPatient = selectedVisit ? getPatientById(selectedVisit.patient_id) : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Visit</label>
        <select
          value={formData.visit_id}
          onChange={(e) => setFormData({ ...formData, visit_id: e.target.value })}
          className={`input-healthcare ${errors.visit_id ? 'border-destructive' : ''}`}
        >
          <option value="">Select a visit</option>
          {doctorVisits.map(visit => {
            const patient = getPatientById(visit.patient_id);
            return (
              <option key={visit.visit_id} value={visit.visit_id}>
                {visit.visit_id} - {patient?.full_name || visit.patient_id} ({visit.visit_date})
              </option>
            );
          })}
        </select>
        {selectedPatient && (
          <p className="text-xs text-muted-foreground mt-1">
            Patient: {selectedPatient.full_name} ({selectedPatient.patient_id})
          </p>
        )}
        {errors.visit_id && <p className="text-xs text-destructive mt-1">{errors.visit_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Diagnosis ID</label>
          <input
            type="text"
            value={formData.diagnosis_id}
            onChange={(e) => setFormData({ ...formData, diagnosis_id: e.target.value })}
            placeholder="ICD-10 code"
            className={`input-healthcare ${errors.diagnosis_id ? 'border-destructive' : ''}`}
          />
          {errors.diagnosis_id && <p className="text-xs text-destructive mt-1">{errors.diagnosis_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Prescribed Date</label>
          <input
            type="date"
            value={formData.prescribed_date}
            onChange={(e) => setFormData({ ...formData, prescribed_date: e.target.value })}
            className={`input-healthcare ${errors.prescribed_date ? 'border-destructive' : ''}`}
          />
          {errors.prescribed_date && <p className="text-xs text-destructive mt-1">{errors.prescribed_date}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Diagnosis Description</label>
        <textarea
          value={formData.diagnosis_description}
          onChange={(e) => setFormData({ ...formData, diagnosis_description: e.target.value })}
          rows={2}
          className={`input-healthcare ${errors.diagnosis_description ? 'border-destructive' : ''}`}
        />
        {errors.diagnosis_description && <p className="text-xs text-destructive mt-1">{errors.diagnosis_description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Drug</label>
          <select
            value={formData.drug_name}
            onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
            className={`input-healthcare ${errors.drug_name ? 'border-destructive' : ''}`}
          >
            {availableDrugs.map(drug => (
              <option key={drug.name} value={drug.name}>
                {drug.name}
              </option>
            ))}
          </select>
          {errors.drug_name && <p className="text-xs text-destructive mt-1">{errors.drug_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Drug Category</label>
          <input
            type="text"
            value={formData.drug_category}
            readOnly
            className="input-healthcare bg-muted"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Dosage</label>
        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          placeholder="e.g., 500mg twice daily"
          className={`input-healthcare ${errors.dosage ? 'border-destructive' : ''}`}
        />
        {errors.dosage && <p className="text-xs text-destructive mt-1">{errors.dosage}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            className={`input-healthcare ${errors.quantity ? 'border-destructive' : ''}`}
          />
          {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Days Supply</label>
          <input
            type="number"
            min="1"
            value={formData.days_supply}
            onChange={(e) => setFormData({ ...formData, days_supply: parseInt(e.target.value) || 1 })}
            className={`input-healthcare ${errors.days_supply ? 'border-destructive' : ''}`}
          />
          {errors.days_supply && <p className="text-xs text-destructive mt-1">{errors.days_supply}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            className={`input-healthcare ${errors.cost ? 'border-destructive' : ''}`}
          />
          {errors.cost && <p className="text-xs text-destructive mt-1">{errors.cost}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
          <Check className="w-4 h-4" /> Add Prescription
        </button>
      </div>
    </div>
  );
}
