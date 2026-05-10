import type { QuickAddContentType } from '$lib/types/quick_add';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';

export class QuickAdd {
	open = $state<boolean>(false);
	loading = $state<boolean>(false);
	url = $state<string>('');
	detectedType = $state<QuickAddContentType | null>(null);
	confidence = $state<number>(0);
	needsConfirmation = $state<boolean>(false);
	showTypeSelector = $state<boolean>(false);
	error = $state<string | null>(null);
	auth = getAuth();
	apiService: ApiService;

	constructor() {
		this.apiService = new ApiService(this.auth.getToken());
	}

	openModal(): void {
		this.reset();
		this.open = true;
	}

	closeModal(): void {
		this.open = false;
		this.reset();
	}

	reset(): void {
		this.url = '';
		this.loading = false;
		this.detectedType = null;
		this.confidence = 0;
		this.needsConfirmation = false;
		this.showTypeSelector = false;
		this.error = null;
	}

	async detect(): Promise<void> {
		if (!this.url.trim()) return;

		this.loading = true;
		this.error = null;
		this.detectedType = null;
		this.needsConfirmation = false;
		this.showTypeSelector = false;

		const res = await this.apiService.create(apiRoutes.quickAdd.detect, { url: this.url });

		this.loading = false;

		if (!res) {
			this.error = 'Failed to detect content type.';
			return;
		}

		const data = res.data as {
			url: string;
			content_type: QuickAddContentType;
			confidence: number;
			metadata: Record<string, unknown> | null;
		};

		this.detectedType = data.content_type;
		this.confidence = data.confidence;

		if (data.confidence < 0.6) {
			this.needsConfirmation = true;
		} else {
			await this.confirm(this.detectedType!);
		}
	}

	rejectDetection(): void {
		this.needsConfirmation = false;
		this.showTypeSelector = true;
	}

	async confirm(type: QuickAddContentType): Promise<void> {
		this.loading = true;
		this.error = null;

		// TODO: Wire up the actual create endpoint for the detected type.
		// This is where you'd call the appropriate library/feature create endpoint
		// based on the content_type. For now, we just close the modal on success.

		this.loading = false;
		this.closeModal();
	}

	selectType(type: QuickAddContentType): void {
		this.showTypeSelector = false;
		this.detectedType = type;
		this.confirm(type);
	}
}

const QUICK_ADD_KEY = Symbol('SOLYTO_QUICK_ADD');

export function setQuickAdd(): QuickAdd {
	return setContext(QUICK_ADD_KEY, new QuickAdd());
}

export function getQuickAdd(): QuickAdd {
	return getContext<QuickAdd>(QUICK_ADD_KEY);
}
