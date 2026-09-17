import apiClient from '@/lib/api';
import { User } from '@/lib/types';

export interface AdminCreatePayload {
    phone_number: string;
    full_name: string;
    password: string;
    email?: string;
}

export interface StaffCreatePayload {
    phone_number: string;
    full_name: string;
    password: string;
    email?: string;
}

export const userService = {
    // 1. Superuser only: Provision new business admin
    async createAdmin(payload: AdminCreatePayload): Promise<User> {
        const res = await apiClient.post<User>('/api/v1/users/admin', payload);
        return res.data;
    },

    // 2. Admin or Superuser: Provision new staff member
    async createStaff(payload: StaffCreatePayload): Promise<User> {
        const res = await apiClient.post<User>('/api/v1/users/staff', payload);
        return res.data;
    },

    // 3. List team members and users
    async listUsers(params?: {
        role?: 'admin' | 'staff' | 'customer';
        is_active?: boolean;
        skip?: number;
        limit?: number;
    }): Promise<User[]> {
        const res = await apiClient.get<User[]>('/api/v1/users', { params });
        return res.data;
    },

    // 4. Update user role
    async updateUserRole(userId: string, newRole: 'admin' | 'staff' | 'customer'): Promise<User> {
        const res = await apiClient.patch<User>(`/api/v1/users/${userId}/role`, {
            role: newRole,
        });
        return res.data;
    },
};
