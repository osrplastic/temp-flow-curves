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
  const [isDragging, setIsDragging] = useState(false);
  
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
  
  const toSvgCoords = (point: { x: number; y: number }) => {
    const paddingX = 25;
    const paddingY = 20;
    const usableWidth = svgDimensions.width - paddingX;
    const usableHeight = svgDimensions.height - paddingY;
    
    return {
      x: paddingX + (point.x * usableWidth),
      y: (1 - point.y) * usableHeight
    };
  };
  
  const toNormalizedCoords = (x: number, y: number) => {
    const paddingX = 25;
    const paddingY = 20;
    const usableWidth = svgDimensions.width - paddingX;
    const usableHeight = svgDimensions.height - paddingY;
    
    return {
      x: Math.max(0, Math.min(1, (x - paddingX) / usableWidth)),
      y: Math.max(0, Math.min(1, 1 - (y / usableHeight)))
    };
  };
  
  const handlePointClick = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    
    setSelectedPointIndex(index);
  };
  
  const handlePointMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    setActivePointIndex(index);
    setActiveHandle('point');
    setIsDragging(true);
    
    setSelectedPointIndex(index);
  };
  
  const handleHandleMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    setActivePointIndex(index);
    setActiveHandle('handle');
    setIsDragging(true);
    
    setSelectedPointIndex(index);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (readonly || activePointIndex === null || !activeHandle) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    const normalizedCoords = toNormalizedCoords(x, y);
    
    const newPoints = [...controlPoints];
    
    if (activeHandle === 'point') {
      if (activePointIndex === 0) {
        newPoints[activePointIndex] = {
          ...newPoints[activePointIndex],
          y: normalizedCoords.y
        };
      } else if (activePointIndex === newPoints.length - 1) {
        newPoints[activePointIndex] = {
          ...newPoints[activePointIndex],
          y: normalizedCoords.y
        };
      } else {
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
      newPoints[activePointIndex] = {
        ...newPoints[activePointIndex],
        handleX: normalizedCoords.x,
        handleY: normalizedCoords.y
      };
    }
    
    onChange(newPoints);
  };
  
  const handleMouseUp = () => {
    setActivePointIndex(null);
    setActiveHandle(null);
    setIsDragging(false);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readonly) return;
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
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
    
    const newPoints = [...controlPoints];
    let insertIndex = 1;
    
    for (let i = 0; i < newPoints.length - 1; i++) {
      if (normalizedCoords.x > newPoints[i].x && normalizedCoords.x < newPoints[i + 1].x) {
        insertIndex = i + 1;
        break;
      }
    }
    
    const newPoint: ControlPoint = {
      x: normalizedCoords.x,
      y: normalizedCoords.y,
      type: 'linear'
    };
    
    newPoints.splice(insertIndex, 0, newPoint);
    onChange(newPoints);
    setSelectedPointIndex(insertIndex);
    
    e.stopPropagation();
  };
  
  const handleSvgClick = (e: React.MouseEvent) => {
    if (e.nativeEvent.offsetY > svgDimensions.height - 40) {
      return;
    }
    
    if (!isDragging) {
      setSelectedPointIndex(null);
    }
  };
  
  const changePointType = (type: ControlPointType) => {
    if (selectedPointIndex === null || readonly) return;
    
    const newPoints = [...controlPoints];
    const point = newPoints[selectedPointIndex];
    
    if (selectedPointIndex === 0 || selectedPointIndex === newPoints.length - 1) {
      return;
    }
    
    switch (type) {
      case 'linear':
        newPoints[selectedPointIndex] = {
          x: point.x,
          y: point.y,
          type: 'linear'
        };
        break;
      case 'quadratic':
        newPoints[selectedPointIndex] = {
          x: point.x,
          y: point.y,
          handleX: point.x + 0.05,
          handleY: point.y,
          type: 'quadratic'
        };
        break;
      case 'cubic':
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
  
  const getSelectedPointType = (): ControlPointType => {
    if (selectedPointIndex === null) return 'linear';
    
    const point = controlPoints[selectedPointIndex];
    return (point.type as ControlPointType) || 'linear';
  };
  
  const isSelectable = (index: number) => {
    return index > 0 && index < controlPoints.length - 1;
  };
  
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
  
  const renderTempLabels = () => {
    const labels = [];
    const steps = 5;
    
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
      const svgCoords = toSvgCoords({ x, y: 0 });
      
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
        style={{ padding: '5px' }}
      >
        <rect
          x="0"
          y="0"
          width={svgDimensions.width}
          height={svgDimensions.height}
          fill="transparent"
        />
      
        {[0.2, 0.4, 0.6, 0.8].map(y => {
          const { y: svgY } = toSvgCoords({ x: 0, y });
          return (
            <line
              key={`grid-y-${y}`}
              x1={25}
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
              y2={svgDimensions.height - 20}
              className="stroke-muted/20 stroke-dasharray-2"
            />
          );
        })}
        
        <path d={pathData} className="bezier-curve-path" />
        
        {controlPoints.map((point, index) => {
          const svgPoint = toSvgCoords(point);
          
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
                data-point-id={index}
              />
              
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
        
        {renderTempLabels()}
        
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
