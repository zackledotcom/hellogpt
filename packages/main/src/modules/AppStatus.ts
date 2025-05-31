class AppStatus {
  private static instance: AppStatus;

  public ollamaModelLoaded: boolean = false;
  public lastModelLoadError: string | null = null;
  public openWindows: number = 0;

  private constructor() {}

  public static getInstance(): AppStatus {
    if (!AppStatus.instance) {
      AppStatus.instance = new AppStatus();
    }
    return AppStatus.instance;
  }

  public getHealth() {
    return {
      modelLoaded: this.ollamaModelLoaded,
      lastError: this.lastModelLoadError,
      openWindows: this.openWindows,
    };
  }
}

export const appStatus = AppStatus.getInstance();
