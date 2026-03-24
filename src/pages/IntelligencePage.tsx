import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Eye, TrendingUp, TrendingDown, Globe, AlertTriangle, BarChart3,
  ArrowUpRight, RefreshCw, Filter, Bell, ExternalLink,
  FileText, DollarSign, Download, Calendar, Users, Target,
  MessageSquare, Heart, ShoppingCart, Layers, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Data ─── */
const competitors = [
  {
    name: "Acme Corp", domain: "acmecorp.com", threatLevel: 87,
    recentChanges: [
      { type: "pricing", detail: "Enterprise tier increased 15%", date: "2 hours ago", severity: "high" as const },
      { type: "product", detail: "Launched AI analytics module", date: "1 day ago", severity: "high" as const },
      { type: "content", detail: "Published 3 new case studies", date: "3 days ago", severity: "low" as const },
    ],
    metrics: { traffic: "+12%", adSpend: "$45K/mo", contentFreq: "8/week", socialGrowth: "+3.2%" },
  },
  {
    name: "NovaTech", domain: "novatech.io", threatLevel: 72,
    recentChanges: [
      { type: "positioning", detail: "Rebranded as 'AI-first' platform", date: "5 hours ago", severity: "medium" as const },
      { type: "hiring", detail: "Posted 12 new sales roles", date: "2 days ago", severity: "medium" as const },
    ],
    metrics: { traffic: "+8%", adSpend: "$32K/mo", contentFreq: "5/week", socialGrowth: "+1.8%" },
  },
  {
    name: "Stratify", domain: "stratify.co", threatLevel: 58,
    recentChanges: [
      { type: "product", detail: "Added Slack integration", date: "1 day ago", severity: "low" as const },
      { type: "pricing", detail: "Introduced free tier", date: "4 days ago", severity: "medium" as const },
    ],
    metrics: { traffic: "-3%", adSpend: "$18K/mo", contentFreq: "3/week", socialGrowth: "+0.5%" },
  },
];

const timelineEvents = [
  { text: "Acme Corp launched 20% off annual plans", source: "Website + Email", time: "2h ago", type: "pricing" },
  { text: "NovaTech rebranded as 'AI-first platform'", source: "Website", time: "5h ago", type: "brand" },
  { text: "New AI GTM startup 'PipelineAI' raised $8M seed", source: "TechCrunch", time: "8h ago", type: "market" },
  { text: "Stratify posted 3 new LinkedIn thought-leadership articles", source: "LinkedIn", time: "12h ago", type: "content" },
  { text: "Industry report: AI GTM category growing 34% YoY", source: "Gartner", time: "1d ago", type: "market" },
  { text: "Acme Corp increased Google Ads spend by ~30%", source: "SpyFu", time: "1d ago", type: "ads" },
  { text: "EU regulatory update affecting outbound automation", source: "Reuters", time: "2d ago", type: "regulatory" },
  { text: "GrowthOS launched podcast 'The GTM Show'", source: "Spotify", time: "3d ago", type: "content" },
];

const contentCalendar = [
  { competitor: "Acme Corp", lastWeek: 8, thisWeek: 10, prediction: 12, topContent: "AI Analytics launch blog", channels: ["Blog", "LinkedIn", "Twitter"] },
  { competitor: "NovaTech", lastWeek: 5, thisWeek: 7, prediction: 6, topContent: "AI-first rebrand announcement", channels: ["Blog", "LinkedIn"] },
  { competitor: "Stratify", lastWeek: 3, thisWeek: 4, prediction: 5, topContent: "Free tier launch post", channels: ["Blog", "Twitter"] },
  { competitor: "GrowthOS", lastWeek: 2, thisWeek: 3, prediction: 4, topContent: "Podcast episode #1", channels: ["Podcast", "LinkedIn"] },
  { competitor: "You", lastWeek: 6, thisWeek: 5, prediction: 8, topContent: "AI GTM Tools blog", channels: ["Blog", "LinkedIn", "Email"] },
];

const customerSegments = [
  { name: "Enterprise Tech", size: "2,400 companies", growth: "+12%", buyingMotivation: "Efficiency & scale", decisionProcess: "Committee (6-8 weeks)", satisfaction: 78 },
  { name: "Mid-Market SaaS", size: "8,200 companies", growth: "+18%", buyingMotivation: "Growth acceleration", decisionProcess: "Champion-led (3-4 weeks)", satisfaction: 82 },
  { name: "SMB / Startups", size: "34,000 companies", growth: "+24%", buyingMotivation: "Cost-effective GTM", decisionProcess: "Founder decision (1-2 weeks)", satisfaction: 71 },
  { name: "Healthcare", size: "1,800 companies", growth: "+8%", buyingMotivation: "Compliance + growth", decisionProcess: "Multi-stakeholder (8-12 weeks)", satisfaction: 74 },
];

