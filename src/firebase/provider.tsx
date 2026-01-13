
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useRouter, usePathname } from 'next/navigation';

// Define the shape of the user profile data stored in Firestore
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clubId: string;
  role: 'manager' | 'coach' | 'athlete';
  disabled?: boolean;
}

interface UserAuthState {
  user: User | null;
  profile: UserProfile | null; // Add profile to auth state
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult extends UserAuthState {
  firestore: Firestore | null;
}

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const authUnsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in, now fetch their profile from Firestore
          if (!firestore) return;
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const profileUnsubscribe = onSnapshot(userDocRef, 
            (docSnap) => {
              if (docSnap.exists()) {
                setUserAuthState({ user: firebaseUser, profile: docSnap.data() as UserProfile, isUserLoading: false, userError: null });
              } else {
                // Profile doesn't exist, might be an error state or sign-up in progress
                setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: null });
              }
            },
            (error) => {
              console.error("FirebaseProvider: Firestore onSnapshot error:", error);
              setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
            }
          );
          // Return the profile listener's unsubscribe function to be called on cleanup
          return () => profileUnsubscribe();
        } else {
          // User is signed out
          setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
          const isPublicPage = ['/login', '/register', '/'].includes(pathname);
          if (!isPublicPage) {
            router.push('/login');
          }
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: error });
      }
    );
    
    return () => authUnsubscribe();
  }, [auth, firestore, pathname, router]);

  // Effect to handle redirection on auth state change
  useEffect(() => {
    const isPublicPage = ['/login', '/register', '/'].includes(pathname);
    // If loading is finished and there is no user, redirect to login page if not on a public page
    if (!userAuthState.isUserLoading && !userAuthState.user && !isPublicPage) {
        router.push('/login');
    }
  }, [userAuthState.isUserLoading, userAuthState.user, pathname, router]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      profile: userAuthState.profile,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    profile: context.profile,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a FirebaseProvider.');
    }
  const { user, profile, isUserLoading, userError, firestore } = context;
  return { user, profile, isUserLoading, userError, firestore };
};
