import { PROFILE_SAMPLES } from './profiles'
import {
  hullOfCircles,
  profileFromPolygon,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile
} from './shape'

/**
 * Formes et couleurs proposees par le personnalisateur du bot.
 *
 * A la difference des silhouettes d'animation (`profiles.ts`), celles-ci ne sont
 * PAS relevees sur la video : elles sont construites analytiquement d'apres la
 * grille du personnalisateur d'origine. Deux sources distinctes, donc, et c'est
 * volontaire — les etats animes doivent rester fideles a la video, les formes de
 * base sont un choix d'utilisateur.
 */

/**
 * Les identifiants sont enumeres plutot que deduits du tableau : c'est ce qui
 * permet a la couche i18n de verifier A LA COMPILATION que chaque forme a bien
 * sa traduction dans les trois langues (`t(\`shapes.${id}\`)` ne compile que si
 * la cle existe). Un `as const` sur le tableau aurait le meme effet mais
 * rendrait `radii` en lecture seule, alors que le moteur le passe tel quel.
 */
export type ShapeId =
  | 'cercle'
  | 'galet'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagone'
  | 'nuage'
  | 'goutte'

export interface BotShape {
  id: ShapeId
  radii: number[]
}

/** Ramene le rayon maximal a `max` pour que toutes les formes pesent pareil a l'oeil. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Galet : cercle deforme par deux harmoniques basses, donc irregulier mais lisse. */
const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02
)

/** Nuage : union de bosses, large en bas, deux lobes en haut. */
const cloud = normalize(
  unionOfCirclesProfile([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 }
  ]),
  1.02
)

/** Goutte : gros disque en bas, pointe effilee en haut. */
const droplet = normalize(
  profileFromPolygon(hullOfCircles(0, 0.28, 0.66, 0, -0.96, 0.05), 0, 0),
  1.04
)

/** Capsule couchee : enveloppe de deux disques cote a cote. */
const capsule = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62), 0, 0)

export const SHAPES: BotShape[] = [
  { id: 'cercle', radii: new Array(PROFILE_SAMPLES).fill(1) },
  { id: 'galet', radii: pebble },
  // 1.15 et pas 1.02 : sur une superellipse le rayon maximal est la diagonale,
  // donc normaliser dessus donne une forme qui parait plus petite que le cercle.
  { id: 'squircle', radii: normalize(superellipseProfile(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  // -90deg : un sommet vers le haut de l'ecran (y est oriente vers le bas)
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12, 0.34, -90) },
  // 0deg : sommets a gauche et a droite, donc aretes du haut et du bas plates
  { id: 'hexagone', radii: regularPolygonProfile(6, 1.04, 0.26, 0) },
  { id: 'nuage', radii: cloud },
  { id: 'goutte', radii: droplet }
]

// Map indexee par `string` et non par `ShapeId` : les appelants interrogent avec
// une valeur relue du localStorage ou d'une prop, donc non validee.
export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE = 'cercle'

export type ColorId =
  | 'encre'
  | 'creme'
  | 'brun'
  | 'rouge'
  | 'orange'
  | 'ambre'
  | 'vert'
  | 'turquoise'
  | 'bleu'
  | 'violet'
  | 'rose'
  | 'gris'

export interface BotColor {
  id: ColorId
  hex: string
}

/** Palette du personnalisateur d'origine. */
export const COLORS: BotColor[] = [
  { id: 'encre', hex: '#0a0a0c' },
  { id: 'brun', hex: '#8b5e3c' },
  { id: 'rouge', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'ambre', hex: '#f0b429' },
  { id: 'vert', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'bleu', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'rose', hex: '#e152b0' },
  { id: 'gris', hex: '#a3a3a3' },
  { id: 'creme', hex: '#f1efe9' }
]

export const COLOR_BY_ID = new Map<string, BotColor>(COLORS.map((c) => [c.id, c]))
export const DEFAULT_COLOR = 'encre'

/** RGB d'une couleur `#rrggbb`. */
function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Melange deux couleurs hex. Sert a la brume de profondeur des particules. */
export function mixHex(from: string, to: string, t: number): string {
  const a = rgb(from)
  const b = rgb(to)
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t))
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Luminance relative (WCAG, sRGB linearise). C'est la lumiere PERCUE, pas la
 * moyenne des composantes : c'est elle qui decide si deux couleurs se
 * confondent a l'oeil.
 */
export function luminance(hex: string): number {
  const canal = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = rgb(hex).map(canal)
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Rapport de contraste WCAG entre deux couleurs, entre 1 et 21. */
export function contraste(a: string, b: string): number {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (haut! + 0.05) / (bas! + 0.05)
}

/**
 * Inverse la CLARTE d'une couleur HSL (`l` -> `1 - l`), teinte et saturation
 * gardees. C'est l'operation du favicon en theme sombre : le corps noir devient
 * clair sans devenir une autre couleur.
 */
export function inverseClarte(hex: string): string {
  const [r, g, b] = rgb(hex).map((v) => v / 255)
  const max = Math.max(r!, g!, b!)
  const min = Math.min(r!, g!, b!)
  const d = max - min
  const l = (max + min) / 2
  // saturation HSL ; indeterminee quand il n'y a pas de teinte (gris pur)
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === r!) h = ((g! - b!) / d) % 6
    else if (max === g!) h = (b! - r!) / d + 2
    else h = (r! - g!) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l2 = 1 - l
  // HSL -> RGB sur la teinte et la saturation d'origine
  const c = (1 - Math.abs(2 * l2 - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l2 - c / 2
  const seg = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return `#${seg.map((v) => Math.round((v! + m) * 255).toString(16).padStart(2, '0')).join('')}`
}

/** En deca, le fond est juge sombre. */
const FOND_SOMBRE = 0.25

/** En deca, le corps se confond avec le fond. */
const CONTRASTE_MIN = 2.2

/**
 * Couleur de corps retenie pour un fond donne.
 *
 * La regle du favicon (`public/favicon.svg`) : « le corps s'inverse en theme
 * sombre, sinon un disque noir disparait ». Un fond sombre fait disparaitre les
 * corps sombres — y compris les yeux, qui sont des trous laissant voir ce fond.
 * On inverse donc la clarte du corps quand il se confond avec lui.
 *
 * Elle est commandee par le FOND et non par le theme : c'est le rendu qui sait
 * sur quoi il est pose. Un export garde ses couleurs quel que soit le theme du
 * site (son fond est blanc ou transparent), et le theme clair ne la declenche
 * jamais — l'apparence actuelle du site ne bouge pas d'un pixel.
 */
export function couleurVisible(couleur: string, fond: string): string {
  return luminance(fond) < FOND_SOMBRE && contraste(couleur, fond) < CONTRASTE_MIN
    ? inverseClarte(couleur)
    : couleur
}
