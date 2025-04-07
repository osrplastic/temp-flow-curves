
import React from 'react';
import { Controller, HeatZone, TemperatureProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import TemperatureController from '@/components/TemperatureController';
import ZoneMasterControl from '@/components/ZoneMasterControl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ZoneCardProps {
  zone: HeatZone;
  controllers: Controller[];
  profiles: TemperatureProfile[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddController: () => void;
  onUpdateController: (id: string, data: Partial<Controller>) => void;
  onStartController: (controller: Controller) => void;
  onStopController: (id: string) => void;
  onUpdateAllInZone: (zoneId: string, targetTemp: number) => void;
  onApplyProfileToZone: (zoneId: string, profileId: string) => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  controllers,
  profiles,
  isOpen,
  onToggleOpen,
  onAddController,
  onUpdateController,
  onStartController,
  onStopController,
  onUpdateAllInZone,
  onApplyProfileToZone
}) => {
  return (
    <Card key={zone.id}>
      <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{zone.name}</CardTitle>
              {zone.description && (
                <CardDescription>{zone.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddController();
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to {zone.name}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-12 gap-6 pt-2">
              <div className="col-span-12 md:col-span-4 lg:col-span-3">
                <ZoneMasterControl 
                  zone={zone} 
                  controllers={controllers}
                  profiles={profiles}
                  onUpdateAll={onUpdateAllInZone}
                  onApplyProfile={onApplyProfileToZone}
                />
              </div>
              
              <div className="col-span-12 md:col-span-8 lg:col-span-9">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {controllers.map(controller => (
                    <div key={controller.id} className="flex flex-col">
                      <TemperatureController 
                        controller={controller}
                        profiles={profiles}
                        onUpdate={(data) => onUpdateController(controller.id, data)}
                        onStart={() => onStartController(controller)}
                        onStop={() => onStopController(controller.id)}
                      />
                    </div>
                  ))}
                  
                  {controllers.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-6 border border-dashed rounded-lg border-muted">
                      <p className="text-muted-foreground mb-4">No controllers in this zone</p>
                      <Button 
                        onClick={onAddController}
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Controller
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ZoneCard;
