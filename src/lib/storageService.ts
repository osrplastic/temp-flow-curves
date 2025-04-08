
import { TemperatureProfile, HeatZone, Controller } from './types';

// Default profiles
const defaultProfiles: TemperatureProfile[] = [
  {
    id: 'profile-1',
    name: 'Quick Ramp Up',
    description: 'Quickly ramps to maximum temperature',
    controlPoints: [
      { x: 0, y: 0 },
      { x: 0.3, y: 1, handleX: 0.1, handleY: 0.8 },
      { x: 1, y: 1 }
    ],
    duration: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'profile-2',
    name: 'Gradual Heat',
    description: 'Slowly increases temperature over time',
    controlPoints: [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5, handleX: 0.25, handleY: 0.25 },
      { x: 1, y: 1, handleX: 0.75, handleY: 0.75 }
    ],
    duration: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'profile-3',
    name: 'Heat and Hold',
    description: 'Quickly heats and maintains temperature',
    controlPoints: [
      { x: 0, y: 0 },
      { x: 0.2, y: 0.8, handleX: 0.1, handleY: 0.6 },
      { x: 1, y: 0.8 }
    ],
    duration: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default heat zones
const defaultZones: HeatZone[] = [
  {
    id: 'zone-up',
    name: 'Up Zone',
    description: 'Top heat zone array'
  },
  {
    id: 'zone-down',
    name: 'Down Zone',
    description: 'Bottom heat zone array'
  }
];

// Default controllers
const defaultControllers: Controller[] = [
  // Up Zone Controllers (4)
  {
    id: 'controller-1',
    name: 'Main Chamber',
    currentTemp: 25,
    targetTemp: 75,
    minTemp: 0,
    maxTemp: 100,
    slaveId: 1,
    updateInterval: 250,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-up'
  },
  {
    id: 'controller-2',
    name: 'Secondary Chamber',
    currentTemp: 22,
    targetTemp: 65,
    minTemp: 0,
    maxTemp: 150,
    slaveId: 2,
    updateInterval: 500,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-up'
  },
  {
    id: 'controller-3',
    name: 'Tertiary Chamber',
    currentTemp: 30,
    targetTemp: 80,
    minTemp: 10,
    maxTemp: 120,
    slaveId: 3,
    updateInterval: 300,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-up'
  },
  {
    id: 'controller-4',
    name: 'Auxiliary Up',
    currentTemp: 28,
    targetTemp: 70,
    minTemp: 5,
    maxTemp: 110,
    slaveId: 4,
    updateInterval: 750,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-up'
  },
  
  // Down Zone Controllers (4)
  {
    id: 'controller-5',
    name: 'Primary Lower',
    currentTemp: 18,
    targetTemp: 50,
    minTemp: 0,
    maxTemp: 120,
    slaveId: 5,
    updateInterval: 1000,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-down'
  },
  {
    id: 'controller-6',
    name: 'Secondary Lower',
    currentTemp: 20,
    targetTemp: 55,
    minTemp: 5,
    maxTemp: 90,
    slaveId: 6,
    updateInterval: 400,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-down'
  },
  {
    id: 'controller-7',
    name: 'Tertiary Lower',
    currentTemp: 15,
    targetTemp: 45,
    minTemp: 0,
    maxTemp: 80,
    slaveId: 7,
    updateInterval: 600,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-down'
  },
  {
    id: 'controller-8',
    name: 'Auxiliary Down',
    currentTemp: 23,
    targetTemp: 60,
    minTemp: 10,
    maxTemp: 100,
    slaveId: 8,
    updateInterval: 350,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString(),
    zoneId: 'zone-down'
  }
];

// Storage keys
const PROFILES_KEY = 'temperatureProfiles';
const CONTROLLERS_KEY = 'temperatureControllers';
const ZONES_KEY = 'temperatureZones';

// Storage service
class StorageService {
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

  // Profile-specific methods
  async getProfiles(): Promise<TemperatureProfile[]> {
    return this.getItems<TemperatureProfile>(PROFILES_KEY);
  }

  async saveProfiles(profiles: TemperatureProfile[]): Promise<void> {
    return this.saveItems(PROFILES_KEY, profiles);
  }

  // Controller-specific methods
  async getControllers(): Promise<Controller[]> {
    return this.getItems<Controller>(CONTROLLERS_KEY);
  }

  async saveControllers(controllers: Controller[]): Promise<void> {
    return this.saveItems(CONTROLLERS_KEY, controllers);
  }

  // Zone-specific methods
  async getZones(): Promise<HeatZone[]> {
    return this.getItems<HeatZone>(ZONES_KEY);
  }

  async saveZones(zones: HeatZone[]): Promise<void> {
    return this.saveItems(ZONES_KEY, zones);
  }
}

export const storageService = new StorageService();
