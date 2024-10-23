import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { canPlay } from "@/lib/zhlib";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import Hand from "./Hand";
import OffHand from "./OffHand";

export default function ShownHand({ playerIndex }: { playerIndex: number }) {
  const { send } = ZhitHeadContext.useActorRef();

  const isHuman = playerIndex === 0;

  const state = ZhitHeadContext.useSelector((state) => state);

  const isChoosingFaceUpCards = state.matches({
    playing: { playLoop: "choosingFaceUpCardsPhase" },
  });
  const shownHand = state.context.players[playerIndex].shownHand;
  const hand = state.context.players[playerIndex].hand;
  const faceUp = state.context.players[playerIndex].faceUp;
  const faceDown = state.context.players[playerIndex].faceDown;
  const pile = state.context.pile;

  if (!send) {
    // console.error("No send function found");
    return null;
  }

  const flipped = playerIndex !== 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={shownHand}
        className={clsx(
          "absolute h-card-height w-full",
          shownHand === "hand" && (flipped ? "-top-5" : "-bottom-2.5"),
          shownHand === "offhand" && (flipped ? "top-20" : "bottom-20")
        )}
      >
        {shownHand === "hand" && (
          <Hand
            enablePlaySameRanks={isHuman && !isChoosingFaceUpCards}
            hand={hand}
            onCardClick={(card, _, n) => {
              if (isHuman) {
                send({ type: "CARD_CHOSEN", card, n });
              }
            }}
            grayOut={!isHuman ? undefined : (card) => !canPlay(card, pile)}
            flipped={flipped}
            hideCards={!isHuman}
            // hideCards={false}
          />
        )}
        {shownHand === "offhand" && (
          <OffHand
            disable={isHuman && isChoosingFaceUpCards}
            flipped={flipped}
            faceUp={faceUp}
            faceDown={faceDown}
            onCardPositionedClick={(card, _, n) => {
              if (isHuman) {
                send({ type: "CARD_CHOSEN", card, n });
              }
            }}
            grayOutFaceUpCard={(card) => !!hand.length || !canPlay(card, pile)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
