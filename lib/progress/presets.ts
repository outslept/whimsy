export const ProgressThemes = {
  classic: {
    width: 20,
    complete: '#',
    incomplete: '-',
    head: '',
    template: '[{bar}] {percent}',
    style: 'block',
    percentFormat: 'percent',
  },

  unicode: {
    width: 25,
    complete: '█',
    incomplete: '░',
    head: '',
    template: '{bar} {percent}',
    style: 'block',
    percentFormat: 'percent',
  },

  smooth: {
    width: 25,
    complete: '█',
    incomplete: ' ',
    head: '',
    template: '{bar} {percent}',
    style: 'smooth',
    percentFormat: 'percent',
  },

  gradient: {
    width: 25,
    complete: '▓',
    incomplete: '▒',
    head: '',
    template: '{bar} {percent}',
    style: 'gradient',
    completeColor: 'green',
    incompleteColor: 'gray',
    percentColor: 'cyan',
    percentFormat: 'percent',
  },

  minimal: {
    width: 0,
    template: '{percent}',
    style: 'text',
    percentFormat: 'percent',
  },

  detailed: {
    width: 20,
    complete: '=',
    incomplete: ' ',
    head: '>',
    template: '[{bar}] {percent} | {elapsed}<{eta}',
    style: 'block',
    percentFormat: 'percent',
    showElapsed: true,
    showEta: true,
    timeFormat: 'compact',
  },

  braille: {
    width: 20,
    complete: '⣿',
    incomplete: '⠀',
    head: '',
    template: '{bar} {percent}',
    style: 'braille',
    percentFormat: 'percent',
  },

  spinner: {
    width: 1,
    template: '{bar} Processing...',
    style: 'custom',
    animate: true,
    animationFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
} as const
