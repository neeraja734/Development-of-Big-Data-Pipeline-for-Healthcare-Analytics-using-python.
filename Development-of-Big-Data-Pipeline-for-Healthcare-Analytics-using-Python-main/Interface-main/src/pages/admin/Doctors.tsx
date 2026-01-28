import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { DoctorForm } from '@/components/forms/DoctorForm';
import { Doctor, DEMO_CREDENTIALS } from '@/types/hospital';
import { toast } from 'sonner';

export default function Doctors() {
  const { state, deleteDoctor, getVisitsByDoctor } = useHospital();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredDoctors = useMemo(() => {
    const searchLower = search.toLowerCase();
    return state.doctors.filter(d =>
      d.doctor_name.toLowerCase().includes(searchLower) ||
      d.doctor_id.toLowerCase().includes(searchLower) ||
      d.doctor_speciality.toLowerCase().includes(searchLower) ||
      d.user_id.toLowerCase().includes(searchLower)
    );
  }, [state.doctors, search]);

  const isDemoDoctor = (doctor: Doctor) => {
    return DEMO_CREDENTIALS.doctors.some(d => d.user_id === doctor.user_id);
  };

  const handleDelete = (doctor: Doctor) => {
    if (isDemoDoctor(doctor)) {
      toast.error('Cannot delete demo doctors');
      return;
    }
    const visits = getVisitsByDoctor(doctor.doctor_id);
    if (visits.length > 0) {
      toast.error('Cannot delete doctor with existing visits');
      return;
    }
    if (confirm(`Are you sure you want to delete ${doctor.doctor_name}?`)) {
      deleteDoctor(doctor.doctor_id);
      toast.success('Doctor deleted successfully');
    }
  };

  const columns = [
    {
      key: 'doctor_id',
      header: 'Doctor ID',
      render: (doctor: Doctor) => (
        <span className="font-mono text-sm text-foreground">{doctor.doctor_id}</span>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Name',
      render: (doctor: Doctor) => (
        <div>
          <p className="font-medium text-foreground">{doctor.doctor_name}</p>
          <p className="text-xs text-muted-foreground">{doctor.user_id}</p>
        </div>
      ),
    },
    {
      key: 'doctor_speciality',
      header: 'Specialty',
      render: (doctor: Doctor) => (
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {doctor.doctor_speciality}
        </span>
      ),
    },
    {
      key: 'visits',
      header: 'Total Visits',
      render: (doctor: Doctor) => {
        const visitCount = getVisitsByDoctor(doctor.doctor_id).length;
        return (
          <span className="font-medium text-foreground">{visitCount}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (doctor: Doctor) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isDemoDoctor(doctor)
            ? 'bg-accent/10 text-accent'
            : 'bg-success/10 text-success'
        }`}>
          {isDemoDoctor(doctor) ? 'Demo' : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (doctor: Doctor) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(doctor);
            }}
            disabled={isDemoDoctor(doctor)}
            className={`p-2 rounded-lg transition-colors ${
              isDemoDoctor(doctor)
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted-foreground mt-1">Manage doctor records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search doctors by name, ID, or specialty..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredDoctors.length} of {state.doctors.length} doctors
        </div>
      </div>

      <DataTable
        data={filteredDoctors}
        columns={columns}
        emptyMessage="No doctors found"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Doctor"
        size="md"
      >
        <DoctorForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
