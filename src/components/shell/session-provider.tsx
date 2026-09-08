"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SignInDialog } from "@/components/shell/sign-in-dialog";

type SessionContextValue = {
  signedIn: boolean;
  address: string | null;
  openSignIn: () => void;
  refresh: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    return {
      signedIn: false,
      address: null,
      openSignIn: () => {},
      refresh: () => {},
    };
  }
  return ctx;
}

export function SessionProvider({
  initialSignedIn,
  address = null,
  children,
}: {
  initialSignedIn: boolean;
  address?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [signInOpen, setSignInOpen] = useState(false);

  const refresh = useCallback(() => {
    setSignedIn(true);
    router.refresh();
  }, [router]);

  const value = useMemo<SessionContextValue>(
    () => ({
      signedIn,
      address,
      openSignIn: () => setSignInOpen(true),
      refresh,
    }),
    [signedIn, address, refresh],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={() => {
          setSignInOpen(false);
          refresh();
        }}
      />
    </SessionContext.Provider>
  );
}
