import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';
import type {
	Assistant,
	CreateAssistantRequest,
	UpdateAssistantRequest
} from '$lib/types/assistant';
import type { ChatMessage } from '$lib/types/chat';

export class Assistants {
	loaded = $state<boolean>(false);
	assistants = $state<Assistant[]>([]);
	activeAssistant = $state<Assistant | null>(null);
	chatHistory = $state<ChatMessage[]>([]);
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	async load(): Promise<void> {
		const res = await this.apiService.get(apiRoutes.assistants.list, null);
		if (res) {
			this.assistants = res.data as Assistant[];
			this.loaded = true;
		}
	}

	changeActiveAssistant(assistant: Assistant): void {
		this.activeAssistant = assistant;
	}

	getAssistant(id: string): Assistant | null {
		return this.assistants.find((a) => a.id === id) ?? null;
	}

	async create(request: CreateAssistantRequest): Promise<boolean> {
		const res = await this.apiService.create(apiRoutes.assistants.create, request);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async update(id: string, request: UpdateAssistantRequest): Promise<boolean> {
		const res = await this.apiService.update(apiRoutes.assistants.update, id, request);
		if (res) {
			await this.load();
			this.changeActiveAssistant(this.getAssistant(id));
		}
		return Promise.resolve(res !== null);
	}

	async delete(id: string): Promise<boolean> {
		const res = await this.apiService.delete(apiRoutes.assistants.delete, id);
		if (res) await this.load();
		return Promise.resolve(res !== null);
	}

	async chat(message: string): Promise<string | null> {
		this.chatHistory.push({ id: Date.now(), role: 'user', content: message });
		const res = await this.apiService.post(
			apiRoutes.assistants.chat.replace('%s', this.activeAssistant?.id),
			{ message }
		);

		if (res) {
			this.chatHistory.push({ id: Date.now(), role: 'assistant', content: res.data });
		}

		return Promise.resolve(null);
	}

	async getChatHistory(): Promise<ChatMessage[]> {
		const res = await this.apiService.get(
			apiRoutes.assistants.chatHistory.replace('%s', this.activeAssistant?.id)
		);
		if (res) {
			return res.data.map((message: ChatMessage, index: number) => ({
				...message,
				id: index + 1
			})) as ChatMessage[];
		}
		return [];
	}
}

const ASSISTANTS_KEY = Symbol('SOLYTO_ASSISTANTS');

export function setAssistants(): Assistants {
	return setContext(ASSISTANTS_KEY, new Assistants());
}

export function getAssistants(): Assistants {
	return getContext<Assistants>(ASSISTANTS_KEY);
}
