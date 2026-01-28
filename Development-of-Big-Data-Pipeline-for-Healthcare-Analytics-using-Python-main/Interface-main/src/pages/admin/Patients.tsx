import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { PatientForm } from '@/components/forms/PatientForm';
import { Patient } from '@/types/hospital';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Patients() {
  const { state, deletePatient, getVisitsByPatient } = useHospital();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();

  const filteredPatients = useMemo(() => {
    const searchLower = search.toLowerCase();
    return state.patients.filter(p =>
      p.full_name.toLowerCase().includes(searchLower) ||
      p.patient_id.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower)
    );
  }, [state.patients, search]);

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleDelete = (patient: Patient) => {
    const visits = getVisitsByPatient(patient.patient_id);
    if (visits.length > 0) {
      toast.error('Cannot delete patient with existing visits');
      return;
    }
    if (confirm(`Are you sure you want to delete ${patient.full_name}?`)) {
      deletePatient(patient.patient_id);
      toast.success('Patient deleted successfully');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(undefined);
  };

  const columns = [
    {
      key: 'patient_id',
      header: 'Patient ID',
      render: (patient: Patient) => (
        <span className="font-mono text-sm text-foreground">{patient.patient_id}</span>
      ),
    },
    {
      key: 'full_name',
      header: 'Name',
      render: (patient: Patient) => (
        <div>
          <p className="font-medium text-foreground">{patient.full_name}</p>
          <p className="text-xs text-muted-foreground">{patient.email}</p>
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age/Gender',
      render: (patient: Patient) => (
        <span className="text-foreground">{patient.age} / {patient.gender}</span>
      ),
    },
    {
      key: 'blood_group',
      header: 'Blood',
      render: (patient: Patient) => (
        <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
          {patient.blood_group}
        </span>
      ),
    },
    {
      key: 'registration_date',
      header: 'Registered',
      render: (patient: Patient) => (
        <span className="text-foreground">{format(new Date(patient.registration_date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'visits',
      header: 'Visits',
      render: (patient: Patient) => {
        const visitCount = getVisitsByPatient(patient.patient_id).length;
        return (
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {visitCount}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (patient: Patient) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(patient);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(patient);
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
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
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage patient records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search patients by name, ID, or email..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredPatients.length} of {state.patients.length} patients
        </div>
      </div>

      <DataTable
        data={filteredPatients}
        columns={columns}
        emptyMessage="No patients found"
      />

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
        size="lg"
      >
        <PatientForm onClose={handleCloseModal} patient={editingPatient} />
      </Modal>
    </div>
  );
}
