import { computed, ref, watchEffect } from 'vue'
import { ecris, lis } from '@/ui/stockage'
import {
  choisirTheme,
  estTheme,
  resoudreTheme,
  type Eclairage,
  type Theme
} from '@/ui/themes'

export { THEMES, type Theme } from '@/ui/themes'

/**
 * L'apparence courante, en lecture et en ecriture (`v-model` compris).
 *
 * Comme pour la langue : seule l'ecriture persiste, une detection « Système »
 * n'est pas un choix et ne doit pas etre figee au premier passage.
 */
const courante = ref<Theme>(choisirTheme(lis('theme')))

export const theme = computed<Theme>({
  get: () => courante.value,
  set: (valeur) => {
    if (!estTheme(valeur)) return
    courante.value = valeur
    ecris('theme', valeur)
  }
})

/**
 * La preference du systeme, SUIVIE en cours de session — exactement comme
 * `prefers-reduced-motion` dans `App.vue` : le theme systeme doit basculer
 * quand l'OS bascule, pas au prochain rechargement.
 */
const systeme = window.matchMedia('(prefers-color-scheme: dark)')
const systemeSombre = ref(systeme.matches)
systeme.addEventListener('change', (e) => (systemeSombre.value = e.matches))

/** Ce qui est reellement affiche, `systeme` resolu. */
export const eclairage = computed<Eclairage>(() =>
  resoudreTheme(courante.value, systemeSombre.value)
)

/**
 * Fonds du rendu, par eclairage.
 *
 * Miroir des couleurs de `styles.css` (`--paper`, `--surface`, et la carte au
 * repos de `TimelineTrack` qui est `--ink` a 4,5 % sur `--paper`). Le SVG du
 * bot n'accepte que des hex littéraux — aucune `var(--...)` ne doit y entrer
 * (`src/ui/capture.ts`) — donc ses fonds sont lus ici et pas dans le CSS.
 * Les deux listes doivent donc rester d'accord ; elles changent ensemble.
 */
export const FONDS = {
  clair: { page: '#f9f9f9', vignette: '#f2f2f2', vignetteActive: '#ffffff' },
  sombre: { page: '#1e222b', vignette: '#272b34', vignetteActive: '#2a2f3a' }
} as const

/** Fonds de l'eclairage courant. */
export const fond = computed(() => FONDS[eclairage.value])

/**
 * L'attribut `data-theme` du document pilote les jetons de couleurs de
 * `styles.css`. L'amorce de `index.html` l'a deja pose avant la premiere
 * peinture ; ici il est tenu a jour, y compris quand l'OS bascule.
 */
watchEffect(() => {
  document.documentElement.dataset.theme = eclairage.value
})
