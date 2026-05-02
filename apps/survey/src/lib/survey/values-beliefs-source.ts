export type ReferenceScaleStats = {
  mean: number;
  sd: number;
  min?: number;
  max?: number;
};

export type PrimalTertiaryScaleSource = {
  code: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  description: string;
  itemNumbers: readonly number[];
  reverseItemNumbers: readonly number[];
  prompts: readonly string[];
  reference: ReferenceScaleStats;
};

export type PvqBasicValueSource = {
  code: string;
  label: string;
  description: string;
  itemNumbers: readonly number[];
  higherOrder: "openness-to-change" | "self-transcendence" | "conservation" | "self-enhancement" | "other";
  reference: ReferenceScaleStats;
};

export type PvqHigherOrderValueSource = {
  code: "openness-to-change" | "self-transcendence" | "conservation" | "self-enhancement";
  label: string;
  description: string;
  basicValueCodes: readonly string[];
  reference: ReferenceScaleStats;
};

export const PRIMAL_PRIMARY_REFERENCE: ReferenceScaleStats = {
  mean: 25.5,
  sd: 7.1,
  min: -3.8,
  max: 44.6,
};

export const PRIMAL_SECONDARY_REFERENCES = {
  safe: { mean: 21.5, sd: 8.3, min: -5.3, max: 43.8 },
  enticing: { mean: 30.6, sd: 7.6, min: -2.3, max: 46.6 },
  alive: { mean: 21.9, sd: 8.8, min: -1.9, max: 45.3 },
} as const satisfies Record<string, ReferenceScaleStats>;

