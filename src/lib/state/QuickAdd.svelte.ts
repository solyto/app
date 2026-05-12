import type { QuickAddContentType } from '$lib/types/quick_add';
import { getContext, setContext } from 'svelte';
import { getAuth } from '$lib/state/Auth.svelte';
import { getTranslation } from '$lib/state/Translation.svelte';
import { getUiNotifications } from '$lib/state/UiNotifications.svelte';
import ApiService from '$lib/services/ApiService';
import { apiRoutes } from '$lib/config/apiRoutes';

export class QuickAdd {
	open = $state<boolean>(false);
	loading = $state<boolean>(false);
	url = $state<string>('');
	detectedType = $state<QuickAddContentType | null>(null);
	confidence = $state<number>(0);
	metadata = $state<Record<string, unknown> | null>(null);
	needsConfirmation = $state<boolean>(false);
	showTypeSelector = $state<boolean>(false);
	error = $state<string | null>(null);
	auth = getAuth();
	ts = getTranslation();
	notifications = getUiNotifications();
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
		this.metadata = null;
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

		const res = await this.apiService.create(apiRoutes.dashboard.quickAddDetect, { url: this.url });

		this.loading = false;

		if (!res) {
			this.error = this.ts.get.quick_add.detect_error;
			this.notifications.error(this.ts.get.quick_add.detect_error);
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
		this.metadata = data.metadata ?? null;

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

	backToConfirmation(): void {
		if (!this.detectedType) return;
		this.showTypeSelector = false;
		this.needsConfirmation = true;
	}

	async confirm(type: QuickAddContentType): Promise<void> {
		this.loading = true;
		this.error = null;

		const res = await this.apiService.create(apiRoutes.dashboard.quickAddCommit, {
			url: this.url,
			content_type: type,
			metadata: this.metadata
		});

		this.loading = false;

		if (!res) {
			this.error = this.ts.get.quick_add.commit_error;
			this.notifications.error(this.ts.get.quick_add.commit_error);
			return;
		}

		const destination = this.ts.get.quick_add.destinations[type];
		this.notifications.success(
			this.ts.get.quick_add.commit_success.replace('%s', destination)
		);
		this.closeModal();
	}

	async selectType(type: QuickAddContentType): Promise<void> {
		this.showTypeSelector = false;
		this.detectedType = type;
		// Metadata was extracted for the originally detected type. Clear it
		// so commit() doesn't ship fields that don't apply to the override.
		this.metadata = null;
		await this.confirm(type);
	}
}

const QUICK_ADD_KEY = Symbol('SOLYTO_QUICK_ADD');

export function setQuickAdd(): QuickAdd {
	return setContext(QUICK_ADD_KEY, new QuickAdd());
}

export function getQuickAdd(): QuickAdd {
	return getContext<QuickAdd>(QUICK_ADD_KEY);
}
