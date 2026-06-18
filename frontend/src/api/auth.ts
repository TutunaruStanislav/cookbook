import type { User } from '../types';
import api from './client';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { username, password }),

  register: (data: RegisterData) => api.post<User>('/auth/register/', data),

  me: () => api.get<User>('/auth/me/'),

  updateMe: (data: Partial<Pick<User, 'email' | 'first_name' | 'last_name'>>) =>
    api.patch<User>('/auth/me/', data),

  changePassword: (current_password: string, new_password: string) =>
    api.post<{ detail: string }>('/auth/change-password/', {
      current_password,
      new_password,
    }),
};
