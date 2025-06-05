import { mockElectronAPI } from '../setup/electronMocks';
import { ServiceName } from '../../types/services';
import { Mock } from 'vitest';

type ServiceMethod = (...args: any[]) => any;
type ServiceEvent = (callback: (data: any) => void) => () => void;

interface ServiceAPI {
  [key: string]: ServiceMethod | ServiceEvent;
}

type ElectronAPI = {
  [K in ServiceName]: ServiceAPI;
};

export const mockIpcResponse = {
  success: (service: ServiceName, method: string, data: any) => {
    const serviceAPI = mockElectronAPI[service] as ServiceAPI;
    const mock = serviceAPI[method] as Mock;
    if (mock) {
      mock.mockResolvedValue(data);
    }
  },
  
  error: (service: ServiceName, method: string, error: string) => {
    const serviceAPI = mockElectronAPI[service] as ServiceAPI;
    const mock = serviceAPI[method] as Mock;
    if (mock) {
      mock.mockRejectedValue(new Error(error));
    }
  },
  
  event: (service: ServiceName, event: string, data: any) => {
    const serviceAPI = mockElectronAPI[service] as ServiceAPI;
    const mock = serviceAPI[event] as Mock;
    if (mock) {
      mock.mockImplementation((callback: (data: any) => void) => {
        callback(data);
        return () => {}; // Return unsubscribe function
      });
    }
  }
}; 