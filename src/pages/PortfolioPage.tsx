import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Plus, Edit2, Copy, DollarSign, Users, TrendingUp, Star,
  Target, Megaphone, FileText, Rocket, Layers, BarChart3, Globe,
  Sparkles, ArrowRight, Download, Lightbulb, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* ─── Data ─── */
const products = [
  { name: "Enterprise GTM Suite", price: "$2,499/mo", model: "Annual", audience: "Enterprise 500+", status: "active" as const, leads: 289, conversions: 34, avgUnits: 12, revenue: "$360K/yr" },
  { name: "Growth Plan", price: "$499/mo", model: "Monthly", audience: "Mid-Market", status: "active" as const, leads: 1043, conversions: 127, avgUnits: 89, revenue: "$534K/yr" },
  { name: "Starter Package", price: "$99/mo", model: "Monthly", audience: "SMB / Startups", status: "active" as const, leads: 2891, conversions: 412, avgUnits: 340, revenue: "$404K/yr" },
  { name: "Intel Report", price: "$1,200", model: "One-time", audience: "All segments", status: "draft" as const, leads: 45, conversions: 0, avgUnits: 0, revenue: "$0" },
];

const competitiveComparison = [
  { feature: "Price (Entry)", you: "$99/mo", acme: "$199/mo", nova: "$149/mo", stratify: "Free", growth: "$49/mo" },
  { feature: "Price (Enterprise)", you: "$2,499/mo", acme: "$3,200/mo", nova: "$1,800/mo", stratify: "$999/mo", growth: "N/A" },
  { feature: "AI Strategy Agent", you: "✓", acme: "✓", nova: "—", stratify: "—", growth: "—" },
  { feature: "Competitor Monitoring", you: "✓", acme: "✓", nova: "✓", stratify: "—", growth: "—" },
  { feature: "Content Creation", you: "✓", acme: "—", nova: "—", stratify: "—", growth: "✓" },
  { feature: "Lead Generation", you: "✓", acme: "✓", nova: "✓", stratify: "✓", growth: "—" },
  { feature: "CRM Built-in", you: "✓", acme: "✓", nova: "—", stratify: "✓", growth: "—" },
  { feature: "Free Trial", you: "14 days", acme: "7 days", nova: "30 days", stratify: "Free tier", growth: "14 days" },
];

const positioningData = {
  uvp: "The only AI GTM platform with a central strategy brain that aligns all marketing, sales, and intelligence agents automatically.",
  differentiators: [
    "Unified strategy-to-execution workflow",
    "Continuous market intelligence (not static reports)",
    "AI agents that act, not just advise",
    "Single platform replacing 12+ tools",
  ],
  segmentMessaging: [
    { segment: "Enterprise", message: "Enterprise-grade GTM automation with dedicated AI agents, white-glove onboarding, and real-time competitive intelligence." },
    { segment: "Mid-Market", message: "Scale your go-to-market without scaling your team. AI agents handle research, content, and lead gen — 24/7." },
    { segment: "SMB", message: "Everything you need to launch and grow. Strategy, intelligence, and execution — all in one affordable platform." },
  ],
};

const pricingStrategies = [
  { name: "Value-Based Pricing", description: "Price based on perceived value and ROI delivered to customer", status: "active" as const, metric: "3.2x avg ROI reported" },
  { name: "Tiered Model", description: "Starter ($99) → Growth ($499) → Enterprise ($2,499)", status: "active" as const, metric: "Growth tier is top performer" },
  { name: "Bundle Offers", description: "Strategy + Intelligence combo at 15% discount", status: "testing" as const, metric: "Testing with 200 prospects" },
  { name: "Annual Discount", description: "20% discount on annual commitment", status: "active" as const, metric: "62% choose annual" },
  { name: "Promotional Campaign", description: "Q2 promotion: First 3 months at 50% off", status: "planned" as const, metric: "Targeting 500 new signups" },
];

const launchPlan = [
  { phase: "Pre-Launch", timeline: "Week 1-2", tasks: ["Finalize messaging", "Prepare landing page", "Brief sales team", "Set up tracking"], status: "completed" },
  { phase: "Soft Launch", timeline: "Week 3", tasks: ["Email to existing list", "LinkedIn announcement", "Partner outreach"], status: "in-progress" },
  { phase: "Full Launch", timeline: "Week 4-5", tasks: ["Paid advertising", "PR push", "Influencer partnerships", "Webinar series"], status: "planned" },
  { phase: "Post-Launch", timeline: "Week 6-8", tasks: ["Performance review", "Collect feedback", "Iterate messaging", "Scale winners"], status: "planned" },
];