export const PRIMAL_TERTIARY_SCALES: readonly PrimalTertiaryScaleSource[] = [
  {
    code: "about-me",
    label: "About Me",
    lowLabel: "Indifferent",
    highLabel: "Interactive",
    description:
      "Belief that circumstances of the world react, in part, based on your influences.",
    itemNumbers: [1, 2, 3, 4, 5],
    reverseItemNumbers: [4],
    prompts: [
      "Whatever is happening around me often feels related to me or something I've done.",
      "When unsure why something is happening, I often suspect it's got something to do with me.",
      "Much of what happens around me feels like it's because of me or related to me somehow.",
      "My first instinct about events happening around me is that they're unrelated to me or anything I've done.",
      "My first instinct about things happening around me is that they have to do with me or something I've done.",
    ],
    reference: { mean: 18.4, sd: 9.1, min: -4.4, max: 48.2 },
  },
  {
    code: "abundant",
    label: "Abundant",
    lowLabel: "Barren",
    highLabel: "Abundant",
    description: "Belief that the world is full of resources and opportunities.",
    itemNumbers: [6, 7, 8, 9],
    reverseItemNumbers: [7],
    prompts: [
      "The world is an abundant place.",
      "The world feels like a barren place with few opportunities.",
      "Life overflows with opportunity and abundance.",
      "The world is an abundant place with tons and tons to offer.",
    ],
    reference: { mean: 31.6, sd: 9.4, min: -1.8, max: 49.9 },
  },
  {
    code: "acceptable",
    label: "Acceptable",
    lowLabel: "Unacceptable",
    highLabel: "Acceptable",
    description: "Belief that most things in the world are best accepted as they are.",
    itemNumbers: [10, 11, 12, 13],
    reverseItemNumbers: [10, 11, 12],
    prompts: [
      "The world needs to be continually improved rather than accepted.",
      "Most situations in life need to be improved, not accepted.",
      "Rather than accepting things as they are, the world needs to be improved as much as possible.",
      "It's usually better to accept a situation than try to change it.",
    ],
    reference: { mean: 9.8, sd: 8.8, min: -9.9, max: 43.3 },
  },
  {
    code: "beautiful",
    label: "Beautiful",
    lowLabel: "Ugly",
    highLabel: "Beautiful",
    description:
      "Belief that the world is full of aesthetically interesting, and even beautiful, things.",
    itemNumbers: [14, 15, 16, 17],
    reverseItemNumbers: [14],
    prompts: [
      "Though some things are incredibly beautiful, they're few and far between.",
      "Nearly everything in the world is beautiful.",
      "In life, there's way more beauty than ugliness.",
      "There is beauty everywhere, no matter where we look.",
    ],
    reference: { mean: 31.1, sd: 9.6, min: -3.8, max: 49.1 },
  },
  {
    code: "changing",
    label: "Changing",
    lowLabel: "Static",
    highLabel: "Changing",
    description: "Belief that the world is ever-changing instead of constant.",
    itemNumbers: [18, 19, 20, 21, 22],
    reverseItemNumbers: [21],
    prompts: [
      "Everything feels like it's shifting and changing.",
      "I feel like everything changes all the time.",
      "Everything feels like a whirl of constant change.",
      "The world is a place where most things stay pretty much the same.",
      "Everything feels like it's constantly moving, changing, and up in the air.",
    ],
    reference: { mean: 29.1, sd: 7.2, min: -3.1, max: 50.0 },
  },
  {
    code: "cooperative",
    label: "Cooperative",
    lowLabel: "Competitive",
    highLabel: "Cooperative",
    description:
      "Belief that the world is mostly cooperative and collaborative instead of competitive.",
    itemNumbers: [23, 24, 25, 26],
    reverseItemNumbers: [23, 24, 25],
    prompts: [
      "Instead of being cooperative, life is a brutal contest where you got to do whatever it takes to survive.",
      "For all life-from the smallest organisms, to plants, animals, and for people too-everything is a cut-throat competition.",
      "Instead of being cooperative, the world is a cutthroat and competitive place.",
      "The world runs on trust and cooperation way more than suspicion and competition.",
    ],
    reference: { mean: 18.7, sd: 10.3, min: -8.8, max: 44.4 },
  },
  {
    code: "funny",
    label: "Funny",
    lowLabel: "Not Funny",
    highLabel: "Funny",
    description: "Belief that the world offers many opportunities for humor and laughter.",
    itemNumbers: [27, 28, 29, 30],
    reverseItemNumbers: [29],
    prompts: [
      "The world is hilarious; if we aren't laughing, we aren't paying attention.",
      "There's humor in everything.",
      "While some things are humorous, most of the time the world is not that funny.",
      "Laughing a ton makes sense because life is hilarious and humor is everywhere.",
    ],
    reference: { mean: 28.2, sd: 10.7, min: -3.6, max: 50.2 },
  },
  {
    code: "harmless",
    label: "Harmless",
    lowLabel: "Threatening",
    highLabel: "Harmless",
    description: "Belief that most aspects of the world are not very dangerous.",
    itemNumbers: [31, 32, 33, 34, 35],
    reverseItemNumbers: [31, 34],
    prompts: [
      "Real danger is everywhere; even if we don't notice it.",
      "Most things and situations are harmless and totally safe.",
      "I tend to see the world as pretty safe.",
      "On the whole, the world is a dangerous place.",
      "On the whole, the world is a safe place.",
    ],
    reference: { mean: 20.3, sd: 10.6, min: -5.3, max: 45.2 },
  },
  {
    code: "hierarchical",
    label: "Hierarchical",
    lowLabel: "Nonhierarchical",
    highLabel: "Hierarchical",
    description:
      "Belief that most things in the world can be ordered or ranked instead of not.",
    itemNumbers: [36, 37, 38, 39, 40],
    reverseItemNumbers: [39],
    prompts: [
      "Most things in the world could be ranked in order of importance.",
      "Humans, animals, plants, and pretty much everything else can be organized by how important or good they are.",
      "Most things can be organized into hierarchies, rankings, or pecking orders that reflect true differences among things.",
      "Most things aren't better or worse. It's hard to organize the world into hierarchies, rankings, or pecking orders that reflect true differences.",
      "Things are rarely equal. Most plants and animals, and even people, are better or worse than one another.",
    ],
    reference: { mean: 22.3, sd: 8.7, min: -2.8, max: 51.0 },
  },
  {
    code: "improvable",
    label: "Improvable",
    lowLabel: "Too Hard to Improve",
    highLabel: "Improvable",
    description: "Belief that most aspects of the world can be changed for the better.",
    itemNumbers: [41, 42, 43, 44, 45],
    reverseItemNumbers: [44],
    prompts: [
      "It's possible to significantly improve basically anything encountered in life.",
      "In most situations, making things way better is absolutely possible.",
      "Most things and situations are responsive, workable, and totally possible to improve.",
      "Most situations seem really difficult if not impossible to improve.",
      "No matter who you are, you can significantly improve the world you live in.",
    ],
    reference: { mean: 29.3, sd: 8.2, min: -1.4, max: 50.2 },
  },
  {
    code: "intentional",
    label: "Intentional",
    lowLabel: "Unintentional",
    highLabel: "Intentional",
    description: "Belief that most things happen for a reason.",
    itemNumbers: [46, 47, 48, 49, 50],
    reverseItemNumbers: [48, 49],
    prompts: [
      "Events happen according to a broader purpose.",
      "What happens in the world is meant to happen.",
      "Events seem to lack any cosmic or bigger purpose.",
      "The universe doesn't care if events happen one way or another.",
      "Everything happens for a reason and on purpose.",
    ],
    reference: { mean: 21.1, sd: 11.2, min: -4.5, max: 46.3 },
  },
  {
    code: "interesting",
    label: "Interesting",
    lowLabel: "Boring",
    highLabel: "Interesting",
    description:
      "Belief that the world is full of fascinating and intellectually engaging things.",
    itemNumbers: [51, 52, 53, 54],
    reverseItemNumbers: [51, 52, 53],
    prompts: [
      "Most things in life are kind of boring.",
      "While some things are interesting, most things are pretty dull.",
      "The world is a somewhat dull place where plenty of things are not that interesting.",
      "It feels like interesting and exciting things surround us all the time.",
    ],
    reference: { mean: 26.6, sd: 9.5, min: -8.8, max: 44.8 },
  },
  {
    code: "interconnected",
    label: "Interconnected",
    lowLabel: "Separable",
    highLabel: "Interconnected",
    description:
      "Belief that most aspects of the world are inter-related instead of independent.",
    itemNumbers: [55, 56, 57, 58],
    reverseItemNumbers: [58],
    prompts: [
      "Every single thing is connected to everything else.",
      "The world is a place where everything is completely interconnected.",
      "Though things can appear separate and independent, they really aren't. Instead, all is one.",
      "Most things are basically unconnected and independent from each other.",
    ],
    reference: { mean: 28.1, sd: 10.1, min: -3.4, max: 48.9 },
  },
  {
    code: "just",
    label: "Just",
    lowLabel: "Unjust",
    highLabel: "Just",
    description: "Belief that the world is generally fair instead of unfair.",
    itemNumbers: [59, 60, 61, 62, 63],
    reverseItemNumbers: [60],
    prompts: [
      "On the whole, the world is a place where we get what we deserve.",
      "The world is a place where we rarely deserve what we get.",
      "Life will find ways to reward those who do good and punish those who do bad.",
      "The world is a place where working hard and being nice pays off.",
      "If someone is generous and kind, the world will be kind back.",
    ],
    reference: { mean: 24.9, sd: 9.2, min: -6.0, max: 47.2 },
  },
  {
    code: "meaningful",
    label: "Meaningful",
    lowLabel: "Meaningless",
    highLabel: "Meaningful",
    description:
      "Belief that the objects and events in our world have deep meaning.",
    itemNumbers: [64, 65, 66, 67],
    reverseItemNumbers: [64, 65, 66],
    prompts: [
      "Nothing really matters all that much.",
      "Most things are pointless and meaningless.",
      "The world is a place where things just don't matter.",
      "The world is a place where most everything matters.",
    ],
    reference: { mean: 27.4, sd: 10.3, min: -8.8, max: 48.2 },
  },
  {
    code: "needs-me",
    label: "Needs Me",
    lowLabel: "Doesn't Need Me",
    highLabel: "Needs Me",
    description:
      "Belief that the world needs you for some specific, perhaps unique, purpose.",
    itemNumbers: [68, 69, 70, 71],
    reverseItemNumbers: [71],
    prompts: [
      "The universe needs me for something important.",
      "The world needs me and my efforts.",
      "Life has an important part for me to play.",
      "It feels like the world doesn't really need me for anything.",
    ],
    reference: { mean: 25.1, sd: 12.1, min: -5.8, max: 49.3 },
  },
  {
    code: "pleasurable",
    label: "Pleasurable",
    lowLabel: "Miserable",
    highLabel: "Pleasurable",
    description: "Belief that most aspects of the world are hedonically pleasing.",
    itemNumbers: [72, 73, 74, 75, 76],
    reverseItemNumbers: [72, 73],
    prompts: [
      "Life offers more pain than pleasure.",
      "Life in this world is usually pain and suffering.",
      "On the whole, the world is a good place.",
      "Most things in the world are good.",
      "Life offers way more pleasure than pain.",
    ],
    reference: { mean: 26.3, sd: 10.4, min: -5.3, max: 46.4 },
  },
  {
    code: "progressing",
    label: "Progressing",
    lowLabel: "Declining",
    highLabel: "Progressing",
    description:
      "Belief that the world is improving over time rather than getting worse.",
    itemNumbers: [77, 78, 79, 80],
    reverseItemNumbers: [77, 78],
    prompts: [
      "On the whole, the world is getting worse.",
      "It feels like the world is going downhill.",
      "Though the world has problems, on the whole things are definitely improving.",
      "It feels like the world is getting better and better.",
    ],
    reference: { mean: 20.7, sd: 11.6, min: -5.0, max: 45.0 },
  },
  {
    code: "regenerative",
    label: "Regenerative",
    lowLabel: "Degenerative",
    highLabel: "Regenerative",
    description:
      "Belief that the world tends to repair and heal itself rather than decay.",
    itemNumbers: [81, 82, 83, 84],
    reverseItemNumbers: [81, 84],
    prompts: [
      "Over time, most situations naturally tend to get worse, not better.",
      "The usual tendency of most things and situations is to get better, not worse.",
      "Though sometimes situations get worse, usually they get better.",
      "Most things have a habit of getting worse.",
    ],
    reference: { mean: 24.1, sd: 9.3, min: -5.0, max: 45.0 },
  },
  {
    code: "stable",
    label: "Stable",
    lowLabel: "Fragile",
    highLabel: "Stable",
    description:
      "Belief that the world is stable and resilient instead of fragile and frail.",
    itemNumbers: [85, 86, 87, 88],
    reverseItemNumbers: [85, 86, 87],
    prompts: [
      "The world is a place where things are fragile and easily ruined.",
      "Most things and situations are delicate and easily destroyed.",
      "Most situations are delicate. Though they may be fine now, things could easily unravel.",
      "It takes a lot for things to fall apart.",
    ],
    reference: { mean: 15.5, sd: 9.0, min: -8.8, max: 40.9 },
  },
  {
    code: "understandable",
    label: "Understandable",
    lowLabel: "Too Hard to Understand",
    highLabel: "Understandable",
    description: "Belief that most aspects of the world can be understood, or not.",
    itemNumbers: [89, 90, 91, 92],
    reverseItemNumbers: [91, 92],
    prompts: [
      "Most everything is easy enough to understand.",
      "The world is easy enough to understand.",
      "Lots of things in the world are too confusing and difficult to understand.",
      "The world is a confusing place where many skills and subjects are too hard to figure out.",
    ],
    reference: { mean: 21.6, sd: 9.3, min: -5.0, max: 45.0 },
  },
  {
    code: "worth-exploring",
    label: "Worth Exploring",
    lowLabel: "Not Worth Exploring",
    highLabel: "Worth Exploring",
    description:
      "Belief that the world is full of interesting experiences worth discovering.",
    itemNumbers: [93, 94, 95, 96],
    reverseItemNumbers: [96],
    prompts: [
      "Unfamiliar things and places are usually worth trying or checking out.",
      "I feel everything is worth trying, learning about, or exploring further.",
      "Everything deserves to be explored.",
      "To be honest, though some things are worth trying and exploring, most things aren't.",
    ],
    reference: { mean: 31.8, sd: 8.6, min: -1.2, max: 49.1 },
  },
] as const;

