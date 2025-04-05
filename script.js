document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileLoaderSection = document.getElementById('file-loader');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const startBtn = document.getElementById('start-btn');

    const modeSelectorSection = document.getElementById('mode-selector');
    const modeButtonsContainer = document.querySelector('.mode-buttons');

    const cardAreaSection = document.getElementById('card-area');
    const wordCard = document.getElementById('word-card');
    const cardFrontText = document.getElementById('card-front-text');
    const cardBackText = document.getElementById('card-back-text');
    const nextBtn = document.getElementById('next-btn');
    const changeModeBtn = document.getElementById('change-mode-btn');

    // --- State Variables ---
    let wordPairs = []; // Array of { eng: "...", rus: "..." }
    let currentMode = null;
    let currentIndex = 0;
    let preparedSequence = []; // For sequential modes: { front: "...", back: "..." }

    // --- Event Listeners ---
    fileInput.addEventListener('change', handleFileSelect);
    startBtn.addEventListener('click', showModeSelector);
    modeButtonsContainer.addEventListener('click', handleModeSelection); // Event delegation
    wordCard.addEventListener('click', flipCard);
    nextBtn.addEventListener('click', showNext);
    changeModeBtn.addEventListener('click', () => {
        // Reset to mode selection
        cardAreaSection.classList.add('hidden');
        modeSelectorSection.classList.remove('hidden');
        resetCardState(); // Unflip card if needed
    });

    // --- Functions ---

    // --- НОВОЕ: Функция для перемешивания массива (Fisher-Yates shuffle) ---
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        // Пока есть элементы для перемешивания
        while (currentIndex !== 0) {
            // Выбираем оставшийся элемент
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // Меняем его местами с текущим элементом
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Выбран файл: ${file.name}`;
            startBtn.disabled = false; // Enable start button
            readFileContent(file);
        } else {
            fileNameDisplay.textContent = '';
            startBtn.disabled = true;
            wordPairs = []; // Clear words if file is deselected
        }
    }

    function readFileContent(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseFileContent(event.target.result);
            if (wordPairs.length === 0) {
                alert('Не удалось найти пары слов в файле. Проверьте формат: "Слово - Перевод" на каждой строке.');
                fileNameDisplay.textContent = '';
                startBtn.disabled = true;
                fileInput.value = ''; // Reset file input
            }
        };
        reader.onerror = () => {
            alert('Ошибка чтения файла.');
            fileNameDisplay.textContent = '';
            startBtn.disabled = true;
            wordPairs = [];
            fileInput.value = ''; // Reset file input
        };
        reader.readAsText(file);
    }

    function parseFileContent(text) {
        wordPairs = []; // Reset previous words
        const lines = text.split('\n');
        const engRegex = /[a-zA-Z]/;

        for (const line of lines) {
            const parts = line.split(/\s*-\s*/); // Split by ' - ' allowing spaces
            if (parts.length === 2) {
                const part1 = parts[0].trim();
                const part2 = parts[1].trim();

                if (part1 && part2) {
                    // Determine language based on regex
                    if (engRegex.test(part1) && !engRegex.test(part2)) {
                        wordPairs.push({ eng: part1, rus: part2 });
                    } else if (!engRegex.test(part1) && engRegex.test(part2)) {
                        wordPairs.push({ eng: part2, rus: part1 });
                    } else {
                         console.warn(`Skipping line due to ambiguous languages or format: "${line}"`);
                    }
                }
            } else if (line.trim()) {
                console.warn(`Skipping line due to incorrect format (expected 'Word - Translation'): "${line}"`);
            }
        }
        console.log(`Loaded ${wordPairs.length} word pairs.`);
    }

    function showModeSelector() {
        if (wordPairs.length > 0) {
            fileLoaderSection.classList.add('hidden');
            modeSelectorSection.classList.remove('hidden');
        } else {
            alert('Сначала загрузите файл с парами слов.');
        }
    }

    function handleModeSelection(event) {
        if (event.target.classList.contains('mode-btn')) {
            currentMode = event.target.dataset.mode;
            currentIndex = 0; // Сбрасываем индекс
            prepareSequenceForMode(); // Готовим последовательность (уже с перемешиванием)

            // --- ИЗМЕНЕНИЕ: Включаем кнопку "Следующее" при старте нового режима ---
            nextBtn.disabled = wordPairs.length === 0 || preparedSequence.length === 0; // Выключаем если слов нет

            modeSelectorSection.classList.add('hidden');
            cardAreaSection.classList.remove('hidden');
            showNext(); // Показываем первую карточку
        }
    }

    function prepareSequenceForMode() {
        preparedSequence = [];
        if (!currentMode || wordPairs.length === 0) return;

        // --- ИЗМЕНЕНИЕ: Создаем перемешанную копию ОДИН РАЗ перед switch ---
        // Мы используем [...wordPairs], чтобы создать копию и не изменять исходный массив wordPairs
        const shuffledPairs = shuffleArray([...wordPairs]);

        switch (currentMode) {
            case 'toEndBoth':
                // Фаза 1: Rus -> Eng (из перемешанного списка)
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                // Фаза 2: Eng -> Rus (из того же перемешанного списка)
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
            case 'onlyRus':
                // Используем перемешанный список
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                break;
            case 'onlyEng':
                // Используем перемешанный список
                shuffledPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
            case 'random':
                // Случайный режим не требует предгенерации последовательности
                break;
        }
         console.log(`Prepared sequence for mode "${currentMode}" with ${preparedSequence.length} items.`);
    }

    function showNext() {
        if (wordPairs.length === 0) {
            updateCard("Нет слов", "Загрузите файл");
            nextBtn.disabled = true; // Отключаем кнопку если нет слов
            return;
        }
        resetCardState(); // Возвращаем карточку в исходное состояние (не перевернута)

        let front = "";
        let back = "";

        switch (currentMode) {
            case 'random':
                // Случайный режим остается бесконечным
                const randomIndex = Math.floor(Math.random() * wordPairs.length);
                const pair = wordPairs[randomIndex];
                const showEngFirst = Math.random() < 0.5;
                front = showEngFirst ? pair.eng : pair.rus;
                back = showEngFirst ? pair.rus : pair.eng;
                nextBtn.disabled = false; // Убедимся, что кнопка активна
                break;

            case 'toEndBoth':
            case 'onlyRus':
            case 'onlyEng':
                if (preparedSequence.length === 0) {
                    updateCard("Ошибка", "Нет данных для режима");
                    nextBtn.disabled = true;
                    return;
                }

                // --- ИЗМЕНЕНИЕ: Проверяем, не закончилась ли последовательность ---
                if (currentIndex >= preparedSequence.length) {
                    // Последовательность завершена
                    updateCard("Конец списка!", "Смените режим"); // Сообщение о завершении
                    nextBtn.disabled = true; // Отключаем кнопку "Следующее"
                    return; // Выходим из функции, не показывая больше карточек
                }

                // Если последовательность не закончена, показываем текущий элемент
                front = preparedSequence[currentIndex].front;
                back = preparedSequence[currentIndex].back;

                // --- ИЗМЕНЕНИЕ: Увеличиваем индекс ПОСЛЕ получения данных ---
                currentIndex++;
                // Кнопка остается активной, т.к. мы еще не проверили следующий шаг
                 nextBtn.disabled = false;

                break;

            default:
                 updateCard("Ошибка", "Неизвестный режим");
                 nextBtn.disabled = true;
                 return;
        }

        updateCard(front, back);
    }

     function updateCard(frontText, backText) {
        cardFrontText.textContent = frontText || " ";
        cardBackText.textContent = backText || " ";

        // Восстанавливаем стили по умолчанию для обратной стороны (на всякий случай)
        const backFace = wordCard.querySelector('.card-back');
        backFace.style.backgroundColor = '#d1e0eb';
        backFace.style.color = '#222';
    }

    function flipCard() {
        // Просто переворачиваем карточку
        wordCard.classList.toggle('is-flipped');
    }

    function resetCardState() {
         wordCard.classList.remove('is-flipped');
    }

});
