declare module 'console-ext' {
  export interface ConsoleExtConfig {
    phoneNumber?: string;
    webhookUrl?: string;
    criticalKeywords?: string[];
    enableText?: boolean;
    enableCall?: boolean;
    rateLimitWindow?: number;
    rateLimitMax?: number;
    dataDogApiKey?: string;
    logLevel?: string;
    maxRetries?: number;
    retryDelay?: number;
  }

  export interface NotificationPayload {
    type: string;
    message: string;
    timestamp: string;
    source: string;
    id: string;
  }

  export interface NotificationStats {
    sent: number;
    undelivered: number;
    sentNotifications: NotificationPayload[];
    undeliveredNotifications: NotificationPayload[];
  }

  export class ConsoleExt {
    config: ConsoleExtConfig;
    originalConsole: Console;
    
    constructor(config?: ConsoleExtConfig);
    
    overrideConsole(): void;
    processMessage(level: string, args: any[]): void;
    sendNotification(type: string, message: string): Promise<void>;
    sendTextMessage(payload: NotificationPayload): Promise<void>;
    makeCall(payload: NotificationPayload): Promise<void>;
    sendWebhook(payload: NotificationPayload): Promise<void>;
    sendToDataDog(payload: NotificationPayload): Promise<void>;
    shouldSendNotification(type: string): boolean;
    updateRateLimit(type: string): void;
    generateId(): string;
    getNotificationStats(): NotificationStats;
    clearStats(): void;
    restore(): void;
  }

  export class DashboardServer {
    constructor(consoleExtInstance: ConsoleExt, port?: number);
    start(): void;
    stop(): void;
    serveDashboard(res: any): void;
    serveStats(res: any): void;
    updateConfig(req: any, res: any): void;
    getSerializableConfig(): Partial<ConsoleExtConfig>;
  }

  export class WinstonConsoleExt {
    constructor(config?: ConsoleExtConfig);
    getLogger(): any;
    getConsoleExt(): ConsoleExt;
  }

  export function createConfig(preset?: string, overrides?: Partial<ConsoleExtConfig>): ConsoleExtConfig;
  
  export const defaultConfig: ConsoleExtConfig;
  export const productionConfig: ConsoleExtConfig;
  export const developmentConfig: ConsoleExtConfig;
  
  export default ConsoleExt;
}

declare global {
  interface Console {
    text(...args: any[]): void;
  }
}