export const PRIMAL_AGGREGATE_ONLY_ITEMS = [
  {
    number: 97,
    prompt: "On the whole, the world is an uncomfortable and unpleasant place.",
    reverse: true,
  },
  {
    number: 98,
    prompt: "No matter where we are or what the topic might be, the world is fascinating.",
    reverse: false,
  },
  {
    number: 99,
    prompt: "No matter where we are, incredible beauty is always around us.",
    reverse: false,
  },
] as const;

export const PRIMAL_AGGREGATE_ITEM_NUMBERS = {
  good: [
    6, 7, 8, 9, 14, 15, 16, 17, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    35, 41, 42, 43, 44, 45, 51, 52, 53, 54, 59, 60, 61, 62, 63, 64, 65, 66, 67,
    68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86,
    87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
  ],
  safe: [
    23, 24, 25, 26, 31, 32, 33, 34, 35, 60, 62, 63, 72, 73, 74, 75, 76, 77, 78,
    79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
  ],
  enticing: [
    6, 7, 8, 9, 14, 15, 16, 17, 27, 28, 30, 42, 43, 45, 51, 52, 53, 54, 64, 65,
    66, 67, 93, 94, 95, 96, 97, 98,
  ],
  alive: [1, 3, 4, 5, 46, 47, 48, 49, 50, 61, 68, 69, 70, 71],
} as const;

