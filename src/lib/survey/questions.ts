import { QuestionItem, LIKERT_LABELS, LikertValue } from "@/lib/survey/types";

const rawQuestionItems = [
  ["D79", "Rarely worry."],
  ["X145", "Often eat too much."],
  ["D70", "Usually like to spend my free time with people."],
  ["H334", "Take charge."],
  ["H58", "Am always busy."],
  ["X63", "Radiate joy."],
  ["X45", "Do not like poetry."],
  ["X12", "Distrust people."],
  [
    "A141",
    "Tell other people what they want to hear so that they will do what I want them to do.",
  ],
  ["E124", "Anticipate the needs of others."],
  ["X61", "Believe that I am better than others."],
  ["X259", "Sympathize with the homeless."],
  ["Q104", "Keep things tidy."],
  ["V98", "Am a highly disciplined person."],
  ["E46", "Jump into things without thinking."],
  ["A108", "Admire a really clever scam."],
  ["M58", "Like to own things that impress people."],
  ["Q238", "Try to be with someone else when I'm feeling badly."],
  ["E136", "Feel others' emotions."],
  ["R11", "Talk a lot."],
  ["S22", "Try to avoid speaking in public."],
  ["C4", "Am usually active and full of energy."],
  ["Q59", "Am patient with people who annoy me."],
  ["Q210", "Am easily annoyed."],
  ["Q204", "Push myself very hard to succeed."],
  ["X86", "Do not like art."],
  ["V330", "Love to hear about other countries and cultures."],
  ["R35", "Am considered to be kind of eccentric."],
  ["P420", "Worry about what people think of me."],
  ["V91", "Am very shy in social situations."],
  ["V211", "Don't have much energy."],
  ["H579", "Don't think that laws apply to me."],
  ["E92", "Have frequent mood swings."],
  ["X217", "Hold a grudge."],
  ["E122", "Like to act on a whim."],
  [
    "A47",
    "Have felt the presence of another person when he or she was not really there.",
  ],
  [
    "D20",
    "Seem to derive less enjoyment from interacting with people than others do.",
  ],
  ["P393", "Love to be the center of attention."],
  ["P378", "Don't let others cut in front of me in line."],
  ["V69", "Insist that others do things my way."],
  ["V223", "Am a firm believer in thinking things through."],
  ["X43", "Dislike changes."],
  ["V291", "Read a large variety of books."],
  ["X50", "Love excitement."],
  ["Q116", "Would rather spend money than save it."],
  ["E35", "Enjoy being reckless."],
  ["V187", "Have never cared much what others thought of me."],
  [
    "D40",
    "Usually get right to work on something that needs to be done as soon as I think of it.",
  ],
  ["A40", "Often have the feeling that others laugh or talk about me."],
  ["E126", "Try to forgive and forget."],
  ["X244", "Feel little concern for others."],
  ["H710", "Do things out of revenge."],
  ["P382", "Have felt contact with a divine power."],
  ["P479", "Am devoted to religion."],
  ["Q142", "Was a better than average student when I was in school."],
  ["Q91", "Felt close to my parents when I was a child."],
  ["A129", "Feel a sense of worthlessness or hopelessness."],
  ["Q69", "Am interested in science."],
  ["Q184", "Believe that most questions have one right answer."],
  ["R36", "Tend to feel happy and irritable at the same time."],
  ["V62", "Believe it is always better to be safe than sorry."],
  ["X265", "Rarely get irritated."],
  ["Q239", "Wanted to run away from home when I was a child."],
  ["D60", "Often enjoy telling jokes or behaving in a humorous manner."],
  ["X47", "Make enemies."],
  ["M38", "Am fascinated by how machines work."],
  ["X117", "Disliked math in school."],
  ["X245", "Have a rich vocabulary."],
  ["H2027", "Like to read."],
  ["E85", "Don't care about dressing nicely."],
  ["X5", "Worry about things."],
  ["H991", "Am easily intimidated."],
  ["H78", "Love large parties."],
  ["X135", "Seldom daydream."],
  ["V316", "Crave the experience of great art."],
  ["X218", "Tend to vote for liberal political candidates."],
  ["E115", "Feel sympathy for those who are worse off than myself."],
  ["V147", "Use my charm to get attention."],
  ["V172", "Avoid activities that are physically dangerous."],
  ["D116", "Immediately feel sad when hearing of an unhappy event."],
  [
    "D109",
    "Can make myself work on a difficult task even when I don't feel like trying.",
  ],
  ["Q36", "Pay too little attention to details."],
  ["V186", "Do not like to visit museums."],
  ["V335", "Have no special urge to do something original."],
  ["A132", "Have difficulty showing affection."],
  ["P407", "Find it easy to manipulate others."],
  ["V18", "Cannot imagine lying or cheating."],
  ["X83", "Talk to a lot of different people at parties."],
  ["P341", "Dislike having authority over others."],
  ["X82", "Often forget to put things back in their proper place."],
  ["H784", "Act without consulting others."],
  ["X104", "Like to visit new places."],
  ["P450", "Have time for play and relaxation."],
  ["Q61", "Am open to new experiences."],
  ["E134", "Don't care what others think."],
  ["X105", "Am not sure where my life is going."],
  ["Q165", "Would like to have more power than other people."],
  ["Q200", "Believe in universal harmony."],
  ["H1366", "Am skilled in handling social situations."],
  ["E171", "Try to avoid complex people."],
  ["P439", "See myself as a good leader."],
  ["X22", "Avoid crowds."],
  ["P468", "Am not good at telling jokes."],
  ["Q11", "Don't use harsh language."],
  ["M68", "Am able to fix electrical-wiring problems."],
  ["E90", "Enjoy games of strategy."],
  ["Q241", "Was a slow learner in school."],
  ["A142", "Often stop to analyze how I'm feeling."],
  ["Q51", "Get deeply immersed in music."],
  ["X201", "Like to solve complex problems."],
  ["H1100", "Am concerned about others."],
  ["H244", "Like to tidy up."],
  ["V181", "Don't feel the need to be close to others."],
  ["Q183", "Love my enemies."],
  [
    "V259",
    "Have an imagination that stretches beyond that of my friends.",
  ],
  ["R65", "Find it difficult to organize tasks and activities."],
  ["Q215", "Feel that life has no meaning."],
  ["Q199", "Like being the authority who has everyone's attention."],
  ["A35", "Have attacked someone physically."],
  ["V68", "Like to stand out in a crowd."],
  ["R24", "Get upset if others change the way that I have arranged things."],
  ["H303", "Want things to proceed according to plan."],
  ["X84", "Am often in a bad mood."],
  ["H1203", "Want to be the very best."],
  ["Q96", "Feel used by other people."],
  ["X251", "Am able to control my cravings."],
  ["V295", "Know what to say to make people feel good."],
  ["E73", "Get so involved with things that I forget the time."],
  ["A99", "Am often bored."],
  ["H525", "Demand attention."],
  ['E11', 'Want everything to be "just right."'],
  ["R71", "Would love to explore strange places."],
  ["H1093", "Amuse my friends."],
  ["V308", "Worry about being embarrassed."],
  ["H660", "Want to be left alone."],
  ["E57", "Don't know why I do some of the things I do."],
  ["X163", "Am exacting in my work."],
  ["X7", "Have difficulty imagining things."],
  ["X239", "Am not interested in theoretical discussions."],
  ["P376", "Don't enjoy being the object of jokes."],
  ["A97", "Plan my life logically."],
  ["H1119", "Indulge in my fantasies."],
  ["A56", "Rarely cry during sad movies."],
  ["X55", "Get to work at once."],
  ["H976", "Wait for others to lead the way."],
  ["Q235", "Have never hated anyone."],
  ["H980", "Need reassurance."],
  ["R29", "Feel emotions with extreme intensity."],
  ["H2039", "Spend a lot of time reading."],
  ["P363", "Don't try to figure myself out."],
  ["H1018", "Break my promises."],
  ["H969", "Need a push to get started."],
  ["V153", "Have a colorful and dramatic way of talking about things."],
  ["V155", "Come up with new ways to do things."],
  ["Q240", "Don't like to spend money."],
  ["V39", "Believe in a universal power or God."],
  ["H34", "Am the life of the party."],
  ["D37", "Don't attempt to conform to society's expectations."],
  ["Q146", "Wonder how I got to be the way that I am."],
  ["H617", "Feel short-changed in life."],
  ["X54", "Will not probe deeply into a subject."],
  ["X64", "Panic easily."],
  ["Q14", "Have a strong personality."],
  [
    "V50",
    "Prefer to participate fully rather than view life from the sidelines.",
  ],
  ["Q135", "Spend more money than I should."],
  ["H107", "Make people feel at ease."],
  ["X87", "Am always prepared."],
  ["A10", "Keep my feelings to myself, regardless of how unhappy I am."],
  ["E75", "Spend more money than I have."],
  ["H1095", "Love to chat."],
  ["X9", "Am hard to get to know."],
  ["Q154", "Get back at people who insult me."],
  ["E141", "Am relaxed most of the time."],
  ["R79", "Check on things more often than necessary."],
  ["Q23", "Get too tired to do anything."],
  ["V249", "Don't call attention to myself."],
  ["V95", "Am a good listener."],
  ["A3", "Shout or scream when I'm angry."],
  ["H2013", "Disclose my intimate thoughts."],
  ["P472", "Am under constant pressure."],
  ["Q10", "Believe that most people would lie to get ahead."],
] as const;

