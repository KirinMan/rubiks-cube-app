import React, { createContext, useContext } from 'react';
import { theme } from '../../shared/config/theme';

const ThemeContext = createContext(theme);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
