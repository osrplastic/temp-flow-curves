
import React from 'react';
import { HeatZone } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ControllerForm from '@/components/ControllerForm';

interface AddControllerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  zones: HeatZone[];
  defaultZoneId?: string;
}

const AddControllerDialog: React.FC<AddControllerDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  zones, 
  defaultZoneId 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Temperature Controller</DialogTitle>
        </DialogHeader>
        
        <ControllerForm 
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          zones={zones}
          defaultZoneId={defaultZoneId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddControllerDialog;
