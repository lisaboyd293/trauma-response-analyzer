import { invokeLLM } from "./_core/llm";

export type RetrievedSource = {
  title: string;
  publisher: string;
  url: string;
  type: "clinical" | "journal" | "framework";
  excerpt?: string;
  whyItMatters: string;
};

export type AnalysisResult = {
  framing: string;
  summary: string;
  nervousSystemContext: {
    heading: string;
    body: string;
    cues: string[];
  };
  patternMatching: {
    heading: string;
    body: string;
    possiblePatterns: Array<{ label: string; note: string }>;
  };
  nuanceVariables: string[];
  nextSteps: {
    selfReflection: string[];
    professionalSupport: string;
    urgentSupport: string;
  };
  sourceNote: string;
  citations: RetrievedSource[];
};

const CURATED_SOURCES: RetrievedSource[] = [
  {
    title: "Trauma",
    publisher: "American Psychological Association",
    url: "https://www.apa.org/topics/trauma",
    type: "clinical",
    whyItMatters: "A plain-language clinical overview of how trauma can affect thoughts, emotions, and the body.",
  },
  {
    title: "Post-Traumatic Stress Disorder",
    publisher: "National Institute of Mental Health",
    url: "https://www.nimh.nih.gov/health/publications/post-traumatic-stress-disorder-ptsd",
    type: "clinical",
    whyItMatters: "A public-health reference for PTSD symptoms, context, and when professional assessment can help.",
  },
  {
    title: "PTSD Basics",
    publisher: "U.S. Department of Veterans Affairs, National Center for PTSD",
    url: "https://www.ptsd.va.gov/understand/what/ptsd_basics.asp",
    type: "clinical",
    whyItMatters: "A clinically grounded explanation of re-experiencing, avoidance, mood changes, and arousal.",
  },
  {
    title: "Trauma and Violence",
    publisher: "Substance Abuse and Mental Health Services Administration",
    url: "https://www.samhsa.gov/mental-health/trauma-violence",
    type: "clinical",
    whyItMatters: "A trauma-informed care lens that emphasizes safety, choice, collaboration, and context.",
  },
  {
    title: "Polyvagal Theory resources",
    publisher: "Polyvagal Institute",
    url: "https://www.polyvagalinstitute.org/",
    type: "framework",
    whyItMatters: "An optional nervous-system framework; it is presented as a lens for reflection, not a diagnostic test.",
  },
  {
    title: "Trauma Research Foundation",
    publisher: "Trauma Research Foundation",
    url: "https://traumaresearchfoundation.org/",
    type: "framework",
    whyItMatters: "An educational hub for trauma research and body-based approaches, interpreted here with appropriate uncertainty.",
  },
];

const TOPIC_TERMS = [
  "fight",
  "flight",
  "freeze",
  "fawn",
  "panic",
  "numb",
  "dissociation",
  "dissociate",
  "hypervigilance",
  "hyperarousal",
  "nightmare",
  "flashback",
  "trigger",
  "shutdown",
  "shut down",
  "startle",
  "sleep",
  "avoidance",
  "avoid",
  "anger",
  "heart",
  "breathing",
  "tension",
  "overwhelm",
  "trauma",
  "stress",
];

function extractTopicTerms(experience: string) {
  const normalized = experience.toLowerCase();
  return TOPIC_TERMS.filter((term) => normalized.includes(term)).slice(0, 6);
}

function compact(value: unknown, maxLength = 360) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function fetchJson(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2600) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function retrieveScholarlySources(experience: string): Promise<RetrievedSource[]> {
  const terms = extractTopicTerms(experience);
  const query = terms.length ? `${terms.join(" ")} trauma stress response` : "trauma stress response PTSD";
  const europePmcUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(`(${query}) AND (OPEN_ACCESS:Y OR HAS_ABSTRACT:Y)`)}&format=json&pageSize=3&resultType=core`;
  const crossrefUrl = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&filter=type:journal-article&rows=3&select=title,DOI,URL,published,container-title,author`;
  const [europePmc, crossref] = await Promise.all([fetchJson(europePmcUrl), fetchJson(crossrefUrl)]);
  const sources: RetrievedSource[] = [];

  for (const item of europePmc?.resultList?.result ?? []) {
    const title = compact(item.title, 180);
    if (!title) continue;
    sources.push({
      title,
      publisher: item.journalTitle ? `Europe PMC · ${item.journalTitle}` : "Europe PMC indexed research",
      url: item.fullTextUrlList?.fullTextUrl?.[0]?.url ?? `https://europepmc.org/article/MED/${item.pmid ?? item.id}`,
      type: "journal",
      excerpt: compact(item.abstractText),
      whyItMatters: "A scholarly record retrieved from Europe PMC to complement the clinical guidance above.",
    });
  }

  for (const item of crossref?.message?.items ?? []) {
    const title = compact(item.title?.[0], 180);
    if (!title) continue;
    const doiUrl = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : "https://search.crossref.org/");
    sources.push({
      title,
      publisher: `Crossref${item["container-title"]?.[0] ? ` · ${item["container-title"][0]}` : " indexed journal record"}`,
      url: doiUrl,
      type: "journal",
      whyItMatters: "A journal record retrieved through Crossref for an additional scholarly cross-check.",
    });
  }

  return sources.slice(0, 4);
}

