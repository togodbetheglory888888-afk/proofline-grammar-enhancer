(function (global) {
  "use strict";

  /*
   * Proofline Grammar Engine V4
   * Offline, rule-based English grammar checker.
   *
   * Public API:
   *   GrammarEngine.analyze(text)         -> suggestion[]
   *   GrammarEngine.analyzeDocument(text) -> full analysis object
   *   GrammarEngine.analyzePOS(text)      -> basic part-of-speech labels
   *
   * Suggestion format:
   *   {
   *     category, title, start, end, original, replacement,
   *     message, severity, confidence, ruleId
   *   }
   */

  const VERBS = {
    be: { past: "was", third: "is" },
    have: { past: "had", third: "has" },
    do: { past: "did", third: "does" },
    go: { past: "went", third: "goes" },
    say: { past: "said", third: "says" },
    make: { past: "made", third: "makes" },
    see: { past: "saw", third: "sees" },
    take: { past: "took", third: "takes" },
    know: { past: "knew", third: "knows" },
    think: { past: "thought", third: "thinks" },
    come: { past: "came", third: "comes" },
    give: { past: "gave", third: "gives" },
    find: { past: "found", third: "finds" },
    tell: { past: "told", third: "tells" },
    become: { past: "became", third: "becomes" },
    write: { past: "wrote", third: "writes" },
    eat: { past: "ate", third: "eats" },
    buy: { past: "bought", third: "buys" },
    run: { past: "ran", third: "runs" },
    bring: { past: "brought", third: "brings" },
    read: { past: "read", third: "reads" },
    teach: { past: "taught", third: "teaches" },
    study: { past: "studied", third: "studies" },
    try: { past: "tried", third: "tries" },
    carry: { past: "carried", third: "carries" },
    watch: { past: "watched", third: "watches" },
    fix: { past: "fixed", third: "fixes" },
    pass: { past: "passed", third: "passes" },
    attend: { third: "attends" }, learn: { third: "learns" },
    work: { third: "works" }, play: { third: "plays" },
    help: { third: "helps" }, use: { third: "uses" },
    need: { third: "needs" }, want: { third: "wants" },
    like: { third: "likes" }, live: { third: "lives" },
    open: { third: "opens" }, close: { third: "closes" },
    complete: { third: "completes" }, create: { third: "creates" },
    include: { third: "includes" }, provide: { third: "provides" },
    support: { third: "supports" }, improve: { third: "improves" },
    explain: { third: "explains" }, show: { third: "shows" },
    lead: { third: "leads" }, move: { third: "moves" },
    start: { third: "starts" }, continue: { third: "continues" },
    consider: { third: "considers" }, develop: { third: "develops" },
    discuss: { third: "discusses" }, answer: { third: "answers" },
    ask: { third: "asks" }, follow: { third: "follows" },
    prepare: { third: "prepares" }, remember: { third: "remembers" },
    require: { third: "requires" }, return: { third: "returns" },
    seem: { third: "seems" }, talk: { third: "talks" },
    understand: { third: "understands" }, visit: { third: "visits" },
    wait: { third: "waits" }, walk: { third: "walks" },
    believe: { third: "believes" }, choose: { third: "chooses" },
    clean: { third: "cleans" }, change: { third: "changes" },
    check: { third: "checks" }, compare: { third: "compares" },
    decide: { third: "decides" }, finish: { third: "finishes" },
    hope: { third: "hopes" }, listen: { third: "listens" },
    look: { third: "looks" }, plan: { third: "plans" },
    save: { third: "saves" }
  };

  const SPELLING = {
    accomodate: "accommodate", acheive: "achieve", acknowlege: "acknowledge",
    adress: "address", agressive: "aggressive", apparant: "apparent",
    arguement: "argument", becuase: "because", begining: "beginning",
    beleive: "believe", calender: "calendar", comming: "coming",
    completly: "completely", definately: "definitely", diffrent: "different",
    dissapear: "disappear", embarass: "embarrass", enviroment: "environment",
    excercise: "exercise", existance: "existence", experiance: "experience",
    familly: "family", finaly: "finally", freind: "friend",
    goverment: "government", grammer: "grammar", happend: "happened",
    imediately: "immediately", independant: "independent", knowlege: "knowledge",
    maintenence: "maintenance", necesary: "necessary", occassion: "occasion",
    occured: "occurred", occurence: "occurrence", oportunity: "opportunity",
    permanant: "permanent", persue: "pursue", possesion: "possession",
    prefered: "preferred", privelege: "privilege", recieve: "receive",
    recomend: "recommend", refered: "referred", relevent: "relevant",
    seperate: "separate", succesful: "successful", succesfully: "successfully",
    sucess: "success", teh: "the", thier: "their", tommorow: "tomorrow",
    truely: "truly", untill: "until", usefull: "useful", wierd: "weird",
    writting: "writing", thisis: "this is"
  };

  const UNCOUNTABLE = new Set([
    "advice", "information", "equipment", "furniture", "homework",
    "research", "knowledge", "feedback", "evidence", "progress",
    "traffic", "luggage", "money", "education"
  ]);

  const IRREGULAR_PLURAL = {
    child: "children", person: "people", man: "men", woman: "women",
    mouse: "mice", foot: "feet", tooth: "teeth", goose: "geese"
  };

  const MODALS = new Set([
    "can", "could", "may", "might", "must", "shall", "should", "will", "would"
  ]);

  function preserveCase(source, replacement) {
    if (!replacement) return replacement;
    if (source === source.toUpperCase()) return replacement.toUpperCase();
    if (/^[A-Z]/.test(source)) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  function tokenize(text) {
    const result = [];
    const regex = /\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g;
    let match;
    while ((match = regex.exec(text))) {
      result.push({
        word: match[0],
        lower: match[0].toLowerCase(),
        start: match.index,
        end: match.index + match[0].length
      });
    }
    return result;
  }

  function makeSuggestion(options) {
    return {
      id: `${options.ruleId}:${options.start}:${options.end}`,
      ruleId: options.ruleId,
      category: options.category,
      type: options.category,
      title: options.title,
      start: options.start,
      end: options.end,
      original: options.original,
      replacement: options.replacement || "",
      suggestion: options.replacement || "",
      message: options.message,
      severity: options.severity || "warning",
      confidence: options.confidence || 0.9
    };
  }

  function addMatch(output, match, replacement, options) {
    output.push(makeSuggestion({
      ...options,
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      replacement
    }));
  }

  function thirdPerson(base) {
    if (VERBS[base] && VERBS[base].third) return VERBS[base].third;
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
    if (/(s|x|z|ch|sh|o)$/.test(base)) return base + "es";
    return base + "s";
  }

  function baseForm(word) {
    const lower = word.toLowerCase();
    for (const key of Object.keys(VERBS)) {
      if (VERBS[key].third === lower) return key;
    }
    if (/ies$/.test(lower) && lower.length > 3) return lower.slice(0, -3) + "y";
    if (/(ches|shes|xes|zes|oes)$/.test(lower)) return lower.slice(0, -2);
    if (/s$/.test(lower) && !/(ss|us|is)$/.test(lower)) return lower.slice(0, -1);
    return lower;
  }

  function pluralize(word) {
    const lower = word.toLowerCase();
    if (IRREGULAR_PLURAL[lower]) return preserveCase(word, IRREGULAR_PLURAL[lower]);
    if (/[^aeiou]y$/.test(lower)) return word.slice(0, -1) + "ies";
    if (/(s|x|z|ch|sh)$/.test(lower)) return word + "es";
    return word + "s";
  }

  function singularize(word) {
    const lower = word.toLowerCase();
    for (const [singular, plural] of Object.entries(IRREGULAR_PLURAL)) {
      if (plural === lower) return preserveCase(word, singular);
    }
    if (/ies$/.test(lower)) return preserveCase(word, lower.slice(0, -3) + "y");
    if (/(ches|shes|xes|zes|ses)$/.test(lower)) return preserveCase(word, lower.slice(0, -2));
    if (/s$/.test(lower) && !/(ss|us|is)$/.test(lower)) {
      return preserveCase(word, lower.slice(0, -1));
    }
    return word;
  }

  function isPluralNoun(word) {
    const lower = word.toLowerCase();
    if (Object.values(IRREGULAR_PLURAL).includes(lower)) return true;
    if (/[^aeiou]ies$/.test(lower)) return true;
    if (/(ches|shes|xes|zes|ses)$/.test(lower)) return true;
    return /s$/.test(lower) && !/(ss|us|is|news)$/.test(lower);
  }

  function checkSpelling(text) {
    const output = [];
    for (const token of tokenize(text)) {
      const replacement = SPELLING[token.lower];
      if (!replacement) continue;
      output.push(makeSuggestion({
        ruleId: "spelling-common",
        category: "Spelling",
        title: "Spelling",
        start: token.start,
        end: token.end,
        original: token.word,
        replacement: preserveCase(token.word, replacement),
        message: `Possible spelling error: “${token.word}”.`,
        severity: "error",
        confidence: 0.99
      }));
    }
    return output;
  }

  function checkCapitalization(text) {
    const output = [];
    let match;
    const sentenceStart = /(^|[.!?]\s+)([a-z])/g;
    while ((match = sentenceStart.exec(text))) {
      const start = match.index + match[1].length;
      output.push(makeSuggestion({
        ruleId: "capitalization-sentence",
        category: "Grammar",
        title: "Capitalization",
        start,
        end: start + 1,
        original: match[2],
        replacement: match[2].toUpperCase(),
        message: "Begin a sentence with a capital letter.",
        severity: "error",
        confidence: 0.98
      }));
    }
    const pronounI = /\bi\b/g;
    while ((match = pronounI.exec(text))) {
      output.push(makeSuggestion({
        ruleId: "capitalization-pronoun-i",
        category: "Grammar",
        title: "Capitalization",
        start: match.index,
        end: match.index + 1,
        original: "i",
        replacement: "I",
        message: "Capitalize the pronoun “I”.",
        severity: "error",
        confidence: 0.99
      }));
    }
    return output;
  }

  function checkPronounVerbAgreement(text) {
    const output = [];
    const rules = [
      [/\b(I)\s+(is|are)\b/gi, (m) => `${m[1]} am`, "Use “am” with the subject “I”."],
      [/\b(you|we|they)\s+(is)\b/gi, (m) => `${m[1]} are`, "Use “are” with this subject."],
      [/\b(you|we|they)\s+(was)\b/gi, (m) => `${m[1]} were`, "Use “were” with this subject."],
      [/\b(he|she|it)\s+(are)\b/gi, (m) => `${m[1]} is`, "Use “is” with a singular subject."],
      [/\b(he|she|it)\s+(were)\b/gi, (m) => `${m[1]} was`, "Use “was” with a singular subject."],
      [/\b(he|she|it)\s+(have)\b/gi, (m) => `${m[1]} has`, "Use “has” with a third-person singular subject."],
      [/\b(I|you|we|they)\s+(has)\b/gi, (m) => `${m[1]} have`, "Use “have” with this subject."],
      [/\b(he|she|it)\s+(do)\b/gi, (m) => `${m[1]} does`, "Use “does” with a third-person singular subject."],
      [/\b(I|you|we|they)\s+(does)\b/gi, (m) => `${m[1]} do`, "Use “do” with this subject."]
    ];
    for (const [regex, replacementFn, message] of rules) {
      let match;
      while ((match = regex.exec(text))) {
        addMatch(output, match, replacementFn(match), {
          ruleId: "pronoun-verb-agreement",
          category: "Grammar",
          title: "Subject-Verb Agreement",
          message,
          severity: "error",
          confidence: 0.99
        });
      }
    }

    const mainVerb = /\b(he|she|it|I|you|we|they)\s+([A-Za-z]+)\b/g;
    let match;
    while ((match = mainVerb.exec(text))) {
      const subject = match[1].toLowerCase();
      const verb = match[2];
      const lowerVerb = verb.toLowerCase();
      if (MODALS.has(lowerVerb) || ["is", "are", "am", "was", "were", "has", "have", "do", "does", "did"].includes(lowerVerb)) continue;
      const base = baseForm(lowerVerb);
      if (!VERBS[base]) continue;
      const singular = ["he", "she", "it"].includes(subject);
      const expected = singular ? thirdPerson(base) : base;
      if (lowerVerb !== expected) {
        const verbStart = match.index + match[0].lastIndexOf(match[2]);
        output.push(makeSuggestion({
          ruleId: "pronoun-main-verb",
          category: "Grammar",
          title: "Subject-Verb Agreement",
          start: verbStart,
          end: verbStart + verb.length,
          original: verb,
          replacement: preserveCase(verb, expected),
          message: singular
            ? "A third-person singular subject normally takes a verb ending in -s or -es."
            : "Use the base verb form with I, you, we, or they.",
          severity: "error",
          confidence: 0.95
        }));
      }
    }
    return output;
  }

  function checkDeterminerNounAgreement(text) {
    const output = [];
    const regex = /\b(this|that|these|those|each|every|either|neither|many|several|few|both|various|numerous)\s+([A-Za-z]+)\b/gi;
    let match;
    while ((match = regex.exec(text))) {
      const determiner = match[1].toLowerCase();
      const noun = match[2];
      const plural = isPluralNoun(noun);
      const requiresSingular = ["this", "that", "each", "every", "either", "neither"].includes(determiner);
      const requiresPlural = ["these", "those", "many", "several", "few", "both", "various", "numerous"].includes(determiner);
      if (requiresSingular && plural) {
        addMatch(output, match, `${match[1]} ${singularize(noun)}`, {
          ruleId: "determiner-singular-noun",
          category: "Grammar",
          title: "Noun Number Agreement",
          message: `“${match[1]}” normally requires a singular count noun.`,
          severity: "error",
          confidence: 0.97
        });
      } else if (requiresPlural && !plural && !UNCOUNTABLE.has(noun.toLowerCase())) {
        addMatch(output, match, `${match[1]} ${pluralize(noun)}`, {
          ruleId: "determiner-plural-noun",
          category: "Grammar",
          title: "Noun Number Agreement",
          message: `“${match[1]}” normally requires a plural count noun.`,
          severity: "error",
          confidence: 0.96
        });
      }
    }
    return output;
  }

  function checkNumberNounAgreement(text) {
    const output = [];
    const regex = /\b(\d+(?:\.\d+)?)\s+([A-Za-z]+)\b/g;
    let match;
    while ((match = regex.exec(text))) {
      const value = Number(match[1]);
      const noun = match[2];
      if (/^(percent|year|month|day|hour|minute|second|am|pm)$/i.test(noun)) continue;
      const plural = isPluralNoun(noun);
      if (value === 1 && plural) {
        addMatch(output, match, `${match[1]} ${singularize(noun)}`, {
          ruleId: "number-singular-noun",
          category: "Grammar",
          title: "Number and Noun Agreement",
          message: "The number 1 normally requires a singular count noun.",
          severity: "error",
          confidence: 0.98
        });
      } else if (value !== 1 && !plural && !UNCOUNTABLE.has(noun.toLowerCase())) {
        addMatch(output, match, `${match[1]} ${pluralize(noun)}`, {
          ruleId: "number-plural-noun",
          category: "Grammar",
          title: "Number and Noun Agreement",
          message: "Zero and numbers greater than 1 normally require a plural count noun.",
          severity: "error",
          confidence: 0.97
        });
      }
    }
    return output;
  }

  function checkSpecialAgreement(text) {
    const output = [];
    const rules = [
      [/\ba number of\s+([A-Za-z]+)\s+(is|was|has|does)\b/gi,
        (m) => m[0].replace(m[2], { is: "are", was: "were", has: "have", does: "do" }[m[2].toLowerCase()]),
        "“A number of” takes a plural verb."],
      [/\bthe number of\s+([A-Za-z]+)\s+(are|were|have|do)\b/gi,
        (m) => m[0].replace(m[2], { are: "is", were: "was", have: "has", do: "does" }[m[2].toLowerCase()]),
        "“The number of” takes a singular verb."],
      [/\bthere\s+(is|was|has)\s+(many|several|few|two|three|four|five|six|seven|eight|nine|ten)\s+([A-Za-z]+)\b/gi,
        (m) => m[0].replace(m[1], { is: "are", was: "were", has: "have" }[m[1].toLowerCase()]),
        "In a “there” construction, the verb agrees with the following plural noun phrase."]
    ];
    for (const [regex, replacementFn, message] of rules) {
      let match;
      while ((match = regex.exec(text))) {
        addMatch(output, match, replacementFn(match), {
          ruleId: "special-subject-verb-agreement",
          category: "Grammar",
          title: "Subject-Verb Agreement",
          message,
          severity: "error",
          confidence: 0.98
        });
      }
    }
    return output;
  }

  function checkArticles(text) {
    const output = [];
    const regex = /\b(a|an)\s+([A-Za-z]+)\b/gi;
    let match;
    while ((match = regex.exec(text))) {
      const word = match[2].toLowerCase();
      const silentH = /^(hour|honest|honor|heir)/.test(word);
      const consonantSound = /^(uni|use|user|euro|one)/.test(word);
      const needsAn = silentH || (!consonantSound && /^[aeiou]/.test(word));
      const expected = needsAn ? "an" : "a";
      if (match[1].toLowerCase() !== expected) {
        addMatch(output, match, `${preserveCase(match[1], expected)} ${match[2]}`, {
          ruleId: "article-a-an",
          category: "Grammar",
          title: "Article",
          message: `Use “${expected}” according to the initial sound of the next word.`,
          severity: "warning",
          confidence: 0.92
        });
      }
    }
    return output;
  }

  function checkVerbForms(text) {
    const output = [];
    let match;
    const modal = /\b(can|could|may|might|must|shall|should|will|would)\s+([A-Za-z]+)\b/gi;
    while ((match = modal.exec(text))) {
      const base = baseForm(match[2]);
      if (base !== match[2].toLowerCase()) {
        addMatch(output, match, `${match[1]} ${base}`, {
          ruleId: "modal-base-verb",
          category: "Grammar",
          title: "Verb Form",
          message: "A modal verb is followed by the base form of the verb.",
          severity: "error",
          confidence: 0.96
        });
      }
    }
    const doForm = /\b(do|does|did|don't|doesn't|didn't)\s+([A-Za-z]+)\b/gi;
    while ((match = doForm.exec(text))) {
      const base = baseForm(match[2]);
      if (base !== match[2].toLowerCase() && match[2].toLowerCase() !== "not") {
        addMatch(output, match, `${match[1]} ${base}`, {
          ruleId: "do-base-verb",
          category: "Grammar",
          title: "Verb Form",
          message: "Use the base verb after do, does, or did.",
          severity: "error",
          confidence: 0.96
        });
      }
    }
    return output;
  }

  function checkCommonUsage(text) {
    const output = [];
    const rules = [
      [/\bI am agree\b/gi, "I agree", "Use “agree” directly rather than “am agree”."],
      [/\bdiscuss about\b/gi, "discuss", "“Discuss” normally takes its object directly."],
      [/\breturn back\b/gi, "return", "“Return” already expresses going back."],
      [/\bmore better\b/gi, "better", "Do not use “more” with “better”."],
      [/\bmore worse\b/gi, "worse", "Do not use “more” with “worse”."],
      [/\bmost best\b/gi, "best", "Do not use “most” with “best”."],
      [/\binformations\b/gi, "information", "“Information” is normally uncountable."],
      [/\badvices\b/gi, "advice", "“Advice” is normally uncountable."],
      [/\bequipments\b/gi, "equipment", "“Equipment” is normally uncountable."],
      [/\bshould of\b/gi, "should have", "Use “should have”."],
      [/\bcould of\b/gi, "could have", "Use “could have”."],
      [/\bwould of\b/gi, "would have", "Use “would have”."],
      [/\bbetween you and i\b/gi, "between you and me", "Use the object pronoun after a preposition."],
      [/\benjoy to ([A-Za-z]+)\b/gi, (m) => `enjoy ${m[1]}ing`, "“Enjoy” is normally followed by a gerund."],
      [/\bwant ([A-Za-z]+ing)\b/gi, (m) => `want to ${m[1].replace(/ing$/i, "")}`, "“Want” is normally followed by “to” plus the base verb."]
    ];
    for (const [regex, replacement, message] of rules) {
      let match;
      while ((match = regex.exec(text))) {
        addMatch(output, match, typeof replacement === "function" ? replacement(match) : replacement, {
          ruleId: "common-usage",
          category: "Grammar",
          title: "Common Usage",
          message,
          severity: "error",
          confidence: 0.96
        });
      }
    }
    return output;
  }

  function checkPunctuation(text) {
    const output = [];
    let match;
    const repeatedSpaces = / {2,}/g;
    while ((match = repeatedSpaces.exec(text))) {
      addMatch(output, match, " ", {
        ruleId: "spacing-repeated",
        category: "Punctuation",
        title: "Spacing",
        message: "Use one space between words.",
        severity: "warning",
        confidence: 0.99
      });
    }
    const beforePunctuation = /\s+([,.!?;:])/g;
    while ((match = beforePunctuation.exec(text))) {
      addMatch(output, match, match[1], {
        ruleId: "spacing-before-punctuation",
        category: "Punctuation",
        title: "Punctuation",
        message: "Do not place a space before punctuation.",
        severity: "warning",
        confidence: 0.99
      });
    }
    const afterPunctuation = /([,.!?;:])([A-Za-z])/g;
    while ((match = afterPunctuation.exec(text))) {
      addMatch(output, match, `${match[1]} ${match[2]}`, {
        ruleId: "spacing-after-punctuation",
        category: "Punctuation",
        title: "Punctuation",
        message: "Add a space after punctuation when another word follows.",
        severity: "warning",
        confidence: 0.98
      });
    }
    const repeatedPunctuation = /([!?.,])\1{1,}/g;
    while ((match = repeatedPunctuation.exec(text))) {
      addMatch(output, match, match[1], {
        ruleId: "punctuation-repeated",
        category: "Punctuation",
        title: "Repeated Punctuation",
        message: "Consider using a single punctuation mark in formal writing.",
        severity: "warning",
        confidence: 0.9
      });
    }
    return output;
  }

  function checkClarityAndVocabulary(text) {
    const output = [];
    const rules = [
      [/\ba lot of\b/gi, "many", "Consider “many” for a more concise expression."],
      [/\bin order to\b/gi, "to", "“To” is usually sufficient."],
      [/\bdue to the fact that\b/gi, "because", "“Because” is clearer and more concise."],
      [/\bat this point in time\b/gi, "currently", "Use a more direct time expression."],
      [/\bmake a decision\b/gi, "decide", "Use the direct verb “decide”."],
      [/\bvery unique\b/gi, "unique", "“Unique” usually does not need an intensifier."],
      [/\bcompletely unanimous\b/gi, "unanimous", "“Unanimous” already means complete agreement."],
      [/\bpersonal opinion\b/gi, "opinion", "An opinion is already personal."],
      [/\badvance planning\b/gi, "planning", "Planning normally happens in advance."],
      [/\bfuture plans\b/gi, "plans", "Plans normally concern the future."]
    ];
    for (const [regex, replacement, message] of rules) {
      let match;
      while ((match = regex.exec(text))) {
        addMatch(output, match, replacement, {
          ruleId: "clarity-wordiness",
          category: "Vocabulary",
          title: "Clarity",
          message,
          severity: "suggestion",
          confidence: 0.9
        });
      }
    }
    return output;
  }

  function checkSentenceStyle(text) {
    const output = [];
    const sentenceRegex = /[^.!?\n]+[.!?]?/g;
    let match;
    while ((match = sentenceRegex.exec(text))) {
      const raw = match[0];
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const words = trimmed.match(/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g) || [];
      if (words.length > 35) {
        const leading = raw.search(/\S/);
        output.push(makeSuggestion({
          ruleId: "sentence-long",
          category: "Style",
          title: "Long Sentence",
          start: match.index + Math.max(0, leading),
          end: match.index + raw.length,
          original: trimmed,
          replacement: "",
          message: "This sentence is long. Consider dividing it into shorter sentences.",
          severity: "suggestion",
          confidence: 0.82
        }));
      }
    }
    return output;
  }

  function finalize(suggestions) {
    const unique = [];
    const seen = new Set();
    for (const suggestion of suggestions) {
      if (!Number.isFinite(suggestion.start) || !Number.isFinite(suggestion.end)) continue;
      if (suggestion.start < 0 || suggestion.end <= suggestion.start) continue;
      const key = [suggestion.start, suggestion.end, suggestion.original, suggestion.replacement, suggestion.ruleId].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(suggestion);
    }
    unique.sort((a, b) => a.start - b.start || b.confidence - a.confidence);
    const kept = [];
    for (const suggestion of unique) {
      const overlap = kept.find((item) => suggestion.start < item.end && suggestion.end > item.start);
      if (!overlap) {
        kept.push(suggestion);
      } else if (suggestion.confidence > overlap.confidence + 0.04) {
        kept[kept.indexOf(overlap)] = suggestion;
      }
    }
    return kept.sort((a, b) => a.start - b.start);
  }

  function analyze(text) {
    const value = String(text || "");
    if (!value.trim()) return [];
    const checkers = [
      checkSpelling,
      checkCapitalization,
      checkPronounVerbAgreement,
      checkDeterminerNounAgreement,
      checkNumberNounAgreement,
      checkSpecialAgreement,
      checkArticles,
      checkVerbForms,
      checkCommonUsage,
      checkPunctuation,
      checkClarityAndVocabulary,
      checkSentenceStyle
    ];
    const suggestions = [];
    for (const checker of checkers) {
      try {
        suggestions.push(...checker(value));
      } catch (error) {
        console.error(`Proofline grammar rule failed: ${checker.name}`, error);
      }
    }
    return finalize(suggestions);
  }

  function analyzePOS(text) {
    return tokenize(String(text || "")).map((token) => {
      let pos = "word";
      if (MODALS.has(token.lower)) pos = "modal";
      else if (["is", "are", "am", "was", "were", "has", "have", "do", "does", "did"].includes(token.lower)) pos = "auxiliary";
      else if (/ly$/.test(token.lower)) pos = "adverb";
      else if (/(ing|ed)$/.test(token.lower)) pos = "verb/participle";
      else if (/(ous|ful|less|able|ive|al|ic)$/.test(token.lower)) pos = "adjective";
      else if (/^(a|an|the|this|that|these|those)$/.test(token.lower)) pos = "determiner";
      else if (/^(he|she|it|they|we|you|i|me|him|her|us|them)$/.test(token.lower)) pos = "pronoun";
      else if (/^(in|on|at|by|for|from|with|to|of|about|under|over|between|into|through)$/.test(token.lower)) pos = "preposition";
      else if (/^(and|but|or|nor|so|yet|because|although|while|if|when)$/.test(token.lower)) pos = "conjunction";
      return { word: token.word, pos, start: token.start, end: token.end };
    });
  }

  function analyzeDocument(text) {
    const value = String(text || "");
    const suggestions = analyze(value);
    const wordCount = tokenize(value).length;
    const sentenceCount = (value.match(/[.!?]+(?:\s|$)/g) || []).length || (value.trim() ? 1 : 0);
    const paragraphCount = value.split(/\n\s*\n/).filter((part) => part.trim()).length;
    const errors = suggestions.filter((item) => item.severity === "error").length;
    const warnings = suggestions.filter((item) => item.severity === "warning").length;
    const advisory = suggestions.filter((item) => item.severity === "suggestion").length;
    const penalty = errors * 4 + warnings * 1.7 + advisory * 0.6;
    const score = Math.max(0, Math.min(100, Math.round(100 - (penalty / Math.max(1, wordCount)) * 25)));
    return {
      suggestions,
      score,
      words: wordCount,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      readingTime: Math.ceil((wordCount / 200) * 60),
      errors,
      warnings,
      errorCount: errors,
      warningCount: warnings,
      pos: analyzePOS(value)
    };
  }

  global.GrammarEngine = {
    version: "4.0.0",
    analyze,
    analyzeDocument,
    analyzePOS,
    baseForm,
    thirdPerson,
    rules: [
      "spelling-common", "capitalization-sentence", "capitalization-pronoun-i",
      "pronoun-verb-agreement", "pronoun-main-verb", "determiner-singular-noun",
      "determiner-plural-noun", "number-singular-noun", "number-plural-noun",
      "special-subject-verb-agreement", "article-a-an", "modal-base-verb",
      "do-base-verb", "common-usage", "spacing-repeated",
      "spacing-before-punctuation", "spacing-after-punctuation",
      "punctuation-repeated", "clarity-wordiness", "sentence-long"
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
