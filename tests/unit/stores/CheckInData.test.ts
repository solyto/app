import { describe, it, expect, beforeEach } from 'vitest';
import { CheckInData } from '$lib/state/CheckInData.svelte';
import { api, auth, pageState, resetStoreMocks } from '../setup/storeMocks';
import { DEFAULT_SPORTS } from '$lib/types/check_in';
import type { CheckInTracker, CheckInValue } from '$lib/types/check_in';

function tracker(overrides: Partial<CheckInTracker> = {}): CheckInTracker {
	return {
		id: 1,
		key: 'mood',
		name: null,
		type: 'scale',
		icon: null,
		position: 0,
		enabled: true,
		scored: true,
		goal: null,
		alerts: [],
		...overrides
	};
}

const mood = tracker();
const sports = tracker({ id: 2, key: 'sports', type: 'sport', position: 1, scored: false });
const meditated = tracker({ id: 3, key: null, name: 'Meditated', type: 'yes_no', position: 2, scored: false });
const glasses = tracker({ id: 4, key: null, name: 'Glasses', type: 'count', position: 3, scored: false, enabled: false });

function value(trackerId: number, date: string, v: number): CheckInValue {
	return { tracker_id: trackerId, date, value: v };
}

function loaded(trackers: CheckInTracker[] = [mood, sports, meditated, glasses], values: CheckInValue[] = []): CheckInData {
	const s = new CheckInData();
	s.trackers = trackers;
	s.values = values;
	return s;
}

beforeEach(() => {
	resetStoreMocks();
	pageState.pathname = '/check-in';
	pageState.params = {};
});

