import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "idle" | "paused";
  lastUpdate?: string;
  metric?: { label: string; value: string };
  delay?: number;
}

const statusColors = {
  active: "bg-success",
  idle: "bg-muted-foreground",
  paused: "bg-warning",
};

const AgentCard = ({ title, description, icon: Icon, status, lastUpdate, metric, delay = 0 }: AgentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.08, ease: "easeOut" }}
      className="bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow group cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-accent" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} ${status === "active" ? "animate-pulse-dot" : ""}`} />
          <span className="text-[11px] font-medium text-muted-foreground capitalize">{status}</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-foreground font-display mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
      {metric && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">{metric.label}</span>
            <span className="text-sm font-semibold text-foreground font-display">{metric.value}</span>
          </div>
        </div>
      )}
      {lastUpdate && !metric && (
        <p className="text-[11px] text-muted-foreground pt-3 border-t border-border">
          Updated {lastUpdate}
        </p>
      )}
    </motion.div>
  );
};

export default AgentCard;
