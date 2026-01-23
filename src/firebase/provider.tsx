'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useRouter, usePathname } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Define the shape of the user profile data stored in Firestore
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clubId: string;
  role: 'manager' | 'coach' | 'athlete';
  disabled?: boolean;
  salary?: number;
  team?: string;
  birthDate?: string;
  gender?: 'Masculino' | 'Femenino';
  bloodType?: string;
  documentType?: 'TI' | 'CC' | 'RC';
  documentNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalInformation?: string;
  coachId?: string;
  weight?: number;
  height?: number;
  vo2max?: number;
  jumpHeight?: number;
  speedTest30mTime?: number;
  ankleFlexibility?: number;
  enduranceTest8kmTime?: string;
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

  // Effect to subscribe to Firebase auth state changes and fetch user profiles
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    let profileUnsubscribe: (() => void) | null = null;
    let athleteUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous data listeners on auth state change
      profileUnsubscribe?.();
      athleteUnsubscribe?.();

      if (firebaseUser) {
        setUserAuthState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: true }));

        if (!firestore) {
          setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: new Error("Firestore service not available.") });
          return;
        }

        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        profileUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserProfile;

            // If the user is an athlete, we also need to fetch their specific data
            // from the athletes subcollection to get properties like 'team'.
            if (userData.role === 'athlete' && userData.clubId) {
              const athleteDocRef = doc(firestore, `clubs/${userData.clubId}/athletes`, firebaseUser.uid);
              athleteUnsubscribe = onSnapshot(athleteDocRef,
                (athleteDocSnap) => {
                  const athleteData = athleteDocSnap.exists() ? athleteDocSnap.data() : {};
                  const combinedProfile = { ...userData, ...athleteData };
                  setUserAuthState({ user: firebaseUser, profile: combinedProfile, isUserLoading: false, userError: null });
                },
                (error) => {
                  // If athlete doc fails, proceed with the main user profile
                  setUserAuthState({ user: firebaseUser, profile: userData, isUserLoading: false, userError: error });
                }
              );
            } else {
              // For non-athletes, the main user document is enough
              setUserAuthState({ user: firebaseUser, profile: userData, isUserLoading: false, userError: null });
            }
          } else {
            // User is authenticated, but no profile document found
            setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: null });
          }
        }, (error) => {
          // Error fetching the main user document
          const contextualError = new FirestorePermissionError({ operation: 'get', path: userDocRef.path });
          setUserAuthState({ user: firebaseUser, profile: null, isUserLoading: false, userError: contextualError });
          errorEmitter.emit('permission-error', contextualError);
        });
      } else {
        // User is signed out
        setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
      }
    }, (error) => {
      // Error with the auth listener itself
      setUserAuthState({ user: null, profile: null, isUserLoading: false, userError: error });
    });

    // Cleanup function for the useEffect hook
    return () => {
      authUnsubscribe();
      profileUnsubscribe?.();
      athleteUnsubscribe?.();
    };
  }, [auth, firestore]);

  // Effect to handle redirection on auth state change
  useEffect(() => {
    const isPublicPage = ['/login', '/register', '/'].includes(pathname);
    // If loading is finished and there is no user, redirect to login page if not on a public page
    if (!userAuthState.isUserLoading && !userAuthState.user && !isPublicPage) {
        router.replace('/login');
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