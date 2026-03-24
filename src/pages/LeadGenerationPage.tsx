import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target, Mail, Globe, DollarSign, Users, TrendingUp, Plus,
  Filter, Rocket, Layers, MousePointerClick, Megaphone,
  Play, Pause, BarChart3, ArrowDownRight, ArrowUpRight,
  Send, Inbox, CreditCard, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

/* ── Campaigns ── */
const campaigns = [
  { name: "Enterprise AI GTM Launch", type: "Outbound", status: "active" as const, sent: 2400, opened: 864, replied: 192, meetings: 34, budget: "$4,200", channel: "Email + LinkedIn" },
  { name: "Content-Led Inbound", type: "Inbound", status: "active" as const, budget: "$1,800", channel: "Blog + SEO", visitors: 12400, leads: 342 },
  { name: "LinkedIn Thought Leadership", type: "Inbound", status: "active" as const, budget: "$500", channel: "LinkedIn", visitors: 45000, leads: 89 },
  { name: "Google Ads — AI GTM", type: "Paid", status: "active" as const, budget: "$8,500", channel: "Google Ads", clicks: 3200, conversions: 128 },
  { name: "LinkedIn Ads — Enterprise", type: "Paid", status: "paused" as const, budget: "$5,200", channel: "LinkedIn Ads", clicks: 1800, conversions: 45 },
  { name: "Retargeting — Website", type: "Paid", status: "active" as const, budget: "$2,100", channel: "Multi-channel", clicks: 890, conversions: 67 },
];

/* ── Lead DB ── */
const leadDatabase = [
  { name: "Sarah Chen", company: "TechFlow Inc", title: "VP of Sales", score: 92, status: "hot" as const, source: "Outbound" },
  { name: "Marcus Williams", company: "DataPrime", title: "CMO", score: 87, status: "hot" as const, source: "Inbound" },
  { name: "Elena Rodriguez", company: "ScaleUp AI", title: "Head of Growth", score: 78, status: "warm" as const, source: "LinkedIn Ads" },
  { name: "James Park", company: "CloudNext", title: "CRO", score: 72, status: "warm" as const, source: "Google Ads" },
  { name: "Lisa Thompson", company: "RevOps Co", title: "Dir Marketing", score: 65, status: "warm" as const, source: "Content" },
  { name: "David Kim", company: "GrowthStack", title: "CEO", score: 54, status: "cold" as const, source: "Outbound" },
];

/* ── Funnel ── */
const funnelStages = [
  { stage: "Visitors", count: 45200, pct: 100 },
  { stage: "Leads", count: 3420, pct: 7.6 },
  { stage: "MQLs", count: 1240, pct: 2.7 },
  { stage: "SQLs", count: 456, pct: 1.0 },
  { stage: "Opportunities", count: 178, pct: 0.4 },
  { stage: "Customers", count: 34, pct: 0.08 },
];

/* ── Optimization ── */
const optimizations = [
  { title: "A/B Test: Email Subject Lines", status: "Running", metric: "Variant B +23% open rate", icon: Mail, action: "Apply Winner" },
  { title: "Landing Page CTA Optimization", status: "Running", metric: "Green CTA +12% clicks", icon: MousePointerClick, action: "Apply Winner" },
  { title: "Ad Copy: Pain Point vs Benefit", status: "Complete", metric: "Pain point copy +18% CTR", icon: Megaphone, action: "View Results" },
  { title: "Lead Scoring Model Update", status: "Scheduled", metric: "AI recommends intent signals", icon: Target, action: "Review" },
  { title: "Funnel Drop-off Analysis", status: "Complete", metric: "MQL→SQL losing 64%", icon: Layers, action: "See Plan" },
];

/* ── Audience Targeting ── */
const audienceSegments = [
  { name: "Enterprise SaaS (50-500 emp)", size: "12,400", matchRate: 87, channels: ["LinkedIn Ads", "Email"], status: "active" },
  { name: "B2B Growth Teams", size: "8,900", matchRate: 92, channels: ["Google Ads", "Content"], status: "active" },
  { name: "Series A-C Startups", size: "5,200", matchRate: 78, channels: ["LinkedIn", "Retargeting"], status: "active" },
  { name: "Marketing Agencies", size: "3,100", matchRate: 64, channels: ["Email", "Webinars"], status: "paused" },
];

const statusColors = { active: "bg-success/10 text-success border-success/20", paused: "bg-warning/10 text-warning border-warning/20" };
const leadStatusColors = { hot: "bg-destructive/10 text-destructive border-destructive/20", warm: "bg-warning/10 text-warning border-warning/20", cold: "bg-muted text-muted-foreground border-border" };

