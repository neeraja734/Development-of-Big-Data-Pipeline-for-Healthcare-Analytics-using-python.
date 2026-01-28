import React, { useState, useMemo } from 'react';
import { useHospital } from '@/context/HospitalContext';
import { DataTable } from '@/components/ui/DataTable';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Visit } from '@/types/hospital';
import { format } from 'date-fns';

export default function MyVisits() {
  const { state, getPatientById, getVisitsByDoctor, getSeverityChange, getPrescriptionsByVisit } = useHospital();
  const { user } = state.auth;
  const [search, setSearch] = useState('');
  const doctorUserId = user?.user_id || "";
  
  const doctor = useMemo(() => {
          return state.doctors.find((d) => d.user_id === doctorUserId);
        }, [state.doctors, doctorUserId]);

  const doctorName = user?.doctor_name || "";

  const doctorId = user?.doctor_id || '';
  const myVisits = useMemo(() => {
  return state.visits.filter((v) => v.doctor_name === doctorName);
}, [state.visits, doctorName]);


  const filteredVisits = useMemo(() => {
    const searchLower = search.toLowerCase();
    return myVisits.filter(v => {
      const patient = getPatientById(v.patient_id);
      return (
        v.visit_id.toLowerCase().includes(searchLower) ||
        v.patient_id.toLowerCase().includes(searchLower) ||
        patient?.full_name.toLowerCase().includes(searchLower) ||
        v.visit_date.includes(searchLower)
      );
    });
  }, [myVisits, search, getPatientById]);

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
          {visit.visit_type === 'IP' ? `Inpatient (${visit.length_of_stay} days)` : 'Outpatient'}
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
      key: 'lab_results',
      header: 'Lab Results',
      render: (visit: Visit) => (
        <div className="text-sm">
          <p className="text-foreground">Glucose: {visit.lab_result_glucose}</p>
          <p className="text-muted-foreground">BP: {visit.lab_result_bp}</p>
        </div>
      ),
    },
    {
      key: 'prescriptions',
      header: 'Prescriptions',
      render: (visit: Visit) => {
        const count = getPrescriptionsByVisit(visit.visit_id).length;
        return (
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {count} Rx
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (visit: Visit) => (
        <span className="font-medium text-foreground">${visit.visit_cost.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Visits</h1>
        <p className="text-muted-foreground mt-1">View all visits assigned to you</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search visits by ID, patient, or date..."
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredVisits.length} of {myVisits.length} visits
        </div>
      </div>

      <DataTable
        data={filteredVisits}
        columns={columns}
        emptyMessage="No visits assigned to you"
      />
    </div>
  );
}
