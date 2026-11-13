import { describe, it, expect } from 'vitest';
import { safeHref } from '$lib/helpers/UrlHelper';

describe('safeHref', () => {
	it('keeps http, https and mailto URLs', () => {
		expect(safeHref('http://example.com')).toBe('http://example.com');
		expect(safeHref('https://example.com/a?b=c#d')).toBe('https://example.com/a?b=c#d');
		expect(safeHref('mailto:someone@example.com')).toBe('mailto:someone@example.com');
	});

	it('keeps same-origin paths', () => {
		expect(safeHref('/todos')).toBe('/todos');
		expect(safeHref('/todos/1?x=y')).toBe('/todos/1?x=y');
	});

	it('rejects script and data schemes', () => {
		expect(safeHref('javascript:alert(1)')).toBeUndefined();
		expect(safeHref('JavaScript:alert(1)')).toBeUndefined();
		expect(safeHref('  javascript:alert(1)')).toBeUndefined();
		expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeUndefined();
		expect(safeHref('vbscript:msgbox(1)')).toBeUndefined();
	});

	it('rejects protocol-relative URLs', () => {
		expect(safeHref('//example.com')).toBeUndefined();
		expect(safeHref('/\\example.com')).toBeUndefined();
	});

	it('rejects input that is not a URL', () => {
		expect(safeHref('example.com')).toBeUndefined();
		expect(safeHref('todos/1')).toBeUndefined();
	});

	it('rejects empty input', () => {
		expect(safeHref(null)).toBeUndefined();
		expect(safeHref(undefined)).toBeUndefined();
		expect(safeHref('')).toBeUndefined();
	});
});
