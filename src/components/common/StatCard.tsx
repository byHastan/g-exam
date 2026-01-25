/**
 * StatCard - Carte d'indicateur statistique
 * 
 * Affiche une métrique avec:
 * - Icône
 * - Titre
 * - Valeur principale
 * - Sous-texte optionnel (tendance, comparaison, etc.)
 * 
 * Utilisé principalement sur le Dashboard
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  // Titre de la statistique
  title: string;
  
  // Valeur à afficher (nombre ou texte)
  value: string | number;
  
  // Icône Lucide
  icon: LucideIcon;
  
  // Texte secondaire (ex: "+5% vs mois dernier")
  subtitle?: string;
  
  // Variante de couleur pour l'icône
  variant?: 'default' | 'success' | 'warning' | 'danger';
  
  // Classes additionnelles
  className?: string;
}

// Styles de couleur par variante
const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-yellow-500/10 text-yellow-600',
  danger: 'bg-red-500/10 text-red-600',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Contenu textuel */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {/* Icône */}
          <div
            className={cn(
              'h-10 w-10 rounded-md flex items-center justify-center shrink-0',
              variantStyles[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