function toFirstPersonStatement(stem: string) {
  if (stem.startsWith("I ")) {
    return stem;
  }

  return `I ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

type MixtureComponent = {
  mean: number;
  spread: number;
  weight: number;
};

const POLARIZED_PATTERNS = [
  /divine power/,
  /universal power or god/,
  /devoted to religion/,
  /liberal political candidates/,
];

const RARE_LOW_PATTERNS = [
  /attacked someone physically/,
  /laws apply to me/,
  /presence of another person/,
  /contact with a divine power/,
  /make enemies/,
  /do things out of revenge/,
  /manipulate others/,
  /really clever scam/,
  /better than others/,
  /more power than other people/,
  /enjoy being reckless/,
  /spend more money than i have/,
];

const COMMON_LOW_PATTERNS = [
  /under constant pressure/,
  /sense of worthlessness or hopelessness/,
  /life has no meaning/,
  /panic easily/,
  /easily intimidated/,
  /not sure where my life is going/,
  /need reassurance/,
  /need a push to get started/,
  /often in a bad mood/,
  /too tired to do anything/,
  /feel used by other people/,
  /worry about what people think of me/,
  /worry about being embarrassed/,
  /feel short-changed in life/,
  /frequent mood swings/,
  /often bored/,
  /hold a grudge/,
  /easily annoyed/,
  /check on things more often than necessary/,
  /wanted to run away from home/,
];

const IMPULSIVE_LOW_PATTERNS = [
  /act on a whim/,
  /jump into things without thinking/,
  /spend more money than i should/,
  /would rather spend money than save it/,
  /spend more money than i have/,
  /don't let others cut in front of me in line/,
];

const VIRTUE_HIGH_PATTERNS = [
  /anticipate the needs of others/,
  /feel others' emotions/,
  /sympathize with the homeless/,
  /feel sympathy for those who are worse off/,
  /concerned about others/,
  /good listener/,
  /make people feel at ease/,
  /patient with people who annoy me/,
  /forgive and forget/,
  /cannot imagine lying or cheating/,
  /don't use harsh language/,
];

const DISCIPLINE_HIGH_PATTERNS = [
  /keep things tidy/,
  /like to tidy up/,
  /highly disciplined/,
  /always prepared/,
  /exacting in my work/,
  /plan my life logically/,
  /firm believer in thinking things through/,
  /get to work at once/,
  /get right to work/,
  /control my cravings/,
  /difficult task even when i don't feel like trying/,
  /want things to proceed according to plan/,
  /take charge/,
];

const CURIOSITY_HIGH_PATTERNS = [
  /like to read/,
  /read a large variety of books/,
  /rich vocabulary/,
  /interested in science/,
  /solve complex problems/,
  /great art/,
  /visit new places/,
  /new ways to do things/,
  /imagination/,
  /immersed in music/,
  /countries and cultures/,
  /open to new experiences/,
  /explore strange places/,
];

const PREFERENCE_LOW_PATTERNS = [
  /do not like poetry/,
  /do not like art/,
  /do not like to visit museums/,
  /not interested in theoretical discussions/,
  /disliked math in school/,
  /will not probe deeply into a subject/,
  /difficulty imagining things/,
  /no special urge to do something original/,
];

const SOCIABLE_HIGH_PATTERNS = [
  /talk a lot/,
  /love large parties/,
  /life of the party/,
  /love to chat/,
  /center of attention/,
  /talk to a lot of different people at parties/,
  /free time with people/,
  /active and full of energy/,
  /always busy/,
  /amuse my friends/,
  /radiate joy/,
];

const WITHDRAWN_LOW_PATTERNS = [
  /want to be left alone/,
  /avoid crowds/,
  /shy in social situations/,
  /derive less enjoyment from interacting with people/,
  /hard to get to know/,
  /don't feel the need to be close to others/,
  /keep my feelings to myself/,
  /don't call attention to myself/,
];

const RELAXED_HIGH_PATTERNS = [
  /rarely worry/,
  /relaxed most of the time/,
  /rarely get irritated/,
  /time for play and relaxation/,
];

const SELF_ENHANCEMENT_PATTERNS = [
  /strong personality/,
  /good leader/,
  /better than average student/,
  /skilled in handling social situations/,
  /better than others/,
  /more power than other people/,
  /authority who has everyone's attention/,
  /stand out in a crowd/,
  /use my charm to get attention/,
  /demand attention/,
];

const POSITIVE_AFFECT_PATTERNS = [
  /radiate joy/,
  /amuse my friends/,
  /love excitement/,
  /active and full of energy/,
];

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function countMatches(prompt: string, patterns: RegExp[]) {
  return patterns.reduce((count, pattern) => count + (pattern.test(prompt) ? 1 : 0), 0);
}

function gaussian(rating: number, mean: number, spread: number) {
  return Math.exp(-((rating - mean) ** 2) / (2 * spread ** 2));
}

function buildDistributionFromMixture(
  components: MixtureComponent[],
  total: number,
  floor: number,
  seed: number,
) {
  const weights = Array.from({ length: LIKERT_LABELS.length }, (_, index) => {
    const rating = index + 1;
    const mixture = components.reduce(
      (sum, component) => sum + component.weight * gaussian(rating, component.mean, component.spread),
      0,
    );
    const ripple = 0.012 * Math.sin((seed % 17) + rating * 1.37);

    return Math.max(floor + mixture + ripple, floor / 2);
  });

  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((value) => Math.max(1, Math.round((value / weightSum) * total)));
  const difference = total - counts.reduce((sum, value) => sum + value, 0);
  const targetIndex = counts.indexOf(Math.max(...counts));

  counts[targetIndex] += difference;

  return counts;
}

function seededDistributionFor(questionId: string, prompt: string, order: number) {
  const seed = hashString(`${questionId}-${order}`);
  const normalizedPrompt = prompt.toLowerCase();
  const polarized = countMatches(normalizedPrompt, POLARIZED_PATTERNS);
  const rareLow = countMatches(normalizedPrompt, RARE_LOW_PATTERNS);
  const commonLow = countMatches(normalizedPrompt, COMMON_LOW_PATTERNS);
  const impulsiveLow = countMatches(normalizedPrompt, IMPULSIVE_LOW_PATTERNS);
  const virtueHigh = countMatches(normalizedPrompt, VIRTUE_HIGH_PATTERNS);
  const disciplineHigh = countMatches(normalizedPrompt, DISCIPLINE_HIGH_PATTERNS);
  const curiosityHigh = countMatches(normalizedPrompt, CURIOSITY_HIGH_PATTERNS);
  const preferenceLow = countMatches(normalizedPrompt, PREFERENCE_LOW_PATTERNS);
  const sociableHigh = countMatches(normalizedPrompt, SOCIABLE_HIGH_PATTERNS);
  const withdrawnLow = countMatches(normalizedPrompt, WITHDRAWN_LOW_PATTERNS);
  const relaxedHigh = countMatches(normalizedPrompt, RELAXED_HIGH_PATTERNS);
  const selfEnhancement = countMatches(normalizedPrompt, SELF_ENHANCEMENT_PATTERNS);
  const positiveAffect = countMatches(normalizedPrompt, POSITIVE_AFFECT_PATTERNS);

  const meanJitter = (((seed >> 5) % 17) - 8) / 50;
  const spreadJitter = (((seed >> 11) % 13) - 6) / 100;
  const shoulderJitter = (((seed >> 17) % 9) - 4) / 100;
  const total = 280 + ((seed >> 22) % 120);

  if (polarized > 0) {
    const split = 0.46 + (((seed >> 9) % 11) - 5) / 100;

    return buildDistributionFromMixture(
      [
        {
          mean: 2.0 + meanJitter * 0.5,
          spread: 0.72 + spreadJitter,
          weight: split,
        },
        {
          mean: 5.0 - meanJitter * 0.5,
          spread: 0.78 + spreadJitter,
          weight: 1 - split,
        },
      ],
      total,
      0.03,
      seed,
    );
  }

  let mean = 3.45 + meanJitter;
  let spread = 0.96 + spreadJitter;
  let floor = 0.045;

  mean += positiveAffect * 0.7;
  mean += virtueHigh * 0.55;
  mean += disciplineHigh * 0.48;
  mean += curiosityHigh * 0.28;
  mean += sociableHigh * 0.22;
  mean += relaxedHigh * 0.34;
  mean -= preferenceLow * 0.55;
  mean -= withdrawnLow * 0.42;
  mean -= commonLow * 0.72;
  mean -= impulsiveLow * 0.84;
  mean -= rareLow * 1.28;
  mean += selfEnhancement * 0.08;

  spread += curiosityHigh * 0.06;
  spread += sociableHigh * 0.1;
  spread += withdrawnLow * 0.08;
  spread += selfEnhancement * 0.14;
  spread += commonLow * 0.08;
  spread += preferenceLow * 0.1;
  spread -= rareLow * 0.12;
  spread -= virtueHigh * 0.04;

  if (rareLow > 0) {
    floor = 0.028;
  } else if (sociableHigh > 0 || selfEnhancement > 0 || preferenceLow > 0) {
    floor = 0.038;
  }

  const components: MixtureComponent[] = [
    {
      mean: clamp(mean, 1.35, 5.65),
      spread: clamp(spread, 0.7, 1.45),
      weight: 1,
    },
  ];

  if (selfEnhancement > 0 || sociableHigh > 0 || preferenceLow > 0 || commonLow > 0) {
    const offset =
      selfEnhancement > 0
        ? -0.6
        : sociableHigh > 0
          ? -0.35
          : preferenceLow > 0
            ? 0.55
            : 0.4;

    components.push({
      mean: clamp(mean + offset + shoulderJitter, 1.2, 5.8),
      spread: clamp(spread + 0.16, 0.8, 1.55),
      weight: 0.18,
    });
  }

  return buildDistributionFromMixture(components, total, floor, seed);
}

export const surveyQuestions: QuestionItem[] = rawQuestionItems.map(
  ([id, stem], index) => {
    const prompt = toFirstPersonStatement(stem);

    return {
      id,
      order: index + 1,
      prompt,
      labels: LIKERT_LABELS,
      seededDistribution: seededDistributionFor(id, prompt, index + 1),
    };
  },
);

export const QUESTION_COUNT = surveyQuestions.length;
export const QUESTION_IDS = new Set(surveyQuestions.map((question) => question.id));
export const QUESTION_LOOKUP = new Map(
  surveyQuestions.map((question) => [question.id, question]),
);

export function isLikertValue(value: unknown): value is LikertValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6;
}