const LeadGenerationPage = () => {
  const [activeTab, setActiveTab] = useState("campaigns");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Lead Generation</h1>
          <p className="text-sm text-muted-foreground mt-1">Inbound, outbound, and paid acquisition — campaigns, targeting, funnel, and optimization.</p>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4 mr-1" /> New Campaign</Button>
      </motion.div>

      {/* Channel summary cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Outbound", value: "192", icon: Send, sub: "Replies this month" },
          { label: "Inbound", value: "431", icon: Inbox, sub: "Leads this month" },
          { label: "Paid Ads", value: "$15.8K", icon: CreditCard, sub: "Spend this month" },
          { label: "Conversion Rate", value: "3.7%", icon: TrendingUp, sub: "+0.4% vs last month" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="targeting">Audience Targeting</TabsTrigger>
          <TabsTrigger value="leads">Lead Database</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="space-y-4 mt-4">
          {campaigns.map((camp, i) => (
            <motion.div key={camp.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    {camp.type === "Outbound" ? <Send className="w-[18px] h-[18px] text-accent" /> : camp.type === "Inbound" ? <Inbox className="w-[18px] h-[18px] text-accent" /> : <CreditCard className="w-[18px] h-[18px] text-accent" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold font-display text-foreground">{camp.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{camp.type}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[camp.status]}`}>{camp.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{camp.channel}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{camp.budget}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">{camp.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {camp.type === "Outbound" ? (
                  <>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Sent</p><p className="text-sm font-semibold text-foreground">{camp.sent?.toLocaleString()}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Opened</p><p className="text-sm font-semibold text-foreground">{camp.opened?.toLocaleString()}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Replied</p><p className="text-sm font-semibold text-foreground">{camp.replied}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Meetings</p><p className="text-sm font-semibold text-success">{camp.meetings}</p></div>
                  </>
                ) : camp.type === "Inbound" ? (
                  <>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Visitors</p><p className="text-sm font-semibold text-foreground">{(camp as any).visitors?.toLocaleString()}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Leads</p><p className="text-sm font-semibold text-foreground">{(camp as any).leads?.toLocaleString()}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Conv. Rate</p><p className="text-sm font-semibold text-foreground">{(((camp as any).leads / (camp as any).visitors) * 100).toFixed(1)}%</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Budget</p><p className="text-sm font-semibold text-foreground">{camp.budget}</p></div>
                  </>
                ) : (
                  <>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Clicks</p><p className="text-sm font-semibold text-foreground">{(camp as any).clicks?.toLocaleString()}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Conversions</p><p className="text-sm font-semibold text-foreground">{(camp as any).conversions}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">CPC</p><p className="text-sm font-semibold text-foreground">${((camp as any).clicks ? (parseFloat(camp.budget.replace(/[$,K]/g, "")) * 1000 / (camp as any).clicks).toFixed(2) : "—")}</p></div>
                    <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">CPA</p><p className="text-sm font-semibold text-foreground">${((camp as any).conversions ? (parseFloat(camp.budget.replace(/[$,K]/g, "")) * 1000 / (camp as any).conversions).toFixed(0) : "—")}</p></div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* AUDIENCE TARGETING */}
        <TabsContent value="targeting" className="space-y-4 mt-4">
          {audienceSegments.map((seg, i) => (
            <motion.div key={seg.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Target className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{seg.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{seg.size} contacts</span>
                    {seg.channels.map(ch => <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Match Rate</p>
                  <p className={`text-sm font-bold ${seg.matchRate >= 80 ? "text-success" : "text-warning"}`}>{seg.matchRate}%</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[seg.status as keyof typeof statusColors]}`}>{seg.status}</Badge>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* LEAD DATABASE */}
        <TabsContent value="leads" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display text-foreground">Lead Database</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs"><Filter className="w-3.5 h-3.5 mr-1" /> Filter</Button>
                <Button size="sm" className="text-xs bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-3.5 h-3.5 mr-1" /> Add Lead</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Source</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {leadDatabase.map((lead, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{lead.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.company}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.title}</td>
                      <td className="px-4 py-3 text-center"><span className={`font-semibold ${lead.score >= 80 ? "text-success" : lead.score >= 60 ? "text-warning" : "text-muted-foreground"}`}>{lead.score}</span></td>
                      <td className="px-4 py-3 text-center"><Badge variant="outline" className={`text-[10px] ${leadStatusColors[lead.status]}`}>{lead.status}</Badge></td>
                      <td className="px-4 py-3 text-center"><Badge variant="outline" className="text-[10px]">{lead.source}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* FUNNEL */}
        <TabsContent value="funnel" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-6 shadow-card">
            <h3 className="text-sm font-semibold font-display text-foreground mb-6">Conversion Funnel</h3>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => (
                <div key={stage.stage} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground w-24">{stage.stage}</span>
                  <div className="flex-1">
                    <div className="h-8 rounded-md bg-muted/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(stage.pct, 2)}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="h-full bg-accent/20 flex items-center px-3">
                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">{stage.count.toLocaleString()}</span>
                      </motion.div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{stage.pct}%</span>
                  {i > 0 && <span className="text-[10px] text-muted-foreground w-16 text-right">{((funnelStages[i].count / funnelStages[i - 1].count) * 100).toFixed(1)}% conv</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* OPTIMIZATION */}
        <TabsContent value="optimization" className="space-y-4 mt-4">
          {optimizations.map((opt, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><opt.icon className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-foreground">{opt.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={`text-[10px] ${opt.status === "Running" ? "bg-accent/10 text-accent border-accent/20" : opt.status === "Complete" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>{opt.status}</Badge>
                    <span className="text-xs text-muted-foreground">{opt.metric}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs">{opt.action}</Button>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadGenerationPage;
