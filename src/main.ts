import './style.css';
import { loadLevel, levelIds } from './levels.ts';
import { createInitialState, stepMove } from './engine.ts';
import { createDomRenderer } from './ui.ts';
import type { GameEvents } from './types.ts';
import { MoveDirection } from './types.ts';
import { scoreManager } from './scoreManager.ts';

const app = document.querySelector<HTMLDivElement>('#app');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const hud = document.querySelector<HTMLDivElement>('#hud');
const startBtn = document.querySelector<HTMLButtonElement>('#start');
const restartBtn = document.querySelector<HTMLButtonElement>('#restart');
const movesEl = document.querySelector<HTMLSpanElement>('#moves');
const pushesEl = document.querySelector<HTMLSpanElement>('#pushes');
const timeEl = document.querySelector<HTMLSpanElement>('#time');
const levelSelect = document.querySelector<HTMLSelectElement>('#level');
const levelHudSelect = document.querySelector<HTMLSelectElement>('#level-hud');
const scoreEl = document.querySelector<HTMLSpanElement>('#score');

// Nouveaux éléments pour la gestion des scores
const playerNameEl = document.querySelector<HTMLSpanElement>('#player-name');
const playerBestEl = document.querySelector<HTMLSpanElement>('#player-best');
const globalBestEl = document.querySelector<HTMLSpanElement>('#global-best');
const changePlayerBtn = document.querySelector<HTMLButtonElement>('#change-player');

if (!app || !overlay || !hud || !startBtn || !restartBtn || !movesEl || !pushesEl || 
    !timeEl || !levelSelect || !levelHudSelect || !scoreEl || !playerNameEl || 
    !playerBestEl || !globalBestEl || !changePlayerBtn) {
	throw new Error('Missing DOM elements');
}

const renderer = createDomRenderer();

let ticking = false;
let currentState = null as ReturnType<typeof createInitialState> | null;

// Fonction pour demander le pseudo du joueur
const askForPlayerName = (): Promise<string> => {
	return new Promise((resolve) => {
		const existingPlayer = scoreManager.getCurrentPlayer();
		
		if (existingPlayer) {
			const useExisting = confirm(`Continuer avec le pseudo "${existingPlayer}" ?\n(Annuler pour changer de pseudo)`);
			if (useExisting) {
				resolve(existingPlayer);
				return;
			}
		}

		const existingPlayers = scoreManager.getExistingPlayers();
		let message = 'Entrez votre pseudo :';
		
		if (existingPlayers.length > 0) {
			message += `\n\nJoueurs existants : ${existingPlayers.join(', ')}`;
		}

		const askName = () => {
			const pseudo = prompt(message);
			if (!pseudo || pseudo.trim() === '') {
				alert('Le pseudo ne peut pas être vide !');
				askName();
				return;
			}
			
			const trimmedPseudo = pseudo.trim();
			
			// Si le pseudo existe déjà, demander confirmation
			if (!scoreManager.isPseudoAvailable(trimmedPseudo)) {
				const useExisting = confirm(`Le pseudo "${trimmedPseudo}" existe déjà. Voulez-vous continuer avec ce compte ?`);
				if (!useExisting) {
					askName();
					return;
				}
			}
			
			resolve(trimmedPseudo);
		};
		
		askName();
	});
};

// Met à jour les informations de score dans le HUD
const updateScoreInfo = () => {
	if (!currentState) return;
	
	const currentPlayer = scoreManager.getCurrentPlayer();
	const levelName = currentState.level.name;
	
	// Afficher le nom du joueur
	playerNameEl.textContent = `Joueur: ${currentPlayer || 'Anonyme'}`;
	
	// Afficher le meilleur score personnel
	const playerBest = scoreManager.getPlayerBestScore(levelName);
	playerBestEl.textContent = `Votre record: ${playerBest || 'Aucun'}`;
	
	// Afficher le meilleur score global
	const globalBest = scoreManager.getGlobalBestScore(levelName);
	if (globalBest) {
		globalBestEl.textContent = `Record mondial: ${globalBest.score} (${globalBest.player})`;
	} else {
		globalBestEl.textContent = 'Record mondial: Aucun';
	}
};

// Met à jour le HUD (compteurs + score)
const updateHud = () => {
	// Vérifie si l'état courant du jeu existe, sinon on quitte la fonction
	if (!currentState) return;
	
	movesEl.textContent = `Moves: ${currentState.moves}`;
	pushesEl.textContent = `Pushes: ${currentState.pushes}`;
	
	const start = currentState.startTimeMs;
	const elapsed = start ? (Date.now() - start) / 1000 : 0;
	timeEl.textContent = `Time: ${elapsed.toFixed(1)}s`;
	
	// Calcule le score actuel du joueur pour cette partie
	const score = scoreManager.calculateFinalScore(currentState);
	scoreEl.textContent = `Score: ${score}`;
	updateScoreInfo();
};

// Boucle d'animation
const tick = () => {
	if (!currentState) return;
	updateHud();
	if (!currentState.ended) {
		requestAnimationFrame(tick);
	}
};

