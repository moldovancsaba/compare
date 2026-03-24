import {
  Brain, Eye, TrendingUp, Target, BarChart3, Users, Zap,
  Paintbrush, PenTool, Package, Search, ArrowRight, Activity,
  Bell, CheckCircle2, AlertTriangle, Clock, Beaker, ChevronRight,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const moduleStatus = [
  { name: "Strategy", path: "/strategy", icon: Brain, health: 92, status: "Configured", color: "text-success", description: "Core business foundation & decision engine" },
  { name: "Market Intelligence", path: "/intelligence", icon: Search, health: 88, status: "6 agents active", color: "text-success", description: "AI-powered market & competitor monitoring" },
  { name: "Portfolio & Offerings", path: "/portfolio", icon: Package, health: 76, status: "3 updates needed", color: "text-warning", description: "Products, pricing & positioning management" },
  { name: "Brand Management", path: "/brand", icon: Paintbrush, health: 78, status: "2 drafts pending", color: "text-warning", description: "Brand identity, guidelines & messaging" },
  { name: "Digital Presence", path: "/content", icon: PenTool, health: 85, status: "Active", color: "text-success", description: "Website, content & asset creation" },
  { name: "Lead Generation", path: "/leads", icon: Target, health: 90, status: "5 campaigns", color: "text-success", description: "Inbound, outbound & paid acquisition" },
  { name: "CRM & Automation", path: "/crm", icon: Users, health: 82, status: "8 deals active", color: "text-success", description: "Pipeline, leads & customer management" },
  { name: "Pre-Fortitude AI", path: "/pre-fortitude", icon: Beaker, health: 65, status: "2 experiments", color: "text-muted-foreground", description: "Idea validation & market testing" },
];

const timelineEvents = [
  { text: "Competitor 'Acme Corp' updated pricing — 15% increase on Enterprise tier", time: "12 min ago", type: "alert" as const, source: "Market Intelligence", icon: AlertTriangle },
  { text: "Generated 34 new leads matching your ICP in the healthcare vertical", time: "45 min ago", type: "success" as const, source: "Lead Generation", icon: CheckCircle2 },
  { text: "Brand sentiment analysis complete — overall positive trend (+8%)", time: "1 hour ago", type: "info" as const, source: "Brand Management", icon: Activity },
  { text: "Weekly strategy checkpoint due — review market position changes", time: "2 hours ago", type: "alert" as const, source: "Strategy", icon: Clock },
  { text: "Campaign A/B test results: Variant B outperforms by 23% CTR", time: "3 hours ago", type: "success" as const, source: "Lead Generation", icon: CheckCircle2 },
  { text: "New content recommendation: 'How AI is Transforming B2B Sales in 2026'", time: "4 hours ago", type: "info" as const, source: "Digital Presence", icon: Activity },
  { text: "Portfolio pricing misaligned with market — review suggested", time: "5 hours ago", type: "alert" as const, source: "Portfolio", icon: AlertTriangle },
];

const strategicPriorities = [
  { label: "Expand into healthcare vertical", progress: 68, status: "On track" },
  { label: "Launch premium tier pricing", progress: 42, status: "In progress" },
  { label: "Improve lead-to-close ratio by 15%", progress: 85, status: "Ahead" },
];

const typeStyles = {
  alert: "bg-warning/15 text-warning border-warning/20",
  success: "bg-success/15 text-success border-success/20",
  info: "bg-accent/15 text-accent border-accent/20",
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of your business — KPIs, modules, agents, and activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            All systems operational
          </Badge>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active AI Agents" value="6" change="+2 this week" changeType="positive" icon={Zap} delay={0} />
        <MetricCard label="Leads Generated" value="1,247" change="+18% vs last month" changeType="positive" icon={Target} delay={1} />
        <MetricCard label="Pipeline Value" value="$432K" change="+$86K this month" changeType="positive" icon={BarChart3} delay={2} />
        <MetricCard label="Market Alerts" value="23" change="3 critical" changeType="negative" icon={Eye} delay={3} />
      </div>

      {/* Two-column: Modules + Strategic Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Modules — 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display text-foreground">Platform Modules</h2>
            <span className="text-xs text-muted-foreground">8 modules</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-lg shadow-[var(--shadow-card)] divide-y divide-border">
            {moduleStatus.map((mod, i) => (
              <motion.div key={mod.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.03 }}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => navigate(mod.path)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <mod.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{mod.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{mod.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] ${mod.color} border-current/20`}>{mod.status}</Badge>
                  <div className="hidden sm:flex items-center gap-2">
                    <Progress value={mod.health} className="w-16 h-1.5" />
                    <span className="text-[11px] font-medium text-muted-foreground w-7">{mod.health}%</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Strategic Priorities — 1 col */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display text-foreground">Strategic Priorities</h2>
            <button onClick={() => navigate("/strategy")} className="text-xs text-accent hover:underline">View all</button>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg shadow-[var(--shadow-card)] divide-y divide-border">
            {strategicPriorities.map((p, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="flex-1 h-1.5" />
                  <span className="text-[11px] font-medium text-muted-foreground">{p.progress}%</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mt-4 bg-card border border-border rounded-lg shadow-[var(--shadow-card)] p-5">
            <h3 className="text-sm font-semibold font-display text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Run weekly checkpoint", icon: Brain, path: "/strategy" },
                { label: "Review market alerts", icon: Bell, path: "/intelligence" },
                { label: "Update portfolio pricing", icon: Package, path: "/portfolio" },
              ].map((action) => (
                <button key={action.label} onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left">
                  <action.icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  {action.label}
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-foreground">Activity Timeline</h2>
          <span className="text-xs text-muted-foreground">Last 24 hours</span>
        </div>
        <div className="bg-card border border-border rounded-lg divide-y divide-border shadow-[var(--shadow-card)]">
          {timelineEvents.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.04 }}
              className="px-5 py-3.5 flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${typeStyles[item.type]}`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground">{item.text}</span>
                <Badge variant="outline" className="text-[9px] ml-2 bg-muted/50 align-middle">{item.source}</Badge>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
