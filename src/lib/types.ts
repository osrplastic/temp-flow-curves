
// Types for the temperature control system
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
  type?: 'linear' | 'quadratic' | 'cubic';
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
