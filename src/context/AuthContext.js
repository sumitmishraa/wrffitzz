'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync / verify user session with Supabase and localStorage
  const syncUserProfile = useCallback(async (phone, existingName, existingEmail) => {
    try {
      const cleanPhone = phone ? String(phone).trim() : '';
      const cleanEmail = existingEmail ? String(existingEmail).trim() : '';
      const queryParam = cleanEmail
        ? `email=${encodeURIComponent(cleanEmail)}`
        : cleanPhone
        ? `phone=${encodeURIComponent(cleanPhone)}`
        : '';

      if (queryParam) {
        const res = await fetch(`/api/user?${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const profile = {
              phone: data.user.phone || cleanPhone || '',
              name: data.user.name || existingName || (cleanEmail ? cleanEmail.split('@')[0] : 'wrfitzz Member'),
              email: data.user.email || cleanEmail || '',
              isAdmin: Boolean(data.user.is_admin),
              joinedDate: new Date(data.user.created_at || Date.now()).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              }),
            };
            localStorage.setItem('wrfitzz-user', JSON.stringify(profile));
            setUser(profile);
            window.dispatchEvent(new Event('wrfitzz_user_updated'));
            return profile;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync profile from Supabase:', e);
    }

    // Default fallback profile
    const fallback = {
      phone: phone || '',
      name: existingName || (existingEmail ? existingEmail.split('@')[0] : 'wrfitzz Member'),
      email: existingEmail || '',
      isAdmin: false,
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
    localStorage.setItem('wrfitzz-user', JSON.stringify(fallback));
    setUser(fallback);
    window.dispatchEvent(new Event('wrfitzz_user_updated'));
    return fallback;
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrfitzz-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.email || parsed.phone) {
          syncUserProfile(parsed.phone, parsed.name, parsed.email);
        }
      }
    } catch (err) {
      console.warn('Auth local load error:', err);
    } finally {
      setLoading(false);
    }
  }, [syncUserProfile]);

  // 1. Google 1-Click Sign-In
  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const firebaseUser = cred.user;

      const userEmail = firebaseUser.email || '';
      const userName = firebaseUser.displayName || (userEmail ? userEmail.split('@')[0] : 'wrfitzz Member');
      const userPhone = firebaseUser.phoneNumber || '';

      // Register or sync user with backend
      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: userPhone,
            name: userName,
            email: userEmail,
          }),
        });
      } catch (e) {
        console.warn('Could not register Google user to backend:', e);
      }

      const profile = await syncUserProfile(userPhone, userName, userEmail);
      return { success: true, user: profile };
    } catch (err) {
      console.error('Firebase Google Sign-In error:', err);
      const code = (err?.code || '').toLowerCase();

      if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        throw new Error('Google sign-in popup was closed. Please try again.');
      }
      if (code.includes('operation-not-allowed')) {
        throw new Error('Google Sign-In is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.');
      }
      if (code.includes('unauthorized-domain')) {
        throw new Error('Domain not authorized. Please add "wrfitzz.com" to Firebase Console > Authentication > Settings > Authorised domains.');
      }
      throw new Error(err.message || 'Failed to sign in with Google. Please try again.');
    }
  }, [syncUserProfile]);

  // 2. Email & Password Sign-In
  const signInWithEmail = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    if (!email || !password) throw new Error('Please enter both email and password.');

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = cred.user;

      const profile = await syncUserProfile(
        firebaseUser.phoneNumber || '',
        firebaseUser.displayName || email.split('@')[0],
        firebaseUser.email || email.trim()
      );
      return { success: true, user: profile };
    } catch (err) {
      console.error('Firebase Email Sign-In error:', err);
      const code = (err?.code || '').toLowerCase();

      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        throw new Error('Invalid email or password. Please verify your credentials or create an account.');
      }
      if (code.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }
      if (code.includes('operation-not-allowed')) {
        throw new Error('Email/Password is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.');
      }
      if (code.includes('too-many-requests')) {
        throw new Error('Too many failed attempts. Please reset your password or wait a few minutes.');
      }
      throw new Error(err.message || 'Failed to sign in. Please verify your credentials.');
    }
  }, [syncUserProfile]);

  // 3. Email & Password Sign-Up (New Account)
  const signUpWithEmail = useCallback(async (email, password, name = '') => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    if (!email || !password) throw new Error('Please provide an email and password.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = cred.user;

      if (name) {
        try {
          await updateFirebaseProfile(firebaseUser, { displayName: name });
        } catch (e) {}
      }

      const userName = name || email.split('@')[0];

      // Register user with backend
      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '',
            name: userName,
            email: email.trim(),
          }),
        });
      } catch (e) {
        console.warn('Could not register user in backend:', e);
      }

      const profile = await syncUserProfile('', userName, email.trim());
      return { success: true, user: profile };
    } catch (err) {
      console.error('Firebase Email Sign-Up error:', err);
      const code = (err?.code || '').toLowerCase();

      if (code.includes('email-already-in-use')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (code.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }
      if (code.includes('weak-password')) {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      }
      if (code.includes('operation-not-allowed')) {
        throw new Error('Email/Password is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.');
      }
      throw new Error(err.message || 'Failed to create account. Please try again.');
    }
  }, [syncUserProfile]);

  // 4. Password Reset Email
  const sendPasswordReset = useCallback(async (email) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    if (!email) throw new Error('Please enter your email address.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      const code = (err?.code || '').toLowerCase();
      if (code.includes('user-not-found')) {
        throw new Error('No account found with this email address.');
      }
      if (code.includes('invalid-email')) {
        throw new Error('Please enter a valid email address.');
      }
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  }, []);

  // Update profile details (Name & Email)
  const updateProfile = useCallback(async (details) => {
    const identifier = user?.email || user?.phone;
    if (!identifier) return;

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone || '',
          email: details.email || user.email || '',
          name: details.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...user,
          name: data.user?.name || details.name || user.name,
          email: data.user?.email || details.email || user.email,
          isAdmin: data.user?.is_admin ?? user.isAdmin,
        };
        localStorage.setItem('wrfitzz-user', JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new Event('wrfitzz_user_updated'));
      }
    } catch (e) {
      console.warn('Profile update failed:', e);
    }
  }, [user]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('wrfitzz-user');
    setUser(null);
    window.dispatchEvent(new Event('wrfitzz_user_updated'));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        updateProfile,
        syncUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
