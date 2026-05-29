import { StateBlock } from "@doneisbetter/gds-core/client";
import { Compass } from "@/lib/appIcons";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  message,
  icon: Icon = Compass,
  action,
}: {
  title: string;
  message: string;
  icon?: React.ComponentType<{ size?: string | number; strokeWidth?: string | number; className?: string }>;
  action?: ReactNode;
}) {
  return (
    <StateBlock
      variant="empty"
      title={title}
      description={message}
      action={action}
      icon={<Icon size={24} strokeWidth={1.8} />}
    />
  );
}
