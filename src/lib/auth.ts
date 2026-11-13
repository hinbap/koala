export type AuthMode = 'signin' | 'signup';

export interface AuthProblem {
  field: 'email' | 'password';
  message: string;
}

export interface WelcomeState {
  completed: boolean;
  guest: boolean;
}

export const INITIAL_WELCOME: WelcomeState = { completed: false, guest: false };
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function restoreWelcome(data: unknown): WelcomeState {
  const saved = data as Partial<WelcomeState> | null;
  const completed = saved?.completed === true;
  return { completed, guest: completed && saved?.guest === true };
}

export function validateCredentials(mode: AuthMode, email: string, password: string): AuthProblem | null {
  if (!email.trim()) return { field: 'email', message: 'Enter your email.' };
  if (!isEmail(email)) return { field: 'email', message: 'That email doesn’t look right.' };
  if (!password) return { field: 'password', message: 'Enter your password.' };
  if (mode === 'signup' && password.length < 8) return { field: 'password', message: 'Use at least 8 characters.' };
  return null;
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'The email or password is incorrect.';
    case 'auth/email-already-in-use': return 'An account already uses this email. Try signing in.';
    case 'auth/invalid-email': return 'That email doesn’t look right.';
    case 'auth/weak-password': return 'Choose a stronger password with at least 8 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed': return 'Couldn’t connect. Check your connection and try again.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/operation-not-allowed': return 'Email sign-in is not enabled for this build. You can continue as a guest.';
    default: return 'Couldn’t complete the request. Please try again.';
  }
}

export function routeAccess(welcomeCompleted: boolean, hasSession: boolean, ringing: boolean) {
  const app = welcomeCompleted && hasSession;
  return {
    app,
    welcome: !app && !ringing && !welcomeCompleted,
    signIn: !app && !ringing && welcomeCompleted,
    puzzle: app || ringing,
  };
}
