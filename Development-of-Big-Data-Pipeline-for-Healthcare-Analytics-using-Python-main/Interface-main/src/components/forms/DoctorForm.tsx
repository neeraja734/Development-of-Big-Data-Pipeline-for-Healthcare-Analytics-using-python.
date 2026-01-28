import React, { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Doctor, DOCTOR_SPECIALTIES } from '@/types/hospital';
import { toast } from 'sonner';
import { API_BASE_URL } from "@/config/api";


interface DoctorFormProps {
  onClose: () => void;
}

export function DoctorForm({ onClose }: DoctorFormProps) {
  const { addDoctor, generateDoctorId, isDoctorUserIdUnique } = useHospital();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    doctor_name: '',
    user_id: '',
    password: '',
    doctor_speciality: DOCTOR_SPECIALTIES[0],
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctor_name?.trim()) newErrors.doctor_name = 'Doctor name is required';
    if (!formData.user_id?.trim()) newErrors.user_id = 'User ID is required';
    else if (!isDoctorUserIdUnique(formData.user_id)) {
      newErrors.user_id = 'User ID already exists';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.doctor_speciality) newErrors.doctor_speciality = 'Specialty is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/doctors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        
        doctor_name: formData.doctor_name,
        user_id: formData.user_id,
        password: formData.password,
        doctor_speciality: formData.doctor_speciality,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save doctor");
    }

    toast.success("Doctor added successfully");

    // update UI immediately
    addDoctor(data);

    onClose();
  } catch (error: any) {
    console.error("SAVE DOCTOR ERROR:", error);
    toast.error(error.message || "Error saving doctor");
  }
};


  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Doctor Name</label>
        <input
          type="text"
          value={formData.doctor_name}
          onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
          placeholder="Dr. John Doe"
          className={`input-healthcare ${errors.doctor_name ? 'border-destructive' : ''}`}
        />
        {errors.doctor_name && <p className="text-xs text-destructive mt-1">{errors.doctor_name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">User ID</label>
        <input
          type="text"
          value={formData.user_id}
          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
          placeholder="dr_username"
          className={`input-healthcare ${errors.user_id ? 'border-destructive' : ''}`}
        />
        {errors.user_id && <p className="text-xs text-destructive mt-1">{errors.user_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className={`input-healthcare pr-10 ${errors.password ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Specialty</label>
        <select
          value={formData.doctor_speciality}
          onChange={(e) => setFormData({ ...formData, doctor_speciality: e.target.value })}
          className={`input-healthcare ${errors.doctor_speciality ? 'border-destructive' : ''}`}
        >
          {DOCTOR_SPECIALTIES.map(specialty => (
            <option key={specialty} value={specialty}>{specialty}</option>
          ))}
        </select>
        {errors.doctor_speciality && <p className="text-xs text-destructive mt-1">{errors.doctor_speciality}</p>}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This doctor will be able to login using the Doctor Portal with the credentials above.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
          <Check className="w-4 h-4" /> Add Doctor
        </button>
      </div>
    </div>
  );
}
