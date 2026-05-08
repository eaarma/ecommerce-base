import api from "./api/axios";
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  UserDto,
} from "@/types/user";

export const UserService = {
  getAllUsers: async (): Promise<UserDto[]> => {
    const res = await api.get("/api/admin/users");
    return res.data;
  },
  createUser: async (data: CreateUserRequestDto): Promise<UserDto> => {
    const res = await api.post("/api/admin/users", data);
    return res.data;
  },
  updateUser: async (
    id: string,
    data: UpdateUserRequestDto,
  ): Promise<UserDto> => {
    const res = await api.patch(`/api/admin/users/${id}`, data);
    return res.data;
  },
};
