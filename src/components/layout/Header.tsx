/**
 * Header - En-tête de l'application
 * 
 * Affiche:
 * - Titre de la page courante
 * - Informations sur l'examen actif (nom + année)
 * - Statut de l'examen (Brouillon / Verrouillé)
 * - Bouton de verrouillage de l'application
 */

import { useMemo } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useExamStore } from '@/stores/examStore';
import { useSecurityStore, useStudentsStore, useSubjectsStore, useScoresStore } from '@/stores';
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
  const { students } = useStudentsStore();
  const { subjects } = useSubjectsStore();
  const { scores } = useScoresStore();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const pageTitle = PAGE_TITLES[currentPage];
  const hasExam = examName && examYear;

  // Progress: scores entered vs total expected (non-absent students × subjects)
  const progress = useMemo(() => {
    const presentStudents = students.filter((s) => !s.isAbsent);
    const totalExpected = presentStudents.length * subjects.length;
    // Count actual scores (non-absent entries)
    const totalEntered = scores.filter((s) => !s.isAbsent).length;
    const percent = totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0;
    return { totalEntered, totalExpected, percent };
  }, [students, subjects, scores]);

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shrink-0">
      {/* Titre de la page */}
      <h1 className="text-xl font-semibold text-foreground">
        {pageTitle}
      </h1>

      {/* Informations sur l'examen actif + Bouton verrouillage */}
      <div className="flex items-center gap-4">
        {/* Barre de progression globale de saisie */}
        {hasExam && progress.totalExpected > 0 && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default">
                  <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress.percent === 100
                          ? 'bg-green-500'
                          : progress.percent >= 50
                            ? 'bg-primary'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {progress.percent}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Saisie des notes : {progress.totalEntered}/{progress.totalExpected} notes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