export const PVQ_RR_SOURCE_ITEMS = [
  "It is important to him to form his views independently.",
  "It is important to him that his country is secure and stable.",
  "It is important to him to have a good time.",
  "It is important to him to avoid upsetting other people.",
  "It is important to him that the weak and vulnerable in society be protected.",
  "It is important to him that people do what he says they should.",
  "It is important to him never to think he deserves more than other people.",
  "It is important to him to care for nature.",
  "It is important to him that no one should ever shame him.",
  "It is important to him always to look for different things to do.",
  "It is important to him to take care of people he is close to.",
  "It is important to him to have the power that money can bring.",
  "It is very important to him to avoid disease and protect his health.",
  "It is important to him to be tolerant toward all kinds of people and groups.",
  "It is important to him never to violate rules or regulations.",
  "It is important to him to make his own decisions about his life.",
  "It is important to him to have ambitions in life.",
  "It is important to him to maintain traditional values and ways of thinking.",
  "It is important to him that people he knows have full confidence in him.",
  "It is important to him to be wealthy.",
  "It is important to him to take part in activities to defend nature.",
  "It is important to him never to annoy anyone.",
  "It is important to him to develop his own opinions.",
  "It is important to him to protect his public image.",
  "It is very important to him to help the people dear to him.",
  "It is important to him to be personally safe and secure.",
  "It is important to him to be a dependable and trustworthy friend.",
  "It is important to him to take risks that make life exciting.",
  "It is important to him to have the power to make people do what he wants.",
  "It is important to him to plan his activities independently.",
  "It is important to him to follow rules even when no-one is watching.",
  "It is important to him to be very successful.",
  "It is important to him to follow his family's customs or the customs of a religion.",
  "It is important to him to listen to and understand people who are different from him.",
  "It is important to him to have a strong state that can defend its citizens.",
  "It is important to him to enjoy life's pleasures.",
  "It is important to him that every person in the world have equal opportunities in life.",
  "It is important to him to be humble.",
  "It is important to him to figure things out himself.",
  "It is important to him to honor the traditional practices of his culture.",
  "It is important to him to be the one who tells others what to do.",
  "It is important to him to obey all the laws.",
  "It is important to him to have all sorts of new experiences.",
  "It is important to him to own expensive things that show his wealth.",
  "It is important to him to protect the natural environment from destruction or pollution.",
  "It is important to him to take advantage of every opportunity to have fun.",
  "It is important to him to concern himself with every need of his dear ones.",
  "It is important to him that people recognize what he achieves.",
  "It is important to him never to be humiliated.",
  "It is important to him that his country protect itself against all threats.",
  "It is important to him never to make other people angry.",
  "It is important to him that everyone be treated justly, even people he doesn't know.",
  "It is important to him to avoid anything dangerous.",
  "It is important to him to be satisfied with what he has and not ask for more.",
  "It is important to him that all his friends and family can rely on him completely.",
  "It is important to him to be free to choose what he does by himself.",
  "It is important to him to accept people even when he disagrees with them.",
] as const;

