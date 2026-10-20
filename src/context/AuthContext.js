'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Sync / verify user session with Supabase and localStorage on mount
  const syncUserProfile = useCallback(async (phone, existingName, existingEmail) => {
    try {
      const res = await fetch(`/api/user?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          const profile = {
            phone: data.user.phone || phone,
            name: data.user.name || existingName || 'wrfitzz Member',
            email: data.user.email || existingEmail || '',
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
    } catch (e) {
      console.warn('Failed to sync profile from Supabase:', e);
    }

    // Default fallback profile
    const fallback = {
      phone,
      name: existingName || 'wrfitzz Member',
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
        if (parsed.phone) {
          // Check latest admin status in background
          syncUserProfile(parsed.phone, parsed.name, parsed.email);
        }
      }
    } catch (err) {
      console.warn('Auth local load error:', err);
    } finally {
      setLoading(false);
    }
  }, [syncUserProfile]);

  // Setup reCAPTCHA Verifier
  const setupRecaptcha = useCallback((containerId = 'recaptcha-container') => {
    if (typeof window === 'undefined' || !auth) return null;

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // ignore
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  }, []);

  // Send Phone OTP via Firebase
  const sendOtp = useCallback(async (rawPhone, containerId = 'recaptcha-container') => {
    if (!auth) throw new Error('Firebase Auth is not initialized');

    // Clean phone number: Indian numbers default +91
    let formattedPhone = rawPhone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      const cleanDigits = formattedPhone.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        formattedPhone = `+91${cleanDigits}`;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        formattedPhone = `+${cleanDigits}`;
      }
    }

    const appVerifier = setupRecaptcha(containerId);
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    setConfirmationResult(confirmation);
    return confirmation;
  }, [setupRecaptcha]);

  // Verify OTP
  const verifyOtp = useCallback(async (otpCode, pendingName = '', pendingEmail = '') => {
    if (!confirmationResult) {
      throw new Error('No pending OTP request found. Please request OTP first.');
    }

    const cred = await confirmationResult.confirm(otpCode);
    const firebaseUser = cred.user;
    const phone = firebaseUser.phoneNumber;

    // Register or sync user with Supabase
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: pendingName || null,
          email: pendingEmail || null,
        }),
      });
    } catch (err) {
      console.warn('Could not register user to Supabase:', err);
    }

    const profile = await syncUserProfile(phone, pendingName, pendingEmail);
    return profile;
  }, [confirmationResult, syncUserProfile]);

  // Update profile details (Name & Email)
  const updateProfile = useCallback(async (details) => {
    if (!user?.phone) return;
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          name: details.name,
          email: details.email,
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
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('wrfitzz-user');
    setUser(null);
    setConfirmationResult(null);
    window.dispatchEvent(new Event('wrfitzz_user_updated'));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOtp,
        verifyOtp,
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
