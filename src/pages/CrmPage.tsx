import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Mail, Phone, Calendar, ArrowRight, Plus, Filter, Search,
  BarChart3, Clock, CheckCircle2, AlertCircle, TrendingUp, DollarSign,
  MessageSquare, Zap, Layers, Target, Play, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

/* ── Pipeline ── */
const pipelineStages = [
  { name: "New Leads", deals: [
    { name: "TechFlow Inc", contact: "Sarah Chen", value: "$24,000", daysInStage: 2, nextAction: "Send intro email", source: "Outbound" },
    { name: "DataPrime", contact: "Marcus Williams", value: "$48,000", daysInStage: 1, nextAction: "Research company", source: "Inbound" },
  ]},
  { name: "Contacted", deals: [
    { name: "ScaleUp AI", contact: "Elena Rodriguez", value: "$36,000", daysInStage: 5, nextAction: "Follow up on demo request", source: "LinkedIn Ads" },
    { name: "CloudNext", contact: "James Park", value: "$60,000", daysInStage: 3, nextAction: "Schedule discovery call", source: "Google Ads" },
  ]},
  { name: "Demo Scheduled", deals: [
    { name: "RevOps Co", contact: "Lisa Thompson", value: "$18,000", daysInStage: 2, nextAction: "Prepare demo deck", source: "Content" },
  ]},
  { name: "Proposal Sent", deals: [
    { name: "GrowthStack", contact: "David Kim", value: "$96,000", daysInStage: 7, nextAction: "Follow up on proposal", source: "Outbound" },
    { name: "Nexus Labs", contact: "Amy Foster", value: "$30,000", daysInStage: 4, nextAction: "Address pricing questions", source: "Referral" },
  ]},
  { name: "Negotiation", deals: [
    { name: "Vertex AI", contact: "Robert Chang", value: "$120,000", daysInStage: 10, nextAction: "Send revised terms", source: "Outbound" },
  ]},
];

/* ── Automations ── */
const automations = [
  { name: "New Lead Welcome Sequence", status: "active" as const, triggered: 342, lastRun: "12 min ago", type: "Email", steps: 5, convRate: "24%" },
  { name: "Demo No-Show Follow-up", status: "active" as const, triggered: 23, lastRun: "2 hours ago", type: "Email + SMS", steps: 3, convRate: "31%" },
  { name: "Proposal Follow-up (Day 3)", status: "active" as const, triggered: 56, lastRun: "1 hour ago", type: "Email", steps: 4, convRate: "18%" },
  { name: "Cold Lead Re-engagement", status: "paused" as const, triggered: 189, lastRun: "3 days ago", type: "Email", steps: 6, convRate: "8%" },
  { name: "Meeting Booked Confirmation", status: "active" as const, triggered: 78, lastRun: "30 min ago", type: "Email + Calendar", steps: 2, convRate: "92%" },
  { name: "Won Deal Onboarding", status: "active" as const, triggered: 34, lastRun: "1 day ago", type: "Email + Slack", steps: 8, convRate: "96%" },
];

/* ── Campaign Performance ── */
const campaignPerformance = [
  { campaign: "Enterprise AI GTM Launch", leads: 192, qualified: 67, converted: 12, revenue: "$288K", roi: "6.8x" },
  { campaign: "Content-Led Inbound", leads: 342, qualified: 89, converted: 18, revenue: "$162K", roi: "9.0x" },
  { campaign: "Google Ads — AI GTM", leads: 128, qualified: 45, converted: 8, revenue: "$96K", roi: "1.1x" },
  { campaign: "LinkedIn Ads — Enterprise", leads: 45, qualified: 12, converted: 3, revenue: "$72K", roi: "1.4x" },
];

/* ── Activity Feed ── */
const activities = [
  { text: "Email sent to Sarah Chen (TechFlow Inc)", type: "email" as const, time: "12 min ago", auto: true },
  { text: "Demo scheduled with Lisa Thompson (RevOps Co)", type: "meeting" as const, time: "45 min ago", auto: false },
  { text: "Proposal opened by David Kim (GrowthStack) — 3rd view", type: "alert" as const, time: "1 hour ago", auto: true },
  { text: "Call completed with James Park (CloudNext) — 18 min", type: "call" as const, time: "2 hours ago", auto: false },
  { text: "Lead scored: Marcus Williams moved to 'Hot' (87)", type: "system" as const, time: "3 hours ago", auto: true },
  { text: "Follow-up reminder: Nexus Labs proposal — day 4", type: "reminder" as const, time: "3 hours ago", auto: true },
  { text: "Robert Chang (Vertex AI) replied to revised terms", type: "email" as const, time: "4 hours ago", auto: false },
  { text: "New lead from Google Ads: TechVenture Corp", type: "system" as const, time: "5 hours ago", auto: true },
];

