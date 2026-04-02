import { AppConfig } from '@/constants/config';

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  token?: string | null;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

export type ServiceRecord = {
  id: number;
  nombre: string;
  categoria?: string;
  precio?: number;
  duracion_min?: number;
  imagen?: string | null;
  descripcion?: string | null;
};

export type BarberRecord = {
  id: number;
  name: string;
  especialidades?: string | null;
  foto?: string | null;
  descripcion?: string | null;
};

export type SlotRecord = {
  time: string;
  label: string;
};

export type AppointmentRecord = {
  id: number;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado?: string;
  notas?: string | null;
  precio_cobrado?: number | string | null;
  client?: { id?: number | null; name?: string | null };
  barber?: { id?: number | null; name?: string | null };
  service?: { id?: number | null; nombre?: string | null; precio?: number | string | null; duracion_min?: number | null };
};

export type InventoryProductRecord = {
  id: number;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  tipo?: string | null;
  stock_actual?: number;
  stock_minimo?: number;
  precio_compra?: number | string | null;
  precio_venta?: number | string | null;
  active?: boolean;
  low_stock?: boolean;
  imagen_url?: string | null;
};

export type InventoryMovementRecord = {
  id: number;
  tipo?: string;
  cantidad?: number;
  motivo?: string | null;
  fecha?: string | null;
  product?: { id?: number | null; nombre?: string | null };
  user?: { id?: number | null; name?: string | null };
  appointment?: { id?: number | null; fecha?: string | null; client?: string | null };
};

export type PaymentRecord = {
  id: number;
  monto?: number | string | null;
  metodo_pago?: string;
  propina?: number | string | null;
  receipt_url?: string | null;
  created_at?: string | null;
  appointment?: {
    id?: number | null;
    fecha?: string | null;
    hora_inicio?: string | null;
    service?: string | null;
    client?: string | null;
    barber?: string | null;
  };
  creator?: { id?: number | null; name?: string | null };
};

export type LogRecord = {
  id: number;
  log_name?: string;
  description?: string | null;
  event?: string | null;
  subject_type?: string | null;
  subject_id?: number | string | null;
  properties?: Record<string, unknown>;
  created_at?: string | null;
  causer?: { id?: number | null; name?: string | null; email?: string | null } | null;
};

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string | null;
  roles: string[];
};

export type ClientRecord = {
  id: number;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  created_at?: string | null;
  appointments_count?: number;
  preferencias_notificacion?: Record<string, boolean>;
  user?: { id?: number | null; name?: string | null; email?: string | null };
};

export type ChatbotQueryResponse = {
  response: string;
  retry_after?: number;
};

export type ChatbotHistoryResponse = {
  history: Array<Record<string, unknown>>;
  summary?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${AppConfig.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Request failed', response.status, payload);
  }

  return payload as T;
}

export const api = {
  request,
  login: (payload: { email: string; password: string; device_name?: string }) =>
    request<{ message: string; token: string; token_type: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: payload,
    }),
  me: (token: string) => request<{ user: unknown }>('/auth/me', { token }),
  dashboard: (token: string) => request('/dashboard', { token }),
  services: () => request<{ data: ServiceRecord[] }>('/services'),
  barbers: () => request<{ data: BarberRecord[] }>('/barbers'),
  availability: (token: string, params: { barber_id: number; service_id: number; date: string }) =>
    request<{ slots: SlotRecord[] }>(
      `/availability/slots?barber_id=${params.barber_id}&service_id=${params.service_id}&date=${params.date}`,
      { token }
    ),
  appointments: (token: string) => request<{ data: AppointmentRecord[] }>('/appointments', { token }),
  createAppointment: (
    token: string,
    payload: { barber_id: number; service_id: number; fecha: string; hora_inicio: string; notas?: string }
  ) => request<{ message: string; data: AppointmentRecord }>('/appointments', { token, method: 'POST', body: payload }),
  cancelAppointment: (token: string, appointmentId: number) =>
    request<{ message: string }>(`/appointments/${appointmentId}`, { token, method: 'DELETE' }),
  updateAppointmentStatus: (
    token: string,
    appointmentId: number,
    payload: { estado: string; notas?: string }
  ) =>
    request<{ message: string; data: AppointmentRecord }>(`/appointments/${appointmentId}/status`, {
      token,
      method: 'PATCH',
      body: payload,
    }),
  getNotifications: (token: string) =>
    request<{ data: NotificationRecord[] }>('/notifications', { token }),
  markNotificationsRead: (token: string) =>
    request<{ message: string }>('/notifications/read-all', { token, method: 'POST' }),
  getBarberPortfolio: (token: string, barberId: number) =>
    request<{ data: WorkRecord[] }>(`/barbers/${barberId}/portfolio`, { token }),
  users: (token: string, params?: { q?: string; role?: string; page?: number }) => {
    const searchParams = new URLSearchParams();

    if (params?.q) {
      searchParams.set('q', params.q);
    }

    if (params?.role) {
      searchParams.set('role', params.role);
    }

    if (params?.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }

    const queryString = searchParams.toString();

    return request<{ data: UserRecord[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; filters: { q: string; role: string }; roles: string[] }>(
      queryString ? `/users?${queryString}` : '/users',
      { token }
    );
  },
  clients: (token: string, params?: { q?: string; page?: number }) => {
    const searchParams = new URLSearchParams();

    if (params?.q) {
      searchParams.set('q', params.q);
    }

    if (params?.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }

    const queryString = searchParams.toString();

    return request<{ data: ClientRecord[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; filters: { q: string } }>(
      queryString ? `/clients?${queryString}` : '/clients',
      { token }
    );
  },
  inventoryProducts: (token: string) => request<{ data: InventoryProductRecord[] }>('/inventory/products', { token }),
  inventoryMovements: (token: string) => request<{ data: InventoryMovementRecord[] }>('/inventory/movements', { token }),
  payments: (token: string) => request<{ data: PaymentRecord[] }>('/payments', { token }),
  logs: (token: string, params?: { q?: string; log_name?: string; page?: number }) => {
    const searchParams = new URLSearchParams();

    if (params?.q) {
      searchParams.set('q', params.q);
    }

    if (params?.log_name) {
      searchParams.set('log_name', params.log_name);
    }

    if (params?.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }

    const queryString = searchParams.toString();

    return request<{ data: LogRecord[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; filters: { q: string; log_name: string }; log_names: string[] }>(
      queryString ? `/logs?${queryString}` : '/logs',
      { token }
    );
  },
  createPayment: (
    token: string,
    payload: { appointment_id: number; monto: number; metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr'; propina?: number }
  ) => request<{ message: string; data: PaymentRecord }>('/payments', { token, method: 'POST', body: payload }),
  chatbotQuery: (payload: { message: string }, token?: string | null) =>
    request<ChatbotQueryResponse>('/chatbot/query', { method: 'POST', body: payload, token: token ?? undefined }),
  chatbotHistory: (token: string) => request<ChatbotHistoryResponse>('/chatbot/history', { token }),
  chatbotClearHistory: (token: string) => request<{ message: string }>('/chatbot/clear-history', { token, method: 'POST' }),
};

export type NotificationRecord = {
  id: number;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type WorkRecord = {
  id: number;
  title: string;
  description?: string | null;
  work_date: string;
  images: { id: number; image: string }[];
  barber?: { id: number; name: string };
};