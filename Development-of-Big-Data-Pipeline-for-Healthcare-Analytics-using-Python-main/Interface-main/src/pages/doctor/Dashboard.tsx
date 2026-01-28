import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Pill, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { state, getPatientById, getVisitsByDoctor, getPrescriptionsByDoctor, getSeverityChange } = useHospital();
  const { user } = state.auth;
  const doctorUserId = user?.user_id || "";


  const doctorName = user?.doctor_name || "";



const myVisits = useMemo(() => {
  if (!doctorName) return [];

  return state.visits.filter(
    (v) => v.doctor_name?.toLowerCase() === doctorName.toLowerCase()
  );
}, [state.visits, doctorName]);

const myPrescriptions = useMemo(() => {
  if (!doctorName) return [];
  return getPrescriptionsByDoctor(doctorName);
}, [getPrescriptionsByDoctor, doctorName]);


  const uniquePatients = useMemo(() => {
    const patientIds = new Set(myVisits.map(v => v.patient_id));
    return patientIds.size;
  }, [myVisits]);

  const severityStats = useMemo(() => {
    const stats = { increased: 0, improved: 0, unchanged: 0 };
    myVisits.forEach(visit => {
      const change = getSeverityChange(visit.visit_id);
      if (change === 'increased') stats.increased++;
      else if (change === 'improved') stats.improved++;
      else if (change === 'unchanged') stats.unchanged++;
    });
    return stats;
  }, [myVisits, getSeverityChange]);

  const recentVisits = useMemo(() => myVisits.slice(0, 5), [myVisits]);

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
        <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.doctor_name}</h1>
        <p className="text-muted-foreground mt-1">{user?.doctor_speciality} Department</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="My Patients"
          value={uniquePatients}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Total Visits"
          value={myVisits.length}
          icon={Calendar}
          onClick={() => navigate('/doctor/visits')}
          variant="success"
        />
        <StatCard
          title="Prescriptions"
          value={myPrescriptions.length}
          icon={Pill}
          onClick={() => navigate('/doctor/prescriptions')}
          variant="warning"
        />
        <div className="card-healthcare p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Severity Trends</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-destructive/10">
                  <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-sm text-foreground">Increased</span>
              </div>
              <span className="font-semibold text-foreground">{severityStats.increased}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-success/10">
                  <TrendingDown className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-sm text-foreground">Improved</span>
              </div>
              <span className="font-semibold text-foreground">{severityStats.improved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-warning/10">
                  <Minus className="w-3.5 h-3.5 text-warning" />
                </div>
                <span className="text-sm text-foreground">No Change</span>
              </div>
              <span className="font-semibold text-foreground">{severityStats.unchanged}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-healthcare p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Visits</h2>
            <p className="text-sm text-muted-foreground">Your latest patient visits</p>
          </div>
          <button
            onClick={() => navigate('/doctor/visits')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View all →
          </button>
        </div>

        <DataTable
          data={recentVisits}
          columns={visitColumns}
          onRowClick={() => navigate('/doctor/visits')}
          emptyMessage="No visits assigned yet"
        />
      </div>
    </div>
  );
}
