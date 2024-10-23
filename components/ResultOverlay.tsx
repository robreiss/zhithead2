import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { playerHasCards } from "@/lib/zhlib";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

export default function ResultOverlay() {
  const { send } = ZhitHeadContext.useActorRef();

  const state = ZhitHeadContext.useSelector((state) => state);

  const [hasLost, setHasLost] = useState<boolean>(true);

  useEffect(() => {
    const hasLost = playerHasCards(state.context.players[0]);
    setHasLost(hasLost);
  }, [state]);

  const msgs = {
    won: {
      header: "You Won!",
      button: "Play again?",
    },
    lost: {
      header: "You lose.",
      button: "Try again?",
    },
  };

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.66,
        delayChildren: 1.5,
      },
    },
  };

  const text: Variants = {
    hidden: {
      y: 40,
      opacity: 0,
      transition: { type: "tween" },
    },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "tween" },
    },
  };

  function restart() {
    send({ type: "RETURN_TO_MENU" });
  }

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black to-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        exit="hidden"
        className="flex flex-col items-center gap-4"
      >
        <motion.h2 variants={text} className="text-4xl font-bold text-white">
          {hasLost ? msgs.lost.header : msgs.won.header}
        </motion.h2>
        <motion.button
          onClick={restart}
          variants={text}
          className="text-xl text-white underline transition-colors hover:text-gray-300"
        >
          {hasLost ? msgs.lost.button : msgs.won.button}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
