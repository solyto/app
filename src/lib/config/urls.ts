import { env } from '$env/dynamic/public';

export const legalUrls = {
	legalNotice: env.PUBLIC_LEGAL_NOTICE_URL || null,
	privacy: env.PUBLIC_PRIVACY_URL || null,
	terms: env.PUBLIC_TERMS_URL || null
};

export const hasLegalUrls = !!(legalUrls.legalNotice || legalUrls.privacy || legalUrls.terms);

export const urls = {
	home: '/',
	settings: '/settings',
	todos: '/todos',
	notes: '/notes',
	notesImport: '/notes/import',
	notesExport: '/notes/export',
	note: '/notes/[id]',
	login: '/auth/login',
	logout: '/auth/logout',
	register: '/auth/register',
	profile: '/profile',
	checkIn: '/check-in',
	checkInHistory: '/check-in/history',
	checkInDate: '/check-in/date/[date]',
	checkInTrends: '/check-in/trends',
	libraries: '/libraries',
	musicLibrary: '/libraries/music',
	bookLibrary: '/libraries/books',
	linkLibrary: '/libraries/links',
	quoteLibrary: '/libraries/quotes',
	recipeLibrary: '/libraries/recipes',
	movieLibrary: '/libraries/movies',
	gameLibrary: '/libraries/games',
	plantLibrary: '/libraries/plants',
	devRequests: '/dev-requests',
	assistants: '/assistants',
	assistant: '/assistants/[id]',
	createAssistant: '/assistants/create',
	editAssistant: '/assistants/edit/[id]',
	finances: '/finances',
	wealth: '/finances/wealth',
	budget: '/finances/budget',
	feeds: '/feeds',
	timeTracking: '/time-tracking',
	timeTrackingProject: '/time-tracking/[id]',
	calendar: '/calendar',
	contacts: '/contacts',
	clipboard: '/clipboard',
	test: {
		calendars: '/test/calendars',
		contacts: '/test/contacts'
	},
	admin: {
		home: '/admin',
		users: '/admin/users'
	},
	landingPage: 'https://solyto.app'
} as const;
