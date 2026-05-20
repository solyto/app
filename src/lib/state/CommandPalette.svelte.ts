import { setContext, getContext } from 'svelte';
import type { Command } from '$lib/types/command';

export class CommandPalette {
	open = $state<boolean>(false);
	query = $state<string>('');
	selectedIndex = $state<number>(0);
	commands = $state<Command[]>([]);
	activeCommand = $state<Command | null>(null);
	pendingInput = $state<string>('');

	get filtered(): Command[] {
		if (!this.query.trim()) return this.commands;
		const q = this.query.toLowerCase();
		return this.commands.filter(
			(c) =>
				c.title.toLowerCase().includes(q) ||
				c.subtitle?.toLowerCase().includes(q) ||
				c.category?.toLowerCase().includes(q)
		);
	}

	register(command: Command): void {
		this.commands.push(command);
	}

	unregister(id: string): void {
		this.commands = this.commands.filter((c) => c.id !== id);
	}

	openPalette(): void {
		this.query = '';
		this.selectedIndex = 0;
		this.open = true;
	}

	closePalette(): void {
		this.open = false;
		this.query = '';
		this.selectedIndex = 0;
		this.activeCommand = null;
		this.pendingInput = '';
	}

	backToCommands(): void {
		this.activeCommand = null;
		this.pendingInput = '';
	}

	selectNext(): void {
		const len = this.filtered.length;
		if (len === 0) return;
		this.selectedIndex = (this.selectedIndex + 1) % len;
	}

	selectPrev(): void {
		const len = this.filtered.length;
		if (len === 0) return;
		this.selectedIndex = (this.selectedIndex - 1 + len) % len;
	}

	executeSelected(): void {
		const result = this.filtered[this.selectedIndex];
		if (!result) return;
		if (result.execAfterInput) {
			this.activeCommand = result;
			this.pendingInput = '';
		} else {
			result.action?.();
			this.closePalette();
		}
	}

	async submitInput(): Promise<void> {
		if (!this.activeCommand?.execAfterInput || !this.pendingInput.trim()) return;
		await this.activeCommand.execAfterInput(this.pendingInput);
		this.closePalette();
	}
}

const COMMAND_PALETTE_KEY = Symbol('SOLYTO_COMMAND_PALETTE');

export function setCommandPalette(): CommandPalette {
	return setContext(COMMAND_PALETTE_KEY, new CommandPalette());
}

export function getCommandPalette(): CommandPalette {
	return getContext<CommandPalette>(COMMAND_PALETTE_KEY);
}