const collateral = [
  { name: "Product Brochure — Enterprise Suite", type: "PDF", status: "ready" as const, lastUpdated: "2 days ago" },
  { name: "Growth Plan One-Pager", type: "PDF", status: "ready" as const, lastUpdated: "1 week ago" },
  { name: "Customer Case Study — TechFlow Inc", type: "Document", status: "ready" as const, lastUpdated: "3 days ago" },
  { name: "ROI Calculator Template", type: "Spreadsheet", status: "draft" as const, lastUpdated: "Today" },
  { name: "Competitive Comparison Sheet", type: "PDF", status: "ready" as const, lastUpdated: "1 day ago" },
  { name: "Sales Deck — Q2 2026", type: "Presentation", status: "in-progress" as const, lastUpdated: "Today" },
];

const socialRecommendations = [
  { idea: "Launch announcement: 'Meet our new Growth Plan'", theme: "Product Launch", channels: ["LinkedIn", "Twitter"], timing: "This week" },
  { idea: "Customer success story: 3x pipeline increase", theme: "Social Proof", channels: ["LinkedIn", "Blog"], timing: "Next week" },
  { idea: "Infographic: AI GTM vs Traditional GTM costs", theme: "Education", channels: ["LinkedIn", "Instagram"], timing: "Next week" },
  { idea: "Behind-the-scenes: How our AI agents work", theme: "Transparency", channels: ["Twitter", "YouTube"], timing: "Bi-weekly" },
];

const innovationIdeas = [
  { idea: "AI-powered pricing optimizer", impact: "High", effort: "Medium", source: "Customer feedback", status: "evaluating" },
  { idea: "White-label reseller program", impact: "High", effort: "High", source: "Partner requests", status: "planned" },
  { idea: "Starter + Intel bundle at $149/mo", impact: "Medium", effort: "Low", source: "Market gap", status: "testing" },
  { idea: "Voice-based strategy check-ins", impact: "Medium", effort: "Medium", source: "Product vision", status: "evaluating" },
];

const actionRecommendations = [
  { text: "Raise Starter tier to $129 — competitor free tiers lack depth, your value justifies it", type: "pricing", priority: "high" as const },
  { text: "Launch Q2 promo: 3 months at 50% off to capture Acme's price-sensitive churners", type: "promotion", priority: "high" as const },
  { text: "Create Enterprise case study with TechFlow Inc — social proof is #1 conversion driver", type: "content", priority: "medium" as const },
  { text: "Update Growth Plan messaging to emphasize 'AI team replacement' angle", type: "messaging", priority: "medium" as const },
  { text: "Add ROI calculator to pricing page — competitors don't have this", type: "feature", priority: "medium" as const },
];

const statusColors = { active: "bg-success/10 text-success border-success/20", draft: "bg-warning/10 text-warning border-warning/20", paused: "bg-muted text-muted-foreground border-border", testing: "bg-accent/10 text-accent border-accent/20", planned: "bg-muted text-muted-foreground border-border" };
const priorityColors = { high: "bg-destructive/10 text-destructive border-destructive/20", medium: "bg-warning/10 text-warning border-warning/20", low: "bg-muted text-muted-foreground border-border" };

