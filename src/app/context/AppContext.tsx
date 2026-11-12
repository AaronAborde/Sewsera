// src/app/context/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'customer' | 'tailor' | 'seller' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: UserRole;
  avatarUrl?: string;
  notifications?: boolean;
  emailAlerts?: boolean;
  createdAt?: Date;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User & { status?: string };
          // Pending / rejected vendors must not enter the app until an admin approves them.
          const awaitingApproval =
            (userData.role === 'tailor' || userData.role === 'seller') && (userData.status || 'pending') !== 'approved';
          if (awaitingApproval) {
            await signOut(auth);
            return;
          }
          setCurrentUser(userData);
          setUserRole(userData.role);
          setIsAuthenticated(true);
        } else {
          const fallbackUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'customer',
            avatarUrl: '',
            notifications: true,
            emailAlerts: true,
          };
          setCurrentUser(fallbackUser);
          setUserRole('customer');
          setIsAuthenticated(true);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      isAuthenticated,
      setIsAuthenticated,
      userRole,
      setUserRole,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
};