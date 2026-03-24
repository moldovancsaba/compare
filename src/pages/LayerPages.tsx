import { motion } from "framer-motion";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-7xl mx-auto"
  >
    <h1 className="text-2xl font-bold font-display text-foreground">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1 mb-8">{description}</p>
    <div className="bg-card border border-border rounded-lg p-12 shadow-card text-center">
      <p className="text-muted-foreground text-sm">This layer is coming soon. Configure your Strategy Core first.</p>
    </div>
  </motion.div>
);

export const IntelligencePage = () => (
  <PlaceholderPage title="Research & Intelligence" description="AI agents continuously monitoring your market and competitors." />
);

export const BrandPage = () => (
  <PlaceholderPage title="Brand & Assets" description="Create and improve brand guidelines, messaging, and content." />
);

export const ExecutionPage = () => (
  <PlaceholderPage title="Acquisition & Execution" description="Generate demand, run campaigns, and manage your funnel." />
);

export const CrmPage = () => (
  <PlaceholderPage title="CRM & Automation" description="Organize leads, automate follow-ups, and track your pipeline." />
);
