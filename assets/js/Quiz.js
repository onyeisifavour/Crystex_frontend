// quiz.js — heavily commented version so you can follow every step

/* ============================
   HELPERS — small reusable functions
   ============================ */

/**
 * randomInt(min, max)
 * Returns a random integer between min and max (inclusive).
 * Useful for picking random operators, numbers, indices, etc.
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * shuffle(arr)
 * In-place Fisher–Yates shuffle.
 * Use this to randomize the order of answer options so the correct one
 * isn't always in the same position.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    // pick a random index j between 0 and i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    // swap arr[i] and arr[j]
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================
   DOM REFERENCES — cache them once
   ============================ */

/*
 These querySelector calls run once at load time and store references
 to DOM elements we will update frequently. This is faster and neater
 than calling querySelector repeatedly inside event handlers.
*/
const questDis = document.querySelector('.quest');          // where the question text goes
const answersContainer = document.querySelector('.answers'); // container for answer buttons/options

/* ============================
   STATE VARIABLES
   ============================ */

/*
  correctAnswer: holds the numeric value of the current correct answer.
  answered: boolean flag to prevent double-clicks / multiple answers for the same question.
  score: simple counter to keep track of correct answers (you can show this later).
*/
let correctAnswer = null;
let answered = false;
let score = 0; // optional — good place to expose to UI later

/* ---------- Start flow: read settings and reveal quiz ---------- */

// DOM refs used by start flow — add these if not already present
const startBtn = document.querySelector('.start-btn');      // the big START element you click
const startScreen = document.querySelector('.startScreen'); // the initial splash card
const quizContainer = document.querySelector('.parentDiv'); // the quiz area to show

// counter that tracks which question we're on (mutable)
let currentQuestion = 0;

// When Start is clicked: read current settings, hide start, show quiz, and start the quiz
startBtn.addEventListener('click', function () {
  // 1) hide start screen and show quiz container (CSS .hidden controls visibility)
  startScreen.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  // 2) read settings values RIGHT NOW (so we get what user selected)
  const numQuestions = Number(document.querySelector('#numQuestions').value) || 10;
  const numOptions = Number(document.querySelector('#numOptions').value) || 4;
  const timeLimit = Number(document.querySelector('#timeLimit').value) || 15;
  const difficulty = document.querySelector('#difficulty').value || 'Medium';
  const quizTitle = document.querySelector('#quizTitle').value || 'My Quiz';

  // 3) store them where other functions can read them
  window.quizSettings = { numQuestions, numOptions, timeLimit, difficulty, quizTitle };

  // 4) reset counters and score & start the quiz
  currentQuestion = 0;
  score = 0;
  // call generateQuestion with the configured numOptions (we'll adapt generateQuestion later to accept this)
  generateQuestion(numOptions);
});

/* ============================
   generateQuestion()
   This is the heart of the quiz engine.
   It picks an operator, builds a valid question, creates plausible distractors,
   then renders the options into the DOM.
   ============================ */
