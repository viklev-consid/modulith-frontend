"use client";

import { ShieldAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isPlatformOverride } from "@/lib/org-access-mode";

/**
 * Surfaces `accessMode === "PlatformOverride"` in the org shell header.
 *
 * Platform admins with `organizations.platform.override` can succeed on org
 * endpoints they aren't members of. They don't appear in /my, owner counts,
 * or member lists. The badge gives them (and anyone shoulder-surfing) a
 * persistent visual reminder that they're acting outside their membership.
 */
export function AccessModeBadge({ accessMode }: { accessMode: string }) {
  const t = useTranslations("organizations.shell.accessMode");

  if (!isPlatformOverride(accessMode)) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="destructive" className="gap-1">
            <ShieldAlertIcon className="size-3" />
            <span>{t("platformOverrideLabel")}</span>
          </Badge>
        }
      />
      <TooltipContent>{t("platformOverrideDescription")}</TooltipContent>
    </Tooltip>
  );
}
