"use client";
import Deck from "@/components/Deck";
import HumanOffHand from "@/components/HumanOffHand";
import Pile from "@/components/Pile";
import ResultOverlay from "@/components/ResultOverlay";
import ShownHand from "@/components/ShownHand";
import SortButton from "@/components/SortButton";
import Switcher from "@/components/Switcher";
import TitleScreenOverlay from "@/components/TitleScreenOverlay";
import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { AnimatePresence } from "framer-motion";
import * as React from "react";
import { useEffect, useRef } from "react";

export default function ZozCardPage() {
  const { send } = ZhitHeadContext.useActorRef();
  const actorRef = ZhitHeadContext.useActorRef();
  const renderCount = useRef(0);

  actorRef.subscribe({
    error: (error: unknown) => {
      console.error("Zoz XState error:", error);
    },
  });

  useEffect(() => {
    renderCount.current += 1;
  });

  // useEffect(() => {
  //   actorRef.subscribe((state) => {
  //     console.log("go", state.value, state.context);
  //   });
  // }, [actorRef]);

  const state = ZhitHeadContext.useSelector((state) => state);
  const isMainMenu = state.matches("mainMenu");
  const isEndScreen = state.matches("endScreen");
  const isPlaying = state.matches("playing");
  const isChoosingFaceUpCards = state.matches({
    playing: { playLoop: "choosingFaceUpCardsPhase" },
  });
  // const isAnimating = ZhitHeadContext.useSelector((state) =>
  //   state.matches({
  //     playing: { playLoop: { turnLoop: { playingTurn: "delayAfterTurn" } } },
  //   }),
  // );

  // const persistedState = useCallback(() => {
  //   const snapshot = actorRef.getPersistedSnapshot() as SnapshotFrom<
  //     typeof ZozCardMachine
  //   >;
  //   // console.log(snapshot.context);
  //   // console.log(JSON.stringify(snapshot.value, null, 2));
  //   return JSON.stringify(snapshot, null, 2);
  // }, [actorRef]);
  return (
    <div
      className="relative grid h-[calc(100vh)] grid-rows-3 overflow-hidden bg-gradient-to-r from-black via-emerald-800 to-black"
      // className="relative grid grid-rows-3 overflow-hidden bg-gradient-to-r from-black via-emerald-800 to-black"
      // style={{ height: windowHeight }}
    >
      <AnimatePresence mode="wait">
        {isMainMenu && (
          <TitleScreenOverlay onPlay={() => send({ type: "NEW_GAME" })} />
        )}
      </AnimatePresence>

      {isPlaying && (
        <>
          {/* <div className="debug-info fixed left-0 top-10 z-50 bg-black p-2 text-white">
            Renders: {renderCount.current}
          </div> */}
          <div className="relative">
            <ShownHand playerIndex={1} />
            <div className="absolute top-2 z-10 mx-auto w-full">
              <Switcher key="botswitcher" playerIndex={1} />
            </div>
          </div>
          {isChoosingFaceUpCards ? (
            <div className="m-auto">
              <HumanOffHand />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center gap-12">
              <Deck />
              <Pile />
            </div>
          )}
          <div className="relative">
            <div className="absolute -left-6 bottom-4 z-10 mx-auto flex w-full items-center justify-center gap-4">
              <SortButton key="sortbutton" />
              <Switcher key="humanswitcher" playerIndex={0} />
            </div>
            <ShownHand playerIndex={0} />
          </div>
        </>
      )}

      <AnimatePresence>{isEndScreen && <ResultOverlay />}</AnimatePresence>
    </div>
  );
}