const keyToDir = (key: string): MoveDirection | null => {
	switch (key) {
		case 'ArrowUp':
		case 'Z':
		case 'z':
			return MoveDirection.Up;
		case 'ArrowDown':
		case 's':
		case 'S':
			return MoveDirection.Down;
		case 'ArrowLeft':
		case 'Q':
		case 'q':
			return MoveDirection.Left;
		case 'ArrowRight':
		case 'D':
		case 'd':
			return MoveDirection.Right;
		default:
			return null;
	}
};

let currentLevelIndex = 0;

const populateLevelSelects = () => {
	const options = levelIds.map((id) => `<option value="${id}">${id}</option>`).join(''); 
	levelSelect.innerHTML = options; 
	levelHudSelect.innerHTML = options;
};
populateLevelSelects();

const loadByIndex = async (idx: number) => {
	const id = levelIds[idx] ?? 'intro';
	levelSelect.value = id;
	levelHudSelect.value = id; 
	const level = await loadLevel(id);
	return level;
};

const startLevelByIndex = async (idx: number) => {
	currentLevelIndex = Math.max(0, Math.min(idx, levelIds.length - 1));
	const level = await loadByIndex(currentLevelIndex);
	currentState = createInitialState(level);
	renderer.init(app, currentState);
	updateHud();
	hud.classList.remove('hidden');
	overlay.classList.add('hidden'); 
	if (!ticking) {
		ticking = true;
		requestAnimationFrame(tick);
	}
};  

// Callbacks UI améliorés
const events: GameEvents = {
	onMove: (state) => {
		renderer.render(state);
		currentState = state;
		updateHud();
	},
	onWin: (state, finalScore) => {
		renderer.render(state);
		currentState = state;
		
		// Jouer le son de victoire
		const winAudio = document.querySelector<HTMLAudioElement>('#snd-win');
		winAudio?.play().catch(() => {});
		
		const playerName = scoreManager.getCurrentPlayer();
		const levelName = state.level.name;
		const playerBest = scoreManager.getPlayerBestScore(levelName);
		const globalBest = scoreManager.getGlobalBestScore(levelName);
		
		let message = `🎉 Niveau terminé ! 🎉\n\n`;
		message += `Score final: ${finalScore}\n`;
		
		if (playerName) {
			if (finalScore > playerBest) {
				message += `🏆 Nouveau record personnel ! (ancien: ${playerBest})\n`;
			} else {
				message += `Record personnel: ${playerBest}\n`;
			}
			
			if (globalBest && finalScore > globalBest.score) {
				message += `🌟 NOUVEAU RECORD MONDIAL ! 🌟\n(ancien: ${globalBest.score} par ${globalBest.player})`;
			} else if (globalBest) {
				message += `Record mondial: ${globalBest.score} (${globalBest.player})`;
			}
		}
		
		alert(message);
		
		// Passer au niveau suivant
		const currentName = state.level.name; 
		const idx = levelIds.indexOf(currentName); 
		const nextIdx = idx >= 0 ? Math.min(idx + 1, levelIds.length - 1) : Math.min(currentLevelIndex + 1, levelIds.length - 1);
		void startLevelByIndex(nextIdx);
	},
	onError: () => {
		const loseAudio = document.querySelector<HTMLAudioElement>('#snd-lose');
		loseAudio?.play().catch(() => {});
		void startLevelByIndex(currentLevelIndex);
	},
	onBoxGoal: () => {
		const boxAudio = document.querySelector<HTMLAudioElement>('#snd-box');
		boxAudio?.play().catch(() => {});
	},
};

// Fonction pour initialiser le joueur
const initializePlayer = async (): Promise<void> => {
	const playerName = await askForPlayerName();
	scoreManager.setCurrentPlayer(playerName);
	updateScoreInfo();
};

const startGame = async () => {
	try {
		// Vérifier si on a un joueur, sinon en demander un
		if (!scoreManager.getCurrentPlayer()) {
			await initializePlayer();
		}
		
		const selected = levelHudSelect.value || levelSelect.value;
		const idx = levelIds.indexOf(selected);
		const targetIdx = idx === -1 ? currentLevelIndex : idx;
		await startLevelByIndex(targetIdx);
	} catch (error) {
		events.onError?.(error);
	}
};

// Event listeners
startBtn.addEventListener('click', () => { void startGame(); }); 
restartBtn.addEventListener('click', () => { void startGame(); });
changePlayerBtn.addEventListener('click', async () => {
	await initializePlayer();
	updateScoreInfo();
});
levelSelect.addEventListener('change', () => { levelHudSelect.value = levelSelect.value; void startGame(); }); 
levelHudSelect.addEventListener('change', () => { levelSelect.value = levelHudSelect.value; void startGame(); });

window.addEventListener('keydown', (ev) => {
	if (!currentState) return;
	const dir = keyToDir(ev.key);
	if (!dir) return;
	const res = stepMove(currentState, dir, events);
	if (res.success) {
		currentState = res.newState;
	}
});

void (async () => {
	try {
		await new Promise((r) => setTimeout(r, 300));
		if (overlay.classList.contains('hidden')) return;
		await startGame();
	} catch {}
})();