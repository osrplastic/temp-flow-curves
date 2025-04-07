
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeatZone, Controller, TemperatureProfile } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Play, Thermometer } from 'lucide-react';

interface ZoneMasterControlProps {
  zone: HeatZone;
  controllers: Controller[];
  profiles?: TemperatureProfile[];
  onUpdateAll: (zoneId: string, targetTemp: number) => void;
  onApplyProfileToZone?: (zoneId: string, profileId: string) => void;
}

const ZoneMasterControl: React.FC<ZoneMasterControlProps> = ({ 
  zone, 
  controllers,
  profiles,
  onUpdateAll,
  onApplyProfileToZone
}) => {
  const [targetTemp, setTargetTemp] = useState(50);
  const [inputValue, setInputValue] = useState('50');
  const [averageTemp, setAverageTemp] = useState(0);
  
  // Find min and max temperatures across all controllers in this zone
  const minTemp = Math.min(...controllers.map(c => c.minTemp));
  const maxTemp = Math.max(...controllers.map(c => c.maxTemp));
  
  // Calculate average temperature of all controllers in this zone
  useEffect(() => {
    if (controllers.length === 0) return;
    
    const total = controllers.reduce((sum, controller) => sum + controller.currentTemp, 0);
    const avg = total / controllers.length;
    setAverageTemp(Math.round(avg * 10) / 10);
  }, [controllers]);
  
  const handleSliderChange = (values: number[]) => {
    const newTemp = values[0];
    setTargetTemp(newTemp);
    setInputValue(newTemp.toString());
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= minTemp && parsed <= maxTemp) {
      setTargetTemp(parsed);
      onUpdateAll(zone.id, parsed);
    } else {
      setInputValue(targetTemp.toString());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };
  
  const handleApplyToAll = () => {
    onUpdateAll(zone.id, targetTemp);
  };
  
  const getTempColor = (temp: number) => {
    const range = maxTemp - minTemp;
    const ratio = (temp - minTemp) / range;
    
    if (ratio <= 0.33) return 'text-blue-400';
    if (ratio <= 0.66) return 'text-amber-400';
    return 'text-red-400';
  };

  // Calculate temperature color intensity for heat press visualization
  const getHeatIntensity = (controllerIndex: number) => {
    if (controllers.length === 0 || !controllers[controllerIndex]) return 'bg-gray-200';
    
    const controller = controllers[controllerIndex];
    const range = controller.maxTemp - controller.minTemp;
    const ratio = (controller.currentTemp - controller.minTemp) / range;
    
    if (ratio <= 0.2) return 'bg-blue-200';
    if (ratio <= 0.4) return 'bg-blue-400';
    if (ratio <= 0.6) return 'bg-amber-400';
    if (ratio <= 0.8) return 'bg-orange-500';
    return 'bg-red-600';
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between items-center text-lg">
          <span>Master Control: {zone.name}</span>
          <div className={cn("font-mono", getTempColor(averageTemp))}>
            Avg: {averageTemp.toFixed(1)}°C
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Heat Press Visualization */}
        <div className="mb-4 relative">
          <div className="border border-gray-300 rounded-md bg-gray-100 p-2">
            <div className="text-center text-xs text-gray-500 mb-1">Heat Press Visualization</div>
            <div className="flex justify-center mb-2">
              <Thermometer className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-xs">{zone.name} Elements</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {Array.from({ length: Math.min(4, controllers.length) }).map((_, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "h-8 rounded-md transition-colors duration-300 flex items-center justify-center text-xs font-medium text-white shadow-inner",
                    getHeatIntensity(index)
                  )}
                >
                  {controllers[index]?.name.split(' ')[0]}
                </div>
              ))}
            </div>
            {controllers.length > 4 && (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: Math.min(4, controllers.length - 4) }).map((_, index) => (
                  <div 
                    key={index + 4} 
                    className={cn(
                      "h-8 rounded-md transition-colors duration-300 flex items-center justify-center text-xs font-medium text-white shadow-inner",
                      getHeatIntensity(index + 4)
                    )}
                  >
                    {controllers[index + 4]?.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider 
              value={[targetTemp]} 
              min={minTemp} 
              max={maxTemp} 
              step={1}
              onValueChange={handleSliderChange}
              onValueCommit={handleApplyToAll}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{minTemp}°C</span>
              <span>{maxTemp}°C</span>
            </div>
          </div>
          <div className="w-20">
            <Input
              type="number"
              min={minTemp}
              max={maxTemp}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="font-mono"
            />
          </div>
        </div>
        
        {profiles && profiles.length > 0 && onApplyProfileToZone && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Apply profile to all controllers:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Play className="h-3 w-3" />
                  Profile <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profiles.map(profile => (
                  <DropdownMenuItem 
                    key={profile.id}
                    onClick={() => onApplyProfileToZone(zone.id, profile.id)}
                  >
                    {profile.name} ({profile.duration} min)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ZoneMasterControl;
