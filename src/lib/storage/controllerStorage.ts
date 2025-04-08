
import { Controller } from '../types';
import { baseStorageService } from './baseStorageService';
import { CONTROLLERS_KEY } from './storageKeys';

// Controller-specific storage methods
class ControllerStorage {
  async getControllers(): Promise<Controller[]> {
    return baseStorageService.getItems<Controller>(CONTROLLERS_KEY);
  }

  async saveControllers(controllers: Controller[]): Promise<void> {
    return baseStorageService.saveItems(CONTROLLERS_KEY, controllers);
  }
}

export const controllerStorage = new ControllerStorage();
