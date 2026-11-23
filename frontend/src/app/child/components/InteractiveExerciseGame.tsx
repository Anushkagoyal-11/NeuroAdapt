"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Trophy,
  Target,
  Brain,
  Lightbulb,
  Puzzle,
  RotateCcw,
  Check,
  Zap,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  XCircle,
  Volume2,
  BookOpen,
  Mic,
  Activity,
  Shuffle,
  Smile,
} from "lucide-react";
import VoiceMemoryGame from "./VoiceMemoryGame";

export interface ExercisePlayConfig {
  exerciseId: number;
  exerciseName: string;
  pathway?: string;
  domain: string;
  difficulty: number;
  assignmentId?: number | null;
  notes?: string;
}

interface InteractiveGameProps {
  config: ExercisePlayConfig;
  childId: number;
  apiUrl: string;
  onClose: () => void;
  onComplete: (result: { score: number; accuracy: number; nextDifficulty: number }) => void;
}

export default function InteractiveExerciseGame({
  config,
  childId,
  apiUrl,
  onClose,
  onComplete,
}: InteractiveGameProps) {
  const [currentDiff, setCurrentDiff] = useState<number>(Math.max(1, Math.min(10, config.difficulty || 1)));
  const diff = currentDiff;

  // Delegate Voice Recall challenge directly to VoiceMemoryGame
  if (config.exerciseName.toLowerCase().includes("voice recall") || config.exerciseId === 99) {
    return (
      <VoiceMemoryGame
        config={{ ...config, difficulty: diff }}
        childId={childId}
        apiUrl={apiUrl}
        onClose={onClose}
        onComplete={() => {
          onComplete({ score: 180, accuracy: 80, nextDifficulty: diff });
        }}
      />
    );
  }

  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const startTimeRef = useRef<number>(0);
  const [round, setRound] = useState(1);
  const totalRounds = diff >= 6 ? 5 : diff >= 3 ? 4 : 3;

  /* ───── 1. ATTENTION GAME STATE ───── */
  const [targetSymbols, setTargetSymbols] = useState<string[]>([]);
  const [gridTiles, setGridTiles] = useState<
    Array<{ id: number; symbol: string; status: "normal" | "correct" | "wrong" }>
  >([]);

  /* ───── 2. MEMORY GAME STATE ───── */
  const [memoryCards, setMemoryCards] = useState<
    Array<{ id: number; symbol: string; flipped: boolean; matched: boolean; status?: "normal" | "wrong" | "correct" }>
  >([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  /* ───── 3. MULTI-CHOICE / QUESTION GAME STATE (Sequencing, Dyslexia, Speech) ───── */
  const [quizQuestion, setQuizQuestion] = useState<{
    prompt: string;
    subPrompt?: string;
    icon?: string;
    audioText?: string;
    sequence?: string[];
    options: Array<{ id: string; label: string; icon?: string }>;
    correctId: string;
  }>({
    prompt: "",
    options: [],
    correctId: "",
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isOptionLocked, setIsOptionLocked] = useState(false);

  /* ───── 4. WORD / STEP BUILDER STATE (Spelling & Sentence Building) ───── */
  const [scrambledItems, setScrambledItems] = useState<Array<{ id: number; text: string; used: boolean }>>([]);
  const [builtItems, setBuiltItems] = useState<Array<{ id: number; text: string }>>([]);
  const [targetSentence, setTargetSentence] = useState<string[]>([]);

  // Start the game
  const startExercise = (overrideDiff?: number) => {
    const activeD = overrideDiff || currentDiff;
    if (overrideDiff) setCurrentDiff(overrideDiff);

    setGameState("playing");
    setScore(0);
    setErrors(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setRound(1);
    startTimeRef.current = Date.now();

    initRound(1);
  };

  const playTTS = (textToSpeak: string) => {
    if (!textToSpeak) return;
    try {
      const audio = new Audio(`${apiUrl}/api/voice/tts?text=${encodeURIComponent(textToSpeak)}`);
      audio.play().catch(() => {
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(textToSpeak);
          window.speechSynthesis.speak(u);
        }
      });
    } catch {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const initRound = (r: number) => {
    setIsOptionLocked(false);
    setSelectedOption(null);
    setBuiltItems([]);

    const d = config.domain.toLowerCase();

    if (d === "attention") {
      initAttentionRound(r);
    } else if (d === "working_memory" || d === "memory") {
      initMemoryGame();
    } else if (d === "sequencing") {
      initSequencingRound(r);
    } else if (d === "cognitive_flexibility") {
      initFlexibilityRound(r);
    } else if (d === "letter_recognition") {
      initLetterRecognitionRound(r);
    } else if (d === "phonological") {
      initPhonologicalRound(r);
    } else if (d === "word_recognition") {
      initWordRecognitionRound(r);
    } else if (d === "spelling") {
      initSpellingRound(r);
    } else if (d === "reading_comprehension") {
      initReadingComprehensionRound(r);
    } else if (d === "vocabulary") {
      initVocabularyRound(r);
    } else if (d === "sentence_construction") {
      initSentenceRound(r);
    } else if (d === "listening_comprehension") {
      initListeningRound(r);
    } else if (d === "speech_sound") {
      initSpeechSoundRound(r);
    } else {
      initGenericRound(r);
    }
  };

  /* ─────────────────── A. ATTENTION ─────────────────── */
  const initAttentionRound = (r: number) => {
    let pool = ["⭐", "🔷", "🟢", "🔺", "🔶", "🟣", "🌙", "⚡", "❤️", "🍀", "💎", "🔥"];
    const numTargets = diff >= 5 ? 2 : 1;
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const chosenTargets = shuffledPool.slice(0, numTargets);
    setTargetSymbols(chosenTargets);

    const totalTiles = diff >= 7 ? 25 : diff >= 4 ? 16 : 9;
    const targetCopies = diff >= 5 ? 3 : 2;

    const tiles: Array<{ id: number; symbol: string; status: "normal" | "correct" | "wrong" }> = [];
    let idCounter = 0;

    for (const t of chosenTargets) {
      for (let i = 0; i < targetCopies; i++) {
        tiles.push({ id: idCounter++, symbol: t, status: "normal" });
      }
    }

    const distractors = pool.filter((s) => !chosenTargets.includes(s));
    while (tiles.length < totalTiles) {
      const dist = distractors[Math.floor(Math.random() * distractors.length)] || "🔷";
      tiles.push({ id: idCounter++, symbol: dist, status: "normal" });
    }

    setGridTiles(tiles.sort(() => Math.random() - 0.5));
  };

  const handleAttentionTileClick = (index: number) => {
    const tile = gridTiles[index];
    if (tile.status === "correct") return;

    setTotalAttempts((prev) => prev + 1);
    const isTarget = targetSymbols.includes(tile.symbol);

    const newTiles = [...gridTiles];
    if (isTarget) {
      newTiles[index] = { ...tile, status: "correct" };
      setGridTiles(newTiles);
      setCorrectCount((prev) => prev + 1);
      const earned = 20 * diff;
      setScore((prev) => prev + earned);

      const remainingTargets = newTiles.filter(
        (t) => targetSymbols.includes(t.symbol) && t.status !== "correct"
      ).length;

      if (remainingTargets === 0) {
        if (round >= totalRounds) {
          finishExercise(correctCount + 1, errors, score + earned);
        } else {
          setTimeout(() => {
            setRound((prevR) => prevR + 1);
            initRound(round + 1);
          }, 400);
        }
      }
    } else {
      newTiles[index] = { ...tile, status: "wrong" };
      setGridTiles(newTiles);
      setErrors((prev) => prev + 1);

      setTimeout(() => {
        setGridTiles((curr) =>
          curr.map((t, idx) => (idx === index && t.status === "wrong" ? { ...t, status: "normal" } : t))
        );
      }, 600);
    }
  };

  /* ─────────────────── B. MEMORY FLIP ─────────────────── */
  const initMemoryGame = () => {
    const pool =
      diff <= 3
        ? ["🐶", "🐱", "🐰", "🐼", "🦊"]
        : diff <= 6
        ? ["🚀", "🛸", "🚁", "🏎️", "🚂", "⛵", "🎨"]
        : ["🪐", "🌌", "☄️", "🔭", "🛰️", "💎", "🔮", "👑"];

    const pairCount = diff <= 2 ? 3 : diff <= 5 ? 4 : 6;
    const selected = pool.slice(0, pairCount);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({ id: idx, symbol: sym, flipped: false, matched: false, status: "normal" as const }));

    setMemoryCards(deck);
    setFlippedIndices([]);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || memoryCards[index].flipped || memoryCards[index].matched) {
      return;
    }

    const newCards = [...memoryCards];
    newCards[index].flipped = true;
    const newFlipped = [...flippedIndices, index];
    setMemoryCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setTotalAttempts((prev) => prev + 1);
      const [idx1, idx2] = newFlipped;
      if (newCards[idx1].symbol === newCards[idx2].symbol) {
        newCards[idx1].matched = true;
        newCards[idx2].matched = true;
        newCards[idx1].status = "correct";
        newCards[idx2].status = "correct";
        setCorrectCount((prev) => prev + 1);
        const earned = 25 * diff;
        setScore((prev) => prev + earned);
        setFlippedIndices([]);

        if (newCards.every((c) => c.matched)) {
          if (round >= totalRounds) {
            finishExercise(correctCount + 1, errors, score + earned);
          } else {
            setTimeout(() => {
              setRound((r) => r + 1);
              initMemoryGame();
            }, 500);
          }
        }
      } else {
        newCards[idx1].status = "wrong";
        newCards[idx2].status = "wrong";
        setErrors((prev) => prev + 1);
        setMemoryCards([...newCards]);

        setTimeout(() => {
          newCards[idx1].flipped = false;
          newCards[idx2].flipped = false;
          newCards[idx1].status = "normal";
          newCards[idx2].status = "normal";
          setMemoryCards([...newCards]);
          setFlippedIndices([]);
        }, 750);
      }
    }
  };

  /* ─────────────────── C. SEQUENCING (ADHD) ─────────────────── */
  const initSequencingRound = (r: number) => {
    const sequences = [
      {
        prompt: "What comes NEXT in this daily morning routine?",
        sequence: ["🌅 Wake Up", "🪥 Brush Teeth", "🍳 Eat Breakfast"],
        options: [
          { id: "school", label: "🎒 Pack Bag for School", icon: "🎒" },
          { id: "sleep", label: "🛌 Go to Sleep", icon: "🛌" },
          { id: "dinner", label: "🍲 Eat Dinner", icon: "🍲" },
        ],
        correctId: "school",
      },
      {
        prompt: "Complete the logical counting step:",
        sequence: ["2️⃣", "4️⃣", "6️⃣", "8️⃣"],
        options: [
          { id: "10", label: "🔟 Ten", icon: "🔟" },
          { id: "9", label: "9️⃣ Nine", icon: "9️⃣" },
          { id: "7", label: "7️⃣ Seven", icon: "7️⃣" },
        ],
        correctId: "10",
      },
      {
        prompt: "How does a plant grow? What step comes after sprouting?",
        sequence: ["🌰 Seed Planted", "🌱 Sprout Appears"],
        options: [
          { id: "flower", label: "🌻 Leaves & Bloom Grow", icon: "🌻" },
          { id: "seed", label: "🌰 Seed goes back in packet", icon: "🌰" },
          { id: "snow", label: "❄️ Snow falls inside soil", icon: "❄️" },
        ],
        correctId: "flower",
      },
      {
        prompt: "Complete the repeating pattern:",
        sequence: ["🔴", "🔵", "🟡", "🔴", "🔵"],
        options: [
          { id: "yellow", label: "🟡 Yellow Circle", icon: "🟡" },
          { id: "blue", label: "🔵 Blue Circle", icon: "🔵" },
          { id: "red", label: "🔴 Red Circle", icon: "🔴" },
        ],
        correctId: "yellow",
      },
    ];

    const q = sequences[(r - 1) % sequences.length];
    setQuizQuestion({
      prompt: q.prompt,
      sequence: q.sequence,
      options: [...q.options].sort(() => Math.random() - 0.5),
      correctId: q.correctId,
    });
  };

  /* ─────────────────── D. COGNITIVE FLEXIBILITY (ADHD) ─────────────────── */
  const initFlexibilityRound = (r: number) => {
    const activeRule = r % 2 === 1 ? "COLOR" : "SHAPE";
    const rulePrompt = `ACTIVE RULE: Match by ${activeRule}!`;

    const questions = [
      {
        target: "🔵 Blue Square",
        rule: "COLOR",
        options: [
          { id: "c1", label: "🔵 Blue Circle", icon: "🔵" },
          { id: "w1", label: "🟥 Red Square", icon: "🟥" },
          { id: "w2", label: "🟡 Yellow Triangle", icon: "🟡" },
        ],
        correctId: "c1",
      },
      {
        target: "⭐ Yellow Star",
        rule: "SHAPE",
        options: [
          { id: "c2", label: "⭐ Blue Star", icon: "⭐" },
          { id: "w3", label: "🟡 Yellow Circle", icon: "🟡" },
          { id: "w4", label: "🟩 Green Square", icon: "🟩" },
        ],
        correctId: "c2",
      },
      {
        target: "🟥 Red Circle",
        rule: "COLOR",
        options: [
          { id: "c3", label: "🟥 Red Triangle", icon: "🔺" },
          { id: "w5", label: "🔵 Blue Circle", icon: "🔵" },
          { id: "w6", label: "🟩 Green Circle", icon: "🟢" },
        ],
        correctId: "c3",
      },
      {
        target: "🔺 Green Triangle",
        rule: "SHAPE",
        options: [
          { id: "c4", label: "🔺 Red Triangle", icon: "🔺" },
          { id: "w7", label: "🟩 Green Square", icon: "🟩" },
          { id: "w8", label: "🟡 Yellow Star", icon: "⭐" },
        ],
        correctId: "c4",
      },
    ];

    const item = questions[(r - 1) % questions.length];
    setQuizQuestion({
      prompt: rulePrompt,
      subPrompt: `Target Card: ${item.target}`,
      options: [...item.options].sort(() => Math.random() - 0.5),
      correctId: item.correctId,
    });
  };

  /* ─────────────────── E. LETTER RECOGNITION (DYSLEXIA) ─────────────────── */
  const initLetterRecognitionRound = (r: number) => {
    const tasks = [
      {
        prompt: "Find the letter that matches lowercase 'b' (not d, p, or q):",
        subPrompt: "Look carefully at the circle and stick orientation!",
        audioText: "Find the letter b",
        options: [
          { id: "b", label: "b", icon: "🔤" },
          { id: "d", label: "d", icon: "🔤" },
          { id: "p", label: "p", icon: "🔤" },
          { id: "q", label: "q", icon: "🔤" },
        ],
        correctId: "b",
      },
      {
        prompt: "Which letter is the lowercase 'd'?",
        subPrompt: "The round belly points to the left!",
        audioText: "Which letter is d?",
        options: [
          { id: "d", label: "d", icon: "🔤" },
          { id: "b", label: "b", icon: "🔤" },
          { id: "q", label: "q", icon: "🔤" },
          { id: "p", label: "p", icon: "🔤" },
        ],
        correctId: "d",
      },
      {
        prompt: "Spot the letter 'p':",
        subPrompt: "The stick goes down below the line on the left!",
        audioText: "Spot the letter p",
        options: [
          { id: "p", label: "p", icon: "🔤" },
          { id: "q", label: "q", icon: "🔤" },
          { id: "b", label: "b", icon: "🔤" },
          { id: "d", label: "d", icon: "🔤" },
        ],
        correctId: "p",
      },
    ];

    const t = tasks[(r - 1) % tasks.length];
    setQuizQuestion({
      prompt: t.prompt,
      subPrompt: t.subPrompt,
      audioText: t.audioText,
      options: [...t.options].sort(() => Math.random() - 0.5),
      correctId: t.correctId,
    });
  };

  /* ─────────────────── F. PHONOLOGICAL AWARENESS (DYSLEXIA) ─────────────────── */
  const initPhonologicalRound = (r: number) => {
    const rhymeList = [
      {
        prompt: "Which word RHYMES with 'CAT'?",
        subPrompt: "Sounds like -at at the end",
        audioText: "Which word rhymes with cat?",
        options: [
          { id: "hat", label: "🎩 HAT", icon: "🎩" },
          { id: "dog", label: "🐶 DOG", icon: "🐶" },
          { id: "sun", label: "☀️ SUN", icon: "☀️" },
        ],
        correctId: "hat",
      },
      {
        prompt: "Which word starts with the 'SH' sound?",
        subPrompt: "Listen for 'shhh' like quiet",
        audioText: "Which word starts with sh?",
        options: [
          { id: "ship", label: "🚢 SHIP", icon: "🚢" },
          { id: "chip", label: "🍪 CHIP", icon: "🍪" },
          { id: "tip", label: "✏️ TIP", icon: "✏️" },
        ],
        correctId: "ship",
      },
      {
        prompt: "Which word RHYMES with 'SUN'?",
        subPrompt: "Listen for the -un sound",
        audioText: "Which word rhymes with sun?",
        options: [
          { id: "run", label: "🏃 RUN", icon: "🏃" },
          { id: "sit", label: "🪑 SIT", icon: "🪑" },
          { id: "pan", label: "🍳 PAN", icon: "🍳" },
        ],
        correctId: "run",
      },
    ];

    const item = rhymeList[(r - 1) % rhymeList.length];
    setQuizQuestion({
      prompt: item.prompt,
      subPrompt: item.subPrompt,
      audioText: item.audioText,
      options: [...item.options].sort(() => Math.random() - 0.5),
      correctId: item.correctId,
    });
  };

  /* ─────────────────── G. WORD RECOGNITION (DYSLEXIA) ─────────────────── */
  const initWordRecognitionRound = (r: number) => {
    const sightWords = [
      {
        prompt: "Find the sight word: 'THE'",
        subPrompt: "Most common reading helper word",
        audioText: "Find the word the",
        options: [
          { id: "the", label: "the", icon: "📖" },
          { id: "that", label: "that", icon: "📖" },
          { id: "they", label: "they", icon: "📖" },
        ],
        correctId: "the",
      },
      {
        prompt: "Find the sight word: 'PLAY'",
        subPrompt: "P - L - A - Y",
        audioText: "Find the word play",
        options: [
          { id: "play", label: "play", icon: "⚽" },
          { id: "plan", label: "plan", icon: "📋" },
          { id: "pray", label: "pray", icon: "🙏" },
        ],
        correctId: "play",
      },
      {
        prompt: "Find the sight word: 'LOOK'",
        subPrompt: "L - O - O - K with eyes",
        audioText: "Find the word look",
        options: [
          { id: "look", label: "look", icon: "👀" },
          { id: "lock", label: "lock", icon: "🔒" },
          { id: "took", label: "took", icon: "🤲" },
        ],
        correctId: "look",
      },
    ];

    const w = sightWords[(r - 1) % sightWords.length];
    setQuizQuestion({
      prompt: w.prompt,
      subPrompt: w.subPrompt,
      audioText: w.audioText,
      options: [...w.options].sort(() => Math.random() - 0.5),
      correctId: w.correctId,
    });
  };

  /* ─────────────────── H. SPELLING & WORD SCRAMBLE (DYSLEXIA) ─────────────────── */
  const initSpellingRound = (r: number) => {
    const wordList = [
      { word: "SUN", icon: "☀️", letters: ["S", "U", "N"] },
      { word: "CAT", icon: "🐱", letters: ["C", "A", "T"] },
      { word: "DOG", icon: "🐶", letters: ["D", "O", "G"] },
      { word: "FISH", icon: "🐟", letters: ["F", "I", "S", "H"] },
    ];

    const target = wordList[(r - 1) % wordList.length];
    setTargetSentence(target.letters);
    setQuizQuestion({
      prompt: `Spell the word for this picture: ${target.icon}`,
      subPrompt: "Tap the letters in the correct order to spell the word!",
      audioText: `Spell ${target.word}`,
      options: [],
      correctId: target.word,
    });

    const scrambled = [...target.letters]
      .sort(() => Math.random() - 0.5)
      .map((l, idx) => ({ id: idx, text: l, used: false }));
    setScrambledItems(scrambled);
    setBuiltItems([]);
  };

  /* ─────────────────── I. READING COMPREHENSION (DYSLEXIA) ─────────────────── */
  const initReadingComprehensionRound = (r: number) => {
    const stories = [
      {
        passage: "Sam has a friendly dog named Buster. Buster loves chasing yellow balls in the sunny park.",
        prompt: "What color is the ball that Buster loves chasing?",
        options: [
          { id: "yellow", label: "🟡 Yellow", icon: "🟡" },
          { id: "blue", label: "🔵 Blue", icon: "🔵" },
          { id: "red", label: "🔴 Red", icon: "🔴" },
        ],
        correctId: "yellow",
      },
      {
        passage: "Maya loves reading books under the big oak tree. She listens to birds singing in the branches.",
        prompt: "Where does Maya enjoy reading books?",
        options: [
          { id: "tree", label: "🌳 Under the big oak tree", icon: "🌳" },
          { id: "bus", label: "🚌 Inside the school bus", icon: "🚌" },
          { id: "kitchen", label: "🍳 In the kitchen", icon: "🍳" },
        ],
        correctId: "tree",
      },
    ];

    const s = stories[(r - 1) % stories.length];
    setQuizQuestion({
      prompt: s.prompt,
      subPrompt: `📖 Story Passage: "${s.passage}"`,
      audioText: s.passage,
      options: [...s.options].sort(() => Math.random() - 0.5),
      correctId: s.correctId,
    });
  };

  /* ─────────────────── J. VOCABULARY (SPEECH) ─────────────────── */
  const initVocabularyRound = (r: number) => {
    const vocabTasks = [
      {
        prompt: "Which one of these belongs to the 'FRUIT' category?",
        subPrompt: "Something delicious, sweet, and healthy to eat!",
        audioText: "Which one belongs to the fruit category?",
        options: [
          { id: "apple", label: "🍎 Red Apple", icon: "🍎" },
          { id: "bus", label: "🚌 School Bus", icon: "🚌" },
          { id: "chair", label: "🪑 Wooden Chair", icon: "🪑" },
        ],
        correctId: "apple",
      },
      {
        prompt: "Which animal says 'WOOF'?",
        subPrompt: "A loyal family pet with four legs and a wagging tail",
        audioText: "Which animal says woof?",
        options: [
          { id: "dog", label: "🐶 Dog", icon: "🐶" },
          { id: "cat", label: "🐱 Cat", icon: "🐱" },
          { id: "duck", label: "🦆 Duck", icon: "🦆" },
        ],
        correctId: "dog",
      },
      {
        prompt: "Select the VEHICLE that travels on tracks:",
        subPrompt: "Has an engine and cars carrying passengers",
        audioText: "Select the vehicle that travels on tracks",
        options: [
          { id: "train", label: "🚂 Train", icon: "🚂" },
          { id: "boat", label: "⛵ Boat", icon: "⛵" },
          { id: "airplane", label: "✈️ Airplane", icon: "✈️" },
        ],
        correctId: "train",
      },
    ];

    const v = vocabTasks[(r - 1) % vocabTasks.length];
    setQuizQuestion({
      prompt: v.prompt,
      subPrompt: v.subPrompt,
      audioText: v.audioText,
      options: [...v.options].sort(() => Math.random() - 0.5),
      correctId: v.correctId,
    });
  };

  /* ─────────────────── K. SENTENCE CONSTRUCTION (SPEECH) ─────────────────── */
  const initSentenceRound = (r: number) => {
    const sentences = [
      ["The", "dog", "is", "happy"],
      ["Birds", "fly", "in", "sky"],
      ["I", "like", "sweet", "apples"],
      ["She", "reads", "a", "book"],
    ];

    const target = sentences[(r - 1) % sentences.length];
    setTargetSentence(target);
    setQuizQuestion({
      prompt: "Build the complete sentence by tapping the words in order:",
      subPrompt: "Start with the capital letter word and finish the phrase!",
      audioText: target.join(" "),
      options: [],
      correctId: target.join(" "),
    });

    const scrambled = [...target]
      .sort(() => Math.random() - 0.5)
      .map((w, idx) => ({ id: idx, text: w, used: false }));
    setScrambledItems(scrambled);
    setBuiltItems([]);
  };

  /* ─────────────────── L. LISTENING COMPREHENSION (SPEECH) ─────────────────── */
  const initListeningRound = (r: number) => {
    const audioTasks = [
      {
        spoken: "Put the big blue ball inside the toy box.",
        prompt: "Listen to the audio instruction. What should be put in the box?",
        options: [
          { id: "ball", label: "⚽ The big blue ball", icon: "⚽" },
          { id: "book", label: "📖 The green storybook", icon: "📖" },
          { id: "car", label: "🚗 The red toy car", icon: "🚗" },
        ],
        correctId: "ball",
      },
      {
        spoken: "The rabbit hopped quickly into the green garden.",
        prompt: "Where did the rabbit hop?",
        options: [
          { id: "garden", label: "🥕 Into the green garden", icon: "🥕" },
          { id: "lake", label: "🌊 Into the deep lake", icon: "🌊" },
          { id: "house", label: "🏠 Into the attic", icon: "🏠" },
        ],
        correctId: "garden",
      },
    ];

    const item = audioTasks[(r - 1) % audioTasks.length];
    setQuizQuestion({
      prompt: item.prompt,
      subPrompt: `🎧 Audio Prompt: "${item.spoken}"`,
      audioText: item.spoken,
      options: [...item.options].sort(() => Math.random() - 0.5),
      correctId: item.correctId,
    });
  };

  /* ─────────────────── M. SPEECH SOUND PRACTICE (SPEECH) ─────────────────── */
  const initSpeechSoundRound = (r: number) => {
    const sounds = [
      {
        sound: "/S/ Sound",
        prompt: "Practice the 'S' sound! Like a hissing snake: Sssss",
        subPrompt: "Say: SUN, STAR, SMILE",
        audioText: "Sssss. Sun. Star. Smile.",
        options: [
          { id: "sun", label: "☀️ SUN", icon: "☀️" },
          { id: "star", label: "⭐ STAR", icon: "⭐" },
          { id: "smile", label: "😊 SMILE", icon: "😊" },
        ],
        correctId: "sun",
      },
      {
        sound: "/R/ Sound",
        prompt: "Practice the 'R' sound! Like a lion growl: Rrrr",
        subPrompt: "Say: RAIN, ROCKET, RED",
        audioText: "Rrrr. Rain. Rocket. Red.",
        options: [
          { id: "rocket", label: "🚀 ROCKET", icon: "🚀" },
          { id: "rain", label: "🌧️ RAIN", icon: "🌧️" },
          { id: "red", label: "🟥 RED", icon: "🟥" },
        ],
        correctId: "rocket",
      },
    ];

    const snd = sounds[(r - 1) % sounds.length];
    setQuizQuestion({
      prompt: snd.prompt,
      subPrompt: snd.subPrompt,
      audioText: snd.audioText,
      options: [...snd.options].sort(() => Math.random() - 0.5),
      correctId: snd.correctId,
    });
  };

  /* ─────────────────── N. GENERIC ROUND FALLBACK ─────────────────── */
  const initGenericRound = (r: number) => {
    initSequencingRound(r);
  };

  /* ─────────────────── MULTIPLE CHOICE HANDLER ─────────────────── */
  const handleOptionChoice = (optionId: string) => {
    if (isOptionLocked) return;
    setIsOptionLocked(true);
    setSelectedOption(optionId);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = optionId === quizQuestion.correctId;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const earned = 25 * diff;
      setScore((prev) => prev + earned);

      setTimeout(() => {
        if (round >= totalRounds) {
          finishExercise(correctCount + 1, errors, score + earned);
        } else {
          setRound((r) => r + 1);
          initRound(round + 1);
        }
      }, 700);
    } else {
      setErrors((prev) => prev + 1);

      setTimeout(() => {
        if (round >= totalRounds) {
          finishExercise(correctCount, errors + 1, score);
        } else {
          setRound((r) => r + 1);
          initRound(round + 1);
        }
      }, 1000);
    }
  };

  /* ─────────────────── WORD / SENTENCE BUILDER HANDLERS ─────────────────── */
  const handleTilePick = (item: { id: number; text: string; used: boolean }) => {
    if (item.used) return;
    const newScrambled = scrambledItems.map((sc) => (sc.id === item.id ? { ...sc, used: true } : sc));
    const newBuilt = [...builtItems, { id: item.id, text: item.text }];
    setScrambledItems(newScrambled);
    setBuiltItems(newBuilt);

    // Check if finished
    if (newBuilt.length === targetSentence.length) {
      setTotalAttempts((prev) => prev + 1);
      const isCorrect = newBuilt.every((b, idx) => b.text.toLowerCase() === targetSentence[idx].toLowerCase());

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        const earned = 30 * diff;
        setScore((prev) => prev + earned);

        setTimeout(() => {
          if (round >= totalRounds) {
            finishExercise(correctCount + 1, errors, score + earned);
          } else {
            setRound((r) => r + 1);
            initRound(round + 1);
          }
        }, 800);
      } else {
        setErrors((prev) => prev + 1);
        setTimeout(() => {
          // Reset tiles for retry
          setScrambledItems(scrambledItems.map((s) => ({ ...s, used: false })));
          setBuiltItems([]);
        }, 1000);
      }
    }
  };

  const handleTileRemove = (builtIdx: number) => {
    const item = builtItems[builtIdx];
    setBuiltItems(builtItems.filter((_, idx) => idx !== builtIdx));
    setScrambledItems(scrambledItems.map((sc) => (sc.id === item.id ? { ...sc, used: false } : sc)));
  };

  /* ─────────────────── COMPLETION ─────────────────── */
  const finishExercise = async (finalCorrect: number, finalErrors: number, finalScore: number) => {
    const totalTimeMs = Math.max(2000, Date.now() - startTimeRef.current);
    const attempts = Math.max(1, finalCorrect + finalErrors);
    const calcAccuracy = Math.min(100, Math.max(25, Math.round((finalCorrect / attempts) * 100)));

    setAccuracy(calcAccuracy);
    setGameState("finished");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: childId,
          exercise_id: config.exerciseId,
          difficulty: diff,
          score: finalScore,
          accuracy: calcAccuracy,
          response_time_ms: totalTimeMs,
          errors: finalErrors,
          assignment_id: config.assignmentId || null,
          pathway: config.pathway,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletionResult(data);
        onComplete({
          score: finalScore,
          accuracy: calcAccuracy,
          nextDifficulty: data.adaptive_next_difficulty || diff,
        });
      }
    } catch (err) {
      console.error("Session completion recording error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isWordBuilder = config.domain === "spelling" || config.domain === "sentence_construction";
  const isMemory = config.domain === "working_memory" || config.domain === "memory";
  const isAttention = config.domain === "attention";

  return (
    <div className="cd-modal-backdrop" style={{ zIndex: 100 }}>
      <div
        className="cd-modal-card"
        style={{
          maxWidth: "660px",
          width: "100%",
          padding: "30px",
          borderRadius: "26px",
          background: "white",
          boxShadow: "0 25px 70px rgba(109, 61, 245, 0.22)",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
              }}
            >
              {config.pathway === "speech" ? (
                <Mic className="h-5 w-5" />
              ) : config.pathway === "dyslexia" ? (
                <BookOpen className="h-5 w-5" />
              ) : (
                <Activity className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                {config.exerciseName}
              </h2>
              <span style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>
                {(config.pathway || "adhd").toUpperCase()} PATHWAY • LEVEL {diff}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F5F0FF",
              border: "none",
              borderRadius: "12px",
              padding: "8px",
              cursor: "pointer",
              color: "#6B6580",
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* READY STATE */}
        {gameState === "ready" && (
          <div style={{ textAlign: "center", padding: "20px 12px" }}>
            <div style={{ fontSize: "56px", marginBottom: "12px" }}>
              {config.pathway === "speech" ? "🎙️" : config.pathway === "dyslexia" ? "📖" : "🎯"}
            </div>
            <h3 style={{ fontSize: "21px", fontWeight: 800, color: "#1A1035", margin: "0 0 8px" }}>
              Ready for Level {diff}?
            </h3>
            {config.notes && (
              <p
                style={{
                  background: "#F5F0FF",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#5B21B6",
                  margin: "0 auto 14px",
                  maxWidth: "460px",
                }}
              >
                📋 <strong>Clinician Instructions:</strong> {config.notes}
              </p>
            )}
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 auto 20px", maxWidth: "460px", lineHeight: 1.5 }}>
              Follow on-screen instructions, tap carefully, and collect stars and XP as you learn!
            </p>
            <button
              onClick={() => startExercise()}
              className="cd-hero-btn"
              style={{ padding: "14px 44px", fontSize: "16px", margin: "0 auto", display: "inline-flex" }}
            >
              <Zap className="h-5 w-5" /> Start Activity
            </button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div>
            {/* Round & Score Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 14px",
                background: "#FAF7FF",
                borderRadius: "12px",
                marginBottom: "18px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#5B21B6",
              }}
            >
              <span>Round {round} of {totalRounds}</span>
              <span>⭐ {score} XP</span>
              <span>Errors: {errors}</span>
            </div>

            {/* 1. ATTENTION GAME VIEW */}
            {isAttention && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "14px", color: "#6B6580" }}>Tap all target symbols: </span>
                  <span style={{ fontSize: "24px", fontWeight: 800, marginLeft: "6px" }}>
                    {targetSymbols.join(" ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.sqrt(gridTiles.length) || 3}, 1fr)`,
                    gap: "10px",
                    maxWidth: "380px",
                    margin: "0 auto",
                  }}
                >
                  {gridTiles.map((tile, idx) => (
                    <button
                      key={tile.id}
                      onClick={() => handleAttentionTileClick(idx)}
                      style={{
                        height: "64px",
                        fontSize: "28px",
                        borderRadius: "14px",
                        border: "2px solid",
                        borderColor:
                          tile.status === "correct"
                            ? "#10B981"
                            : tile.status === "wrong"
                            ? "#EF4444"
                            : "#E5DEFF",
                        background:
                          tile.status === "correct"
                            ? "#D1FAE5"
                            : tile.status === "wrong"
                            ? "#FEE2E2"
                            : "#FFFFFF",
                        cursor: tile.status === "correct" ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {tile.symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. MEMORY GAME VIEW */}
            {isMemory && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "14px", fontSize: "13.5px", color: "#6B6580" }}>
                  Flip two cards at a time to find matching pairs!
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${memoryCards.length <= 8 ? 4 : 4}, 1fr)`,
                    gap: "10px",
                    maxWidth: "420px",
                    margin: "0 auto",
                  }}
                >
                  {memoryCards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      style={{
                        height: "72px",
                        fontSize: card.flipped || card.matched ? "30px" : "18px",
                        fontWeight: 800,
                        borderRadius: "14px",
                        border: "2px solid",
                        borderColor: card.matched ? "#10B981" : card.status === "wrong" ? "#EF4444" : "#DDD6FE",
                        background: card.matched ? "#D1FAE5" : card.flipped ? "#FFFFFF" : "#7C3AED",
                        color: card.flipped || card.matched ? "#1A1035" : "white",
                        cursor: card.matched ? "default" : "pointer",
                        transition: "all 0.25s",
                      }}
                    >
                      {card.flipped || card.matched ? card.symbol : "❓"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. WORD / SENTENCE BUILDER VIEW (Spelling, Sentence Construction) */}
            {isWordBuilder && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <h4 style={{ fontSize: "17px", fontWeight: 800, color: "#1A1035", marginBottom: "6px" }}>
                  {quizQuestion.prompt}
                </h4>
                {quizQuestion.subPrompt && (
                  <p style={{ fontSize: "13px", color: "#7C3AED", marginBottom: "14px" }}>
                    {quizQuestion.subPrompt}
                  </p>
                )}

                {/* Built area */}
                <div
                  style={{
                    minHeight: "56px",
                    border: "2px dashed #C4B5FD",
                    borderRadius: "16px",
                    background: "#FAF7FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    margin: "0 auto 18px",
                    maxWidth: "500px",
                  }}
                >
                  {builtItems.length === 0 ? (
                    <span style={{ fontSize: "13px", color: "#A78BFA" }}>Tap words below to place them here</span>
                  ) : (
                    builtItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTileRemove(idx)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          background: "#7C3AED",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {item.text} ✕
                      </button>
                    ))
                  )}
                </div>

                {/* Scrambled pool */}
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px" }}>
                  {scrambledItems.map((item) => (
                    <button
                      key={item.id}
                      disabled={item.used}
                      onClick={() => handleTilePick(item)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "12px",
                        border: "2px solid #DDD6FE",
                        background: item.used ? "#F3F4F6" : "#FFFFFF",
                        color: item.used ? "#9CA3AF" : "#1A1035",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: item.used ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MULTIPLE CHOICE QUESTION VIEW (Sequencing, Letter Detective, Phonics, Vocab, etc.) */}
            {!isAttention && !isMemory && !isWordBuilder && (
              <div style={{ padding: "8px 0" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <h4 style={{ fontSize: "17px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
                      {quizQuestion.prompt}
                    </h4>
                    {quizQuestion.audioText && (
                      <button
                        type="button"
                        onClick={() => playTTS(quizQuestion.audioText || "")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "10px",
                          background: "#EDE9FE",
                          color: "#6D28D9",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Volume2 className="h-4 w-4" /> Listen
                      </button>
                    )}
                  </div>
                  {quizQuestion.subPrompt && (
                    <p style={{ fontSize: "13px", color: "#6B6580", marginTop: "4px" }}>
                      {quizQuestion.subPrompt}
                    </p>
                  )}
                  {quizQuestion.sequence && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        padding: "12px",
                        background: "#F5F0FF",
                        borderRadius: "14px",
                        marginTop: "10px",
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      {quizQuestion.sequence.map((step, sIdx) => (
                        <span key={sIdx} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {step}
                          {sIdx < quizQuestion.sequence!.length - 1 && <span>➔</span>}
                        </span>
                      ))}
                      <span>➔ ❓</span>
                    </div>
                  )}
                </div>

                {/* Option buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                  {quizQuestion.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isCorrect = opt.id === quizQuestion.correctId;
                    let bgColor = "white";
                    let borderColor = "#E5DEFF";
                    let textColor = "#1A1035";

                    if (isOptionLocked) {
                      if (isCorrect) {
                        bgColor = "#D1FAE5";
                        borderColor = "#10B981";
                        textColor = "#065F46";
                      } else if (isSelected) {
                        bgColor = "#FEE2E2";
                        borderColor = "#EF4444";
                        textColor = "#991B1B";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isOptionLocked}
                        onClick={() => handleOptionChoice(opt.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "14px",
                          border: `2px solid ${borderColor}`,
                          background: bgColor,
                          color: textColor,
                          fontSize: "15px",
                          fontWeight: 700,
                          cursor: isOptionLocked ? "default" : "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {opt.icon && <span style={{ fontSize: "20px" }}>{opt.icon}</span>}
                          {opt.label}
                        </span>
                        {isOptionLocked && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        {isOptionLocked && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "finished" && (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ fontSize: "60px", marginBottom: "10px" }}>🎉</div>
            <h3 style={{ fontSize: "23px", fontWeight: 800, color: "#1A1035", margin: "0 0 6px" }}>
              Great Work! Challenge Complete!
            </h3>
            <p style={{ fontSize: "14px", color: "#6B6580", margin: "0 0 20px" }}>
              Your cognitive responses and progress have been saved.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                background: "#FAF7FF",
                padding: "16px",
                borderRadius: "18px",
                marginBottom: "24px",
              }}
            >
              <div>
                <span style={{ fontSize: "11.5px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>Score</span>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#1A1035" }}>+{score} XP</div>
              </div>
              <div>
                <span style={{ fontSize: "11.5px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>Accuracy</span>
                <div style={{ fontSize: "24px", fontWeight: 900, color: accuracy >= 80 ? "#059669" : "#D97706" }}>
                  {accuracy}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11.5px", color: "#7C3AED", fontWeight: 700, textTransform: "uppercase" }}>Next Level</span>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#7C3AED" }}>
                  Lvl {completionResult?.adaptive_next_difficulty || diff}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cd-hero-btn"
              style={{ padding: "14px 40px", fontSize: "15px", display: "inline-flex", margin: "0 auto" }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
