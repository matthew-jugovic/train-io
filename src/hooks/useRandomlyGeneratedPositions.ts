import { useState } from "react";
import { type XYZ } from "../types/XYZ";

export type Range = [number, number];
type GenerationProps = {
  numPositions: number;
  xRange: Range;
  yRange: Range;
  zRange: Range;
};

const generateRandomPositionValue = (range: Range) => {
  const rangeSpan = range[1] - range[0];
  return Math.floor(Math.random() * rangeSpan) + range[0];
};

const generateRandomPositions = ({
  numPositions,
  xRange,
  yRange,
  zRange,
}: GenerationProps) => {
  const generatedPositions: XYZ[] = [];

  for (let i = 0; i < numPositions; i++) {
    const randomX = generateRandomPositionValue(xRange);
    const randomY = generateRandomPositionValue(yRange);
    const randomZ = generateRandomPositionValue(zRange);
    generatedPositions.push([randomX, randomY, randomZ]);
  }

  return generatedPositions;
};

export const useRandomlyGeneratedPositions = ({
  numPositions,
  xRange,
  yRange,
  zRange,
}: GenerationProps) => {
  const [generatedPositions, setGeneratedPositions] = useState<XYZ[]>([]);

  const generatePositions = () => {
    setGeneratedPositions(
      generateRandomPositions({ numPositions, xRange, yRange, zRange })
    );
  };

  return { generatedPositions, generatePositions };
};
