'use client';

import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Input } from '@/components/ui/Input';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      {title && (
        <h1 className="hidden text-xl font-semibold md:block">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <Input
          placeholder="Search tasks, subjects..."
          leftIcon={<Search className="h-4 w-4" />}
          className="h-9 bg-muted/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
