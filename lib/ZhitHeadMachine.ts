// "use client";
// import { inspect } from "@/components/jsoninspect";
import {
  asCards,
  botChooseCard,
  canPlay,
  Card,
  compareCards,
  getRank,
  isPileBurnable,
  newGameState,
  OffHandCards,
  offHandLen,
  Player,
  playerCurHand,
  playerHasCards,
  ShownHand,
} from "@/lib/zhlib";
import { assign, raise, setup, SnapshotFrom } from "xstate";

export interface ZhitHeadContext {
  deck: Card[];
  pile: Card[];
  players: Player[];
  currentTurn: number;
  persistedState: string | null;
}

function createInitialContext(): ZhitHeadContext {
  return newGameState();
}

type ZozCardEvent =
  | { type: "NEW_GAME" }
  | { type: "RETURN_TO_MENU" }
  | { type: "SET_SHOWN_HAND"; playerIndex: number; shownHand: ShownHand }
  | { type: "SORT_HAND"; playerIndex: number }
  | { type: "LAYOUT_ANIMATION_COMPLETE" }
  | { type: "TAKE_PILE" }
  | { type: "CARD_CHOSEN"; card?: Card; n?: number };

export const ZozCardMachine = setup({
  types: {
    context: {} as ZhitHeadContext,
    events: {} as ZozCardEvent,
  },
  guards: {
    isFaceUpFull: ({ context }) =>
      context.players.every((player) => offHandLen(player.faceUp) === 3),
    hasPersistedState: ({ context }) => {
      return context.persistedState !== null;
    },
    isGameOver: ({ context }) => {
      return context.players.some((player) => !playerHasCards(player));
    },
    isCurrentPlayerBot: ({ context }) => {
      return context.currentTurn > 0; // Index 0 is human, index > 0 are bots
    },
    shouldDrawCard: ({ context }) => {
      const currentPlayer = context.players[context.currentTurn];
      return context.deck.length > 0 && currentPlayer.hand.length < 3;
    },
    shouldSwitchHand: ({ context }) => {
      const currentPlayer = context.players[context.currentTurn];
      return (
        (currentPlayer.hand.length > 0 && currentPlayer.shownHand !== "hand") ||
        (currentPlayer.hand.length === 0 && currentPlayer.shownHand === "hand")
      );
    },
    isPileBurnable: ({ context }) => {
      return isPileBurnable(context.pile);
    },
    isValidFaceDownCardPlay: ({ context, event }) => {
      if (event.type !== "CARD_CHOSEN") return false;
      if (event.card === undefined) return false;

      const player = context.players[context.currentTurn];
      const card = event.card;
      const curHandType = playerCurHand(player);

      if (curHandType !== "faceDown") return false;

      return player.faceDown.includes(card);
    },
    isValidVisibleCardPlay: ({ context, event }) => {
      if (event.type !== "CARD_CHOSEN") return false;
      if (event.card === undefined) return false;

      const player = context.players[context.currentTurn];
      const pile = context.pile;
      const card = event.card;
      const curHandType = playerCurHand(player);

      if (curHandType === "faceDown") return false;

      if (!canPlay(card, pile)) return false;

      switch (curHandType) {
        case "hand":
          return player.hand.includes(card);
        case "faceUp":
          return player.faceUp.includes(card);
      }
      return false;
    },
    canTakePile: ({ context }) => {
      return context.pile.length > 0;
    },
  },
  actions: {
    shuffleDeck: assign(() => {
      return newGameState();
    }),
    playCardToFaceUp: assign(
      ({
        context,
        event,
      }: {
        context: ZhitHeadContext;
        event: ZozCardEvent;
      }) => {
        if (event.type !== "CARD_CHOSEN" || event.card === undefined) return {};
        const player = context.players[context.currentTurn];
        if (offHandLen(player.faceUp) === 3) return {};

        const card = event.card;

        const newHand = player.hand.filter((c) => c !== card);

        const newFaceUp: OffHandCards = [...player.faceUp];
        const firstUndefinedIndex = newFaceUp.findIndex((c) => c === undefined);
        if (firstUndefinedIndex !== -1) {
          newFaceUp[firstUndefinedIndex] = card;
        }

        return {
          players: context.players.map((p, index) =>
            index === context.currentTurn
              ? {
                  ...p,
                  hand: newHand,
                  faceUp: newFaceUp,
                }
              : p
          ),
        };
      }
    ),
    clearPersistedState: () => {
      localStorage.removeItem("zozCardState");
    },
    savePersistedState: ({ self }) => {
      // We use setTimeout to ensure this runs after the context has been updated
      setTimeout(() => {
        const snapshot = self.getPersistedSnapshot() as SnapshotFrom<
          typeof ZozCardMachine
        >;
        const saveState = {
          context: snapshot.context,
          value: snapshot.value,
        };
        localStorage.setItem("zozCardState", JSON.stringify(saveState));
      }, 0);
    },
    getPersistedState: assign({
      persistedState: () => {
        const storedState = localStorage.getItem("zozCardState");
        return storedState ?? null;
      },
    }),
    loadPersistedState: assign(({ context }) => {
      const persistedState = context.persistedState;
      if (!persistedState) return {};
      const parsedState = JSON.parse(persistedState);
      parsedState.context.persistedState = null;
      return parsedState.context;
    }),
    log: ({ context, event }, param: string) => {
      console.log("XLog:", param, {
        event: event.type,
        context: context,
      });
    },
    switchHand: assign(({ context }: { context: ZhitHeadContext }) => {
      const playerIndex = context.currentTurn;
      const shownHand = context.players[playerIndex].shownHand;
      const player = context.players[playerIndex];
      let newShownHand = shownHand;

      if (shownHand === "hand" && player.hand.length === 0) {
        newShownHand = "offhand";
      } else if (shownHand === "offhand" && player.hand.length > 0) {
        newShownHand = "hand";
      }

      return {
        players: context.players.map((player, index) =>
          index === playerIndex
            ? { ...player, shownHand: newShownHand }
            : player
        ),
      };
    }),
    setShownHand: assign(({ context, event }) => {
      if (event.type !== "SET_SHOWN_HAND")
        throw new Error("Invalid event type");
      const { playerIndex, shownHand } = event;
      return {
        players: context.players.map((player, index) =>
          index === playerIndex ? { ...player, shownHand } : player
        ),
      };
    }),
    sortHand: assign(
      ({
        context,
        event,
      }: {
        context: ZhitHeadContext;
        event: ZozCardEvent;
      }) => {
        if (event.type !== "SORT_HAND" || event.playerIndex === undefined)
          return {};
        const { playerIndex } = event;
        const player = context.players[playerIndex];
        if (!player) return {};

        const sortedHand = [...player.hand].sort(compareCards);
        return {
          players: context.players.map((p, index) =>
            index === playerIndex ? { ...p, hand: sortedHand } : p
          ),
        };
      }
    ),
    setNextPlayer: assign(({ context }: { context: ZhitHeadContext }) => {
      const nextPlayerIndex =
        (context.currentTurn + 1) % context.players.length;
      return {
        currentTurn: nextPlayerIndex,
      };
    }),
    takePile: assign(({ context }: { context: ZhitHeadContext }) => {
      const player = context.players[context.currentTurn];
      const newHand = [...player.hand, ...context.pile];
      return {
        players: context.players.map((p, index) =>
          index === context.currentTurn ? { ...p, hand: newHand } : p
        ),
        pile: [],
      };
    }),
    botPlayCard: raise(({ context }): ZozCardEvent => {
      const botPlayer = context.players[context.currentTurn];
      const res = botChooseCard(botPlayer, context.pile);
      if (res !== undefined) {
        return { type: "CARD_CHOSEN", card: res[0], n: res[1] };
      } else if (context.pile.length > 0) {
        return { type: "TAKE_PILE" };
      } else {
        throw new Error("Bot has no valid card to play");
      }
    }),
    processFaceDownCard: assign(({ context, event }) => {
      if (event.type !== "CARD_CHOSEN") {
        throw new Error(`Unexpected event type: ${event.type}`);
      }
      if (event.card === undefined) {
        throw new Error("Card is undefined");
      }

      const player = context.players[context.currentTurn];
      const card = event.card;
      const cardIndex = player.faceDown.findIndex((c) => c === card);
      if (cardIndex === -1) {
        throw new Error("Card not found in faceDown");
      }

      const updatedPlayer = { ...player };
      updatedPlayer.faceDown[cardIndex] = undefined; // Remove the card from faceDown

      if (canPlay(card, context.pile)) {
        return {
          pile: [...context.pile, card],
          players: context.players.map((p, idx) =>
            idx === context.currentTurn ? updatedPlayer : p
          ),
        };
      } else {
        const updatedHand = [...player.hand, card, ...context.pile];
        updatedPlayer.hand = updatedHand;
        return {
          pile: [],
          players: context.players.map((p, idx) =>
            idx === context.currentTurn ? updatedPlayer : p
          ),
        };
      }
    }),
    processChosenCard: assign(({ context, event }) => {
      try {
        if (event.type !== "CARD_CHOSEN") {
          throw new Error(`Unexpected event type: ${event.type}`);
        }
        if (event.card === undefined) {
          throw new Error("Card is undefined");
        }

        const player = context.players[context.currentTurn];
        const chosenCard = event.card;
        const curHandType = playerCurHand(player);

        const getTestHand = (
          handType: ReturnType<typeof playerCurHand>
        ): Card[] => {
          switch (handType) {
            case "hand":
              return player.hand;
            case "faceUp":
              return asCards(player.faceUp);
            case "faceDown":
              return asCards(player.faceDown);
            default:
              throw new Error(`Invalid hand type: ${handType}`);
          }
        };

        const testHand = getTestHand(curHandType);

        const toPlay: Card[] = [chosenCard];
        if (event.n && event.n > 1) {
          const additionalCards = testHand
            .filter((card) => card && getRank(card) === getRank(chosenCard))
            .filter((card) => card !== chosenCard)
            .slice(0, event.n - 1);
          toPlay.push(...additionalCards);
        }

        const updateHand = (handType: ReturnType<typeof playerCurHand>) => {
          switch (handType) {
            case "hand":
              return player.hand.filter((card) => !toPlay.includes(card));
            case "faceUp":
            case "faceDown":
              return (player[handType] as OffHandCards).map((card) =>
                toPlay.includes(card as Card) ? undefined : card
              ) as OffHandCards;
          }
        };

        const updatedPlayer = {
          ...player,
          [curHandType as string]: updateHand(curHandType),
        };

        return {
          players: context.players.map((p, idx) =>
            idx === context.currentTurn ? updatedPlayer : p
          ),
          pile: [...context.pile, ...toPlay],
        };
      } catch (error) {
        console.error("Error in processChosenCard:", error);
        return {}; // Return empty object to avoid state changes on error
      }
    }),
    updateGameState: assign(() => {
      return {};
    }),
    burnPile: assign(() => {
      return {
        pile: [],
      };
    }),
    drawCard: assign(({ context }) => {
      const currentPlayer = context.players[context.currentTurn];
      const [takenCard, ...remainingDeck] = context.deck;
      const updatedPlayer = {
        ...currentPlayer,
        hand: [...currentPlayer.hand, takenCard],
      };
      return {
        deck: remainingDeck,
        players: context.players.map((player, index) =>
          index === context.currentTurn ? updatedPlayer : player
        ),
      };
    }),
  },
}).createMachine({
  id: "zozCardActor",
  initial: "mainMenu",
  context: () => {
    return createInitialContext();
  },
  states: {
    mainMenu: {
      on: { NEW_GAME: "initializing" },
    },
    initializing: {
      entry: [{ type: "getPersistedState" }],
      always: [
        {
          guard: "hasPersistedState",
          target: "loadingPersistedState",
        },
        {
          target: "shuffling",
        },
      ],
    },
    loadingPersistedState: {
      entry: ["loadPersistedState"],
      always: "playing",
    },
    shuffling: {
      entry: ["shuffleDeck"],
      always: "playing",
    },
    playing: {
      type: "parallel",
      initial: "playLoop",
      states: {
        playLoop: {
          initial: "choosingFaceUpCardsPhase",
          // initial: "turnLoop",
          states: {
            choosingFaceUpCardsPhase: {
              initial: "checkOffHand",
              states: {
                checkOffHand: {
                  always: [
                    {
                      guard: "isFaceUpFull",
                      target: "delayTurnLoop",
                    },
                    {
                      target: "choosingFaceUpCards",
                    },
                  ],
                },
                choosingFaceUpCards: {
                  on: {
                    CARD_CHOSEN: {
                      actions: [
                        "playCardToFaceUp",
                        // {
                        //   type: "savePersistedState",
                        //   params: { goto: "blah" },
                        // },
                      ],
                      target: "checkOffHand",
                    },
                  },
                },
                delayTurnLoop: {
                  after: {
                    1000: "#zozCardActor.playing.playLoop.turnLoop",
                  },
                },
              },
            },
            turnLoop: {
              initial: "playingTurn",
              states: {
                nextPlayer: {
                  entry: "setNextPlayer",
                  always: "playingTurn",
                },
                playingTurn: {
                  initial: "decidePlayerType",
                  states: {
                    decidePlayerType: {
                      always: [
                        { guard: "isCurrentPlayerBot", target: "botTurn" },
                        { target: "humanTurn" },
                      ],
                    },
                    humanTurn: {
                      on: {
                        CARD_CHOSEN: [
                          {
                            guard: "isValidFaceDownCardPlay",
                            actions: "processFaceDownCard",
                            target: "delayAfterTurn",
                          },
                          {
                            guard: "isValidVisibleCardPlay",
                            actions: "processChosenCard",
                            target: "delayAfterTurn",
                          },
                        ],
                        TAKE_PILE: {
                          guard: "canTakePile",
                          actions: "takePile",
                          target: "delayAfterTurn",
                        },
                      },
                    },
                    botTurn: {
                      entry: ["botPlayCard"],
                      on: {
                        CARD_CHOSEN: [
                          {
                            guard: "isValidFaceDownCardPlay",
                            actions: "processFaceDownCard",
                            target: "delayAfterTurn",
                          },
                          {
                            guard: "isValidVisibleCardPlay",
                            actions: "processChosenCard",
                            target: "delayAfterTurn",
                          },
                        ],
                        TAKE_PILE: {
                          guard: "canTakePile",
                          actions: "takePile",
                          target: "delayAfterTurn",
                        },
                      },
                    },
                    delayAfterTurn: {
                      after: {
                        800: "afterTurn",
                      },
                      on: {
                        LAYOUT_ANIMATION_COMPLETE: {
                          target: "afterTurn",
                        },
                      },
                    },
                    afterTurn: {
                      entry: "updateGameState",
                      always: [
                        {
                          guard: "isGameOver",
                          target: "#zozCardActor.endScreen",
                        },
                        {
                          guard: "isPileBurnable",
                          actions: "burnPile",
                          target: "delayAfterTurn",
                        },
                        {
                          guard: "shouldSwitchHand",
                          actions: "switchHand",
                          target: "delayAfterTurn",
                        },
                        {
                          guard: "shouldDrawCard",
                          actions: "drawCard",
                          target: "delayAfterTurn",
                        },
                        {
                          target:
                            "#zozCardActor.playing.playLoop.turnLoop.nextPlayer",
                        },
                        {
                          target: "#zozCardActor.error",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        switcher: {
          on: {
            SET_SHOWN_HAND: {
              actions: "setShownHand",
              target: "..",
            },
          },
        },
        sorter: {
          on: {
            SORT_HAND: {
              actions: "sortHand",
              target: "..",
            },
          },
        },
      },
    },
    error: {
      entry: { type: "log", params: "error state ran to end" },
      on: { RETURN_TO_MENU: "mainMenu" },
      after: {
        60000: { target: "mainMenu" },
      },
    },
    endScreen: {
      // entry: "clearPersistedState",
      on: { RETURN_TO_MENU: "mainMenu" },
      after: {
        60000: { target: "mainMenu" },
      },
    },
  },
});
