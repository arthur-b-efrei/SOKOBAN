# Sokoban (TypeScript + Vite)

## Règle du jeu

- Tu incarnes un personnage(un carré bleu)
- Ton objectif est de déplacer les carrés rouge sur les places vertes 
- Attention, tu ne peux que pousser les carrés rouge
- Tu peux choisir les niveaux en haut de l'écran mais n'essaye pas trop vite le niveau:  **INJOUABLE**


## 🚀 Lancement

```bash
npm install
npm run dev
```
Ouvre l'URL affichée par le serveur de développement dans ton navigateur.

---

## 🎮 Contrôles

- **Touches directionnelles** ou **ZQSD** pour déplacer le joueur.
- **Bouton "Restart"** pour recharger le niveau.
- **Possibilité de changer de niveau**

---

## 🛠 Technologies et Contraintes

- Utilisation de `let`/`const`, fonctions fléchées et déstructuration.
- Modules ES.
- Promesses + `async`/`await` + gestion des erreurs.
- TypeScript strict avec interfaces (`src/types.ts`).
- Manipulation du DOM et gestion des événements (`src/ui.ts`, `src/main.ts`).
- Architecture modulaire :
  - `types` (types et utilitaires),
  - `levels` (chargement des niveaux),
  - `engine` (moteur de jeu),
  - `ui` (interface utilisateur),
  - `main` (point d'entrée).
- Système de score basique (nombre de déplacements, poussées de caisses, temps).
- Système de son 

---

## 📂 Structure du projet

| Fichier               | Rôle                                                                 |
|-----------------------|----------------------------------------------------------------------|
| **`src/types.ts`**    | Définition des types et fonctions utilitaires.                      |
| **`src/levels.ts`**   | Chargeur de niveaux asynchrone (niveaux intégrés + récupération via `fetch`). |
| **`src/engine.ts`**   | Gestion des déplacements, collisions et détection de victoire.      |
| **`src/ui.ts`**       | Renderer DOM pour afficher le jeu.                                   |
| **`src/main.ts`**     | Initialisation du jeu et gestion des entrées utilisateur.           |

---
