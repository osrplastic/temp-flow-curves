
// Utility functions for the Bezier editor

// Convert normalized coordinates (0-1) to SVG viewport coordinates
export const toSvgCoords = (
  point: { x: number; y: number },
  svgDimensions: { width: number; height: number }
) => {
  const paddingX = 30;
  const paddingY = 20;
  const usableWidth = svgDimensions.width - paddingX * 2;
  const usableHeight = svgDimensions.height - paddingY * 2;
  
  return {
    x: paddingX + (point.x * usableWidth),
    y: paddingY + ((1 - point.y) * usableHeight)
  };
};

// Convert SVG viewport coordinates to normalized coordinates (0-1)
export const toNormalizedCoords = (
  x: number, 
  y: number, 
  svgDimensions: { width: number; height: number }
) => {
  const paddingX = 30;
  const paddingY = 20;
  const usableWidth = svgDimensions.width - paddingX * 2;
  const usableHeight = svgDimensions.height - paddingY * 2;
  
  return {
    x: Math.max(0, Math.min(1, (x - paddingX) / usableWidth)),
    y: Math.max(0, Math.min(1, 1 - ((y - paddingY) / usableHeight)))
  };
};

// Check if a control point is selectable (not the first or last point)
export const isSelectable = (index: number, totalPoints: number): boolean => {
  return index > 0 && index < totalPoints - 1;
};

// Convert a point from normalized to SVG path coordinates
export const toPathCoords = (
  point: { x: number; y: number },
  svgDimensions: { width: number; height: number }
) => {
  const paddingX = 30;
  const paddingY = 20;
  const usableWidth = svgDimensions.width - paddingX * 2;
  const usableHeight = svgDimensions.height - paddingY * 2;
  
  return {
    x: paddingX + (point.x * usableWidth),
    y: paddingY + ((1 - point.y) * usableHeight)
  };
};
