// Auth types
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface User {
    id: string;
    phone_number: string;
    full_name: string;
    email?: string;
    is_active: boolean;
    is_superuser: boolean;
}

export interface RegisterResponse {
    user: User;
    tokens: TokenResponse;
}

export interface LoginErrorDetail {
    loc: (string | number)[];
    msg: string;
    type: string;
}

export interface LoginErrorResponse {
    detail: string | LoginErrorDetail[];
}

export interface RegisterErrorResponse {
    detail: string | LoginErrorDetail[];
}
