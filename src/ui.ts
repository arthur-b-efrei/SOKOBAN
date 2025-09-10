import type { Renderer } from './types.ts';
import { TileKind } from './types.ts';


// Crée et retourne un objet qui implémente l'interface Renderer.
// Cet objet sera responsable de dessiner le jeu dans le DOM.
export const createDomRenderer = (): Renderer => {
	let containerEl: HTMLElement | null = null;
	let width = 0;
	let height = 0;

	//S'assuer que la grille DOM correspond aux dimensions du niveau
	const ensureGrid = (w: number, h: number) => {
		if (!containerEl) return; 
		if (w === width && h === height) return;
		containerEl.innerHTML = ''; //vide la grille DOM
		containerEl.style.gridTemplateColumns = `repeat(${w}, var(--cell))`; 
		for (let i = 0; i < w * h; i += 1) {
			const div = document.createElement('div');
			div.className = 'cell floor';
				containerEl.appendChild(div); //ajoute la case au DOM
			}
		width = w;
		height = h;
	};

	return {
		init(container, state) {
			containerEl = container;
			ensureGrid(state.level.width, state.level.height); 
			this.render.apply(this, [state]); //dessine le jeu dans le DOM
		},
		render(state) {
			if (!containerEl) return;
			ensureGrid(state.level.width, state.level.height);
			const { tiles } = state.level; //récupère la matrice des tuiles floor, wall, goal
			const cells = Array.from(containerEl.children) as HTMLDivElement[]; 
			for (let y = 0; y < state.level.height; y += 1) {
				for (let x = 0; x < state.level.width; x += 1) {
					const idx = y * state.level.width + x; //index de la case dans la grille
					const cell = cells[idx] as HTMLDivElement;
					const kind = tiles[y][x]; //type de la tuile ('.' floor, '#' wall, 'G' goal)
					const base = kind === TileKind.Wall ? 'wall' : kind === TileKind.Goal ? 'goal' : 'floor'; //détermine la classe CSS à appliquer
					cell.className = 'cell ' + base;
				}
			}
			// déssiner les boxes
			for (const box of state.boxes) {
				const idx = box.y * state.level.width + box.x;
				const cell = cells[idx] as HTMLDivElement;
				cell.classList.add('box'); //ajoute la classe "box" à la case(supperpose)
			}
			// déssiner le player
			{
				const idx = state.player.y * state.level.width + state.player.x;
				const cell = cells[idx] as HTMLDivElement;
				cell.classList.add('player'); //ajoute la classe "player" à la case(supperpose)
			}
		},
	};
};


