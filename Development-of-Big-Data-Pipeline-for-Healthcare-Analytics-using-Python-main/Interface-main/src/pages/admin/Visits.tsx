import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { VisitForm } from '@/components/forms/VisitForm';
import { Visit } from '@/types/hospital';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Visits() {
  const { state, deleteVisit, getPatientById, getDoctorById, getSeverityChange, getPrescriptionsByVisit } = useHospital();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | undefined>();

  const filteredVisits = useMemo(() => {
    const searchLower = search.toLowerCase();
    return state.visits.filter(v => {
      const patient = getPatientById(v.patient_id);
      const doctor = getDoctorById(v.doctor_id);
      return (
        v.visit_id.toLowerCase().includes(searchLower) ||
        v.patient_id.toLowerCase().includes(searchLower) ||
        patient?.full_name.toLowerCase().includes(searchLower) ||
        doctor?.doctor_name.toLowerCase().includes(searchLower) ||
        v.visit_date.includes(searchLower)
      );
    }).sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }, [state.visits, search, getPatientById, getDoctorById]);

  const handleEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setShowModal(true);
  };

  const handleDelete = (visit: Visit) => {
    const prescriptions = getPrescriptionsByVisit(visit.visit_id);
    if (prescriptions.length > 0) {
      toast.error('Cannot delete visit with existing prescriptions');
      return;
    }
    if (confirm('Are you sure you want to delete this visit?')) {
      deleteVisit(visit.visit_id);
      toast.success('Visit deleted successfully');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVisit(undefined);
  };

  const columns = [
    {
      key: 'visit_id',
      header: 'Visit ID',
      render: (visit: Visit) => (
        <span className="font-mono text-sm text-foreground">{visit.visit_id}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (visit: Visit) => {
        const patient = getPatientById(visit.patient_id);
        return (
          <div>
            <p className="font-medium text-foreground">{patient?.full_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{visit.patient_id}</p>
          </div>
        );
      },
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (visit: Visit) => {
        const doctor = getDoctorById(visit.doctor_id);
        return (
          <div>
            <p className="font-medium text-foreground">{doctor?.doctor_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{doctor?.doctor_speciality}</p>
          </div>
        );
      },
    },
    {
      key: 'visit_date',
      header: 'Date',
      render: (visit: Visit) => (
        <span className="text-foreground">{format(new Date(visit.visit_date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'visit_type',
      header: 'Type',
      render: (visit: Visit) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          visit.visit_type === 'IP' 
            ? 'bg-warning/10 text-warning' 
            : 'bg-success/10 text-success'
        }`}>
          {visit.visit_type === 'IP' ? 'Inpatient' : 'Outpatient'}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (visit: Visit) => (
        <SeverityBadge change={getSeverityChange(visit.visit_id)} score={visit.severity_score} />
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (visit: Visit) => (
        <span className="font-medium text-foreground">${visit.visit_cost.toFixed(2)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (visit: Visit) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(visit);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(visit);
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
          <h1 className="text-2xl font-bold text-foreground">Visits</h1>
          <p className="text-muted-foreground mt-1">Manage patient visits</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Visit
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search visits by ID, patient, doctor, or date..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredVisits.length} of {state.visits.length} visits
        </div>
      </div>

      <DataTable
        data={filteredVisits}
        columns={columns}
        emptyMessage="No visits found"
      />

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingVisit ? 'Edit Visit' : 'Add New Visit'}
        size="lg"
      >
        <VisitForm onClose={handleCloseModal} visit={editingVisit} />
      </Modal>
    </div>
  );
}
