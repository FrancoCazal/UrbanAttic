import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { User } from '@/lib/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
}

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/');
      return data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post('/auth/login/', credentials);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { data } = await api.post('/auth/register/', userData);
      return data;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/logout/', {});
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateUserData) => {
      const { data } = await api.patch('/auth/me/', userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post('/auth/verify-email/', { token });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/auth/resend-verification/', { email });
      return data;
    },
  });
}

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/auth/password-reset-request/', { email });
      return data;
    },
  });
}

interface PasswordResetConfirmData {
  token: string;
  new_password: string;
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: async (payload: PasswordResetConfirmData) => {
      const { data } = await api.post('/auth/password-reset-confirm/', payload);
      return data;
    },
  });
}
