import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { config as configApi } from '@/lib/api';
import { toast } from 'sonner';

export type ColorTheme = 'blue' | 'purple' | 'green';
export type MenuStyle = 'compact' | 'comfortable' | 'spacious';

interface ConfigContextType {
  // Theme settings
  colorTheme: ColorTheme;
  darkMode: boolean;
  
  // Menu settings
  menuStyle: MenuStyle;
  sidebarSearchEnabled: boolean;
  sidebarPosition: 'left' | 'right';
  
  // Feature toggles
  commandPaletteEnabled: boolean;
  notificationsEnabled: boolean;
  activityLoggingEnabled: boolean;
  
  // Loading state
  loading: boolean;
  
  // Refresh configuration from server
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('green');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>('comfortable');
  const [sidebarSearchEnabled, setSidebarSearchEnabled] = useState<boolean>(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [commandPaletteEnabled, setCommandPaletteEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [activityLoggingEnabled, setActivityLoggingEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch configuration from server
  const fetchConfig = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching config from database...');
      const response = await configApi.getPublic();
      console.log('📥 Config response:', response);
      
      if (response.success && response.data?.config) {
        const { theme, menu, features } = response.data.config;
        console.log('🎨 Theme from database:', theme);
        
        // Apply theme settings
        if (theme) {
          if (theme.colorTheme) {
            console.log('🎨 Setting color theme to:', theme.colorTheme);
            setColorTheme(theme.colorTheme as ColorTheme);
          }
          if (typeof theme.darkMode === 'boolean') {
            console.log('🌙 Setting dark mode to:', theme.darkMode);
            setDarkMode(theme.darkMode);
          }
        }
        
        // Apply menu settings
        if (menu) {
          if (menu.menuStyle) setMenuStyle(menu.menuStyle as MenuStyle);
          if (typeof menu.sidebarSearchEnabled === 'boolean') setSidebarSearchEnabled(menu.sidebarSearchEnabled);
          if (menu.sidebarPosition) setSidebarPosition(menu.sidebarPosition);
        }
        
        // Apply feature settings
        if (features) {
          if (typeof features.commandPaletteEnabled === 'boolean') setCommandPaletteEnabled(features.commandPaletteEnabled);
          if (typeof features.notificationsEnabled === 'boolean') setNotificationsEnabled(features.notificationsEnabled);
          if (typeof features.activityLoggingEnabled === 'boolean') setActivityLoggingEnabled(features.activityLoggingEnabled);
        }
        
        // Apply theme to document immediately
        console.log('✨ Applying theme to document:', theme?.colorTheme || 'green', theme?.darkMode || false);
        applyTheme(theme?.colorTheme || 'green', theme?.darkMode || false);
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      toast.error('Failed to load application configuration');
      
      // Apply default theme on error
      applyTheme('green', false);
    } finally {
      setLoading(false);
    }
  };

  // Apply theme to document root
  const applyTheme = (theme: ColorTheme, dark: boolean) => {
    const root = document.documentElement;
    
    console.log('🎨 Applying theme to DOM:', { theme, dark });
    console.log('📋 Current data-theme attribute:', root.getAttribute('data-theme'));
    
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);
    console.log('✅ Set data-theme to:', theme);
    
    // Toggle dark class
    if (dark) {
      root.classList.add('dark');
      console.log('✅ Added dark class');
    } else {
      root.classList.remove('dark');
      console.log('✅ Removed dark class');
    }
    
    // Add smooth transitions
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Force a style recalculation
    void root.offsetHeight;
    
    console.log('📋 Final data-theme attribute:', root.getAttribute('data-theme'));
    console.log('📋 Final classList:', root.classList.value);
  };

  // Fetch configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Apply theme whenever colorTheme or darkMode changes
  useEffect(() => {
    console.log('🔔 Theme state changed:', { colorTheme, darkMode });
    applyTheme(colorTheme, darkMode);
  }, [colorTheme, darkMode]);

  // Refresh configuration (can be called manually)
  const refreshConfig = async () => {
    await fetchConfig();
  };

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      colorTheme,
      darkMode,
      menuStyle,
      sidebarSearchEnabled,
      sidebarPosition,
      commandPaletteEnabled,
      notificationsEnabled,
      activityLoggingEnabled,
      loading,
      refreshConfig,
    }),
    [
      colorTheme,
      darkMode,
      menuStyle,
      sidebarSearchEnabled,
      sidebarPosition,
      commandPaletteEnabled,
      notificationsEnabled,
      activityLoggingEnabled,
      loading,
    ]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};
