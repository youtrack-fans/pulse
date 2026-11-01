import {createContext, useContext} from 'react';
import type {HostAPI} from './host';

const HostContext = createContext<HostAPI | null>(null);

export const HostProvider = HostContext.Provider;

export const useHost = (): HostAPI => {
  const context = useContext(HostContext);
  if (!context) {
    throw new Error('Host context is missing. Wrap your app with HostProvider.');
  }
  return context;
};
