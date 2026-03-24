import { Brain, Clock, CheckCircle2 } from "lucide-react";

const StrategyHeader = () => {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          <span className="text-xs font-medium text-muted-foreground">Strategy Core Active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last review: 2 hours ago</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="w-3 h-3" />
          <span className="font-medium">5 agents running</span>
        </div>
      </div>
    </header>
  );
};

export default StrategyHeader;
