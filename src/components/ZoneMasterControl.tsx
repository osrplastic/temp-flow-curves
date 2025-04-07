
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeatZone, Controller, TemperatureProfile } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ZoneMasterControlProps {
  zone: HeatZone;
  controllers: Controller[];
  profiles: TemperatureProfile[];
  onUpdateAll: (zoneId: string, targetTemp: number) => void;
  onApplyProfile: (zoneId: string, profileId: string) => void;
}

const ZoneMasterControl: React.FC<ZoneMasterControlProps> = ({ 
  zone, 
  controllers,
  profiles,
  onUpdateAll,
  onApplyProfile
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

  const handleApplyProfile = (profileId: string) => {
    onApplyProfile(zone.id, profileId);
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

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Temperature Profiles</h3>
          <ScrollArea className="h-[240px] pr-2">
            <div className="space-y-2">
              {profiles.map(profile => (
                <Button 
                  key={profile.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleApplyProfile(profile.id)}
                >
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {profile.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZoneMasterControl;