const marketAnalysis = {
  marketSize: "$8.2B", cagr: "34%", saturation: "Low-Medium",
  trends: [
    "AI-powered GTM platforms growing fastest in category",
    "Shift from point solutions to unified platforms",
    "Buyers expect continuous intelligence, not static reports",
    "Privacy regulations pushing inbound-first strategies",
  ],
  economicFactors: [
    "VC funding for GTM tech up 28% in Q1 2026",
    "Enterprise budgets shifting from headcount to automation",
    "EU GDPR enforcement increasing — outbound compliance costs rising",
  ],
};

const productIntelligence = [
  { product: "AI Strategy Agent", adoption: 89, satisfaction: 84, revenue: "$420K/mo", competitorParity: "Unique — no direct competitor" },
  { product: "Competitor Monitor", adoption: 76, satisfaction: 78, revenue: "$280K/mo", competitorParity: "Acme Corp has similar" },
  { product: "Content Creation", adoption: 62, satisfaction: 71, revenue: "$180K/mo", competitorParity: "Multiple competitors" },
  { product: "Lead Generation", adoption: 81, satisfaction: 80, revenue: "$340K/mo", competitorParity: "GrowthOS has basic version" },
];

const stpData = {
  segments: [
    { name: "Enterprise Tech", profitability: "High", growth: "Medium", conversion: "12%", priority: "Primary" },
    { name: "Mid-Market SaaS", profitability: "Medium", growth: "High", conversion: "18%", priority: "Primary" },
    { name: "SMB / Startups", profitability: "Low", growth: "Very High", conversion: "24%", priority: "Secondary" },
    { name: "Healthcare", profitability: "High", growth: "Low", conversion: "8%", priority: "Emerging" },
  ],
  positioning: {
    uvp: "The only AI GTM platform with a central strategy brain that aligns all marketing, sales, and intelligence agents automatically.",
    differentiators: ["Unified strategy-to-execution", "Continuous intelligence (not static)", "AI agents that act, not just advise", "Single platform replacing 12+ tools"],
  },
};

const reports = [
  { title: "Daily Promotions Report", date: "Today", category: "Promotions", items: [
    { competitor: "Acme Corp", activity: "20% off annual plans for new customers", channel: "Website + Email", impact: "high" as const },
    { competitor: "NovaTech", activity: "Free trial extended from 14 to 30 days", channel: "Website", impact: "medium" as const },
  ]},
  { title: "Product & Services Comparison", date: "Today", category: "Products", items: [
    { competitor: "Acme Corp", activity: "Launched AI analytics module with 15+ integrations", channel: "Product", impact: "high" as const },
    { competitor: "Stratify", activity: "Added Slack integration + webhook API", channel: "Product", impact: "medium" as const },
  ]},
  { title: "Ads & Paid Activity Report", date: "Today", category: "Ads", items: [
    { competitor: "Acme Corp", activity: "Increased Google Ads spend ~30%, targeting 'AI GTM' keywords", channel: "Google Ads", impact: "high" as const },
    { competitor: "NovaTech", activity: "New LinkedIn campaign: 'AI-first GTM' positioning", channel: "LinkedIn Ads", impact: "high" as const },
  ]},
];

const alerts = [
  { text: "Acme Corp raised prices on Enterprise tier by 15%", severity: "critical" as const, time: "2 hours ago", actionable: true },
  { text: "NovaTech rebranded as 'AI-first' — potential positioning conflict", severity: "warning" as const, time: "5 hours ago", actionable: true },
  { text: "Market report: AI GTM category growing 34% YoY", severity: "info" as const, time: "Today", actionable: false },
  { text: "Stratify introduced a free tier — may impact your SMB pipeline", severity: "warning" as const, time: "1 day ago", actionable: true },
  { text: "New regulatory changes affecting outbound in EU markets", severity: "warning" as const, time: "3 days ago", actionable: true },
];

const severityColors = { high: "bg-destructive/10 text-destructive border-destructive/20", medium: "bg-warning/10 text-warning border-warning/20", low: "bg-muted text-muted-foreground border-border" };
const alertSeverityColors = { critical: "border-l-destructive bg-destructive/5", warning: "border-l-warning bg-warning/5", info: "border-l-accent bg-accent/5" };
const eventColors: Record<string, string> = { pricing: "bg-destructive", brand: "bg-accent", market: "bg-success", content: "bg-warning", ads: "bg-accent", regulatory: "bg-destructive", };

