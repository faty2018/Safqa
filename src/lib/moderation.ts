const MOTS_CLES_SUSPECTS = [
  "whatsapp",
  "whats app",
  "telegram",
  "numero",
  "numéro",
  "appelle-moi",
  "appelle moi",
  "contacte-moi",
  "contacte moi",
  "en dehors de la plateforme",
  "hors plateforme",
  "hors-plateforme",
  "gmail.com",
  "hotmail.com",
  "yahoo.com",
  "outlook.com",
];

// Numéro marocain (fixe/mobile) sous plusieurs formats : 06XXXXXXXX, +2126XXXXXXXX, 00212...
const REGEX_TELEPHONE = /(\+212|0)([ .-]?\d){9}/;

// Email générique
const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export function contientContactSuspect(texte: string): boolean {
  const texteNormalise = texte.toLowerCase();

  if (REGEX_TELEPHONE.test(texteNormalise)) return true;
  if (REGEX_EMAIL.test(texteNormalise)) return true;

  return MOTS_CLES_SUSPECTS.some((mot) => texteNormalise.includes(mot));
}