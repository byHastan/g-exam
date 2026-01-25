/**
 * PageContainer - Template de page réutilisable
 * 
 * Structure standard pour toutes les pages:
 * - Titre (optionnel, car déjà dans le Header)
 * - Zone d'actions en haut à droite
 * - Description (optionnel)
 * - Zone de contenu principale
 * 
 * UX: Action principale toujours visible en haut à droite (2ème clic)
 */

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  
  // Action principale (bouton) affichée en haut à droite
  action?: React.ReactNode;
  
  // Description sous le titre
  description?: string;
  
  // Classes CSS additionnelles
  className?: string;
}

export function PageContainer({
  children,
  action,
  description,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Barre d'actions / description */}
      {(action || description) && (
        <div className="flex items-start justify-between mb-6">
          {/* Description */}
          {description && (
            <p className="text-muted-foreground text-sm max-w-2xl">
              {description}
            </p>
          )}
          
          {/* Spacer si pas de description mais action présente */}
          {!description && action && <div />}
          
          {/* Action principale */}
          {action && (
            <div className="shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
