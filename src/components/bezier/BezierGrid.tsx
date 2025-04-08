
import React from "react";
import { toSvgCoords } from "./bezierUtils";

interface BezierGridProps {
  svgDimensions: { width: number; height: number };
  minTemp: number;
  maxTemp: number;
}

const BezierGrid: React.FC<BezierGridProps> = ({ 
  svgDimensions, 
  minTemp, 
  maxTemp 
}) => {
  const renderTempLabels = () => {
    const labels = [];
    const steps = 5;
    
    for (let i = 0; i <= steps; i++) {
      const y = i / steps;
      const temp = minTemp + (maxTemp - minTemp) * (1 - y);
      const svgCoords = toSvgCoords({ x: 0, y }, svgDimensions);
      
      labels.push(
        <text
          key={`label-${i}`}
          x={5}
          y={svgCoords.y}
          className="text-xs fill-muted-foreground"
          alignmentBaseline="middle"
          data-testid="temp-label"
        >
          {Math.round(temp)}°C
        </text>
      );
    }
    
    return labels;
  };
  
  const renderTimeLabels = () => {
    const labels = [];
    const steps = 4;
    
    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      const svgCoords = toSvgCoords({ x, y: 0 }, svgDimensions);
      
      labels.push(
        <text
          key={`time-${i}`}
          x={svgCoords.x}
          y={svgDimensions.height - 5}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
          data-testid="time-label"
        >
          {Math.round(x * 100)}%
        </text>
      );
    }
    
    return labels;
  };
  
  const renderGridLines = () => {
    const horizontalLines = [0.2, 0.4, 0.6, 0.8].map(y => {
      const { y: svgY } = toSvgCoords({ x: 0, y }, svgDimensions);
      return (
        <line
          key={`grid-y-${y}`}
          x1={25}
          y1={svgY}
          x2={svgDimensions.width - 10}
          y2={svgY}
          className="stroke-muted/20 stroke-dasharray-2"
        />
      );
    });
    
    const verticalLines = [0.2, 0.4, 0.6, 0.8].map(x => {
      const { x: svgX } = toSvgCoords({ x, y: 0 }, svgDimensions);
      return (
        <line
          key={`grid-x-${x}`}
          x1={svgX}
          y1={20}
          x2={svgX}
          y2={svgDimensions.height - 20}
          className="stroke-muted/20 stroke-dasharray-2"
        />
      );
    });
    
    return [...horizontalLines, ...verticalLines];
  };
  
  return (
    <>
      {renderGridLines()}
      {renderTempLabels()}
      {renderTimeLabels()}
    </>
  );
};

export default BezierGrid;
