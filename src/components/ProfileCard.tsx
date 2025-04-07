
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemperatureProfile } from '@/lib/api';
import BezierEditor from './BezierEditor';
import { Edit, Trash2, Play } from 'lucide-react';
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
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{profile.name}</span>
          <span className="text-xs text-muted-foreground">
            {profile.duration} min
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.description && (
          <p className="text-sm text-muted-foreground">{profile.description}</p>
        )}
        
        <BezierEditor
          controlPoints={profile.controlPoints}
          onChange={() => {}}
          minTemp={minTemp}
          maxTemp={maxTemp}
          readonly
          className="h-40"
        />
        
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
