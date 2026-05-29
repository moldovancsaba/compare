import Link from "next/link";
import { AccentPanel, SidebarNav, SidebarNavItem, SidebarNavSection } from "@doneisbetter/gds-core/client";
import { Badge, Button, Stack, Text } from "@mantine/core";
import { GraduationCap, Tent, PartyPopper, Sparkles, Heart, Calculator, Users, Home, UserCircle, CalendarClock } from "@/lib/appIcons";
import { getHrefForView, type ScoutPageKey } from "@/lib/scoutRoutes";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import { siteCopy, getText } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";

export type ViewKey = ScoutPageKey;

type NavItem = { key: ViewKey; icon: React.ComponentType<{ className?: string; size?: string | number }>; disabled?: boolean };

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
  locale: AppLocale;
  sidebarPromo?: { title: string; body: string; cta: string; href?: string };
}

export function Sidebar({ active, locale, sidebarPromo }: Props) {
  const primaryItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(0, 7);
  const utilityItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(7);
  const badgeFor = (key: ViewKey) => {
    if (key === "Saved") {
      return <Badge variant="light">{getText(siteCopy.nav.badges.saved, locale)}</Badge>;
    }
    if (key === "Calculator") {
      return <Badge variant="light">{getText(siteCopy.nav.badges.plan, locale)}</Badge>;
    }
    return undefined;
  };

  const navLabels = {
    home: getText(siteCopy.nav.home, locale),
    classes: getText(siteCopy.nav.classes, locale),
    camps: getText(siteCopy.nav.camps, locale),
    competitions: getText(siteCopy.nav.competitions, locale),
    hunting: getText(siteCopy.nav.hunting, locale),
    thisWeek: getText(siteCopy.nav.thisWeek, locale),
    meetupGroups: getText(siteCopy.nav.clubs, locale),
    saved: getText(siteCopy.nav.saved, locale),
    calculator: getText(siteCopy.nav.calculator, locale),
    account: getText(siteCopy.nav.account, locale),
    regionGuide: getText(siteCopy.nav.neighborhoodGuide, locale),
  };

  return (
    <SidebarNav ariaLabel="RangeScout navigation" gap="lg">
      <SidebarNavSection label="Discover">
        {primaryItems.map(({ key, icon: Icon, disabled }) => (
          <SidebarNavItem
            key={key}
            component={Link}
            href={disabled ? "#" : getHrefForView(key, locale)}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            label={{
              Home: navLabels.home,
              Classes: navLabels.classes,
              Camps: navLabels.camps,
              "Birthday Parties": navLabels.competitions,
              "Drop-In Activities": navLabels.hunting,
              "This Week": navLabels.thisWeek,
              "Meet-Up Groups": navLabels.meetupGroups,
              Saved: navLabels.saved,
              Calculator: navLabels.calculator,
              "My Account": navLabels.account,
              "Neighborhood Guide": navLabels.regionGuide,
            }[key]}
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
            href={disabled ? "#" : getHrefForView(key, locale)}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            label={{
              Home: navLabels.home,
              Classes: navLabels.classes,
              Camps: navLabels.camps,
              "Birthday Parties": navLabels.competitions,
              "Drop-In Activities": navLabels.hunting,
              "This Week": navLabels.thisWeek,
              "Meet-Up Groups": navLabels.meetupGroups,
              Saved: navLabels.saved,
              Calculator: navLabels.calculator,
              "My Account": navLabels.account,
              "Neighborhood Guide": navLabels.regionGuide,
            }[key]}
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
          title={sidebarPromo?.title ?? getText(siteCopy.sidebar.promoTitle, locale)}
        >
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {sidebarPromo?.body ?? getText(siteCopy.sidebar.promoBody, locale)}
            </Text>
            <Button
              component="a"
              href={sidebarPromo?.href ?? "mailto:hello@rangescout.eu?subject=Request%20listing%20info"}
              color="dark"
              variant="light"
              mt="xs"
              fullWidth
            >
              {sidebarPromo?.cta ?? getText(siteCopy.sidebar.promoCta, locale)}
            </Button>
          </Stack>
        </AccentPanel>
      </Stack>
      <Text size="xs" c="dimmed">
        {getText(siteCopy.sidebar.promoCopy, locale)}
      </Text>
    </SidebarNav>
  );
}
