
import { storageService } from './storageService';
import { HeatZone, Controller } from './types';
import { controllerService } from './controllerService';

// Zone Service
export const zoneService = {
  // Get all zones
  getZones: async (): Promise<HeatZone[]> => {
    return await storageService.getZones();
  },

  // Get a single zone by ID
  getZone: async (id: string): Promise<HeatZone> => {
    const zones = await storageService.getZones();
    const zone = zones.find(z => z.id === id);
    
    if (!zone) {
      throw new Error('Zone not found');
    }
    
    return zone;
  },

  // Get all controllers in a zone
  getZoneControllers: async (zoneId: string): Promise<Controller[]> => {
    const controllers = await controllerService.getControllers();
    return controllers.filter(controller => controller.zoneId === zoneId);
  }
};
