import { useState } from 'react';
import { Building2, ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface Clinic {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  role: string;
  patientCount: number;
  isActive: boolean;
}

interface ClinicSwitcherProps {
  clinics: Clinic[];
  currentClinic: Clinic | null;
  onSwitch: (clinicId: number) => void;
  collapsed?: boolean;
}

const ClinicSwitcher = ({ clinics, currentClinic, onSwitch, collapsed = false }: ClinicSwitcherProps) => {
  if (!currentClinic) return null;

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all hover:bg-sidebar-accent/50 p-2',
            collapsed ? 'justify-center' : 'px-3'
          )}
          title={collapsed ? currentClinic.name : undefined}
        >
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            {currentClinic.logo ? (
              <img src={currentClinic.logo} alt={currentClinic.name} className="w-6 h-6 rounded" />
            ) : (
              <span className="text-sidebar-primary-foreground text-xs font-bold">{getInitials(currentClinic.name)}</span>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{currentClinic.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{currentClinic.role}</p>
              </div>
              <ChevronDown size={14} className="text-sidebar-foreground/60 flex-shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={collapsed ? 'right' : 'bottom'} className="w-72 z-50 bg-popover">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Clinic</DropdownMenuLabel>
        {clinics.map((clinic) => (
          <DropdownMenuItem
            key={clinic.id}
            onClick={() => onSwitch(clinic.id)}
            className="flex items-center gap-3 py-3 cursor-pointer"
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              clinic.id === currentClinic.id ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <span className="text-xs font-bold">{getInitials(clinic.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{clinic.name}</p>
              <p className="text-xs text-muted-foreground">{clinic.role} · {clinic.patientCount} patients</p>
            </div>
            {clinic.id === currentClinic.id && (
              <Check size={16} className="text-secondary flex-shrink-0" />
            )}
            {!clinic.isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Inactive</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 py-2 cursor-pointer text-muted-foreground">
          <Settings size={14} />
          <span className="text-sm">Manage Clinics</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClinicSwitcher;
