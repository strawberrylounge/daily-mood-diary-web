export const SCORE_RANGE = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

const SCORE_COLORS: Record<number, string> = {
  "-4": "#C07060",
  "-3": "#CC8578",
  "-2": "#D89A90",
  "-1": "#E4AFA8",
  "0": "#D9A860",
  "1": "#A4BFA6",
  "2": "#8FB193",
  "3": "#7A9E7E",
  "4": "#6A8E6E",
};

export const getScoreColor = (score: number): string =>
  SCORE_COLORS[score] ?? "#D9A860";
