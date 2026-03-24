import { useState } from "react";
import { motion } from "framer-motion";
import {
  Paintbrush, FileText, MessageSquare, Sparkles, Copy, PenTool, Palette,
  CheckCircle2, ArrowRight, Download, Globe, Image, Type, BookOpen,
  Layout, Megaphone, Eye, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

/* ── Brand Guidelines ── */
const guidelineSections = [
  { name: "Brand Vision & Mission", status: "complete" as const, description: "Core purpose, long-term direction, and brand story" },
  { name: "Brand Values & Positioning", status: "complete" as const, description: "Differentiators, market positioning, and value system" },
  { name: "Brand Voice & Tone", status: "complete" as const, description: "Communication style, personality, and tone guidelines" },
  { name: "Messaging Framework", status: "complete" as const, description: "Key messages for each audience segment and channel" },
  { name: "Brand Narrative & Story", status: "in-progress" as const, description: "Origin story, brand journey, and storytelling structure" },
];

/* ── Visual Identity ── */
const visualIdentity = [
  { name: "Color Palette", status: "complete" as const, description: "Primary, secondary, and accent colors with usage rules", icon: Palette },
  { name: "Typography System", status: "complete" as const, description: "Display and body fonts, hierarchy, and sizing", icon: Type },
  { name: "Logo Usage Rules", status: "complete" as const, description: "Logo variations, spacing, prohibited uses", icon: Image },
  { name: "Visual Style & Design Principles", status: "in-progress" as const, description: "Photography, illustration, and graphic direction", icon: Eye },
  { name: "Imagery & Graphic Guidelines", status: "draft" as const, description: "Icon style, pattern usage, visual motifs", icon: Layers },
];

/* ── Brand Book ── */
const brandBookSections = [
  { name: "Brand Strategy & Positioning", pages: "1–12", status: "complete" as const },
  { name: "Messaging Framework", pages: "13–22", status: "complete" as const },
  { name: "Visual Identity System", pages: "23–38", status: "complete" as const },
  { name: "Design Rules & Examples", pages: "39–48", status: "in-progress" as const },
  { name: "Communication Guidelines", pages: "49–56", status: "draft" as const },
];

/* ── Messaging Assets ── */
const messagingAssets = [
  { type: "Brand Messaging Framework", content: "We help B2B companies accelerate their go-to-market with AI agents that continuously monitor competitors, generate insights, create content, and manage leads — all aligned to one central strategy.", status: "ready" as const, lastUpdated: "2 days ago" },
  { type: "Key Value Propositions", content: "1. One platform, infinite agents — strategy to execution\n2. Real-time competitive intelligence, always on\n3. AI-generated content aligned with your brand\n4. From lead to customer in one system", status: "ready" as const, lastUpdated: "1 day ago" },
  { type: "Positioning Statement", content: "For B2B growth teams who need a unified GTM system, Fortitude AI is the AI-powered operating system that replaces fragmented tools with a single, strategy-driven platform.", status: "ready" as const, lastUpdated: "3 days ago" },
  { type: "Marketing Taglines", content: "• Your AI GTM Operating System\n• Strategy → Intelligence → Execution\n• One brain, infinite agents\n• From insight to action, automatically", status: "ready" as const, lastUpdated: "Today" },
  { type: "Narrative Structures", content: "Problem: GTM teams juggle 12+ tools with no strategic alignment\nAgitation: Missed signals, inconsistent messaging, wasted spend\nSolution: Fortitude AI — define strategy once, let AI agents execute", status: "draft" as const, lastUpdated: "Today" },
];

/* ── Templates ── */
const templateCategories = [
  { name: "Social Media Templates", count: 8, items: ["LinkedIn Post", "Twitter/X Thread", "Instagram Story", "Facebook Ad"], icon: Globe },
  { name: "Presentation Templates", count: 5, items: ["Pitch Deck", "Sales Deck", "Investor Deck", "Quarterly Review"], icon: Layout },
  { name: "Marketing Graphics", count: 12, items: ["Banner Ads", "Email Header", "Blog Featured Image", "Infographic"], icon: Image },
  { name: "Promotional Materials", count: 6, items: ["Product Brochure", "Service Description Sheet", "Promotional Flyer", "Event Banner"], icon: Megaphone },
  { name: "Campaign Visuals", count: 4, items: ["Ad Creative Set", "Landing Page Mockup", "Email Campaign Template", "Retargeting Ad Set"], icon: PenTool },
];

/* ── Promotional Recommendations ── */
const promoRecommendations = [
  { theme: "Q2 Product Launch Campaign", direction: "Focus on enterprise pain points with ROI-driven messaging", priority: "high" as const, source: "Market Intelligence" },
  { theme: "Thought Leadership Series", direction: "AI in GTM — weekly LinkedIn articles targeting C-suite", priority: "high" as const, source: "Content Strategy" },
  { theme: "Customer Success Stories", direction: "3 case studies highlighting measurable outcomes", priority: "medium" as const, source: "Brand Strategy" },
  { theme: "Seasonal Promotion — Q3", direction: "Back-to-business campaign with limited-time enterprise pricing", priority: "medium" as const, source: "Competitive Intel" },
  { theme: "Community Building", direction: "Launch user community with webinars and exclusive content", priority: "low" as const, source: "Growth Strategy" },
];

const statusBadge = {
  complete: { label: "Complete", className: "bg-success/10 text-success border-success/20" },
  "in-progress": { label: "In Progress", className: "bg-accent/10 text-accent border-accent/20" },
  ready: { label: "Ready", className: "bg-success/10 text-success border-success/20" },
  draft: { label: "Draft", className: "bg-warning/10 text-warning border-warning/20" },
};

const priorityBadge = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const BrandPage = () => {
  const [activeTab, setActiveTab] = useState("guidelines");
  const { toast } = useToast();
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: "Content copied to clipboard." }); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Brand Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Brand identity, visual system, messaging framework, and content templates.</p>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Sparkles className="w-4 h-4 mr-1" /> Generate Assets</Button>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Brand Score", value: "78%", icon: Palette, sub: "Good" },
          { label: "Guidelines", value: "5/5", icon: BookOpen, sub: "Sections defined" },
          { label: "Templates", value: "35", icon: Layout, sub: "Across 5 categories" },
          { label: "Messages", value: "12", icon: MessageSquare, sub: "All segments covered" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="visual">Visual Identity</TabsTrigger>
          <TabsTrigger value="brandbook">Brand Book</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* GUIDELINES */}
        <TabsContent value="guidelines" className="mt-4">
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Brand Guidelines</h3>
              <p className="text-xs text-muted-foreground mt-0.5">AI-generated from your Strategy configuration — vision, voice, values, and messaging</p>
            </div>
            <div className="divide-y divide-border">
              {guidelineSections.map((section, i) => (
                <motion.div key={section.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 ${section.status === "complete" ? "text-success" : "text-accent"}`} />
                    <div><p className="text-sm font-medium text-foreground">{section.name}</p><p className="text-xs text-muted-foreground">{section.description}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${statusBadge[section.status].className}`}>{statusBadge[section.status].label}</Badge>
                    <Button variant="ghost" size="sm" className="text-xs">View <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* VISUAL IDENTITY */}
        <TabsContent value="visual" className="mt-4 space-y-4">
          {visualIdentity.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><item.icon className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${statusBadge[item.status].className}`}>{statusBadge[item.status].label}</Badge>
                <Button variant="ghost" size="sm" className="text-xs">Edit <ArrowRight className="w-3 h-3 ml-1" /></Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* BRAND BOOK */}
        <TabsContent value="brandbook" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold font-display text-foreground">Brand Book</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Complete brand reference document — 56 pages</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs"><Download className="w-3.5 h-3.5 mr-1" /> Export PDF</Button>
            </div>
            <div className="divide-y divide-border">
              {brandBookSections.map((section, i) => (
                <motion.div key={section.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className={`w-4 h-4 ${section.status === "complete" ? "text-success" : section.status === "in-progress" ? "text-accent" : "text-warning"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{section.name}</p>
                      <p className="text-xs text-muted-foreground">Pages {section.pages}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusBadge[section.status].className}`}>{statusBadge[section.status].label}</Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* MESSAGING */}
        <TabsContent value="messaging" className="space-y-4 mt-4">
          {messagingAssets.map((asset, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold font-display text-foreground">{asset.type}</h3>
                  <Badge variant="outline" className={`text-[10px] ${statusBadge[asset.status].className}`}>{statusBadge[asset.status].label}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(asset.content)}><Copy className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><PenTool className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 rounded-md px-4 py-3 border border-border/50">{asset.content}</p>
              <p className="text-[11px] text-muted-foreground mt-2">Last updated {asset.lastUpdated}</p>
            </motion.div>
          ))}
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {templateCategories.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><cat.icon className="w-[18px] h-[18px] text-accent" /></div>
                  <div>
                    <h3 className="text-sm font-semibold font-display text-foreground">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.count} templates available</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">Create New</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(item => (
                  <Badge key={item} variant="outline" className="text-[10px] bg-muted/50 cursor-pointer hover:bg-accent/10 transition-colors">{item}</Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          {promoRecommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Sparkles className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{rec.theme}</h3>
                  <p className="text-xs text-muted-foreground">{rec.direction}</p>
                  <Badge variant="outline" className="text-[9px] mt-1 bg-muted/50">{rec.source}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${priorityBadge[rec.priority]}`}>{rec.priority}</Badge>
                <Button variant="outline" size="sm" className="text-xs">Execute</Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandPage;
