import { createContext } from 'react';

// shared context object for user auth info
export const UserContext = createContext({ user: null, setUser: () => {} });
