
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, UserRole, Job, Submission } from './types';
import AuthPage from './components/AuthPage';
import EmployerPage from './components/EmployerPage';
import CandidatePage from './components/CandidatePage';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

// --- Local Storage Hooks ---
function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- Auth Context ---
interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  goToLanding: () => void;
}
export const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};


// --- Data Context ---
interface DataContextType {
    users: User[];
    jobs: Job[];
    submissions: Submission[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}
export const DataContext = createContext<DataContextType | null>(null);
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}

// --- App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [hasEnteredApp, setHasEnteredApp] = useState(!!currentUser);
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [jobs, setJobs] = useLocalStorage<Job[]>('jobs', []);
  const [submissions, setSubmissions] = useLocalStorage<Submission[]>('submissions', []);

  useEffect(() => {
    if (currentUser) {
      setHasEnteredApp(true);
    }
  }, [currentUser]);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
  }, [setCurrentUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setHasEnteredApp(false);
  }, [setCurrentUser]);
  
  const goToLanding = useCallback(() => {
    setHasEnteredApp(false);
  }, []);

  const renderContent = () => {
    if (!hasEnteredApp) {
      return <LandingPage onGetStarted={() => setHasEnteredApp(true)} />;
    }

    if (!currentUser) {
      return <AuthPage />;
    }

    switch (currentUser.role) {
      case UserRole.EMPLOYER:
        return <EmployerPage />;
      case UserRole.CANDIDATE:
        return <CandidatePage />;
      default:
        return <AuthPage />;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, goToLanding }}>
    <DataContext.Provider value={{ users, setUsers, jobs, setJobs, submissions, setSubmissions }}>
      <div className="min-h-screen">
        {hasEnteredApp && <Header />}
        <main className={hasEnteredApp ? 'container mx-auto p-4 md:p-8' : ''}>
            {renderContent()}
        </main>
      </div>
    </DataContext.Provider>
    </AuthContext.Provider>
  );
}