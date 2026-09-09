// Stick-figure line art for a handful of well-known constellations/asterisms,
// as pairs of star names (must match `name` in stars.ts). Deliberately only
// includes ones where the catalog has enough of the traditional figure's
// stars to look right — most constellations in the wider catalog have only
// one or two entries, which isn't enough for a recognizable shape.

export interface ConstellationFigure {
  name: string;
  segments: [string, string][];
}

export const CONSTELLATION_FIGURES: ConstellationFigure[] = [
  {
    name: "Orion",
    segments: [
      ["Betelgeuse", "Bellatrix"],
      ["Betelgeuse", "Alnitak"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Mintaka", "Rigel"],
    ],
  },
  {
    name: "Big Dipper",
    segments: [
      ["Alkaid", "Mizar"],
      ["Mizar", "Alioth"],
      ["Alioth", "Megrez"],
      ["Megrez", "Dubhe"],
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
    ],
  },
  {
    name: "Southern Cross",
    segments: [
      ["Acrux", "Gacrux"],
      ["Imai", "Mimosa"],
    ],
  },
  {
    name: "Cassiopeia",
    segments: [
      ["Caph", "Schedar"],
      ["Schedar", "Navi"],
      ["Navi", "Ruchbah"],
      ["Ruchbah", "Segin"],
    ],
  },
  {
    name: "Leo",
    segments: [
      ["Regulus", "Algieba"],
      ["Algieba", "Denebola"],
    ],
  },
];
