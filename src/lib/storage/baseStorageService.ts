
import { defaultProfiles, defaultControllers, defaultZones } from '../data/defaultData';
import { PROFILES_KEY, CONTROLLERS_KEY, ZONES_KEY } from './storageKeys';

// Base Storage Service
class BaseStorageService {
  // Initialize storage with default values if empty
  async initializeStorage(): Promise<void> {
    try {
      const profilesData = localStorage.getItem(PROFILES_KEY);
      if (!profilesData) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
      }
      
      const controllersData = localStorage.getItem(CONTROLLERS_KEY);
      if (!controllersData) {
        localStorage.setItem(CONTROLLERS_KEY, JSON.stringify(defaultControllers));
      }
      
      const zonesData = localStorage.getItem(ZONES_KEY);
      if (!zonesData) {
        localStorage.setItem(ZONES_KEY, JSON.stringify(defaultZones));
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // Generic methods for getting/setting data
  async getItems<T>(key: string): Promise<T[]> {
    await this.initializeStorage();
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from ${key}:`, error);
      return [];
    }
  }

  async saveItems<T>(key: string, data: T[]): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to ${key}:`, error);
    }
  }
}

export const baseStorageService = new BaseStorageService();
