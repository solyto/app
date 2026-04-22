export type Language = 'en' | 'de' | 'fr' | 'es';

export interface LayoutRecords {
	modal_explanation: string;
	modal_confirm: string;
	modal_cancel: string;
	save: string;
	double_click_to_edit: string;
	browse: string;
	no_file: string;
	select_file: string;
	selected_file: string;
	processing: string;
	toggle: string;
	apply: string;
	legal_notice: string;
	privacy_policy: string;
	terms_of_service: string;
}

export interface NavigationRecords {
	menu: string;
	toggle_menu: string;
	home: string;
	settings: string;
	todos: string;
	notes: string;
	logout: string;
	profile: string;
	checkIn: string;
	libraries: string;
	dev_requests: string;
	assistants: string;
	finances: string;
	feeds: string;
	admin: string;
	notifications: string;
	calendar: string;
	contacts: string;
	clipboard: string;
	timeTracking: string;
}

export interface HomeRecords {
	slogan: string;
	greeting_morning: string;
	greeting_afternoon: string;
	greeting_evening: string;
	events: string;
	all_day: string;
	due_today: string;
	relevant: string;
	nothing_today: string;
	new_music: string;
	new_books: string;
	recent_notes: string;
	newest_links: string;
	inspiration_empty_hint: string;
}

export interface SettingsRecords {
	english: string;
	german: string;
	french: string;
	spanish: string;
	todos: string;
	tags: string;
	new_tag: string;
	categories: string;
	new_category: string;
	workspaces: string;
	new_workspace: string;
	localization: string;
	language: string;
	integrations: string;
	notifications: string;
	push_notifications: string;
	enable_push_notifications: string;
	email_notifications: string;
	enable_email_notifications: string;
	nextcloud: string;
	widgets: string;
	ai: string;
	telegram_bot: string;
	telegram_bot_notifications: string;
	enable_telegram_bot_notifications: string;
	openai_token: string;
	features: string;
	timezone: string;
	date_format: string;
	time_format: string;
	nextcloud_no_token: string;
	nextcloud_token: string;
	telegram_bot_integration_success: string;
	telegram_bot_token_created: string;
	telegram_bot_register: string;
	telegram_bot_create: string;
	telegram_bot_not_connected: string;
	app: string;
	export_data: string;
	export_select_features: string;
	export_select_all: string;
	export_deselect_all: string;
	export_start: string;
	export_status_pending: string;
	export_status_in_progress: string;
	export_status_completed: string;
	export_status_failed: string;
	export_download: string;
	export_rate_limited: string;
	export_next_available: string;
	export_expired: string;
	export_expires_at: string;
	export_no_exports: string;
}

export interface AuthRecords {
	name: string;
	name_placeholder: string;
	name_error: string;
	email: string;
	email_placeholder: string;
	email_error: string;
	password: string;
	password_placeholder: string;
	password_error: string;
	password_min_length: string;
	password_confirmation: string;
	password_confirmation_placeholder: string;
	password_confirmation_error: string;
	password_matches: string;
	show_password: string;
	hide_password: string;
	register: string;
	login: string;
	logout: string;
	logout_success: string;
	sign_in: string;
	forgot_password: string;
	register_success: string;
	register_error: string;
	login_success: string;
	login_error: string;
	verify_success: string;
	already_verified: string;
	verify_general_error: string;
	verify_token_mismatch: string;
	verify_token_expired: string;
}

export interface TodoRecords {
	all_todos: string;
	new_todo: string;
	enter_todo: string;
	no_todos: string;
	no_todos_desc: string;
	tags: string;
	add_tag: string;
	tag_error: string;
	categories: string;
	add_category: string;
	category_error: string;
	workspaces: string;
	workspace_hide_it: string;
	workspace_hide_it_description: string;
	priority: string;
	priority_high: string;
	priority_medium: string;
	priority_low: string;
	due_at: string;
	due_today: string;
	due_tomorrow: string;
	due_week: string;
	due_overdue: string;
	add_due_at: string;
	status: string;
	status_pending: string;
	status_in_progress: string;
	status_waiting: string;
	status_almost_done: string;
	status_backlog: string;
	effort: string;
	effort_low: string;
	effort_medium: string;
	effort_high: string;
	progress: string;
	delete: string;
	create_success: string;
	delete_success: string;
	switch_view: string;
	view_list: string;
	view_kanban: string;
	view_overview: string;
	uncategorized: string;
	delete_confirm_label: string;
	delete_confirm_message: string;
	add_subtask: string;
	sort_by_score: string;
	no_description: string;
	recurrence: string;
	recurrence_daily: string;
	recurrence_weekly: string;
	recurrence_monthly: string;
	recurrence_yearly: string;
	recurrence_ends_at: string;
	add_recurrence: string;
	remove_recurrence: string;
	recurrence_requires_due: string;
}

