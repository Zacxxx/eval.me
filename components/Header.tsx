
import React from 'react';
import { useAuth } from '../App';

export default function Header() {
  const { currentUser, logout, goToLanding } = useAuth();

  const handleLogoClick = () => {
    if (!currentUser) {
        goToLanding();
    }
    // If logged in, clicking the logo does nothing for now.
    // Could be updated to navigate to the user's main dashboard view.
  }

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <button onClick={handleLogoClick} className="focus:outline-none" aria-label="Go to homepage">
            <h1 className="text-3xl font-extrabold text-gray-800">
                eval<span className="text-cyan-600 font-bold">.</span>me
            </h1>
        </button>
        {currentUser && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
                Logged in as <span className="font-semibold">{currentUser.email}</span> ({currentUser.role.toLowerCase()})
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}