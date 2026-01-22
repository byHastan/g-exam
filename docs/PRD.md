# PRD — Exam Manager

## 1. Présentation du produit

### Nom du produit
**Exam Manager**

### Type
Application desktop (Windows) — fonctionnement 100 % offline.

### Description
Exam Manager est une application de gestion d’examens scolaires permettant de centraliser les candidats, gérer les épreuves, saisir les notes, produire les classements, générer des statistiques et organiser la répartition des élèves en salles.

L’application est destinée aux établissements scolaires, centres d’examen, inspections pédagogiques et structures éducatives.

---

## 2. Objectifs du produit

### Objectif principal
Automatiser et fiabiliser la gestion des examens scolaires tout en réduisant :
- les erreurs humaines
- le temps de traitement
- les calculs manuels
- les classements incorrects

### Objectifs secondaires
- améliorer la transparence des résultats
- fournir des statistiques exploitables
- faciliter l’organisation logistique des examens
- permettre l’impression et l’archivage des résultats

---

## 3. Problème à résoudre

Actuellement, la gestion des examens repose souvent sur :
- des fichiers Excel multiples
- des calculs manuels
- des erreurs de moyenne
- des classements incohérents
- aucune statistique fiable
- une mauvaise organisation des salles

Exam Manager vise à remplacer ce fonctionnement par un outil unique, fiable et simple.

---

## 4. Utilisateurs cibles

### Utilisateurs principaux
- responsables pédagogiques
- chefs d’établissement
- secrétariats scolaires
- centres d’examens

### Niveau technique
Faible à moyen.

L’application doit rester :
- simple
- visuelle
- guidée
- sans jargon technique

---

## 5. Portée du produit

### Inclus (V1)
- gestion des examens
- import Excel des élèves
- saisie manuelle
- gestion des établissements
- gestion des épreuves
- coefficients
- saisie des notes
- calcul automatique
- classements
- statistiques
- répartition en salles
- export PDF et Excel

### Non inclus (V1)
- cloud
- internet
- multi-postes
- authentification distante
- IA

---

## 6. Fonctionnalités détaillées

---

## 6.1 Gestion des examens

L’utilisateur doit pouvoir :
- créer un examen
- définir l’année
- définir le seuil de réussite (ex: 10/20)
- définir le nombre d’épreuves
- modifier un examen tant qu’il n’est pas verrouillé

Un seul examen actif à la fois (V1).

---

## 6.2 Gestion des établissements

Fonctionnalités :
- ajout d’un établissement
- modification
- suppression (si aucun élève associé)
- affichage des statistiques par établissement

Champs minimum :
- nom
- code établissement (optionnel)

---

## 6.3 Gestion des élèves

Méthodes d’ajout :
- import Excel (.xlsx)
- saisie manuelle

Champs obligatoires :
- nom
- prénom
- établissement
- numéro candidat (auto-généré)

Champs optionnels :
- sexe
- date de naissance

Fonctionnalités :
- modification
- suppression
- recherche
- tri alphabétique par défaut

---

## 6.4 Import Excel

L’utilisateur doit pouvoir :
- importer un fichier Excel
- mapper les colonnes
- visualiser un aperçu avant validation
- corriger les erreurs avant import

Règles :
- nettoyage automatique des espaces
- gestion des doublons
- validation obligatoire

---

## 6.5 Gestion des épreuves

Fonctionnalités :
- ajout d’une épreuve
- définition du coefficient (optionnel)
- modification
- suppression (si aucune note associée)

Exemples :
- Mathématiques (coef 2)
- Français (coef 1)
- Éveil (sans coefficient)

---

## 6.6 Saisie des notes

Pour chaque élève :
- saisie des notes par épreuve
- validation des valeurs
- affichage automatique de la moyenne

Règles :
- note maximale définie par épreuve
- impossibilité de saisir après verrouillage
- sauvegarde automatique

---

## 6.7 Calculs

### Moyenne élève
- moyenne simple si aucun coefficient
- moyenne pondérée si coefficients présents

### Moyenne établissement
- moyenne des moyennes élèves

### Réussite
- élève admis si moyenne ≥ seuil défini

---

## 6.8 Classement des élèves

Critères :
1. moyenne générale (descendant)
2. gestion des ex æquo

Résultats affichés :
- rang
- moyenne
- mention (optionnelle)

---

## 6.9 Classement des établissements

Basé sur :
- taux de réussite (% admis)
- moyenne générale
- nombre d’admis

Classement décroissant par taux de réussite.

---

## 6.10 Statistiques

### Statistiques globales
- nombre total de candidats
- nombre d’admis
- nombre d’ajournés
- taux de réussite global
- moyenne générale
- meilleure moyenne
- plus faible moyenne

### Statistiques par épreuve
- moyenne par matière
- note maximale
- note minimale
- distribution des notes

### Statistiques par établissement
- nombre de candidats
- nombre d’admis
- taux de réussite
- moyenne

---

## 6.11 Répartition des élèves en salles

Fonctionnalités :
- définir le nombre de salles
- définir la capacité par salle
- choisir le critère de répartition

Critères :
- alphabétique (par défaut)
- par établissement
- mixte

Résultat :
- liste par salle
- export PDF
- impression

---

## 6.12 Export et impression

Formats :
- PDF
- Excel

Documents exportables :
- liste des candidats
- résultats individuels
- classements
- statistiques
- listes de salles

---

## 6.13 Sécurité locale

- mot de passe administrateur
- verrouillage définitif des notes
- protection contre modification accidentelle

---

## 7. Contraintes techniques

- application totalement offline
- données stockées localement (SQLite)
- aucune dépendance serve
