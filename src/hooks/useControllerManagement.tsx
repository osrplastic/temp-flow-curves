
import { useState, useEffect } from 'react';
import { api, Controller, TemperatureProfile, HeatZone } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';

export const useControllerManagement = () => {
  const { toast } = useToast();
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [profiles, setProfiles] = useState<TemperatureProfile[]>([]);
  const [zones, setZones] = useState<HeatZone[]>([]);
  const [zoneOpenState, setZoneOpenState] = useState<Record<string, boolean>>({});
  const [hasAttemptedReinit, setHasAttemptedReinit] = useState(false);
  
  const { data: controllersData, isLoading: controllersLoading, refetch: refetchControllers } = useQuery({
    queryKey: ['controllers'],
    queryFn: api.getControllers
  });
  
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: api.getProfiles
  });
  
  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: api.getZones
  });
  
  useEffect(() => {
    if (zonesData) {
      const initialOpenState: Record<string, boolean> = {};
      zonesData.forEach(zone => {
        initialOpenState[zone.id] = true;
      });
      setZoneOpenState(initialOpenState);
    }
  }, [zonesData]);
  
  useEffect(() => {
    if (controllersData) setControllers(controllersData);
  }, [controllersData]);
  
  useEffect(() => {
    if (profilesData) setProfiles(profilesData);
  }, [profilesData]);
  
  useEffect(() => {
    if (zonesData) setZones(zonesData);
  }, [zonesData]);
  
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

  const handleCreateController = async (data: Omit<Controller, 'id' | 'currentTemp' | 'currentProfile' | 'isRunning' | 'lastUpdated'>) => {
    try {
      await api.createController(data);
      refetchControllers();
      
      toast({
        title: "Controller Created",
        description: `${data.name} has been created`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create controller",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const getControllersByZone = (zoneId: string) => {
    return controllers.filter(controller => controller.zoneId === zoneId);
  };
  
  const toggleZoneOpen = (zoneId: string) => {
    setZoneOpenState(prev => ({
      ...prev,
      [zoneId]: !prev[zoneId]
    }));
  };
  
  const handleUpdateAllInZone = async (zoneId: string, targetTemp: number) => {
    try {
      const zoneControllers = controllers.filter(c => c.zoneId === zoneId);
      
      for (const controller of zoneControllers) {
        await api.updateController(controller.id, { targetTemp });
      }
      
      refetchControllers();
      
      toast({
        title: "Zone Updated",
        description: `Set target temperature to ${targetTemp}°C for all controllers in zone`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update zone controllers",
        variant: "destructive"
      });
    }
  };
  
  const handleApplyProfileToZone = async (zoneId: string, profileId: string) => {
    try {
      const zoneControllers = controllers.filter(c => c.zoneId === zoneId);
      
      for (const controller of zoneControllers) {
        await api.startController(controller.id, profileId);
      }
      
      refetchControllers();
      
      const profile = profiles.find(p => p.id === profileId);
      
      toast({
        title: "Profile Applied to Zone",
        description: `Applied '${profile?.name}' to all controllers in ${zones.find(z => z.id === zoneId)?.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply profile to zone controllers",
        variant: "destructive"
      });
    }
  };
  
  const needsReinitialize = !controllersLoading && !zonesLoading && 
                           (controllers.length === 0 || zones.length === 0);

  useEffect(() => {
    if (needsReinitialize && !hasAttemptedReinit) {
      setHasAttemptedReinit(true);
      localStorage.removeItem('temp-controllers');
      localStorage.removeItem('temp-heat-zones');
      localStorage.removeItem('temp-profiles');
      window.location.reload();
    }
  }, [needsReinitialize, hasAttemptedReinit]);
  
  return {
    controllers,
    profiles,
    zones,
    zoneOpenState,
    isLoading: controllersLoading || profilesLoading || zonesLoading,
    needsReinitialize,
    handleUpdateController,
    handleStartController,
    handleStopController,
    handleCreateController,
    getControllersByZone,
    toggleZoneOpen,
    handleUpdateAllInZone,
    handleApplyProfileToZone
  };
};