export interface CheckInRecords {
	overview: string;
	daily: string;
	statistics: string;
	settings: string;
	mood: string;
	sports: string;
	food_quality: string;
	food_amount: string;
	water: string;
	sleep: string;
	dreams: string;
	work: string;
	menstruation: string;
	alcohol: string;
	smoking: string;
	save_success: string;
	averages: string;
	total: string;
	week: string;
	sport_gym: string;
	sport_cycling: string;
	sport_hiking: string;
	sport_walking: string;
	sport_swimming: string;
	sport_yoga: string;
	sport_replace_with: string;
}

export interface WidgetRecords {
	todos_due_today: string;
	todos_due_overdue: string;
	todos_high_priority: string;
	todos_most_relevant: string;
	check_in_daily: string;
	calendar: string;
	weather: string;
	your_day: string;
	your_day_no_entries: string;
	check_in_statistics: string;
	random_album: string;
	random_quote: string;
	shortcuts: string;
	manage_shortcuts: string;
	shortcut_title: string;
	shortcut_url: string;
	clock: string;
	select_city: string;
	search_city: string;
	search_city_hint: string;
	no_cities_found: string;
	select_city_prompt: string;
	loading: string;
	coming_up: string;
}

export interface NoteRecords {
	notebook: string;
	welcome: string;
	instruction: string;
	new_note: string;
	new_folder: string;
	edit_folder: string;
	delete_note: string;
	delete_folder: string;
	editor: string;
	output: string;
	create_note_success: string;
	create_folder_success: string;
	save_success: string;
	import: string;
	export: string;
	created_days_ago: string;
	updated_days_ago: string;
	new_notes: string;
	last_updated: string;
	enter_note_title: string;
	enter_folder_title: string;
	favorites: string;
	add_to_favorites: string;
	remove_from_favorites: string;
	no_entries: string;
	note_not_found: string;
	insert_image: string;
	insert_image_url: string;
	insert_image_clipboard: string;
	insert_image_upload: string;
	insert_image_no_clipboard: string;
	insert_link: string;
	insert_link_url: string;
	insert_link_name: string;
}

