import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import Rating from '$lib/components/libraries/shared/Rating.svelte';
import StatisticWidget from '$lib/components/admin/StatisticWidget.svelte';
import DailyCheckInIcon from '$lib/components/check-in/daily/DailyCheckInIcon.svelte';
import CheckInIcon from '$lib/components/check-in/overview/CheckInIcon.svelte';
import TrackerGlyph from '$lib/components/check-in/TrackerGlyph.svelte';
import GenreFlexList from '$lib/components/libraries/shared/GenreFlexList.svelte';
import TagFlexList from '$lib/components/tags/TagFlexList.svelte';
import CoverImage from '$lib/components/libraries/shared/CoverImage.svelte';
import TwoCoversHarness from './helpers/TwoCoversHarness.svelte';
import NoTodos from '$lib/components/todos/NoTodos.svelte';
import DeezerButton from '$lib/components/ui/buttons/DeezerButton.svelte';
import HardcoverButton from '$lib/components/ui/buttons/HardcoverButton.svelte';
import Link from '$lib/components/todos/props/Link.svelte';
import { renderWithContext } from './helpers/context';
import { checkInTracker, tag, todo } from '../unit/helpers/factories';
import type { BookGenre } from '$lib/types/library_book';

describe('Rating', () => {
	it('renders five stars', () => {
		const { container } = render(Rating, { props: { startRating: 0 } });
		expect(container.querySelectorAll('svg')).toHaveLength(5);
	});

	it('calls onchange with the clicked rating', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const { container } = render(Rating, { props: { startRating: 0, onchange } });
		const stars = container.querySelectorAll('svg');
		await user.click(stars[2]);
		expect(onchange).toHaveBeenCalledWith(3);
	});

	it('highlights up to the current rating', async () => {
		const user = userEvent.setup();
		const { container } = render(Rating, { props: { startRating: 0 } });
		const stars = container.querySelectorAll('svg');
		await user.click(stars[3]);
		expect(stars[3].getAttribute('class')).toContain('text-c-warning');
		expect(stars[4].getAttribute('class')).toContain('text-s-gray-200');
	});
});

describe('StatisticWidget', () => {
	it('renders the label and a human-readable number', () => {
		render(StatisticWidget, { props: { label: 'Users', number: 2500 } });
		expect(screen.getByText('Users')).toBeInTheDocument();
		expect(screen.getByText('2.5K')).toBeInTheDocument();
	});

	it('applies the requested color classes', () => {
		const { container } = render(StatisticWidget, {
			props: { label: 'X', number: 1, color: 'blue' }
		});
		expect(container.querySelector('[class~="bg-c-btn/10"]')).toBeInTheDocument();
		expect(container.querySelector('.text-c-btn')).toBeInTheDocument();
	});
});

describe('NoTodos', () => {
	it('renders the no-todos message from the translation context', () => {
		renderWithContext(NoTodos);
		expect(screen.getByText(/no todos/i)).toBeInTheDocument();
	});
});

describe('DailyCheckInIcon', () => {
	it('renders a button and calls onSelect on click', async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(DailyCheckInIcon, {
			props: { type: 'mood', icon: null, index: 3, onSelect, isHighlighted: () => false }
		});
		await user.click(screen.getByRole('button'));
		expect(onSelect).toHaveBeenCalledWith(3);
	});

	it('colors the icon by index', () => {
		const { container } = render(DailyCheckInIcon, {
			props: { type: 'mood', icon: null, index: 5, onSelect: vi.fn(), isHighlighted: () => false }
		});
		expect(container.querySelector('button')?.classList.contains('text-green-500')).toBe(true);
	});

	it('highlights the selected index', () => {
		const { container } = render(DailyCheckInIcon, {
			props: { type: 'mood', icon: null, index: 2, onSelect: vi.fn(), isHighlighted: (i) => i === 2 }
		});
		const button = container.querySelector('button');
		expect(button?.classList.contains('bg-c-neutral')).toBe(true);
		expect(button?.classList.contains('border-transparent')).toBe(false);
	});

	it('uses the primary color for sports and maps the sport id', () => {
		const { container } = render(DailyCheckInIcon, {
			props: {
				type: 'sports',
				icon: null,
				index: 1,
				onSelect: vi.fn(),
				isHighlighted: () => false,
				selectedSports: ['dumbbell', 'bike']
			}
		});
		expect(container.querySelector('button')?.classList.contains('text-c-primary')).toBe(true);
	});
});

