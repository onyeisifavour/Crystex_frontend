// quiz.js — Final Corrected Version

/* ============================
   HELPERS
   ============================ */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DEFAULT_SETTINGS = {
  numQuestions: 10,
  numOptions: 4,
  timeLimit: 1,
  difficulty: 'Medium',
};

function applySettings(settings) {
  // Update the HTML inputs to match the settings
  document.querySelector('#numQuestions').value = settings.numQuestions;
  document.querySelector('#numOptions').value = settings.numOptions;
  document.querySelector('#timeLimit').value = settings.timeLimit;
  document.querySelector('#difficulty').value = settings.difficulty;

  // Save to global variable
  window.quizSettings = { ...settings };
}

/* ============================
   DOM REFERENCES
   ============================ */
const questDis = document.querySelector('.quest');
const answersContainer = document.querySelector('.answers');
const startBtn = document.querySelector('.start-btn');
const startScreen = document.querySelector('.startScreen');
const quizContainer = document.querySelector('.parentDiv');
const statsPage = document.querySelector('.statsPage');
const settingsBtn = document.querySelector('.settings-text');
const settingsPage = document.querySelector('.settingsCard');
const saveBtn = document.querySelector('.saveBtn');
const cancelBtn = document.querySelector('.cancelBtn');
const timerUi = document.querySelector('#timer');

/* ============================
   STATE VARIABLES
   ============================ */
let correctAnswer = null;
let answered = false;
let score = 0;
let timerEnded = false;
let timerId = null;
let scorePercentage;
let averageTime;
let timeRemaining;
let currentQuestion = 0;

/* ============================
   START BUTTON LOGIC (FIXED)
   ============================ */
startBtn.addEventListener('click', function () {
  // Just show the quiz and start. 
  // We trust that "window.quizSettings" is already set by the Save button or Defaults.
  startScreen.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  currentQuestion = 0;
  score = 0;

  generateQuestion();
  timerLogic();
});

/* ============================
   SETTINGS PAGE LOGIC
   ============================ */
settingsBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  settingsPage.classList.remove('hidden');
});

saveBtn.addEventListener('click', () => {
  const newSettings = {
    numQuestions: Number(document.querySelector('#numQuestions').value),
    numOptions: Number(document.querySelector('#numOptions').value),
    timeLimit: Number(document.querySelector('#timeLimit').value),
    difficulty: document.querySelector('#difficulty').value,
  };

  applySettings({
    ...DEFAULT_SETTINGS,
    ...newSettings,
  });

  settingsPage.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  // Revert to defaults if they cancel
  applySettings(DEFAULT_SETTINGS);
  settingsPage.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

/* ============================
   GENERATE QUESTION
   ============================ */
function generateQuestion(numOptions) {

  if (currentQuestion >= window.quizSettings.numQuestions || timerEnded) {
    endQuiz();
    timerEnded = true;
    return;
  }

  answered = false;
  answersContainer.innerHTML = '';

  let num1, num2;
  const operators = ['×', '÷', '+', '−'];
  const operator = operators[randomInt(0, operators.length - 1)];

  do {
    num1 = randomInt(2, 20);
    num2 = randomInt(2, 20);
  } while (operator === '×' && num1 * num2 > 50);

  if (operator === '−' && num1 < num2) [num1, num2] = [num2, num1];

  if (operator === '÷') {
    const divisor = randomInt(2, 10);
    const quotient = randomInt(2, 10);
    num1 = divisor * quotient;
    num2 = divisor;
  }

  switch (operator) {
    case '+': correctAnswer = num1 + num2; break;
    case '−': correctAnswer = num1 - num2; break;
    case '×': correctAnswer = num1 * num2; break;
    case '÷': correctAnswer = Math.trunc(num1 / num2); break;
  }

  questDis.textContent = `${num1} ${operator} ${num2}`;

  const answers = new Set();
  answers.add(correctAnswer);
  const offsets = [1, 2, 3, 4, 5];

  while (answers.size < window.quizSettings.numOptions) {
    const offset = offsets[randomInt(0, offsets.length - 1)];
    const sign = Math.random() > 0.5 ? 1 : -1;
    let candidate = correctAnswer + sign * offset;
    if (candidate <= 0) candidate = Math.abs(candidate) + 1;
    answers.add(candidate);
  }

  const options = shuffle(Array.from(answers));
  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'answer-option';
    div.textContent = opt;
    div.style.userSelect = 'none';
    answersContainer.appendChild(div);
  });

  currentQuestion++;
}

/* ============================
   TIMER LOGIC
   ============================ */
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = num => String(num).padStart(2,'0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function timerLogic() {
  if (timerId) clearInterval(timerId);
  timerEnded = false;

  timeRemaining = window.quizSettings.timeLimit * 60;
  timerUi.textContent = formatTime(timeRemaining);

  timerId = setInterval(() => {
    timeRemaining -= 1;
    timerUi.textContent = formatTime(timeRemaining);

    if (timeRemaining <= 0) {
      clearInterval(timerId);
      timerEnded = true;
      timerUi.textContent = "00:00:00";
      answered = true;
      endQuiz();
    }
  }, 1000);
}

/* ============================
   ANSWER CLICK LOGIC
   ============================ */
answersContainer.addEventListener('click', function (e) {
  const el = e.target;
  if (!el.classList.contains('answer-option') || answered) return;

  const picked = Number(el.textContent);
  if (isNaN(picked)) return;

  answered = true;

  if (picked === correctAnswer) {
    el.style.backgroundColor = '#2ecc71';
    el.style.color = '#fff';
    score++;
  } else {
    el.style.backgroundColor = '#e74c3c';
    el.style.color = '#fff';
    const all = answersContainer.querySelectorAll('.answer-option');
    all.forEach(node => {
      if (Number(node.textContent) === correctAnswer) {
        node.style.backgroundColor = '#2ecc71';
        node.style.color = '#fff';
      }
    });
  }

  setTimeout(generateQuestion, 900);
});

/* ============================
   SHOW STATS
   ============================ */
function showStats() {
  const totalTimeSpent = (window.quizSettings.timeLimit * 60) - timeRemaining;
  // Safety check: avoid dividing by zero if they answer 0 questions
  averageTime = currentQuestion > 0 ? totalTimeSpent / currentQuestion : 0;
  scorePercentage = (score / window.quizSettings.numQuestions) * 100;

  console.log(`${scorePercentage}%`);
  console.log(`You spent an average time of ${averageTime.toFixed(2)} seconds per question`);
  console.log(`and you got ${score} correct.`);

  if(scorePercentage <= 54) console.log("You are a dummy");
  else if(scorePercentage < 75) console.log("You can do better");
  else console.log("You are a genius");

  setTimeout(() => {
    statsPage.classList.remove('hidden');
    quizContainer.classList.add('hidden');
  }, 500);
}

/* ============================
   END QUIZ
   ============================ */
function endQuiz() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  answered = true;
  showStats();
}

/* ============================
   INITIALIZATION (FIXED)
   ============================ */
// This runs once when the page loads to ensure we have settings ready
applySettings(DEFAULT_SETTINGS);