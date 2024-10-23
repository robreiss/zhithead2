import { ZhitHeadContext } from "@/components/ZhitHeadProvider";
import { getRank, isPileBurnable, Rank, Card as TCard } from "@/lib/zhlib";
import { AnimatePresence, motion, TargetAndTransition } from "framer-motion";
import Card from "./Card";
import CardHolder from "./CardHolder";
import Count from "./Count";
import Fire from "./Fire";

export default function Pile() {
  const pile = ZhitHeadContext.useSelector((snapshot) => snapshot.context.pile);
  const { send } = ZhitHeadContext.useActorRef();

  const shouldBurnPile = isPileBurnable(pile);
  // const topCard = pile.at(-1);
  // topCard !== undefined && getRank(topCard) === Rank.Num10;

  function animate(card: TCard): TargetAndTransition {
    const is8 = getRank(card) === Rank.Num8;
    const firstNon8AfterCard = pile
      .slice(pile.indexOf(card)! + 1)
      .find((card: TCard) => getRank(card) !== Rank.Num8);
    const shouldAnimate = is8 && firstNon8AfterCard === undefined;

    return {
      opacity: shouldBurnPile ? 0 : 1,
      x: shouldAnimate ? 25 : 0,
      y: shouldAnimate ? 20 : 0,
      transition: {
        delay: shouldAnimate ? 0.6 : 0.3,
        type: "tween",
      },
    };
  }

  return (
    <CardHolder>
      {pile.map((card: TCard) => (
        <motion.div
          className="absolute"
          key={card}
          onClick={() => send({ type: "TAKE_PILE" })}
          animate={animate(card)}
        >
          <Card card={card} noShadow={shouldBurnPile} />
        </motion.div>
      ))}

      <Count count={pile.length} position="top-left" z={99} />
      <AnimatePresence>{!pile.length && <Text />}</AnimatePresence>

      <AnimatePresence>{shouldBurnPile && <FireAnimation />}</AnimatePresence>
    </CardHolder>
  );
}

function FireAnimation() {
  // const isBreakpoint = useContext(BreakpointsContext);
  const isMobile = false;
  //  isBreakpoint("sm");

  return (
    <motion.div
      className="absolute h-full w-full"
      key="fire"
      initial={{
        opacity: 0,
        y: isMobile ? -40 : 40,
        x: isMobile ? -20 : 0,
      }}
      animate={{
        scale: isMobile ? 1.5 : 2.0,
        y: isMobile ? -75 : -50,
        x: isMobile ? -35 : 0,
        opacity: 1,
        transition: {
          type: "tween",
          delay: 0.35,
          ease: "easeInOut",
        },
      }}
      exit={{
        opacity: 0,
        scale: isMobile ? 0.5 : 1.5,
        y: isMobile ? 25 : 15,
        x: isMobile ? -10 : 0,
        transition: {
          duration: 0.9,
          type: "tween",
          ease: "easeInOut",
        },
      }}
    >
      <Fire />
    </motion.div>
  );
}

function Text() {
  return (
    <motion.div
      className="absolute flex h-full w-full items-center justify-center"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <span className="select-none text-xl font-semibold tracking-wide text-zinc-200 md:text-4xl md:font-bold md:tracking-wider">
        PILE
      </span>
    </motion.div>
  );
}
