/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatelyInspectionEvent } from "@statelyai/inspect";

// let previousContext: any = undefined;

export const inspect = (inspEvent: StatelyInspectionEvent) => {
  if (inspEvent?.type === "@xstate.event") {
    console.log("EVENT:", inspEvent.event.type, inspEvent.event);
  }
  if (inspEvent?.type === "@xstate.snapshot") {
    console.log("STATE:", (inspEvent.snapshot as any).value);

    const newContext = (inspEvent.snapshot as any).context;
    console.log("CONTEXT CHANGES:", newContext);
    // if (previousContext === undefined) {
    //   previousContext = JSON.parse(JSON.stringify(newContext));
    // }
    // Object.keys(newContext).forEach((key) => {
    //   if (
    //     JSON.stringify(newContext[key]) !==
    //     JSON.stringify(previousContext[key])
    //   ) {
    //     console.log(`  ${key}:`);
    //     console.log(
    //       diffStringsUnified(previousContext[key], newContext[key]),
    //     );
    //   }
    // });
    // previousContext = JSON.parse(JSON.stringify(newContext));
  }
  if ((inspEvent as any)?._transitions?.[0]?.source) {
    console.log(
      "TRANSITION:",
      (inspEvent as any)._transitions[0]?.source?.key,
      "->",
      (inspEvent as any)._transitions[0]?.target?.[0]?.key
    );
  }
};
