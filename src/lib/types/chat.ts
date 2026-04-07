export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	id: number;
	role: ChatRole;
	message: string;
}
