
import { HeatZone } from '../types';
import { baseStorageService } from './baseStorageService';
import { ZONES_KEY } from './storageKeys';

// Zone-specific storage methods
class ZoneStorage {
  async getZones(): Promise<HeatZone[]> {
    return baseStorageService.getItems<HeatZone>(ZONES_KEY);
  }

  async saveZones(zones: HeatZone[]): Promise<void> {
    return baseStorageService.saveItems(ZONES_KEY, zones);
  }
}

export const zoneStorage = new ZoneStorage();
