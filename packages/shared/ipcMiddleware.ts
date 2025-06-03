import { IPC_CHANNELS, isValidIpcChannel } from './ipcChannels';
import type { IpcMessageMap } from './ipcTypes';

export class IpcError extends Error {
  constructor(
    message: string,
    public channel: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'IpcError';
  }
}

export function createIpcHandler<T extends keyof IpcMessageMap>(
  channel: T,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    ...args: IpcMessageMap[T]['request'] extends void ? [] : [IpcMessageMap[T]['request']]
  ) => Promise<IpcMessageMap[T]['response']>
) {
  return async (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => {
    try {
      // Validate channel
      if (!isValidIpcChannel(channel)) {
        throw new IpcError(
          `Invalid IPC channel: ${channel}`,
          channel,
          'INVALID_CHANNEL'
        );
      }

      // Validate request payload
      const requestType = typeof args[0] === 'undefined' ? 'void' : typeof args[0];
      const expectedType = typeof ({} as IpcMessageMap[T]['request']);
      
      if (requestType !== expectedType) {
        throw new IpcError(
          `Invalid request type. Expected ${expectedType}, got ${requestType}`,
          channel,
          'INVALID_REQUEST_TYPE',
          { expected: expectedType, got: requestType }
        );
      }

      // Call handler
      const result = await handler(event, ...args as any);
      return result;
    } catch (error) {
      if (error instanceof IpcError) {
        throw error;
      }
      
      // Convert unknown errors to IpcError
      throw new IpcError(
        error instanceof Error ? error.message : 'Unknown error',
        channel,
        'HANDLER_ERROR',
        error
      );
    }
  };
}

export function createIpcListener<T extends keyof IpcMessageMap>(
  channel: T,
  listener: (
    event: Electron.IpcMainEvent,
    ...args: IpcMessageMap[T]['request'] extends void ? [] : [IpcMessageMap[T]['request']]
  ) => void
) {
  return (event: Electron.IpcMainEvent, ...args: unknown[]) => {
    try {
      // Validate channel
      if (!isValidIpcChannel(channel)) {
        throw new IpcError(
          `Invalid IPC channel: ${channel}`,
          channel,
          'INVALID_CHANNEL'
        );
      }

      // Validate request payload
      const requestType = typeof args[0] === 'undefined' ? 'void' : typeof args[0];
      const expectedType = typeof ({} as IpcMessageMap[T]['request']);
      
      if (requestType !== expectedType) {
        throw new IpcError(
          `Invalid request type. Expected ${expectedType}, got ${requestType}`,
          channel,
          'INVALID_REQUEST_TYPE',
          { expected: expectedType, got: requestType }
        );
      }

      // Call listener
      listener(event, ...args as any);
    } catch (error) {
      console.error('IPC Listener Error:', error);
      if (error instanceof IpcError) {
        event.sender.send(IPC_CHANNELS.CHAT.STREAM_ERROR, error.message);
      } else {
        event.sender.send(
          IPC_CHANNELS.CHAT.STREAM_ERROR,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  };
} 