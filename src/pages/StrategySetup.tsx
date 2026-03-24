import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronRight, Save, MessageSquare, Calendar, CheckCircle2, AlertCircle, TrendingUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: "icp", title: "Ideal Customer Profile", description: "Define who your perfect customer looks like" },
  { id: "market", title: "Market & Geography", description: "Where do you compete and sell?" },
  { id: "offer", title: "Offer & Pricing", description: "What do you sell and at what price?" },
  { id: "positioning", title: "Positioning & Competitors", description: "How do you stand out?" },
  { id: "goals", title: "Goals & Cadence", description: "What are your targets and review schedule?" },
];

const weeklyCheckpoints = [
  {
    week: "Week 12 — Mar 16, 2026",
    status: "current" as const,
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
    week: "Week 11 — Mar 9, 2026",
    status: "completed" as const,
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
  {
    week: "Week 10 — Mar 2, 2026",
    status: "completed" as const,
    questions: [
      { q: "Have your target audience priorities shifted?", answered: true },
      { q: "Any new competitor moves you've noticed?", answered: true },
      { q: "Is your current messaging still resonating?", answered: true },
      { q: "Any changes to your offer or pricing?", answered: true },
    ],
    insights: [
      { text: "NovaTech rebranded as AI-first platform", type: "alert" as const },
    ],
  },
];

const chatMessages = [
  { role: "ai" as const, text: "Welcome to your weekly strategy check-in! I've noticed a few changes in your market this week. Let's review them together.", time: "Just now" },
  { role: "ai" as const, text: "📊 Key insight: Acme Corp raised their Enterprise tier by 15%. This could be an opportunity to capture price-sensitive prospects. Should we adjust our positioning?", time: "Just now" },
  { role: "user" as const, text: "Yes, let's highlight our competitive pricing in the next campaign.", time: "2 min ago" },
  { role: "ai" as const, text: "Got it! I'll update the messaging assets and flag the campaign team. Also — your content engagement is up 23%. The blog post on AI GTM tools is performing well. Want me to create a follow-up piece?", time: "1 min ago" },
];

const StrategySetup = () => {
  const [activeTab, setActiveTab] = useState("setup");
  const [currentStep, setCurrentStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Strategy Core configured",
      description: "Your AI agents will now align to this configuration.",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Strategy Core</h1>
            <p className="text-sm text-muted-foreground">Configure your master GTM strategy. All agents align to this.</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="setup">Strategy Setup</TabsTrigger>
          <TabsTrigger value="checkpoints">Weekly Checkpoints</TabsTrigger>
          <TabsTrigger value="chat">Strategy Chat</TabsTrigger>
        </TabsList>

        {/* SETUP TAB */}
        <TabsContent value="setup" className="mt-6">
          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  i === currentStep
                    ? "bg-accent text-accent-foreground"
                    : i < currentStep
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold border-current">
                  {i + 1}
                </span>
                {step.title}
              </button>
            ))}
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5"
          >
            <div>
              <h2 className="text-lg font-semibold font-display text-foreground">{steps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
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
                    <SelectContent>
                      <SelectItem value="smb">SMB</SelectItem><SelectItem value="mid">Mid-Market</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem><SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Product / Service</Label><Textarea placeholder="Describe your main offering..." rows={3} /></div>
                <div className="space-y-2"><Label>Pricing Model</Label><Input placeholder="e.g. $99/mo per seat, Enterprise custom pricing" /></div>
                <div className="space-y-2"><Label>Key Value Proposition</Label><Textarea placeholder="What makes your offer compelling?" rows={3} /></div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Positioning Statement</Label><Textarea placeholder="We help [audience] achieve [outcome] by [method], unlike [competitor]..." rows={3} /></div>
                <div className="space-y-2"><Label>Top Competitors (comma-separated)</Label><Input placeholder="e.g. Competitor A, Competitor B, Competitor C" /></div>
                <div className="space-y-2"><Label>Key Differentiators</Label><Textarea placeholder="What sets you apart from competitors?" rows={3} /></div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Primary Goal</Label><Input placeholder="e.g. Generate 500 qualified leads per month" /></div>
                <div className="space-y-2"><Label>Review Frequency</Label>
                  <Select><SelectTrigger><SelectValue placeholder="How often should AI review strategy?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>KPIs to Track</Label><Textarea placeholder="e.g. MQLs, SQLs, pipeline value, conversion rate, CAC..." rows={3} /></div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>Back</Button>
              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSave} className="bg-success text-success-foreground hover:bg-success/90">
                    <Save className="w-4 h-4 mr-1" /> Activate Strategy
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* WEEKLY CHECKPOINTS TAB */}
        <TabsContent value="checkpoints" className="space-y-4 mt-6">
          {weeklyCheckpoints.map((cp, i) => (
            <motion.div
              key={cp.week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-lg shadow-card overflow-hidden"
            >
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
                      {q.answered ? (
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${q.answered ? "text-muted-foreground" : "text-foreground"}`}>{q.q}</span>
                      {!q.answered && cp.status === "current" && (
                        <Button variant="outline" size="sm" className="ml-auto text-[10px] h-6 px-2">Answer</Button>
                      )}
                    </div>
                  ))}
                </div>

                {cp.insights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">AI Insights</p>
                    {cp.insights.map((ins, j) => (
                      <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                        ins.type === "alert" ? "bg-destructive/5 text-destructive" :
                        ins.type === "positive" ? "bg-success/5 text-success" :
                        "bg-accent/5 text-accent"
                      }`}>
                        {ins.type === "alert" ? <AlertCircle className="w-3.5 h-3.5" /> :
                         ins.type === "positive" ? <TrendingUp className="w-3.5 h-3.5" /> :
                         <CheckCircle2 className="w-3.5 h-3.5" />}
                        {ins.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* STRATEGY CHAT TAB */}
        <TabsContent value="chat" className="mt-6">
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden flex flex-col" style={{ height: "500px" }}>
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold font-display text-foreground">Strategy Advisor</span>
              <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20 ml-2">Online</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex gap-2">
              <Input
                placeholder="Ask about strategy, competitors, or brainstorm ideas..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategySetup;
