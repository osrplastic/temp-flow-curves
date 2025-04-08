import { Hono } from 'hono';
import { z } from "zod";

// Types
export type TemperatureProfile = {
  id: string;
  name: string;
  description: string;
  controlPoints: ControlPoint[];
  duration: number; // in minutes
  createdAt: string;
  updatedAt: string;
};

export interface ControlPoint {
  x: number;
  y: number;
  handleX?: number;
  handleY?: number;
  type?: 'circle' | 'square' | 'triangle';
}

export type HeatZone = {
  id: string;
  name: string;
  description?: string;
};

export type Controller = {
  id: string;
  name: string;
  currentTemp: number;
  targetTemp: number;
  minTemp: number;
  maxTemp: number;
  slaveId: number;
  updateInterval: number; // in ms
  currentProfile: string | null;
  isRunning: boolean;
  lastUpdated: string;
  zoneId: string; // Added zoneId to associate controllers with zones
};

// Local storage keys
const PROFILES_KEY = 'temp-controller-profiles';
const CONTROLLERS_KEY = 'temp-controllers';
const ZONES_KEY = 'temp-heat-zones';

// Mock API server
const app = new Hono();

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

// Initialize local storage if empty
const initializeStorage = () => {
  if (!localStorage.getItem(PROFILES_KEY)) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
  }
  if (!localStorage.getItem(CONTROLLERS_KEY)) {
    localStorage.setItem(CONTROLLERS_KEY, JSON.stringify(defaultControllers));
  }
  if (!localStorage.getItem(ZONES_KEY)) {
    localStorage.setItem(ZONES_KEY, JSON.stringify(defaultZones));
  }
};

// Helper to get items from storage
const getFromStorage = <T>(key: string): T[] => {
  initializeStorage();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Helper to save items to storage
const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// API endpoints for profiles
app.get('/api/profiles', (c) => {
  const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
  return c.json(profiles);
});

app.get('/api/profiles/:id', (c) => {
  const id = c.req.param('id');
  const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
  const profile = profiles.find(p => p.id === id);
  
  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }
  
  return c.json(profile);
});

app.post('/api/profiles', async (c) => {
  const data = await c.req.json();
  
  // Validation schema
  const profileSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    controlPoints: z.array(z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      handleX: z.number().optional(),
      handleY: z.number().optional(),
    })).min(2),
    duration: z.number().positive(),
  });
  
  try {
    const validated = profileSchema.parse(data);
    const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
    
    const newProfile: TemperatureProfile = {
      id: `profile-${Date.now()}`,
      name: validated.name,
      description: validated.description,
      controlPoints: validated.controlPoints.map(point => ({
        x: point.x,
        y: point.y,
        handleX: point.handleX,
        handleY: point.handleY
      })),
      duration: validated.duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    profiles.push(newProfile);
    saveToStorage(PROFILES_KEY, profiles);
    
    return c.json(newProfile, 201);
  } catch (error) {
    return c.json({ error: 'Invalid profile data' }, 400);
  }
});

app.put('/api/profiles/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  
  // Validation schema (same as post)
  const profileSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    controlPoints: z.array(z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      handleX: z.number().optional(),
      handleY: z.number().optional(),
    })).min(2),
    duration: z.number().positive(),
  });
  
  try {
    const validated = profileSchema.parse(data);
    const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
    const index = profiles.findIndex(p => p.id === id);
    
    if (index === -1) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    profiles[index] = {
      ...profiles[index],
      name: validated.name,
      description: validated.description,
      controlPoints: validated.controlPoints.map(point => ({
        x: point.x,
        y: point.y,
        handleX: point.handleX,
        handleY: point.handleY
      })),
      duration: validated.duration,
      updatedAt: new Date().toISOString()
    };
    
    saveToStorage(PROFILES_KEY, profiles);
    
    return c.json(profiles[index]);
  } catch (error) {
    return c.json({ error: 'Invalid profile data' }, 400);
  }
});

app.delete('/api/profiles/:id', (c) => {
  const id = c.req.param('id');
  const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
  const newProfiles = profiles.filter(p => p.id !== id);
  
  if (profiles.length === newProfiles.length) {
    return c.json({ error: 'Profile not found' }, 404);
  }
  
  saveToStorage(PROFILES_KEY, newProfiles);
  return c.json({ success: true });
});

// API endpoints for zones
app.get('/api/zones', (c) => {
  const zones = getFromStorage<HeatZone>(ZONES_KEY);
  return c.json(zones);
});

app.get('/api/zones/:id', (c) => {
  const id = c.req.param('id');
  const zones = getFromStorage<HeatZone>(ZONES_KEY);
  const zone = zones.find(z => z.id === id);
  
  if (!zone) {
    return c.json({ error: 'Zone not found' }, 404);
  }
  
  return c.json(zone);
});

app.get('/api/zones/:id/controllers', (c) => {
  const zoneId = c.req.param('id');
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  const zoneControllers = controllers.filter(controller => controller.zoneId === zoneId);
  
  return c.json(zoneControllers);
});

// API endpoints for controllers
app.get('/api/controllers', (c) => {
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  return c.json(controllers);
});

app.get('/api/controllers/:id', (c) => {
  const id = c.req.param('id');
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  const controller = controllers.find(c => c.id === id);
  
  if (!controller) {
    return c.json({ error: 'Controller not found' }, 404);
  }
  
  return c.json(controller);
});

