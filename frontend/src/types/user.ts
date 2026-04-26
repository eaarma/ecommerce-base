import { UserRole } from "./auth";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface CreateUserRequestDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserRequestDto {
  name: string;
  status: UserStatus;
}