export interface LibraryRecords {
	music: {
		title: string;
		artist: string;
		type: string;
		format: string;
		condition: string;
		acquired_where: string;
		acquired_at: string;
		additional_info: string;
		cover: string;
		link: string;
		type_none: string;
		type_vinyl: string;
		type_cd: string;
		type_digital: string;
		format_none: string;
		format_album: string;
		format_single: string;
		format_compilation: string;
		condition_none: string;
		condition_mint: string;
		condition_verygood: string;
		condition_good: string;
		condition_medium: string;
		condition_poor: string;
		condition_verypoor: string;
		add_album: string;
		edit_album: string;
		import_error: string;
		deezer_preview: string;
		deezer_import: string;
		deezer_import_validation_error: string;
		discogs_import: string;
		discogs_import_validation_error: string;
	};
	books: {
		title: string;
		series: string;
		author: string;
		pages: string;
		current_page: string;
		lent_to: string;
		is_where: string;
		cover: string;
		link: string;
		summary: string;
		started_at: string;
		finished_at: string;
		add_book: string;
		edit_book: string;
		import_error: string;
		hardcover_import: string;
		hardcover_import_validation_error: string;
		goodreads_import: string;
		goodreads_import_validation_error: string;
	};
	movies: {
		title: string;
		category: string;
		category_movie: string;
		category_series: string;
		cover: string;
		link: string;
		started_at: string;
		finished_at: string;
		add_movie: string;
		edit_movie: string;
		import_error: string;
		imdb_import: string;
		imdb_import_validation_error: string;
	};
	games: {
		title: string;
		platform: string;
		platform_pc: string;
		platform_playstation: string;
		platform_xbox: string;
		platform_nintendo: string;
		platform_mobile: string;
		platform_boardgame: string;
		platform_other: string;
		creator: string;
		publisher: string;
		playtime_hours: string;
		completed: string;
		cover: string;
		link: string;
		started_at: string;
		finished_at: string;
		add_game: string;
		edit_game: string;
		import_error: string;
		steam_import: string;
		steam_import_validation_error: string;
		bgg_import: string;
		bgg_import_validation_error: string;
	};
	links: {
		title: string;
		url: string;
		is_favorite: string;
		cover: string;
		add_link: string;
		all: string;
		favorites: string;
		uncategorized: string;
		category_title: string;
		category_color: string;
		create_category: string;
		create_error: string;
	};
	quotes: {
		summary: string;
		author: string;
		quote: string;
		source: string;
		add_quote: string;
		edit_quote: string;
	};
	recipes: {
		title: string;
		ingredients: string;
		description: string;
		cover: string;
		link: string;
		time_to_make: string;
		type: string;
		type_breakfast: string;
		type_lunch: string;
		type_dinner: string;
		type_snack: string;
		type_dessert: string;
		type_drink: string;
		type_other: string;
		minutes: string;
		add_recipe: string;
		edit_recipe: string;
	};
	recommendations: {
		welcome_slogan: string;
		loading_text_local: string;
		loading_text_remote: string;
		satisfied: string;
		not_satisfied: string;
		favorite: string;
		random: string;
		unrated: string;
		new: string;
	};
	navigation: {
		music: string;
		books: string;
		movies: string;
		games: string;
		recipes: string;
		quotes: string;
		links: string;
	};
	genres: string;
	rating: string;
	tags: string;
	edit_genres: string;
	create: string;
	clear_filter: string;
	clear_all_filters: string;
	publication_year: string;
	recommend: string;
	releases: string;
	releases_loading: string;
	release_date: string;
	releases_none: string;
	wishlist: string;
	search_on: string;
	show_on: string;
}

export interface DevRecords {
	requests: {
		new: string;
		status_changed: string;
		screenshot: string;
		bug: string;
		feature: string;
		status_backlog: string;
		status_pending: string;
		status_in_progress: string;
		status_completed: string;
		status_cancelled: string;
		validation_error: string;
		priority_1: string;
		priority_2: string;
		priority_3: string;
		priority_4: string;
		priority_5: string;
		title: string;
		description: string;
		url: string;
		comments_loading: string;
		comments_empty: string;
		comments_placeholder: string;
		comments_submit: string;
		current_requests: string;
		resolved_requests: string;
	};
}

export interface FinanceRecords {
	wealth: string;
	positions: string;
	budget: string;
	total: string;
	income: string;
	expenses: string;
	show_history: string;
	hide_history: string;
	wealth_distribution: string;
	income_vs_expenses: string;
	wealth_trend: string;
}

export interface AssistantRecords {
	add: string;
	create: string;
	update: string;
	no_assistants: string;
	deletion_title: string;
	deletion_description: string;
	chat_placeholder: string;
	title: string;
	description: string;
	prompt: string;
}

export interface FeedRecords {
	feeds: string;
	all_feeds: string;
	add_feed: string;
	edit_feed: string;
	delete_feed: string;
	title: string;
	url: string;
	keywords: string;
	keywords_description: string;
	keywords_placeholder: string;
	blacklist: string;
	blacklist_description: string;
	blacklist_placeholder: string;
	feed_add_success: string;
	feed_add_error: string;
	feed_already_subscribed: string;
	feed_update_success: string;
	feed_update_error: string;
	test_feed: string;
	test_feed_error: string;
	feed_preview: string;
	view_compact: string;
	view_comfortable: string;
	view_card: string;
	browse_feeds: string;
	browse_feeds_search: string;
	browse_feeds_empty: string;
	browse_feeds_friends: string;
	browse_feeds_friends_empty: string;
	browse_feeds_subscribers: string;
}