const statusColors = { active: "bg-success/10 text-success border-success/20", paused: "bg-warning/10 text-warning border-warning/20" };
const activityIcons: Record<string, any> = { email: Mail, meeting: Calendar, call: Phone, alert: AlertCircle, system: Zap, reminder: Clock };

const CrmPage = () => {
  const [activeTab, setActiveTab] = useState("pipeline");
  const totalPipeline = pipelineStages.reduce((sum, stage) => sum + stage.deals.reduce((s, d) => s + parseInt(d.value.replace(/[$,]/g, "")), 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">CRM & Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Lead database, pipeline tracking, campaign automation, and customer relationship management.</p>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4 mr-1" /> Add Contact</Button>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Value", value: `$${(totalPipeline / 1000).toFixed(0)}K`, icon: DollarSign, sub: `${pipelineStages.reduce((s, st) => s + st.deals.length, 0)} deals` },
          { label: "Automations Active", value: automations.filter(a => a.status === "active").length.toString(), icon: Zap, sub: `${automations.reduce((s, a) => s + a.triggered, 0)} triggered` },
          { label: "Campaign ROI", value: "4.6x", icon: TrendingUp, sub: "Avg across campaigns" },
          { label: "Meetings This Week", value: "8", icon: Calendar, sub: "3 upcoming" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* PIPELINE */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipelineStages.map((stage, i) => (
              <motion.div key={stage.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="min-w-[260px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage.name}</h3>
                  <Badge variant="outline" className="text-[10px]">{stage.deals.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stage.deals.map((deal, j) => (
                    <div key={j} className="bg-card border border-border rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                      <h4 className="text-sm font-semibold text-foreground">{deal.name}</h4>
                      <p className="text-xs text-muted-foreground">{deal.contact}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-accent">{deal.value}</span>
                        <span className="text-[10px] text-muted-foreground">{deal.daysInStage}d in stage</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">Next: <span className="text-foreground">{deal.nextAction}</span></p>
                        <Badge variant="outline" className="text-[9px]">{deal.source}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* AUTOMATIONS */}
        <TabsContent value="automations" className="space-y-4 mt-4">
          {automations.map((auto, i) => (
            <motion.div key={auto.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Zap className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-foreground">{auto.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[auto.status]}`}>{auto.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{auto.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{auto.steps} steps</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{auto.triggered} triggered</p>
                <p className="text-[10px] text-muted-foreground">Conv: {auto.convRate} · Last: {auto.lastRun}</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* CAMPAIGN PERFORMANCE */}
        <TabsContent value="campaigns" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Campaign → CRM Performance</h3>
              <p className="text-xs text-muted-foreground">Which lead generation activities produce the best results</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qualified</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Converted</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Revenue</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">ROI</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {campaignPerformance.map((cp, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{cp.campaign}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{cp.leads}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{cp.qualified}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{cp.converted}</td>
                      <td className="px-4 py-3 text-center font-semibold text-success">{cp.revenue}</td>
                      <td className="px-4 py-3 text-center"><Badge variant="outline" className={`text-[10px] ${parseFloat(cp.roi) >= 5 ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>{cp.roi}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* ACTIVITY FEED */}
        <TabsContent value="activity" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg shadow-card divide-y divide-border">
            {activities.map((act, i) => {
              const Icon = activityIcons[act.type] || Zap;
              return (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      act.type === "alert" ? "text-warning" : act.type === "meeting" ? "text-accent" : "text-muted-foreground"
                    }`} />
                    <div>
                      <p className="text-sm text-foreground">{act.text}</p>
                      {act.auto && <Badge variant="outline" className="text-[9px] mt-0.5 bg-accent/5 text-accent border-accent/20">Automated</Badge>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{act.time}</span>
                </div>
              );
            })}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmPage;
