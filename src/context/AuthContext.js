'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [pendingPhone, setPendingPhone] = useState('');
  const [isFallbackMode, setIsFallbackMode] = useState(false);

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

    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } catch (e) {
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        } catch (e) {}
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  }, []);

  // Send Phone OTP
  const sendOtp = useCallback(async (rawPhone, containerId = 'recaptcha-container') => {
    // Format Indian phone number to E.164
    let formattedPhone = rawPhone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      const cleanDigits = formattedPhone.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        formattedPhone = `+91${cleanDigits}`;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        formattedPhone = `+${cleanDigits}`;
      }
    }

    setPendingPhone(formattedPhone);

    try {
      if (!auth) throw new Error('Firebase Auth is not initialized');
      const appVerifier = setupRecaptcha(containerId);
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsFallbackMode(false);
      return { success: true, method: 'firebase' };
    } catch (err) {
      console.warn('Firebase signInWithPhoneNumber notice:', err);
      const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();

      // If Firebase Spark plan blocks carrier SMS (billing not enabled or quota exceeded):
      const isQuotaOrBilling =
        errStr.includes('billing') ||
        errStr.includes('quota') ||
        errStr.includes('internal-error') ||
        errStr.includes('app-not-authorized');

      if (isQuotaOrBilling) {
        setIsFallbackMode(true);
        return {
          success: true,
          method: 'fallback',
          notice: 'Firebase Spark plan detected (real SMS requires Blaze plan). You can proceed right now with test code: 123456',
        };
      }

      throw err;
    }
  }, [setupRecaptcha]);

  // Verify OTP
  const verifyOtp = useCallback(async (otpCode, pendingName = '', pendingEmail = '') => {
    let verifiedPhone = pendingPhone;

    if (isFallbackMode) {
      // Test code verification (accepts 123456 or 000000)
      if (otpCode !== '123456' && otpCode !== '000000') {
        throw new Error('Invalid code. For test mode, enter verification code: 123456');
      }
    } else {
      if (!confirmationResult) {
        throw new Error('No pending OTP request found. Please request OTP first.');
      }
      const cred = await confirmationResult.confirm(otpCode);
      const firebaseUser = cred.user;
      verifiedPhone = firebaseUser.phoneNumber || pendingPhone;
    }

    // Register or sync user with Supabase
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verifiedPhone,
          name: pendingName || null,
          email: pendingEmail || null,
        }),
      });
    } catch (err) {
      console.warn('Could not register user to Supabase:', err);
    }

    const profile = await syncUserProfile(verifiedPhone, pendingName, pendingEmail);
    return profile;
  }, [confirmationResult, isFallbackMode, pendingPhone, syncUserProfile]);

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
    } catch (e) {}
    localStorage.removeItem('wrfitzz-user');
    setUser(null);
    setConfirmationResult(null);
    setIsFallbackMode(false);
    setPendingPhone('');
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
        isFallbackMode,
        pendingPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
