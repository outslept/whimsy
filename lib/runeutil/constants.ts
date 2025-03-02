/**
 * Set of Unicode code points representing whitespace characters.
 * Includes standard spaces, tabs, line breaks, and other various specialized spaces.
 */
const WHITESPACE_CODE_POINTS = new Set([
  0x0009, // Tab
  0x000A, // Line feed
  0x000B, // Vertical tab
  0x000C, // Form feed
  0x000D, // Carriage return
  0x0020, // Space
  0x00A0, // No-break space
  0x1680, // Ogham space mark
  0x2000, // En quad
  0x2001, // Em quad
  0x2002, // En space
  0x2003, // Em space
  0x2004, // Three-per-em space
  0x2005, // Four-per-em space
  0x2006, // Six-per-em space
  0x2007, // Figure space
  0x2008, // Punctuation space
  0x2009, // Thin space
  0x200A, // Hair space
  0x2028, // Line separator
  0x2029, // Paragraph separator
  0x202F, // Narrow no-break space
  0x205F, // Medium mathematical space
  0x3000, // Ideographic space
])

/**
 * Set of Unicode code points representing zero-width characters.
 * These characters have no visual width but affect text processing.
 */
const ZERO_WIDTH_CODE_POINTS = new Set([
  0x200B, // Zero width space
  0x200C, // Zero width non-joiner
  0x200D, // Zero width joiner
  0xFEFF, // Zero width no-break space (BOM)
])

/**
 * Set of Unicode code points for directional formatting characters.
 * These control text direction in bidirectional text.
 */
const DIRECTIONAL_CODE_POINTS = new Set([
  0x200E, // Left-to-right mark
  0x200F, // Right-to-left mark
  0x202A, // Left-to-right embedding
  0x202B, // Right-to-left embedding
  0x202C, // Pop directional formatting
  0x202D, // Left-to-right override
  0x202E, // Right-to-left override
  0x2066, // Left-to-right isolate
  0x2067, // Right-to-left isolate
  0x2068, // First strong isolate
  0x2069, // Pop directional isolate
])

/**
 * Set of Unicode code points for formatting characters.
 * These affect text presentation without having visual width themselves.
 */
const FORMATTING_CODE_POINTS = new Set([
  0x061C, // Arabic letter mark
  0x2060, // Word joiner
  0x2061, // Function application
  0x2062, // Invisible times
  0x2063, // Invisible separator
  0x2064, // Invisible plus
  0x2066, // Left-to-right isolate
  0x2067, // Right-to-left isolate
  0x2068, // First strong isolate
  0x2069, // Pop directional isolate
])

/**
 * Ranges of Unicode code points for emoji characters.
 * Each range is represented as [startCodePoint, endCodePoint].
 */