export const PVQ_RR_BASIC_VALUES: readonly PvqBasicValueSource[] = [
  {
    code: "self-direction-thought",
    label: "Self-Direction - Thought",
    description:
      "Belief in the importance of independence in terms of pursuing ideas and developing one's abilities or passions.",
    itemNumbers: [1, 23, 39],
    higherOrder: "openness-to-change",
    reference: { mean: 39.47, sd: 7.0 },
  },
  {
    code: "security-societal",
    label: "Security - Societal",
    description:
      "Belief that safety and security at the societal level are important priorities.",
    itemNumbers: [2, 35, 50],
    higherOrder: "conservation",
    reference: { mean: 36.47, sd: 7.0 },
  },
  {
    code: "hedonism",
    label: "Hedonism",
    description:
      "Belief in the importance of prioritizing pursuits that feel good and are gratifying.",
    itemNumbers: [3, 36, 46],
    higherOrder: "openness-to-change",
    reference: { mean: 35.5, sd: 7.0 },
  },
  {
    code: "conformity-interpersonal",
    label: "Conformity - Interpersonal",
    description:
      "Belief that it is important to avoid actions or impulses that may harm or upset others.",
    itemNumbers: [4, 22, 51],
    higherOrder: "conservation",
    reference: { mean: 29.32, sd: 7.0 },
  },
  {
    code: "universalism-concern",
    label: "Universalism - Concern",
    description:
      "Belief that it is important to be committed to justice, protection, and equality for all.",
    itemNumbers: [5, 37, 52],
    higherOrder: "self-transcendence",
    reference: { mean: 34.88, sd: 7.0 },
  },
  {
    code: "power-dominance",
    label: "Power - Dominance",
    description: "Belief that it's important to have power or control over other people.",
    itemNumbers: [6, 29, 41],
    higherOrder: "self-enhancement",
    reference: { mean: 18.77, sd: 7.0 },
  },
  {
    code: "humility",
    label: "Humility",
    description:
      "Belief in the importance of recognizing one's relative insignificance among all things.",
    itemNumbers: [7, 38, 54],
    higherOrder: "other",
    reference: { mean: 33.68, sd: 7.0 },
  },
  {
    code: "universalism-nature",
    label: "Universalism - Nature",
    description: "Belief in the importance of preserving the natural environment.",
    itemNumbers: [8, 21, 45],
    higherOrder: "self-transcendence",
    reference: { mean: 32.3, sd: 7.0 },
  },
  {
    code: "face",
    label: "Face",
    description: "Belief in the importance of maintaining one's image among other people.",
    itemNumbers: [9, 24, 49],
    higherOrder: "other",
    reference: { mean: 31.59, sd: 7.0 },
  },
  {
    code: "stimulation",
    label: "Stimulation",
    description:
      "Belief that it's important to embrace challenges in life and pursue novel experiences.",
    itemNumbers: [10, 28, 43],
    higherOrder: "openness-to-change",
    reference: { mean: 29.3, sd: 7.0 },
  },
  {
    code: "benevolence-caring",
    label: "Benevolence - Caring",
    description: "Belief in the importance of being devoted to the welfare of others.",
    itemNumbers: [11, 25, 47],
    higherOrder: "self-transcendence",
    reference: { mean: 45.04, sd: 7.0 },
  },
  {
    code: "power-resources",
    label: "Power - Resources",
    description:
      "Belief that it's important to gain and maintain control over resources.",
    itemNumbers: [12, 20, 44],
    higherOrder: "self-enhancement",
    reference: { mean: 25.12, sd: 7.0 },
  },
  {
    code: "security-personal",
    label: "Security - Personal",
    description:
      "Belief that it is important to prioritize the security of one's immediate, personal environment.",
    itemNumbers: [13, 26, 53],
    higherOrder: "conservation",
    reference: { mean: 37.33, sd: 7.0 },
  },
  {
    code: "universalism-tolerance",
    label: "Universalism - Tolerance",
    description:
      "Belief that it is important to understand and accept those who are different from oneself.",
    itemNumbers: [14, 34, 57],
    higherOrder: "self-transcendence",
    reference: { mean: 35.59, sd: 7.0 },
  },
  {
    code: "conformity-rules",
    label: "Conformity - Rules",
    description: "Belief that it's important to comply with laws and rules or obligations.",
    itemNumbers: [15, 31, 42],
    higherOrder: "conservation",
    reference: { mean: 33.08, sd: 7.0 },
  },
  {
    code: "self-direction-action",
    label: "Self-Direction - Action",
    description:
      "Belief in the importance of independence, especially in terms of being free to choose how to act or behave.",
    itemNumbers: [16, 30, 56],
    higherOrder: "openness-to-change",
    reference: { mean: 42.92, sd: 7.0 },
  },
  {
    code: "achievement",
    label: "Achievement",
    description: "Belief that it's important to pursue goals that demonstrate competence.",
    itemNumbers: [17, 32, 48],
    higherOrder: "self-enhancement",
    reference: { mean: 31.04, sd: 7.0 },
  },
  {
    code: "tradition",
    label: "Tradition",
    description:
      "Belief in the importance of maintaining familial, cultural, and religious traditions.",
    itemNumbers: [18, 33, 40],
    higherOrder: "conservation",
    reference: { mean: 26.87, sd: 7.0 },
  },
  {
    code: "benevolence-dependability",
    label: "Benevolence - Dependability",
    description:
      "Belief in the importance of being dependable and trustworthy.",
    itemNumbers: [19, 27, 55],
    higherOrder: "self-transcendence",
    reference: { mean: 44.49, sd: 7.0 },
  },
] as const;

