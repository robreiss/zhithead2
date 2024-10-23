import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { offHandLen } from "@/lib/zhlib";
import UISwitcher from "./UISwitcher";

export default function Switcher({ playerIndex }: { playerIndex: number }) {
  const { send } = ZhitHeadContext.useActorRef();
  const state = ZhitHeadContext.useSelector((state) => state);
  const hand = state.context.players[playerIndex].hand;
  const faceUp = state.context.players[playerIndex].faceUp;
  const faceDown = state.context.players[playerIndex].faceDown;
  const shownHand = state.context.players[playerIndex].shownHand;

  return (
    <UISwitcher
      left={["Hand", hand.length]}
      right={["Off-Hand", offHandLen(faceDown) + offHandLen(faceUp)]}
      state={shownHand === "hand" ? "left" : "right"}
      onSwitch={(val) =>
        send({
          type: "SET_SHOWN_HAND",
          shownHand: val === "left" ? "hand" : "offhand",
          playerIndex,
        })
      }
      position={playerIndex === 0 ? "bottom" : "top"}
    />
  );
}
