export type Category = {
  label: string;
  emoji: string;
  tags: string[];
  color: string;
};

export const CATEGORIES: Record<string, Category> = {
  all:        { label: "Tout", emoji: "✨", tags: [], color: "#c8907a" },
  natural:    { label: "Naturel", emoji: "🌿", tags: ["naturel", "barefoot", "simple"], color: "#7a9e7e" },
  vernis:     { label: "Vernis", emoji: "💅", tags: ["vernis", "nail", "couleur"], color: "#e87a8a" },
  sandales:   { label: "Sandales", emoji: "👡", tags: ["sandales", "ouvert", "été"], color: "#d4a96a" },
  talons:     { label: "Talons", emoji: "👠", tags: ["talons", "heels", "stiletto"], color: "#9d6552" },
  sneakers:   { label: "Sneakers", emoji: "👟", tags: ["sneakers", "sport", "casual"], color: "#6a7a9d" },
  chaussettes:{ label: "Chaussettes", emoji: "🧦", tags: ["chaussettes", "socks", "blanc"], color: "#9d8fa0" },
  bas:        { label: "Bas", emoji: "🕊️", tags: ["bas", "collants", "nylon"], color: "#c4a882" },
  tongs:      { label: "Tongs", emoji: "🩴", tags: ["tongs", "flip-flop", "plage"], color: "#e8c46a" },
  plage:      { label: "Plage", emoji: "🏖️", tags: ["plage", "sable", "mer"], color: "#6ab4e8" },
  spa:        { label: "Spa", emoji: "🛁", tags: ["spa", "soin", "pédicure"], color: "#a882c4" },
  sport:      { label: "Sport", emoji: "🏃", tags: ["sport", "fitness", "running"], color: "#6a9de8" },
  luxe:       { label: "Luxe", emoji: "💎", tags: ["luxe", "premium", "bijoux"], color: "#d4af37" },
  greek:      { label: "Pied grec", emoji: "🏛️", tags: ["pied-grec", "orteils-longs"], color: "#9dc4a8" },
  roman:      { label: "Pied romain", emoji: "⚔️", tags: ["pied-romain", "plat"], color: "#c4a89d" },
  bnw:        { label: "Noir & Blanc", emoji: "🎞️", tags: ["nb", "monochrome", "artistique"], color: "#888" },
  jewel:      { label: "Bijoux", emoji: "💍", tags: ["bijoux", "bracelet-cheville", "anneau"], color: "#c4af6a" },
  outdoor:    { label: "Extérieur", emoji: "🌳", tags: ["extérieur", "nature", "rues"], color: "#7a9e7e" },
  studio:     { label: "Studio", emoji: "📸", tags: ["studio", "pro", "éclairage"], color: "#9d9d9d" },
  amateur:    { label: "Amateur", emoji: "📱", tags: ["amateur", "selfie", "quotidien"], color: "#c8907a" },
};

export const ALL_TAGS = [
  "#vernisrouge", "#vernisrose", "#vernisblanc", "#vernisnoir", "#vernisnude",
  "#piedgrec", "#piedromain", "#piedégyptien", "#piednaturel",
  "#sandales", "#talonshauts", "#sneakers", "#tongs", "#espadrilles",
  "#chaussettesblanches", "#bascollants", "#nylonsheer",
  "#plage", "#piscine", "#spa", "#pédicure",
  "#bijoux", "#braceletdecheville", "#anneauorteil",
  "#sport", "#yoga", "#running",
  "#luxe", "#designer", "#louboutin",
  "#noireblanche", "#artistique", "#studio",
  "#amateur", "#quotidien", "#selfie",
  "#extérieur", "#parisienne", "#côtedazur",
  "#petits", "#grands", "#moyens",
  "#fin", "#large", "#arqué",
];
