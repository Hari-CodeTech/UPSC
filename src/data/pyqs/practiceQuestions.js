export const practiceDrillQuestions = [
  {
    id: "PRACTICE-PRE-POL-01",
    year: 2025,
    type: "PRACTICE_DRILL", // Clearly distinguished from AUTHENTIC_UPSC
    sourceLabel: "Curated Practice Drill (Based on standard reference: Laxmikanth)",
    stage: "Prelims",
    paper: "GS Paper I",
    subject: "GS II",
    syllabusTopicId: "GS2-POL-01",
    question: "Which of the following statements regarding the 'Basic Structure Doctrine' is correct?",
    options: [
      "It is explicitly defined in Article 368 of the Constitution of India.",
      "The Supreme Court invented the doctrine in the Golaknath Case (1967).",
      "It restricts the constituent power of Parliament to amend the Constitution so as not to destroy its essential features.",
      "It prohibits any amendment to Part III (Fundamental Rights) under any circumstances."
    ],
    correctAnswer: 2,
    explanation: "The Basic Structure doctrine was established in the landmark Kesavananda Bharati v. State of Kerala (1973). It does not prohibit amending Fundamental Rights, provided the essential features/core framework of the Constitution remain intact. The term is not defined anywhere in the Constitution itself.",
    topic: "Basic Structure Doctrine",
    difficulty: "Moderate"
  },
  {
    id: "PRACTICE-PRE-CSAT-01",
    year: 2025,
    type: "PRACTICE_DRILL",
    sourceLabel: "Curated CSAT Aptitude Drill",
    stage: "Prelims",
    paper: "CSAT Paper II",
    subject: "CSAT",
    syllabusTopicId: "CSAT-QA-01",
    question: "A vessel contains 60 litres of milk. 12 litres of milk is taken out and replaced by water. This process is repeated once more. How much milk is now left in the vessel?",
    options: [
      "36.4 litres",
      "38.4 litres",
      "40.2 litres",
      "42.0 litres"
    ],
    correctAnswer: 1, // 38.4 litres
    explanation: "Formula for remaining liquid: Quantity = Initial × (1 - x/C)^n, where C=60, x=12, n=2.\nRemaining milk = 60 × (1 - 12/60)^2 = 60 × (4/5)^2 = 60 × 16/25 = 38.4 litres.",
    topic: "Mixtures and Alligations",
    difficulty: "Moderate"
  },
  {
    id: "PRACTICE-MAINS-GS3-01",
    year: 2025,
    type: "PRACTICE_DRILL",
    sourceLabel: "Curated GS III Mains Drill",
    stage: "Mains",
    paper: "GS Paper III",
    subject: "GS III",
    syllabusTopicId: "GS3-ECO-01",
    directive: "Critically Analyse",
    marks: 15,
    wordLimit: 250,
    question: "Critically analyse the efficacy of the Fiscal Responsibility and Budget Management (FRBM) Act in instilling fiscal discipline in India. Has the post-pandemic capital expenditure strategy necessitated a recalibration of fiscal targets?",
    modelOutline: {
      introduction: "Trace the enactment of FRBM Act 2003 aiming for 3% fiscal deficit and zero revenue deficit; NK Singh Committee recommendations (debt-to-GDP anchor 60%).",
      body: [
        "Successes: Initial consolidation pre-2008, enhanced fiscal transparency, reduction in states' debt burdens.",
        "Shortcomings & Slippages: Frequent amendments to target years; escape clauses invoked; off-budget borrowings masking true liabilities (prior to recent transparency measures).",
        "Post-pandemic capex push: Sharp hike in central capital outlay to crowd-in private investment; necessity of growth multiplier over rigid austerity in developing economies."
      ],
      conclusion: "A balanced glide path reconciling productive capex with fiscal consolidation to ensure macroeconomic stability without choking infrastructure growth."
    }
  }
];
