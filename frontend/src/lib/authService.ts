import { AuthResponseDto, LoginRequestDto } from "@/types/auth";
import api from "./api/axios";

export const AuthService = {
  login: async (data: LoginRequestDto): Promise<AuthResponseDto> => {
    const res = await api.post("/api/auth/login", data);
    return res.data;
  },
};
