import type { UserRole } from '../../database/types';
export declare class RegisterDto {
    name: string;
    lastName1: string;
    lastName2?: string;
    email: string;
    password: string;
    role?: UserRole;
}
