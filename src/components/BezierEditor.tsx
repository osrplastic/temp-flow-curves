
import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint } from '@/lib/api';
import { getBezierPath } from '@/lib/bezier';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Circle, Square, Triangle } from 'lucide-react';

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
        
        // Update handles for smooth curves
        updateHandlesForSmoothCurve(newPoints, activePointIndex);
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
  
  // Update handles for smooth curve at the specified point
  const updateHandlesForSmoothCurve = (points: ControlPoint[], index: number) => {
    if (index <= 0 || index >= points.length - 1) return;
    
    const prev = points[index - 1];
    const curr = points[index];
    const next = points[index + 1];
    
    // Calculate handle positions for smooth curve
    const prevDiffX = curr.x - prev.x;
    const prevDiffY = curr.y - prev.y;
    const nextDiffX = next.x - curr.x;
    const nextDiffY = next.y - curr.y;
    
    // Handle before current point
    points[index - 1] = {
      ...prev,
      handleX: prev.x + prevDiffX / 3,
      handleY: prev.y + prevDiffY / 3
    };
    
    // Handle after current point
    points[index] = {
      ...curr,
      handleX: curr.x + nextDiffX / 3,
      handleY: curr.y + nextDiffY / 3
    };
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    setActivePointIndex(null);
    setActiveHandle(null);
  };
  
  // Handle double click on curve to add point
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readonly || e.target !== e.currentTarget) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    const { x: normX, y: normY } = toNormalizedCoords(x, y);
    
    // Find where to insert the new point
    let insertIndex = 1;
    for (let i = 0; i < controlPoints.length - 1; i++) {
      if (normX >= controlPoints[i].x && normX <= controlPoints[i + 1].x) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // Create the new point
    const newPoint: ControlPoint = {
      x: normX,
      y: normY,
      type: 'circle' // Default type for new points
    };
    
    // Insert the new point
    const newPoints = [
      ...controlPoints.slice(0, insertIndex),
      newPoint,
      ...controlPoints.slice(insertIndex)
    ];
    
    // Update handles for smooth curves
    updateHandlesForSmoothCurve(newPoints, insertIndex);
    if (insertIndex > 0) {
      updateHandlesForSmoothCurve(newPoints, insertIndex - 1);
    }
    
    onChange(newPoints);
  };
  
  // Handle double click on control point to delete it
  const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    
    // Don't allow deleting first or last points
    if (index === 0 || index === controlPoints.length - 1) return;
    
    // Remove the point
    const newPoints = [
      ...controlPoints.slice(0, index),
      ...controlPoints.slice(index + 1)
    ];
    
    // Update handles for smooth curves at the connection
    if (index > 0 && index < newPoints.length) {
      updateHandlesForSmoothCurve(newPoints, index - 1);
    }
    
    onChange(newPoints);
  };
  
  // Handle type change for a control point
  const handlePointTypeChange = (index: number, type: string) => {
    if (readonly) return;
    
    const newPoints = [...controlPoints];
    newPoints[index] = {
      ...newPoints[index],
      type: type as 'circle' | 'square' | 'triangle'
    };
    
    onChange(newPoints);
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
  
  // Render a control point based on its type
  const renderControlPoint = (point: ControlPoint, index: number) => {
    const svgPoint = toSvgCoords(point);
    const pointType = point.type || 'circle'; // Default to circle if not specified
    
    // Shared props for all point types
    const sharedProps = {
      className: cn(
        "fill-primary stroke-background stroke-1",
        !readonly && "cursor-move"
      ),
      onMouseDown: (e: React.MouseEvent) => handlePointMouseDown(index, e),
      onDoubleClick: (e: React.MouseEvent) => handlePointDoubleClick(index, e)
    };
    
    switch (pointType) {
      case 'square':
        return (
          <rect
            x={svgPoint.x - 5}
            y={svgPoint.y - 5}
            width={10}
            height={10}
            {...sharedProps}
          />
        );
      case 'triangle':
        const trianglePoints = `${svgPoint.x},${svgPoint.y - 6} ${svgPoint.x + 6},${svgPoint.y + 3} ${svgPoint.x - 6},${svgPoint.y + 3}`;
        return (
          <polygon
            points={trianglePoints}
            {...sharedProps}
          />
        );
      case 'circle':
      default:
        return (
          <circle
            cx={svgPoint.x}
            cy={svgPoint.y}
            r={5}
            {...sharedProps}
          />
        );
    }
  };
  
  return (
    <div className="space-y-2">
      {!readonly && activePointIndex !== null && (
        <div className="mb-2 flex items-center gap-2 p-1 border rounded-md bg-background">
          <span className="text-xs text-muted-foreground">Point Style:</span>
          <ToggleGroup type="single" value={controlPoints[activePointIndex]?.type || 'circle'} onValueChange={(value) => value && handlePointTypeChange(activePointIndex, value)}>
            <ToggleGroupItem value="circle" aria-label="Circle" size="sm">
              <Circle className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="square" aria-label="Square" size="sm">
              <Square className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="triangle" aria-label="Triangle" size="sm">
              <Triangle className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      <svg
        ref={svgRef}
        className={cn("w-full h-64 touch-none", className)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
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
              {renderControlPoint(point, index)}
              
              {/* Handle line and point (not for last point) */}
              {index < controlPoints.length - 1 && !readonly && (
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
      </svg>
    </div>
  );
};

export default BezierEditor;
