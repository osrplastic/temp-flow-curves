
import { supabase } from "@/integrations/supabase/client";
import { TemperatureProfile, HeatZone, Controller, ControlPoint } from './types';
import type { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

// Supabase Service
class SupabaseService {
  // Profile-specific methods
  async getProfiles(): Promise<TemperatureProfile[]> {
    const { data, error } = await supabase
      .from('temperature_profiles')
      .select('*');
      
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    
    return data.map(profile => ({
      id: profile.id,
      name: profile.name,
      description: profile.description || '',
      controlPoints: this.parseControlPoints(profile.control_points),
      duration: profile.duration,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }));
  }

  // Helper method to parse control points from JSON
  private parseControlPoints(controlPointsJson: Json): ControlPoint[] {
    if (!controlPointsJson) return [];
    
    try {
      if (typeof controlPointsJson === 'string') {
        return JSON.parse(controlPointsJson) as ControlPoint[];
      }
      
      // First cast to unknown, then to the specific type
      if (Array.isArray(controlPointsJson)) {
        return controlPointsJson.map(point => {
          // Safely access properties by checking the type first
          if (typeof point === 'object' && point !== null) {
            // Need to use type assertion after verifying it's an object
            const pointObj = point as Record<string, unknown>;
            
            // Ensure each point has the required properties
            return {
              x: typeof pointObj.x === 'number' ? pointObj.x : 0,
              y: typeof pointObj.y === 'number' ? pointObj.y : 0,
              type: (typeof pointObj.type === 'string' ? pointObj.type : 'linear') as ControlPoint['type'],
              handleX: typeof pointObj.handleX === 'number' ? pointObj.handleX : undefined,
              handleY: typeof pointObj.handleY === 'number' ? pointObj.handleY : undefined
            };
          }
          return { x: 0, y: 0, type: 'linear' };
        });
      }
      
      console.error('Control points data is not an array:', controlPointsJson);
      return [];
    } catch (error) {
      console.error('Error parsing control points:', error);
      return [];
    }
  }

  async saveProfiles(profiles: TemperatureProfile[]): Promise<void> {
    // For now, we'll handle this as a full replacement
    // In a production app, you might want more sophisticated sync logic
    const { error } = await supabase
      .from('temperature_profiles')
      .upsert(
        profiles.map(profile => ({
          id: profile.id,
          name: profile.name,
          description: profile.description,
          control_points: profile.controlPoints as unknown as Json,
          duration: profile.duration,
          created_at: profile.createdAt,
          updated_at: new Date().toISOString()
        }))
      );
      
    if (error) {
      console.error('Error saving profiles:', error);
    }
  }

  // Zone-specific methods
  async getZones(): Promise<HeatZone[]> {
    const { data, error } = await supabase
      .from('heat_zones')
      .select('*');
      
    if (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
    
    return data.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description || ''
    }));
  }

  async saveZones(zones: HeatZone[]): Promise<void> {
    const { error } = await supabase
      .from('heat_zones')
      .upsert(
        zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          description: zone.description
        }))
      );
      
    if (error) {
      console.error('Error saving zones:', error);
    }
  }

  // Controller-specific methods
  async getControllers(): Promise<Controller[]> {
    const { data, error } = await supabase
      .from('controllers')
      .select('*');
      
    if (error) {
      console.error('Error fetching controllers:', error);
      return [];
    }
    
    return data.map(controller => ({
      id: controller.id,
      name: controller.name,
      currentTemp: controller.current_temp,
      targetTemp: controller.target_temp,
      minTemp: controller.min_temp,
      maxTemp: controller.max_temp,
      slaveId: controller.slave_id,
      updateInterval: controller.update_interval,
      currentProfile: controller.current_profile,
      isRunning: controller.is_running,
      lastUpdated: controller.last_updated,
      zoneId: controller.zone_id
    }));
  }

  async saveControllers(controllers: Controller[]): Promise<void> {
    const { error } = await supabase
      .from('controllers')
      .upsert(
        controllers.map(controller => ({
          id: controller.id,
          name: controller.name,
          current_temp: controller.currentTemp,
          target_temp: controller.targetTemp,
          min_temp: controller.minTemp,
          max_temp: controller.maxTemp,
          slave_id: controller.slaveId,
          update_interval: controller.updateInterval,
          current_profile: controller.currentProfile,
          is_running: controller.isRunning,
          last_updated: new Date().toISOString(),
          zone_id: controller.zoneId
        }))
      );
      
    if (error) {
      console.error('Error saving controllers:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
