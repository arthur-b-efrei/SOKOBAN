import type { LevelData, Vector2 } from './types.ts';
import { TileKind } from './types.ts';

// Parse un niveau ASCII en LevelData typé: tuiles, joueur, caisses, cibles
const parseAsciiLevel = (name: string, ascii: string): LevelData => {
	const rows = ascii
		.trim()
		.split(/\r?\n/)
		.map((row) => row.trimEnd()); //supprime les espaces en fin de ligne
	const height = rows.length;
	const width = Math.max(...rows.map((r) => r.length)); //largeur maximale des lignes

	const tiles: TileKind[][] = Array.from({ length: height }, () => //matrice de tiles (floor, wall, goal)
		Array.from({ length: width }, () => TileKind.Floor)
	);
	let playerStart: Vector2 | null = null;
	const boxes: Vector2[] = []; 
	const goals: Vector2[] = [];

	rows.forEach((row, y) => {
		for (let x = 0; x < width; x += 1) {
			const ch = row[x] ?? ' ';
			if (ch === '#') tiles[y][x] = TileKind.Wall;
			else if (ch === 'G' || ch === '.') tiles[y][x] = ch === 'G' ? TileKind.Goal : TileKind.Floor; //si la tile est un goal, on la met à goal, sinon on la met à floor
			if (ch === 'P') playerStart = { x, y }; //si la tile est un player, on la met à playerStart
			if (ch === 'B') boxes.push({ x, y });
			if (ch === 'G') goals.push({ x, y });
		}
	});

	if (!playerStart) {
		throw new Error(`Level ${name} missing player start`); //si le player start est manquant, on throw une erreur
	}

	return { width, height, tiles, playerStart, boxes, goals, name };
};

export const builtinLevels: Record<string, string> = { //niveaux prédéfinis
	intro: `
########
#   G  #
#  B   #
#   P  #
########
`,
	push1: `
########
#  G   #
#  B   #
#  P   #
########
`,
	corridor: `
###########
#G   B   P#
###########
`,
	corner: `
########
#G     #
#   B  #
#   P  #
########
`,
	woom: `
#############
#   #   #   #
# B G B G   #
# ### # ### #
#   P   B G #
#   #   #   #
#############
`,
	warehouse: `
###############
#   G G G     #
#  B B B B #  #
#   ###   B  P#
#   ###   #   #
#   G   G   ###
###############
`,
	tight: `
########
#  G   #
#  B P #
#  G B #
#      #
########
`,
    zigzag: `
###########
#G B G B  #
# ### ### #
#   P     #
###########
`,
    boxes4: `
###########
# G G G G #
# B B B B #
#   P     #
###########
`,
	boucle: `
#############
# B     G   #
# # # # # # #
# P    B G  #
#   # # #   #
# G   B     #
#############
`,
	injouable: `
############################
#G#  #   #P #  #           #
# #    B  # #   BB  #     B#
# # ##### # #  #  G   ##   #
#           #    G#G       #
#    #  ##### ####G    #   #
######  #G  B              #
#G     #### #   B# # ##    #
# # B       #              #
# #  # ####B## # # # # # # #
# #  #      #G          B G#
# #  #  ### # # # # # # # ##
# #  #    # # B           G#
# #  ####  G# ############ #
# #  #    ###              #
#B#  # ##   B            #G#
#   G                    B #
############################
`,


	
};

export const levelIds: string[] = Object.keys(builtinLevels);

export const loadLevel: (id: string) => Promise<LevelData> = async (id) => {
	try {
		if (id in builtinLevels) { // Si l'identifiant du niveau existe dans les niveaux intégrés
			return parseAsciiLevel(id, builtinLevels[id]); // On parse et retourne le niveau ASCII intégré
		}
		const res = await fetch(`levels/${id}.txt`); // Sinon, on tente de charger le niveau depuis un fichier distant
		if (!res.ok) throw new Error(`HTTP ${res.status} while loading level ${id}`); // Si la requête échoue, on lève une erreur
		const text = await res.text(); // On récupère le texte du niveau
		return parseAsciiLevel(id, text); // On parse et retourne le niveau chargé depuis le fichier
	} catch (error) {
		console.error('Failed to load level', id, error);
		throw error;
	}
};
