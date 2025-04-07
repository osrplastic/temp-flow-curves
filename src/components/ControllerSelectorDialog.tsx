
import React from 'react';
import { Controller, TemperatureProfile } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ControllerSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedController: Controller | null;
  profiles: TemperatureProfile[];
  onApplyProfile: (profileId: string) => void;
  onStartWithoutProfile: () => void;
}

const ControllerSelectorDialog: React.FC<ControllerSelectorDialogProps> = ({ 
  open, 
  onOpenChange, 
  profiles, 
  onApplyProfile, 
  onStartWithoutProfile 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Button onClick={() => onApplyProfile(profile.id)}>
                Apply
              </Button>
            </div>
          ))}
          
          <div className="mt-2 flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            <Button 
              variant="secondary"
              onClick={onStartWithoutProfile}
            >
              Start Without Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ControllerSelectorDialog;
