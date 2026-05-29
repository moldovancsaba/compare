import type { ComponentType } from "react";
import type { SiteIconKey } from "@/types/site";
import { Calculator, Compass, Heart, ListChecks, MapPin, ShieldCheck, Users } from "@/lib/appIcons";

type IconProps = { className?: string; size?: string | number };

const MAP: Record<SiteIconKey, ComponentType<IconProps>> = {
  "map-pin": MapPin,
  "list-checks": ListChecks,
  heart: Heart,
  "shield-check": ShieldCheck,
  compass: Compass,
  users: Users,
  calculator: Calculator,
};

export function SiteLucideIcon({ name, className, size }: { name: SiteIconKey; className?: string; size?: string | number }) {
  const Icon = MAP[name] ?? MapPin;
  return <Icon className={className} size={size} />;
}
