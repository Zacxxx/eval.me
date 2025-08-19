import React, { useState } from 'react';
import { useAuth, useData } from '../App';
import { User, UserRole } from '../types';

type AuthMode = 'login' | 'signup-employer' | 'signup-candidate';

interface AuthButtonProps {
  activeMode: AuthMode;
  targetMode: AuthMode;
  onClick: (mode: AuthMode) => void;
  children: React.ReactNode;
}

// Moved AuthButton outside of AuthPage to prevent re-creation on every render.
const AuthButton = ({ activeMode, targetMode, onClick, children }: AuthButtonProps) => (
  <button
    type="button"
    onClick={() => onClick(targetMode)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeMode === targetMode ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
  >
    {children}
  </button>
);

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { users, setUsers } = useData();

  const handleAnonymousLogin = (role: UserRole) => {
    const anonymousUser: User = {
      id: `anonymous-${role.toLowerCase()}-${Date.now()}`,
      email: `anonymous-${role.toLowerCase()}`,
      role: role,
    };
    login(anonymousUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        login(user);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      if (users.some(u => u.email === email)) {
        setError('An account with this email already exists.');
        return;
      }
      const newUser: User = {
        id: new Date().toISOString(),
        email,
        password,
        role: mode === 'signup-employer' ? UserRole.EMPLOYER : UserRole.CANDIDATE,
      };
      setUsers(prev => [...prev, newUser]);
      login(newUser);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Login to your Account';
      case 'signup-employer': return 'Create Employer Account';
      case 'signup-candidate': return 'Create Candidate Account';
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{getTitle()}</h2>
        <p className="text-center text-gray-500 mb-6">Welcome to eval.me</p>

        <div className="grid grid-cols-3 gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
            <AuthButton activeMode={mode} targetMode='login' onClick={handleModeChange}>Login</AuthButton>
            <AuthButton activeMode={mode} targetMode='signup-employer' onClick={handleModeChange}>Employer</AuthButton>
            <AuthButton activeMode={mode} targetMode='signup-candidate' onClick={handleModeChange}>Candidate</AuthButton>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
          >
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="space-y-3">
            <button
                type="button"
                onClick={() => handleAnonymousLogin(UserRole.EMPLOYER)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
                Visit as Employer (Anonymous)
            </button>
            <button
                type="button"
                onClick={() => handleAnonymousLogin(UserRole.CANDIDATE)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
                Visit as Candidate (Anonymous)
            </button>
        </div>
      </div>
    </div>
  );
}