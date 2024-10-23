import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { motion } from "framer-motion";
import { SortAsc } from "lucide-react";

export default function SortButton() {
  const { send } = ZhitHeadContext.useActorRef();
  const handLength = ZhitHeadContext.useSelector(
    (state) => state.context.players[0].hand.length
  );

  return (
    <motion.button
      onClick={() => send({ type: "SORT_HAND", playerIndex: 0 })}
      className="flex items-center justify-center rounded-full bg-black p-1.5 sm:p-2"
      title="Sort your hand"
      initial={{ y: 100 }}
      animate={{ y: !handLength ? 100 : 0 }}
      exit={{ y: 100 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
    >
      <SortAsc className="h-4 w-4 -rotate-90 stroke-zinc-200 sm:h-6 sm:w-6" />
    </motion.button>
  );
}
