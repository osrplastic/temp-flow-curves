
import { Controller } from '../types';
import { supabaseService } from '../supabaseService';

// Controller-specific storage methods
class ControllerStorage {
  async getControllers(): Promise<Controller[]> {
    return supabaseService.getControllers();
  }

  async saveControllers(controllers: Controller[]): Promise<void> {
    return supabaseService.saveControllers(controllers);
  }
}

export const controllerStorage = new ControllerStorage();
