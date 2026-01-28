import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, icon: Icon, trend, onClick, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'bg-card',
    primary: 'gradient-primary text-primary-foreground',
    success: 'gradient-success text-success-foreground',
    warning: 'gradient-warning text-warning-foreground',
    danger: 'gradient-danger text-destructive-foreground',
  };

  const iconBgClasses = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
    warning: 'bg-warning-foreground/20 text-warning-foreground',
    danger: 'bg-destructive-foreground/20 text-destructive-foreground',
  };

  const textClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground/80',
    success: 'text-success-foreground/80',
    warning: 'text-warning-foreground/80',
    danger: 'text-destructive-foreground/80',
  };

  return (
    <div
      onClick={onClick}
      className={`stat-card ${variantClasses[variant]} rounded-xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textClasses[variant]}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${variant === 'default' ? 'text-foreground' : ''}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last month</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgClasses[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
