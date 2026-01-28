import React from 'react';
import { LogOut, User, Building2, Stethoscope } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { state, logout } = useHospital();
  const navigate = useNavigate();
  const { user } = state.auth;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="gradient-primary p-2 rounded-xl">
            {user.role === 'admin' ? (
              <Building2 className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {user.role === 'admin' ? 'Hospital Admin' : user.doctor_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {user.role === 'admin' ? 'Record Management' : user.doctor_speciality}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-secondary-foreground">
              {user.user_id}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
