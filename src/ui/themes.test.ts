import { describe, expect, it } from 'vitest'
import { choisirTheme, estTheme, resoudreTheme, THEMES, THEME_PAR_DEFAUT } from './themes'

describe('choix du theme au demarrage', () => {
  it('respecte le choix memorise', () => {
    expect(choisirTheme('sombre')).toBe('sombre')
    expect(choisirTheme('clair')).toBe('clair')
    expect(choisirTheme('systeme')).toBe('systeme')
  })

  it('ignore un stockage bricole a la main', () => {
    // comme pour la langue : le localStorage est modifiable, on ne lui fait pas
    // confiance — une valeur inconnue ne doit pas figer un theme pour toujours
    expect(choisirTheme('dark')).toBe(THEME_PAR_DEFAUT)
    expect(choisirTheme('')).toBe(THEME_PAR_DEFAUT)
    expect(choisirTheme(null)).toBe(THEME_PAR_DEFAUT)
  })

  it('reconnait exactement les trois themes proposes', () => {
    expect(THEMES).toEqual(['systeme', 'clair', 'sombre'])
    for (const t of THEMES) expect(estTheme(t), t).toBe(true)
    expect(estTheme('nuit')).toBe(false)
  })
})

describe('resolution de systeme', () => {
  it('suit la preference du systeme tant que rien n est choisi', () => {
    expect(resoudreTheme('systeme', true)).toBe('sombre')
    expect(resoudreTheme('systeme', false)).toBe('clair')
  })

  it('un choix explicite ignore le systeme dans les deux sens', () => {
    expect(resoudreTheme('sombre', false)).toBe('sombre')
    expect(resoudreTheme('clair', true)).toBe('clair')
  })
})
