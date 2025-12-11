import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState({ name: 'Demo User' }); // mock auth
  return <AppContext.Provider value={{ user, setUser }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
