Morpion Svelte – Jeu Tic-Tac-Toe évolutif

Ce projet est une réalisation en **Svelte** d’un jeu de morpion (Tic-Tac-Toe) 100% dynamique.  
Il répond d’abord à un cahier des charges précis, puis a été enrichi par mes soins pour rendre la logique de jeu **adaptative** à la taille de la grille.

---

## 📋 Cahier des charges initial

✅ **Gameplay classique :**

- Grille 3x3
- Deux joueurs en local
- Alternance des tours
- Détection de victoire ou d’égalité
- Comptage des scores
- Bouton “Rejouer”

✅ **Contraintes à respecter :**

- Empêcher de jouer sur une case déjà remplie
- Afficher qui doit jouer
- Afficher le gagnant ou le message d’égalité

---

## 🚀 Améliorations apportées (version dynamique)

🎯 **Grille dynamique** :  
Le jeu peut maintenant s’adapter à n’importe quelle taille de grille (3x3, 4x4, 5x5…), et détecte automatiquement la logique de victoire selon la taille.

🧠 **Détection automatique** :  
La logique de victoire s’adapte à la grille : alignement requis selon les dimensions choisies.

⚙️ **Réactivité Svelte** :  
L’ensemble des états (joueur actuel, score, message, grille) est géré de façon réactive grâce au système de réactivité de Svelte.

---

## 🔧 Technologies utilisées

- [Svelte](https://svelte.dev/) – Framework JS moderne
- HTML5 / CSS3
- JavaScript natif

---

## ▶️ Lancer le projet en local

### 📦 Installation

```bash
git clone https://github.com/makhaseck/morpion-svelte.git
cd morpion-svelte
npm install
npm run dev

Puis ouvre ton navigateur à l’adresse :
👉 http://localhost:5173
<img width="812" height="730" alt="image" src="https://github.com/user-attachments/assets/365aa142-8e0b-48d8-9cec-ba3b0013a87f" />


 Auteur

Makha SECK