export interface CalendarRecords {
	months: {
		1: string;
		2: string;
		3: string;
		4: string;
		5: string;
		6: string;
		7: string;
		8: string;
		9: string;
		10: string;
		11: string;
		12: string;
	};
	weekdays: {
		1: string;
		2: string;
		3: string;
		4: string;
		5: string;
		6: string;
		7: string;
	};
	weekdays_short: {
		1: string;
		2: string;
		3: string;
		4: string;
		5: string;
		6: string;
		7: string;
	};
	calendar_week: string;
	calendar: string;
	month: string;
	week: string;
	day: string;
	list: string;
	manage_calendars: string;
	create_entry: string;
	edit_entry: string;
	delete_entry: string;
	title: string;
	start_date: string;
	end_date: string;
	description: string;
	location: string;
	is_all_day: string;
	is_recurring: string;
	choose_calendar: string;
	request_sync: string;
	sync_success: string;
	sync_error: string;
	sync_still_running: string;
	entry_create_error: string;
	create_success: string;
	delete_success: string;
	delete_title: string;
	delete_description: string;
	import_success: string;
	import_error: string;
	import_start: string;
	import_create_calendar: string;
	import_calendars: string;
	import_calendars_running: string;
	import_events: string;
	recurring_event: string;
	recurring_edit_question: string;
	recurring_delete_question: string;
	this_occurrence: string;
	all_occurrences: string;
	today: string;
	no_events: string;
	share_calendar: string;
	share_with_friend: string;
	shared_by: string;
	pending_invites: string;
	accept_invite: string;
	decline_invite: string;
	unsubscribe: string;
	no_friends_to_share: string;
	share_success: string;
	share_error: string;
	invite_accepted: string;
	invite_declined: string;
	unsubscribed: string;
	synchronize: string;
}

export interface ContactRecords {
	add_contact: string;
	address_books: string;
	import_success: string;
	import_error: string;
	import_start: string;
	import_create_address_book: string;
	import_address_books: string;
	import_contacts: string;
	import_contacts_running: string;
}

export interface DavRecords {
	synchronize: string;
	synchronize_headline: string;
	synchronize_server: string;
	synchronize_username: string;
	synchronize_password: string;
	synchronize_password_value: string;
}

export interface NotificationRecords {
	friend_request_title: string;
	friend_request_message: string;
	music_release_title: string;
	music_release_message: string;
	book_release_title: string;
	book_release_message: string;
	calendar_share_title: string;
	calendar_share_message: string;
	dev_request_comment_title: string;
	dev_request_comment_message: string;
	daily_check_in_reminder_title: string;
	daily_check_in_reminder_message: string;
	daily_day_reminder_title: string;
	daily_day_reminder_message: string;
	daily_day_reminder: string;
	daily_check_in_reminder: string;
	export_ready_title: string;
	export_ready_message: string;
}

export interface ClipboardRecords {
	clipboard: string;
	copy: string;
	paste: string;
	copy_success: string;
	save: string;
	save_success: string;
	save_error: string;
	clear: string;
	clear_error: string;
	clear_success: string;
	load_error: string;
	add_entry: string;
	history: string;
	delete_error: string;
	image_save_success: string;
	image_save_error: string;
	image_copy_success: string;
	image_copy_error: string;
}

export interface ProfileRecords {
	friends: string;
	friend_requests: string;
	request_to: string;
	request_pending: string;
	request_rejected: string;
	request_accepted: string;
	received: string;
	sent: string;
}

export interface HelpRecords {
	title: string;
	close: string;
	section_overview: string;
	keyboard_shortcuts: string;
	tips: string;
	shortcut_f1: string;
	shortcut_escape: string;
	shortcut_enter: string;
	shortcut_enter_todo: string;
	home: {
		title: string;
		description: string;
		widgets_tip: string;
		edit_tip: string;
	};
	todos: {
		title: string;
		description: string;
		create_tip: string;
		priority_tip: string;
		workspace_tip: string;
		subtask_tip: string;
	};
	calendar: {
		title: string;
		description: string;
		views_tip: string;
		create_tip: string;
		sync_tip: string;
	};
	notes: {
		title: string;
		description: string;
		markdown_tip: string;
		folders_tip: string;
		export_tip: string;
	};
	libraries: {
		title: string;
		description: string;
		import_tip: string;
		filter_tip: string;
		recommend_tip: string;
	};
	contacts: {
		title: string;
		description: string;
		sync_tip: string;
		groups_tip: string;
	};
	checkIn: {
		title: string;
		description: string;
		daily_tip: string;
		stats_tip: string;
	};
	assistants: {
		title: string;
		description: string;
		create_tip: string;
		prompt_tip: string;
	};
	finances: {
		title: string;
		description: string;
		wealth_tip: string;
		budget_tip: string;
	};
	feeds: {
		title: string;
		description: string;
		add_tip: string;
		filter_tip: string;
	};
	clipboard: {
		title: string;
		description: string;
		sync_tip: string;
	};
	timeTracking: {
		title: string;
		description: string;
		projects_tip: string;
		entries_tip: string;
	};
	settings: {
		title: string;
		description: string;
		features_tip: string;
		localization_tip: string;
	};
	profile: {
		title: string;
		description: string;
		friends_tip: string;
	};
	dev_requests: {
		title: string;
		description: string;
		create_tip: string;
		status_tip: string;
	};
	timeTracking: {
		title: string;
		description: string;
		timer_tip: string;
		projects_tip: string;
	};
}

