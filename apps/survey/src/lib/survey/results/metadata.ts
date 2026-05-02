import {
  type FrameworkDefinition,
  type InventoryCode,
} from "@/lib/survey/results/types";

const DOI_HREF = "https://doi.org/10.1016/j.jrp.2010.01.002";

export const AMBI_METHODOLOGY_NOTE =
  "Based on the AMBI public-domain version. Scores range from 0 to 50.";

export const inventoryOrder: InventoryCode[] = [
  "NEO",
  "HEXACO",
  "MPQ",
  "CPI",
  "JPIR",
  "6FPQ",
  "TCI",
  "HPI",
];

export const frameworkDefinitions: Record<InventoryCode, FrameworkDefinition> = {
  NEO: {
    id: "NEO",
    tabLabel: "NEO",
    heading: "Revised NEO Personality Inventory",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The Revised NEO Personality Inventory (NEO-PI-R) measures personality across 5 broad domains, each containing 6 underlying facets (30 facets in total). The NEO-PI-R is one of the most prominent assessments measuring the Big Five domains of personality: Neuroticism, Extraversion, Openness to Experience, Agreeableness, and Conscientiousness. The NEO acronym reflects the test's original development as a 3-factor personality framework, with Agreeableness and Conscientiousness being added as part of a major revision in the 1980s. Several versions have been released since, along with dozens of translations and numerous public-domain alternatives. Collectively, these five-factor inventories are, by far, the most widely used assessments of personality in social science research. The public-domain AMBI version used here has a total of 108 questions, and was created using correlations between scores on the original NEO-PI-R and responses to a large pool of public-domain personality questions.",
    readMoreHref: DOI_HREF,
    layout: "gauges",
    overview: [
      {
        id: "neo-extraversion",
        label: "Extraversion",
        description: "Tendency to be sociable, talkative, assertive, and energetic",
        scaleNumbers: [7, 8, 9, 10, 11, 12],
        scoreOffset: 2,
      },
      {
        id: "neo-openness",
        label: "Openness to Experience",
        description:
          "Tendency to pursue and enjoy new experiences, including unfamiliar topics, art (and other creative activities), and complex or intellectual pursuits",
        scaleNumbers: [13, 14, 15, 16, 17, 18],
        scoreOffset: -1,
      },
      {
        id: "neo-conscientiousness",
        label: "Conscientiousness",
        description:
          "Tendency to be responsible, hard-working, organized, and achievement oriented",
        scaleNumbers: [25, 26, 27, 28, 29, 30],
        scoreOffset: -1,
      },
      {
        id: "neo-agreeableness",
        label: "Agreeableness",
        description:
          "Tendency to be affiliative, compassionate, sympathetic, and caring toward others",
        scaleNumbers: [19, 20, 21, 22, 23, 24],
        scoreOffset: -1,
      },
      {
        id: "neo-neuroticism",
        label: "Neuroticism",
        description:
          "Tendency to experience various negative emotions (like anxiety, sadness, and anger) as well as frequent or strong changes in emotions",
        scaleNumbers: [1, 2, 3, 4, 5, 6],
        scoreOffset: 1,
      },
    ],
    sections: [
      {
        id: "neo-extraversion-section",
        title: "Extraversion",
        description: "Tendency to be sociable, talkative, assertive, and energetic",
        scaleNumbers: [7, 8, 9, 10, 11, 12],
      },
      {
        id: "neo-openness-section",
        title: "Openness to Experience",
        description:
          "Tendency to pursue and enjoy new experiences, including unfamiliar topics, art (and other creative activities), and complex or intellectual pursuits",
        scaleNumbers: [13, 14, 15, 16, 17, 18],
      },
      {
        id: "neo-conscientiousness-section",
        title: "Conscientiousness",
        description:
          "Tendency to be responsible, hard-working, organized, and achievement oriented",
        scaleNumbers: [25, 26, 27, 28, 29, 30],
      },
      {
        id: "neo-agreeableness-section",
        title: "Agreeableness",
        description:
          "Tendency to be affiliative, compassionate, sympathetic, and caring toward others",
        scaleNumbers: [19, 20, 21, 22, 23, 24],
      },
      {
        id: "neo-neuroticism-section",
        title: "Neuroticism",
        description:
          "Tendency to experience various negative emotions (like anxiety, sadness, and anger) as well as frequent or strong changes in emotions",
        scaleNumbers: [1, 2, 3, 4, 5, 6],
      },
    ],
  },
  HEXACO: {
    id: "HEXACO",
    tabLabel: "HEXACO",
    heading: "HEXACO Personality Inventory",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The HEXACO Personality Inventory is among the most prominent 6-factor alternatives to the more famous Big Five personality models. In practice, the HEXACO and the Big Five have a lot in common. Both have highly similar dimensions in Extraversion, Conscientiousness, and Openness. But, instead of Neuroticism in the Big Five, the HEXACO has Emotionality which contains some similar content but less focus on emotional stability. The biggest difference between the two models is that the HEXACO contains an additional dimension labeled Honesty-Humility, and this inclusion also affects the ways that each model measures Agreeableness. Big Five Agreeableness includes facets of Trust and Straightforwardness, but these are part of Honesty-Humility in the HEXACO. HEXACO Agreeableness is more focused on patience and forgiveness than Big Five Agreeableness.",
    readMoreHref: DOI_HREF,
    layout: "gauges",
    overview: [
      {
        id: "hexaco-openness",
        label: "Intellectual Openness",
        description:
          "Tendency to be unconventional, intellectual, curious, and interested in creative pursuits",
        scaleNumbers: [51, 52, 53, 54],
      },
      {
        id: "hexaco-agreeableness",
        label: "Agreeable Emotions",
        description:
          "Tendency to be compassionate and caring, patient with others, and forgiving",
        scaleNumbers: [43, 44, 45, 46],
        scoreOffset: 1,
      },
      {
        id: "hexaco-conscientiousness",
        label: "Conscientiousness",
        description:
          "Tendency to be diligent, well-organized, and interested in doing tasks promptly and well",
        scaleNumbers: [47, 48, 49, 50],
      },
      {
        id: "hexaco-extraversion",
        label: "Socially Extraverted",
        description:
          "Tendency to be lively, sociable, and active, typically associated with higher levels of enthusiasm and cheerfulness",
        scaleNumbers: [39, 40, 41, 42],
        scoreOffset: -1,
      },
      {
        id: "hexaco-emotionality",
        label: "Emotionality",
        description:
          "Tendency to experience various negative emotions, especially worry, fear, and depressed mood",
        scaleNumbers: [35, 36, 37, 38],
        scoreOffset: 2,
      },
      {
        id: "hexaco-honesty-humility",
        label: "Honesty-Humility",
        description:
          "Tendency to be fair, open, and humble in interpersonal interactions",
        scaleNumbers: [31, 32, 33, 34],
        scoreOffset: 3,
      },
    ],
    sections: [
      {
        id: "hexaco-openness-section",
        title: "Intellectual Openness",
        description:
          "Tendency to be unconventional, intellectual, curious, and interested in creative pursuits",
        scaleNumbers: [52, 54, 51, 53],
      },
      {
        id: "hexaco-agreeableness-section",
        title: "Agreeable Emotions",
        description:
          "Tendency to be compassionate and caring, patient with others, and forgiving",
        scaleNumbers: [46, 43, 44, 45],
      },
      {
        id: "hexaco-conscientiousness-section",
        title: "Conscientiousness",
        description:
          "Tendency to be diligent, well-organized, and interested in doing tasks promptly and well",
        scaleNumbers: [48, 47, 49, 50],
      },
      {
        id: "hexaco-extraversion-section",
        title: "Socially Extraverted",
        description:
          "Tendency to be lively, sociable, and active, typically associated with higher levels of enthusiasm and cheerfulness",
        scaleNumbers: [42, 40, 39, 41],
      },
      {
        id: "hexaco-emotionality-section",
        title: "Emotionality",
        description:
          "Tendency to experience various negative emotions, especially worry, fear, and depressed mood",
        scaleNumbers: [38, 37, 36, 35],
      },
      {
        id: "hexaco-honesty-section",
        title: "Honesty-Humility",
        description:
          "Tendency to be fair, open, and humble in interpersonal interactions",
        scaleNumbers: [32, 34, 31, 33],
      },
    ],
  },
  MPQ: {
    id: "MPQ",
    tabLabel: "MPQ",
    heading: "Multidimensional Personality Questionnaire",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The Multidimensional Personality Questionnaire assesses 3 broad dimensions of temperament: Positive Emotionality, Negative Emotionality, and Constraint. Beneath these, the MPQ also measures 11 more narrow traits, though one of these 11 (Absorption) lies outside of the 3 higher dimensions.",
    readMoreHref: DOI_HREF,
    layout: "gauges",
    overview: [
      {
        id: "mpq-positive-emotionality",
        label: "Positive Emotionality",
        description:
          "A tendency to engage positively with rewarding stimuli, especially people and ideas. High positive emotionality is associated with more joy and enthusiasm and lower levels with low mood and low energy levels",
        scaleNumbers: [70, 71, 72, 73],
      },
      {
        id: "mpq-negative-emotionality",
        label: "Negative Emotionality",
        description:
          "A tendency to experience strong negative mood states like stress, anxiety, and anger. Low negative emotionality is associated with emotional stability and low aggression",
        scaleNumbers: [74, 75, 76],
        scoreOffset: 1,
      },
      {
        id: "mpq-constraint",
        label: "Constraint",
        description:
          "A tendency for more controlled behavior, meaning less impulsivity and risk-seeking behavior and higher conformity and conventionality",
        scaleNumbers: [77, 78, 79],
      },
    ],
    sections: [
      {
        id: "mpq-positive-emotionality-section",
        title: "Positive Emotionality",
        description:
          "A tendency to engage positively with rewarding stimuli, especially people and ideas. High positive emotionality is associated with more joy and enthusiasm and lower levels with low mood and low energy levels",
        scaleNumbers: [70, 71, 72, 73],
      },
      {
        id: "mpq-negative-emotionality-section",
        title: "Negative Emotionality",
        description:
          "A tendency to experience strong negative mood states like stress, anxiety, and anger. Low negative emotionality is associated with emotional stability and low aggression",
        scaleNumbers: [75, 74, 76],
      },
      {
        id: "mpq-constraint-section",
        title: "Constraint",
        description:
          "A tendency for more controlled behavior, meaning less impulsivity and risk-seeking behavior and higher conformity and conventionality",
        scaleNumbers: [77, 79, 78],
      },
      {
        id: "mpq-other-traits-section",
        title: "Other traits",
        description: "These traits are not included in any of the sections above",
        scaleNumbers: [80],
      },
    ],
  },
  CPI: {
    id: "CPI",
    tabLabel: "CPI",
    heading: "California Personality Inventory",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The California Personality Inventory (CPI) is the oldest personality framework among those captured by the AMBI, having been first introduced in 1956. It is related to a popular measure of clinical topics called the MMPI in that it was developed using a similar strategy of aggregating many individual questions that were expected to tap into enduring aspects of personality rather than being based on personality theory or the lexical structure of personality descriptions. Like the MMPI, the original CPI is also a very long assessment, with more than 400 questions.",
    readMoreHref: DOI_HREF,
    layout: "ranked-list",
    overview: [],
    sections: [
      {
        id: "cpi-ranked-list",
        title: "Ranked CPI scales",
        scaleNumbers: [
          130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145,
          146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159,
        ],
      },
    ],
  },
  JPIR: {
    id: "JPIR",
    tabLabel: "JPIR",
    heading: "Jackson Personality Inventory - Revised",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The Jackson Personality Inventory was originally designed as a comprehensive measure of 15 important topics in personality and social psychology in the 1970s. While most of these continue to be researched frequently today, they often use different labels or framings. A revision of the JPI in the mid-1990s renamed 6 of the original scales and several subsequent research efforts have tried to organize these scales into the Big Five dimensions. Since these results have been inconsistent, no higher-level grouping of the scales is provided here.",
    readMoreHref: DOI_HREF,
    layout: "ranked-list",
    overview: [],
    sections: [
      {
        id: "jpir-ranked-list",
        title: "Ranked JPIR scales",
        scaleNumbers: [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
      },
    ],
  },
  "6FPQ": {
    id: "6FPQ",
    tabLabel: "6FPQ",
    heading: "Six Factor Personality Questionnaire",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      'The Six-Factor Personality Questionnaire (6FPQ) was developed in the late 1990s as an extension and revision of an older framework called the Personality Research Form (PRF), which aimed to assess the 20 "manifest needs" described in a classic book about personality from the 1930s (Murray, 1938).',
    readMoreHref: DOI_HREF,
    layout: "gauges",
    overview: [
      {
        id: "6fpq-openness",
        label: "Openness to Experience",
        description:
          "Tendency to be willing to engage with new topics, especially new ideas, and to engage with complex and abstract concepts",
        scaleNumbers: [95, 93, 94],
      },
      {
        id: "6fpq-assertive-presence",
        label: "Assertive Social Presence",
        description:
          "Tendency to be outgoing, talkative, comfortable in social interactions, and assertive",
        scaleNumbers: [82, 81, 83],
        scoreOffset: 1,
      },
      {
        id: "6fpq-kindness",
        label: "Kindness",
        description: "Tendency to be forgiving, tolerant, kind, and compassionate",
        scaleNumbers: [84, 85, 86],
      },
      {
        id: "6fpq-methodicalness",
        label: "Methodicalness",
        description: "Tendency to be careful, planful, and orderly",
        scaleNumbers: [89, 87, 88],
      },
      {
        id: "6fpq-industriousness",
        label: "Industriousness",
        description:
          "Tendency to have a strong work ethic, to be industrious, and stay busy and productive",
        scaleNumbers: [96, 97, 98],
        scoreOffset: -1,
      },
      {
        id: "6fpq-independence",
        label: "Independence",
        description:
          "Tendency to be less concerned with the approval and concern of others",
        scaleNumbers: [90, 92, 91],
      },
    ],
    sections: [
      {
        id: "6fpq-openness-section",
        title: "Openness to Experience",
        description:
          "Tendency to be willing to engage with new topics, especially new ideas, and to engage with complex and abstract concepts",
        scaleNumbers: [95, 93, 94],
      },
      {
        id: "6fpq-assertive-section",
        title: "Assertive Social Presence",
        description:
          "Tendency to be outgoing, talkative, comfortable in social interactions, and assertive",
        scaleNumbers: [82, 81, 83],
      },
      {
        id: "6fpq-kindness-section",
        title: "Kindness",
        description: "Tendency to be forgiving, tolerant, kind, and compassionate",
        scaleNumbers: [84, 85, 86],
      },
      {
        id: "6fpq-methodicalness-section",
        title: "Methodicalness",
        description: "Tendency to be careful, planful, and orderly",
        scaleNumbers: [89, 87, 88],
      },
      {
        id: "6fpq-industriousness-section",
        title: "Industriousness",
        description:
          "Tendency to have a strong work ethic, to be industrious, and stay busy and productive",
        scaleNumbers: [96, 97, 98],
      },
      {
        id: "6fpq-independence-section",
        title: "Independence",
        description:
          "Tendency to be less concerned with the approval and concern of others",
        scaleNumbers: [90, 92, 91],
      },
    ],
  },
  TCI: {
    id: "TCI",
    tabLabel: "TCI",
    heading: "Temperament & Character Inventory",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      'The Temperament & Character Inventory (TCI) measures personality across 7 broad dimensions, and each of these contains 3-4 lower dimensions. The broad dimensions are loosely considered to represent "temperament" (the dimensions of Novelty Seeking, Harm Avoidance, Reward Dependence and Persistence), as well as "character" (Self Directedness, Cooperativeness, and Self Transcendence).',
    readMoreHref: DOI_HREF,
    layout: "gauges",
    overview: [
      {
        id: "tci-persistence",
        label: "Persistence",
        description:
          "Tendency to be productive, goal-oriented, and resilient when managing challenges",
        scaleNumbers: [113, 112, 114, 111],
      },
      {
        id: "tci-self-transcendence",
        label: "Self-Transcendence",
        description:
          "Capacity to see oneself as part of something that extends beyond one's own personal experiences of the world",
        scaleNumbers: [126, 125, 127],
        scoreOffset: -1,
      },
      {
        id: "tci-cooperativeness",
        label: "Cooperativeness",
        description:
          "Capacity to collaborate and work well with others, a dimension that is typically associated with traits like empathy, compassion, and tolerance",
        scaleNumbers: [121, 123, 124, 120, 122],
        scoreOffset: 1,
      },
      {
        id: "tci-reward-dependence",
        label: "Sensitivity to Rewards",
        description:
          "Tendency to be highly sensitive to rewards, including intangible social and emotional reward cues",
        scaleNumbers: [110, 107, 108, 109],
        scoreOffset: 1,
      },
      {
        id: "tci-novelty-seeking",
        label: "Novelty-Seeking",
        description:
          "Tendency to pursue new experiences, especially those that are emotionally or cognitively stimulating",
        scaleNumbers: [99, 102, 100, 101],
      },
      {
        id: "tci-self-directedness",
        label: "Self-Directedness",
        description:
          "Capacity to adapt oneself to situational demands - a character trait that typically requires well-developed psychological skills",
        scaleNumbers: [116, 117, 115, 119, 118],
        scoreOffset: 1,
      },
      {
        id: "tci-harm-avoidance",
        label: "Harm Avoidance",
        description: "A tendency to avoid risk and distress (physical, social, and emotional)",
        scaleNumbers: [106, 103, 105, 104],
      },
    ],
    sections: [
      {
        id: "tci-persistence-section",
        title: "Persistence",
        description:
          "Tendency to be productive, goal-oriented, and resilient when managing challenges",
        scaleNumbers: [113, 112, 114, 111],
      },
      {
        id: "tci-self-transcendence-section",
        title: "Self-Transcendence",
        description:
          "Capacity to see oneself as part of something that extends beyond one's own personal experiences of the world",
        scaleNumbers: [126, 125, 127],
      },
      {
        id: "tci-cooperativeness-section",
        title: "Cooperativeness",
        description:
          "Capacity to collaborate and work well with others, a dimension that is typically associated with traits like empathy, compassion, and tolerance",
        scaleNumbers: [121, 123, 124, 120, 122],
      },
      {
        id: "tci-reward-dependence-section",
        title: "Sensitivity to Rewards",
        description:
          "Tendency to be highly sensitive to rewards, including intangible social and emotional reward cues",
        scaleNumbers: [110, 107, 108, 109],
      },
      {
        id: "tci-novelty-section",
        title: "Novelty-Seeking",
        description:
          "Tendency to pursue new experiences, especially those that are emotionally or cognitively stimulating",
        scaleNumbers: [99, 102, 100, 101],
      },
      {
        id: "tci-self-directedness-section",
        title: "Self-Directedness",
        description:
          "Capacity to adapt oneself to situational demands - a character trait that typically requires well-developed psychological skills",
        scaleNumbers: [116, 117, 115, 119, 118],
      },
      {
        id: "tci-harm-avoidance-section",
        title: "Harm Avoidance",
        description: "A tendency to avoid risk and distress (physical, social, and emotional)",
        scaleNumbers: [106, 103, 105, 104],
      },
    ],
  },
  HPI: {
    id: "HPI",
    tabLabel: "HPI",
    heading: "Hogan Personality Inventory",
    methodology: AMBI_METHODOLOGY_NOTE,
    intro:
      "The Hogan Personality Inventory was created in the 1980s and is one of the most well-validated personality frameworks available, mainly due to the fact that it has been updated frequently. The AMBI version used here can estimate HPI scores for 44 low-level scales, but other versions of the HPI provide a range of higher level scores, including ones similar to the Big Five and beyond. The HPI can also be used to predict certain aspects of job performance, like the potential for success in various job roles (managerial, clerical, etc) and work environments.",
    readMoreHref: DOI_HREF,
    layout: "ranked-list",
    overview: [],
    sections: [
      {
        id: "hpi-ranked-list",
        title: "Ranked HPI scales",
        scaleNumbers: [
          160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175,
          176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191,
          192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203,
        ],
      },
    ],
  },
};

export const scaleDisplayOverrides: Partial<
  Record<number, { displayName: string; description: string }>
> = {
  1: {
    displayName: "Anxiety",
    description: "Tendency to feel fear over anticipated (or possible) future events",
  },
  2: {
    displayName: "Angry/Hostility",
    description: "Tendency to have strong negative reactions to perceived harm or threat",
  },
  3: {
    displayName: "Low Mood",
    description: "Tendency to feel sadness, negative mood, and/or low interest in activities",
  },
  4: {
    displayName: "Self-Consciousness",
    description: "Tendency to be shy or embarrassed about one's behavior or appearance",
  },
  5: {
    displayName: "Impulsiveness",
    description: "Tendency to act without thinking of the consequences",
  },
  6: {
    displayName: "Vulnerability",
    description: "Tendency to lose composure when faced with stressful circumstances",
  },
  7: {
    displayName: "Warmth",
    description: "Tendency to make connections with others by showing interest and kindness",
  },
  8: {
    displayName: "Gregariousness",
    description: "Tendency to prefer (and seek out) stimulating social activities",
  },
  9: {
    displayName: "Assertiveness",
    description: "Tendency to take charge and to make one's opinions known",
  },
  10: {
    displayName: "Activity",
    description: "Tendency to have a lot of energy and to prefer an active lifestyle",
  },
  11: {
    displayName: "Excitement-Seeking",
    description: "Tendency to prefer stimulating activities",
  },
  12: {
    displayName: "Positive Emotions",
    description: "Tendency to be happy and enthusiastic",
  },
  13: {
    displayName: "Fantasy",
    description: "Tendency to have an active imagination and capacity for creativity",
  },
  14: {
    displayName: "Aesthetics",
    description: "Tendency to appreciate art (of various types) and natural beauty",
  },
  15: {
    displayName: "Feelings",
    description: "Capacity to understand and recognize emotions (in oneself and others)",
  },
  16: {
    displayName: "Actions",
    description: "Tendency to prefer new experiences over familiar ones",
  },
  17: {
    displayName: "Ideas",
    description: "Tendency to be intellectually curious",
  },
  18: {
    displayName: "Values",
    description: "Tendency to be liberal and tolerant",
  },
  19: {
    displayName: "Trust",
    description: "Tendency to trust others and expect good intentions",
  },
  20: {
    displayName: "Straightforwardness",
    description: "Tendency to be honest and act with transparency",
  },
  21: {
    displayName: "Altruism",
    description: "Tendency to be helpful, selfless, and generous",
  },
  22: {
    displayName: "Compliance",
    description: "Tendency to be cooperative",
  },
  23: {
    displayName: "Low Attention-Seeking",
    description:
      "Tendency to avoid attention and not make one's strengths known to others",
  },
  24: {
    displayName: "Tender-Mindedness",
    description: "Tendency to be compassionate and empathetic",
  },
  25: {
    displayName: "Competence",
    description: "Capacity to handle tasks successfully",
  },
  26: {
    displayName: "Order",
    description: "Tendency to stay organized",
  },
  27: {
    displayName: "Dutifulness",
    description: "Tendency to meet one's obligations",
  },
  28: {
    displayName: "Achievement-Striving",
    description: "Tendency to be ambitiously goal oriented",
  },
  29: {
    displayName: "Self-Discipline",
    description: "Capacity to resist temptations for the sake of long-term goals",
  },
  30: {
    displayName: "Deliberation",
    description: "Tendency to use careful judgment and to plan before proceeding",
  },
  31: {
    displayName: "Sincerity",
    description: "Tendency to be genuine and straightforward",
  },
  32: {
    displayName: "Fairness",
    description: "Tendency to be open and equitable when dealing with others",
  },
  33: {
    displayName: "Greed Avoidance",
    description:
      "Tendency to avoid prioritizing one's own (material) interests",
  },
  34: {
    displayName: "Modesty",
    description: "Tendency to be humble instead of boastful or attention-seeking",
  },
  35: {
    displayName: "Fearfulness",
    description:
      "Tendency to find stressful or challenging situations frightening",
  },
  36: {
    displayName: "Worry",
    description: "Tendency to worry about things (especially future events)",
  },
  37: {
    displayName: "Dependence",
    description:
      "Tendency to be reliant on others and to need frequent reassurance",
  },
  38: {
    displayName: "Sentimentality",
    description: "Tendency to be emotionally sensitive and empathetic",
  },
  39: {
    displayName: "Expressiveness",
    description:
      "Tendency to be talkative, especially about emotions and personal experiences",
  },
  40: {
    displayName: "Social Boldness",
    description: "Tendency to be assertive and confident in social interactions",
  },
  41: {
    displayName: "Sociability",
    description: "Tendency to enjoy the company of others (including large group activities)",
  },
  42: {
    displayName: "Liveliness",
    description: "Tendency to be energetic and enthusiastic",
  },
  43: {
    displayName: "Forgiveness",
    description: "Tendency to forgive and maintain a positive view of others",
  },
  44: {
    displayName: "Gentleness",
    description: "Tendency to accept people and avoid being judgmental of others",
  },
  45: {
    displayName: "Flexibility",
    description: "Capacity to be adaptable and take input from others",
  },
  46: {
    displayName: "Patience",
    description: "Tendency to remain calm and avoid feeling irritated",
  },
  47: {
    displayName: "Organization",
    description: "Tendency to keep things tidy and orderly",
  },
  48: {
    displayName: "Diligence",
    description: "Tendency to be industrious and goal oriented",
  },
  49: {
    displayName: "Perfectionism",
    description: "Desire for precision and thoroughness",
  },
  50: {
    displayName: "Prudence",
    description: "Tendency to plan ahead and proceed carefully",
  },
  51: {
    displayName: "Art Appreciation",
    description: "Tendency to enjoy (and engage with) nature and the arts",
  },
  52: {
    displayName: "Inquisitiveness",
    description: "Tendency to be curious",
  },
  53: {
    displayName: "Creativity",
    description: "Tendency to imagine, create, and be innovative",
  },
  54: {
    displayName: "Unconventionality",
    description: "Willingness to resist norms and be eccentric",
  },
  55: {
    displayName: "Complexity",
    description: "Tendency to prefer intellectually stimulating topics",
  },
  56: {
    displayName: "Breadth of Interest",
    description: "Preference for a wide variety of cognitive interests and activities",
  },
  57: {
    displayName: "Innovation",
    description: "Tendency to come up with new and creative ideas",
  },
  58: {
    displayName: "Tolerance",
    description: "Tendency to be open to other ways of thinking and doing things",
  },
  59: {
    displayName: "Empathy",
    description: "Tendency to share/feel the emotions of others",
  },
  60: {
    displayName: "Anxiety",
    description: "Tendency to worry and become stressed easily",
  },
  61: {
    displayName: "Cooperativeness",
    description: "Tendency to go along with the ideas and opinions of others",
  },
  62: {
    displayName: "Connection",
    description: "Tendency to enjoy the company of others",
  },
  63: {
    displayName: "Social Confidence",
    description: "Capacity to be comfortable interacting with others",
  },
  64: {
    displayName: "Energy Level",
    description: "Tendency to be highly active, always doing things",
  },
  65: {
    displayName: "Social Astuteness",
    description: "Capacity to influence others (sometimes for one's own benefit)",
  },
  66: {
    displayName: "Risk-Taking",
    description: "Tendency to be comfortable with activities that others consider dangerous",
  },
  67: {
    displayName: "Organization",
    description: "Tendency to prefer (and maintain) order",
  },
  68: {
    displayName: "Traditional Values",
    description: "Tendency to hold conservative worldviews",
  },
  69: {
    displayName: "Responsibility",
    description: "Tendency to fulfill one's obligations",
  },
  70: {
    displayName: "Well-Being",
    description:
      "Tendency to feel happy, satisfied with one's life, and optimistic about the future",
  },
  71: {
    displayName: "Social Potency",
    description: "Capacity for influencing and leading others",
  },
  72: {
    displayName: "Achievement",
    description: "Tendency to be ambitious, hard-working, and goal-oriented",
  },
  73: {
    displayName: "Social Closeness",
    description: "Interest in developing and maintaining social relationships",
  },
  74: {
    displayName: "Stress Reaction",
    description: "Tendency to be reactive to stress, worry, and feel anxious",
  },
  75: {
    displayName: "Aggression",
    description: "Tendency to initiate conflicts, intimidate, and be confrontational",
  },
  76: {
    displayName: "Alienation",
    description: "Tendency to feel taken advantage of by others, expecting negative outcomes",
  },
  77: {
    displayName: "Control",
    description: "Tendency for low impulsivity, more planning, and more self-control",
  },
  78: {
    displayName: "Harm Avoidance",
    description: "Tendency and preference for avoiding dangerous activities",
  },
  79: {
    displayName: "Traditionalism",
    description: "Tendency to hold more traditional and conservative worldviews",
  },
  80: {
    displayName: "Absorption",
    description:
      "Tendency to become deeply involved in cognitive and/or sensory experiences",
  },
  81: {
    displayName: "Affiliation",
    description:
      "Tendency to seek community with others by building and maintaining close personal relationships",
  },
  82: {
    displayName: "Dominance",
    description:
      "Tendency to prefer having authority over others, whether as part of a leadership role or in a more manipulative, self-interested manner",
  },
  83: {
    displayName: "Exhibition",
    description:
      "Tendency to be attention-seeking, including a desire to show off and entertain others",
  },
  84: {
    displayName: "Deference",
    description:
      "Tendency to be submissive, often associated with lower self-esteem and a relatively higher tolerance for being taken advantage of",
  },
  85: {
    displayName: "Mild-Mannered",
    description: "Tendency to have a stable demeanor (rarely becoming irritable or upset)",
  },
  86: {
    displayName: "Good-Natured",
    description: "Tendency to be cooperative, tolerant, and open to feedback from others",
  },
  87: {
    displayName: "Cognitive Structure",
    description: "Tendency to prefer traditional values and authoritarian worldviews",
  },
  88: {
    displayName: "Planfulness",
    description: "Tendency to resist impulsive and thoughtless behavior",
  },
  89: {
    displayName: "Order",
    description:
      "Tendency to prefer organization, tidiness, as well as to carry out activities in a planful, methodical manner",
  },
  90: {
    displayName: "Autonomy",
    description: "Tendency to prefer doing things alone, including working independently",
  },
  91: {
    displayName: "Individualism",
    description: "Tendency to be unconcerned by the opinions and preferences of others",
  },
  92: {
    displayName: "Self-Reliance",
    description:
      "Tendency to get things done for oneself, without needing (or bothering) to consult with others",
  },
  93: {
    displayName: "Change",
    description:
      "Tendency to be adaptable and open to new ways of doing things rather than highly habitual",
  },
  94: {
    displayName: "Understanding",
    description: "Tendency to be intellectual and motivated to learn",
  },
  95: {
    displayName: "Curiosity",
    description:
      "Tendency to prefer having a wide variety of pursuits (hobbies and interests) including those that are new and unfamiliar",
  },
  96: {
    displayName: "Goal-orientation",
    description:
      "Tendency to prioritize productivity, dedication to one's goals, and to go above and beyond the expectations of others",
  },
  97: {
    displayName: "Endurance",
    description:
      "Tendency to be resilient and perseverant, even when dealing with complex challenges",
  },
  98: {
    displayName: "Seriousness",
    description:
      "Tendency to avoid opportunities for creativity and playfulness, including an avoidance of spontaneity and silly fun",
  },
  99: {
    displayName: "Sensation-Seeking",
    description: "Tendency to seek out and enjoy new and thrilling experiences",
  },
  100: {
    displayName: "Impulsiveness",
    description: "Tendency to act quickly without considering the consequences",
  },
  101: {
    displayName: "Extravagance",
    description: "Tendency to spend money freely and prioritize immediate enjoyment",
  },
  102: {
    displayName: "Disorderliness",
    description:
      "Tendency to prefer flexibility and spontaneity over adherence to rules and order",
  },
  103: {
    displayName: "Worry and Pessimism",
    description: "Tendency to frequently and excessively worry about potential future problems",
  },
  104: {
    displayName: "Fear of Uncertainty",
    description: "Tendency to feel anxious in situations where most others perceive little risk",
  },
  105: {
    displayName: "Shyness",
    description:
      "Tendency to feel discomfort or lack of confidence in social situations (especially with strangers)",
  },
  106: {
    displayName: "Fatigability",
    description:
      "Tendency to get fatigued more quickly and recover more slowly than most others",
  },
  107: {
    displayName: "Sentimentality",
    description: "Tendency to be guided by emotions and experience nostalgia about past events",
  },
  108: {
    displayName: "Social Engagement",
    description:
      "Tendency to be genuinely interested in people and to enjoy social interactions",
  },
  109: {
    displayName: "Attachment",
    description:
      "Tendency to be open about one's feelings and interested in close relationships",
  },
  110: {
    displayName: "Conformity",
    description: "Tendency to seek approval, support, and direction from others",
  },
  111: {
    displayName: "Initiative",
    description: "Tendency to be enthusiastic about starting and completing projects",
  },
  112: {
    displayName: "Work-Hardened",
    description: "Tendency to persistently and competently handle challenging tasks",
  },
  113: {
    displayName: "Ambitious",
    description: "Tendency to be goal oriented and industrious",
  },
  114: {
    displayName: "Perfectionist",
    description:
      "Tendency to set and pursue high standards, often at the expense of more immediate rewards",
  },
  115: {
    displayName: "Resilience",
    description:
      "Capacity to stay focused on duties and obligations, especially those affecting others",
  },
  116: {
    displayName: "Purposefulness",
    description: "Capacity to maintain a strong sense of purpose and meaning in life",
  },
  117: {
    displayName: "Resourcefulness",
    description: "Capacity to draw on a wide range of skills rather than give up on hard problems",
  },
  118: {
    displayName: "Self-Acceptance",
    description: "Capacity to maintain a healthy and realistic view of oneself",
  },
  119: {
    displayName: "Restraint",
    description: "Capacity for self-control (resisting temptations and bad habits)",
  },
  120: {
    displayName: "Social Acceptance",
    description:
      "Capacity to remain open and respectful of multiple diverse perspectives",
  },
  121: {
    displayName: "Empathy",
    description: "Capacity to feel and understand the emotions of others",
  },
  122: {
    displayName: "Helpfulness",
    description: "Capacity to enjoy helping others and to value their contributions",
  },
  123: {
    displayName: "Compassion",
    description: "Capacity to accept others and to forgive their mistakes",
  },
  124: {
    displayName: "Morality",
    description: "Capacity to adhere to moral standards",
  },
  125: {
    displayName: "Self-Forgetful",
    description: "Tendency to become absorbed in thoughts and experiences",
  },
  126: {
    displayName: "Sensitive to Beauty",
    description: "Capacity to appreciate beauty and profound experiences",
  },
  127: {
    displayName: "Spiritual Acceptance",
    description:
      "Tendency to have spiritual experiences or to feel supernatural connections",
  },
  130: {
    displayName: "Social Dominance",
    description: "Tendency to take charge and be assertive",
  },
  131: {
    displayName: "Capacity for Status",
    description: "Tendency to think and engage in higher-level discussions and tasks",
  },
  132: {
    displayName: "Social Skill",
    description: "Tendency to seek out social interactions and be comfortable with them",
  },
  133: {
    displayName: "Social Presence",
    description: "Tendency to be charismatic, personable, and socially adept",
  },
  134: {
    displayName: "Self Acceptance",
    description: "Tendency to be willing to take chances, make mistakes, and play with new ideas",
  },
  135: {
    displayName: "Self-Reliance",
    description: "Capacity to be self-reliant, especially in dealing with complex problems",
  },
  136: {
    displayName: "Social Fluency",
    description: "Tendency to be interested in and concerned about other people's circumstances",
  },
  137: {
    displayName: "Compliance",
    description: "Tendency to be conscientious, cooperative, and respectful of others",
  },
  138: {
    displayName: "Socialization",
    description: "Tendency to be socially trusting, collaborative, and fair",
  },
  139: {
    displayName: "Self-Control",
    description:
      "Capacity to remain emotionally regulated and resist rash or impulsive reactions",
  },
  140: {
    displayName: "Personable",
    description:
      "Tendency to be even-tempered (resisting temptations and impropriety)",
  },
  141: {
    displayName: "Communality",
    description:
      "Tendency to conform to socially accepted patterns of behavior and to be conventional",
  },
  142: {
    displayName: "Low Vulnerability",
    description:
      "Tendency to feel satisfied with one's circumstances and optimistic about the future",
  },
  143: {
    displayName: "Composure",
    description: "Tendency to be open-minded, compassionate, and sympathetic",
  },
  144: {
    displayName: "Valuing traditional achievements",
    description: "Tendency to pursue success by adhering to rules and guidelines",
  },
  145: {
    displayName: "Valuing unique achievements",
    description:
      "Tendency to pursue success by exploring new or unconventional paths",
  },
  146: {
    displayName: "Intellectual Efficiency",
    description:
      "Tendency to learn or use advanced skills, be well-informed, and behave in an educated manner",
  },
  147: {
    displayName: "Psychological Mindedness",
    description: "Tendency to have (or seek) insight into others' behavior",
  },
  148: {
    displayName: "Tolerance for Ambiguity",
    description: "Tendency to be adaptable and open to adopting new ways of thinking",
  },
  149: {
    displayName: "Sensitivity",
    description:
      "Tendency to be sympathetic and emotional about the difficulties of others",
  },
  155: {
    displayName: "Creative Temperament",
    description: "Tendency to be interested in creative and innovative pursuits",
  },
  156: {
    displayName: "Leadership",
    description: "Capacity to lead others effectively and productively",
  },
  157: {
    displayName: "Amicability",
    description: "Tendency to be easy to get along with, understanding, and friendly",
  },
  159: {
    displayName: "Tough-Mindedness",
    description: "Tendency to be poised, objective, and resilient",
  },
  160: {
    displayName: "Low Irritability",
    description: "Capacity to understand others' feelings and respond with compassion",
  },
  161: {
    displayName: "Steadiness",
    description: "Tendency to remain calm and worry-free",
  },
  162: {
    displayName: "Self-Assured",
    description:
      "Tendency to be comfortable with oneself and to have little regret for previous actions",
  },
  163: {
    displayName: "Calmness",
    description: "Tendency to remain calm and composed (especially under pressure)",
  },
  164: {
    displayName: "Even-Tempered",
    description: "Tendency to rarely get upset",
  },
  165: {
    displayName: "Vitality",
    description: "Tendency to experience few physical symptoms (especially ones related to stress)",
  },
  166: {
    displayName: "Trusting",
    description: "Tendency to trust other people and their intentions",
  },
  167: {
    displayName: "Secure Attachment",
    description: "Tendency to expect stability in relationships",
  },
  168: {
    displayName: "Competitive",
    description: "Tendency to be willing to accept challenges and to expect success",
  },
  169: {
    displayName: "Self-Confidence",
    description: "Tendency to maintain positive self-regard and assuredness",
  },
  170: {
    displayName: "Stability",
    description: "Capacity to avoid experiencing low mood and disinterest",
  },
  171: {
    displayName: "Self-Directed",
    description: "Tendency to be willing to take charge and influence or direct others",
  },
  172: {
    displayName: "Identity",
    description: "Capacity for self-awareness and a sense of direction in life",
  },
  173: {
    displayName: "Social Self-Esteem",
    description: "Tendency to be comfortable with and skilled at social situations",
  },
  174: {
    displayName: "Liking Parties",
    description: "Tendency to enjoy social gatherings",
  },
  175: {
    displayName: "Liking Crowds",
    description: "Tendency to enjoy large public events (sporting events, concerts)",
  },
  176: {
    displayName: "Experience-Seeking",
    description: "Tendency to enjoy trying new things",
  },
  177: {
    displayName: "Exhibitionistic",
    description: "Tendency to enjoy attention from others",
  },
  178: {
    displayName: "Entertaining",
    description: "Tendency to enjoy amusing others",
  },
  179: {
    displayName: "Affable",
    description: "Tendency to be accepting of others and easy going",
  },
  180: {
    displayName: "Sensitive",
    description: "Tendency to feel strong emotions about the experiences of others",
  },
  181: {
    displayName: "Caring",
    description: "Tendency to feel concern for others",
  },
  182: {
    displayName: "Liking People",
    description: "Tendency to be interested in the experiences of others",
  },
  183: {
    displayName: "Forgiving",
    description: "Tendency to forgive easily and forget disagreements",
  },
  184: {
    displayName: "Moralistic",
    description: "Tendency to be judgmental of the behavior of others",
  },
  185: {
    displayName: "Mastery",
    description: "Tendency to persevere until expert performance is routinely achieved",
  },
  186: {
    displayName: "Virtuous",
    description: "Tendency to behave with high moral standards and goodness",
  },
  187: {
    displayName: "Approval Seeking",
    description: "Tendency to be dependent on others and approval seeking",
  },
  188: {
    displayName: "Grounded",
    description: "Tendency to prefer routines",
  },
  189: {
    displayName: "Impulse Control",
    description: "Tendency to avoid being thoughtless or reckless",
  },
  190: {
    displayName: "Avoiding Trouble",
    description: "Tendency to be agreeable and respect authority",
  },
  191: {
    displayName: "Science Ability",
    description: "Capacity and preference for analytical and data-informed thinking",
  },
  192: {
    displayName: "Curiosity",
    description: "Tendency to want to understand how things work",
  },
  193: {
    displayName: "Thrill-Seeking",
    description: "Tendency to prefer exciting and sometimes dangerous activities",
  },
  194: {
    displayName: "Intellectual Games",
    description: "Preference for complex activities and games of strategy",
  },
  195: {
    displayName: "Generates Ideas",
    description: "Tendency to come up with novel and innovative ideas",
  },
  196: {
    displayName: "Culture",
    description:
      "Tendency to appreciate artistic activities and/or unfamiliar ways of living",
  },
  197: {
    displayName: "Education",
    description: "Tendency to be knowledgeable in terms of facts and skills",
  },
  198: {
    displayName: "Math Ability",
    description: "Capacity to be capable of advanced math",
  },
  199: {
    displayName: "Good Memory",
    description: "Capacity to recall and/or recognize lots of information",
  },
  200: {
    displayName: "Reading",
    description: "Capacity to read sophisticated texts with high literacy vocabulary terms",
  },
  201: {
    displayName: "Self-Focus",
    description: "Tendency to be introspective and reflective",
  },
  202: {
    displayName: "Impression Management",
    description: "Tendency to be concerned with the opinions of others, especially about oneself",
  },
  203: {
    displayName: "Appearance",
    description:
      "Tendency to be concerned about one's physical appearance, especially clothes and grooming",
  },
};
