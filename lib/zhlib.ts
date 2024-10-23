export type Card = number;

export type Cards = Card[];

export type OffHandCards = [Card?, Card?, Card?];

export type ShownHand = "hand" | "offhand";

export interface Player {
  shownHand: ShownHand;
  hand: Cards;
  faceDown: OffHandCards;
  faceUp: OffHandCards;
}

export enum Suite {
  Spades,
  Diamonds,
  Clubs,
  Hearts,
}

export enum Rank {
  Num2,
  Num3,
  Num4,
  Num5,
  Num6,
  Num7,
  Num8,
  Num9,
  Num10,
  Jack,
  Queen,
  King,
  Ace,
}

function createRanks(): Rank[] {
  return [
    Rank.Ace,
    Rank.Num2,
    Rank.Num3,
    Rank.Num4,
    Rank.Num5,
    Rank.Num6,
    Rank.Num7,
    Rank.Num8,
    Rank.Num9,
    Rank.Num10,
    Rank.Jack,
    Rank.Queen,
    Rank.King,
  ];
}

function createSuites(): Suite[] {
  return [Suite.Clubs, Suite.Diamonds, Suite.Hearts, Suite.Spades];
}

export function createDeck(): Card[] {
  return createSuites().flatMap((suite) =>
    createRanks().map((rank) => createCard(suite, rank))
  );
}

export const SUITE_BIN_WIDTH = 2;

export function createCard(suite: Readonly<Suite>, rank: Readonly<Rank>): Card {
  return (rank << SUITE_BIN_WIDTH) | suite;
}

function _1s(n: number): number {
  return (1 << n) - 1;
}

export function getSuite(card: Readonly<Card>): Suite {
  return card & _1s(SUITE_BIN_WIDTH);
}

const RANK_BIN_WIDTH = 4;

export function getRank(card: Readonly<Card>): Rank {
  return (card >> SUITE_BIN_WIDTH) & _1s(RANK_BIN_WIDTH);
}

export function cardToString(card: Readonly<Card>) {
  return `${Suite[getSuite(card)]}-${[Rank[getRank(card)]]}`;
}

export function compareCards(a: Readonly<Card>, b: Readonly<Card>) {
  return getRank(a) - getRank(b);
}

export function isPileBurnable(pile: Readonly<Card[]>): boolean {
  const topCard = pile.at(-1);
  if (topCard === undefined) return false;
  const isTopCard10 = getRank(topCard) === Rank.Num10;
  const areTop4CardsSameRank =
    pile.length >= 4 &&
    pile.slice(-4).every((card) => getRank(card) === getRank(topCard));
  return isTopCard10 || areTop4CardsSameRank;
}

export function asCards(
  cards: Readonly<OffHandCards> | Readonly<Cards>
): Cards {
  return cards.filter((card) => card !== undefined) as Cards;
}

export function makePlayer(): Player {
  return {
    shownHand: "hand",
    hand: [],
    faceDown: [undefined, undefined, undefined],
    faceUp: [undefined, undefined, undefined],
  };
}

export const HandKinds = ["hand", "faceUp", "faceDown"] as const;
type HandKind = (typeof HandKinds)[number];

export function offHandLen(cards: OffHandCards) {
  return cards.filter((card) => card !== undefined).length;
}

export function playerHasCards(player: Player) {
  return (
    playerHandLen(player, "hand") +
      playerHandLen(player, "faceDown") +
      playerHandLen(player, "faceUp") >
    0
  );
}

export function playerHandLen(player: Player, kind: HandKind) {
  switch (kind) {
    case "hand":
      return player.hand.length;
    case "faceDown":
    case "faceUp":
      return offHandLen(player[kind]);
  }
}

export function playerCurHand(player: Player): HandKind | undefined {
  return HandKinds.find((kind) => playerHandLen(player, kind) > 0);
}

const STARTING_HAND_SIZE = 6;
const STARTING_FACEDOWN_SIZE = 3;

