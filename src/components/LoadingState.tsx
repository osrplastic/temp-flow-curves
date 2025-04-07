
import React from 'react';
import MainNav from '@/components/MainNav';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading controllers..." }) => {
  return (
    <div className="container py-6 space-y-6">
      <MainNav />
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
