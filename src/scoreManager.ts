import type { PlayerScores, BestScore, GameState } from './types.ts';

const STORAGE_KEY = 'sokoban-scores';
const PLAYER_KEY = 'sokoban-current-player';

/**
 * Gestionnaire des scores et des joueurs
 */
export class ScoreManager {
	private scores: PlayerScores = {};
	private currentPlayer: string | null = null;

	constructor() {
		this.loadScores();
		this.loadCurrentPlayer();
	}

	/**
	 * Charge les scores depuis le stockage local
	 */
	private loadScores(): void {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.scores = JSON.parse(stored);
			}
		} catch (error) {
			console.warn('Impossible de charger les scores:', error);
			this.scores = {};
		}
	}

	/**
	 * Sauvegarde les scores dans le stockage local
	 */
	private saveScores(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
		} catch (error) {
			console.warn('Impossible de sauvegarder les scores:', error);
		}
	}

	/**
	 * Charge le joueur courant depuis le stockage local
	 */
	private loadCurrentPlayer(): void {
		try {
			this.currentPlayer = localStorage.getItem(PLAYER_KEY);
		} catch (error) {
			console.warn('Impossible de charger le joueur courant:', error);
		}
	}

	/**
	 * Sauvegarde le joueur courant dans le stockage local
	 */
	private saveCurrentPlayer(): void {
		if (this.currentPlayer) {
			try {
				localStorage.setItem(PLAYER_KEY, this.currentPlayer);
			} catch (error) {
				console.warn('Impossible de sauvegarder le joueur courant:', error);
			}
		}
	}

	/**
	 * Définit le joueur courant
	 */
	setCurrentPlayer(pseudo: string): void {
		this.currentPlayer = pseudo.trim();
		if (this.currentPlayer && !this.scores[this.currentPlayer]) {
			this.scores[this.currentPlayer] = {};
		}
		this.saveCurrentPlayer();
		this.saveScores();
	}

	/**
	 * Retourne le joueur courant
	 */
	getCurrentPlayer(): string | null {
		return this.currentPlayer;
	}

	/**
	 * Calcule le score final basé sur l'état du jeu
	 */
	calculateFinalScore(state: GameState): number {
		const start = state.startTimeMs;
		const elapsed = start ? (Date.now() - start) / 1000 : 0;
		return Math.max(0, 1000 - state.moves * 5 - state.pushes * 10 - Math.floor(elapsed));
	}

	/**
	 * Enregistre un nouveau score pour le joueur courant
	 */
	recordScore(levelName: string, score: number): boolean {
		if (!this.currentPlayer) return false;

		const playerScores = this.scores[this.currentPlayer];
		const previousBest = playerScores[levelName] || 0;
		
		// Enregistrer si c'est le premier score ou un meilleur score
		if (score > previousBest) {
			playerScores[levelName] = score;
			this.saveScores();
			return true; // Nouveau record personnel
		}
		
		return false; // Pas un nouveau record
	}

	/**
	 * Retourne le meilleur score du joueur courant pour un niveau
	 */
	getPlayerBestScore(levelName: string): number {
		if (!this.currentPlayer) return 0;
		return this.scores[this.currentPlayer]?.[levelName] || 0;
	}

	/**
	 * Retourne le meilleur score global pour un niveau
	 */
	getGlobalBestScore(levelName: string): BestScore | null {
		let bestScore = 0;
		let bestPlayer = '';

		for (const [player, scores] of Object.entries(this.scores)) {
			const score = scores[levelName];
			if (score && score > bestScore) {
				bestScore = score;
				bestPlayer = player;
			}
		}

		return bestScore > 0 ? { score: bestScore, player: bestPlayer } : null;
	}

	/**
	 * Retourne tous les scores pour un niveau donné, triés par score décroissant
	 */
	getLevelLeaderboard(levelName: string): Array<{ player: string; score: number }> {
		const results: Array<{ player: string; score: number }> = [];

		for (const [player, scores] of Object.entries(this.scores)) {
			const score = scores[levelName];
			if (score) {
				results.push({ player, score });
			}
		}

		return results.sort((a, b) => b.score - a.score);
	}

	/**
	 * Vérifie si un pseudo est disponible (optionnel, pour éviter les doublons)
	 */
	isPseudoAvailable(pseudo: string): boolean {
		return !this.scores.hasOwnProperty(pseudo.trim());
	}

	/**
	 * Retourne la liste des joueurs existants
	 */
	getExistingPlayers(): string[] {
		return Object.keys(this.scores);
	}
}

// Instance globale du gestionnaire de scores
export const scoreManager = new ScoreManager();