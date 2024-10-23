"use client";
import { ZozCardMachine } from "@/lib/ZhitHeadMachine";
import { createActorContext } from "@xstate/react";

// const ZhitHeadContext = createActorContext(ZozCardMachine, {
//   inspect,
// });
export const ZhitHeadContext = createActorContext(ZozCardMachine);

export function ZhitHeadProvider({ children }: { children: React.ReactNode }) {
  return <ZhitHeadContext.Provider>{children}</ZhitHeadContext.Provider>;
}