export function dealCards(deck: Readonly<Card[]>): [Card[], Player] {
  const deckCopy = deck.slice();
  const player = makePlayer();
  player.hand = deckCopy.splice(-STARTING_HAND_SIZE);
  player.faceDown = deckCopy.splice(-STARTING_FACEDOWN_SIZE) as OffHandCards;
  return [deckCopy, player];
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function newGameState() {
  const shuffledDeck = shuffle(createDeck());
  const [deck, [human, bot]] = dealCardsFor(2, shuffledDeck);

  bot.faceUp = bot.hand.splice(0, 3) as OffHandCards;

  // uncomment to test faceDown
  const newdeck = deck.slice(0, 0);
  human.faceUp = human.hand.splice(0, 3) as OffHandCards;
  human.hand = [];

  return {
    // deck: deck,
    deck: newdeck,
    pile: [],
    players: [human, bot],
    currentTurn: 0,
    persistedState: null,
  };
}

function dealCardsFor(
  playerCount: number,
  deck: Readonly<Card[]>
): [Card[], Player[]] {
  let newDeck = deck.slice();
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    let player;
    [newDeck, player] = dealCards(newDeck);
    players.push(player);
  }
  return [newDeck!, players];
}

export function topCard(pile: Readonly<Card[]>): Card | undefined {
  const top = pile.at(-1);
  if (top === undefined) return;
  if (getRank(top) === Rank.Num8) return topCard(pile.slice(0, -1));
  return top;
}

export function botChooseCard(
  botPlayer: Player,
  pile: Readonly<Card[]>
): [Card, number] | undefined {
  const curHand = playerCurHand(botPlayer);
  if (curHand === undefined) return undefined;

  if (curHand === "faceDown") {
    const faceDownCard = botPlayer.faceDown.find((card) => card !== undefined);
    if (faceDownCard === undefined) return undefined;
    return [faceDownCard, 1];
  }

  let testHand: Cards;
  if (curHand === "hand") {
    testHand = botPlayer.hand;
  } else {
    testHand = asCards(botPlayer[curHand]);
  }
  const bestCard = getBestCards(testHand, pile);
  return bestCard;
}

export function canPlay(card: Readonly<Card>, pile: Readonly<Card[]>): boolean {
  if ([Rank.Num2, Rank.Num8].includes(getRank(card))) return true;
  const top = topCard(pile);
  if (top === undefined) return true;
  if (getRank(top) === Rank.Num7) return getRank(card) <= getRank(top);
  return getRank(card) >= getRank(top);
}

export function playableCards(
  hand: Readonly<Cards>,
  pile: Readonly<Card[]>
): Rank[] {
  return hand.filter((card) => canPlay(card, pile));
}

export function getBestCards(
  hand: Readonly<Cards>,
  pile: Readonly<Card[]>
): [Card, number] | undefined {
  const twos: Cards = [];
  const eights: Cards = [];
  const handWithoutTwosAndEights: Cards = [];

  // Separate twos, eights, and the rest of the hand
  for (const card of hand) {
    const rank = getRank(card);
    if (rank === Rank.Num2) {
      twos.push(card);
    } else if (rank === Rank.Num8) {
      eights.push(card);
    } else {
      handWithoutTwosAndEights.push(card);
    }
  }

  // Find playable cards excluding twos and eights
  const playableWithoutTwosAndEights = playableCards(
    handWithoutTwosAndEights,
    pile
  );

  if (playableWithoutTwosAndEights.length > 0) {
    // Find the lowest rank among playable cards
    const lowestRank = Math.min(...playableWithoutTwosAndEights.map(getRank));

    // Get all cards of that lowest rank from the hand
    const cardsOfLowestRank = hand.filter(
      (card) => getRank(card) === lowestRank
    );

    return [cardsOfLowestRank[0], cardsOfLowestRank.length];
  } else if (eights.length > 0) {
    return [eights[0], eights.length];
  } else if (twos.length > 0) {
    return [twos[0], twos.length];
  } else {
    return undefined;
  }
}

// export function isPlayerCurHand(player: Player, ...kinds: HandKind[]) {
//   return kinds.some((kind) => playerCurHand(player) === kind);
// }
