import React, { useEffect, useState } from 'react';
import { api, Controller, TemperatureProfile, HeatZone } from '@/lib/api';
import TemperatureController from '@/components/TemperatureController';
import ZoneMasterControl from '@/components/ZoneMasterControl';
import MainNav from '@/components/MainNav';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import ControllerForm from '@/components/ControllerForm';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Index = () => {
  const { toast } = useToast();
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [profiles, setProfiles] = useState<TemperatureProfile[]>([]);
  const [zones, setZones] = useState<HeatZone[]>([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [addControllerDialogOpen, setAddControllerDialogOpen] = useState(false);
  const [selectedController, setSelectedController] = useState<Controller | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneOpenState, setZoneOpenState] = useState<Record<string, boolean>>({});
  
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
  
  const openProfileDialog = (controller: Controller) => {
    setSelectedController(controller);
    setProfileDialogOpen(true);
  };
  
  const applyProfile = async (profileId: string) => {
    if (!selectedController) return;
    
    try {
      await handleStartController(selectedController.id, profileId);
      setProfileDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply profile",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateController = async (data: Omit<Controller, 'id' | 'currentTemp' | 'currentProfile' | 'isRunning' | 'lastUpdated'>) => {
    try {
      await api.createController(data);
      refetchControllers();
      setAddControllerDialogOpen(false);
      
      toast({
        title: "Controller Created",
        description: `${data.name} has been created`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create controller",
        variant: "destructive"
      });
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
  
  const openAddControllerWithZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setAddControllerDialogOpen(true);
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
  
  if (controllersLoading || profilesLoading || zonesLoading) {
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
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Temperature Controllers</h1>
        <Button 
          onClick={() => setAddControllerDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Controller
        </Button>
      </div>
      
      <div className="space-y-6">
        {zones.map(zone => {
          const zoneControllers = getControllersByZone(zone.id);
          return (
            <Card key={zone.id}>
              <Collapsible open={zoneOpenState[zone.id]} onOpenChange={() => toggleZoneOpen(zone.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{zone.name}</CardTitle>
                      {zone.description && (
                        <CardDescription>{zone.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddControllerWithZone(zone.id);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add to {zone.name}
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {zoneOpenState[zone.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-6 pt-2">
                      <div className="col-span-12 md:col-span-4 lg:col-span-3">
                        <ZoneMasterControl 
                          zone={zone} 
                          controllers={zoneControllers}
                          profiles={profiles}
                          onUpdateAll={handleUpdateAllInZone}
                          onApplyProfile={handleApplyProfileToZone}
                        />
                      </div>
                      
                      <div className="col-span-12 md:col-span-8 lg:col-span-9">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {zoneControllers.map(controller => (
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
                          
                          {zoneControllers.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-6 border border-dashed rounded-lg border-muted">
                              <p className="text-muted-foreground mb-4">No controllers in this zone</p>
                              <Button 
                                onClick={() => openAddControllerWithZone(zone.id)}
                                variant="outline"
                                className="gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Add Controller
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
        
        {zones.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg border-muted">
            <p className="text-muted-foreground mb-4">No heat zones available</p>
          </div>
        )}
      </div>
      
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
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
                onClick={() => setProfileDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => {
                  if (selectedController) {
                    handleStartController(selectedController.id);
                    setProfileDialogOpen(false);
                  }
                }}
              >
                Start Without Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={addControllerDialogOpen} onOpenChange={setAddControllerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Temperature Controller</DialogTitle>
          </DialogHeader>
          
          <ControllerForm 
            onSubmit={handleCreateController}
            onCancel={() => setAddControllerDialogOpen(false)}
            zones={zones}
            defaultZoneId={selectedZoneId || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
