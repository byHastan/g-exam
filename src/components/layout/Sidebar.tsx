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
  GraduationCap,
  Shield,
} from 'lucide-react';

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

interface SidebarItemProps {
  id: PageId;
  label: string;
  icon: string;
  description?: string;
  isActive: boolean;
  onClick: () => void;
}

function SidebarItem({ 
  label, 
  icon, 
  description, 
  isActive, 
  onClick 
}: SidebarItemProps) {
  const Icon = ICONS[icon];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              // Base styles - zones de clic larges pour accessibilité
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
              'text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              // État actif
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            <span className="truncate">{label}</span>
          </button>
        </TooltipTrigger>
        {description && (
          <TooltipContent side="right" className="max-w-[200px]">
            <p>{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { currentPage, navigateTo } = useNavigationStore();

  return (
    <aside className="w-60 border-r bg-card flex flex-col h-screen shrink-0">
      {/* En-tête avec logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b shrink-0">
        <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Exam Manager</span>
          <span className="text-xs text-muted-foreground">Gestion d'examens</span>
        </div>
      </div>

      {/* Menu de navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              isActive={currentPage === item.id}
              onClick={() => navigateTo(item.id)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Pied de sidebar */}
      <div className="p-4 border-t shrink-0">
        {/* Lien admin discret */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigateTo('admin')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md mb-3',
                  'text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  currentPage === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="truncate">Administration</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Gestion avancée de la base de données</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator className="mb-3" />
        <p className="text-xs text-muted-foreground text-center">
          Version 1.0.0
        </p>
      </div>
    </aside>
  );
}
