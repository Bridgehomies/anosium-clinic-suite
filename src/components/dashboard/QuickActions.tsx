import { UserPlus, CalendarPlus, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    title: 'Add Patient',
    description: 'Register a new patient',
    icon: UserPlus,
    href: '/patients',
    color: 'bg-brand-teal',
  },
  {
    title: 'Schedule Appointment',
    description: 'Book a new appointment',
    icon: CalendarPlus,
    href: '/appointments',
    color: 'bg-brand-navy',
  },
  {
    title: 'View Reports',
    description: 'Analytics & insights',
    icon: FileText,
    href: '/dashboard',
    color: 'bg-gradient-to-br from-brand-navy to-brand-teal',
  },
];

const QuickActions = () => {
  return (
    <div className="card-elevated p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all group"
          >
            <div
              className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center shadow-soft group-hover:shadow-medium transition-shadow`}
            >
              <action.icon size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{action.title}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight
              size={18}
              className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