app.patch('/api/controllers/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  const index = controllers.findIndex(c => c.id === id);
  
  if (index === -1) {
    return c.json({ error: 'Controller not found' }, 404);
  }
  
  controllers[index] = {
    ...controllers[index],
    ...data,
    lastUpdated: new Date().toISOString()
  };
  
  saveToStorage(CONTROLLERS_KEY, controllers);
  
  return c.json(controllers[index]);
});

app.post('/api/controllers/:id/start', async (c) => {
  const id = c.req.param('id');
  const { profileId } = await c.req.json();
  
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  const index = controllers.findIndex(c => c.id === id);
  
  if (index === -1) {
    return c.json({ error: 'Controller not found' }, 404);
  }
  
  if (profileId) {
    const profiles = getFromStorage<TemperatureProfile>(PROFILES_KEY);
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    controllers[index] = {
      ...controllers[index],
      currentProfile: profileId,
      isRunning: true,
      lastUpdated: new Date().toISOString()
    };
  } else {
    controllers[index] = {
      ...controllers[index],
      isRunning: true,
      lastUpdated: new Date().toISOString()
    };
  }
  
  saveToStorage(CONTROLLERS_KEY, controllers);
  
  return c.json(controllers[index]);
});

app.post('/api/controllers', async (c) => {
  const data = await c.req.json();
  
  // Validation schema
  const controllerSchema = z.object({
    name: z.string().min(1),
    minTemp: z.number(),
    maxTemp: z.number(),
    targetTemp: z.number(),
    slaveId: z.number().int().positive(),
    updateInterval: z.number().int().positive(),
    zoneId: z.string().min(1),
  });
  
  try {
    const validated = controllerSchema.parse(data);
    const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
    
    const newController: Controller = {
      id: `controller-${Date.now()}`,
      name: validated.name,
      minTemp: validated.minTemp,
      maxTemp: validated.maxTemp,
      targetTemp: validated.targetTemp,
      slaveId: validated.slaveId,
      updateInterval: validated.updateInterval,
      currentTemp: validated.targetTemp - 5 + Math.random() * 10, // Random start temp near target
      currentProfile: null,
      isRunning: false,
      lastUpdated: new Date().toISOString(),
      zoneId: validated.zoneId
    };
    
    controllers.push(newController);
    saveToStorage(CONTROLLERS_KEY, controllers);
    
    return c.json(newController, 201);
  } catch (error) {
    return c.json({ error: 'Invalid controller data' }, 400);
  }
});

app.post('/api/controllers/:id/stop', (c) => {
  const id = c.req.param('id');
  
  const controllers = getFromStorage<Controller>(CONTROLLERS_KEY);
  const index = controllers.findIndex(c => c.id === id);
  
  if (index === -1) {
    return c.json({ error: 'Controller not found' }, 404);
  }
  
  controllers[index] = {
    ...controllers[index],
    isRunning: false,
    lastUpdated: new Date().toISOString()
  };
  
  saveToStorage(CONTROLLERS_KEY, controllers);
  
  return c.json(controllers[index]);
});

// Create API client for frontend use
export const api = {
  // Zones
  getZones: async (): Promise<HeatZone[]> => {
    const res = await app.request('/api/zones');
    return res.json();
  },
  
  getZone: async (id: string): Promise<HeatZone> => {
    const res = await app.request(`/api/zones/${id}`);
    if (!res.ok) throw new Error('Zone not found');
    return res.json();
  },
  
  getZoneControllers: async (zoneId: string): Promise<Controller[]> => {
    const res = await app.request(`/api/zones/${zoneId}/controllers`);
    return res.json();
  },
  
  // Profiles
  getProfiles: async (): Promise<TemperatureProfile[]> => {
    const res = await app.request('/api/profiles');
    return res.json();
  },
  
  getProfile: async (id: string): Promise<TemperatureProfile> => {
    const res = await app.request(`/api/profiles/${id}`);
    if (!res.ok) throw new Error('Profile not found');
    return res.json();
  },
  
  createProfile: async (profile: Omit<TemperatureProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemperatureProfile> => {
    const res = await app.request('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to create profile');
    return res.json();
  },
  
  updateProfile: async (id: string, profile: Omit<TemperatureProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemperatureProfile> => {
    const res = await app.request(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },
  
  deleteProfile: async (id: string): Promise<void> => {
    const res = await app.request(`/api/profiles/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete profile');
  },
  
  // Controllers
  getControllers: async (): Promise<Controller[]> => {
    const res = await app.request('/api/controllers');
    return res.json();
  },
  
  getController: async (id: string): Promise<Controller> => {
    const res = await app.request(`/api/controllers/${id}`);
    if (!res.ok) throw new Error('Controller not found');
    return res.json();
  },
  
  updateController: async (id: string, data: Partial<Controller>): Promise<Controller> => {
    const res = await app.request(`/api/controllers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update controller');
    return res.json();
  },
  
  startController: async (id: string, profileId?: string): Promise<Controller> => {
    const res = await app.request(`/api/controllers/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    });
    if (!res.ok) throw new Error('Failed to start controller');
    return res.json();
  },
  
  stopController: async (id: string): Promise<Controller> => {
    const res = await app.request(`/api/controllers/${id}/stop`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to stop controller');
    return res.json();
  },
  
  createController: async (controller: Omit<Controller, 'id' | 'currentTemp' | 'currentProfile' | 'isRunning' | 'lastUpdated'>): Promise<Controller> => {
    const res = await app.request('/api/controllers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controller)
    });
    if (!res.ok) throw new Error('Failed to create controller');
    return res.json();
  }
};

// Initialize storage on module import
initializeStorage();