export const PVQ_RR_HIGHER_ORDER_VALUES: readonly PvqHigherOrderValueSource[] = [
  {
    code: "openness-to-change",
    label: "Openness to Change",
    description:
      "Belief in the importance of goals relating to the exploration and development of one's own ideas, and to new and exciting experiences generally.",
    basicValueCodes: [
      "self-direction-thought",
      "self-direction-action",
      "stimulation",
      "hedonism",
    ],
    reference: { mean: 36.49, sd: 7.0 },
  },
  {
    code: "self-transcendence",
    label: "Self-Transcendence",
    description:
      "Belief in the importance of goals relating to the welfare of others and the welfare of the world around us.",
    basicValueCodes: [
      "universalism-nature",
      "universalism-concern",
      "universalism-tolerance",
      "benevolence-caring",
      "benevolence-dependability",
    ],
    reference: { mean: 37.59, sd: 7.0 },
  },
  {
    code: "conservation",
    label: "Conservation",
    description:
      "Belief in the importance of goals relating to safety and security, the preservation of cultural and religious traditions, and conformity with social expectations.",
    basicValueCodes: [
      "security-societal",
      "security-personal",
      "conformity-rules",
      "conformity-interpersonal",
      "tradition",
    ],
    reference: { mean: 34.15, sd: 7.0 },
  },
  {
    code: "self-enhancement",
    label: "Self-Enhancement",
    description:
      "Belief in the importance of goals relating to the pursuit of personal success, competence, prestige, or power.",
    basicValueCodes: ["achievement", "power-resources", "power-dominance"],
    reference: { mean: 25.49, sd: 7.0 },
  },
] as const;
