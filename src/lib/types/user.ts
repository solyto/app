export interface User {
	id: string;
	name: string;
	email: string;
	role: 'user' | 'admin' | 'super_admin';
	created_at: string;
	updated_at: string;
}

export interface UpdateUserRoleRequest {
	role: 'user' | 'admin' | 'super_admin';
}
