import React, { createContext, useContext, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { usePersistentState } from '../hooks/usePersistentState';
import { authErrorMessage, AuthMode, INITIAL_WELCOME, restoreWelcome, validateCredentials } from '../lib/auth';
import { authConfigured, getFirebaseAuth } from '../lib/firebase';

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  welcomeCompleted: boolean;
  hasAccess: boolean;
  email: string | null;
  storageError: string | null;
  finishWelcome: () => void;
  continueAsGuest: () => void;
  signIn: (mode: AuthMode, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { value, setValue, ready, error } = usePersistentState('koala.welcome.v1', INITIAL_WELCOME, restoreWelcome);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!authConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!authConfigured) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void Promise.resolve().then(() => {
      if (!active) return;
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), current => {
        if (!active) return;
        setUser(current);
        setAuthReady(true);
      }, () => {
        if (!active) return;
        setAuthError('Couldn’t restore your account. Try signing in again or continue as a guest.');
        setAuthReady(true);
      });
    }).catch(() => {
      if (!active) return;
      setAuthError('Couldn’t initialize account sign-in. You can still continue as a guest.');
      setAuthReady(true);
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const context: AuthContextValue = {
    ready: ready && authReady,
    configured: authConfigured,
    welcomeCompleted: value.completed,
    hasAccess: !!user || value.guest,
    email: user?.email ?? null,
    storageError: error ?? authError,
    finishWelcome: () => setValue(current => ({ ...current, completed: true })),
    continueAsGuest: () => setValue({ completed: true, guest: true }),
    signIn: async (mode, email, password) => {
      const problem = validateCredentials(mode, email, password);
      if (problem) throw new Error(problem.message);
      const auth = getFirebaseAuth();
      try {
        const authenticate = mode === 'signup' ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
        const result = await authenticate(auth, email.trim(), password);
        setValue({ completed: true, guest: false });
        setUser(result.user);
        setAuthError(null);
      } catch (error) { throw new Error(authErrorMessage(error)); }
    },
    requestPasswordReset: async email => {
      const auth = getFirebaseAuth();
      try { await sendPasswordResetEmail(auth, email.trim()); }
      catch (error) {
        if ((error as { code?: string }).code !== 'auth/user-not-found') throw new Error(authErrorMessage(error));
      }
    },
    signOut: async () => {
      if (user) await firebaseSignOut(getFirebaseAuth());
      setUser(null);
      setValue({ completed: true, guest: false });
    },
  };

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
