import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class AppEventEmitter extends EventEmitter {
  emit<T extends keyof AppEvents>(event: T, ...args: Parameters<AppEvents[T]>) {
    return super.emit(event, ...args);
  }

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]) {
    return super.on(event, listener);
  }

  off<T extends keyof AppEvents>(event: T, listener: AppEvents[T]) {
    return super.off(event, listener);
  }
}

export const errorEmitter = new AppEventEmitter();
