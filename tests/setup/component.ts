import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// jsdom lacks Element.prototype.animate, which Svelte transitions use
if (!Element.prototype.animate) {
	Element.prototype.animate = vi.fn(() => ({
		finished: Promise.resolve(),
		cancel: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		play: vi.fn(),
		pause: vi.fn(),
		reverse: vi.fn(),
		onfinish: null
	})) as never;
}

afterEach(() => {
	cleanup();
});
