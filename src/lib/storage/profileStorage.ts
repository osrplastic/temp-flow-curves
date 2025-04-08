
import { TemperatureProfile } from '../types';
import { baseStorageService } from './baseStorageService';
import { PROFILES_KEY } from './storageKeys';

// Profile-specific storage methods
class ProfileStorage {
  async getProfiles(): Promise<TemperatureProfile[]> {
    return baseStorageService.getItems<TemperatureProfile>(PROFILES_KEY);
  }

  async saveProfiles(profiles: TemperatureProfile[]): Promise<void> {
    return baseStorageService.saveItems(PROFILES_KEY, profiles);
  }
}

export const profileStorage = new ProfileStorage();
