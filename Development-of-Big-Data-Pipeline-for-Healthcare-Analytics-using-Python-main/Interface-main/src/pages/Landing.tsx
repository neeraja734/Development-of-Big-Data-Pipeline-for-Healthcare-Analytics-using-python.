import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Stethoscope, ShieldCheck, Activity, Users, Calendar } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-40 right-40 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              Healthcare Management System
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 font-display">
              Hospital Record
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Management
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline patient care with our comprehensive hospital management solution. 
              Manage records, visits, and prescriptions all in one place.
            </p>
          </div>

          {/* Portal Selection */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <button
              onClick={() => navigate('/login/admin')}
              className="portal-card bg-card group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="gradient-primary p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Hospital Admin</h2>
                <p className="text-muted-foreground mb-6">
                  Manage patients, visits, doctors, and hospital records
                </p>
                <span className="btn-primary">
                  Access Admin Portal
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/login/doctor')}
              className="portal-card bg-card group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-accent to-primary p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Doctor Portal</h2>
                <p className="text-muted-foreground mb-6">
                  View assigned patients, manage visits, and prescriptions
                </p>
                <span className="btn-primary">
                  Access Doctor Portal
                </span>
              </div>
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="max-w-3xl mx-auto">
            <div className="card-healthcare p-6">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Demo Credentials</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Hospital Admin
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User ID:</span>
                      <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">admin_hospital</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">admin123</code>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    Doctors
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cardiology</p>
                      <div className="flex justify-between">
                        <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">dr_cardiology</code>
                        <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">doctor123</code>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Neurology</p>
                      <div className="flex justify-between">
                        <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">dr_neuro</code>
                        <code className="px-2 py-0.5 rounded bg-muted font-mono text-foreground">doctor123</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Comprehensive Healthcare Management
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-healthcare p-6 text-center">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Patient Management</h3>
              <p className="text-muted-foreground text-sm">
                Complete patient records with clinical history, chronic conditions, and insurance details
              </p>
            </div>
            <div className="card-healthcare p-6 text-center">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Visit Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Track outpatient and inpatient visits with severity scoring and lab results
              </p>
            </div>
            <div className="card-healthcare p-6 text-center">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                Real-time statistics and severity trend analysis for informed decision making
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
