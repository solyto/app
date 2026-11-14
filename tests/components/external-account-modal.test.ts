import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { apiRoutes } from '$lib/config/apiRoutes';
import { RateLimitedError } from '$lib/services/ApiService';
import { renderWithContext } from './helpers/context';
import ExternalAccountModalHarness from './helpers/ExternalAccountModalHarness.svelte';
import type { ExternalCalendarAccount, ExternalCalendarCandidate } from '$lib/types/calendar';

const routes = apiRoutes.calendars.externalAccounts;
const ACCOUNT: ExternalCalendarAccount = { id: 7, server_url: 'https://cloud.example.com', username: 'alice', calendars: [] };
const CANDIDATES: ExternalCalendarCandidate[] = [
	{ url: 'https://cloud.example.com/dav/personal/', name: 'Personal', color: '#f00', is_connected: true },
	{ url: 'https://cloud.example.com/dav/work/', name: 'Work', color: '#00f', is_connected: false }
];

function refused(code: string) {
	return { success: false, message: 'Refused.', errors: [code] };
}

function fakeApi(postRaw: (endpoint: string, body: object) => Promise<unknown>) {
	return {
		list: vi.fn(async () => ({ data: [], meta: { unavailable_calendars: [] } })),
		listRaw: vi.fn(async () => ({ success: true, data: CANDIDATES })),
		postRaw: vi.fn(postRaw)
	};
}

function render(api: ReturnType<typeof fakeApi>) {
	renderWithContext(ExternalAccountModalHarness, {}, { stores: { auth: { apiService: api } } });
}

async function fillForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	const [url, username] = screen.getAllByRole('textbox');
	await user.type(url, ' https://cloud.example.com ');
	await user.type(username, 'alice');
	await user.type(document.querySelector('input[type="password"]')!, 'app-password');
}

function submitButton(): HTMLButtonElement {
	return screen.getByRole('button', { name: 'Find calendars' });
}

describe('ExternalAccountModal connect flow', () => {
	it('keeps the submit button disabled until every field is filled', async () => {
		const user = userEvent.setup();
		render(fakeApi(async () => ({ success: true, data: ACCOUNT })));

		expect(submitButton()).toBeDisabled();
		await fillForm(user);
		expect(submitButton()).toBeEnabled();
	});

	it('sends the account once, even when clicked twice while in flight', async () => {
		const user = userEvent.setup();
		let resolve: (value: unknown) => void = () => {};
		const api = fakeApi(() => new Promise((r) => (resolve = r)));
		render(api);
		await fillForm(user);

		await user.click(submitButton());
		expect(submitButton()).toBeDisabled();
		await user.click(submitButton());
		resolve({ success: true, data: ACCOUNT });

		await screen.findByText('Work');
		expect(api.postRaw).toHaveBeenCalledTimes(1);
		expect(api.postRaw).toHaveBeenCalledWith(routes.create, {
			server_url: 'https://cloud.example.com',
			username: 'alice',
			password: 'app-password'
		});
	});

	it.each([
		['external_server_unreachable', "The server couldn't be reached or isn't a CalDAV server. Please check the URL."],
		['external_url_not_allowed', 'This server URL is not allowed. Use the public URL of your server.'],
		['external_no_calendars', 'No calendars were found on this server.'],
		['external_credentials_rejected', 'The server rejected the username or app password.']
	])('shows the %s error in the form', async (code, shown) => {
		const user = userEvent.setup();
		render(fakeApi(async () => refused(code)));
		await fillForm(user);

		await user.click(submitButton());

		expect(await screen.findByText(shown)).toBeInTheDocument();
		expect(submitButton()).toBeEnabled();
	});

	it('shows an invalid URL under the URL field', async () => {
		const user = userEvent.setup();
		render(fakeApi(async () => ({ success: false, errors: { server_url: ['The server url field must be a valid URL.'] } })));
		await fillForm(user);

		await user.click(submitButton());

		expect(await screen.findByText('Enter a valid server URL, e.g. https://cloud.example.com.')).toBeInTheDocument();
	});

	it('shows the rate limit in the form', async () => {
		const user = userEvent.setup();
		render(fakeApi(async () => {
			throw new RateLimitedError(60, 'too_many_requests');
		}));
		await fillForm(user);

		await user.click(submitButton());

		expect(await screen.findByText('Too many attempts. Please try again in 1 minute.')).toBeInTheDocument();
	});

	it('lists the calendars of the new account and connects the selected ones', async () => {
		const user = userEvent.setup();
		const api = fakeApi(async (endpoint) => (endpoint === routes.create ? { success: true, data: ACCOUNT } : { success: true, data: [] }));
		render(api);
		await fillForm(user);
		await user.click(submitButton());

		const connect = await screen.findByRole('button', { name: 'Connect' });
		expect(api.listRaw).toHaveBeenCalledWith(routes.available.replace('%d', '7'));
		expect(screen.getByRole('checkbox', { name: 'Personal' })).toBeDisabled();
		expect(connect).toBeDisabled();

		await user.click(screen.getByRole('checkbox', { name: 'Work' }));
		await user.click(connect);

		await waitFor(() => expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull());
		expect(api.postRaw).toHaveBeenLastCalledWith(routes.connect.replace('%d', '7'), { urls: ['https://cloud.example.com/dav/work/'] });
		expect(api.list).toHaveBeenCalledWith(apiRoutes.calendars.listCalendars);
	});
});
