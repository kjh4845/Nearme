import api from './client';
import type { UserProfile } from '../types';

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export async function register(data: { email: string; password: string; nickname: string }) {
  const res = await api.post<UserProfile>('/auth/register', data);
  return res.data;
}

export async function login(data: { email: string; password: string }) {
  const res = await api.post<LoginResponse>('/auth/login', data);
  return res.data;
}
