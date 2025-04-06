import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser } from '@/lib/firebase';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

export default function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        if (authUser) {
          // User is signed in
          setUser(authUser);
        } else {
          // User is signed out
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state changed error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    }
  };

  return {
    user,
    loading,
    error,
    signOut
  };
}