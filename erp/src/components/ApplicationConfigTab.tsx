import React, { useState, useEffect } from 'react';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useConfig } from '@/hooks/useConfig';
import { useRBAC } from '@/hooks/useRBAC';
import { config as configApi } from '@/lib/api';
import { toast } from 'sonner';

interface ConfigItem {
  _id: string;
  category: string;
  key: string;
  value: any;
  label: string;
  description?: string;
  dataType: string;
}

export const ApplicationConfigTab: React.FC = () => {
  const { hasPermission } = useRBAC();
  const { colorTheme, darkMode, menuStyle, sidebarSearchEnabled, commandPaletteEnabled, refreshConfig } = useConfig();
  
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state for form
  const [localColorTheme, setLocalColorTheme] = useState<string>(colorTheme);
  const [localDarkMode, setLocalDarkMode] = useState<boolean>(darkMode);
  const [localMenuStyle, setLocalMenuStyle] = useState<string>(menuStyle);
  const [localSidebarSearch, setLocalSidebarSearch] = useState<boolean>(sidebarSearchEnabled);
  const [localCommandPalette, setLocalCommandPalette] = useState<boolean>(commandPaletteEnabled);

  const canWrite = hasPermission('config.write') || hasPermission('settings.write');

  useEffect(() => {
    fetchConfigs();
    // Initialize local state from config context only once on mount
    setLocalColorTheme(colorTheme);
    setLocalDarkMode(darkMode);
    setLocalMenuStyle(menuStyle);
    setLocalSidebarSearch(sidebarSearchEnabled);
    setLocalCommandPalette(commandPaletteEnabled);
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await configApi.getAll();
      if (response.success && response.data?.configs) {
        setConfigs(response.data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  // Preview theme change immediately
  const handleThemeChange = (theme: string) => {
    console.log('🎨 Theme changed to:', theme);
    setLocalColorTheme(theme);
    // Apply theme preview immediately
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    toast.info(`Preview: ${theme} theme (click Save to apply permanently)`);
  };

  // Preview dark mode change immediately
  const handleDarkModeChange = (enabled: boolean) => {
    console.log('🌙 Dark mode changed to:', enabled);
    setLocalDarkMode(enabled);
    // Apply dark mode preview immediately
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    toast.info(`Preview: Dark mode ${enabled ? 'enabled' : 'disabled'} (click Save to apply permanently)`);
  };

  const handleSave = async () => {
    if (!canWrite) {
      toast.error('You do not have permission to update configuration');
      return;
    }

    try {
      setSaving(true);

      const updates = [];

      // Theme configs
      const colorThemeConfig = configs.find(c => c.category === 'theme' && c.key === 'colorTheme');
      console.log('🎨 Color theme check:', {
        configValue: colorThemeConfig?.value,
        localValue: localColorTheme,
        isDifferent: colorThemeConfig?.value !== localColorTheme
      });
      if (colorThemeConfig && colorThemeConfig.value !== localColorTheme) {
        updates.push({ id: colorThemeConfig._id, value: localColorTheme });
      }

      const darkModeConfig = configs.find(c => c.category === 'theme' && c.key === 'darkMode');
      console.log('🌙 Dark mode check:', {
        configValue: darkModeConfig?.value,
        localValue: localDarkMode,
        isDifferent: darkModeConfig?.value !== localDarkMode
      });
      if (darkModeConfig && darkModeConfig.value !== localDarkMode) {
        updates.push({ id: darkModeConfig._id, value: localDarkMode });
      }

      // Menu configs
      const menuStyleConfig = configs.find(c => c.category === 'menu' && c.key === 'menuStyle');
      if (menuStyleConfig && menuStyleConfig.value !== localMenuStyle) {
        updates.push({ id: menuStyleConfig._id, value: localMenuStyle });
      }

      const sidebarSearchConfig = configs.find(c => c.category === 'menu' && c.key === 'sidebarSearchEnabled');
      if (sidebarSearchConfig && sidebarSearchConfig.value !== localSidebarSearch) {
        updates.push({ id: sidebarSearchConfig._id, value: localSidebarSearch });
      }

      // Feature configs
      const commandPaletteConfig = configs.find(c => c.category === 'features' && c.key === 'commandPaletteEnabled');
      if (commandPaletteConfig && commandPaletteConfig.value !== localCommandPalette) {
        updates.push({ id: commandPaletteConfig._id, value: localCommandPalette });
      }

      console.log('📝 Updates to save:', updates);

      if (updates.length === 0) {
        toast.info('No changes to save');
        return;
      }

      console.log('💾 Saving updates to database...');
      const response = await configApi.bulkUpdate(updates);
      console.log('📥 Save response:', response);

      if (response.success) {
        toast.success(`Updated ${response.data.successCount} configuration(s)`);
        console.log('🔄 Refreshing config from database...');
        await refreshConfig();
        await fetchConfigs();
        
        // Update local state to match saved values
        setLocalColorTheme(localColorTheme);
        setLocalDarkMode(localDarkMode);
        setLocalMenuStyle(localMenuStyle);
        setLocalSidebarSearch(localSidebarSearch);
        setLocalCommandPalette(localCommandPalette);
      } else {
        toast.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to save configs:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await fetchConfigs();
    await refreshConfig();
    toast.success('Configuration refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Global application configuration - changes affect all users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canWrite && (
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {!canWrite && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You have read-only access. Contact an administrator to make changes.
          </p>
        </div>
      )}

      {/* Theme Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the application appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Theme */}
          <div className="space-y-4">
            <Label>Color Theme</Label>
            <RadioGroup value={localColorTheme} onValueChange={handleThemeChange} disabled={!canWrite}>
              <div className="grid gap-4 md:grid-cols-3">
                {['blue', 'purple', 'green'].map((theme) => (
                  <div key={theme} className="relative">
                    <RadioGroupItem value={theme} id={theme} className="peer sr-only" />
                    <Label
                      htmlFor={theme}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <div className={`w-full h-20 rounded mb-3 ${
                        theme === 'blue' ? 'bg-gradient-to-br from-blue-600 to-blue-400' :
                        theme === 'purple' ? 'bg-gradient-to-br from-purple-600 to-purple-400' :
                        'bg-gradient-primary'
                      }`} />
                      <span className="font-medium capitalize">{theme} Theme</span>
                      {localColorTheme === theme && (
                        <span className="text-xs text-primary mt-1">(Active)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Enable dark color scheme</p>
            </div>
            <Switch
              checked={localDarkMode}
              onCheckedChange={handleDarkModeChange}
              disabled={!canWrite}
            />
          </div>
        </CardContent>
      </Card>

      {/* Menu Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Settings</CardTitle>
          <CardDescription>Configure navigation menu behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Menu Style */}
          <div className="space-y-2">
            <Label htmlFor="menu-style">Menu Style</Label>
            <Select value={localMenuStyle} onValueChange={setLocalMenuStyle} disabled={!canWrite}>
              <SelectTrigger id="menu-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact (8px padding)</SelectItem>
                <SelectItem value="comfortable">Comfortable (12px padding)</SelectItem>
                <SelectItem value="spacious">Spacious (16px padding)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjust spacing between menu items
            </p>
          </div>

          {/* Sidebar Search */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label>Sidebar Search</Label>
              <p className="text-sm text-muted-foreground">Show search box in navigation sidebar</p>
            </div>
            <Switch
              checked={localSidebarSearch}
              onCheckedChange={setLocalSidebarSearch}
              disabled={!canWrite}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>Enable or disable application features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Command Palette */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Command Palette</Label>
              <p className="text-sm text-muted-foreground">Enable quick command menu (Ctrl+K / Cmd+K)</p>
            </div>
            <Switch
              checked={localCommandPalette}
              onCheckedChange={setLocalCommandPalette}
              disabled={!canWrite}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
