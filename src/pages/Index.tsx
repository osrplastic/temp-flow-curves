
import React, { useEffect, useState } from 'react';
import { api, Controller, TemperatureProfile } from '@/lib/api';
import TemperatureController from '@/components/TemperatureController';
import MainNav from '@/components/MainNav';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const { toast } = useToast();
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [profiles, setProfiles] = useState<TemperatureProfile[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedController, setSelectedController] = useState<Controller | null>(null);
  
  // Fetch controllers
  const { data: controllersData, isLoading: controllersLoading } = useQuery({
    queryKey: ['controllers'],
    queryFn: api.getControllers
  });
  
  // Fetch profiles
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: api.getProfiles
  });
  
  // Update state when data is loaded
  useEffect(() => {
    if (controllersData) setControllers(controllersData);
  }, [controllersData]);
  
  useEffect(() => {
    if (profilesData) setProfiles(profilesData);
  }, [profilesData]);
  
  // Handle controller updates
  const handleUpdateController = async (id: string, data: Partial<Controller>) => {
    try {
      const updatedController = await api.updateController(id, data);
      setControllers(prev => 
        prev.map(c => c.id === id ? updatedController : c)
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update controller",
        variant: "destructive"
      });
    }
  };
  
  // Handle controller start
  const handleStartController = async (id: string, profileId?: string) => {
    try {
      const updatedController = await api.startController(id, profileId);
      setControllers(prev => 
        prev.map(c => c.id === id ? updatedController : c)
      );
      
      toast({
        title: "Controller Started",
        description: profileId 
          ? `Running profile on ${updatedController.name}`
          : `${updatedController.name} started`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start controller",
        variant: "destructive"
      });
    }
  };
  
  // Handle controller stop
  const handleStopController = async (id: string) => {
    try {
      const updatedController = await api.stopController(id);
      setControllers(prev => 
        prev.map(c => c.id === id ? updatedController : c)
      );
      
      toast({
        title: "Controller Stopped",
        description: `${updatedController.name} stopped`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop controller",
        variant: "destructive"
      });
    }
  };
  
  // Open profile selection dialog
  const openProfileDialog = (controller: Controller) => {
    setSelectedController(controller);
    setDialogOpen(true);
  };
  
  // Apply profile to controller
  const applyProfile = async (profileId: string) => {
    if (!selectedController) return;
    
    try {
      await handleStartController(selectedController.id, profileId);
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply profile",
        variant: "destructive"
      });
    }
  };
  
  // Loading state
  if (controllersLoading || profilesLoading) {
    return (
      <div className="container py-6 space-y-6">
        <MainNav />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <p className="text-muted-foreground">Loading controllers...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <MainNav />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {controllers.map(controller => (
          <div key={controller.id} className="flex flex-col">
            <TemperatureController 
              controller={controller}
              profiles={profiles}
              onUpdate={handleUpdateController}
              onStart={(id) => openProfileDialog(controller)}
              onStop={handleStopController}
            />
          </div>
        ))}
      </div>
      
      {/* Profile selection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Temperature Profile</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {profiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                </div>
                <Button onClick={() => applyProfile(profile.id)}>
                  Apply
                </Button>
              </div>
            ))}
            
            <div className="mt-2 flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => {
                  if (selectedController) {
                    handleStartController(selectedController.id);
                    setDialogOpen(false);
                  }
                }}
              >
                Start Without Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
