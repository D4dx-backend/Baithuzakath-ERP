import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/useConfig';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Users,
  FolderKanban,
  FileText,
  FileCheck,
  Heart,
  HandCoins,
  Settings,
  BarChart3,
  Sun,
  Moon,
  Laptop,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
  keywords?: string[];
}

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { commandPaletteEnabled, darkMode, colorTheme, refreshConfig } = useConfig();

  // Toggle command palette with Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Navigation commands
  const navigationCommands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => navigate('/dashboard'),
      group: 'Navigation',
      keywords: ['home', 'overview'],
    },
    {
      id: 'nav-projects',
      label: 'Projects',
      icon: FolderKanban,
      action: () => navigate('/projects'),
      group: 'Navigation',
    },
    {
      id: 'nav-schemes',
      label: 'Schemes',
      icon: FileText,
      action: () => navigate('/schemes'),
      group: 'Navigation',
    },
    {
      id: 'nav-applications',
      label: 'Applications',
      icon: FileCheck,
      action: () => navigate('/applications/all'),
      group: 'Navigation',
    },
    {
      id: 'nav-beneficiaries',
      label: 'Beneficiaries',
      icon: Users,
      action: () => navigate('/beneficiaries'),
      group: 'Navigation',
    },
    {
      id: 'nav-donors',
      label: 'Donors',
      icon: Heart,
      action: () => navigate('/donors'),
      group: 'Navigation',
    },
    {
      id: 'nav-donations',
      label: 'Donations',
      icon: HandCoins,
      action: () => navigate('/donations'),
      group: 'Navigation',
    },
    {
      id: 'nav-reports',
      label: 'Reports',
      icon: BarChart3,
      action: () => navigate('/reports'),
      group: 'Navigation',
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      icon: Settings,
      action: () => navigate('/settings'),
      group: 'Navigation',
      keywords: ['preferences', 'configuration'],
    },
  ];

  // Quick action commands
  const actionCommands: CommandItem[] = [
    {
      id: 'action-search',
      label: 'Search...',
      icon: Search,
      action: () => {
        toast.info('Search feature coming soon');
      },
      group: 'Actions',
    },
    {
      id: 'action-refresh-config',
      label: 'Refresh Configuration',
      icon: Settings,
      action: async () => {
        await refreshConfig();
        toast.success('Configuration refreshed');
      },
      group: 'Actions',
    },
  ];

  // Theme commands
  const themeCommands: CommandItem[] = [
    {
      id: 'theme-light',
      label: darkMode ? 'Switch to Light Mode' : 'Light Mode (Active)',
      icon: Sun,
      action: async () => {
        toast.info('Theme changes require admin permission');
      },
      group: 'Theme',
    },
    {
      id: 'theme-dark',
      label: darkMode ? 'Dark Mode (Active)' : 'Switch to Dark Mode',
      icon: Moon,
      action: async () => {
        toast.info('Theme changes require admin permission');
      },
      group: 'Theme',
    },
    {
      id: 'theme-system',
      label: 'System Theme',
      icon: Laptop,
      action: async () => {
        toast.info('Theme changes require admin permission');
      },
      group: 'Theme',
    },
  ];

  const allCommands = [...navigationCommands, ...actionCommands, ...themeCommands];

  // Group commands by category
  const groupedCommands = allCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleSelect = useCallback((commandId: string) => {
    const command = allCommands.find((cmd) => cmd.id === commandId);
    if (command) {
      setOpen(false);
      command.action();
    }
  }, [allCommands]);

  // Don't render if disabled
  if (!commandPaletteEnabled) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([group, commands], index) => (
          <React.Fragment key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {commands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => handleSelect(cmd.id)}
                    keywords={cmd.keywords}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default memo(CommandPalette);
