import { describe, it, expect } from 'vitest';
import { nl2br, markdownToHtml } from '$lib/helpers/FormatHelper';

describe('nl2br', () => {
	it('replaces newlines with <br>', () => {
		expect(nl2br('line1\nline2')).toBe('line1<br>line2');
	});

	it('handles multiple newlines', () => {
		expect(nl2br('a\nb\nc')).toBe('a<br>b<br>c');
	});

	it('leaves text without newlines unchanged', () => {
		expect(nl2br('hello')).toBe('hello');
	});
});

describe('markdownToHtml', () => {
	it('renders a heading', () => {
		expect(markdownToHtml('# Hello')).toContain('<h1');
		expect(markdownToHtml('# Hello')).toContain('Hello');
	});

	it('renders bold text', () => {
		expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
	});

	it('renders inline code', () => {
		expect(markdownToHtml('`code`')).toContain('<code>code</code>');
	});

	it('renders links', () => {
		expect(markdownToHtml('[solyto](https://solyto.app)')).toContain(
			'href="https://solyto.app"'
		);
	});
});
