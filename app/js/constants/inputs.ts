/*
 * An array of input code constants.
 */
import type { Language } from './languages'

/** input class definition */
export class Input {
  readonly names: Record<Language, string>
  readonly value: number

  constructor (name: string, value: number) {
    this.names = {
      BASIC: name.toUpperCase(),
      C: name,
      Java: name,
      Pascal: name,
      Python: name,
      TypeScript: name
    }
    this.value = value
  }
}

/** array of input constants */
export const inputs: Input[] = [
  new Input('?kshift', -10),
  new Input('?key', -9),
  new Input('?mousey', -8),
  new Input('?mousex', -7),
  new Input('?clicky', -6),
  new Input('?clickx', -5),
  new Input('?click', -4),
  new Input('?mmouse', -3),
  new Input('?rmouse', -2),
  new Input('?lmouse', -1),
  new Input('\\keybuffer', 0),
  new Input('\\backspace', 8),
  new Input('\\tab', 9),
  new Input('\\enter', 13),
  new Input('\\return', 13),
  new Input('\\shift', 16),
  new Input('\\ctrl', 17),
  new Input('\\alt', 18),
  new Input('\\pause', 19),
  new Input('\\capslock', 20),
  new Input('\\escape', 27),
  new Input('\\space', 32),
  new Input('\\pgup', 33),
  new Input('\\pgdn', 34),
  new Input('\\end', 35),
  new Input('\\home', 36),
  new Input('\\left', 37),
  new Input('\\up', 38),
  new Input('\\right', 39),
  new Input('\\down', 40),
  new Input('\\insert', 45),
  new Input('\\delete', 46),
  new Input('\\0', 48),
  new Input('\\1', 49),
  new Input('\\2', 50),
  new Input('\\3', 51),
  new Input('\\4', 52),
  new Input('\\5', 53),
  new Input('\\6', 54),
  new Input('\\7', 55),
  new Input('\\8', 56),
  new Input('\\9', 57),
  new Input('\\a', 65),
  new Input('\\b', 66),
  new Input('\\c', 67),
  new Input('\\d', 68),
  new Input('\\e', 69),
  new Input('\\f', 70),
  new Input('\\g', 71),
  new Input('\\h', 72),
  new Input('\\i', 73),
  new Input('\\j', 74),
  new Input('\\k', 75),
  new Input('\\l', 76),
  new Input('\\m', 77),
  new Input('\\n', 78),
  new Input('\\o', 79),
  new Input('\\p', 80),
  new Input('\\q', 81),
  new Input('\\r', 82),
  new Input('\\s', 83),
  new Input('\\t', 84),
  new Input('\\u', 85),
  new Input('\\v', 86),
  new Input('\\w', 87),
  new Input('\\x', 88),
  new Input('\\y', 89),
  new Input('\\z', 90),
  new Input('\\lwin', 91),
  new Input('\\rwin', 92),
  new Input('\\#0', 96),
  new Input('\\#1', 97),
  new Input('\\#2', 98),
  new Input('\\#3', 99),
  new Input('\\#4', 100),
  new Input('\\#5', 101),
  new Input('\\#6', 102),
  new Input('\\#7', 103),
  new Input('\\#8', 104),
  new Input('\\#9', 105),
  new Input('\\multiply', 106),
  new Input('\\add', 107),
  new Input('\\subtract', 109),
  new Input('\\decimal', 110),
  new Input('\\divide', 111),
  new Input('\\f1', 112),
  new Input('\\f2', 113),
  new Input('\\f3', 114),
  new Input('\\f4', 115),
  new Input('\\f5', 116),
  new Input('\\f6', 117),
  new Input('\\f7', 118),
  new Input('\\f8', 119),
  new Input('\\f9', 120),
  new Input('\\f10', 121),
  new Input('\\f11', 122),
  new Input('\\f12', 123),
  new Input('\\numlock', 144),
  new Input('\\scrolllock', 145),
  new Input('\\semicolon', 186),
  new Input('\\equals', 187),
  new Input('\\comma', 188),
  new Input('\\dash', 189),
  new Input('\\fullstop', 190),
  new Input('\\forwardslash', 191),
  new Input('\\singlequote', 192),
  new Input('\\openbracket', 219),
  new Input('\\backslash', 220),
  new Input('\\closebracket', 221),
  new Input('\\hash', 222),
  new Input('\\backtick', 223)
]
