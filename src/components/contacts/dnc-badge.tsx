"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ban } from "lucide-react";

/**
 * Red DNC badge that disables action buttons when a contact is on the Do Not Contact list.
 */
export function DNCBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-red-600 hover:bg-red-600 text-white font-black text-[10px] gap-1 cursor-default select-none">
            <Ban className="h-3 w-3" />
            DNC
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">This contact is on the Do Not Contact list. All outreach is disabled.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Wraps action buttons — if DNC, replaces with the DNC badge and blocks interaction.
 */
export function DNCGuard({ isDNC, children }: { isDNC: boolean; children: React.ReactNode }) {
  if (isDNC) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed inline-flex">
              <DNCBadge />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Do Not Contact — outreach disabled.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return <>{children}</>;
}
