import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthUserDto } from "@/types/auth";

interface AuthState {
  user: AuthUserDto | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: AuthUserDto; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("authUser", JSON.stringify(action.payload.user));
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
      }
    },
    loadAuthFromStorage: (state) => {
      if (typeof window === "undefined") return;

      const accessToken = localStorage.getItem("accessToken");
      const user = localStorage.getItem("authUser");

      if (accessToken) {
        state.accessToken = accessToken;
      }

      if (user) {
        state.user = JSON.parse(user);
      }
    },
  },
});

export const { setAuth, clearAuth, loadAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