describe('CheckInData store', () => {
	it('starts empty with the default sports and the current month', () => {
		const s = new CheckInData();
		const now = new Date();
		expect(s.loaded).toBe(false);
		expect(s.trackers).toEqual([]);
		expect(s.selectedSports).toEqual(DEFAULT_SPORTS);
		expect(s.historyMonth).toEqual({ year: now.getFullYear(), month: now.getMonth() });
	});

	describe('tracker groups', () => {
		it('splits the enabled trackers into ratings and logs, in order', () => {
			const s = loaded();
			expect(s.activeTrackers.map((t) => t.id)).toEqual([1, 2, 3]);
			expect(s.ratingTrackers.map((t) => t.id)).toEqual([1, 2]);
			expect(s.logTrackers.map((t) => t.id)).toEqual([3]);
		});

		it('scores only enabled 1–5 trackers that count towards the score', () => {
			const s = loaded([mood, sports, tracker({ id: 5, key: 'sleep', scored: false }), tracker({ id: 6, key: 'water', enabled: false })]);
			expect(s.scoredTrackers.map((t) => t.id)).toEqual([1]);
		});
	});

	describe('values', () => {
		it('reads a tracker\'s value on a day', () => {
			const s = loaded(undefined, [value(1, '2026-08-14', 4)]);
			expect(s.getValue(mood, '2026-08-14')).toBe(4);
			expect(s.getValue(mood, '2026-08-15')).toBeNull();
			expect(s.getValue(meditated, '2026-08-14')).toBeNull();
		});

		it('gives the built-in values of a day in the old one-row shape, from the page date by default', () => {
			pageState.params = { date: '2026-08-14' };
			const s = loaded(undefined, [value(1, '2026-08-14', 4), value(3, '2026-08-14', 1)]);

			expect(s.getDayData()?.mood).toBe(4);
			expect(s.getDayData('2026-08-14')?.sports).toBeNull();
			expect(s.getDayData('2026-08-15')).toBeNull();
		});
	});

	describe('load', () => {
		it('loads trackers, values and the chosen sports', async () => {
			api.list.mockImplementation(async (url: string) =>
				url.endsWith('/check-in/trackers') ? { data: [mood] } : { data: [value(1, '2026-08-14', 4)] }
			);
			api.get.mockResolvedValue({ data: { enabled_trackers: ['mood'], selected_sports: ['yoga', 'bike'] } });

			const s = new CheckInData();
			await s.load();

			expect(s.loaded).toBe(true);
			expect(s.trackers).toEqual([mood]);
			expect(s.values).toEqual([value(1, '2026-08-14', 4)]);
			expect(s.selectedSports).toEqual(['yoga', 'bike']);
		});

		it('stays unloaded when the trackers or values fail', async () => {
			api.list.mockImplementation(async (url: string) => (url.endsWith('/check-in/trackers') ? { data: [mood] } : null));
			api.get.mockResolvedValue(null);

			const s = new CheckInData();
			await s.load();

			expect(s.loaded).toBe(false);
			expect(s.trackers).toEqual([]);
			expect(s.selectedSports).toEqual(DEFAULT_SPORTS);
		});
	});

	describe('setValue', () => {
		it('shows the new value right away, saves it and tells the widgets', async () => {
			api.put.mockResolvedValue(true);
			const s = loaded(undefined, [value(3, '2026-08-14', 1)]);

			const saving = s.setValue(glasses, '2026-08-14', 3);
			expect(s.getValue(glasses, '2026-08-14')).toBe(3);

			expect(await saving).toBe(true);
			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/values$/), { tracker_id: 4, date: '2026-08-14', value: 3 });
			expect(auth.widgetBridge.notifyChanged).toHaveBeenCalled();
		});

		it('clears a value with null', async () => {
			api.put.mockResolvedValue(true);
			const s = loaded(undefined, [value(3, '2026-08-14', 1)]);

			await s.setValue(meditated, '2026-08-14', null);

			expect(s.getValue(meditated, '2026-08-14')).toBeNull();
		});

		it('puts the old value back when saving fails', async () => {
			api.put.mockResolvedValue(false);
			const s = loaded(undefined, [value(1, '2026-08-14', 2)]);

			expect(await s.setValue(mood, '2026-08-14', 5)).toBe(false);
			expect(s.getValue(mood, '2026-08-14')).toBe(2);
			expect(auth.widgetBridge.notifyChanged).not.toHaveBeenCalled();
		});

		it('saveDay saves every change and reports a failure', async () => {
			api.put.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
			const s = loaded();

			const ok = await s.saveDay('2026-08-14', new Map([[mood, 4], [sports, 2]]));

			expect(ok).toBe(false);
			expect(api.put).toHaveBeenCalledTimes(2);
		});
	});

	describe('saveSelectedSports', () => {
		it('sends the sports with the enabled built-in trackers, which the old endpoint requires', async () => {
			api.put.mockResolvedValue(true);
			const s = loaded();

			expect(await s.saveSelectedSports(['yoga', 'bike', 'mountain', 'footprints', 'dumbbell'])).toBe(true);

			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/users\/me\/settings\/check-in$/), {
				enabled_trackers: ['mood', 'sports'],
				selected_sports: ['yoga', 'bike', 'mountain', 'footprints', 'dumbbell']
			});
			expect(s.selectedSports[0]).toBe('yoga');
		});

		it('keeps the old sports when saving fails', async () => {
			api.put.mockResolvedValue(false);
			const s = loaded();

			expect(await s.saveSelectedSports(['yoga', 'bike', 'mountain', 'footprints', 'dumbbell'])).toBe(false);
			expect(s.selectedSports).toEqual(DEFAULT_SPORTS);
		});
	});

	describe('tracker changes', () => {
		beforeEach(() => {
			api.list.mockResolvedValue({ data: [mood, meditated] });
		});

		it('creates a tracker and returns it from the reloaded list', async () => {
			api.create.mockResolvedValue({ data: meditated });
			const s = loaded([mood]);

			const created = await s.createTracker({ name: 'Meditated', type: 'yes_no', icon: 'flower-2' });

			expect(api.create).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers$/), { name: 'Meditated', type: 'yes_no', icon: 'flower-2' });
			expect(created).toEqual(meditated);
			expect(s.trackers).toEqual([mood, meditated]);
		});

		it('updates a tracker on its own URL and reloads', async () => {
			api.put.mockResolvedValue(true);
			const s = loaded();

			expect(await s.updateTracker(meditated, { enabled: false })).toBe(true);

			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/3$/), { enabled: false });
			expect(api.list).toHaveBeenCalled();
		});

		it('does not reload when a change is rejected', async () => {
			api.put.mockResolvedValue(false);
			const s = loaded();

			expect(await s.updateTracker(meditated, { enabled: false })).toBe(false);
			expect(api.list).not.toHaveBeenCalled();
		});

		it('drops a deleted tracker\'s values', async () => {
			api.delete.mockResolvedValue(true);
			const s = loaded(undefined, [value(3, '2026-08-14', 1), value(1, '2026-08-14', 4)]);

			await s.deleteTracker(meditated);

			expect(api.delete).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/%d$/), 3);
			expect(s.values).toEqual([value(1, '2026-08-14', 4)]);
		});

		it('moves a tracker by swapping it with its neighbour', async () => {
			api.put.mockResolvedValue(true);
			const s = loaded([mood, sports, meditated]);

			await s.moveTracker(meditated, -1);

			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/order$/), { ids: [1, 3, 2] });
		});

		it('does not move the first tracker up or the last one down', async () => {
			const s = loaded([mood, sports]);

			expect(await s.moveTracker(mood, -1)).toBe(false);
			expect(await s.moveTracker(sports, 1)).toBe(false);
			expect(api.put).not.toHaveBeenCalled();
		});

		it('sets and removes goals and reminders on their URLs', async () => {
			api.put.mockResolvedValue(true);
			api.delete.mockResolvedValue(true);
			api.create.mockResolvedValue({ data: meditated });
			const s = loaded();

			await s.setGoal(meditated, { period: 'week', comparison: 'at_least', target: 5 });
			await s.deleteGoal(meditated);
			await s.addAlert(meditated, { time: '20:00' });
			await s.updateAlert(7, { time: '21:00' });
			await s.deleteAlert(7);

			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/3\/goal$/), { period: 'week', comparison: 'at_least', target: 5 });
			expect(api.delete).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/%d\/goal$/), 3);
			expect(api.create).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/trackers\/3\/alerts$/), { time: '20:00' });
			expect(api.put).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/alerts\/7$/), { time: '21:00' });
			expect(api.delete).toHaveBeenCalledWith(expect.stringMatching(/\/check-in\/alerts\/%d$/), 7);
		});
	});

	describe('month navigation', () => {
		it('prevMonth goes back one month', () => {
			const s = new CheckInData();
			s.historyMonth = { year: 2026, month: 7 };
			s.prevMonth();
			expect(s.historyMonth).toEqual({ year: 2026, month: 6 });
		});

		it('prevMonth wraps January to December of the previous year', () => {
			const s = new CheckInData();
			s.historyMonth = { year: 2026, month: 0 };
			s.prevMonth();
			expect(s.historyMonth).toEqual({ year: 2025, month: 11 });
		});

		it('nextMonth advances one month', () => {
			const s = new CheckInData();
			s.historyMonth = { year: 2026, month: 7 };
			s.nextMonth();
			expect(s.historyMonth).toEqual({ year: 2026, month: 8 });
		});

		it('nextMonth wraps December to January of the next year', () => {
			const s = new CheckInData();
			s.historyMonth = { year: 2026, month: 11 };
			s.nextMonth();
			expect(s.historyMonth).toEqual({ year: 2027, month: 0 });
		});
	});

	describe('isCurrentMonth', () => {
		it('is true when the history month matches today', () => {
			const s = new CheckInData();
			const now = new Date();
			s.historyMonth = { year: now.getFullYear(), month: now.getMonth() };
			expect(s.isCurrentMonth()).toBe(true);
		});

		it('is false for any other month', () => {
			const s = new CheckInData();
			const now = new Date();
			const otherMonth = (now.getMonth() + 1) % 12;
			s.historyMonth = {
				year: otherMonth === 0 ? now.getFullYear() + 1 : now.getFullYear(),
				month: otherMonth
			};
			expect(s.isCurrentMonth()).toBe(false);
		});
	});
});
