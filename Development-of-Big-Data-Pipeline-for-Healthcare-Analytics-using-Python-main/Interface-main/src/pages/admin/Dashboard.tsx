import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, UserPlus, Clock } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { state, getPatientById, getDoctorById, getSeverityChange } = useHospital();

  const stats = useMemo(() => ({
    totalPatients: state.patients.length,
    totalVisits: state.visits.length,
    totalDoctors: state.doctors.length,
  }), [state.patients.length, state.visits.length, state.doctors.length]);

  const recentVisits = useMemo(() => {
    return [...state.visits]
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
      .slice(0, 5);
  }, [state.visits]);

  const visitColumns = [
    {
      key: 'visit_id',
      header: 'Visit ID',
      render: (visit: typeof recentVisits[0]) => (
        <span className="font-mono text-sm text-foreground">{visit.visit_id}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (visit: typeof recentVisits[0]) => {
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
      render: (visit: typeof recentVisits[0]) => {
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
      render: (visit: typeof recentVisits[0]) => (
        <span className="text-foreground">{format(new Date(visit.visit_date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      key: 'visit_type',
      header: 'Type',
      render: (visit: typeof recentVisits[0]) => (
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
      render: (visit: typeof recentVisits[0]) => (
        <SeverityBadge change={getSeverityChange(visit.visit_id)} score={visit.severity_score} />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of hospital records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          onClick={() => navigate('/admin/patients')}
          variant="primary"
        />
        <StatCard
          title="Total Visits"
          value={stats.totalVisits}
          icon={Calendar}
          onClick={() => navigate('/admin/visits')}
          variant="success"
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={UserPlus}
          onClick={() => navigate('/admin/doctors')}
          variant="warning"
        />
      </div>

      <div className="card-healthcare p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Visits</h2>
              <p className="text-sm text-muted-foreground">Latest patient visits</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/visits')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View all →
          </button>
        </div>

        <DataTable
          data={recentVisits}
          columns={visitColumns}
          onRowClick={() => navigate('/admin/visits')}
          emptyMessage="No visits recorded yet"
        />
      </div>
    </div>
  );
}
