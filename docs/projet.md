# Exam Manager — Desktop Application

## 🎯 Objectif du projet

Créer une application desktop **100 % locale (offline)** de gestion d’examens scolaires permettant :

- l’import des élèves via fichier Excel
- la saisie manuelle des élèves
- la définition des épreuves (avec ou sans coefficient)
- la saisie des notes
- le calcul automatique des moyennes
- le classement des élèves
- le classement des établissements (basé sur le taux de réussite)
- la génération de statistiques
- la répartition automatique des élèves en salles

Application destinée aux écoles, lycées, centres d’examens et inspections pédagogiques.

---

## 🧱 Stack technique

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand
- Recharts

### Desktop
- Tauri (dernière version stable)

### Base de données locale
- SQLite
- Prisma ORM

### Autres
- xlsx (import Excel)
- jsPDF + AutoTable (export PDF)
- impression locale

---

## 🗂️ Architecture attendue

src/
│
├── app/ # pages
├── components/ # composants UI
├── stores/ # Zustand
├── core/ # logique métier
│ ├── calculations/ # moyennes, coefficients
│ ├── rankings/ # classements
│ ├── statistics/ # statistiques
│ └── room-dispatch/ # répartition salles
│
├── services/
│ ├── db/ # prisma client
│ ├── excel/ # import/export
│ ├── pdf/ # génération PDF
│
├── types/
└── utils/


---

## 🧠 Logique métier

### Moyennes
- Moyenne pondérée si coefficient défini
- Moyenne simple sinon

### Classement élèves
- tri par moyenne décroissante
- gestion des ex æquo

### Classement établissements
- basé sur :
  - pourcentage de réussite
  - moyenne générale
  - nombre d’admis

### Réussite
- élève admis si moyenne ≥ seuil défini (ex: 10/20)

---

## 🧮 Statistiques à produire

- nombre total de candidats
- nombre d’admis / ajournés
- taux de réussite global
- moyenne générale
- meilleure note / plus faible note
- moyenne par épreuve
- taux de réussite par établissement
- distribution des notes

---

## 🏫 Répartition des élèves en salles

Paramètres :
- nombre de salles
- capacité par salle
- critère :
  - alphabétique (par défaut)
  - par établissement
  - mixte

Résultat :
- liste des élèves par salle
- export PDF possible

---

## 🔐 Sécurité locale

- compte administrateur local
- verrouillage des notes après validation
- possibilité de réinitialisation par mot de passe

---

## 🎯 Priorité V1

- fonctionnement fiable
- calculs exacts
- exports corrects
- simplicité d’utilisation

---

## 🚀 Évolutions futures

- multi-examens
- multi-utilisateurs
- sauvegarde automatique
- synchronisation réseau
- version ministère / inspection

---

## ⚠️ Contraintes importantes

- application totalement offline
- aucune dépendance serveur
- données stockées localement
- fiabilité des calculs prioritaire

---

## 🧠 Règle principale

> La logique métier doit être centralisée dans `/core`
> et ne jamais être écrite directement dans les composants React.