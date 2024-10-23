import { getRank, OffHandCards, Card as TCard } from "@/lib/zhlib";
import { motion } from "framer-motion";
import { useState } from "react";
import Card from "./Card";
import CardHolder from "./CardHolder";

type Position = 0 | 1 | 2;

export interface OffHandProps {
  faceDown: OffHandCards;
  faceUp: OffHandCards;
  flipped?: boolean;
  onCardPositionedClick?: (card: TCard, position: Position, n?: number) => void;
  grayOutFaceUpCard?: (card: TCard, position: Position) => boolean;
  disable?: boolean;
}

export default function OffHand(props: OffHandProps) {
  const flippedSign = props.flipped ? -1 : 1;

  function sameRanksAmnt(card?: TCard): number {
    if (card === undefined) return 0;
    return props.faceUp.filter(
      (hCard) => hCard !== undefined && getRank(hCard) === getRank(card)
    ).length;
  }

  const [selected, setSelected] = useState<TCard | null>(null);
  function onCardPositionedClick(card: TCard, i: Position, n?: number) {
    if (props.disable) return;
    if (props.grayOutFaceUpCard?.(card, i)) return;

    setSelected(null);
    if (sameRanksAmnt(card) === 1) {
      props.onCardPositionedClick?.(card, i, undefined);
    } else if (n !== undefined) {
      props.onCardPositionedClick?.(card, i, n);
    } else {
      setSelected(card);
    }
  }

  return (
    <motion.div
      initial={{ y: 300 * flippedSign }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2, type: "tween" }}
      exit={{ y: 300 * flippedSign }}
      className="flex justify-center gap-2 md:gap-4"
    >
      {[0, 1, 2].map((index) => (
        <CardHolder key={index}>
          {props.faceDown[index] !== undefined && (
            <div className="absolute">
              <Card
                flipped
                card={props.faceDown[index]}
                onClick={(card) => {
                  if (card !== undefined) {
                    props.onCardPositionedClick?.(card, index as Position);
                  }
                }}
              />
            </div>
          )}
          {props.faceUp[index] !== undefined && (
            <div className="absolute">
              <Card
                withSelector={selected === props.faceUp[index]}
                selectorMax={sameRanksAmnt(props.faceUp[index])}
                card={props.faceUp[index]}
                z={1}
                onClick={(_, n) =>
                  onCardPositionedClick(
                    props.faceUp[index]!,
                    index as Position,
                    n
                  )
                }
                grayOut={props.grayOutFaceUpCard?.(
                  props.faceUp[index]!,
                  index as Position
                )}
              />
            </div>
          )}
        </CardHolder>
      ))}
    </motion.div>
  );
}
