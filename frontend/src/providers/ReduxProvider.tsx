"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { loadAuthFromStorage } from "@/store/authSlice";
import { AppDispatch, persistor, store } from "@/store/store";

type Props = {
  children: React.ReactNode;
};

function AuthHydrator({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

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
