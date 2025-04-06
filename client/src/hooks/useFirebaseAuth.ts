import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithEmail, 
  signupWithEmail, 
  signInWithGoogle, 
  logoutUser,
  createUserDocument
} from '@/lib/firebase';
import { User } from '@/types';

export default function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Sign up with email, password, and name
  const createUserWithEmail = async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { user } = await signupWithEmail(name, email, password);
      await createUserDocument(user);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogleProvider = async () => {
    setError(null);
    setLoading(true);
    try {
      const { user } = await signInWithGoogle();
      // Check if this is a new user
      const isNewUser = (user as FirebaseUser & { _isNewUser?: boolean; })._isNewUser;
      if (isNewUser) {
        await createUserDocument(user);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      await logoutUser();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    createUserWithEmail,
    signInWithGoogleProvider,
    signOut
  };
}
