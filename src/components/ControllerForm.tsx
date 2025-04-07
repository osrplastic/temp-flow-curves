
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
} from '@/components/ui/form';
import { Controller } from '@/lib/api';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  minTemp: z.coerce.number().min(-50, { message: 'Minimum temperature must be at least -50°C' }),
  maxTemp: z.coerce.number().min(0, { message: 'Maximum temperature must be at least 0°C' }),
  targetTemp: z.coerce.number(),
});

type FormData = z.infer<typeof formSchema>;

interface ControllerFormProps {
  onSubmit: (data: Omit<Controller, 'id' | 'currentTemp' | 'currentProfile' | 'isRunning' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

const ControllerForm: React.FC<ControllerFormProps> = ({ onSubmit, onCancel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      minTemp: 0,
      maxTemp: 100,
      targetTemp: 25,
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
    
    onSubmit({
      name: data.name,
      minTemp: data.minTemp,
      maxTemp: data.maxTemp,
      targetTemp
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              <FormLabel>Default Target Temperature (°C)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Controller
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ControllerForm;
