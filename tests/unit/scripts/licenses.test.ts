import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allLicenses, collectLicenses, licenseType, readLicenseText, resolvePackageDir } from '../../../scripts/licenses';

let root: string;

function writePackage(dir: string, pkg: Record<string, unknown>, files: Record<string, string> = {}): void {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
	for (const [name, content] of Object.entries(files)) {
		mkdirSync(join(dir, name, '..'), { recursive: true });
		writeFileSync(join(dir, name), content);
	}
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'licenses-'));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe('resolvePackageDir', () => {
	it('prefers a nested node_modules over the hoisted one', () => {
		const parent = join(root, 'node_modules', 'parent');
		writePackage(join(root, 'node_modules', 'child'), { name: 'child', version: '1.0.0' });
		writePackage(join(parent, 'node_modules', 'child'), { name: 'child', version: '2.0.0' });
		expect(resolvePackageDir('child', parent, root)).toBe(join(parent, 'node_modules', 'child'));
	});

	it('walks up to the hoisted package and resolves scoped names', () => {
		const parent = join(root, 'node_modules', 'parent');
		writePackage(parent, { name: 'parent', version: '1.0.0' });
		writePackage(join(root, 'node_modules', '@scope', 'child'), { name: '@scope/child', version: '1.0.0' });
		expect(resolvePackageDir('@scope/child', parent, root)).toBe(join(root, 'node_modules', '@scope', 'child'));
	});

	it('returns null for a package that is not installed', () => {
		expect(resolvePackageDir('missing', root, root)).toBeNull();
	});
});

describe('licenseType', () => {
	it('reads the string, object and legacy array forms', () => {
		expect(licenseType({ name: 'a', version: '1', license: 'MIT' })).toBe('MIT');
		expect(licenseType({ name: 'a', version: '1', license: { type: 'ISC' } })).toBe('ISC');
		expect(licenseType({ name: 'a', version: '1', licenses: [{ type: 'MIT' }, { type: 'GPL-2.0' }] })).toBe('MIT OR GPL-2.0');
		expect(licenseType({ name: 'a', version: '1' })).toBe('UNKNOWN');
	});
});

describe('readLicenseText', () => {
	it('joins license, notice and licenses-folder files and ignores code files', () => {
		const dir = join(root, 'pkg');
		writePackage(dir, { name: 'pkg', version: '1.0.0' }, {
			'LICENSE.md': 'main license\n',
			NOTICE: 'notice',
			'licenses/LICENSE-d3': 'd3 license',
			'license-checker.js': 'code',
			'index.js': 'code'
		});
		expect(readLicenseText(dir)).toBe('main license\n\nnotice\n\nd3 license');
	});

	it('is empty when the package ships no license file', () => {
		const dir = join(root, 'pkg');
		writePackage(dir, { name: 'pkg', version: '1.0.0' });
		expect(readLicenseText(dir)).toBe('');
	});
});

describe('collectLicenses', () => {
	beforeEach(() => {
		writePackage(root, {
			name: 'app',
			version: '0.0.1',
			dependencies: { zeta: '1', alpha: '1' },
			devDependencies: { tool: '1', bundled: '1' }
		});
		writePackage(join(root, 'node_modules', 'zeta'), { name: 'zeta', version: '1.0.0', license: 'MIT', dependencies: { shared: '1' } }, { LICENSE: 'zeta text' });
		writePackage(join(root, 'node_modules', 'alpha'), { name: 'alpha', version: '1.0.0', license: 'ISC', dependencies: { shared: '1' } });
		writePackage(join(root, 'node_modules', 'alpha', 'node_modules', 'shared'), { name: 'shared', version: '2.0.0', license: 'MIT' });
		writePackage(join(root, 'node_modules', 'shared'), { name: 'shared', version: '1.0.0', license: 'MIT' });
		writePackage(join(root, 'node_modules', 'tool'), { name: 'tool', version: '1.0.0', license: 'MIT' });
		writePackage(join(root, 'node_modules', 'bundled'), { name: 'bundled', version: '1.0.0', license: 'MIT' });
	});

	it('lists production dependencies and their transitive dependencies, sorted, one entry per version', () => {
		expect(collectLicenses(root).map((l) => `${l.name}@${l.version}`)).toEqual([
			'alpha@1.0.0',
			'shared@1.0.0',
			'shared@2.0.0',
			'zeta@1.0.0'
		]);
	});

	it('adds the extra roots but no other devDependencies', () => {
		const names = collectLicenses(root, ['bundled']).map((l) => l.name);
		expect(names).toContain('bundled');
		expect(names).not.toContain('tool');
	});

	it('returns name, version, license and text per package', () => {
		expect(collectLicenses(root).find((l) => l.name === 'zeta')).toEqual({
			name: 'zeta',
			version: '1.0.0',
			license: 'MIT',
			text: 'zeta text'
		});
	});
});

describe('allLicenses on this repository', () => {
	it('includes the bundled packages and the icons', () => {
		const names = allLicenses(process.cwd()).map((l) => l.name);
		for (const name of ['svelte', '@lucide/svelte', '@tiptap/core', 'prosemirror-model', 'echarts', 'zrender', 'dompurify']) {
			expect(names).toContain(name);
		}
	});

	it('takes the icons licence from the copy in the repo, including the Feather MIT part', () => {
		const lucide = allLicenses(process.cwd()).find((l) => l.name === '@lucide/svelte');

		expect(lucide).toMatchObject({ version: '1.59.0', license: 'ISC' });
		expect(lucide?.text).toContain('ISC License');
		expect(lucide?.text).toContain('Copyright (c) 2013-present Cole Bemis');
	});
});
