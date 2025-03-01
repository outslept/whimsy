import { stripVTControlCharacters } from 'node:util'

export function visibleLength(text: string): number {
  return stripVTControlCharacters(text).length
}

export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  const stripped = stripVTControlCharacters(text)
  if (stripped.length <= maxLength) {
    return text
  }

  let result = ''
  let visibleCount = 0
  let inAnsi = false
  let ansiBuffer = ''

  for (const char of text) {
    if (inAnsi) {
      ansiBuffer += char
      if (char === 'm') {
        inAnsi = false
        result += ansiBuffer
        ansiBuffer = ''
      }
      continue
    }

    if (char === String.fromCharCode(27)) {
      inAnsi = true
      ansiBuffer = char
      continue
    }

    if (visibleCount < maxLength - suffix.length) {
      result += char
      visibleCount++
    }
    else {
      break
    }
  }

  return result + suffix
}