const EMOJI_RANGES = [
  [0x1F300, 0x1F64F], // Miscellaneous Symbols and Pictographs
  [0x1F680, 0x1F6FF], // Transport and Map Symbols
  [0x1F700, 0x1F77F], // Alchemical Symbols
  [0x1F780, 0x1F7FF], // Geometric Shapes Extended
  [0x1F800, 0x1F8FF], // Supplemental Arrows-C
  [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
  [0x1FA00, 0x1FA6F], // Chess Symbols
  [0x1FA70, 0x1FAFF], // Symbols and Pictographs Extended-A
]

/**
 * Ranges of Unicode code points for wide characters.
 * These characters typically occupy twice the width of Latin characters.
 * Includes CJK ideographs, Hangul, and other East Asian scripts.
 */
const WIDE_CHAR_RANGES = [
  [0x1100, 0x115F], // Hangul Jamo
  [0x2329, 0x232A], // Angle Brackets
  [0x2E80, 0x2E99], // CJK Radicals Supplement
  [0x2E9B, 0x2EF3], // CJK Radicals Supplement
  [0x2F00, 0x2FD5], // Kangxi Radicals
  [0x2FF0, 0x2FFB], // Ideographic Description Characters
  [0x3000, 0x303E], // CJK Symbols and Punctuation
  [0x3041, 0x3096], // Hiragana
  [0x3099, 0x30FF], // Hiragana, Katakana
  [0x3105, 0x312F], // Bopomofo
  [0x3131, 0x318E], // Hangul Compatibility Jamo
  [0x3190, 0x31E3], // Kanbun, Bopomofo Extended, CJK Strokes
  [0x31F0, 0x321E], // Katakana Phonetic Extensions, Enclosed CJK Letters and Months
  [0x3220, 0x3247], // Enclosed CJK Letters and Months
  [0x3250, 0x4DBF], // Enclosed CJK Letters and Months, CJK Unified Ideographs Extension A, Yijing Hexagram Symbols
  [0x4E00, 0xA4C6], // CJK Unified Ideographs
  [0xA960, 0xA97C], // Hangul Jamo Extended-A
  [0xAC00, 0xD7A3], // Hangul Syllables
  [0xF900, 0xFAFF], // CJK Compatibility Ideographs
  [0xFF01, 0xFF60], // Fullwidth ASCII Variants
  [0xFFE0, 0xFFE6], // Fullwidth Symbols
]

/**
 * Ranges of Unicode code points for full-width characters.
 * These are primarily full-width forms of Latin characters and symbols.
 */
const FULL_WIDTH_RANGES = [
  [0xFF01, 0xFF60], // Fullwidth ASCII Variants
  [0xFFE0, 0xFFE6], // Fullwidth Symbols
]

/**
 * Ranges of Unicode code points for characters with ambiguous width.
 * These may be rendered as single or double-width depending on context and font.
 */
const AMBIGUOUS_WIDTH_RANGES = [
  [0x00A1, 0x00A1], // Inverted Exclamation Mark
  [0x00A4, 0x00A4], // Currency Sign
  [0x00A7, 0x00A8], // Section Sign, Diaeresis
  [0x00AA, 0x00AA], // Feminine Ordinal Indicator
  [0x00AD, 0x00AE], // Soft Hyphen, Registered Sign
  [0x00B0, 0x00B4], // Degree Sign, Acute Accent
  [0x00B6, 0x00BA], // Pilcrow Sign, Masculine Ordinal Indicator
  [0x00BC, 0x00BF], // Vulgar Fractions, Inverted Question Mark
  [0x00C6, 0x00C6], // Latin Capital Letter AE
  [0x00D0, 0x00D0], // Latin Capital Letter Eth
  [0x00D7, 0x00D8], // Multiplication Sign, Latin Capital Letter O with Stroke
  [0x00DE, 0x00E1], // Latin Capital Letter Thorn, Latin Small Letter A with Acute
  [0x00E6, 0x00E6], // Latin Small Letter AE
  [0x00E8, 0x00EA], // Latin Small Letter E with Grave, E with Acute, E with Circumflex
  [0x00EC, 0x00ED], // Latin Small Letter I with Grave, I with Acute
  [0x00F0, 0x00F0], // Latin Small Letter Eth
  [0x00F2, 0x00F3], // Latin Small Letter O with Grave, O with Acute
  [0x00F7, 0x00FA], // Division Sign, Latin Small Letter U with Grave
  [0x00FC, 0x00FC], // Latin Small Letter U with Diaeresis
  [0x00FE, 0x00FE], // Latin Small Letter Thorn
  [0x0101, 0x0101], // Latin Small Letter A with Macron
  [0x0111, 0x0111], // Latin Small Letter D with Stroke
  [0x0113, 0x0113], // Latin Small Letter E with Macron
  [0x011B, 0x011B], // Latin Small Letter E with Caron
  [0x0126, 0x0127], // Latin Capital and Small Letter H with Stroke
  [0x012B, 0x012B], // Latin Small Letter I with Macron
  [0x0131, 0x0133], // Latin Small Letter Dotless I, Latin Small Ligature IJ
  [0x0138, 0x0138], // Latin Small Letter Kra
  [0x013F, 0x0142], // Latin Capital and Small Letter L with Middle Dot, Latin Capital and Small Letter L with Stroke
  [0x0144, 0x0144], // Latin Small Letter N with Acute
  [0x0148, 0x014B], // Latin Small Letter N with Caron, Eng
  [0x014D, 0x014D], // Latin Small Letter O with Macron
  [0x0152, 0x0153], // Latin Capital and Small Ligature OE
  [0x0166, 0x0167], // Latin Capital and Small Letter T with Stroke
  [0x016B, 0x016B], // Latin Small Letter U with Macron
  [0x01CE, 0x01CE], // Latin Small Letter A with Caron
  [0x01D0, 0x01D0], // Latin Small Letter I with Caron
  [0x01D2, 0x01D2], // Latin Small Letter O with Caron
  [0x01D4, 0x01D4], // Latin Small Letter U with Caron
  [0x01D6, 0x01D6], // Latin Small Letter U with Diaeresis and Macron
  [0x01D8, 0x01D8], // Latin Small Letter U with Diaeresis and Acute
  [0x01DA, 0x01DA], // Latin Small Letter U with Diaeresis and Caron
  [0x01DC, 0x01DC], // Latin Small Letter U with Diaeresis and Grave
  [0x0251, 0x0251], // Latin Small Letter Alpha
  [0x0261, 0x0261], // Latin Small Letter Script G
  [0x02C4, 0x02C4], // Modifier Letter Up Arrowhead
  [0x02C7, 0x02C7], // Caron
  [0x02C9, 0x02CB], // Modifier Letter Macron, Acute, Grave
  [0x02CD, 0x02CD], // Modifier Letter Low Macron
  [0x02D0, 0x02D0], // Modifier Letter Triangular Colon
  [0x02D8, 0x02DB], // Breve, Dot Above, Ring Above, Ogonek
  [0x02DD, 0x02DD], // Double Acute Accent
  [0x2015, 0x2016], // Horizontal Bar, Double Vertical Line
  [0x2018, 0x2019], // Left and Right Single Quotation Mark
  [0x201C, 0x201D], // Left and Right Double Quotation Mark
  [0x2020, 0x2022], // Dagger, Double Dagger, Bullet
  [0x2024, 0x2027], // One Dot Leader, Two Dot Leader, Hyphenation Point
  [0x2030, 0x2030], // Per Mille Sign
  [0x2032, 0x2033], // Prime, Double Prime
  [0x2035, 0x2035], // Reversed Prime
  [0x203B, 0x203B], // Reference Mark
  [0x203E, 0x203E], // Overline
  [0x2074, 0x2074], // Superscript Four
  [0x207F, 0x207F], // Superscript Latin Small Letter N
  [0x2081, 0x2084], // Subscript One to Four
  [0x20AC, 0x20AC], // Euro Sign
  [0x2103, 0x2103], // Degree Celsius
  [0x2105, 0x2105], // Care Of
  [0x2109, 0x2109], // Degree Fahrenheit
  [0x2113, 0x2113], // Script Small L
  [0x2116, 0x2116], // Numero Sign
  [0x2121, 0x2122], // Telephone Sign, Trade Mark Sign
  [0x2126, 0x2126], // Ohm Sign
  [0x212B, 0x212B], // Angstrom Sign
  [0x2153, 0x2154], // Vulgar Fraction One Third, Two Thirds
  [0x215B, 0x215E], // Vulgar Fraction One Eighth, Three Eighths, Five Eighths, Seven Eighths
  [0x2160, 0x216B], // Roman Numerals I to XII
  [0x2170, 0x2179], // Small Roman Numerals I to X
  [0x2189, 0x2189], // Vulgar Fraction Zero Thirds
  [0x2190, 0x2199], // Arrows
  [0x21B8, 0x21B9], // North West Arrow to Long Bar, Left Right Arrow to Long Bar
  [0x21D2, 0x21D2], // Rightwards Double Arrow
  [0x21D4, 0x21D4], // Left Right Double Arrow
  [0x21E7, 0x21E7], // Upwards White Arrow
  [0x2200, 0x2200], // For All
  [0x2202, 0x2203], // Partial Differential, There Exists
  [0x2207, 0x2208], // Nabla, Element Of
  [0x220B, 0x220B], // Contains As Member
  [0x220F, 0x220F], // N-Ary Product
  [0x2211, 0x2211], // N-Ary Summation
  [0x2215, 0x2215], // Division Slash
  [0x221A, 0x221A], // Square Root
  [0x221D, 0x2220], // Proportional To, Angle
  [0x2223, 0x2223], // Divides
  [0x2225, 0x2225], // Parallel To
  [0x2227, 0x222C], // Logical And, Logical Or, Intersection, Union, Integral, Double Integral
  [0x222E, 0x222E], // Contour Integral
  [0x2234, 0x2237], // Therefore, Because, Ratio, Proportion
  [0x223C, 0x223D], // Tilde Operator, Reversed Tilde
  [0x2248, 0x2248], // Almost Equal To
  [0x224C, 0x224C], // All Equal To
  [0x2252, 0x2252], // Approximately Equal To or The Image Of
  [0x2260, 0x2261], // Not Equal To, Identical To
  [0x2264, 0x2267], // Less-Than Or Equal To, Greater
  [0x226A, 0x226B], // Much Less-Than, Much Greater-Than
  [0x226E, 0x226F], // Not Less-Than, Not Greater-Than
  [0x2282, 0x2283], // Subset Of, Superset Of
  [0x2286, 0x2287], // Subset Of Or Equal To, Superset Of Or Equal To
  [0x2295, 0x2295], // Circled Plus
  [0x2299, 0x2299], // Circled Dot Operator
  [0x22A5, 0x22A5], // Up Tack
  [0x22BF, 0x22BF], // Right Triangle
  [0x2312, 0x2312], // Arc
  [0x2460, 0x24E9], // Circled Digits and Letters
  [0x24EB, 0x254B], // Negative Circled Numbers
  [0x2550, 0x2573], // Box Drawing Characters
  [0x2580, 0x258F], // Block Elements
  [0x2592, 0x2595], // Shade Characters
  [0x25A0, 0x25A1], // Black Square, White Square
  [0x25A3, 0x25A9], // Various Squares
  [0x25B2, 0x25B3], // Black Up-Pointing Triangle, White Up-Pointing Triangle
  [0x25B6, 0x25B7], // Black Right-Pointing Triangle, White Right-Pointing Triangle
  [0x25BC, 0x25BD], // Black Down-Pointing Triangle, White Down-Pointing Triangle
  [0x25C0, 0x25C1], // Black Left-Pointing Triangle, White Left-Pointing Triangle
  [0x25C6, 0x25C8], // Black Diamond, White Diamond, Lozenge
  [0x25CB, 0x25CB], // White Circle
  [0x25CE, 0x25D1], // Bullseye, Circle With Upper/Lower/Left Half Black
  [0x25E2, 0x25E5], // Black Lower Right/Left/Upper Left/Right Triangle
  [0x25EF, 0x25EF], // Large Circle
  [0x2605, 0x2606], // Black Star, White Star
  [0x2609, 0x2609], // Sun
  [0x260E, 0x260F], // Black Telephone, White Telephone
  [0x2614, 0x2615], // Umbrella With Rain Drops, Hot Beverage
  [0x261C, 0x261C], // White Left Pointing Index
  [0x261E, 0x261E], // White Right Pointing Index
  [0x2640, 0x2640], // Female Sign
  [0x2642, 0x2642], // Male Sign
  [0x2660, 0x2661], // Black Spade Suit, White Heart Suit
  [0x2663, 0x2665], // Black Club Suit, White Diamond Suit, Black Heart Suit
  [0x2667, 0x266A], // White Club Suit, Music Notes
  [0x266C, 0x266D], // Beamed Sixteenth Notes, Music Flat Sign
  [0x266F, 0x266F], // Music Sharp Sign
  [0x269E, 0x269F], // Three Lines Converging Right, Three Lines Converging Left
  [0x26BF, 0x26BF], // Squared Key
  [0x26C6, 0x26CD], // Rain, Snow, Umbrella, Hot Springs, Gear
  [0x26CF, 0x26D3], // Pick, Rescue Worker's Helmet, Chains, Anchor
  [0x26D5, 0x26E1], // Alternate One-Way Left Way Traffic, Factory, Fountain
  [0x26E3, 0x26E3], // Heavy Circle With Stroke And Two Dots Above
  [0x26E8, 0x26E9], // Black Cross On Shield, Shinto Shrine
  [0x26EB, 0x26F1], // Castle, Map Symbol For Lighthouse, Gear Without Hub
  [0x26F4, 0x26F4], // Ferry
  [0x26F6, 0x26F9], // Square Four Corners, Diamond With Left Half Black
  [0x26FB, 0x26FC], // Japanese Bank Symbol, Headstone Graveyard Symbol
  [0x26FE, 0x26FF], // Cup On Black Square, White Flag With Horizontal Middle Black Stripe
  [0x273D, 0x273D], // Heavy Teardrop-Spoked Asterisk
  [0x2776, 0x277F], // Dingbat Negative Circled Digits
  [0x2B56, 0x2B59], // Heavy Oval With Oval Inside, Heavy Circle With Circle Inside
  [0x3248, 0x324F], // Circled Number Ten On Black Square, Circled Number Twenty On Black Square
  [0xE000, 0xF8FF], // Private Use Area
  [0xFE00, 0xFE0F], // Variation Selectors
  [0xFFFD, 0xFFFD], // Replacement Character
]

export {
  AMBIGUOUS_WIDTH_RANGES,
  DIRECTIONAL_CODE_POINTS,
  EMOJI_RANGES,
  FORMATTING_CODE_POINTS,
  FULL_WIDTH_RANGES,
  WHITESPACE_CODE_POINTS,
  WIDE_CHAR_RANGES,
  ZERO_WIDTH_CODE_POINTS,
}
