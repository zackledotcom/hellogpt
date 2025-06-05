import { ServiceState, ServiceStatus } from '../../types/services';

export const createServiceState = (
  status: ServiceStatus,
  error?: string
): ServiceState => ({
  status,
  lastCheck: Date.now(),
  ...(error && { error })
});

export const mockServiceStates = {
  operational: () => createServiceState('operational'),
  degraded: (error: string) => createServiceState('degraded', error),
  unavailable: (error: string) => createServiceState('unavailable', error)
}; 