export async function retrieveSources(experience: string): Promise<RetrievedSource[]> {
  const scholarly = await retrieveScholarlySources(experience);
  return [...CURATED_SOURCES.slice(0, 4), ...scholarly, CURATED_SOURCES[4], CURATED_SOURCES[5]].slice(0, 9);
}

const responseSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "trauma_response_educational_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["framing", "summary", "nervousSystemContext", "patternMatching", "nuanceVariables", "nextSteps", "sourceNote"],
      properties: {
        framing: { type: "string" },
        summary: { type: "string" },
        nervousSystemContext: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "body", "cues"],
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            cues: { type: "array", items: { type: "string" } },
          },
        },
        patternMatching: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "body", "possiblePatterns"],
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            possiblePatterns: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "note"],
                properties: { label: { type: "string" }, note: { type: "string" } },
              },
            },
          },
        },
        nuanceVariables: { type: "array", items: { type: "string" } },
        nextSteps: {
          type: "object",
          additionalProperties: false,
          required: ["selfReflection", "professionalSupport", "urgentSupport"],
          properties: {
            selfReflection: { type: "array", items: { type: "string" } },
            professionalSupport: { type: "string" },
            urgentSupport: { type: "string" },
          },
        },
        sourceNote: { type: "string" },
      },
    },
  },
};

function parseModelJson(content: unknown): Partial<AnalysisResult> | null {
  if (typeof content !== "string") return null;
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as Partial<AnalysisResult>;
  } catch {
    return null;
  }
}

function softenLanguage(value: string) {
  return value
    .replace(/\b(this|that|your reaction|your experience)\s+(is|was|means)\s+(definitely\s+)?(a\s+)?(trauma response|ptsd)\b/gi, "This pattern may share features with a trauma- or stress-related response")
    .replace(/\b(you have|you are experiencing)\s+(ptsd|trauma)\b/gi, "you may be noticing stress- or trauma-related features")
    .replace(/\bdiagnose[sd]?\b/gi, "assess clinically");
}

