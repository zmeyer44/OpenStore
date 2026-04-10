"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return <Group className={cn("flex h-full w-full", className)} {...props} />;
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
  return <Panel {...props} />;
}

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border/60 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 hover:bg-primary/30 data-[resize-handle-active]:bg-primary/50 transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
