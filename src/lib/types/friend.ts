export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type FrienRequestDirection = 'sent' | 'received';

export interface Friend {
	user_id: string;
	name: string;
	profile_image_path: string | null;
}

export interface FriendRequest {
	id: number;
	status: FriendRequestStatus;
	direction: FrienRequestDirection;
	created_at: string;
	user: Friend;
}
