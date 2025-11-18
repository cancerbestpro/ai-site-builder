import { FileCode, FileEdit, Brain, Check, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ActivityItem {
  id: string;
  type: 'thought' | 'read' | 'edited' | 'deployed' | 'error';
  message: string;
  fileName?: string;
  details?: string;
  timestamp: number;
}

interface ActivityLogProps {
  activities: ActivityItem[];
  isGenerating: boolean;
}

const ActivityLog = ({ activities, isGenerating }: ActivityLogProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'thought':
        return <Brain className="w-4 h-4 text-accent" />;
      case 'read':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'edited':
        return <FileEdit className="w-4 h-4 text-green-400" />;
      case 'deployed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'thought':
        return 'Thought';
      case 'read':
        return 'Read';
      case 'edited':
        return 'Edited';
      case 'deployed':
        return 'Edge functions deployed';
      case 'error':
        return 'Error';
    }
  };

  return (
    <div className="w-80 border-r border-border bg-sidebar-background flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h3 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2">
          {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
          Activity Log
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activities.map((activity) => {
            const isExpanded = expandedItems.has(activity.id);
            const hasDetails = activity.details || activity.fileName;

            return (
              <div key={activity.id} className="text-sm">
                <button
                  onClick={() => hasDetails && toggleExpand(activity.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent transition-colors text-left",
                    activity.type === 'error' && "bg-destructive/10"
                  )}
                >
                  {hasDetails && (
                    <ChevronRight className={cn(
                      "w-3 h-3 transition-transform flex-shrink-0",
                      isExpanded && "rotate-90"
                    )} />
                  )}
                  {!hasDetails && <div className="w-3" />}
                  
                  <div className="flex-shrink-0">
                    {getIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sidebar-foreground/70">
                        {getLabel(activity.type)}
                      </span>
                      {activity.fileName && (
                        <span className="text-xs text-sidebar-foreground font-mono truncate">
                          {activity.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && activity.details && (
                  <div className="ml-9 mr-2 mt-1 mb-2 p-2 rounded-md bg-sidebar-accent/50 text-xs text-sidebar-foreground/80 font-mono break-words">
                    {activity.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityLog;
