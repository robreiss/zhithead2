import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import OffHand from "./OffHand";

export default function HumanOffHand() {
  const faceUp = ZhitHeadContext.useSelector(
    (snapshot) => snapshot.context.players[0].faceUp
  );
  const faceDown = ZhitHeadContext.useSelector(
    (snapshot) => snapshot.context.players[0].faceDown
  );

  const isChoosingFaceUpCards = ZhitHeadContext.useSelector((state) =>
    state.matches({ playing: { playLoop: "choosingFaceUpCardsPhase" } })
  );

  return (
    <OffHand
      faceUp={faceUp}
      faceDown={faceDown}
      disable={isChoosingFaceUpCards}
    />
  );
}
