
import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint, ControlPointType } from '@/lib/api';
import { getBezierPath } from '@/lib/bezier';
import { cn } from '@/lib/utils';

interface BezierEditorProps {
  controlPoints: ControlPoint[];
  onChange: (points: ControlPoint[]) => void;
  minTemp: number;
  maxTemp: number;
  className?: string;
  readonly?: boolean;
}

const BezierEditor: React.FC<BezierEditorProps> = ({
  controlPoints,
  onChange,
  minTemp,
  maxTemp,
  className,
  readonly = false
}) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [activeHandle, setActiveHandle] = useState<'point' | 'handle' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  
  // Update SVG dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Convert normalized coordinates to SVG coordinates
  const toSvgCoords = (point: { x: number; y: number }) => {
    return {
      x: point.x * svgDimensions.width,
      y: (1 - point.y) * svgDimensions.height // Flip Y coordinate
    };
  };
  
  // Convert SVG coordinates to normalized coordinates
  const toNormalizedCoords = (x: number, y: number) => {
    return {
      x: Math.max(0, Math.min(1, x / svgDimensions.width)),
      y: Math.max(0, Math.min(1, 1 - (y / svgDimensions.height))) // Flip Y coordinate
    };
  };
  
  // Handle mouse down on a control point
  const handlePointMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    setActivePointIndex(index);
    setActiveHandle('point');
    e.stopPropagation();
  };
  
  // Handle mouse down on a handle
  const handleHandleMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    setActivePointIndex(index);
    setActiveHandle('handle');
    e.stopPropagation();
  };
  
  // Toggle control point type
  const toggleControlPointType = (index: number) => {
    if (readonly || index === 0 || index === controlPoints.length - 1) return;
    
    const newPoints = [...controlPoints];
    const point = newPoints[index];
    const currentType = point.type || 'linear';
    
    const types: ControlPointType[] = ['linear', 'quadratic', 'cubic'];
    const nextTypeIndex = (types.indexOf(currentType) + 1) % types.length;
    const nextType = types[nextTypeIndex];
    
    newPoints[index] = { 
      ...point, 
      type: nextType 
    };
    
    onChange(newPoints);
  };
  
  // Handle double click on a control point (delete)
  const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readonly) return;
    
    // Don't allow deleting the first or last points
    if (index === 0 || index === controlPoints.length - 1) return;
    
    const newPoints = [...controlPoints];
    newPoints.splice(index, 1);
    onChange(newPoints);
  };
  
  // Handle double click on the SVG (add a point)
  const handleSvgDoubleClick = (e: React.MouseEvent) => {
    if (readonly) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    const normalizedCoords = toNormalizedCoords(x, y);
    
    // Find where to insert the new point
    let insertIndex = 1;
    for (let i = 0; i < controlPoints.length - 1; i++) {
      if (normalizedCoords.x > controlPoints[i].x && normalizedCoords.x < controlPoints[i + 1].x) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // Create the new point as linear by default
    const newPoint: ControlPoint = {
      x: normalizedCoords.x,
      y: normalizedCoords.y,
      type: 'linear'
    };
    
    // Insert the point at the appropriate position
    const newPoints = [...controlPoints];
    newPoints.splice(insertIndex, 0, newPoint);
    onChange(newPoints);
  };
  
  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (readonly || activePointIndex === null || !activeHandle) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    const normalizedCoords = toNormalizedCoords(x, y);
    
    // Create a new array of control points
    const newPoints = [...controlPoints];
    
    if (activeHandle === 'point') {
      // Special handling for first and last points
      if (activePointIndex === 0) {
        // First point can only move vertically
        newPoints[activePointIndex] = {
          ...newPoints[activePointIndex],
          y: normalizedCoords.y
        };
      } else if (activePointIndex === newPoints.length - 1) {
        // Last point can only move vertically
        newPoints[activePointIndex] = {
          ...newPoints[activePointIndex],
          y: normalizedCoords.y
        };
      } else {
        // Middle points can move horizontally between adjacent points
        const prevPoint = newPoints[activePointIndex - 1];
        const nextPoint = newPoints[activePointIndex + 1];
        
        const boundedX = Math.max(prevPoint.x, Math.min(nextPoint.x, normalizedCoords.x));
        
        newPoints[activePointIndex] = {
          ...newPoints[activePointIndex],
          x: boundedX,
          y: normalizedCoords.y
        };
      }
    } else if (activeHandle === 'handle') {
      // Update handle position
      newPoints[activePointIndex] = {
        ...newPoints[activePointIndex],
        handleX: normalizedCoords.x,
        handleY: normalizedCoords.y
      };
    }
    
    onChange(newPoints);
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    setActivePointIndex(null);
    setActiveHandle(null);
  };
  
  // Generate the SVG path for the Bezier curve
  const pathPoints = getBezierPath(controlPoints);
  let pathData = '';
  
  if (pathPoints.length > 0) {
    const startPoint = toSvgCoords(pathPoints[0]);
    pathData = `M ${startPoint.x} ${startPoint.y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const point = toSvgCoords(pathPoints[i]);
      pathData += ` L ${point.x} ${point.y}`;
    }
  }
  
  // Render temperature labels
  const renderTempLabels = () => {
    const labels = [];
    const steps = 5; // Number of labels
    
    for (let i = 0; i <= steps; i++) {
      const y = i / steps;
      const temp = minTemp + (maxTemp - minTemp) * (1 - y);
      const svgCoords = toSvgCoords({ x: 0, y: 1 - y });
      
      labels.push(
        <text
          key={`label-${i}`}
          x={5}
          y={svgCoords.y}
          className="text-xs fill-muted-foreground"
          alignmentBaseline="middle"
        >
          {Math.round(temp)}°C
        </text>
      );
    }
    
    return labels;
  };
  
  // Render time labels
  const renderTimeLabels = () => {
    const labels = [];
    const steps = 4; // Number of labels
    
    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      const svgCoords = toSvgCoords({ x, y: 0 });
      
      labels.push(
        <text
          key={`time-${i}`}
          x={svgCoords.x}
          y={svgDimensions.height - 5}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
        >
          {Math.round(x * 100)}%
        </text>
      );
    }
    
    return labels;
  };
  
  // Get control point shape based on type
  const getControlPointShape = (point: ControlPoint, index: number) => {
    const svgPoint = toSvgCoords(point);
    const type = point.type || 'linear';
    
    const isFirstOrLast = index === 0 || index === controlPoints.length - 1;
    
    const commonProps = {
      onClick: () => toggleControlPointType(index),
      onDoubleClick: (e: React.MouseEvent) => handlePointDoubleClick(index, e),
      onMouseDown: (e: React.MouseEvent) => handlePointMouseDown(index, e),
      className: cn(
        "stroke-background stroke-1",
        !readonly && "cursor-pointer"
      )
    };
    
    if (type === 'linear' || isFirstOrLast) {
      // Circle for linear type or first/last points
      return (
        <circle
          cx={svgPoint.x}
          cy={svgPoint.y}
          r={5}
          fill={isFirstOrLast ? "#ff6b6b" : "#4dabf7"}
          {...commonProps}
        />
      );
    } else if (type === 'quadratic') {
      // Square for quadratic type
      return (
        <rect
          x={svgPoint.x - 4}
          y={svgPoint.y - 4}
          width={8}
          height={8}
          fill="#12b886"
          {...commonProps}
        />
      );
    } else if (type === 'cubic') {
      // Diamond for cubic type
      return (
        <polygon
          points={`${svgPoint.x},${svgPoint.y-5} ${svgPoint.x+5},${svgPoint.y} ${svgPoint.x},${svgPoint.y+5} ${svgPoint.x-5},${svgPoint.y}`}
          fill="#9775fa"
          {...commonProps}
        />
      );
    }
    
    return null;
  };
  
  return (
    <svg
      ref={svgRef}
      className={cn("w-full h-64 touch-none", className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleSvgDoubleClick}
    >
      {/* Grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map(y => {
        const { y: svgY } = toSvgCoords({ x: 0, y });
        return (
          <line
            key={`grid-y-${y}`}
            x1={0}
            y1={svgY}
            x2={svgDimensions.width}
            y2={svgY}
            className="stroke-muted/20 stroke-dasharray-2"
          />
        );
      })}
      
      {[0.2, 0.4, 0.6, 0.8].map(x => {
        const { x: svgX } = toSvgCoords({ x, y: 0 });
        return (
          <line
            key={`grid-x-${x}`}
            x1={svgX}
            y1={0}
            x2={svgX}
            y2={svgDimensions.height}
            className="stroke-muted/20 stroke-dasharray-2"
          />
        );
      })}
      
      {/* Bezier curve */}
      <path d={pathData} className="bezier-curve-path" />
      
      {/* Control points and handles */}
      {controlPoints.map((point, index) => {
        const svgPoint = toSvgCoords(point);
        const type = point.type || 'linear';
        
        // Don't show handles for linear points or the last point
        const showHandles = !readonly && index < controlPoints.length - 1 && type !== 'linear';
        
        // Default handle positions if not specified
        const nextPoint = index < controlPoints.length - 1 ? controlPoints[index + 1] : null;
        
        const handleX = point.handleX !== undefined 
          ? point.handleX 
          : (nextPoint ? point.x + (nextPoint.x - point.x) / 3 : point.x + 0.1);
        
        const handleY = point.handleY !== undefined 
          ? point.handleY 
          : (nextPoint ? point.y + (nextPoint.y - point.y) / 3 : point.y);
        
        const svgHandle = toSvgCoords({ x: handleX, y: handleY });
        
        return (
          <React.Fragment key={`control-${index}`}>
            {/* Control point */}
            {getControlPointShape(point, index)}
            
            {/* Handle line and point */}
            {showHandles && (
              <>
                <line
                  x1={svgPoint.x}
                  y1={svgPoint.y}
                  x2={svgHandle.x}
                  y2={svgHandle.y}
                  className="bezier-control-line"
                />
                <circle
                  cx={svgHandle.x}
                  cy={svgHandle.y}
                  r={3}
                  className={cn(
                    "fill-accent stroke-primary stroke-1",
                    !readonly && "cursor-move"
                  )}
                  onMouseDown={(e) => handleHandleMouseDown(index, e)}
                />
              </>
            )}
          </React.Fragment>
        );
      })}
      
      {/* Temperature labels */}
      {renderTempLabels()}
      
      {/* Time labels */}
      {renderTimeLabels()}
      
      {/* Legend */}
      <g transform={`translate(${svgDimensions.width - 100}, 10)`}>
        <circle cx={10} cy={10} r={5} fill="#4dabf7" />
        <text x={20} y={14} className="text-xs">Linear</text>
        
        <rect x={6} y={30} width={8} height={8} fill="#12b886" />
        <text x={20} y={38} className="text-xs">Quadratic</text>
        
        <polygon points="10,60 15,65 10,70 5,65" fill="#9775fa" />
        <text x={20} y={68} className="text-xs">Cubic</text>
      </g>
    </svg>
  );
};

export default BezierEditor;
