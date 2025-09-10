import type { GameEvents, GameState, LevelData, MoveResult, Vector2 } from './types.ts';
import { MoveDirection, TileKind, directionToVector, vectorsEqual } from './types.ts';
import { scoreManager } from './scoreManager.ts';

// Aides pour les collisions et opérations vectorielles
const isWall = (level: LevelData, { x, y }: Vector2): boolean => level.tiles[y]?.[x] === TileKind.Wall;
const isBoxAt = (boxes: Vector2[], pos: Vector2): boolean => boxes.some((b) => vectorsEqual(b, pos));
const moveVector = (pos: Vector2, delta: Vector2): Vector2 => ({ x: pos.x + delta.x, y: pos.y + delta.y });

// Crée un état de jeu initial à partir de la définition du niveau
export const createInitialState = (level: LevelData): GameState => ({
	level,
	player: { ...level.playerStart },
	boxes: level.boxes.map((b) => ({ ...b })),
	moves: 0,
	pushes: 0,
	startTimeMs: null,
	ended: false,
	currentPlayer: scoreManager.getCurrentPlayer() || undefined,
});

// Victoire: toutes les cibles (goals) doivent être couvertes par des caisses
const goalsSatisfied = (state: GameState): boolean =>
	state.level.goals.every((g) => state.boxes.some((b) => vectorsEqual(b, g)));

// Défaite locale: une caisse est "bloquée" si contre 3 murs
// ou coincée en coin (mur vertical + mur horizontal)
const isBoxDeadlocked = (level: LevelData, pos: Vector2): boolean => {
	const { x, y } = pos;
	const wallUp = level.tiles[y - 1]?.[x] === TileKind.Wall;
	const wallDown = level.tiles[y + 1]?.[x] === TileKind.Wall;
	const wallLeft = level.tiles[y]?.[x - 1] === TileKind.Wall;
	const wallRight = level.tiles[y]?.[x + 1] === TileKind.Wall;
	const wallsCount = (wallUp ? 1 : 0) + (wallDown ? 1 : 0) + (wallLeft ? 1 : 0) + (wallRight ? 1 : 0);
	const corner = (wallUp || wallDown) && (wallLeft || wallRight);
	return wallsCount >= 3 || corner;
};

// Tente un déplacement dans la direction donnée et met à jour l'état
export const stepMove = (
	state: GameState,
	direction: MoveDirection,
	events?: GameEvents
): MoveResult => {
	if (state.ended) return { success: false, pushedBox: false, newState: state };
	
	const delta = directionToVector(direction);
	const target = moveVector(state.player, delta);
	
	// Éviter les collisions avec les murs
	if (isWall(state.level, target)) {
		return { success: false, pushedBox: false, newState: state };
	}
	
	// Collision avec une box → essayer de pousser
	const boxIndex = state.boxes.findIndex((b) => vectorsEqual(b, target));
	let pushed = false;
	
	const newState: GameState = {
		...state,
		player: { ...state.player },
		boxes: state.boxes.map((b) => ({ ...b })),
		moves: state.moves,
		pushes: state.pushes,
		startTimeMs: state.startTimeMs ?? Date.now(),
	};
	
	// Si une box est à la position cible, essayer de pousser
	if (boxIndex >= 0) {
		const beyond = moveVector(target, delta);
		if (isWall(state.level, beyond) || isBoxAt(state.boxes, beyond)) {
			return { success: false, pushedBox: false, newState: state };
		}
		newState.boxes[boxIndex] = beyond;
		pushed = true;

		// Vérifie si la boîte a été poussée sur un objectif
		if (state.level.goals.some((g) => vectorsEqual(g, beyond)) && !goalsSatisfied(newState)) {
			events?.onBoxGoal?.(newState);
		}
	}
	
	newState.player = target;
	newState.moves += 1;
	if (pushed) newState.pushes += 1;
	
	// Condition de défaite: une box devient bloquée (non sur une cible)
	const deadlocked = newState.boxes.some((b) => 
		!newState.level.goals.some((g) => vectorsEqual(g, b)) && 
		isBoxDeadlocked(newState.level, b)
	);
	
	// Si une boîte est bloquée (deadlock), le jeu se termine avec une défaite
	if (deadlocked) {
		newState.ended = true; // On marque l'état comme terminé
		events?.onError?.(newState); // On déclenche l'événement d'erreur/défaite si défini
		return { success: true, pushedBox: pushed, newState }; // On retourne le nouvel état, succès du mouvement mais partie terminée
	}
	
	// Vérifier la victoire
	if (goalsSatisfied(newState)) {
		newState.ended = true;
		const finalScore = scoreManager.calculateFinalScore(newState);
		
		// Enregistrer le score si il y a un joueur courant
		if (newState.currentPlayer) {
			scoreManager.recordScore(newState.level.name, finalScore);
		}
		
		events?.onWin?.(newState, finalScore);
	}
	
	events?.onMove?.(newState);
	return { success: true, pushedBox: pushed, newState };
};