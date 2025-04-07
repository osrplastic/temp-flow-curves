
import React, { useState } from 'react';
import { Controller } from '@/lib/api';
import MainNav from '@/components/MainNav';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import ZoneCard from '@/components/ZoneCard';
import ControllerSelectorDialog from '@/components/ControllerSelectorDialog';
import AddControllerDialog from '@/components/AddControllerDialog';
import { useControllerManagement } from '@/hooks/useControllerManagement';

const Index = () => {
  const {
    controllers,
    profiles,
    zones,
    zoneOpenState,
    isLoading,
    needsReinitialize,
    handleUpdateController,
    handleStartController,
    handleStopController,
    handleCreateController,
    getControllersByZone,
    toggleZoneOpen,
    handleUpdateAllInZone,
    handleApplyProfileToZone
  } = useControllerManagement();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [addControllerDialogOpen, setAddControllerDialogOpen] = useState(false);
  const [selectedController, setSelectedController] = useState<Controller | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
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
      console.error("Error applying profile:", error);
    }
  };
  
  const onCreateController = async (data: any) => {
    const success = await handleCreateController(data);
    if (success) {
      setAddControllerDialogOpen(false);
    }
  };
  
  const openAddControllerWithZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setAddControllerDialogOpen(true);
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (needsReinitialize) {
    return <LoadingState message="Reinitializing data..." />;
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
            <ZoneCard
              key={zone.id}
              zone={zone}
              controllers={zoneControllers}
              profiles={profiles}
              isOpen={zoneOpenState[zone.id]}
              onToggleOpen={() => toggleZoneOpen(zone.id)}
              onAddController={() => openAddControllerWithZone(zone.id)}
              onUpdateController={handleUpdateController}
              onStartController={openProfileDialog}
              onStopController={handleStopController}
              onUpdateAllInZone={handleUpdateAllInZone}
              onApplyProfileToZone={handleApplyProfileToZone}
            />
          );
        })}
        
        {zones.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg border-muted">
            <p className="text-muted-foreground mb-4">No heat zones available</p>
          </div>
        )}
      </div>
      
      <ControllerSelectorDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        selectedController={selectedController}
        profiles={profiles}
        onApplyProfile={applyProfile}
        onStartWithoutProfile={() => {
          if (selectedController) {
            handleStartController(selectedController.id);
            setProfileDialogOpen(false);
          }
        }}
      />
      
      <AddControllerDialog
        open={addControllerDialogOpen}
        onOpenChange={setAddControllerDialogOpen}
        onSubmit={onCreateController}
        zones={zones}
        defaultZoneId={selectedZoneId || undefined}
      />
    </div>
  );
};

export default Index;
