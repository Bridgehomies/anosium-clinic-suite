import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex h-20 items-center justify-between px-8">
        <div className="animate-slide-in-left">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <div
              className={`flex items-center transition-all duration-300 ${
                searchOpen ? 'w-64' : 'w-10'
              }`}
            >
              {searchOpen && (
                <input
                  type="text"
                  placeholder="Search..."
                  className="input-modern pr-10 animate-fade-in"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              )}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`${
                  searchOpen
                    ? 'absolute right-3 top-1/2 -translate-y-1/2'
                    : 'w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center'
                } transition-all`}
              >
                <Search size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all hover:scale-105">
            <Bell size={18} className="text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-pulse-soft" />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-muted transition-all group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-soft group-hover:shadow-medium transition-shadow">
              <User size={18} className="text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@anosium.ai</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
