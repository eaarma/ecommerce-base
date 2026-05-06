"use client";

import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { loadAuthFromStorage } from "@/store/authSlice";
import { getJwtExpirationTime, handleExpiredSession, isJwtExpired } from "@/lib/authSession";
import { AppDispatch, persistor, RootState, store } from "@/store/store";

type Props = {
  children: React.ReactNode;
};

function AuthHydrator({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (isJwtExpired(accessToken)) {
      handleExpiredSession();
      return;
    }

    const expirationTime = getJwtExpirationTime(accessToken);

    if (expirationTime == null) {
      handleExpiredSession();
      return;
    }

    const timeoutMs = Math.max(expirationTime - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
      handleExpiredSession();
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken]);

  return <>{children}</>;
}

export default function ReduxProvider({ children }: Props) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthHydrator>{children}</AuthHydrator>
      </PersistGate>
    </Provider>
  );
}
