import { ipcMain, IpcMainInvokeEvent } from 'electron';

type SuccessResponse<T> = { success: true; data: T };
type ErrorResponse = { success: false; error: string };
type Response<T> = SuccessResponse<T> | ErrorResponse;

export function registerIPC<Payload, Result>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, payload: Payload) => Promise<Result> | Result
): void {
  ipcMain.handle(channel, async (event, payload) => {
    try {
      const data = await handler(event, payload);
      return { success: true, data } as SuccessResponse<Result>;
    } catch (error: any) {
      console.error(`Error in IPC handler for channel "${channel}":`, error);
      return { success: false, error: error?.message || 'Unknown error' } as ErrorResponse;
    }
  });
}
