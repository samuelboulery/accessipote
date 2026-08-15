/** Extension Tailwind à fusionner dans outil-checklist-rgaa/tailwind.config.js
 *
 *  Remplace l'échelle Tailwind par défaut sur les axes que le design pilote
 *  (couleurs, tailles de police, espacement, rayons) afin qu'une classe hors
 *  système ne compile pas. `text-sm`, `rounded-lg`, `p-5`, `text-gray-600`
 *  n'existent plus : c'est volontaire, ça rend les dérives visibles à la
 *  compilation.
 *
 *  darkMode: 'class' — l'app bascule déjà via une classe sur <html>.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},

    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      bg:        'var(--a-bg)',
      surface:   'var(--a-surface)',
      sunk:      'var(--a-surface-sunk)',
      border:    'var(--a-border)',
      separator: 'var(--a-separator)',
      track:     'var(--a-track)',
      dashed:    'var(--a-dashed)',

      ink: {
        DEFAULT: 'var(--a-ink)',
        muted:   'var(--a-ink-muted)',
      },

      ok: {
        DEFAULT: 'var(--a-ok)',
        bg:      'var(--a-ok-bg)',
        fg:      'var(--a-ok-fg)',
        card:    'var(--a-ok-card-bg)',
        line:    'var(--a-ok-card-bd)',
      },
      ko: {
        DEFAULT: 'var(--a-ko)',
        bg:      'var(--a-ko-bg)',
        fg:      'var(--a-ko-fg)',
        card:    'var(--a-ko-card-bg)',
        line:    'var(--a-ko-card-bd)',
      },
      na: {
        bg:  'var(--a-na-bg)',
        fg:  'var(--a-na-fg)',
        bar: 'var(--a-na-bar)',
      },
      todo: {
        bg: 'var(--a-todo-bg)',
        fg: 'var(--a-todo-fg)',
      },
    },

    // [taille, { lineHeight, letterSpacing }] — l'approche et l'interligne
    // sont attachés au pas : impossible d'utiliser une taille sans eux.
    //
    // En rem et non en px : à racine 16px les valeurs rendues sont celles du
    // handoff (12, 13, 14, 16, 20, 24, 32, 42), mais le zoom texte du
    // navigateur agit dessus — sans quoi RGAA 10.4 n'est pas tenu.
    fontSize: {
      meta:     ['0.75rem', { lineHeight: '1.5', letterSpacing: '0'        }],
      dense:    ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0'        }],
      body:     ['0.875rem', { lineHeight: '1.5', letterSpacing: '0'        }],
      lead:     ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em'  }],
      criteria: ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em'  }],
      section:  ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em'  }],
      screen:   ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em'  }],
      display:  ['2.625rem', { lineHeight: '1.1', letterSpacing: '-0.03em'  }],
    },

    fontFamily: {
      sans: ["'Instrument Sans'", 'system-ui', 'sans-serif'],
      mono: ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
    },

    fontWeight: {
      normal:   '400',
      medium:   '500',
      semibold: '600',
    },

    spacing: {
      0:  '0px',
      1:  '4px',
      2:  '8px',
      3:  '12px',
      4:  '16px',
      6:  '24px',
      8:  '32px',
      14: '56px',
      // dimensions de contrôle
      chip:  '32px',
      ctrl:  '40px',
      touch: '44px',
      prim:  '48px',
      two:   '64px',
      // icônes
      'icon-sm': '12px',
      'icon-md': '16px',
      'icon-lg': '20px',
    },

    borderRadius: {
      none: '0',
      box:   'var(--a-radius-box)',
      ctrl:  'var(--a-radius-ctrl)',
      card:  'var(--a-radius-card)',
      panel: 'var(--a-radius-panel)',
      frame: 'var(--a-radius-frame)',
      pill:  'var(--a-radius-pill)',
    },

    borderWidth: { DEFAULT: '1px', 0: '0', 1: '1px', 1.5: '1.5px', 2: '2px' },

    boxShadow: {
      none:  'none',
      panel: '0 1px 2px rgb(0 0 0 / 0.08), 0 12px 30px -18px rgb(0 0 0 / 0.30)',
      focus: 'var(--a-focus-ring)',
    },

    transitionDuration: { press: '100ms', DEFAULT: '200ms' },
  },
};
