/**
 * Sidebar - Navigation latérale fixe
 * 
 * Affiche le menu principal de l'application avec:
 * - Logo/titre de l'application
 * - Liste des pages accessibles
 * - Indication visuelle de la page active
 * 
 * UX: Navigation en 1 clic vers toutes les sections
 */

import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigationStore';
import { MENU_ITEMS, type PageId } from '@/types/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Settings,
  Building2,
  Users,
  FileText,
  PenLine,
  Trophy,
  BarChart3,
  DoorOpen,
  Download,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState, useCallback } from 'react';

// Map des icônes Lucide par nom
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Settings,
  Building2,
  Users,
  FileText,
  PenLine,
  Trophy,
  BarChart3,
  DoorOpen,
  Download,
};

const SIDEBAR_STORAGE_KEY = 'g-exam-sidebar-collapsed';

interface SidebarItemProps {
  id: PageId;
  label: string;
  icon: string;
  description?: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function SidebarItem({ 
  label, 
  icon, 
  description, 
  isActive,
  isCollapsed,
  onClick 
}: SidebarItemProps) {
  const Icon = ICONS[icon];

  return (
    <TooltipProvider delayDuration={isCollapsed ? 0 : 300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'w-full flex items-center rounded-md',
              'text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            {!isCollapsed && <span className="truncate">{label}</span>}
          </button>
        </TooltipTrigger>
        {(isCollapsed || description) && (
          <TooltipContent side="right" className="max-w-[200px]">
            <p className="font-medium">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { currentPage, navigateTo } = useNavigationStore();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        'border-r bg-card flex flex-col h-screen shrink-0 transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* En-tête avec logo */}
      <div className={cn(
        'h-16 flex items-center border-b shrink-0',
        isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        <img 
          src="/logo.png" 
          alt="G-Exam" 
          className="h-9 w-9 rounded-md object-contain shrink-0"
        />
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">G-Exam</span>
            <span className="text-xs text-muted-foreground">Gestion d'examens</span>
          </div>
        )}
      </div>

      {/* Menu de navigation */}
      <ScrollArea className={cn('flex-1 py-4', isCollapsed ? 'px-2' : 'px-3')}>
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              isActive={currentPage === item.id}
              isCollapsed={isCollapsed}
              onClick={() => navigateTo(item.id)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Pied de sidebar */}
      <div className={cn('border-t shrink-0', isCollapsed ? 'p-2' : 'p-4')}>
        {/* Lien admin discret */}
        <TooltipProvider delayDuration={isCollapsed ? 0 : 300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigateTo('admin')}
                className={cn(
                  'w-full flex items-center rounded-md mb-2',
                  'text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                  currentPage === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">Administration</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Administration</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <Separator className="mb-2" />

        {/* Bouton toggle collapse */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapsed}
                className={cn(
                  'w-full flex items-center rounded-md',
                  'text-sm font-medium transition-colors',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                )}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                    <span className="truncate">Réduire</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isCollapsed ? 'Déplier le menu' : 'Replier le menu'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Version 1.0.0
          </p>
        )}
      </div>
    </aside>
  );
}
