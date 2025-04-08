
import { HeatZone } from '../types';
import { supabaseService } from '../supabaseService';

// Zone-specific storage methods
class ZoneStorage {
  async getZones(): Promise<HeatZone[]> {
    return supabaseService.getZones();
  }

  async saveZones(zones: HeatZone[]): Promise<void> {
    return supabaseService.saveZones(zones);
  }
  
  async deleteZone(id: string): Promise<void> {
    return supabaseService.deleteZone(id);
  }
}

export const zoneStorage = new ZoneStorage();
