
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemperatureProfile } from '@/lib/api';
import BezierEditor from './BezierEditor';
import { Edit, Trash2, Play, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProfileCardProps {
  profile: TemperatureProfile;
  minTemp: number;
  maxTemp: number;
  onEdit: (profile: TemperatureProfile) => void;
  onDelete: (id: string) => void;
  onApply: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  minTemp,
  maxTemp,
  onEdit,
  onDelete,
  onApply
}) => {
  // Find the maximum temperature in the profile (highest y value)
  const maxProfileTemp = Math.round(
    Math.max(...profile.controlPoints.map(point => point.y)) * (maxTemp - minTemp) + minTemp
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{profile.name}</span>
          <Badge variant="outline" className="ml-2 gap-1">
            <Clock className="h-3 w-3" />
            {profile.duration} min
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.description && (
          <p className="text-sm text-muted-foreground">{profile.description}</p>
        )}
        
        <div className="space-y-1">
          <BezierEditor
            controlPoints={profile.controlPoints}
            onChange={() => {}}
            minTemp={minTemp}
            maxTemp={maxTemp}
            readonly
            className="h-40"
          />
          <div className="flex justify-between text-xs">
            <span>Max: {maxProfileTemp}°C</span>
            <span>Duration: {profile.duration} min</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onEdit(profile)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onDelete(profile.id)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          className="flex-1 gap-1"
          onClick={() => onApply(profile.id)}
        >
          <Play className="h-4 w-4" />
          Apply
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileCard;
