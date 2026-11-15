/**
 * A course's maturity, as readers see it. Inside the project a course moves
 * through the nine rounds in "Build in iterations" (docs/building-a-course.md);
 * readers get one of five levels, each describing only what every module of
 * the course has been through.
 */
export type Maturity = {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  meaning: string;
};

export const MATURITY_LEVELS = 5;

// The fewest finished rounds each level needs, highest level first.
const LEVELS: { min: number; m: Maturity }[] = [
  {
    min: 9,
    m: { level: 5, label: "Student-tested", meaning: "Students have used it in their own studies, and we fixed the places where they got stuck." },
  },
  {
    min: 8,
    m: { level: 4, label: "Refined", meaning: "We read it start to finish as a newcomer would and fixed every place that was confusing. It also links to the other courses that use its ideas." },
  },
  {
    min: 6,
    m: { level: 3, label: "Polished", meaning: "Written in plain language, with interactive drawings for the hard ideas and practice questions like the ones on real exams." },
  },
  {
    min: 3,
    m: { level: 2, label: "Checked", meaning: "Checked against university course material so nothing is missing, and every example is worked through step by step." },
  },
  {
    min: 0,
    m: { level: 1, label: "First draft", meaning: "Every lesson is written, but it hasn't been reviewed yet. You may find gaps or mistakes." },
  },
];

export function maturity(rounds = 1): Maturity {
  return LEVELS.find((l) => rounds >= l.min)!.m;
}
