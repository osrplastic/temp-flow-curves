
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Thermometer, LineChart, Settings } from 'lucide-react';

interface MainNavProps {
  className?: string;
}

const MainNav: React.FC<MainNavProps> = ({ className }) => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Controllers',
      href: '/',
      icon: <Thermometer className="h-5 w-5" />,
      active: location.pathname === '/'
    },
    {
      name: 'Profiles',
      href: '/profiles',
      icon: <LineChart className="h-5 w-5" />,
      active: location.pathname === '/profiles'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      active: location.pathname === '/settings'
    }
  ];
  
  return (
    <nav className={cn("flex justify-center", className)}>
      <div className="flex space-x-2 rounded-lg overflow-hidden border border-border">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
              item.active 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MainNav;