/* ─── Component ─── */
const IntelligencePage = () => {
  const [activeTab, setActiveTab] = useState("monitoring");
  const [reportFilter, setReportFilter] = useState("all");
  const filteredReports = reportFilter === "all" ? reports : reports.filter(r => r.category.toLowerCase() === reportFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Market Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">AI agents continuously monitoring your market, competitors, and customers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><RefreshCw className="w-4 h-4 mr-1" /> Refresh Intel</Button>
        </div>
      </motion.div>

      {/* Summary metrics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Competitors Tracked", value: "12", icon: Eye, change: "+2 new" },
          { label: "Market Signals", value: "47", icon: TrendingUp, change: "+18 vs last week" },
          { label: "Critical Alerts", value: "3", icon: AlertTriangle, change: "Action needed" },
          { label: "Customer Segments", value: "4", icon: Users, change: "All monitored" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              <m.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{m.value}</span>
              <span className="text-xs text-muted-foreground">{m.change}</span>
            </div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="monitoring" className="text-xs">Core Monitoring</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Activity Timeline</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">Content Calendar</TabsTrigger>
          <TabsTrigger value="customer" className="text-xs">Customer Intel</TabsTrigger>
          <TabsTrigger value="market" className="text-xs">Market Analysis</TabsTrigger>
          <TabsTrigger value="product" className="text-xs">Product Intel</TabsTrigger>
          <TabsTrigger value="stp" className="text-xs">STP</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
        </TabsList>

        {/* CORE MONITORING */}
        <TabsContent value="monitoring" className="space-y-4 mt-4">
          {competitors.map((comp, i) => (
            <motion.div key={comp.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Globe className="w-5 h-5 text-accent" /></div>
                    <div>
                      <h3 className="text-sm font-semibold font-display text-foreground">{comp.name}</h3>
                      <p className="text-xs text-muted-foreground">{comp.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground mb-1">Threat Level</p>
                      <div className="flex items-center gap-2">
                        <Progress value={comp.threatLevel} className="w-20 h-1.5" />
                        <span className={`text-xs font-semibold ${comp.threatLevel >= 70 ? "text-destructive" : comp.threatLevel >= 50 ? "text-warning" : "text-success"}`}>{comp.threatLevel}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[{ label: "Traffic", value: comp.metrics.traffic }, { label: "Est. Ad Spend", value: comp.metrics.adSpend }, { label: "Content Freq.", value: comp.metrics.contentFreq }, { label: "Social Growth", value: comp.metrics.socialGrowth }].map((metric) => (
                    <div key={metric.label} className="bg-muted/50 rounded-md px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{metric.label}</p>
                      <p className="text-sm font-semibold text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Recent Changes</p>
                  {comp.recentChanges.map((change, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityColors[change.severity]}`}>{change.severity}</Badge>
                        <span className="text-xs text-foreground">{change.detail}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{change.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* ACTIVITY TIMELINE */}
        <TabsContent value="timeline" className="mt-4">
          <div className="bg-card border border-border rounded-lg shadow-card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display text-foreground">Business Activity Timeline</h3>
              <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Refreshes every 15 min</Badge>
            </div>
            <div className="divide-y divide-border">
              {timelineEvents.map((event, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${eventColors[event.type] || "bg-muted-foreground"}`} />
                    <div>
                      <span className="text-sm text-foreground">{event.text}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">via {event.source}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{event.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* CONTENT CALENDAR */}
        <TabsContent value="calendar" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Competitive Content Calendar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Content activity and predicted schedules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Company</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Last Week</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">This Week</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Predicted Next</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Top Content</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contentCalendar.map((row, i) => (
                    <tr key={i} className={`hover:bg-muted/20 transition-colors ${row.competitor === "You" ? "bg-accent/5" : ""}`}>
                      <td className="px-5 py-3 font-semibold text-foreground">{row.competitor}</td>
                      <td className="px-4 py-3 text-center text-foreground">{row.lastWeek} posts</td>
                      <td className="px-4 py-3 text-center text-foreground">{row.thisWeek} posts</td>
                      <td className="px-4 py-3 text-center font-semibold text-accent">{row.prediction} posts</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.topContent}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">{row.channels.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* CUSTOMER INTELLIGENCE */}
        <TabsContent value="customer" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerSegments.map((seg, i) => (
              <motion.div key={seg.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold font-display text-foreground">{seg.name}</h3>
                  <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/20">{seg.size}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Growth</p><p className="text-sm font-semibold text-success">{seg.growth}</p></div>
                  <div className="bg-muted/50 rounded-md px-3 py-2"><p className="text-[10px] text-muted-foreground">Satisfaction</p><p className="text-sm font-semibold text-foreground">{seg.satisfaction}%</p></div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Motivation: <span className="text-foreground">{seg.buyingMotivation}</span></p>
                  <p>Decision: <span className="text-foreground">{seg.decisionProcess}</span></p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* MARKET ANALYSIS */}
        <TabsContent value="market" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">Market Size</p>
              <p className="text-2xl font-bold font-display text-foreground">{marketAnalysis.marketSize}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">CAGR</p>
              <p className="text-2xl font-bold font-display text-success">{marketAnalysis.cagr}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">Saturation</p>
              <p className="text-2xl font-bold font-display text-foreground">{marketAnalysis.saturation}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg shadow-card">
              <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold font-display text-foreground">Industry Trends</h3></div>
              <div className="p-5 space-y-2">
                {marketAnalysis.trends.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground"><TrendingUp className="w-3 h-3 text-accent flex-shrink-0" />{t}</div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg shadow-card">
              <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold font-display text-foreground">Economic & Regulatory</h3></div>
              <div className="p-5 space-y-2">
                {marketAnalysis.economicFactors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground"><DollarSign className="w-3 h-3 text-warning flex-shrink-0" />{f}</div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PRODUCT INTELLIGENCE */}
        <TabsContent value="product" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Product Performance & Intelligence</h3>
            </div>
            <div className="divide-y divide-border">
              {productIntelligence.map((p, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">{p.product}</h4>
                    <span className="text-sm font-bold text-accent">{p.revenue}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div><p className="text-[10px] text-muted-foreground">Adoption</p><Progress value={p.adoption} className="h-1.5 mt-1" /><p className="text-[10px] text-foreground mt-0.5">{p.adoption}%</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Satisfaction</p><Progress value={p.satisfaction} className="h-1.5 mt-1" /><p className="text-[10px] text-foreground mt-0.5">{p.satisfaction}%</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Competitor Parity</p><p className="text-xs text-foreground mt-1">{p.competitorParity}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* STP */}
        <TabsContent value="stp" className="mt-4 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold font-display text-foreground">Segmentation & Targeting</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Segment</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Profitability</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Growth</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Conversion</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stpData.segments.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-5 py-3 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-center">{s.profitability}</td>
                      <td className="px-4 py-3 text-center">{s.growth}</td>
                      <td className="px-4 py-3 text-center">{s.conversion}</td>
                      <td className="px-4 py-3 text-center"><Badge variant="outline" className={`text-[10px] ${s.priority === "Primary" ? "bg-success/10 text-success border-success/20" : s.priority === "Secondary" ? "bg-accent/10 text-accent border-accent/20" : "bg-warning/10 text-warning border-warning/20"}`}>{s.priority}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <h3 className="text-sm font-semibold font-display text-foreground mb-3">Positioning</h3>
            <div className="bg-accent/5 rounded-md px-4 py-3 border border-accent/20 mb-4">
              <p className="text-[11px] text-muted-foreground mb-1">Unique Value Proposition</p>
              <p className="text-sm text-foreground font-medium">{stpData.positioning.uvp}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stpData.positioning.differentiators.map(d => <Badge key={d} variant="outline" className="text-xs bg-muted/50">{d}</Badge>)}
            </div>
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Today — Mar 17, 2026</span></div>
            <div className="flex gap-2">
              <Select value={reportFilter} onValueChange={setReportFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Filter reports" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="text-xs"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
            </div>
          </div>
          {filteredReports.map((report, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /><h3 className="text-sm font-semibold font-display text-foreground">{report.title}</h3><Badge variant="outline" className="text-[10px]">{report.category}</Badge></div>
                <span className="text-[11px] text-muted-foreground">{report.date}</span>
              </div>
              <div className="divide-y divide-border">
                {report.items.map((item, j) => (
                  <div key={j} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground w-24">{item.competitor}</span>
                      <span className="text-xs text-foreground">{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.channel}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${severityColors[item.impact]}`}>{item.impact}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="alerts" className="space-y-3 mt-4">
          {alerts.map((alert, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`border-l-4 rounded-lg px-5 py-4 flex items-center justify-between ${alertSeverityColors[alert.severity]}`}>
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 flex-shrink-0 ${alert.severity === "critical" ? "text-destructive" : alert.severity === "warning" ? "text-warning" : "text-accent"}`} />
                <div>
                  <p className="text-sm text-foreground">{alert.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
              </div>
              {alert.actionable && <Button variant="outline" size="sm" className="text-xs flex-shrink-0">View Details</Button>}
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligencePage;
