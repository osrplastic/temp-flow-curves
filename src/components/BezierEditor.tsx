
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
    // Add padding to prevent clipping at edges
    const paddingX = 25; // Left padding for temperature labels
    const paddingY = 20; // Bottom padding for time labels
    const usableWidth = svgDimensions.width - paddingX;
    const usableHeight = svgDimensions.height - paddingY;
    
    return {
      x: paddingX + (point.x * usableWidth),
      y: (1 - point.y) * usableHeight // Flip Y coordinate
    };
  };
  
  // Convert SVG coordinates to normalized coordinates
  const toNormalizedCoords = (x: number, y: number) => {
    const paddingX = 25; // Left padding for temperature labels
    const paddingY = 20; // Bottom padding for time labels
    const usableWidth = svgDimensions.width - paddingX;
    const usableHeight = svgDimensions.height - paddingY;
    
    return {
      x: Math.max(0, Math.min(1, (x - paddingX) / usableWidth)),
      y: Math.max(0, Math.min(1, 1 - (y / usableHeight))) // Flip Y coordinate
    };
  };
  
  // Handle clicking on a control point to select it
  const handlePointClick = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    
    // Toggle selection if clicking the same point
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    } else {
      setSelectedPointIndex(index);
    }
  };
  
  // Handle mouse down on a control point
  const handlePointMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    setActivePointIndex(index);
    setActiveHandle('point');
    
    // Also select the point
    setSelectedPointIndex(index);
  };
  
  // Handle mouse down on a handle
  const handleHandleMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    setActivePointIndex(index);
    setActiveHandle('handle');
    
    // Also select the point
    setSelectedPointIndex(index);
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
  
  // Double click on SVG background to add a new control point
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readonly) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    // If double-clicking on a point, remove it
    if (selectedPointIndex !== null && selectedPointIndex !== 0 && selectedPointIndex !== controlPoints.length - 1) {
      const newPoints = [...controlPoints];
      newPoints.splice(selectedPointIndex, 1);
      onChange(newPoints);
      setSelectedPointIndex(null);
      return;
    }
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    const normalizedCoords = toNormalizedCoords(x, y);
    
    // Find where to insert the new point
    const newPoints = [...controlPoints];
    let insertIndex = 1; // Default after first point
    
    for (let i = 0; i < newPoints.length - 1; i++) {
      if (normalizedCoords.x > newPoints[i].x && normalizedCoords.x < newPoints[i + 1].x) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // Create new control point
    const newPoint: ControlPoint = {
      x: normalizedCoords.x,
      y: normalizedCoords.y,
      type: 'linear' // Default type
    };
    
    // Insert the new point
    newPoints.splice(insertIndex, 0, newPoint);
    onChange(newPoints);
    setSelectedPointIndex(insertIndex);
    
    e.stopPropagation();
  };
  
  // Click on SVG background deselects any selected point
  const handleSvgClick = (e: React.MouseEvent) => {
    // Don't deselect if we're in the controls area at the bottom
    if (e.nativeEvent.offsetY > svgDimensions.height - 40) {
      return;
    }
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
  
  // Check if a point is selectable (not first or last)
  const isSelectable = (index: number) => {
    return index > 0 && index < controlPoints.length - 1;
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
          data-testid="temp-label" // Added for testing purposes
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
          data-testid="time-label" // Added for testing purposes
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
        onDoubleClick={handleDoubleClick}
        style={{ padding: '5px' }} // Add padding to ensure labels are fully visible
      >
        {/* Background rectangle for better click area */}
        <rect
          x="0"
          y="0"
          width={svgDimensions.width}
          height={svgDimensions.height}
          fill="transparent"
        />
      
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map(y => {
          const { y: svgY } = toSvgCoords({ x: 0, y });
          return (
            <line
              key={`grid-y-${y}`}
              x1={25} // Start after temp labels
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
              y2={svgDimensions.height - 20} // Stop above time labels
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
          const pointType = point.type || 'linear';
          
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
                  isSelectable(index) && !readonly && "cursor-pointer"
                )}
                onMouseDown={(e) => handlePointMouseDown(index, e)}
                onClick={(e) => handlePointClick(index, e)}
                data-point-id={index} // Added for testing purposes
              />
              
              {/* Handle line and point (not for first and last points) */}
              {isSelectable(index) && !readonly && pointType !== 'linear' && (
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
      
      <div className="flex justify-center space-x-2 mb-2">
        <ToggleGroup 
          type="single" 
          value={getSelectedPointType()} 
          onValueChange={(value) => value && changePointType(value as ControlPointType)}
          className={cn(
            (selectedPointIndex === null || !isSelectable(selectedPointIndex)) ? "opacity-50" : ""
          )}
          disabled={selectedPointIndex === null || !isSelectable(selectedPointIndex) || readonly}
        >
          <ToggleGroupItem value="linear">Linear</ToggleGroupItem>
          <ToggleGroupItem value="quadratic">Quadratic</ToggleGroupItem>
          <ToggleGroupItem value="cubic">Cubic</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default BezierEditor;
