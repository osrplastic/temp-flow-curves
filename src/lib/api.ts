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

export type ControlPoint = {
  x: number; // Normalized time (0-1)
  y: number; // Normalized temperature (0-1)
  handleX?: number; // Bezier control point for x
  handleY?: number; // Bezier control point for y
};

export type Controller = {
  id: string;
  name: string;
  currentTemp: number;
  targetTemp: number;
  minTemp: number;
  maxTemp: number;
  currentProfile: string | null;
  isRunning: boolean;
  lastUpdated: string;
};

// Local storage keys
const PROFILES_KEY = 'temp-controller-profiles';
const CONTROLLERS_KEY = 'temp-controllers';

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

// Default controllers
const defaultControllers: Controller[] = [
  {
    id: 'controller-1',
    name: 'Main Chamber',
    currentTemp: 25,
    targetTemp: 75,
    minTemp: 0,
    maxTemp: 100,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'controller-2',
    name: 'Secondary Zone',
    currentTemp: 22,
    targetTemp: 65,
    minTemp: 0,
    maxTemp: 150,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'controller-3',
    name: 'Auxiliary Heater',
    currentTemp: 18,
    targetTemp: 50,
    minTemp: 0,
    maxTemp: 120,
    currentProfile: null,
    isRunning: false,
    lastUpdated: new Date().toISOString()
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
  }
};

// Initialize storage on module import
initializeStorage();