const mood = checkInTracker({ key: 'mood', name: null, type: 'scale', scored: true });

describe('TrackerGlyph', () => {
	it('draws a built-in tracker with its own icon, not from the sprite', () => {
		const { container } = render(TrackerGlyph, { props: { tracker: mood, class: 'size-4' } });
		expect(container.querySelector('svg')?.getAttribute('class')).toContain('size-4');
		expect(container.querySelector('use')).not.toBeInTheDocument();
	});

	it('draws an own tracker from the icon sprite', () => {
		const { container } = render(TrackerGlyph, { props: { tracker: checkInTracker({ key: null, name: 'Calm', icon: 'leaf' }), class: 'size-4' } });
		expect(container.querySelector('use')?.getAttribute('href')).toBe('/icons/lucide-sprite.svg#leaf');
	});
});

describe('CheckInIcon', () => {
	it('renders nothing when the value is null', () => {
		const { container } = render(CheckInIcon, { props: { tracker: mood, value: null } });
		expect(container.querySelector('button')).not.toBeInTheDocument();
	});

	it('colors the icon by value', () => {
		const { container } = render(CheckInIcon, { props: { tracker: mood, value: 4 } });
		expect(container.querySelector('button')?.classList.contains('text-green-300')).toBe(true);
	});

	it('renders a sports icon with the primary color', () => {
		const { container } = render(CheckInIcon, { props: { tracker: checkInTracker({ key: 'sports', name: null, type: 'sport' }), value: 1 } });
		expect(container.querySelector('button')?.classList.contains('text-c-primary')).toBe(true);
	});

	it('colors an own 1–5 tracker by value like the built-in ones', () => {
		const { container } = render(CheckInIcon, { props: { tracker: checkInTracker({ name: 'Calm', type: 'scale', icon: 'leaf' }), value: 1 } });
		expect(container.querySelector('button')?.classList.contains('text-red-500')).toBe(true);
	});

	it('shows a count as its number', () => {
		const { container } = render(CheckInIcon, { props: { tracker: checkInTracker({ key: null, name: 'Glasses', type: 'count' }), value: 7 } });
		expect(container.textContent?.trim()).toBe('7');
	});

	it('shows a ticked yes/no tracker in grey', () => {
		const { container } = render(CheckInIcon, { props: { tracker: checkInTracker({ key: null, name: 'Meditated', type: 'yes_no', icon: 'flower-2' }), value: 1 } });
		expect(container.querySelector('.text-c-neutral-5')).toBeInTheDocument();
	});
});

describe('GenreFlexList', () => {
	function genre(id: number, title: string): BookGenre {
		return { id, title, created_at: '', updated_at: '' };
	}

	it('renders all genres', () => {
		render(GenreFlexList, {
			props: { genres: [genre(1, 'Fantasy'), genre(2, 'Sci-Fi')] }
		});
		expect(screen.getByText('Fantasy')).toBeInTheDocument();
		expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
	});
});

describe('TagFlexList', () => {
	it('renders tags with their colour', () => {
		const { container } = render(TagFlexList, {
			props: {
				tags: [
					{ ...tag(1, 'home'), color: '#ff0000' },
					{ ...tag(2, 'work'), color: '#0000ff' }
				]
			}
		});
		expect(screen.getByText('#home')).toBeInTheDocument();
		expect(screen.getByText('#work')).toBeInTheDocument();
		const pills = container.querySelectorAll('.rounded-full');
		expect(pills[0]).toHaveStyle('background-color: #ff0000');
	});

	it('shows a remove button only when onRemove is provided and calls it', async () => {
		const user = userEvent.setup();
		const onRemove = vi.fn();
		const homeTag = { ...tag(1, 'home'), color: '#ff0000' };
		const { container } = render(TagFlexList, {
			props: { tags: [homeTag], onRemove }
		});
		await user.click(container.querySelector('svg')!);
		expect(onRemove).toHaveBeenCalledWith(homeTag);

		render(TagFlexList, { props: { tags: [{ ...tag(2, 'work'), color: '#0000ff' }] } });
		expect(screen.getAllByText('#work')).toHaveLength(1);
	});
});

