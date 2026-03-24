import { motion } from "framer-motion";
import {
  Beaker, Lightbulb, Target, Rocket, BarChart3, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const experiments = [
  { name: "AI GTM positioning test", status: "active" as const, phase: "Market Testing", progress: 65, metric: "142 survey responses", insight: "78% prefer 'AI team' framing over 'automation platform'" },
  { name: "Enterprise pricing validation", status: "active" as const, phase: "Pricing Test", progress: 40, metric: "$2,499 sweet spot confirmed", insight: "Willingness-to-pay peaks at $2,500 for enterprise" },
  { name: "Outbound cold email test", status: "completed" as const, phase: "Pilot Campaign", progress: 100, metric: "23% reply rate", insight: "Pain-point opener outperforms benefit-led by 2.3x" },
  { name: "Healthcare vertical fit", status: "active" as const, phase: "Idea Validation", progress: 25, metric: "12 interviews completed", insight: "Strong need but compliance concerns noted" },
];

const statusColors = { active: "bg-accent/10 text-accent border-accent/20", completed: "bg-success/10 text-success border-success/20" };

const PreFortitudePage = () => (
  <div className="max-w-5xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Beaker className="w-5 h-5 text-accent" /></div>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Pre-Fortitude AI</h1>
          <p className="text-sm text-muted-foreground">Validate ideas, test markets, and run pilot campaigns before full implementation.</p>
        </div>
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Active Experiments", value: "3", icon: Beaker, sub: "1 completed" },
        { label: "Ideas Validated", value: "7", icon: Lightbulb, sub: "This quarter" },
        { label: "Pilot Campaigns", value: "4", icon: Rocket, sub: "2 successful" },
        { label: "PMF Score", value: "72%", icon: Target, sub: "+8 this month" },
      ].map((m, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
        </div>
      ))}
    </motion.div>

    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-display text-foreground">Experiments</h2>
      {experiments.map((exp, i) => (
        <motion.div key={exp.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="bg-card border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold font-display text-foreground">{exp.name}</h3>
                <Badge variant="outline" className={`text-[10px] ${statusColors[exp.status]}`}>{exp.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{exp.phase}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{exp.metric}</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              {exp.status === "completed" ? "Integrate" : "View"} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <Progress value={exp.progress} className="h-1.5 mb-2" />
          <div className="flex items-center gap-2 text-xs">
            <Lightbulb className="w-3 h-3 text-accent flex-shrink-0" />
            <span className="text-foreground">{exp.insight}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default PreFortitudePage;
