/**
 * Apparence proposee et regle de choix. Volontairement sans DOM ni Vue : le
 * navigateur ne rentre que par les arguments, donc la regle se teste sans
 * simuler `matchMedia` ni `localStorage`. Meme decoupage que `i18n/langues.ts`.
 */

/**
 * `systeme` suit la preference du navigateur ; `clair` et `sombre` la forcent.
 * La liste sert d'identifiants de stockage et de cles de traduction
 * (`settings.theme_systeme`...), d'ou des identifiants en francais comme
 * partout ailleurs dans le projet.
 */
export const THEMES = ['systeme', 'clair', 'sombre'] as const

export type Theme = (typeof THEMES)[number]

/** Ce qui est reellement affiche : `systeme` se resout en l'un des deux. */
export type Eclairage = 'clair' | 'sombre'

export const THEME_PAR_DEFAUT: Theme = 'systeme'

export function estTheme(valeur: string | null | undefined): valeur is Theme {
  return THEMES.some((t) => t === valeur)
}

/**
 * Apparence a appliquer au demarrage.
 *
 * Un choix explicite gagne toujours, comme pour la langue ; un stockage bricole
 * a la main retombe sur `systeme` plutot que de figer un theme pour toujours.
 */
export function choisirTheme(memorise: string | null): Theme {
  return estTheme(memorise) ? memorise : THEME_PAR_DEFAUT
}

/**
 * Resolution d'un theme en eclairage effectif.
 *
 * `systemeSombre` est la preference du navigateur, RELUE a chaque changement :
 * quelqu'un qui travaille en theme systeme voit le site basculer quand son OS
 * bascule, c'est tout l'interet du choix « Système ».
 */
export function resoudreTheme(theme: Theme, systemeSombre: boolean): Eclairage {
  return theme === 'systeme' ? (systemeSombre ? 'sombre' : 'clair') : theme
}
