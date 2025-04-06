document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileLoaderSection = document.getElementById('file-loader');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const startBtn = document.getElementById('start-btn');

    const modeSelectorSection = document.getElementById('mode-selector');
    const modeButtonsContainer = document.querySelector('.mode-buttons');
    const backToLoadBtn = document.getElementById('back-to-load-btn'); // Back to file load

    const cardAreaSection = document.getElementById('card-area');
    const wordCard = document.getElementById('word-card');
    const cardFrontText = document.getElementById('card-front-text');
    const cardBackText = document.getElementById('card-back-text');
    const cardInstructions = cardAreaSection.querySelector('.instructions');
    const cardControls = cardAreaSection.querySelector('.card-controls');
    const nextBtn = document.getElementById('next-btn');
    const changeModeBtn = document.getElementById('change-mode-btn');

    // Quiz Elements
    const quizOptionsContainer = document.getElementById('quiz-options-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const quizResultsArea = document.getElementById('quiz-results-area');
    const quizScoreDisplay = document.getElementById('quiz-score-display');
    const incorrectAnswersList = document.getElementById('incorrect-answers-list');
    const quizReturnBtn = document.getElementById('quiz-return-btn');

    // Dictionary View Elements
    const dictionaryViewSection = document.getElementById('dictionary-view-section');
    const dictionaryTableBody = document.getElementById('dictionary-table-body');
    const dictionaryBackBtn = document.getElementById('dictionary-back-btn');

    // --- State Variables ---
    let wordPairs = []; // Array of { eng: "...", rus: "..." }
    let currentMode = null;
    let currentIndex = 0;
    let preparedSequence = []; // For sequential modes & quiz: { front: "...", back: "..." }
    const availableFonts = [ // CSS classes for fonts
        'font-caveat',
        'font-indie',
        'font-merriweather',
        'font-roboto-slab',
        'font-rubik-mono'
    ];
    let currentFontIndex = 0; // To cycle or randomize fonts

    // Quiz State
    let quizScore = 0;
    let incorrectQuizAnswers = []; // Stores { question: '...', correctAnswer: '...', selectedAnswer: '...' }
    let currentQuizCorrectAnswer = '';
    let quizAnswersDisabled = false; // Prevent multiple clicks

    // --- Event Listeners ---
    fileInput.addEventListener('change', handleFileSelect);
    startBtn.addEventListener('click', showModeSelector);
    modeButtonsContainer.addEventListener('click', handleModeSelection); // Event delegation
    wordCard.addEventListener('click', () => {
        // Allow flipping only if NOT in any quiz mode and card area is visible
        if (!currentMode?.startsWith('quiz') && !cardAreaSection.classList.contains('hidden')) {
             flipCard();
        }
    });
    nextBtn.addEventListener('click', handleNextClick);
    changeModeBtn.addEventListener('click', goToModeSelector);
    backToLoadBtn.addEventListener('click', goToFileLoader); // Go back to file load
    quizOptionsContainer.addEventListener('click', handleQuizAnswer); // Listener for quiz options
    quizReturnBtn.addEventListener('click', goToModeSelector); // Back from quiz results
    dictionaryBackBtn.addEventListener('click', goToModeSelector); // Back from dictionary view

    // --- Functions ---

    // Utility: Fisher-Yates shuffle
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // Utility: Get random elements from array (excluding some if needed)
    function getRandomElements(arr, num, exclude = []) {
        const available = arr.filter(item => !exclude.includes(item));
        shuffleArray(available);
        return available.slice(0, num);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Выбран файл: ${file.name}`;
            startBtn.disabled = false;
            readFileContent(file);
        } else {
            resetApp();
        }
    }

    function resetApp() {
        fileNameDisplay.textContent = '';
        startBtn.disabled = true;
        wordPairs = [];
        fileInput.value = ''; // Reset file input
        goToFileLoader(); // Show file loader
    }


    function readFileContent(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseFileContent(event.target.result);
            if (wordPairs.length === 0) {
                alert('Не удалось найти пары слов в файле. Проверьте формат: "Слово - Перевод" на каждой строке.');
                resetApp();
            } else {
                console.log(`Loaded ${wordPairs.length} word pairs.`);
                // Optional: Automatically proceed if file is valid? Or wait for "Start".
            }
        };
        reader.onerror = () => {
            alert('Ошибка чтения файла.');
            resetApp();
        };
        reader.readAsText(file);
    }

    function parseFileContent(text) {
        wordPairs = [];
        const lines = text.split('\n');
        const engRegex = /[a-zA-Z]/;

        for (const line of lines) {
            const parts = line.split(/\s*-\s*/);
            if (parts.length === 2) {
                const part1 = parts[0].trim();
                const part2 = parts[1].trim();
                if (part1 && part2) {
                    if (engRegex.test(part1) && !engRegex.test(part2)) {
                        wordPairs.push({ eng: part1, rus: part2 });
                    } else if (!engRegex.test(part1) && engRegex.test(part2)) {
                        wordPairs.push({ eng: part2, rus: part1 });
                    } else {
                        console.warn(`Skipping line due to ambiguous languages or format: "${line}"`);
                    }
                }
            } else if (line.trim()) {
                console.warn(`Skipping line due to incorrect format: "${line}"`);
            }
        }
    }

    function showModeSelector() {
        if (wordPairs.length > 0) {
            fileLoaderSection.classList.add('hidden');
            dictionaryViewSection.classList.add('hidden'); // Hide others
            cardAreaSection.classList.add('hidden');
            quizResultsArea.classList.add('hidden');
            modeSelectorSection.classList.remove('hidden');
        } else {
            alert('Сначала загрузите файл с парами слов.');
        }
    }

    function goToFileLoader() {
        modeSelectorSection.classList.add('hidden');
        cardAreaSection.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        dictionaryViewSection.classList.add('hidden');
        fileLoaderSection.classList.remove('hidden');
        resetApp(); // Also clear words and file input
    }


    function goToModeSelector() {
        cardAreaSection.classList.add('hidden');
        quizResultsArea.classList.add('hidden');
        dictionaryViewSection.classList.add('hidden');
        modeSelectorSection.classList.remove('hidden');
        resetCardState();
    }

    function handleModeSelection(event) {
        if (!event.target.classList.contains('mode-btn')) return;

        currentMode = event.target.dataset.mode;
        currentIndex = 0;
        preparedSequence = [];
        resetCardState();

        modeSelectorSection.classList.add('hidden'); // Hide mode selector

        // Handle different modes
        if (currentMode === 'dictionary') {
            showDictionary();
        }
        // Check if it's any quiz mode
        else if (currentMode.startsWith('quiz')) {
            startQuiz(); // Let startQuiz handle specific quiz types
        }
        else {
            // Card-based modes
            prepareSequenceForCardMode();
             if (wordPairs.length === 0) {
                alert("Нет слов для начала!");
                goToModeSelector();
                return;
             }
            cardAreaSection.classList.remove('hidden');
            quizOptionsContainer.classList.add('hidden'); // Ensure quiz options are hidden
            quizFeedback.classList.add('hidden');
            cardInstructions.classList.remove('hidden'); // Show card instructions
            cardControls.classList.remove('hidden'); // Show card controls
            wordCard.classList.remove('quiz-active'); // Allow flipping for card modes
            nextBtn.textContent = "Следующее"; // Reset button text
            nextBtn.disabled = false; // Ensure button is enabled initially for card modes
            showNextCard(); // Show the first card
        }
    }

    // --- Dictionary Mode ---
    function showDictionary() {
        dictionaryTableBody.innerHTML = ''; // Clear previous entries
        if (wordPairs.length === 0) {
             const row = dictionaryTableBody.insertRow();
             const cell = row.insertCell();
             cell.colSpan = 2;
             cell.textContent = 'Словарь пуст. Загрузите файл.';
             cell.style.textAlign = 'center';
        } else {
            // Sort alphabetically by Russian word (optional but nice)
             const sortedPairs = [...wordPairs].sort((a, b) => a.rus.localeCompare(b.rus, 'ru'));
             sortedPairs.forEach(pair => {
                const row = dictionaryTableBody.insertRow();
                const cellRus = row.insertCell();
                const cellEng = row.insertCell();
                cellRus.textContent = pair.rus;
                cellEng.textContent = pair.eng;
            });
        }
        dictionaryViewSection.classList.remove('hidden'); // Show the dictionary section
    }

    // --- Card Modes Logic ---
    function prepareSequenceForCardMode() {
        // Only prepare if it's a card mode needing a sequence
        if (!currentMode || wordPairs.length === 0 || currentMode === 'random' || currentMode.startsWith('quiz') || currentMode === 'dictionary') return;

        const shuffledPairs = shuffleArray([...wordPairs]);

        switch (currentMode) {
            case 'toEndBoth':
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
            case 'onlyRus':
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                break;
            case 'onlyEng':
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
        }
        console.log(`Prepared sequence for mode "${currentMode}" with ${preparedSequence.length} items.`);
    }

    function showNextCard() {
        if (wordPairs.length === 0) {
            updateCard("Нет слов", "Загрузите файл");
            nextBtn.disabled = true;
            return;
        }
        resetCardState();

        let front = "";
        let back = "";
        let isEndOfSequence = false;

        switch (currentMode) {
            case 'random':
                const randomIndex = Math.floor(Math.random() * wordPairs.length);
                const pair = wordPairs[randomIndex];
                const showEngFirst = Math.random() < 0.5;
                front = showEngFirst ? pair.eng : pair.rus;
                back = showEngFirst ? pair.rus : pair.eng;
                nextBtn.disabled = false;
                break;

            case 'toEndBoth':
            case 'onlyRus':
            case 'onlyEng':
                if (preparedSequence.length === 0 && wordPairs.length > 0) {
                     // Should have been prepared, maybe log error or try preparing again?
                     console.error("Sequence not prepared for mode:", currentMode);
                     // Attempt to prepare on the fly (might mess up order if called mid-sequence)
                     prepareSequenceForCardMode();
                     if(preparedSequence.length === 0) { // Still no sequence? Abort.
                        updateCard("Ошибка", "Не удалось подготовить список");
                        nextBtn.disabled = true;
                        return;
                     }
                }

                if (currentIndex >= preparedSequence.length) {
                    isEndOfSequence = true; // Mark end
                    front = "Конец списка!";
                    back = "Смените режим";
                } else {
                    front = preparedSequence[currentIndex].front;
                    back = preparedSequence[currentIndex].back;
                    // Don't increment here, increment happens *after* showing/handling click
                }
                 // Disable button *only* if we've reached the end message
                nextBtn.disabled = isEndOfSequence;
                break;

            default: // Should not happen if modes are handled correctly
                console.error("Unknown card mode in showNextCard:", currentMode)
                updateCard("Ошибка", "Неизвестный режим");
                nextBtn.disabled = true;
                return;
        }

        updateCard(front, back);

        // Apply random font only if it's not the end-of-list message
        if (!isEndOfSequence) {
             applyRandomFont();
        } else {
             // Reset font for the end message
             cardFrontText.className = 'variable-font'; // Remove specific font classes
        }
    }

    function applyRandomFont() {
        // Remove previous font class
        cardFrontText.classList.remove(...availableFonts);
        // Select and add a new random font class
        const randomFontClass = availableFonts[Math.floor(Math.random() * availableFonts.length)];
        cardFrontText.classList.add(randomFontClass);
    }


    function updateCard(frontText, backText) {
        cardFrontText.textContent = frontText || " ";
        cardBackText.textContent = backText || " ";
    }

    function flipCard() {
        wordCard.classList.toggle('is-flipped');
    }

    function resetCardState() {
        wordCard.classList.remove('is-flipped');
        // Reset font to default base class if needed
        cardFrontText.className = 'variable-font';
    }

    // --- Quiz Mode Logic ---

    function startQuiz() {
         // Check minimum word count (need 4 for 3 wrong + 1 correct)
        if (wordPairs.length < 4 && wordPairs.length > 0) {
             alert(`Для викторины нужно минимум 4 слова. У вас ${wordPairs.length}.`);
             goToModeSelector();
             return;
        } else if (wordPairs.length === 0) {
             alert("Сначала загрузите слова!");
             goToModeSelector();
             return;
        }

        // Reset quiz state
        currentIndex = 0;
        quizScore = 0;
        incorrectQuizAnswers = [];
        preparedSequence = []; // Reset sequence

        // Prepare sequence based on the specific quiz mode
        const shuffledPairs = shuffleArray([...wordPairs]);

        switch (currentMode) {
            case 'quiz_rus_eng': // Rus -> Eng (Original)
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng, originalPair: pair }));
                break;
            case 'quiz_eng_rus': // Eng -> Rus
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus, originalPair: pair }));
                break;
            case 'quiz_mixed': // Mixed Rus/Eng -> Eng/Rus
                // Add both directions for each pair
                shuffledPairs.forEach(pair => {
                    preparedSequence.push({ front: pair.rus, back: pair.eng, originalPair: pair });
                    preparedSequence.push({ front: pair.eng, back: pair.rus, originalPair: pair });
                });
                // Shuffle the combined sequence
                shuffleArray(preparedSequence);
                break;
            default:
                console.error("Unknown quiz mode:", currentMode);
                alert("Неизвестный режим викторины!");
                goToModeSelector();
                return;
        }

        console.log(`Prepared quiz sequence for mode "${currentMode}" with ${preparedSequence.length} questions.`);

        // Setup UI for quiz
        cardAreaSection.classList.remove('hidden');
        quizOptionsContainer.classList.remove('hidden');
        quizFeedback.classList.add('hidden');
        cardInstructions.classList.add('hidden');
        cardControls.classList.remove('hidden');
        wordCard.classList.add('quiz-active'); // Prevent clicking card to flip
        nextBtn.textContent = "Пропустить";
        nextBtn.disabled = false; // Enable Skip/Next button

        showNextQuizQuestion(); // Display the first question
    }

    function showNextQuizQuestion() {
        resetCardState(); // Ensure card is front-facing
        quizFeedback.classList.add('hidden'); // Hide previous feedback
        quizOptionsContainer.innerHTML = ''; // Clear previous options
        quizAnswersDisabled = false; // Re-enable answering

        if (currentIndex >= preparedSequence.length) {
            showQuizResults(); // Quiz finished
            return;
        }

        const currentItem = preparedSequence[currentIndex];
        const question = currentItem.front;
        currentQuizCorrectAnswer = currentItem.back; // Store correct answer for checking

        updateCard(question, currentQuizCorrectAnswer); // Update card faces (back won't be visible initially)
        applyRandomFont(); // Apply font to question

        // Determine the language of the *answer* to generate correct options
        const correctAnswer = currentQuizCorrectAnswer;
        let allPossibleAnswersPool = [];
        const engRegex = /[a-zA-Z]/; // Simple check for English

        // If the correct answer contains English letters, assume it's English
        // Otherwise, assume it's Russian
        if (engRegex.test(correctAnswer)) {
             // Expected answer is English, pool is all English words
             allPossibleAnswersPool = wordPairs.map(p => p.eng);
        } else {
             // Expected answer is Russian, pool is all Russian words
             allPossibleAnswersPool = wordPairs.map(p => p.rus);
        }

        // Prepare options: 1 correct + 3 unique incorrect from the correct pool
        const wrongAnswers = getRandomElements(
            allPossibleAnswersPool,
            3, // Number of wrong options needed
            [correctAnswer] // Exclude the correct answer itself
        );

        // Check if enough wrong answers were found (handles small dictionaries)
        if (wrongAnswers.length < 3) {
            console.warn(`Could only find ${wrongAnswers.length} unique wrong answers for "${correctAnswer}". Need 3.`);
            // We proceed, but there will be fewer than 4 choices.
        }


        const options = shuffleArray([correctAnswer, ...wrongAnswers]); // Shuffle all options

        // Create buttons for options
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.classList.add('btn', 'quiz-option-btn');
            button.dataset.answer = optionText; // Store answer in data attribute
            quizOptionsContainer.appendChild(button);
        });

         // Update button text after the first question or skip
         nextBtn.textContent = "Следующий вопрос";
         // Disable 'Next' until an answer is given/skipped AND the answer animation/feedback is done
         nextBtn.disabled = true;
    }

    function handleQuizAnswer(event) {
        if (quizAnswersDisabled || !event.target.classList.contains('quiz-option-btn')) {
            return; // Ignore clicks if disabled or not on an option button
        }

        quizAnswersDisabled = true; // Disable further answers for this question
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.dataset.answer;
        const isCorrect = selectedAnswer === currentQuizCorrectAnswer;

        // Visual feedback on buttons
        const optionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
        optionButtons.forEach(btn => {
            btn.disabled = true; // Disable all buttons
            if (btn.dataset.answer === currentQuizCorrectAnswer) {
                btn.classList.add('correct'); // Highlight correct answer
            } else if (btn === selectedButton) { // If incorrect was selected
                 btn.classList.add('incorrect');
            }
        });

        // Feedback text
        if (isCorrect) {
            quizScore++;
            quizFeedback.textContent = 'Правильно!';
            quizFeedback.className = 'quiz-feedback correct'; // Use class for styling
        } else {
            quizFeedback.textContent = `Неправильно. Верный ответ: ${currentQuizCorrectAnswer}`;
            quizFeedback.className = 'quiz-feedback incorrect';
            // Record incorrect answer
             const currentQuestionData = preparedSequence[currentIndex];
            incorrectQuizAnswers.push({
                question: currentQuestionData.front,
                correctAnswer: currentQuestionData.back,
                selectedAnswer: selectedAnswer // Record what was chosen
             });
        }
        quizFeedback.classList.remove('hidden');

        // Flip card to show the back (correct answer)
        if (!wordCard.classList.contains('is-flipped')) {
            flipCard();
        }

         // Prepare for next step BUT don't advance index yet, handleNextClick will do that
        nextBtn.disabled = false; // Enable the 'Next Question' button
        nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";

    }

     // Handles clicks on the main "Next" button, routing based on mode
     function handleNextClick() {
         // Check if it's any quiz mode
         if (currentMode?.startsWith('quiz')) {
            // If quizAnswersDisabled is false, it means "Skip" was pressed
            // If quizAnswersDisabled is true, it means an answer was given and this is "Next Question" / "Show Results"
             if (!quizAnswersDisabled) { // Handle Skip
                 console.log("Skipped question");
                 quizFeedback.textContent = `Пропущено. Верный ответ: ${currentQuizCorrectAnswer}`;
                 quizFeedback.className = 'quiz-feedback incorrect';
                 quizFeedback.classList.remove('hidden');
                 quizAnswersDisabled = true; // Mark as handled for this round

                 // Record skipped answer
                 const currentQuestionData = preparedSequence[currentIndex];
                 incorrectQuizAnswers.push({
                     question: currentQuestionData.front,
                     correctAnswer: currentQuestionData.back,
                     selectedAnswer: "[Пропущено]"
                 });

                 // Flip card to show the back (correct answer) when skipping
                 if (!wordCard.classList.contains('is-flipped')) {
                     flipCard();
                 }
                 // Enable the 'Next' button to proceed after skipping
                 nextBtn.disabled = false;
                 nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";

             } else { // Handle "Next Question" or "Show Results" after an answer was given or after skip
                  currentIndex++; // Advance to the next question index
                  showNextQuizQuestion(); // Will either show next question or results
             }

         } else { // Handle next for card modes
             // Only advance index for sequential card modes here
             if (currentMode !== 'random' && currentIndex < preparedSequence.length) {
                 currentIndex++;
             }
             showNextCard();
         }
     }


    function showQuizResults() {
        cardAreaSection.classList.add('hidden'); // Hide card/quiz area
        quizResultsArea.classList.remove('hidden'); // Show results area

        const totalQuestions = preparedSequence.length;
        quizScoreDisplay.textContent = `Ваш результат: ${quizScore} / ${totalQuestions}`;

        incorrectAnswersList.innerHTML = ''; // Clear previous results

        if (totalQuestions === 0) {
            const li = document.createElement('li');
            li.textContent = 'Нет вопросов в этой викторине.';
            incorrectAnswersList.appendChild(li);
        } else if (incorrectQuizAnswers.length === 0) {
             const li = document.createElement('li');
            li.textContent = 'Отлично! Все ответы верные.';
            incorrectAnswersList.appendChild(li);
        } else {
            incorrectQuizAnswers.forEach(item => {
                const li = document.createElement('li');
                 // Display: Question - incorrect (correct: Answer) [You chose: Selected]
                 let incorrectText = `<span class="orig">${item.question}</span> - неверно (прав: <span class="trans">${item.correctAnswer}</span>)`;
                 if (item.selectedAnswer !== "[Пропущено]") {
                    incorrectText += ` [выбр: <span class="sel">${item.selectedAnswer}</span>]`;
                 } else {
                     incorrectText += ` [пропущено]`;
                 }
                 li.innerHTML = incorrectText;
                 incorrectAnswersList.appendChild(li);
            });
        }
    }

}); // End DOMContentLoaded
