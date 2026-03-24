import { useState } from "react";
import { motion } from "framer-motion";
import {
  PenTool, FileText, Megaphone, Mail, Globe, Star, Layout, Image,
  Sparkles, Copy, Download, Plus, BarChart3, Eye, TrendingUp,
  Lightbulb, ArrowRight, Search, MessageSquare, Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/* ── Asset Categories ── */
const assetCategories = [
  { name: "Website Content", icon: Globe, count: 14, items: ["Homepage", "About Page", "Service Pages", "Landing Pages"], status: "active" as const },
  { name: "Offer Pages", icon: Layout, count: 8, items: ["Product Pages", "Pricing Page", "Comparison Page", "Free Trial"], status: "active" as const },
  { name: "Sales Scripts", icon: MessageSquare, count: 6, items: ["Cold Call", "Discovery Call", "Demo Script", "Objection Handling"], status: "active" as const },
  { name: "Social Media Profiles", icon: Globe, count: 4, items: ["LinkedIn", "Twitter/X", "Instagram", "Facebook"], status: "active" as const },
  { name: "Blog & Written Content", icon: FileText, count: 18, items: ["Blog Posts", "Whitepapers", "Case Studies", "Newsletters"], status: "active" as const },
  { name: "Visual Assets", icon: Image, count: 22, items: ["Photography", "Graphics", "Icons", "Illustrations"], status: "active" as const },
  { name: "Presentations", icon: Presentation, count: 5, items: ["Pitch Deck", "Sales Deck", "Webinar Slides", "Training"], status: "active" as const },
  { name: "Print & Promo Materials", icon: Megaphone, count: 8, items: ["Brochures", "Flyers", "Infographics", "Business Cards"], status: "draft" as const },
];

/* ── Templates ── */
const templates = [
  { name: "LinkedIn Post", icon: Megaphone, category: "Social", fields: ["Hook", "Body", "CTA", "Hashtags"], description: "Optimized for LinkedIn algorithm" },
  { name: "Cold Email", icon: Mail, category: "Outreach", fields: ["Subject Line", "Opening", "Value Prop", "CTA"], description: "Personalized cold email with trigger-based opening" },
  { name: "Blog Post", icon: FileText, category: "Content", fields: ["Title", "Meta Description", "Introduction", "Key Points", "Conclusion"], description: "SEO-optimized structure" },
  { name: "Landing Page", icon: Layout, category: "Web", fields: ["Headline", "Subheadline", "Benefits", "Social Proof", "CTA"], description: "High-converting copy framework" },
  { name: "Sales Script", icon: Mail, category: "Sales", fields: ["Opening", "Discovery Questions", "Value Pitch", "Objection Handling", "Close"], description: "Sales conversation flow" },
  { name: "Ad Copy", icon: Megaphone, category: "Ads", fields: ["Headline", "Description", "Display URL", "CTA"], description: "Google/LinkedIn ad copy" },
];

/* ── Recommendations ── */
const recommendations = [
  { title: "Update homepage hero messaging", reason: "Competitor launched new positioning — differentiation needed", source: "Competitive Intel", priority: "high" as const },
  { title: "Create case study: TechFlow success", reason: "Customer reported 3x ROI — high-impact social proof", source: "CRM Data", priority: "high" as const },
  { title: "Refresh LinkedIn banner & bio", reason: "Current assets are 3 months old — engagement declining", source: "Trend Analysis", priority: "medium" as const },
  { title: "Develop infographic: AI GTM stats", reason: "Visual content performs 2.3x better in current market", source: "Content Analytics", priority: "medium" as const },
  { title: "Seasonal campaign visuals — Q3", reason: "Competitor preparing seasonal push — preemptive opportunity", source: "Market Intelligence", priority: "low" as const },
];

/* ── Recent Content ── */
const recentContent = [
  { title: "How AI is Transforming B2B GTM in 2026", type: "Blog Post", status: "published", performance: "2.1K views", date: "2 days ago" },
  { title: "Meet Our New Growth Plan", type: "LinkedIn Post", status: "published", performance: "12K impressions", date: "3 days ago" },
  { title: "Cold Email: Pricing Change Alert", type: "Email", status: "draft", performance: "—", date: "Today" },
  { title: "Enterprise Case Study: TechFlow", type: "Case Study", status: "in-review", performance: "—", date: "1 day ago" },
];

const statusBadge: Record<string, { className: string }> = {
  active: { className: "bg-success/10 text-success border-success/20" },
  draft: { className: "bg-warning/10 text-warning border-warning/20" },
  published: { className: "bg-success/10 text-success border-success/20" },
  "in-review": { className: "bg-accent/10 text-accent border-accent/20" },
};
const priorityBadge: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const ContentCreationPage = () => {
  const [activeTab, setActiveTab] = useState("assets");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const { toast } = useToast();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Digital Presence & Asset Creation</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your website, social media, sales materials, content, and promotional assets.</p>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Sparkles className="w-4 h-4 mr-1" /> Create Asset</Button>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Assets", value: "85", icon: Layout, sub: "Across all channels" },
          { label: "Published", value: "62", icon: FileText, sub: "Live & active" },
          { label: "Recommendations", value: "5", icon: Lightbulb, sub: "AI-generated" },
          { label: "Avg Performance", value: "+23%", icon: BarChart3, sub: "vs last month" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-muted-foreground">{m.label}</span><m.icon className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex items-baseline gap-2"><span className="text-2xl font-bold font-display text-foreground">{m.value}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
          </div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="assets">Asset Library</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* ASSET LIBRARY */}
        <TabsContent value="assets" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assetCategories.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><cat.icon className="w-[18px] h-[18px] text-accent" /></div>
                    <div>
                      <h3 className="text-sm font-semibold font-display text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat.count} assets</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusBadge[cat.status]?.className || ""}`}>{cat.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map(item => (
                    <Badge key={item} variant="outline" className="text-[10px] bg-muted/50 cursor-pointer hover:bg-accent/10 transition-colors">{item}</Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-4">
          {selectedTemplate === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(i)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><tmpl.icon className="w-[18px] h-[18px] text-accent" /></div>
                    <div>
                      <h3 className="text-sm font-semibold font-display text-foreground">{tmpl.name}</h3>
                      <Badge variant="outline" className="text-[10px]">{tmpl.category}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1">{tmpl.fields.map(f => <Badge key={f} variant="outline" className="text-[10px] bg-muted/50">{f}</Badge>)}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => { const T = templates[selectedTemplate]; return <T.icon className="w-5 h-5 text-accent" />; })()}
                  <div>
                    <h3 className="text-sm font-semibold font-display text-foreground">{templates[selectedTemplate].name}</h3>
                    <p className="text-xs text-muted-foreground">{templates[selectedTemplate].description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>← Back</Button>
              </div>
              <div className="p-5 space-y-4">
                {templates[selectedTemplate].fields.map(field => (
                  <div key={field} className="space-y-2">
                    <Label>{field}</Label>
                    {["Body", "Key Points", "Introduction", "Conclusion", "Benefits", "Discovery Questions", "Value Pitch", "Objection Handling"].includes(field)
                      ? <Textarea placeholder={`Enter your ${field.toLowerCase()}...`} rows={4} />
                      : <Input placeholder={`Enter your ${field.toLowerCase()}...`} />}
                  </div>
                ))}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Sparkles className="w-4 h-4 mr-1" /> Generate with AI</Button>
                  <Button variant="outline" onClick={() => toast({ title: "Copied!" })}><Copy className="w-4 h-4 mr-1" /> Copy All</Button>
                  <Button variant="outline"><Download className="w-4 h-4 mr-1" /> Export</Button>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* RECENT */}
        <TabsContent value="recent" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg shadow-card divide-y divide-border">
            {recentContent.map((c, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusBadge[c.status]?.className || ""}`}>{c.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{c.date}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-accent">{c.performance}</span>
              </div>
            ))}
          </motion.div>
        </TabsContent>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          {recommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Lightbulb className="w-[18px] h-[18px] text-accent" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  <Badge variant="outline" className="text-[9px] mt-1 bg-muted/50">{rec.source}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${priorityBadge[rec.priority]}`}>{rec.priority}</Badge>
                <Button variant="outline" size="sm" className="text-xs">Create</Button>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentCreationPage;
