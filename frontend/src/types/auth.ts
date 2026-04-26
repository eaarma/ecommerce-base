export type UserRole = "ADMIN" | "MANAGER";

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthUserDto {
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  email: string;
  name: string;
  role: UserRole;
}
