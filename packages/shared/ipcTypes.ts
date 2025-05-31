export const enum Role {
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface HealthCheckResponse {
  model: string;
  windows: number;
  error?: string;
}
