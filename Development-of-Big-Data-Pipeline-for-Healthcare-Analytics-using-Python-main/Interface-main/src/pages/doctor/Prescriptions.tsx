import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { PrescriptionForm } from '@/components/forms/PrescriptionForm';
import { Prescription } from '@/types/hospital';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Prescriptions() {
  const { state, deletePrescription, getPrescriptionsByDoctor, getPatientById, getVisitById } = useHospital();
  const { user } = state.auth;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const doctorUserId = user?.user_id || '';

const doctorId = useMemo(() => {
      return state.doctors.find((d) => d.user_id === doctorUserId)?.doctor_name || '';
    }, [state.doctors, doctorUserId]);

const doctorSpecialty = useMemo(() => {
      return state.doctors.find((d) => d.user_id === doctorUserId)?.doctor_speciality || '';
    }, [state.doctors, doctorUserId]);


  
  

  const myPrescriptions = useMemo(() => 
    getPrescriptionsByDoctor(doctorId), 
    [getPrescriptionsByDoctor, doctorId]
  );

  const filteredPrescriptions = useMemo(() => {
    const searchLower = search.toLowerCase();
    return myPrescriptions.filter(p => {
      const patient = getPatientById(p.patient_id);
      return (
        p.prescription_id.toLowerCase().includes(searchLower) ||
        p.visit_id.toLowerCase().includes(searchLower) ||
        p.drug_name.toLowerCase().includes(searchLower) ||
        patient?.full_name.toLowerCase().includes(searchLower) ||
        p.diagnosis_description.toLowerCase().includes(searchLower)
      );
    });
  }, [myPrescriptions, search, getPatientById]);

  const handleDelete = (prescription: Prescription) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      console.log("Deleting prescription:", prescription);

      deletePrescription(prescription.prescription_id);
      toast.success('Prescription deleted successfully');
    }
  };

  const columns = [
    {
      key: 'prescription_id',
      header: 'Rx ID',
      render: (prescription: Prescription) => (
        <span className="font-mono text-sm text-foreground">{prescription.prescription_id}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (prescription: Prescription) => {
        const patient = getPatientById(prescription.patient_id);
        return (
          <div>
            <p className="font-medium text-foreground">{patient?.full_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{prescription.visit_id}</p>
          </div>
        );
      },
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (prescription: Prescription) => (
        <div>
          <p className="font-medium text-foreground">{prescription.diagnosis_id}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{prescription.diagnosis_description}</p>
        </div>
      ),
    },
    {
      key: 'drug',
      header: 'Medication',
      render: (prescription: Prescription) => (
        <div>
          <p className="font-medium text-foreground">{prescription.drug_name}</p>
          <p className="text-xs text-muted-foreground">{prescription.drug_category}</p>
        </div>
      ),
    },
    {
      key: 'dosage',
      header: 'Dosage',
      render: (prescription: Prescription) => (
        <span className="text-foreground">{prescription.dosage}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty/Days',
      render: (prescription: Prescription) => (
        <span className="text-foreground">{prescription.quantity} / {prescription.days_supply} days</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (prescription: Prescription) => (
        <span className="text-foreground">{format(new Date(prescription.prescribed_date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (prescription: Prescription) => (
        <span className="font-medium text-foreground">${prescription.cost.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (prescription: Prescription) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(prescription);
          }}
          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">Manage prescriptions for your patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Prescription
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search prescriptions by ID, patient, drug, or diagnosis..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredPrescriptions.length} of {myPrescriptions.length} prescriptions
        </div>
      </div>

      <DataTable
        data={filteredPrescriptions}
        columns={columns}
        emptyMessage="No prescriptions found"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Prescription"
        size="lg"
      >
        <PrescriptionForm 
          onClose={() => setShowModal(false)} 
          doctorId={doctorId}
          doctorSpecialty={doctorSpecialty}
        />
      </Modal>
    </div>
  );
}
