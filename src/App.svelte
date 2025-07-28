<script>
  import logo from './assets/logo.png';

  let taille = 3; // taille de la grille (modifiable dynamiquement)
  let plateau = Array(taille * taille).fill(null);
  let premierJoueur = "X";
  let joueurActuel = premierJoueur;
  let gagnant = null;
  let score = { X: 0, O: 0 };
  let message = "Choisissez qui commence.";
  let combinaisonGagnante = [];
  let partiesJouees = 0;
  let partieCommencee = false;

  $: plateau = Array(taille * taille).fill(null); // réinitialise si la taille change

  function demarrerPartie() {
    joueurActuel = premierJoueur;
    plateau = Array(taille * taille).fill(null);
    gagnant = null;
    message = `Joueur ${joueurActuel} à toi !`;
    combinaisonGagnante = [];
    partieCommencee = true;
  }

  function jouerCase(index) {
    if (plateau[index] || gagnant || !partieCommencee) return;

    plateau[index] = joueurActuel;
    verifierGagnant();

    if (!gagnant) {
      joueurActuel = joueurActuel === "X" ? "O" : "X";
      message = `Joueur ${joueurActuel} à toi !`;
    }
  }

  function index(i, j) {
    return i * taille + j;
  }

  function verifierGagnant() {
    const lignes = [];
    const colonnes = [];
    const diag1 = [];
    const diag2 = [];

    for (let i = 0; i < taille; i++) {
      lignes.push([]);
      colonnes.push([]);
    }

    for (let i = 0; i < taille; i++) {
      for (let j = 0; j < taille; j++) {
        const idx = index(i, j);
        lignes[i].push(idx);
        colonnes[j].push(idx);
        if (i === j) diag1.push(idx);
        if (i + j === taille - 1) diag2.push(idx);
      }
    }

    const combinaisons = [...lignes, ...colonnes, diag1, diag2];

    for (let combo of combinaisons) {
      const symbol = plateau[combo[0]];
      if (symbol && combo.every(i => plateau[i] === symbol)) {
        gagnant = symbol;
        score[gagnant]++;
        message = `Le joueur ${gagnant} a gagné !`;
        combinaisonGagnante = combo;
        partiesJouees++;
        return;
      }
    }

    if (!plateau.includes(null)) {
      gagnant = "égalité";
      message = "Match nul !";
      partiesJouees++;
    }
  }

  function rejouerPartie() {
    if (gagnant === "X" || gagnant === "O") {
      premierJoueur = gagnant;
    }
    joueurActuel = premierJoueur;
    plateau = Array(taille * taille).fill(null);
    gagnant = null;
    message = `Joueur ${joueurActuel} à toi !`;
    combinaisonGagnante = [];
  }

  function reinitialiserScore() {
    score = { X: 0, O: 0 };
    premierJoueur = "X";
    partieCommencee = false;
    plateau = Array(taille * taille).fill(null);
    joueurActuel = premierJoueur;
    gagnant = null;
    message = "Choisissez qui commence.";
    combinaisonGagnante = [];
    partiesJouees = 0;
  }

  function estGagnant(index) {
    return combinaisonGagnante.includes(index);
  }
</script>

<main>
  <img src="{logo}" alt="Logo" class="logo" />

  <h1>Jeu de Morpion</h1>

  {#if !partieCommencee}
    <div>
      <label>Qui commence ?</label>
      <select bind:value={premierJoueur}>
        <option value="X">Joueur X</option>
        <option value="O">Joueur O</option>
      </select>

      <label> Taille de la grille :</label>
      <input type="number" bind:value={taille} min="3" max="10" />

      <button on:click={demarrerPartie}>Démarrer la partie</button>
    </div>
  {:else}
    <p>{message}</p>

    <div class="grille" style="--taille: {taille}">
      {#each plateau as caseJeu, i}
        <div
          class="case {gagnant && estGagnant(i) ? 'gagnante' : ''}"
          on:click={() => jouerCase(i)}
        >
          {caseJeu}
        </div>
      {/each}
    </div>

    <p class="score">Score — X : {score.X} | O : {score.O}</p>
    <p class="score">Parties jouées : {partiesJouees}</p>

    <div class="boutons">
      <button on:click={rejouerPartie}>Rejouer</button>
      <button on:click={reinitialiserScore}>Réinitialiser le score</button>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #000000, #6a0dad);
    color: white;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  main {
    text-align: center;
    padding: 2rem;
    max-width: 700px;
    width: 100%;
  }

  .logo {
    width: 120px;
    margin-bottom: 1rem;
  }

  .grille {
    display: grid;
    grid-template-columns: repeat(var(--taille), 1fr);
    gap: 10px;
    margin: 1rem auto;
  }

  .case {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;
    transition: background-color 0.3s;
    user-select: none;
  }

  .case:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .gagnante {
    animation: clignoter 0.8s ease-in-out infinite alternate;
    background-color: #b3ffb3 !important;
  }

  @keyframes clignoter {
    from {
      background-color: #b3ffb3;
    }
    to {
      background-color: #66ff66;
    }
  }

  .score {
    margin: 1rem 0;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .boutons button {
    margin: 0.5rem;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: white;
    color: black;
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
  }

  .boutons button:hover {
    background: #eaeaea;
  }
</style>