export interface AdminRecords {
	role_update_success: string;
	role_update_error: string;
}

export interface WelcomeTourRecords {
	welcome_title: string;
	welcome_subtitle: string;
	welcome_description: string;
	features_title: string;
	features_subtitle: string;
	features_description: string;
	feature_calendar: string;
	feature_calendar_desc: string;
	feature_todos: string;
	feature_todos_desc: string;
	feature_notes: string;
	feature_notes_desc: string;
	feature_libraries: string;
	feature_libraries_desc: string;
	feature_contacts: string;
	feature_contacts_desc: string;
	feature_check_in: string;
	feature_check_in_desc: string;
	feature_assistants: string;
	feature_assistants_desc: string;
	feature_finances: string;
	feature_finances_desc: string;
	feature_feeds: string;
	feature_feeds_desc: string;
	feature_clipboard: string;
	feature_clipboard_desc: string;
	feature_time_tracking: string;
	feature_time_tracking_desc: string;
	widgets_title: string;
	widgets_subtitle: string;
	widgets_description: string;
	localization_title: string;
	localization_subtitle: string;
	localization_description: string;
	ready_title: string;
	ready_subtitle: string;
	ready_description: string;
	ready_description_desktop: string;
	next: string;
	back: string;
	skip: string;
	finish: string;
	step_of: string;
	pwa_title: string;
	pwa_description: string;
	pwa_install_button: string;
	pwa_installed: string;
	pwa_ios_instruction: string;
	pwa_browser_hint: string;
	tour_intro_title: string;
	tour_intro_description: string;
	tour_outro_title: string;
	tour_outro_description: string;
	tour_start: string;
}

export interface TimeTrackingRecords {
	time_tracking: string;
	projects: string;
	entries: string;
	statistics: string;
	categories: string;
	add_project: string;
	edit_project: string;
	add_entry: string;
	add_category: string;
	edit_category: string;
	title: string;
	description: string;
	color: string;
	started_at: string;
	stopped_at: string;
	duration: string;
	duration_minutes: string;
	project: string;
	category: string;
	start_timer: string;
	stop_timer: string;
	timer_running: string;
	no_projects: string;
	no_entries: string;
	no_description: string;
	manual_entry: string;
	total_time: string;
	uncategorized: string;
	date_range: string;
	from: string;
	to: string;
	hours: string;
	minutes: string;
	dashboard: string;
	recent_entries: string;
	today: string;
	this_week: string;
	this_month: string;
	deletion_title: string;
	deletion_description: string;
	pomodoro: string;
	work_session: string;
	short_break: string;
	long_break: string;
	sessions_completed: string;
	start: string;
	pause: string;
	resume: string;
	skip: string;
	reset: string;
	filter_by_category: string;
	all_categories: string;
	edit_entry: string;
}

export interface CookieConsentRecords {
	title: string;
	body: string;
	accept: string;
	privacy_policy: string;
}

export interface LanguageFile {
	layout: LayoutRecords;
	nav: NavigationRecords;
	auth: AuthRecords;
	home: HomeRecords;
	settings: SettingsRecords;
	todos: TodoRecords;
	checkIn: CheckInRecords;
	widgets: WidgetRecords;
	notes: NoteRecords;
	libraries: LibraryRecords;
	dev: DevRecords;
	finances: FinanceRecords;
	assistants: AssistantRecords;
	feeds: FeedRecords;
	calendar: CalendarRecords;
	contacts: ContactRecords;
	notifications: NotificationRecords;
	clipboard: ClipboardRecords;
	profile: ProfileRecords;
	dav: DavRecords;
	help: HelpRecords;
	welcome_tour: WelcomeTourRecords;
	admin: AdminRecords;
	cookie_consent: CookieConsentRecords;
	timeTracking: TimeTrackingRecords;
}
