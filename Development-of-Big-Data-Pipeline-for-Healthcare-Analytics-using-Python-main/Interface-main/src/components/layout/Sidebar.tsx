import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, UserPlus, FileUp, 
  Pill, ClipboardList, Activity
} from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export function Sidebar() {
  const { state } = useHospital();
  const location = useLocation();
  const { user } = state.auth;

  const adminNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Patients', path: '/admin/patients' },
    { icon: Calendar, label: 'Visits', path: '/admin/visits' },
    { icon: UserPlus, label: 'Doctors', path: '/admin/doctors' },
    { icon: FileUp, label: 'CSV Upload', path: '/admin/upload' },
  ];

  const doctorNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor' },
    { icon: ClipboardList, label: 'My Visits', path: '/doctor/visits' },
    { icon: Pill, label: 'Prescriptions', path: '/doctor/prescriptions' },
    { icon: FileUp, label: 'CSV Upload', path: '/doctor/upload' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : doctorNavItems;

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] border-r border-border bg-sidebar sticky top-16">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? '' : 'text-muted-foreground group-hover:text-sidebar-foreground'}`} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">System Status</span>
          </div>
          <p className="text-xs text-muted-foreground">All systems operational</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
