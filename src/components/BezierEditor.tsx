
import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint } from '@/lib/api';
import { getBezierPath } from '@/lib/bezier';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface BezierEditorProps {
  controlPoints: ControlPoint[];
  onChange: (points: ControlPoint[]) => void;
  minTemp: number;
  maxTemp: number;
  className?: string;
  readonly?: boolean;
}

type ControlPointType = 'linear' | 'quadratic' | 'cubic';

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
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
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
  
  // Handle clicking on a control point to select it
  const handlePointClick = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    
    // Toggle selection if clicking the same point
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    } else {
      setSelectedPointIndex(index);
    }
    
    e.stopPropagation();
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
  
  // Click on SVG background deselects any selected point
  const handleSvgClick = () => {
    setSelectedPointIndex(null);
  };
  
  // Change the type of the selected control point
  const changePointType = (type: ControlPointType) => {
    if (selectedPointIndex === null || readonly) return;
    
    const newPoints = [...controlPoints];
    const point = newPoints[selectedPointIndex];
    
    // Skip first and last points
    if (selectedPointIndex === 0 || selectedPointIndex === newPoints.length - 1) {
      return;
    }
    
    switch (type) {
      case 'linear':
        // Remove handles
        newPoints[selectedPointIndex] = {
          x: point.x,
          y: point.y,
          type: 'linear'
        };
        break;
      case 'quadratic':
        // Simple handle for quadratic (only one handle)
        newPoints[selectedPointIndex] = {
          x: point.x,
          y: point.y,
          handleX: point.x + 0.05,
          handleY: point.y,
          type: 'quadratic'
        };
        break;
      case 'cubic':
        // Two handles for cubic (we only show one in the UI)
        newPoints[selectedPointIndex] = {
          x: point.x,
          y: point.y,
          handleX: point.x + 0.05,
          handleY: point.y,
          type: 'cubic'
        };
        break;
    }
    
    onChange(newPoints);
  };
  
  // Determine current type of selected point
  const getSelectedPointType = (): ControlPointType => {
    if (selectedPointIndex === null) return 'linear';
    
    const point = controlPoints[selectedPointIndex];
    return (point.type as ControlPointType) || 'linear';
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
  
  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        className={cn("w-full h-64 touch-none", className)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
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
          
          const isSelected = selectedPointIndex === index;
          const pointType = (point.type as string) || 'linear';
          
          return (
            <React.Fragment key={`control-${index}`}>
              {/* Control point */}
              <circle
                cx={svgPoint.x}
                cy={svgPoint.y}
                r={isSelected ? 7 : 5}
                className={cn(
                  "fill-primary stroke-background stroke-1",
                  isSelected && "fill-accent",
                  !readonly && "cursor-pointer"
                )}
                onMouseDown={(e) => handlePointMouseDown(index, e)}
                onClick={(e) => handlePointClick(index, e)}
              />
              
              {/* Handle line and point (not for first and last points) */}
              {index > 0 && index < controlPoints.length - 1 && !readonly && pointType !== 'linear' && (
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
      
      {!readonly && selectedPointIndex !== null && selectedPointIndex > 0 && selectedPointIndex < controlPoints.length - 1 && (
        <div className="flex justify-center space-x-2">
          <ToggleGroup type="single" value={getSelectedPointType()} onValueChange={(value) => value && changePointType(value as ControlPointType)}>
            <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
            <ToggleGroupItem value="quadratic">Quadratic</ToggleGroupItem>
            <ToggleGroupItem value="cubic">Cubic</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
};

export default BezierEditor;
