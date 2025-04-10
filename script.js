document.addEventListener('DOMContentLoaded', () => {
    const fileLoaderSection = document.getElementById('file-loader');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const startBtn = document.getElementById('start-btn');

    const modeSelectorSection = document.getElementById('mode-selector');
    const modeButtonsContainer = document.querySelector('.mode-buttons');
    const backToLoadBtn = document.getElementById('back-to-load-btn');

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

    const dictionaryViewSection = document.getElementById('dictionary-view-section');
    const dictionaryTableBody = document.getElementById('dictionary-table-body');
    const dictionaryBackBtn = document.getElementById('dictionary-back-btn');

    let wordPairs = [];
    let currentMode = null;
    let currentIndex = 0;
    let preparedSequence = [];
    const availableFonts = [
        'font-caveat',
        'font-indie',
        'font-merriweather',
        'font-roboto-slab',
        'font-rubik-mono'
    ];
    const engRegex = /[a-zA-Z]/;

    let quizScore = 0;
    let incorrectQuizAnswers = [];
    let currentQuizCorrectAnswer = '';
    let quizAnswersDisabled = false;

    fileInput.addEventListener('change', handleFileSelect);
    startBtn.addEventListener('click', showModeSelector);
    modeButtonsContainer.addEventListener('click', handleModeSelection);
    wordCard.addEventListener('click', () => {
        if (!currentMode?.startsWith('quiz') && !cardAreaSection.classList.contains('hidden')) {
             flipCard();
        }
    });
    nextBtn.addEventListener('click', handleNextClick);
    changeModeBtn.addEventListener('click', goToModeSelector);
    backToLoadBtn.addEventListener('click', goToFileLoader);
    quizOptionsContainer.addEventListener('click', handleQuizAnswer);
    quizReturnBtn.addEventListener('click', goToModeSelector);
    dictionaryBackBtn.addEventListener('click', goToModeSelector);

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
        fileInput.value = '';
        goToFileLoader();
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
            dictionaryViewSection.classList.add('hidden');
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
        resetApp();
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

        modeSelectorSection.classList.add('hidden');

        if (currentMode === 'dictionary') {
            showDictionary();
        }
        else if (currentMode.startsWith('quiz')) {
            startQuiz();
        }
        else {
            prepareSequenceForCardMode();
             if (wordPairs.length === 0 && currentMode !== 'random') {
                 alert("Нет слов для начала!");
                 goToModeSelector();
                 return;
             } else if (currentMode !== 'random' && preparedSequence.length === 0) {
                  alert("Не удалось подготовить слова для этого режима.");
                  goToModeSelector();
                  return;
             }

            cardAreaSection.classList.remove('hidden');
            quizOptionsContainer.classList.add('hidden');
            quizFeedback.classList.add('hidden');
            cardInstructions.classList.remove('hidden');
            cardControls.classList.remove('hidden');
            wordCard.classList.remove('quiz-active');
            nextBtn.textContent = "Следующее";
            nextBtn.disabled = false;
            showNextCard();
        }
    }

    function showDictionary() {
        dictionaryTableBody.innerHTML = '';
        if (wordPairs.length === 0) {
             const row = dictionaryTableBody.insertRow();
             const cell = row.insertCell();
             cell.colSpan = 2;
             cell.textContent = 'Словарь пуст. Загрузите файл.';
             cell.style.textAlign = 'center';
        } else {
             const sortedPairs = [...wordPairs].sort((a, b) => a.rus.localeCompare(b.rus, 'ru'));
             sortedPairs.forEach(pair => {
                 const row = dictionaryTableBody.insertRow();
                 const cellRus = row.insertCell();
                 const cellEng = row.insertCell();
                 cellRus.textContent = pair.rus;
                 cellEng.textContent = pair.eng;
             });
        }
        dictionaryViewSection.classList.remove('hidden');
    }

    function prepareSequenceForCardMode() {
        if (!currentMode || wordPairs.length === 0 || currentMode === 'random' || currentMode.startsWith('quiz') || currentMode === 'dictionary') return;

        const shuffledPairs = shuffleArray([...wordPairs]);
        preparedSequence = [];

        switch (currentMode) {
            case 'toEndBoth':
                shuffledPairs.forEach(pair => {
                    preparedSequence.push({ front: pair.rus, back: pair.eng, lang: 'rus' });
                    preparedSequence.push({ front: pair.eng, back: pair.rus, lang: 'eng' });
                });
                shuffleArray(preparedSequence);
                break;
            case 'onlyRus':
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng, lang: 'rus' }));
                break;
            case 'onlyEng':
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus, lang: 'eng' }));
                break;
        }
        console.log(`Prepared sequence for mode "${currentMode}" with ${preparedSequence.length} items.`);
    }

    function showNextCard() {
        if (wordPairs.length === 0 && currentMode !== 'random') {
            updateCard("Нет слов", "Загрузите файл");
            applyRandomFont(false);
            nextBtn.disabled = true;
            return;
        }
        resetCardState();

        let front = "";
        let back = "";
        let isEnglish = false;
        let isEndOfSequence = false;

        switch (currentMode) {
            case 'random':
                if (wordPairs.length === 0) {
                    front = "Нет слов";
                    back = "Загрузите файл";
                    isEnglish = false;
                    nextBtn.disabled = true;
                } else {
                    const randomIndex = Math.floor(Math.random() * wordPairs.length);
                    const pair = wordPairs[randomIndex];
                    const showEngFirst = Math.random() < 0.5;
                    front = showEngFirst ? pair.eng : pair.rus;
                    back = showEngFirst ? pair.rus : pair.eng;
                    isEnglish = showEngFirst;
                    nextBtn.disabled = false;
                }
                break;

            case 'toEndBoth':
            case 'onlyRus':
            case 'onlyEng':
                if (preparedSequence.length === 0 && wordPairs.length > 0) {
                     console.error("Sequence not prepared for mode:", currentMode);
                     prepareSequenceForCardMode();
                     if(preparedSequence.length === 0) {
                         updateCard("Ошибка", "Не удалось подготовить список");
                         applyRandomFont(false);
                         nextBtn.disabled = true;
                         return;
                     }
                }

                if (currentIndex >= preparedSequence.length) {
                    isEndOfSequence = true;
                    front = "Конец списка!";
                    back = "Смените режим";
                    isEnglish = false;
                } else {
                    const currentItem = preparedSequence[currentIndex];
                    front = currentItem.front;
                    back = currentItem.back;
                    isEnglish = currentItem.lang === 'eng';
                }
                nextBtn.disabled = isEndOfSequence;
                break;

            default:
                console.error("Unknown card mode in showNextCard:", currentMode)
                updateCard("Ошибка", "Неизвестный режим");
                isEnglish = false;
                nextBtn.disabled = true;
                return;
        }

        updateCard(front, back);

        if (!isEndOfSequence) {
            applyRandomFont(isEnglish);
        } else {
            applyRandomFont(false);
        }
    }

    function applyRandomFont(isEnglish) {
        cardFrontText.classList.remove(...availableFonts);
        
        if (isEnglish) {
            const preferredFonts = ['font-caveat', 'font-indie']; 
            const otherFonts = availableFonts.filter(f => !preferredFonts.includes(f));
            let selectedFont = null;

            const chanceForPreferred = 0.7;

            const usePreferred = preferredFonts.length > 0 && Math.random() < chanceForPreferred;

            if (usePreferred) {
                selectedFont = preferredFonts[Math.floor(Math.random() * preferredFonts.length)];
            } else if (otherFonts.length > 0) {
                selectedFont = otherFonts[Math.floor(Math.random() * otherFonts.length)];
            } else if (preferredFonts.length > 0) {
                selectedFont = preferredFonts[Math.floor(Math.random() * preferredFonts.length)];
            }

            if (selectedFont) {
               cardFrontText.classList.add(selectedFont);
               console.log("Applied font:", selectedFont);
            } else {
                console.log("No font applied (list empty or error?)");
            }

        } else {
             console.log("Applied default font (Russian word)");
        }
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
        cardFrontText.classList.remove(...availableFonts);
    }

    function startQuiz() {
         if (wordPairs.length < 4 && wordPairs.length > 0) {
             alert(`Для викторины нужно минимум 4 слова. У вас ${wordPairs.length}.`);
             goToModeSelector();
             return;
         } else if (wordPairs.length === 0) {
             alert("Сначала загрузите слова!");
             goToModeSelector();
             return;
         }

        currentIndex = 0;
        quizScore = 0;
        incorrectQuizAnswers = [];
        preparedSequence = [];

        const shuffledPairs = shuffleArray([...wordPairs]);

        switch (currentMode) {
            case 'quiz_rus_eng':
                shuffledPairs.forEach(pair => preparedSequence.push({
                    front: pair.rus, back: pair.eng, lang: 'rus', originalPair: pair
                }));
                break;
            case 'quiz_eng_rus':
                shuffledPairs.forEach(pair => preparedSequence.push({
                    front: pair.eng, back: pair.rus, lang: 'eng', originalPair: pair
                }));
                break;
            case 'quiz_mixed':
                shuffledPairs.forEach(pair => {
                    preparedSequence.push({ front: pair.rus, back: pair.eng, lang: 'rus', originalPair: pair });
                    preparedSequence.push({ front: pair.eng, back: pair.rus, lang: 'eng', originalPair: pair });
                });
                shuffleArray(preparedSequence);
                break;
            default:
                console.error("Unknown quiz mode:", currentMode);
                alert("Неизвестный режим викторины!");
                goToModeSelector();
                return;
        }

        console.log(`Prepared quiz sequence for mode "${currentMode}" with ${preparedSequence.length} questions.`);

        cardAreaSection.classList.remove('hidden');
        quizOptionsContainer.classList.remove('hidden');
        quizFeedback.classList.add('hidden');
        cardInstructions.classList.add('hidden');
        cardControls.classList.remove('hidden');
        wordCard.classList.add('quiz-active');
        nextBtn.textContent = "Пропустить";
        nextBtn.disabled = false;

        showNextQuizQuestion();
    }

    function showNextQuizQuestion() {
        resetCardState();
        quizFeedback.classList.add('hidden');
        quizOptionsContainer.innerHTML = '';
        quizAnswersDisabled = false;

        if (currentIndex >= preparedSequence.length) {
            showQuizResults();
            return;
        }

        const currentItem = preparedSequence[currentIndex];
        const question = currentItem.front;
        currentQuizCorrectAnswer = currentItem.back;
        const isQuestionEnglish = currentItem.lang === 'eng';

        updateCard(question, currentQuizCorrectAnswer);
        applyRandomFont(isQuestionEnglish);

        const correctAnswer = currentQuizCorrectAnswer;
        let allPossibleAnswersPool = [];

        if (engRegex.test(correctAnswer)) {
            allPossibleAnswersPool = wordPairs.map(p => p.eng);
        } else {
            allPossibleAnswersPool = wordPairs.map(p => p.rus);
        }

        const wrongAnswers = getRandomElements(
            allPossibleAnswersPool,
            3,
            [correctAnswer]
        );

        if (wrongAnswers.length < 3) {
            console.warn(`Could only find ${wrongAnswers.length} unique wrong answers for "${correctAnswer}". Need 3.`);
        }


        const options = shuffleArray([correctAnswer, ...wrongAnswers]);

        options.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.classList.add('btn', 'quiz-option-btn');
            button.dataset.answer = optionText;
            quizOptionsContainer.appendChild(button);
        });

         nextBtn.textContent = "Пропустить";
         nextBtn.disabled = false;
    }

    function handleQuizAnswer(event) {
        if (quizAnswersDisabled || !event.target.classList.contains('quiz-option-btn')) {
            return;
        }

        quizAnswersDisabled = true;
        const selectedButton = event.target;
        const selectedAnswer = selectedButton.dataset.answer;
        const isCorrect = selectedAnswer === currentQuizCorrectAnswer;

        const optionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.answer === currentQuizCorrectAnswer) {
                btn.classList.add('correct');
            } else if (btn === selectedButton) {
                 btn.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            quizScore++;
            quizFeedback.textContent = 'Правильно!';
            quizFeedback.className = 'quiz-feedback correct';
        } else {
            quizFeedback.textContent = `Неправильно. Верный ответ: ${currentQuizCorrectAnswer}`;
            quizFeedback.className = 'quiz-feedback incorrect';
             const currentQuestionData = preparedSequence[currentIndex];
            incorrectQuizAnswers.push({
                 question: currentQuestionData.front,
                 correctAnswer: currentQuestionData.back,
                 selectedAnswer: selectedAnswer
             });
        }
        quizFeedback.classList.remove('hidden');

        if (!wordCard.classList.contains('is-flipped')) {
             flipCard();
        }

         nextBtn.disabled = false;
         nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";

    }

     function handleNextClick() {
         if (currentMode?.startsWith('quiz')) {
              if (!quizAnswersDisabled) {
                  console.log("Skipped question");
                  quizFeedback.textContent = `Пропущено. Верный ответ: ${currentQuizCorrectAnswer}`;
                  quizFeedback.className = 'quiz-feedback incorrect';
                  quizFeedback.classList.remove('hidden');
                  quizAnswersDisabled = true;

                  const optionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
                   optionButtons.forEach(btn => {
                       btn.disabled = true;
                       if(btn.dataset.answer === currentQuizCorrectAnswer) {
                           btn.classList.add('correct');
                       }
                    });

                  const currentQuestionData = preparedSequence[currentIndex];
                  incorrectQuizAnswers.push({
                      question: currentQuestionData.front,
                      correctAnswer: currentQuestionData.back,
                      selectedAnswer: "[Пропущено]"
                  });

                  if (!wordCard.classList.contains('is-flipped')) {
                      flipCard();
                  }
                  nextBtn.disabled = false;
                  nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";

              } else {
                    currentIndex++;
                    showNextQuizQuestion();
              }

         } else {
              if (currentMode !== 'random' && currentIndex < preparedSequence.length) {
                   currentIndex++;
              }
              showNextCard();
         }
     }


    function showQuizResults() {
        cardAreaSection.classList.add('hidden');
        quizResultsArea.classList.remove('hidden');

        const totalQuestions = preparedSequence.length;
        quizScoreDisplay.textContent = `Ваш результат: ${quizScore} / ${totalQuestions}`;

        incorrectAnswersList.innerHTML = '';

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