describe('CoverImage', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	class FakeImage {
		onload: (() => void) | null = null;
		private _src = '';
		set src(value: string) {
			this._src = value;
			this.onload?.();
		}
		get src() {
			return this._src;
		}
	}

	it('renders the preview and the full image once both have loaded', () => {
		vi.stubGlobal('Image', FakeImage);
		const { container } = renderWithContext(CoverImage, { src: 'full.jpg', previewSrc: 'preview.jpg', alt: 'cover' });
		const images = container.querySelectorAll('img');
		expect(images).toHaveLength(2);
		expect(images[0]).toHaveAttribute('src', 'preview.jpg');
		expect(images[1]).toHaveAttribute('src', 'full.jpg');
	});

	it('renders only the full image when there is no preview', () => {
		vi.stubGlobal('Image', FakeImage);
		const { container } = renderWithContext(CoverImage, { src: 'full.jpg', alt: 'cover' });
		const images = container.querySelectorAll('img');
		expect(images).toHaveLength(1);
		expect(images[0]).toHaveAttribute('src', 'full.jpg');
	});

	it('shows the full image once it has finished loading', async () => {
		const images: { onload: (() => void) | null; src: string }[] = [];
		vi.stubGlobal('Image', class {
			onload: (() => void) | null = null;
			src = '';
			constructor() {
				images.push(this);
			}
		});
		const { container } = renderWithContext(CoverImage, { src: 'full.jpg', alt: 'cover' });
		expect(container.querySelector('img')).toBeNull();

		images.find((image) => image.src === 'full.jpg')?.onload?.();
		await tick();

		expect(container.querySelector('img')).toHaveAttribute('src', 'full.jpg');
	});

	it('does not restart loading a cover when another cover finishes', async () => {
		const images: { onload: (() => void) | null; src: string }[] = [];
		vi.stubGlobal('Image', class {
			onload: (() => void) | null = null;
			src = '';
			constructor() {
				images.push(this);
			}
		});
		renderWithContext(TwoCoversHarness);
		const created = images.length;

		images.find((image) => image.src === 'a.jpg')?.onload?.();
		await tick();

		expect(images).toHaveLength(created);
	});

	it('shows an already loaded cover straight away, without waiting for it to load again', () => {
		class NeverLoadingImage {
			onload: (() => void) | null = null;
			src = '';
		}
		vi.stubGlobal('Image', NeverLoadingImage);
		const { container } = renderWithContext(CoverImage, { src: 'full.jpg', alt: 'cover' }, {
			stores: { loadedCovers: { sources: new Set(['full.jpg']) } }
		});
		const images = container.querySelectorAll('img');
		expect(images).toHaveLength(1);
		expect(images[0]).toHaveAttribute('src', 'full.jpg');
	});
});

describe('DeezerButton / HardcoverButton', () => {
	it.each([
		['Deezer', DeezerButton],
		['Hardcover', HardcoverButton]
	])('%s links a safe url', (_, Button) => {
		renderWithContext(Button, { link: 'https://example.com/album/1' });
		expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/album/1');
	});

	it.each([
		['Deezer', DeezerButton],
		['Hardcover', HardcoverButton]
	])('%s renders nothing for a rejected url', (_, Button) => {
		const { container } = renderWithContext(Button, { link: 'javascript:alert(1)' });
		expect(container.querySelector('a')).toBeNull();
	});
});

describe('todo Link', () => {
	it('opens a safe link from a button', () => {
		const { container } = renderWithContext(Link, { todo: todo({ link: 'https://solyto.app' }) });
		expect(container.querySelector('button')).not.toBeNull();
	});

	it('shows a rejected link as plain text', () => {
		const { container } = renderWithContext(Link, { todo: todo({ link: 'javascript:alert(1)' }) });
		expect(screen.getByText('javascript:alert(1)')).not.toHaveClass('underline');
		expect(container.querySelector('button')).toBeNull();
	});
});
