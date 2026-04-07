export type FeatureType =
	| 'calendar'
	| 'todos'
	| 'notes'
	| 'libraries'
	| 'contacts'
	| 'checkIn'
	| 'finances'
	| 'clipboard'
	| 'dev_requests'
	| 'feeds'
	| 'timeTracking';

export interface Feature {
	type: FeatureType;
	visible: boolean;
	order?: number | null;
}
