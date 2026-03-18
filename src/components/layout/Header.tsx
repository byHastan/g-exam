/**
 * Header - En-tête de l'application
 * 
 * Affiche:
 * - Titre de la page courante
 * - Informations sur l'examen actif (nom + année)
 * - Statut de l'examen (Brouillon / Verrouillé)
 * - Bouton de verrouillage de l'application
 */

import { useNavigationStore } from '@/stores/navigationStore';
import { useExamStore } from '@/stores/examStore';
import { useSecurityStore } from '@/stores';
import { PAGE_TITLES } from '@/types/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lock, Moon, Sun, Unlock } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

export function Header() {
  const { currentPage } = useNavigationStore();
  const { examName, examYear, status } = useExamStore();
  const { lockApp } = useSecurityStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const pageTitle = PAGE_TITLES[currentPage];
  const hasExam = examName && examYear;

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shrink-0">
      {/* Titre de la page */}
      <h1 className="text-xl font-semibold text-foreground">
        {pageTitle}
      </h1>

      {/* Informations sur l'examen actif + Bouton verrouillage */}
      <div className="flex items-center gap-4">
        {hasExam ? (
          <>
            {/* Nom et année de l'examen */}
            <div className="text-right">
              <p className="text-sm font-medium">{examName}</p>
              <p className="text-xs text-muted-foreground">Année {examYear}</p>
            </div>

            {/* Badge de statut */}
            <Badge
              variant={status === 'locked' ? 'default' : 'secondary'}
              className="flex items-center gap-1.5"
            >
              {status === 'locked' ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Verrouillé</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3 w-3" />
                  <span>Brouillon</span>
                </>
              )}
            </Badge>
          </>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Aucun examen configuré
          </Badge>
        )}

        {/* Bouton dark mode */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">{isDark ? 'Mode clair' : 'Mode sombre'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDark ? 'Mode clair' : 'Mode sombre'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Bouton de verrouillage */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={lockApp}
                className="h-9 w-9"
              >
                <Lock className="h-4 w-4" />
                <span className="sr-only">Verrouiller l'application</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verrouiller l'application</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
