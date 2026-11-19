import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import type { OpenSourceLicense } from '../src/lib/types/license';

interface PackageJson {
	name: string;
	version: string;
	license?: string | { type: string };
	licenses?: { type: string }[];
	dependencies?: Record<string, string>;
}

const VIRTUAL_ID = 'virtual:licenses';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;
const LICENSE_FILE = /^(licen[cs]es?|copying|notice)([-._][\w-]*)?(\.(md|txt|markdown))?$/i;

// SvelteKit lists these as devDependencies, but their code or CSS ends up in the client bundle.
export const BUNDLED_DEV_DEPENDENCIES = [
	'@lucide/svelte',
	'@sveltejs/kit',
	'@tailwindcss/forms',
	'marked',
	'svelte',
	'svelte-awesome-color-picker',
	'tailwindcss'
];

export function resolvePackageDir(name: string, fromDir: string, rootDir: string): string | null {
	let dir = fromDir;
	while (true) {
		const candidate = join(dir, 'node_modules', name);
		if (existsSync(join(candidate, 'package.json'))) return candidate;
		if (dir === rootDir) return null;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

export function licenseType(pkg: PackageJson): string {
	if (typeof pkg.license === 'string') return pkg.license;
	if (pkg.license) return pkg.license.type;
	if (pkg.licenses) return pkg.licenses.map((l) => l.type).join(' OR ');
	return 'UNKNOWN';
}

export function readLicenseText(packageDir: string): string {
	return licenseFiles(packageDir)
		.map((file) => readFileSync(file, 'utf8').trim())
		.join('\n\n');
}

export function collectLicenses(rootDir: string, extraRoots: string[] = []): OpenSourceLicense[] {
	const rootPkg = readPackageJson(rootDir);
	const queue = [...Object.keys(rootPkg.dependencies ?? {}), ...extraRoots].map((name) => ({ name, fromDir: rootDir }));
	const visited = new Set<string>();
	const licenses = new Map<string, OpenSourceLicense>();

	while (queue.length > 0) {
		const { name, fromDir } = queue.shift()!;
		const packageDir = resolvePackageDir(name, fromDir, rootDir);
		if (!packageDir || visited.has(packageDir)) continue;
		visited.add(packageDir);

		const pkg = readPackageJson(packageDir);
		licenses.set(`${pkg.name}@${pkg.version}`, {
			name: pkg.name,
			version: pkg.version,
			license: licenseType(pkg),
			text: readLicenseText(packageDir)
		});

		for (const dependency of Object.keys(pkg.dependencies ?? {})) {
			queue.push({ name: dependency, fromDir: packageDir });
		}
	}

	return [...licenses.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

export function licenses(rootDir: string = process.cwd()): Plugin {
	return {
		name: 'solyto-licenses',
		resolveId(id) {
			return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : null;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_ID) return null;
			return `export default ${JSON.stringify(collectLicenses(rootDir, BUNDLED_DEV_DEPENDENCIES))};`;
		}
	};
}

function readPackageJson(dir: string): PackageJson {
	return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
}

function licenseFiles(dir: string): string[] {
	return readdirSync(dir)
		.filter((entry) => LICENSE_FILE.test(entry))
		.sort()
		.flatMap((entry) => {
			const path = join(dir, entry);
			if (statSync(path).isFile()) return [path];
			return readdirSync(path)
				.sort()
				.map((file) => join(path, file))
				.filter((file) => statSync(file).isFile());
		});
}
