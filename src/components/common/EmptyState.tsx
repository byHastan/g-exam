/**
 * EmptyState - Composant d'état vide
 * 
 * Affiché quand une liste/table ne contient aucune donnée.
 * Fournit:
 * - Icône illustrative
 * - Message explicatif
 * - Action optionnelle pour créer le premier élément
 * 
 * UX: Guide l'utilisateur vers l'action à effectuer
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  // Titre principal
  title: string;
  
  // Description explicative
  description?: string;
  
  // Icône à afficher (défaut: FolderOpen)
  icon?: LucideIcon;
  
  // Texte du bouton d'action
  actionLabel?: string;
  
  // Callback lors du clic sur l'action
  onAction?: () => void;
  
  // Classes additionnelles
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Icône */}
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Titre */}
      <h3 className="text-lg font-semibold mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* Bouton d'action */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
