/**
 * Coordonnée 2D entière sur la grille.
 */
export type Vector2 = { x: number; y: number };

/**
 * Types de tuiles qui composent la grille d'un niveau.
 */
export const TileKind = {
	Floor: '.',
	Wall: '#',
	Goal: 'G',
} as const;
export type TileKind = typeof TileKind[keyof typeof TileKind];

/**
 * Types d'entités placées au-dessus des tuiles.
 */
export const EntityKind = {
	Player: 'P',
	Box: 'B',
} as const;
export type EntityKind = typeof EntityKind[keyof typeof EntityKind];

/**
 * Directions de déplacement supportées par le joueur.
 */
export const MoveDirection = {
	Up: 'up',
	Down: 'down',
	Left: 'left',
	Right: 'right',
} as const;
export type MoveDirection = typeof MoveDirection[keyof typeof MoveDirection];

/**
 * Définition immuable d'un niveau parsé depuis l'ASCII.
 */
export interface LevelData {
	width: number;
	height: number;
	tiles: TileKind[][];
	playerStart: Vector2;
	boxes: Vector2[];
	goals: Vector2[];
	name: string;
}

/**
 * Structure pour stocker les scores des joueurs
 */
export interface PlayerScores {
	[pseudo: string]: {
		[levelName: string]: number;
	}
}

/**
 * Informations sur le meilleur score d'un niveau
 */
export interface BestScore {
	score: number;
	player: string;
}

/**
 * État mutable du jeu pour une instance de niveau.
 */
export interface GameState {
	level: LevelData;
	player: Vector2;
	boxes: Vector2[];
	moves: number;
	pushes: number;
	startTimeMs: number | null;
	ended: boolean;
	currentPlayer?: string;
}

/**
 * Résultat de la tentative d'un déplacement.
 */
export interface MoveResult {
	success: boolean;
	pushedBox: boolean;
	newState: GameState;
}

/**
 * Callbacks utilisés par l'UI pour réagir aux changements d'état.
 */
export interface GameEvents {
	onMove?: (state: GameState) => void;
	onWin?: (state: GameState, finalScore: number) => void;
	onError?: (error: unknown) => void;
	onBoxGoal?: (state: GameState) => void;
}

/**
 * Interface minimale de rendu pour dessiner la grille et les entités.
 */
export interface Renderer {
	init(container: HTMLElement, state: GameState): void;
	render(state: GameState): void;
}

/**
 * Interface pour charger un niveau de manière asynchrone.
*/
export type AsyncLevelLoader = (id: string) => Promise<LevelData>;

/**
 * Convertit une direction en vecteur unitaire (delta).
 */
export const directionToVector = (direction: MoveDirection): Vector2 => {
	switch (direction) {
		case MoveDirection.Up:
			return { x: 0, y: -1 };
		case MoveDirection.Down:
			return { x: 0, y: 1 };
		case MoveDirection.Left:
			return { x: -1, y: 0 };
		case MoveDirection.Right:
			return { x: 1, y: 0 };
		default:
			return { x: 0, y: 0 };
	}
};

/**
 * Test d'égalité exact pour deux positions de la grille.
 */
export const vectorsEqual = (a: Vector2, b: Vector2): boolean => a.x === b.x && a.y === b.y;

/**
 * Vérifie si une position est dans les bornes du niveau.
 */
export const inBounds = (pos: Vector2, level: LevelData): boolean =>
	pos.x >= 0 && pos.y >= 0 && pos.x < level.width && pos.y < level.height;