// Auth types
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface LoginErrorDetail {
    loc: (string | number)[];
    msg: string;
    type: string;
}

export interface LoginErrorResponse {
    detail: string | LoginErrorDetail[];
}
