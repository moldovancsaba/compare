import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, ChevronRight, Save, MessageSquare, Calendar, CheckCircle2, AlertCircle,
  TrendingUp, Send, BarChart3, Zap, Target, Users, Shield, Leaf, Bell,
  Compass, Eye, ClipboardList, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

/* ─── Data ─── */
const setupSteps = [
  { id: "icp", title: "Ideal Customer Profile", description: "Define who your perfect customer looks like" },
  { id: "market", title: "Target Market", description: "Where do you compete and sell?" },
  { id: "problem", title: "Problem Solved", description: "What problems do you solve for customers?" },
  { id: "offer", title: "Offer & Pricing", description: "What do you sell and at what price?" },
  { id: "positioning", title: "Positioning", description: "How do you stand out from competitors?" },
];

const weeklyCheckpoints = [
  {
    week: "Week 12 — Mar 16, 2026", status: "current" as const,
    questions: [
      { q: "Have your target audience priorities shifted?", answered: false },
      { q: "Any new competitor moves you've noticed?", answered: false },
      { q: "Is your current messaging still resonating?", answered: false },
      { q: "Any changes to your offer or pricing?", answered: false },
    ],
    insights: [
      { text: "Competitor Acme Corp raised enterprise pricing by 15%", type: "alert" as const },
      { text: "Your content engagement is up 23% this week", type: "positive" as const },
    ],
  },
  {
    week: "Week 11 — Mar 9, 2026", status: "completed" as const,
    questions: [
      { q: "Have your target audience priorities shifted?", answered: true },
      { q: "Any new competitor moves you've noticed?", answered: true },
      { q: "Is your current messaging still resonating?", answered: true },
      { q: "Any changes to your offer or pricing?", answered: true },
    ],
    insights: [
      { text: "Market trend: AI GTM tools growing 34% YoY", type: "info" as const },
      { text: "3 new leads matched ICP in healthcare vertical", type: "positive" as const },
    ],
  },
];

const strategyAreas = [
  { name: "Growth Strategy", icon: TrendingUp, items: ["Market penetration", "Expansion", "Diversification", "Partnerships"], status: "active" },
  { name: "Operational Strategy", icon: Zap, items: ["Process optimization", "Cost efficiency", "Automation"], status: "active" },
  { name: "Customer Engagement", icon: Users, items: ["Loyalty programs", "Referrals", "Retention initiatives"], status: "in-progress" },
  { name: "Product / Service Strategy", icon: Target, items: ["Service improvement", "Differentiation", "Subscription models"], status: "in-progress" },
  { name: "Sustainability / Long-Term", icon: Shield, items: ["Strategic positioning", "Future-proofing", "Market resilience"], status: "planned" },
];

const landscapeItems = [
  { category: "Market Analysis", entries: ["AI GTM category growing 34% YoY", "New entrants: 3 funded startups in Q1", "Total addressable market: $8.2B"] },
  { category: "Competitor Analysis", entries: ["Acme Corp: aggressive pricing", "NovaTech: rebranded AI-first", "Stratify: launched free tier"] },
  { category: "Customer Feedback", entries: ["NPS: 72 (+5 vs Q4)", "Top request: deeper CRM integration", "Churn reason: pricing for SMBs"] },
  { category: "SWOT Insights", entries: ["Strength: unified platform", "Weakness: brand awareness", "Opportunity: enterprise segment", "Threat: well-funded competitors"] },
];

const chatMessages = [
  { role: "ai" as const, text: "Welcome to your weekly strategy check-in! I've noticed a few changes in your market this week. Let's review them together.", time: "Just now" },
  { role: "ai" as const, text: "📊 Key insight: Acme Corp raised their Enterprise tier by 15%. This could be an opportunity to capture price-sensitive prospects. Should we adjust our positioning?", time: "Just now" },
  { role: "user" as const, text: "Yes, let's highlight our competitive pricing in the next campaign.", time: "2 min ago" },
  { role: "ai" as const, text: "Got it! I'll update the messaging assets and flag the campaign team. Also — your content engagement is up 23%. The blog post on AI GTM tools is performing well. Want me to create a follow-up piece?", time: "1 min ago" },
];

const notifications = [
  { text: "Acme Corp raised enterprise pricing — review positioning impact", priority: "high" as const, type: "alert", time: "2h ago" },
  { text: "Weekly checkpoint due — 4 questions unanswered", priority: "high" as const, type: "task", time: "Today" },
  { text: "Strategy assessment score dropped 3pts — operational area", priority: "medium" as const, type: "alert", time: "1d ago" },
  { text: "New partnership opportunity identified in healthcare vertical", priority: "medium" as const, type: "action", time: "1d ago" },
  { text: "Content strategy review scheduled for Friday", priority: "low" as const, type: "task", time: "3d ago" },
  { text: "Customer engagement strategy needs update — retention metrics declining", priority: "high" as const, type: "action", time: "2d ago" },
];

