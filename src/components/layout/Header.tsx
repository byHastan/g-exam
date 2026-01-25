/**
 * Header - En-tête de l'application
 * 
 * Affiche:
 * - Titre de la page courante
 * - Informations sur l'examen actif (nom + année)
 * - Statut de l'examen (Brouillon / Verrouillé)
 */

import { useNavigationStore } from '@/stores/navigationStore';
import { useExamStore } from '@/stores/examStore';
import { PAGE_TITLES } from '@/types/navigation';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock } from 'lucide-react';

export function Header() {
  const { currentPage } = useNavigationStore();
  const { examName, examYear, status } = useExamStore();

  const pageTitle = PAGE_TITLES[currentPage];
  const hasExam = examName && examYear;

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between shrink-0">
      {/* Titre de la page */}
      <h1 className="text-xl font-semibold text-foreground">
        {pageTitle}
      </h1>

      {/* Informations sur l'examen actif */}
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
      </div>
    </header>
  );
}
