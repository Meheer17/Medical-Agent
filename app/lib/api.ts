import { Platform } from 'react-native';

import type {
    Appointment,
    AuthToken,
    AuthUser,
    BookAppointmentPayload,
    ChatMessageResponse,
    DoctorAvailability,
    DoctorProfile,
    PatientProfile,
    SignUpPayload,
} from '@/lib/types';

const explicitBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function defaultBaseUrl(): string {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = "http://192.168.0.110:8000"// (explicitBaseUrl && explicitBaseUrl.replace(/\/$/, '')) || defaultBaseUrl();

export class ApiError extends Error {
    status: number;
    payload: unknown;

    constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

function parseErrorMessage(payload: unknown, fallback: string): string {
    if (payload && typeof payload === 'object' && 'detail' in payload) {
        const detail = (payload as { detail?: unknown }).detail;
        if (typeof detail === 'string') {
            return detail;
        }
        if (Array.isArray(detail)) {
            return detail
                .map((item) => {
                    if (!item || typeof item !== 'object') {
                        return '';
                    }
                    const msg = (item as { msg?: unknown }).msg;
                    return typeof msg === 'string' ? msg : '';
                })
                .filter(Boolean)
                .join(', ');
        }
    }
    return fallback;
}

async function parseResponse(response: Response): Promise<unknown> {
    const raw = await response.text();
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return raw;
    }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as Record<string, string> | undefined),
    };

    const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
    if (init.body && !hasContentType) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
    });

    const payload = await parseResponse(response);
    if (!response.ok) {
        throw new ApiError(
            parseErrorMessage(payload, `Request failed with status ${response.status}`),
            response.status,
            payload,
        );
    }

    return payload as T;
}

export async function login(email: string, password: string): Promise<AuthToken> {
    const body = new URLSearchParams({
        username: email,
        password,
    });

    return request<AuthToken>(
        '/auth/login',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        },
    );
}

export async function signup(payload: SignUpPayload): Promise<AuthUser> {
    return request<AuthUser>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function verify(token: string): Promise<AuthUser> {
    return request<AuthUser>('/auth/verify', { method: 'GET' }, token);
}

export async function fetchDoctors(token: string): Promise<DoctorProfile[]> {
    return request<DoctorProfile[]>('/doctors', { method: 'GET' }, token);
}

export async function fetchDoctorAvailability(token: string, specialty?: string): Promise<DoctorAvailability[]> {
    const params = specialty?.trim() ? `?specialty=${encodeURIComponent(specialty.trim())}` : '';
    return request<DoctorAvailability[]>(`/doctors/availability${params}`, { method: 'GET' }, token);
}

export async function fetchAppointments(token: string): Promise<Appointment[]> {
    return request<Appointment[]>('/appointments/my-schedule', { method: 'GET' }, token);
}

export async function bookAppointment(token: string, payload: BookAppointmentPayload): Promise<Appointment> {
    return request<Appointment>(
        '/appointments/book',
        {
            method: 'POST',
            body: JSON.stringify(payload),
        },
        token,
    );
}

export async function fetchPatientMe(token: string): Promise<PatientProfile> {
    return request<PatientProfile>('/patients/me', { method: 'GET' }, token);
}

export async function fetchDoctorMe(token: string): Promise<DoctorProfile> {
    return request<DoctorProfile>('/doctors/me', { method: 'GET' }, token);
}

export async function fetchPatientById(token: string, patientId: number): Promise<PatientProfile> {
    return request<PatientProfile>(`/patients/${patientId}`, { method: 'GET' }, token);
}

export async function sendChatMessage(
    token: string,
    message: string,
    sessionId?: string,
): Promise<ChatMessageResponse> {
    return request<ChatMessageResponse>(
        '/chat/message',
        {
            method: 'POST',
            body: JSON.stringify({
                message,
                session_id: sessionId,
            }),
        },
        token,
    );
}
