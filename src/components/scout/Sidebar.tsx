import Link from "next/link";
import { AccentPanel, SidebarNav, SidebarNavItem, SidebarNavSection } from "@doneisbetter/gds-core/client";
import { Badge, Button, Stack, Text } from "@mantine/core";
import { GraduationCap, Tent, PartyPopper, Sparkles, Heart, Calculator, Users, Home, UserCircle, CalendarClock } from "@/lib/appIcons";
import { getHrefForView, type ScoutPageKey } from "@/lib/scoutRoutes";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";

export type ViewKey = ScoutPageKey;

type NavItem = { key: ViewKey; icon: React.ComponentType<{ className?: string; size?: string | number }>; disabled?: boolean };

const NAV_LABELS: Record<ViewKey, string> = {
  Home: "Home",
  Classes: "Training",
  Camps: "Ranges",
  "Birthday Parties": "Competitions",
  "Drop-In Activities": "Hunting Grounds",
  "This Week": "This Week",
  "Meet-Up Groups": "Clubs",
  Saved: "Saved",
  Calculator: "Planner",
  "My Account": "My Account",
  "Neighborhood Guide": "Region Guide",
};

const ITEMS: NavItem[] = [
  { key: "Home", icon: Home },
  { key: "Classes", icon: GraduationCap },
  { key: "Camps", icon: Tent },
  { key: "Birthday Parties", icon: PartyPopper },
  { key: "Drop-In Activities", icon: Sparkles },
  { key: "This Week", icon: CalendarClock },
  { key: "Meet-Up Groups", icon: Users },
  { key: "Saved", icon: Heart },
  { key: "Calculator", icon: Calculator },
  { key: "My Account", icon: UserCircle },
];

interface Props {
  active: ViewKey;
  sidebarPromo?: { title: string; body: string; cta: string; href?: string };
}

export function Sidebar({ active, sidebarPromo }: Props) {
  const primaryItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(0, 7);
  const utilityItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(7);
  const badgeFor = (key: ViewKey) => {
    if (key === "Saved") {
      return <Badge variant="light">Saved</Badge>;
    }
    if (key === "Calculator") {
      return <Badge variant="light">Plan</Badge>;
    }
    return undefined;
  };

  return (
    <SidebarNav ariaLabel="RangeScout navigation" gap="lg">
      <SidebarNavSection label="Discover">
        {primaryItems.map(({ key, icon: Icon, disabled }) => (
          <SidebarNavItem
            key={key}
            component={Link}
            href={disabled ? "#" : getHrefForView(key)}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            label={NAV_LABELS[key]}
            icon={<Icon size={18} />}
            disabled={disabled}
            active={!disabled && active === key}
            color="teal"
            variant={active === key ? "filled" : "light"}
          />
        ))}
      </SidebarNavSection>

      <SidebarNavSection label="My tools" pushToBottom>
        {utilityItems.map(({ key, icon: Icon, disabled }) => (
          <SidebarNavItem
            key={key}
            component={Link}
            href={disabled ? "#" : getHrefForView(key)}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            label={NAV_LABELS[key]}
            icon={<Icon size={18} />}
            badge={badgeFor(key)}
            disabled={disabled}
            active={!disabled && active === key}
            color="teal"
            variant={active === key ? "filled" : "light"}
          />
        ))}
      </SidebarNavSection>

      <Stack gap="sm">
        <AccentPanel
          tone="amber"
          title={sidebarPromo?.title ?? "List your venue"}
        >
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {sidebarPromo?.body ?? "Tell us about your range, club, training lane, or hunting venue and we’ll follow up about the right listing path for EU operators."}
            </Text>
            <Button
              component="a"
              href={sidebarPromo?.href ?? "mailto:hello@rangescout.eu?subject=Request%20listing%20info"}
              color="dark"
              variant="light"
              mt="xs"
              fullWidth
            >
              {sidebarPromo?.cta ?? "Request listing info"}
            </Button>
          </Stack>
        </AccentPanel>
      </Stack>
      <Text size="xs" c="dimmed">
        Curated, source-backed sport shooting venues and clubs across the EU.
      </Text>
    </SidebarNav>
  );
}
