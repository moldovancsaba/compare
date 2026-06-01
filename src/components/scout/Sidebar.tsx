import Link from "next/link";
import { AccentPanel, SidebarNav, SidebarNavItem, SidebarNavSection } from "@doneisbetter/gds-core/client";
import { Badge, Button, Stack, Text } from "@mantine/core";
import { GraduationCap, Tent, PartyPopper, Sparkles, Heart, Calculator, Users, Home, UserCircle, CalendarClock } from "@/lib/appIcons";
import { getHrefForView, type ScoutPageKey } from "@/lib/scoutRoutes";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import { siteCopy, getLocalText, type LocalCopySource } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";

export type ViewKey = ScoutPageKey;

type NavItem = { key: ViewKey; icon: React.ComponentType<{ className?: string; size?: string | number }>; disabled?: boolean };

const ITEMS: NavItem[] = [
  { key: "Home", icon: Home },
  { key: "Classes", icon: GraduationCap },
  { key: "Camps", icon: Tent },
  { key: "Competitions", icon: PartyPopper },
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
  copySource?: LocalCopySource;
}

export function Sidebar({ active, locale, sidebarPromo, copySource = null }: Props) {
  const localText = <T extends Record<AppLocale, string>>(path: string, fallback: T) => getLocalText(copySource, locale, path, fallback);
  const primaryItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(0, 7);
  const utilityItems = ITEMS.filter(({ key }) => key !== "This Week" || discoveryFeatureFlags.thisWeekEnabled).slice(7);
  const badgeFor = (key: ViewKey) => {
    if (key === "Saved") {
      return <Badge variant="light">{localText("nav.badges.saved", siteCopy.nav.badges.saved)}</Badge>;
    }
    if (key === "Calculator") {
      return <Badge variant="light">{localText("nav.badges.plan", siteCopy.nav.badges.plan)}</Badge>;
    }
    return undefined;
  };

  const navLabels = {
    home: localText("nav.home", siteCopy.nav.home),
    classes: localText("nav.classes", siteCopy.nav.classes),
    camps: localText("nav.camps", siteCopy.nav.camps),
    competitions: localText("nav.competitions", siteCopy.nav.competitions),
    hunting: localText("nav.hunting", siteCopy.nav.hunting),
    thisWeek: localText("nav.thisWeek", siteCopy.nav.thisWeek),
    meetupGroups: localText("nav.clubs", siteCopy.nav.clubs),
    saved: localText("nav.saved", siteCopy.nav.saved),
    calculator: localText("nav.calculator", siteCopy.nav.calculator),
    account: localText("nav.account", siteCopy.nav.account),
    regionGuide: localText("nav.neighborhoodGuide", siteCopy.nav.neighborhoodGuide),
  };

  return (
    <SidebarNav ariaLabel="RangeScout navigation" gap="lg">
      <SidebarNavSection label={localText("sidebar.discoverLabel", siteCopy.sidebar.discoverLabel)}>
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
              "Competitions": navLabels.competitions,
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

      <SidebarNavSection label={localText("sidebar.toolsLabel", siteCopy.sidebar.toolsLabel)} pushToBottom>
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
              "Competitions": navLabels.competitions,
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
          title={sidebarPromo?.title ?? localText("sidebar.promoTitle", siteCopy.sidebar.promoTitle)}
        >
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              {sidebarPromo?.body ?? localText("sidebar.promoBody", siteCopy.sidebar.promoBody)}
            </Text>
            <Button
              component="a"
              href={sidebarPromo?.href ?? "mailto:hello@rangescout.eu?subject=Request%20listing%20info"}
              color="dark"
              variant="light"
              mt="xs"
              fullWidth
            >
              {sidebarPromo?.cta ?? localText("sidebar.promoCta", siteCopy.sidebar.promoCta)}
            </Button>
          </Stack>
        </AccentPanel>
      </Stack>
      <Text size="xs" c="dimmed">
        {localText("sidebar.promoCopy", siteCopy.sidebar.promoCopy)}
      </Text>
    </SidebarNav>
  );
}
