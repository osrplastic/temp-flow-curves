
import { ControlPoint } from "./api";

// Function to calculate a point on a cubic Bezier curve
export function cubicBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const cx = 3 * (p1.x - p0.x);
  const bx = 3 * (p2.x - p1.x) - cx;
  const ax = p3.x - p0.x - cx - bx;
  
  const cy = 3 * (p1.y - p0.y);
  const by = 3 * (p2.y - p1.y) - cy;
  const ay = p3.y - p0.y - cy - by;
  
  const tSquared = t * t;
  const tCubed = tSquared * t;
  
  const x = ax * tCubed + bx * tSquared + cx * t + p0.x;
  const y = ay * tCubed + by * tSquared + cy * t + p0.y;
  
  return { x, y };
}

// Create a list of points for drawing a Bezier curve from control points
export function getBezierPath(
  controlPoints: ControlPoint[],
  steps = 100
): { x: number; y: number }[] {
  if (controlPoints.length < 2) return [];
  
  const path: { x: number; y: number }[] = [];
  
  // Loop through segments (pairs of control points)
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const startPoint = controlPoints[i];
    const endPoint = controlPoints[i + 1];
    
    // Default handle positions if not specified
    const startHandleX = startPoint.handleX !== undefined 
      ? startPoint.handleX 
      : startPoint.x + (endPoint.x - startPoint.x) / 3;
    
    const startHandleY = startPoint.handleY !== undefined 
      ? startPoint.handleY 
      : startPoint.y + (endPoint.y - startPoint.y) / 3;
    
    const endHandleX = endPoint.handleX !== undefined 
      ? endPoint.handleX 
      : endPoint.x - (endPoint.x - startPoint.x) / 3;
    
    const endHandleY = endPoint.handleY !== undefined 
      ? endPoint.handleY 
      : endPoint.y - (endPoint.y - startPoint.y) / 3;
    
    // Calculate points along this segment
    const segmentSteps = Math.ceil(steps * (endPoint.x - startPoint.x));
    
    for (let j = 0; j <= segmentSteps; j++) {
      const t = j / segmentSteps;
      
      const point = cubicBezier(
        { x: startPoint.x, y: startPoint.y },
        { x: startHandleX, y: startHandleY },
        { x: endHandleX, y: endHandleY },
        { x: endPoint.x, y: endPoint.y },
        t
      );
      
      if (j === 0 && i > 0) continue; // Skip duplicates
      path.push(point);
    }
  }
  
  return path;
}

// Get temperature at a specific normalized time (0-1)
export function getTemperatureAtTime(
  controlPoints: ControlPoint[],
  normalizedTime: number,
  minTemp: number,
  maxTemp: number
): number {
  if (controlPoints.length < 2) return minTemp;
  
  // Handle bounds
  if (normalizedTime <= 0) return minTemp + controlPoints[0].y * (maxTemp - minTemp);
  if (normalizedTime >= 1) return minTemp + controlPoints[controlPoints.length - 1].y * (maxTemp - minTemp);
  
  // Find the segment containing this time
  let startIndex = 0;
  for (let i = 0; i < controlPoints.length - 1; i++) {
    if (normalizedTime >= controlPoints[i].x && normalizedTime <= controlPoints[i + 1].x) {
      startIndex = i;
      break;
    }
  }
  
  const startPoint = controlPoints[startIndex];
  const endPoint = controlPoints[startIndex + 1];
  
  // Calculate segment progress
  const segmentDuration = endPoint.x - startPoint.x;
  const segmentProgress = (normalizedTime - startPoint.x) / segmentDuration;
  
  // Default handle positions if not specified
  const startHandleX = startPoint.handleX !== undefined 
    ? startPoint.handleX 
    : startPoint.x + segmentDuration / 3;
  
  const startHandleY = startPoint.handleY !== undefined 
    ? startPoint.handleY 
    : startPoint.y + (endPoint.y - startPoint.y) / 3;
  
  const endHandleX = endPoint.handleX !== undefined 
    ? endPoint.handleX 
    : endPoint.x - segmentDuration / 3;
  
  const endHandleY = endPoint.handleY !== undefined 
    ? endPoint.handleY 
    : endPoint.y - (endPoint.y - startPoint.y) / 3;
  
  // Calculate the point on the bezier curve
  const point = cubicBezier(
    { x: startPoint.x, y: startPoint.y },
    { x: startHandleX, y: startHandleY },
    { x: endHandleX, y: endHandleY },
    { x: endPoint.x, y: endPoint.y },
    segmentProgress
  );
  
  // Convert normalized temperature to actual temperature
  return minTemp + point.y * (maxTemp - minTemp);
}
