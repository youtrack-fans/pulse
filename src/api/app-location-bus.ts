import type {AppLocation} from './host';

type LocationListener = (location: AppLocation) => void;

const listeners = new Set<LocationListener>();

export const appLocationBus = {
  emit(location: AppLocation): void {
    listeners.forEach(listener => listener(location));
  },
  subscribe(listener: LocationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