function generateQuestion() {
  // reset the answered flag so the user can select for the new question
  answered = false;

  // clear previous answers from the UI
  answersContainer.innerHTML = '';

  // --- 1) pick operator and two numbers ---
  let num1;
  let num2;
  const operators = ['×', '÷', '+', '−'];
  // pick one operator randomly from the operators array
  const operator = operators[randomInt(0, operators.length - 1)];

  // --- 2) pick raw numbers with a guard for large multiplications ---
  // The do/while below ensures that if we picked multiplication we don't
  // create values that multiply to a number larger than 50 (keeps difficulty reasonable).
  do {
    num1 = randomInt(1, 20);
    num2 = randomInt(1, 20);
  } while (operator === '×' && num1 * num2 > 50);

  // --- 3) make subtraction non-negative ---
  // If the operator is minus, and num1 < num2, swap them so the result isn't negative.
  if (operator === '−' && num1 < num2) {
    [num1, num2] = [num2, num1];
  }

  // --- 4) special handling for division to ensure integer results ---
  // For division, we want num1 / num2 to be an integer.
  // So we pick a random divisor and a random quotient, then compute num1 = divisor * quotient.
  if (operator === '÷') {
    const divisor = randomInt(1, 10);     // what will be the divisor (num2)
    const quotient = randomInt(1, 10);    // the integer result we want
    num1 = divisor * quotient;            // numerator
    num2 = divisor;                        // denominator
  }

  // --- 5) compute the correctAnswer based on the chosen operator ---
  // Note: compute AFTER adjustments above (swap/division adjustments).
  switch (operator) {
    case '+':
      correctAnswer = num1 + num2;
      break;
    case '−':
      correctAnswer = num1 - num2;
      break;
    case '×':
      correctAnswer = num1 * num2;
      break;
    case '÷':
      // We used integer construction for division, but Math.trunc is safe to ensure an integer.
      correctAnswer = Math.trunc(num1 / num2);
      break;
  }

  // --- 6) show the question in the UI ---
  // Example: "12 × 4"
  questDis.textContent = `${num1} ${operator} ${num2}`;

  // --- 7) build answer choices (one correct + close distractors) ---
  // Use a Set to ensure uniqueness.
  const answers = new Set();
  answers.add(correctAnswer);

  // offsets are how far away distractors can be from the correct answer
  const offsets = [1, 2, 3, 4, 5];

  // keep adding candidate answers until we have 5 options total
  // (you can change this number later or make it dynamic from settings)
  while (answers.size < 5) {
    const offset = offsets[randomInt(0, offsets.length - 1)]; // pick a small offset
    const sign = Math.random() > 0.5 ? 1 : -1;                // add or subtract the offset
    let candidate = correctAnswer + sign * offset;

    // avoid negative or zero options if you don't want them shown.
    // This line converts negative/zero candidates into small positive numbers.
    if (candidate <= 0) {
      candidate = Math.abs(candidate) + 1;
    }

    answers.add(candidate);
  }

  // --- 8) randomize option order and render them ---
  const options = shuffle(Array.from(answers));

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'answer-option';  // matches your CSS styles
    div.textContent = opt;            // numeric text to display
    // keep text selection disabled so it feels like clickable buttons
    div.style.userSelect = 'none';
    answersContainer.appendChild(div);
  });

  // TODO: If you later expose `numOptions` in settings, generate only that many options:
  // e.g. generateQuestion(currentNumOptions) and change the while condition accordingly.
}

/* ============================
   Event handling — answer clicks
   We use event delegation: one listener on the container handles all option clicks.
   ============================ */
answersContainer.addEventListener('click', function (e) {
  const el = e.target;

  // Ignore clicks that are not on an answer-option, or ignore if question already answered
  if (!el.classList.contains('answer-option') || answered) return;

  // Read the numeric value of the clicked option
  const picked = Number(el.textContent);
  if (isNaN(picked)) return; // guard: if conversion fails, do nothing

  // prevent further clicks until next question
  answered = true;

  // Check correctness and give feedback
  if (picked === correctAnswer) {
    // correct: visually mark the clicked node green and increment score
    el.style.backgroundColor = '#2ecc71';
    el.style.color = '#fff';
    score++;
  } else {
    // wrong: mark the clicked node red
    el.style.backgroundColor = '#e74c3c';
    el.style.color = '#fff';

    // find and mark the correct option green so the user can see the right answer
    const all = answersContainer.querySelectorAll('.answer-option');
    all.forEach(node => {
      if (Number(node.textContent) === correctAnswer) {
        node.style.backgroundColor = '#2ecc71';
        node.style.color = '#fff';
      }
    });
  }

  // after a short delay to let the user absorb feedback, generate the next question
  // This delay also prevents accidental double-clicks
  setTimeout(generateQuestion, 900);
});

/* ============================
   Start the engine!
   For now the quiz starts immediately on load by generating the first question.
   Later we will wrap this in a start/settings flow so it runs only after the user clicks START.
   ============================ */
// generateQuestion();

/* ============================
   Notes & next-steps (where to plug features)
   - To connect settings: read values from the form (document.querySelector('#numOptions').value etc.)
     and pass them into generateQuestion, or store globally and consult them inside generateQuestion.
   - To implement start/settings flow: remove the final generateQuestion() call here, and call
     generateQuestion() only after the user clicks the start button and confirms settings.
   - To add timer: start a setInterval when quiz begins; when time runs out, end quiz and show score page.
   - To show score/summary: create a small DOM area and update it using the `score` variable and other stats.
   ============================ */
