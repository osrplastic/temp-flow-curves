
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Controller, HeatZone } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  minTemp: z.coerce.number().min(-50, { message: 'Minimum temperature must be at least -50°C' }),
  maxTemp: z.coerce.number().min(0, { message: 'Maximum temperature must be at least 0°C' }),
  targetTemp: z.coerce.number(),
  slaveId: z.coerce.number().int().positive({ message: 'Slave ID must be a positive integer' }),
  updateInterval: z.coerce.number().int().min(100, { message: 'Update interval must be at least 100ms' }),
  zoneId: z.string({ required_error: 'Please select a heat zone' }),
});

type FormData = z.infer<typeof formSchema>;

interface EditControllerDialogProps {
  controller: Controller;
  zones: HeatZone[];
  onSubmit: (id: string, data: Partial<Controller>) => void;
  onCancel: () => void;
}

const EditControllerDialog: React.FC<EditControllerDialogProps> = ({ 
  controller, 
  zones, 
  onSubmit, 
  onCancel 
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: controller.name,
      minTemp: controller.minTemp,
      maxTemp: controller.maxTemp,
      targetTemp: controller.targetTemp,
      slaveId: controller.slaveId,
      updateInterval: controller.updateInterval,
      zoneId: controller.zoneId,
    }
  });
  
  // Make sure target temp is within range
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const { minTemp, maxTemp, targetTemp } = values;
      
      if (minTemp !== undefined && maxTemp !== undefined && targetTemp !== undefined) {
        if (targetTemp < minTemp) {
          form.setValue('targetTemp', minTemp);
        } else if (targetTemp > maxTemp) {
          form.setValue('targetTemp', maxTemp);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const handleSubmit = (data: FormData) => {
    // Ensure target temp is within range as a final validation
    const targetTemp = Math.min(Math.max(data.targetTemp, data.minTemp), data.maxTemp);
    
    onSubmit(controller.id, {
      name: data.name,
      minTemp: data.minTemp,
      maxTemp: data.maxTemp,
      targetTemp,
      slaveId: data.slaveId,
      updateInterval: data.updateInterval,
      zoneId: data.zoneId
    });
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Controller: {controller.name}</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Controller Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Fermentation Chamber" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="zoneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heat Zone</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a heat zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select which heat zone array this controller belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minTemp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxTemp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="targetTemp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Temperature (°C)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="slaveId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slave ID (Modbus)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique ID for Modbus communication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="updateInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Interval (ms)</FormLabel>
                  <FormControl>
                    <Input type="number" min={100} step={50} {...field} />
                  </FormControl>
                  <FormDescription>
                    Time between sensor readings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default EditControllerDialog;
