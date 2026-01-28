import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useHospital } from '@/context/HospitalContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  requiredRole: 'admin' | 'doctor';
}

export function DashboardLayout({ requiredRole }: DashboardLayoutProps) {
  const { state } = useHospital();
  const { user, isAuthenticated } = state.auth;

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/doctor'} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
