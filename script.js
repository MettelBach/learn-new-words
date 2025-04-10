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

        // ... (все существующие переменные до dictionaryTableBody)
        const dictionaryTableBody = document.getElementById('dictionary-table-body');
        const dictionaryBackBtn = document.getElementById('dictionary-back-btn');
        // Новые элементы для добавления слов
        const addWordForm = document.getElementById('add-word-form');
        const newRusInput = document.getElementById('new-rus-input');
        const newEngInput = document.getElementById('new-eng-input');
        const addWordBtn = document.getElementById('add-word-btn');
    
    
        let wordPairs = [];
        let currentMode = null;
        let currentIndex = 0;
        let preparedSequence = [];
        const availableFonts = [
            'font-caveat', 'font-indie', 'font-merriweather',
            'font-roboto-slab', 'font-rubik-mono'
        ];
        const engRegex = /[a-zA-Z]/;
        const rusRegex = /[а-яА-ЯёЁ]/; // Добавим для валидации русского
    
        let quizScore = 0;
        let incorrectQuizAnswers = [];
        let currentQuizCorrectAnswer = '';
        let quizAnswersDisabled = false;
    
        // --- Существующие обработчики событий ---
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
    
        // --- Новые обработчики событий ---
        addWordBtn.addEventListener('click', handleAddWord);
        // Используем делегирование событий для кнопок редактирования/удаления
        dictionaryTableBody.addEventListener('click', handleDictionaryAction);
    
    
        // --- Существующие функции (shuffleArray, getRandomElements, handleFileSelect, resetApp, readFileContent, parseFileContent) ---
        // Оставим их без изменений
    
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
            goToFileLoader(); // Сбрасываем на начальный экран
        }
    
    
        function readFileContent(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                parseFileContent(event.target.result);
                if (wordPairs.length === 0 && event.target.result.trim()) { // Проверяем, был ли файл не пустым
                    alert('Не удалось найти пары слов в файле. Проверьте формат: "Слово - Перевод" на каждой строке. Убедитесь, что одно слово русское, другое - английское.');
                    resetApp();
                } else if (wordPairs.length > 0) {
                     console.log(`Loaded ${wordPairs.length} word pairs.`);
                } else {
                    console.log("Файл пуст или не содержит валидных пар.");
                    // Не сбрасываем приложение, позволяем пользователю добавить слова вручную
                    // startBtn все еще будет disabled, т.к. wordPairs пуст
                }
            };
            reader.onerror = () => {
                alert('Ошибка чтения файла.');
                resetApp();
            };
            reader.readAsText(file);
        }
    
        function parseFileContent(text) {
            wordPairs = []; // Очищаем перед парсингом нового файла
            const lines = text.split('\n');
    
            for (const line of lines) {
                const parts = line.split(/\s*-\s*/);
                if (parts.length === 2) {
                    const part1 = parts[0].trim();
                    const part2 = parts[1].trim();
                    if (part1 && part2) {
                        // Определяем языки более строго
                        const part1IsEng = engRegex.test(part1) && !rusRegex.test(part1);
                        const part1IsRus = rusRegex.test(part1) && !engRegex.test(part1);
                        const part2IsEng = engRegex.test(part2) && !rusRegex.test(part2);
                        const part2IsRus = rusRegex.test(part2) && !engRegex.test(part2);
    
                        if (part1IsEng && part2IsRus) {
                            wordPairs.push({ eng: part1, rus: part2 });
                        } else if (part1IsRus && part2IsEng) {
                            wordPairs.push({ eng: part2, rus: part1 });
                        } else {
                            console.warn(`Skipping line due to ambiguous or mixed languages: "${line}"`);
                        }
                    }
                } else if (line.trim()) {
                    console.warn(`Skipping line due to incorrect format: "${line}"`);
                }
            }
        }
    
    
        // --- Функции навигации (showModeSelector, goToFileLoader, goToModeSelector) ---
        // Оставим без изменений
    
        function showModeSelector() {
            // Теперь можно перейти к выбору режима, даже если слов 0 (для ручного добавления в словаре)
            //if (wordPairs.length > 0) {
                fileLoaderSection.classList.add('hidden');
                dictionaryViewSection.classList.add('hidden');
                cardAreaSection.classList.add('hidden');
                quizResultsArea.classList.add('hidden');
                modeSelectorSection.classList.remove('hidden');
           // } else {
            //    alert('Сначала загрузите файл с парами слов или добавьте их вручную в режиме "Словарь".');
           // }
        }
    
        function goToFileLoader() {
            modeSelectorSection.classList.add('hidden');
            cardAreaSection.classList.add('hidden');
            quizResultsArea.classList.add('hidden');
            dictionaryViewSection.classList.add('hidden');
            fileLoaderSection.classList.remove('hidden');
            // Не сбрасываем wordPairs здесь, чтобы можно было вернуться к словарю
            // resetApp(); // Убрали resetApp отсюда
            // Сбросим только имя файла и кнопку старт, если слова остались
            fileNameDisplay.textContent = '';
            startBtn.disabled = true; // Делаем неактивной, пока не выбран новый файл
            fileInput.value = ''; // Очищаем инпут файла
    
        }
    
    
        function goToModeSelector() {
            cardAreaSection.classList.add('hidden');
            quizResultsArea.classList.add('hidden');
            dictionaryViewSection.classList.add('hidden');
            modeSelectorSection.classList.remove('hidden');
            resetCardState();
        }
    
    
        // --- Основная логика режимов ---
    
        function handleModeSelection(event) {
            if (!event.target.classList.contains('mode-btn')) return;
    
            currentMode = event.target.dataset.mode;
            currentIndex = 0;
            preparedSequence = []; // Сбрасываем последовательность при смене режима
            resetCardState();
    
            modeSelectorSection.classList.add('hidden');
    
            if (currentMode === 'dictionary') {
                showDictionary(); // Переходим к показу словаря
                dictionaryViewSection.classList.remove('hidden'); // Показываем секцию словаря
            }
            else if (currentMode.startsWith('quiz')) {
                // Проверка на кол-во слов для викторины
                if (wordPairs.length < 4) {
                     alert(`Для викторины нужно минимум 4 слова. У вас ${wordPairs.length}. Загрузите файл или добавьте слова в режиме "Словарь".`);
                     goToModeSelector(); // Возвращаем к выбору режима
                     return;
                 }
                startQuiz();
            }
            else {
                // Проверка на наличие слов для карточных режимов
                if (wordPairs.length === 0) {
                    alert("Нет слов для начала этого режима. Загрузите файл или добавьте слова в режиме 'Словарь'.");
                    goToModeSelector();
                    return;
                }
                prepareSequenceForCardMode();
                // Дополнительная проверка, если подготовка не удалась (хотя не должно при >0 слов)
                 if (currentMode !== 'random' && preparedSequence.length === 0) {
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
    
        // --- Обновленная функция показа словаря ---
        function showDictionary() {
            dictionaryTableBody.innerHTML = ''; // Очищаем таблицу перед заполнением
            if (wordPairs.length === 0) {
                const row = dictionaryTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 3; // Теперь 3 колонки
                cell.textContent = 'Словарь пуст. Загрузите файл или добавьте слова ниже.';
                cell.style.textAlign = 'center';
            } else {
                // Создаем копию с индексами для сортировки, но сохранения оригинальных индексов
                const pairsWithIndex = wordPairs.map((pair, index) => ({ ...pair, originalIndex: index }));
                // Сортируем по русскому слову
                const sortedPairs = pairsWithIndex.sort((a, b) => a.rus.localeCompare(b.rus, 'ru'));
    
                sortedPairs.forEach(item => {
                    const row = dictionaryTableBody.insertRow();
                    row.dataset.index = item.originalIndex; // Сохраняем оригинальный индекс в строке
    
                    const cellRus = row.insertCell();
                    const cellEng = row.insertCell();
                    const cellActions = row.insertCell(); // Ячейка для кнопок
    
                    cellRus.textContent = item.rus;
                    cellEng.textContent = item.eng;
    
                    // Кнопка Редактировать
                    const editBtn = document.createElement('button');
                    editBtn.textContent = '✏️'; // Или 'Ред.'
                    editBtn.classList.add('action-btn', 'edit-btn');
                    editBtn.title = "Редактировать";
                    editBtn.dataset.index = item.originalIndex; // Дублируем индекс для удобства в обработчике
                    cellActions.appendChild(editBtn);
    
                    // Кнопка Удалить
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = '❌'; // Или 'Удал.'
                    deleteBtn.classList.add('action-btn', 'delete-btn');
                    deleteBtn.title = "Удалить";
                    deleteBtn.dataset.index = item.originalIndex; // Дублируем индекс
                    cellActions.appendChild(deleteBtn);
                });
            }
            // Показываем секцию словаря (на всякий случай, если вызывается не из handleModeSelection)
            dictionaryViewSection.classList.remove('hidden');
            // Скрываем остальные секции
            fileLoaderSection.classList.add('hidden');
            modeSelectorSection.classList.add('hidden');
            cardAreaSection.classList.add('hidden');
            quizResultsArea.classList.add('hidden');
        }
    
        // --- Новые функции для CRUD операций в словаре ---
    
        function handleDictionaryAction(event) {
            const target = event.target;
            // Ищем кнопку с нужным классом (или родителя, если клик по иконке внутри кнопки)
            const actionButton = target.closest('.action-btn');
    
            if (!actionButton) return; // Клик не по кнопке действия
    
            const index = parseInt(actionButton.dataset.index, 10);
    
            if (isNaN(index) || index < 0 || index >= wordPairs.length) {
                console.error("Invalid index for dictionary action:", actionButton.dataset.index);
                return;
            }
    
            if (actionButton.classList.contains('edit-btn')) {
                handleEditWord(index);
            } else if (actionButton.classList.contains('delete-btn')) {
                handleDeleteWord(index);
            }
        }
    
    
        function handleAddWord() {
            const newRus = newRusInput.value.trim();
            const newEng = newEngInput.value.trim();
    
            if (!newRus || !newEng) {
                alert('Оба поля (русское и английское слово) должны быть заполнены.');
                return;
            }
    
            // Простая проверка на язык (можно улучшить)
            if (!rusRegex.test(newRus) || engRegex.test(newRus)) {
                 alert('Поле "Русский" должно содержать только русские буквы.');
                 return;
            }
             if (!engRegex.test(newEng) || rusRegex.test(newEng)) {
                 alert('Поле "Английский" должно содержать только английские буквы.');
                 return;
             }
    
    
            // Проверка на дубликаты (опционально, но полезно)
            const exists = wordPairs.some(pair => pair.rus === newRus && pair.eng === newEng);
            if (exists) {
                alert('Такая пара слов уже существует в словаре.');
                return;
            }
    
            wordPairs.push({ rus: newRus, eng: newEng });
            console.log("Added new word pair:", { rus: newRus, eng: newEng });
    
            // Очистить поля ввода
            newRusInput.value = '';
            newEngInput.value = '';
    
            // Обновить отображение таблицы словаря
            showDictionary();
        }
    
        function handleEditWord(index) {
            const pairToEdit = wordPairs[index];
            if (!pairToEdit) {
                console.error("Pair not found for editing at index:", index);
                return;
            }
    
            const updatedRus = prompt(`Редактировать русское слово:`, pairToEdit.rus);
            // Если пользователь нажал "Отмена", prompt вернет null
            if (updatedRus === null) return; // Прерываем редактирование
    
            const updatedEng = prompt(`Редактировать английский перевод:`, pairToEdit.eng);
            if (updatedEng === null) return; // Прерываем редактирование
    
            const trimmedRus = updatedRus.trim();
            const trimmedEng = updatedEng.trim();
    
            if (!trimmedRus || !trimmedEng) {
                alert('Оба поля должны быть заполнены.');
                // Можно вернуть значения обратно или дать еще попытку, но пока просто прерываем
                return;
            }
    
             // Валидация языков при редактировании
             if (!rusRegex.test(trimmedRus) || engRegex.test(trimmedRus)) {
                  alert('Русское слово должно содержать только русские буквы.');
                  return;
             }
              if (!engRegex.test(trimmedEng) || rusRegex.test(trimmedEng)) {
                  alert('Английское слово должно содержать только английские буквы.');
                  return;
              }
    
    
            // Обновляем пару в массиве
            wordPairs[index] = { rus: trimmedRus, eng: trimmedEng };
            console.log(`Updated word pair at index ${index}:`, wordPairs[index]);
    
            // Обновляем таблицу
            showDictionary();
        }
    
        function handleDeleteWord(index) {
            const pairToDelete = wordPairs[index];
             if (!pairToDelete) {
                 console.error("Pair not found for deletion at index:", index);
                 return;
             }
    
            // Запрос подтверждения
            if (confirm(`Вы уверены, что хотите удалить пару "${pairToDelete.rus} - ${pairToDelete.eng}"?`)) {
                wordPairs.splice(index, 1); // Удаляем элемент из массива
                console.log("Deleted word pair at index:", index);
                // Обновляем таблицу
                showDictionary();
            }
        }
    
    
        // --- Существующие функции для карточек и викторины ---
        // (prepareSequenceForCardMode, showNextCard, applyRandomFont, updateCard,
        //  flipCard, resetCardState, startQuiz, showNextQuizQuestion,
        //  handleQuizAnswer, handleNextClick, showQuizResults)
        // Оставляем их без изменений, но нужно помнить, что wordPairs может меняться.
        // При переходе из режима Словаря в другой режим, prepareSequence будет создаваться заново
        // на основе актуального wordPairs, так что все должно работать корректно.
    
         function prepareSequenceForCardMode() {
             // Эта функция теперь будет использовать актуальный `wordPairs`
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
                updateCard("Нет слов", "Загрузите файл или добавьте в словаре");
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
                        back = "Загрузите файл или добавьте в словаре";
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
                    // Переподготовка последовательности не нужна здесь, она делается при входе в режим
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
                applyRandomFont(false); // Сбросить шрифт для сообщения "Конец списка"
            }
        }
    
         function applyRandomFont(isEnglish) {
             cardFrontText.classList.remove(...availableFonts);
    
             if (isEnglish && availableFonts.length > 0) {
                 const preferredFonts = ['font-caveat', 'font-indie'];
                 const otherFonts = availableFonts.filter(f => !preferredFonts.includes(f));
                 let selectedFont = null;
                 const chanceForPreferred = 0.7; // 70% шанс на "рукописный"
    
                 const usePreferred = preferredFonts.length > 0 && Math.random() < chanceForPreferred;
    
                 if (usePreferred && preferredFonts.length > 0) {
                     selectedFont = preferredFonts[Math.floor(Math.random() * preferredFonts.length)];
                 } else if (otherFonts.length > 0) {
                     selectedFont = otherFonts[Math.floor(Math.random() * otherFonts.length)];
                 } else if (preferredFonts.length > 0) { // Fallback to preferred if others list is empty
                     selectedFont = preferredFonts[Math.floor(Math.random() * preferredFonts.length)];
                 }
    
                 if (selectedFont) {
                    cardFrontText.classList.add(selectedFont);
                    // console.log("Applied font:", selectedFont);
                 } else {
                    // console.log("No font applied (list empty or error?)");
                 }
             } else {
                  // console.log("Applied default font (Russian word or no fonts available)");
             }
         }
    
    
         function updateCard(frontText, backText) {
             cardFrontText.textContent = frontText || " "; // Используем пробел, если текст пуст
             cardBackText.textContent = backText || " ";
         }
    
         function flipCard() {
             wordCard.classList.toggle('is-flipped');
         }
    
         function resetCardState() {
             wordCard.classList.remove('is-flipped');
             cardFrontText.classList.remove(...availableFonts); // Сброс шрифта
         }
    
         function startQuiz() {
             // Проверка на количество слов происходит в handleModeSelection
             currentIndex = 0;
             quizScore = 0;
             incorrectQuizAnswers = [];
             preparedSequence = []; // Сбрасываем на всякий случай
    
             const shuffledPairs = shuffleArray([...wordPairs]); // Используем актуальный wordPairs
    
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
                 default: // Не должно произойти из-за проверок выше
                     console.error("Unknown quiz mode:", currentMode);
                     goToModeSelector();
                     return;
             }
    
             console.log(`Prepared quiz sequence for mode "${currentMode}" with ${preparedSequence.length} questions.`);
    
             cardAreaSection.classList.remove('hidden');
             quizOptionsContainer.classList.remove('hidden');
             quizFeedback.classList.add('hidden');
             cardInstructions.classList.add('hidden'); // Скрываем инструкцию для карточек
             cardControls.classList.remove('hidden');
             wordCard.classList.add('quiz-active'); // Стиль для викторины
             nextBtn.textContent = "Пропустить"; // Кнопка "Далее" становится "Пропустить"
             nextBtn.disabled = false;
    
             showNextQuizQuestion();
         }
    
         function showNextQuizQuestion() {
             resetCardState(); // Сбросить переворот и шрифт
             quizFeedback.classList.add('hidden');
             quizOptionsContainer.innerHTML = ''; // Очистить кнопки опций
             quizAnswersDisabled = false; // Разрешить ответы
    
             if (currentIndex >= preparedSequence.length) {
                 showQuizResults(); // Показать результаты, если вопросы кончились
                 return;
             }
    
             const currentItem = preparedSequence[currentIndex];
             const question = currentItem.front;
             currentQuizCorrectAnswer = currentItem.back;
             const isQuestionEnglish = currentItem.lang === 'eng';
    
             updateCard(question, currentQuizCorrectAnswer); // Показываем вопрос, ответ пока скрыт
             applyRandomFont(isQuestionEnglish); // Применяем шрифт к вопросу
    
             // --- Генерация опций ответа ---
             const correctAnswer = currentQuizCorrectAnswer;
             let allPossibleAnswersPool = [];
    
             // Собираем пул ответов на том же языке, что и правильный ответ
             if (engRegex.test(correctAnswer)) { // Если правильный ответ - английский
                 allPossibleAnswersPool = wordPairs.map(p => p.eng);
             } else { // Если правильный ответ - русский
                 allPossibleAnswersPool = wordPairs.map(p => p.rus);
             }
    
             // Получаем 3 неправильных ответа, исключая правильный
             const wrongAnswers = getRandomElements(
                 allPossibleAnswersPool,
                 3,
                 [correctAnswer] // Исключаем правильный ответ
             );
    
             if (wrongAnswers.length < 3) {
                 console.warn(`Could only find ${wrongAnswers.length} unique wrong answers for "${correctAnswer}". Need 3. Quiz options might be limited.`);
                 // В этом случае викторина все равно будет работать, но с меньшим числом неправильных опций
             }
    
             // Собираем все опции (правильный + неправильные) и перемешиваем
             const options = shuffleArray([correctAnswer, ...wrongAnswers]);
    
             // Создаем кнопки для опций
             options.forEach(optionText => {
                 const button = document.createElement('button');
                 button.textContent = optionText;
                 button.classList.add('btn', 'quiz-option-btn');
                 button.dataset.answer = optionText; // Сохраняем ответ в data-атрибуте
                 quizOptionsContainer.appendChild(button);
             });
    
              nextBtn.textContent = "Пропустить"; // Убедимся, что текст кнопки верный
              nextBtn.disabled = false;
         }
    
    
         function handleQuizAnswer(event) {
             if (quizAnswersDisabled || !event.target.classList.contains('quiz-option-btn')) {
                 return; // Игнорируем, если ответы заблокированы или клик не по кнопке опции
             }
    
             quizAnswersDisabled = true; // Блокируем дальнейшие ответы на этот вопрос
             const selectedButton = event.target;
             const selectedAnswer = selectedButton.dataset.answer;
             const isCorrect = selectedAnswer === currentQuizCorrectAnswer;
    
             // Подсветка кнопок
             const optionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
             optionButtons.forEach(btn => {
                 btn.disabled = true; // Делаем все кнопки неактивными
                 if (btn.dataset.answer === currentQuizCorrectAnswer) {
                     btn.classList.add('correct'); // Подсветить правильный ответ зеленым
                 } else if (btn === selectedButton) { // Если это выбранный *неправильный* ответ
                     btn.classList.add('incorrect'); // Подсветить красным
                 }
             });
    
             // Обратная связь и счет
             if (isCorrect) {
                 quizScore++;
                 quizFeedback.textContent = 'Правильно!';
                 quizFeedback.className = 'quiz-feedback correct'; // Класс для стилизации
             } else {
                 quizFeedback.textContent = `Неправильно. Верный ответ: ${currentQuizCorrectAnswer}`;
                 quizFeedback.className = 'quiz-feedback incorrect';
                  // Записываем ошибку
                  const currentQuestionData = preparedSequence[currentIndex];
                 incorrectQuizAnswers.push({
                     question: currentQuestionData.front,
                     correctAnswer: currentQuestionData.back,
                     selectedAnswer: selectedAnswer
                 });
             }
             quizFeedback.classList.remove('hidden'); // Показываем фидбек
    
             // Показываем правильный ответ на обратной стороне карточки
             if (!wordCard.classList.contains('is-flipped')) {
                  flipCard();
             }
    
              // Подготовка кнопки "Далее"
              nextBtn.disabled = false; // Разблокируем кнопку "Далее"
              nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";
         }
    
          function handleNextClick() {
              if (currentMode?.startsWith('quiz')) {
                   // Если клик по кнопке "Пропустить" (до выбора ответа)
                   if (!quizAnswersDisabled) {
                        console.log("Skipped question");
                        quizFeedback.textContent = `Пропущено. Верный ответ: ${currentQuizCorrectAnswer}`;
                        quizFeedback.className = 'quiz-feedback incorrect'; // Считаем пропуск ошибкой
                        quizFeedback.classList.remove('hidden');
                        quizAnswersDisabled = true; // Блокируем выбор
    
                        // Показываем правильный ответ и деактивируем кнопки
                        const optionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-btn');
                         optionButtons.forEach(btn => {
                             btn.disabled = true;
                             if(btn.dataset.answer === currentQuizCorrectAnswer) {
                                  btn.classList.add('correct'); // Показать правильный
                             }
                         });
    
                        // Записываем пропуск как ошибку
                        const currentQuestionData = preparedSequence[currentIndex];
                        incorrectQuizAnswers.push({
                            question: currentQuestionData.front,
                            correctAnswer: currentQuestionData.back,
                            selectedAnswer: "[Пропущено]"
                        });
    
                        // Показываем правильный ответ на карточке
                        if (!wordCard.classList.contains('is-flipped')) {
                             flipCard();
                        }
    
                        // Готовим кнопку к следующему шагу
                        nextBtn.disabled = false; // Кнопка уже готова к переходу
                        nextBtn.textContent = (currentIndex + 1 >= preparedSequence.length) ? "Показать результаты" : "Следующий вопрос";
    
                   } else { // Если клик по кнопке "Следующий вопрос" или "Показать результаты" (после ответа/пропуска)
                        currentIndex++; // Переходим к следующему индексу
                        showNextQuizQuestion(); // Показываем следующий вопрос или результаты
                   }
    
              } else { // Логика для не-квизовых режимов
                    if (currentMode !== 'random' && preparedSequence.length > 0 && currentIndex < preparedSequence.length) {
                        currentIndex++; // Увеличиваем индекс для режимов "до конца"
                    }
                   showNextCard(); // Показываем следующую карточку
              }
          }
    
    
         function showQuizResults() {
             cardAreaSection.classList.add('hidden'); // Скрываем карточку/викторину
             quizResultsArea.classList.remove('hidden'); // Показываем результаты
    
             const totalQuestions = preparedSequence.length;
             quizScoreDisplay.textContent = `Ваш результат: ${quizScore} / ${totalQuestions}`;
    
             incorrectAnswersList.innerHTML = ''; // Очищаем список ошибок
    
             if (totalQuestions === 0) { // На случай, если викторина запустилась без вопросов (не должно быть из-за проверок)
                 const li = document.createElement('li');
                 li.textContent = 'Нет вопросов в этой викторине.';
                 li.style.backgroundColor = '#eee'; // Нейтральный фон
                 li.style.borderColor = '#ccc';
                 li.style.color = '#555';
                 incorrectAnswersList.appendChild(li);
             } else if (incorrectQuizAnswers.length === 0) {
                  const li = document.createElement('li');
                 li.textContent = 'Отлично! Все ответы верные.';
                 li.style.backgroundColor = '#d4edda'; // Зеленый фон для успеха
                 li.style.borderColor = '#c3e6cb';
                 li.style.color = '#155724';
                 incorrectAnswersList.appendChild(li);
             } else {
                 incorrectQuizAnswers.forEach(item => {
                     const li = document.createElement('li');
                      // Используем innerHTML для вставки span'ов со стилями
                      let incorrectText = `<span class="orig">${item.question}</span> &rarr; прав: <span class="trans">${item.correctAnswer}</span>`;
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
    
    }); // Конец DOMContentLoaded
