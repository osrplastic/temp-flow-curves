
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
}

export const zoneStorage = new ZoneStorage();