const assessmentMetrics = [
  { name: "Revenue Growth", score: 78, target: "15% QoQ", actual: "12% QoQ", trend: "up" },
  { name: "Market Share", score: 65, target: "8%", actual: "6.2%", trend: "up" },
  { name: "Customer Acquisition", score: 82, target: "200 MQLs/mo", actual: "218 MQLs/mo", trend: "up" },
  { name: "Retention Rate", score: 71, target: "95%", actual: "91%", trend: "down" },
  { name: "Brand Awareness", score: 54, target: "Top 5 in category", actual: "Rank #8", trend: "up" },
  { name: "Operational Efficiency", score: 88, target: "<$120 CAC", actual: "$98 CAC", trend: "up" },
];

/* ─── Component ─── */
const StrategyPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentStep, setCurrentStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Strategy configured", description: "All modules will align to this configuration." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Strategy</h1>
            <p className="text-sm text-muted-foreground">Central decision engine guiding all platform modules.</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="setup" className="text-xs">Setup</TabsTrigger>
          <TabsTrigger value="checkpoints" className="text-xs">Checkpoints</TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs">Assessment</TabsTrigger>
          <TabsTrigger value="areas" className="text-xs">Strategy Areas</TabsTrigger>
          <TabsTrigger value="landscape" className="text-xs">Market Landscape</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">Strategy Chat</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Tasks & Alerts</TabsTrigger>
        </TabsList>

        {/* 1. DASHBOARD */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Overall Strategy Score", value: "73%", icon: Brain, sub: "+5 this month" },
              { label: "Weekly Progress", value: "68%", icon: BarChart3, sub: "3 of 4 tasks done" },
              { label: "Active Strategy Areas", value: "5", icon: Compass, sub: "2 need attention" },
              { label: "Market Signals", value: "12", icon: Eye, sub: "3 critical" },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                  <m.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-display text-foreground">{m.value}</span>
                  <span className="text-xs text-muted-foreground">{m.sub}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent strategic signals */}
          <div className="bg-card border border-border rounded-lg shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Strategic Signals</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                { text: "Competitor Acme Corp raised Enterprise pricing 15%", type: "alert", time: "2h ago" },
                { text: "AI GTM market growing 34% YoY — expansion opportunity", type: "opportunity", time: "Today" },
                { text: "Customer NPS improved to 72 (+5 vs Q4)", type: "positive", time: "1d ago" },
                { text: "Retention rate dipped to 91% — below 95% target", type: "alert", time: "2d ago" },
                { text: "New partnership inquiry from healthcare enterprise", type: "opportunity", time: "3d ago" },
              ].map((s, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.type === "alert" ? "bg-warning" : s.type === "positive" ? "bg-success" : "bg-accent"}`} />
                    <span className="text-sm text-foreground">{s.text}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 2. SETUP */}
        <TabsContent value="setup" className="mt-6">
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {setupSteps.map((step, i) => (
              <button key={step.id} onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  i === currentStep ? "bg-accent text-accent-foreground" : i < currentStep ? "bg-success/10 text-success" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold border-current">{i + 1}</span>
                {step.title}
              </button>
            ))}
          </div>

          <motion.div key={currentStep} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5">
            <div>
              <h2 className="text-lg font-semibold font-display text-foreground">{setupSteps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{setupSteps[currentStep].description}</p>
            </div>

            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Industry / Vertical</Label><Input placeholder="e.g. B2B SaaS, Healthcare, FinTech" /></div>
                <div className="space-y-2"><Label>Company Size</Label><Input placeholder="e.g. 50-500 employees, $10M-$100M revenue" /></div>
                <div className="space-y-2"><Label>Decision Maker Titles</Label><Input placeholder="e.g. VP of Sales, CMO, Head of Growth" /></div>
                <div className="space-y-2"><Label>Key Pain Points</Label><Textarea placeholder="Describe the top 3 problems your ideal customer faces..." rows={3} /></div>
              </div>
            )}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Target Markets</Label><Input placeholder="e.g. North America, Western Europe" /></div>
                <div className="space-y-2"><Label>Primary Geography</Label><Input placeholder="e.g. United States, United Kingdom" /></div>
                <div className="space-y-2"><Label>Market Segment</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                    <SelectContent><SelectItem value="smb">SMB</SelectItem><SelectItem value="mid">Mid-Market</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Core Problem You Solve</Label><Textarea placeholder="What is the #1 problem your customers face?" rows={3} /></div>
                <div className="space-y-2"><Label>How You Solve It</Label><Textarea placeholder="Describe your solution approach..." rows={3} /></div>
                <div className="space-y-2"><Label>Key Outcomes / Results</Label><Textarea placeholder="What measurable results do customers get?" rows={3} /></div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Product / Service</Label><Textarea placeholder="Describe your main offering..." rows={3} /></div>
                <div className="space-y-2"><Label>Pricing Model</Label><Input placeholder="e.g. $99/mo per seat, Enterprise custom pricing" /></div>
                <div className="space-y-2"><Label>Key Value Proposition</Label><Textarea placeholder="What makes your offer compelling?" rows={3} /></div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Positioning Statement</Label><Textarea placeholder="We help [audience] achieve [outcome] by [method], unlike [competitor]..." rows={3} /></div>
                <div className="space-y-2"><Label>Top Competitors (comma-separated)</Label><Input placeholder="e.g. Competitor A, Competitor B, Competitor C" /></div>
                <div className="space-y-2"><Label>Key Differentiators</Label><Textarea placeholder="What sets you apart from competitors?" rows={3} /></div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>Back</Button>
              <div className="flex gap-2">
                {currentStep < setupSteps.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)} className="bg-accent text-accent-foreground hover:bg-accent/90">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
                ) : (
                  <Button size="sm" onClick={handleSave} className="bg-success text-success-foreground hover:bg-success/90"><Save className="w-4 h-4 mr-1" /> Activate Strategy</Button>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* 3. CHECKPOINTS */}
        <TabsContent value="checkpoints" className="space-y-4 mt-6">
          {weeklyCheckpoints.map((cp, i) => (
            <motion.div key={cp.week} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="text-sm font-semibold font-display text-foreground">{cp.week}</h3>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${cp.status === "current" ? "bg-accent/10 text-accent border-accent/20" : "bg-success/10 text-success border-success/20"}`}>
                        {cp.status === "current" ? "In Progress" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Questions Answered</p>
                    <Progress value={cp.questions.filter(q => q.answered).length / cp.questions.length * 100} className="w-20 h-1.5 mt-1" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Survey Questions</p>
                  {cp.questions.map((q, j) => (
                    <div key={j} className="flex items-center gap-2 py-1.5">
                      {q.answered ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
                      <span className={`text-xs ${q.answered ? "text-muted-foreground" : "text-foreground"}`}>{q.q}</span>
                      {!q.answered && cp.status === "current" && <Button variant="outline" size="sm" className="ml-auto text-[10px] h-6 px-2">Answer</Button>}
                    </div>
                  ))}
                </div>
                {cp.insights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">AI Insights</p>
                    {cp.insights.map((ins, j) => (
                      <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${ins.type === "alert" ? "bg-destructive/5 text-destructive" : ins.type === "positive" ? "bg-success/5 text-success" : "bg-accent/5 text-accent"}`}>
                        {ins.type === "alert" ? <AlertCircle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {ins.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* 4. ASSESSMENT */}
        <TabsContent value="assessment" className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Strategy Performance Assessment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Continuous review of objectives, performance, and market changes</p>
            </div>
            <div className="divide-y divide-border">
              {assessmentMetrics.map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                      <span className={`text-xs font-semibold ${m.score >= 80 ? "text-success" : m.score >= 60 ? "text-warning" : "text-destructive"}`}>{m.score}%</span>
                    </div>
                    <Progress value={m.score} className="h-1.5 mb-2" />
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>Target: <span className="text-foreground font-medium">{m.target}</span></span>
                      <span>Actual: <span className="text-foreground font-medium">{m.actual}</span></span>
                      <span className={m.trend === "up" ? "text-success" : "text-destructive"}>{m.trend === "up" ? "↑" : "↓"} Trending {m.trend}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 5. STRATEGY AREAS */}
        <TabsContent value="areas" className="mt-6 space-y-4">
          {strategyAreas.map((area, i) => (
            <motion.div key={area.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <area.icon className="w-[18px] h-[18px] text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold font-display text-foreground">{area.name}</h3>
                    <Badge variant="outline" className={`text-[10px] ${area.status === "active" ? "bg-success/10 text-success border-success/20" : area.status === "in-progress" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {area.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">View Details</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {area.items.map(item => (
                  <Badge key={item} variant="outline" className="text-[10px] bg-muted/50">{item}</Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* 6. MARKET LANDSCAPE */}
        <TabsContent value="landscape" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {landscapeItems.map((cat, i) => (
              <motion.div key={cat.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg shadow-card">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold font-display text-foreground">{cat.category}</h3>
                </div>
                <div className="p-5 space-y-2">
                  {cat.entries.map((entry, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-foreground">
                      <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                      {entry}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 7. STRATEGY CHAT */}
        <TabsContent value="chat" className="mt-6">
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden flex flex-col" style={{ height: "500px" }}>
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold font-display text-foreground">Strategy Advisor</span>
              <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20 ml-2">Online</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex gap-2">
              <Input placeholder="Ask about strategy, competitors, or brainstorm ideas..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1" />
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* 8. NOTIFICATIONS & TASKS */}
        <TabsContent value="notifications" className="mt-6 space-y-3">
          {notifications.map((n, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`border-l-4 rounded-lg px-5 py-4 flex items-center justify-between ${
                n.priority === "high" ? "border-l-destructive bg-destructive/5" : n.priority === "medium" ? "border-l-warning bg-warning/5" : "border-l-accent bg-accent/5"
              }`}>
              <div className="flex items-center gap-3">
                {n.type === "alert" ? <AlertCircle className={`w-4 h-4 ${n.priority === "high" ? "text-destructive" : "text-warning"}`} /> :
                 n.type === "task" ? <ClipboardList className="w-4 h-4 text-accent" /> :
                 <ArrowRight className="w-4 h-4 text-accent" />}
                <div>
                  <p className="text-sm text-foreground">{n.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-xs flex-shrink-0">View</Button>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyPage;
