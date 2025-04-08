import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint } from '@/lib/api';
import { getBezierPath } from '@/lib/bezier';
import { cn } from '@/lib/utils';
import { BezierEditorProps, ControlPointType } from './types';
import { toNormalizedCoords, isSelectable, toPathCoords } from './bezierUtils';
import BezierGrid from './BezierGrid';
import ControlPoints from './ControlPoints';
import PointTypeControls from './PointTypeControls';

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
    const normalizedCoords = toNormalizedCoords(x, y, svgDimensions);
    
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
  
  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (activePointIndex !== null) {
      setSelectedPointIndex(activePointIndex);
    }
    
    setActivePointIndex(null);
    setActiveHandle(null);
    setIsDragging(false);
  };
  
  const handleSvgMouseLeave = () => {
    if (activePointIndex !== null) {
      setSelectedPointIndex(activePointIndex);
    }
    
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
    const normalizedCoords = toNormalizedCoords(x, y, svgDimensions);
    
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
  
  const handleTouchStart = (index: number, handle: 'point' | 'handle', e: React.TouchEvent) => {
    if (readonly) return;
    e.stopPropagation();
    
    setActivePointIndex(index);
    setActiveHandle(handle);
    setIsDragging(true);
    setSelectedPointIndex(index);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (readonly || activePointIndex === null || !activeHandle) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect || !touch) return;
    
    const x = touch.clientX - svgRect.left;
    const y = touch.clientY - svgRect.top;
    const normalizedCoords = toNormalizedCoords(x, y, svgDimensions);
    
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
  
  const handleTouchEnd = () => {
    if (activePointIndex !== null) {
      setSelectedPointIndex(activePointIndex);
    }
    
    setActivePointIndex(null);
    setActiveHandle(null);
    setIsDragging(false);
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
  
  const pathPoints = getBezierPath(controlPoints);
  let pathData = '';
  
  if (pathPoints.length > 0) {
    const firstPoint = toPathCoords(pathPoints[0], svgDimensions);
    pathData = `M ${firstPoint.x} ${firstPoint.y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const point = toPathCoords(pathPoints[i], svgDimensions);
      pathData += ` L ${point.x} ${point.y}`;
    }
  }
  
  const isPointControlsDisabled = selectedPointIndex === null || 
    !isSelectable(selectedPointIndex, controlPoints.length) || 
    readonly;
  
  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        className={cn("w-full h-64 touch-none", className)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleSvgMouseLeave}
        onClick={handleSvgClick}
        onDoubleClick={handleDoubleClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ padding: '5px' }}
      >
        <rect
          x="0"
          y="0"
          width={svgDimensions.width}
          height={svgDimensions.height}
          fill="transparent"
        />
        
        <BezierGrid
          svgDimensions={svgDimensions}
          minTemp={minTemp}
          maxTemp={maxTemp}
        />
        
        <path 
          d={pathData} 
          className="bezier-curve-path"
        />
        
        <ControlPoints
          controlPoints={controlPoints}
          svgDimensions={svgDimensions}
          selectedPointIndex={selectedPointIndex}
          readonly={readonly || false}
          handlePointMouseDown={handlePointMouseDown}
          handlePointClick={handlePointClick}
          handleHandleMouseDown={handleHandleMouseDown}
          handleTouchStart={handleTouchStart}
        />
      </svg>
      
      <PointTypeControls
        selectedType={getSelectedPointType()}
        onChange={changePointType}
        disabled={isPointControlsDisabled}
      />
    </div>
  );
};

export default BezierEditor;