/* ─── Component ─── */
const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Portfolio & Offerings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage products, pricing, positioning, and campaigns.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4 mr-1" /> New Offering</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create New Offering</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="e.g. Enterprise GTM Suite" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="What's included..." rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Price</Label><Input placeholder="$499/mo" /></div>
                <div className="space-y-2"><Label>Model</Label><Input placeholder="Monthly, Annual..." /></div>
              </div>
              <div className="space-y-2"><Label>Target Audience</Label><Input placeholder="e.g. Mid-Market SaaS" /></div>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowCreate(false)}>Create Offering</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Offerings", value: products.length.toString(), icon: Package, sub: `${products.filter(p => p.status === "active").length} active` },
          { label: "Total Revenue", value: "$1.3M/yr", icon: DollarSign, sub: "Across all tiers" },
          { label: "Total Leads", value: products.reduce((s, p) => s + p.leads, 0).toLocaleString(), icon: Users, sub: "All offerings" },
          { label: "Avg Conversion", value: "13.6%", icon: TrendingUp, sub: "+2.1% vs last quarter" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">Competitive</TabsTrigger>
          <TabsTrigger value="positioning" className="text-xs">Positioning</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs">Pricing Strategy</TabsTrigger>
          <TabsTrigger value="launch" className="text-xs">Launch Planning</TabsTrigger>
          <TabsTrigger value="collateral" className="text-xs">Collateral</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social Strategy</TabsTrigger>
          <TabsTrigger value="innovation" className="text-xs">Innovation</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Recommendations</TabsTrigger>
        </TabsList>

        {/* PORTFOLIO */}
        <TabsContent value="portfolio" className="space-y-4 mt-4">
          {products.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-accent" /></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold font-display text-foreground">{p.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[p.status]}`}>{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.audience} · {p.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Price", value: p.price },
                  { label: "Avg Units", value: p.avgUnits.toString() },
                  { label: "Leads", value: p.leads.toLocaleString() },
                  { label: "Conversions", value: p.conversions.toString() },
                  { label: "Revenue", value: p.revenue },
                ].map(m => (
                  <div key={m.label} className="bg-muted/50 rounded-md px-3 py-2">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
                    <p className="text-sm font-semibold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* COMPETITIVE COMPARISON */}
        <TabsContent value="comparison" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Competitive Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How your offerings compare against competitors</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="px-4 py-3 text-center font-semibold text-accent">You</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acme</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">NovaTech</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stratify</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">GrowthOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {competitiveComparison.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-5 py-3 font-medium text-foreground">{row.feature}</td>
                      {["you", "acme", "nova", "stratify", "growth"].map(key => (
                        <td key={key} className="px-4 py-3 text-center">
                          <span className={`${key === "you" ? "font-semibold text-accent" : row[key as keyof typeof row] === "✓" ? "text-success" : row[key as keyof typeof row] === "—" ? "text-muted-foreground/40" : "text-foreground"}`}>
                            {row[key as keyof typeof row]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* POSITIONING */}
        <TabsContent value="positioning" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="bg-accent/5 rounded-md px-4 py-3 border border-accent/20 mb-4">
              <p className="text-[11px] text-muted-foreground mb-1">Unique Value Proposition</p>
              <p className="text-sm text-foreground font-medium">{positioningData.uvp}</p>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Differentiators</p>
            <div className="flex flex-wrap gap-2">
              {positioningData.differentiators.map(d => <Badge key={d} variant="outline" className="text-xs bg-muted/50">{d}</Badge>)}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Segment-Specific Messaging</p>
            {positioningData.segmentMessaging.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 shadow-card">
                <Badge variant="outline" className="text-[10px] mb-2">{s.segment}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{s.message}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* PRICING STRATEGY */}
        <TabsContent value="pricing" className="mt-4 space-y-4">
          {pricingStrategies.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><DollarSign className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold font-display text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${statusColors[s.status as keyof typeof statusColors] || statusColors.planned}`}>{s.status}</Badge>
                </div>
              </div>
              <span className="text-xs font-medium text-accent">{s.metric}</span>
            </motion.div>
          ))}
        </TabsContent>

        {/* LAUNCH PLANNING */}
        <TabsContent value="launch" className="mt-4 space-y-4">
          {launchPlan.map((phase, i) => (
            <motion.div key={phase.phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${phase.status === "completed" ? "bg-success/10" : phase.status === "in-progress" ? "bg-accent/10" : "bg-muted"}`}>
                    <Rocket className={`w-[18px] h-[18px] ${phase.status === "completed" ? "text-success" : phase.status === "in-progress" ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold font-display text-foreground">{phase.phase}</h3>
                    <span className="text-xs text-muted-foreground">{phase.timeline}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${phase.status === "completed" ? "bg-success/10 text-success border-success/20" : phase.status === "in-progress" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"}`}>{phase.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {phase.tasks.map(t => (
                  <div key={t} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {phase.status === "completed" ? <CheckCircle2 className="w-3 h-3 text-success" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />}
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* COLLATERAL */}
        <TabsContent value="collateral" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card divide-y divide-border">
            {collateral.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${c.status === "ready" ? "bg-success/10 text-success border-success/20" : c.status === "draft" ? "bg-warning/10 text-warning border-warning/20" : "bg-accent/10 text-accent border-accent/20"}`}>{c.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{c.lastUpdated}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1" />Download</Button>
                  <Button variant="ghost" size="sm" className="text-xs"><Edit2 className="w-3 h-3 mr-1" />Edit</Button>
                </div>
              </div>
            ))}
          </motion.div>
        </TabsContent>

        {/* SOCIAL STRATEGY */}
        <TabsContent value="social" className="mt-4 space-y-4">
          {socialRecommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-[18px] h-[18px] text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{rec.idea}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{rec.theme}</Badge>
                      {rec.channels.map(c => <Badge key={c} variant="outline" className="text-[10px] bg-muted/50">{c}</Badge>)}
                      <span className="text-[10px] text-muted-foreground">{rec.timing}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Create</Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* INNOVATION */}
        <TabsContent value="innovation" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Product Development & Innovation</h3>
            </div>
            <div className="divide-y divide-border">
              {innovationIdeas.map((idea, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{idea.idea}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">Impact: <span className="text-foreground">{idea.impact}</span></span>
                        <span className="text-[10px] text-muted-foreground">Effort: <span className="text-foreground">{idea.effort}</span></span>
                        <span className="text-[10px] text-muted-foreground">Source: <span className="text-foreground">{idea.source}</span></span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${idea.status === "testing" ? "bg-accent/10 text-accent border-accent/20" : idea.status === "planned" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>{idea.status}</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* RECOMMENDATIONS */}
        <TabsContent value="actions" className="mt-4 space-y-3">
          {actionRecommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`border-l-4 rounded-lg px-5 py-4 flex items-center justify-between ${rec.priority === "high" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"}`}>
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${rec.priority === "high" ? "text-destructive" : "text-warning"}`} />
                <div>
                  <p className="text-sm text-foreground">{rec.text}</p>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${priorityColors[rec.priority]}`}>{rec.priority} priority</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs flex-shrink-0">Take Action</Button>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioPage;
