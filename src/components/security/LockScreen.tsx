/**
 * LockScreen - Écran de verrouillage de l'application
 *
 * Affiche un écran de verrouillage au démarrage de l'application.
 * L'utilisateur doit entrer le mot de passe admin pour déverrouiller l'application.
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSecurityStore } from '@/stores';
import { GraduationCap, KeyRound, Lock } from 'lucide-react';
import { useState } from 'react';

export function LockScreen() {
  const { unlockApp } = useSecurityStore();

  // État du formulaire
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Handler de déverrouillage
  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Veuillez entrer le mot de passe');
      return;
    }

    setIsUnlocking(true);
    setError('');

    const success = await unlockApp(password);

    if (!success) {
      setError('Mot de passe incorrect');
      setPassword('');
    }

    setIsUnlocking(false);
  };

  // Handler pour la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Exam Manager</CardTitle>
            </div>
            <CardDescription className="text-base">
              L'application est verrouillée
            </CardDescription>
            <p className="text-sm text-muted-foreground pt-2">
              Entrez le mot de passe administrateur pour accéder à l'application
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="unlock-password">Mot de passe administrateur</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="unlock-password"
                  type="password"
                  placeholder="Entrez le mot de passe..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  autoFocus
                  disabled={isUnlocking}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isUnlocking || !password.trim()}
            >
              {isUnlocking ? 'Vérification...' : 'Déverrouiller'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