function containsUrgency(experience: string) {
  return /\b(suicid|kill myself|self[- ]harm|hurt myself|can't stay safe|cannot stay safe|end my life)\b/i.test(experience);
}

export function buildFallbackAnalysis(experience: string, citations: RetrievedSource[]): AnalysisResult {
  const lower = experience.toLowerCase();
  const urgency = containsUrgency(experience);
  const cues = [
    /heart|breath|shaking|sweat|tight|adrenalin|racing/i.test(lower) ? "Body alarm cues such as a racing heart, tightness, shaking, or changed breathing" : "Body sensations that may signal increased activation or a protective response",
    /numb|freeze|shutdown|dissociat|far away|blank/i.test(lower) ? "Numbing, freeze, shutdown, or feeling far away from the moment" : "Changes in attention, emotion, or connection that may be part of a protective response",
  ];
  const patterns = [
    { label: "Activation / mobilization", note: "Fight-or-flight language can overlap with sympathetic arousal, especially when the system reads something as urgent." },
    { label: "Protection through distance", note: "Freeze, numbness, avoidance, or detachment can sometimes function as short-term protection; context and duration matter." },
  ];
  return {
    framing: "This pattern may share characteristics with a stress or trauma-related nervous-system response, but a short description cannot determine the cause.",
    summary: "Your experience sounds worth approaching with curiosity rather than judgment. Similar reactions can arise during ordinary stress, after overwhelming events, with sleep disruption, health conditions, medication effects, or other contexts.",
    nervousSystemContext: {
      heading: "Your system may be shifting into protection",
      body: "When the brain senses threat or overload, autonomic changes can prepare the body to mobilize, pause, or conserve energy. These reactions are real and involuntary, but the same outward pattern can have different meanings for different people.",
      cues,
    },
    patternMatching: {
      heading: "A few possible overlaps",
      body: "The details you shared overlap with common psychoeducation about stress responses. This is pattern education, not a diagnostic conclusion.",
      possiblePatterns: patterns,
    },
    nuanceVariables: [
      "What happened immediately before the reaction, and whether it felt unsafe, surprising, or inescapable",
      "How often it happens, how long it lasts, and whether it is becoming easier or harder to recover",
      "Sleep, pain, illness, medication or substance changes, sensory overload, and current life stress",
      "Whether the reaction is affecting relationships, work, daily functioning, or your sense of safety",
    ],
    nextSteps: {
      selfReflection: [
        "Notice one early body cue and one thing that helps you feel a little more present.",
        "Try a gentle orienting practice: name five neutral things you can see, or place both feet on the floor and lengthen your exhale without forcing it.",
        "Write down the context and recovery time rather than trying to label yourself.",
      ],
      professionalSupport: "If this is distressing, recurring, or interfering with daily life, consider speaking with a qualified mental health professional or primary-care clinician who can explore the full context with you.",
      urgentSupport: urgency ? "Because you mentioned a possible safety concern, please contact local emergency services or a crisis service now, or go to the nearest emergency department. If possible, stay with someone you trust while you get support." : "If you feel in immediate danger or unable to stay safe, contact local emergency services or a crisis service now.",
    },
    sourceNote: "This educational reflection is grounded in general trauma-informed and clinical psychoeducation from the sources below, with scholarly records retrieved when available. It is not a diagnosis or a substitute for care.",
    citations,
  };
}

function mergeWithFallback(partial: Partial<AnalysisResult>, fallback: AnalysisResult, citations: RetrievedSource[]) {
  return {
    ...fallback,
    ...partial,
    nervousSystemContext: { ...fallback.nervousSystemContext, ...(partial.nervousSystemContext ?? {}) },
    patternMatching: { ...fallback.patternMatching, ...(partial.patternMatching ?? {}) },
    nextSteps: { ...fallback.nextSteps, ...(partial.nextSteps ?? {}) },
    citations,
  } as AnalysisResult;
}

export async function analyzeExperience(experience: string, context?: string): Promise<AnalysisResult> {
  const citations = await retrieveSources(experience);
  const fallback = buildFallbackAnalysis(experience, citations);
  const sourcePacket = citations.map((source, index) => `${index + 1}. ${source.title} — ${source.publisher}\nURL: ${source.url}\nWhy it matters: ${source.whyItMatters}${source.excerpt ? `\nAbstract excerpt: ${source.excerpt}` : ""}`).join("\n\n");

  try {
    const response = await invokeLLM({
      model: "claude-sonnet-4-6",
      thinking: { type: "enabled", budget_tokens: 512 },
      maxTokens: 2200,
      messages: [
        {
          role: "system",
          content: `You are a compassionate psychoeducation assistant. Analyze a user's described reaction using only cautious, probabilistic language. Never diagnose, rule out a diagnosis, assign a trauma label, or imply certainty. Never say a reaction definitely is or is not a trauma response. Explain nervous-system concepts in plain language, distinguish ordinary stress from trauma-related patterns, and state why a clinician would need more context. Treat Polyvagal Theory as one debated interpretive framework, never as settled diagnostic fact. Do not provide medical instructions. If the user may be in immediate danger or mentions self-harm, include a clear urgent-support message. Return JSON matching the schema exactly. Use only the supplied source packet for source grounding; do not invent citations or quote studies not supplied.`,
        },
        {
          role: "user",
          content: `User experience:\n${experience}\n\nOptional context:\n${context || "Not provided"}\n\nSource packet:\n${sourcePacket}`,
        },
      ],
      response_format: responseSchema,
    });
    const partial = parseModelJson(response.choices?.[0]?.message?.content);
    if (!partial) return fallback;
    const merged = mergeWithFallback(partial, fallback, citations);
    return {
      ...merged,
      framing: softenLanguage(merged.framing),
      summary: softenLanguage(merged.summary),
      nervousSystemContext: { ...merged.nervousSystemContext, body: softenLanguage(merged.nervousSystemContext.body), cues: merged.nervousSystemContext.cues.map(softenLanguage) },
      patternMatching: { ...merged.patternMatching, body: softenLanguage(merged.patternMatching.body), possiblePatterns: merged.patternMatching.possiblePatterns.map((pattern) => ({ ...pattern, note: softenLanguage(pattern.note) })) },
      nuanceVariables: merged.nuanceVariables.map(softenLanguage),
      nextSteps: { ...merged.nextSteps, professionalSupport: softenLanguage(merged.nextSteps.professionalSupport), urgentSupport: softenLanguage(merged.nextSteps.urgentSupport) },
      sourceNote: softenLanguage(merged.sourceNote),
    };
  } catch (error) {
    console.warn("[TraumaAnalyzer] Falling back to deterministic educational response:", error);
    return fallback;
  }
}
