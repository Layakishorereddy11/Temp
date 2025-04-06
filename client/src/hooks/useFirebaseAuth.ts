import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, logoutUser, signInWithGoogle } from '@/lib/firebase';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createUserWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<void>;
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
      setLoading(true);
      await logoutUser();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      // No need to setUser as the auth state change listener will handle it
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const createUserWithEmail = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with their name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      
      // No need to setUser as the auth state change listener will handle it
    } catch (error: any) {
      console.error('Create user error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleProvider = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // No need to setUser as the auth state change listener will handle it
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    signInWithEmail,
    createUserWithEmail,
    signInWithGoogleProvider
  };
}