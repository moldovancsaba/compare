import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Copy,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Offer {
  id: string;
  name: string;
  description: string;
  price: string;
  model: string;
  audience: string;
  status: "active" | "draft" | "paused";
  conversions: number;
  leads: number;
  performance: "high" | "medium" | "low";
}

const initialOffers: Offer[] = [
  {
    id: "1",
    name: "Enterprise GTM Suite",
    description: "Full AI-powered go-to-market platform with dedicated strategy agent, unlimited intel reports, and white-glove onboarding.",
    price: "$2,499/mo",
    model: "Annual subscription",
    audience: "Enterprise (500+ employees)",
    status: "active",
    conversions: 34,
    leads: 289,
    performance: "high",
  },
  {
    id: "2",
    name: "Growth Plan",
    description: "Core GTM automation with competitor monitoring, brand assets, and campaign execution for scaling teams.",
    price: "$499/mo",
    model: "Monthly subscription",
    audience: "Mid-Market (50-500 employees)",
    status: "active",
    conversions: 127,
    leads: 1043,
    performance: "high",
  },
  {
    id: "3",
    name: "Starter Package",
    description: "Essential GTM tools including strategy setup, basic intelligence, and messaging templates.",
    price: "$99/mo",
    model: "Monthly subscription",
    audience: "SMB / Startups",
    status: "active",
    conversions: 412,
    leads: 2891,
    performance: "medium",
  },
  {
    id: "4",
    name: "Competitor Intel Report",
    description: "One-time deep-dive competitor analysis with actionable recommendations and market positioning insights.",
    price: "$1,200",
    model: "One-time",
    audience: "All segments",
    status: "draft",
    conversions: 0,
    leads: 45,
    performance: "low",
  },
];

const statusColors = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-warning/10 text-warning border-warning/20",
  paused: "bg-muted text-muted-foreground border-border",
};

const perfColors = {
  high: "text-success",
  medium: "text-warning",
  low: "text-muted-foreground",
};

const MyOffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">My Offers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your products, services, and pricing offers.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-1" /> New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Offer Name</Label>
                <Input placeholder="e.g. Enterprise GTM Suite" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe what's included..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input placeholder="$499/mo" />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="Monthly, Annual, One-time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input placeholder="e.g. Mid-Market SaaS companies" />
              </div>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowCreate(false)}>
                Create Offer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Offers", value: offers.length.toString(), icon: Package, sub: `${offers.filter(o => o.status === "active").length} active` },
          { label: "Total Leads", value: offers.reduce((s, o) => s + o.leads, 0).toLocaleString(), icon: Users, sub: "Across all offers" },
          { label: "Total Conversions", value: offers.reduce((s, o) => s + o.conversions, 0).toString(), icon: TrendingUp, sub: "This month" },
          { label: "Top Performer", value: "Growth Plan", icon: Star, sub: "127 conversions" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              <m.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-foreground">{m.value}</span>
              <span className="text-xs text-muted-foreground">{m.sub}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Offers list */}
      <div className="space-y-4">
        {offers.map((offer, i) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-lg p-5 shadow-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold font-display text-foreground">{offer.name}</h3>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[offer.status]}`}>
                      {offer.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{offer.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              <div className="bg-muted/50 rounded-md px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Price</p>
                <p className="text-sm font-semibold text-foreground">{offer.price}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Model</p>
                <p className="text-sm font-semibold text-foreground">{offer.model}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Audience</p>
                <p className="text-sm font-semibold text-foreground truncate">{offer.audience}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Leads</p>
                <p className="text-sm font-semibold text-foreground">{offer.leads.toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-md px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Conversions</p>
                <p className={`text-sm font-semibold ${perfColors[offer.performance]}`}>{offer.conversions}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyOffersPage;
