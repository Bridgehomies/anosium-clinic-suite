import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { collapsed } = useSidebarContext();
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "ml-20" : "ml-64"
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
