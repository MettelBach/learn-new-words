 
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
                         // Optionally handle cases where both/neither are detected as English
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
            currentIndex = 0;
            prepareSequenceForMode(); // Prepare the word order if needed

            modeSelectorSection.classList.add('hidden');
            cardAreaSection.classList.remove('hidden');
            showNext(); // Display the first card of the selected mode
        }
    }

    function prepareSequenceForMode() {
        preparedSequence = [];
        if (!currentMode || wordPairs.length === 0) return;

        switch (currentMode) {
            case 'toEndBoth':
                // Phase 1: Rus -> Eng
                wordPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                // Phase 2: Eng -> Rus
                wordPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
            case 'onlyRus':
                // --- ИЗМЕНЕНИЕ 1 ---
                // Было: preparedSequence.push({ front: pair.rus, back: "" });
                // Стало: Добавляем английский перевод на обратную сторону
                wordPairs.forEach(pair => preparedSequence.push({ front: pair.rus, back: pair.eng }));
                break;
            case 'onlyEng':
                // --- ИЗМЕНЕНИЕ 1 ---
                // Было: preparedSequence.push({ front: pair.eng, back: "" });
                // Стало: Добавляем русский перевод на обратную сторону
                wordPairs.forEach(pair => preparedSequence.push({ front: pair.eng, back: pair.rus }));
                break;
            case 'random':
                // No sequence needed, handled directly in showNext
                break;
        }
         console.log(`Prepared sequence for mode "${currentMode}" with ${preparedSequence.length} items.`);
    }

    function showNext() {
        if (wordPairs.length === 0) {
            updateCard("Нет слов", "Загрузите файл");
            return;
        }
        resetCardState(); // Ensure card is facing front

        let front = "";
        let back = "";

        switch (currentMode) {
            case 'random':
                const randomIndex = Math.floor(Math.random() * wordPairs.length);
                const pair = wordPairs[randomIndex];
                const showEngFirst = Math.random() < 0.5;
                front = showEngFirst ? pair.eng : pair.rus;
                back = showEngFirst ? pair.rus : pair.eng;
                break;

            case 'toEndBoth':
            case 'onlyRus':
            case 'onlyEng':
                if (preparedSequence.length === 0) {
                    // This case might happen if file loading failed after selecting mode,
                    // or if wordPairs was empty initially.
                     updateCard("Нет слов", "Проверьте файл или режим");
                     return;
                }
                 if (currentIndex >= preparedSequence.length) {
                     // Optionally, show a message that the list ended or disable next button
                     // For now, just stop or loop back (looping back as originally implemented)
                     currentIndex = 0; // Loop back
                     // updateCard("Конец списка", "Смените режим или начните заново");
                     // return; // Or stop here
                 }
                 // Make sure preparedSequence[currentIndex] exists before accessing properties
                 if (currentIndex < preparedSequence.length) {
                    front = preparedSequence[currentIndex].front;
                    back = preparedSequence[currentIndex].back;
                    currentIndex++;
                 } else {
                    // Should not happen if looping or stopping correctly, but as a fallback:
                    updateCard("Ошибка", "Неверный индекс");
                    return;
                 }
                break;
            default:
                 updateCard("Ошибка", "Неизвестный режим");
                 return; // Stop if mode is invalid
        }

        updateCard(front, back);
    }

     function updateCard(frontText, backText) {
        cardFrontText.textContent = frontText || " "; // Use space if empty
        cardBackText.textContent = backText || " ";  // Use space if empty

        // --- УДАЛЕНИЕ/ИЗМЕНЕНИЕ ЛОГИКИ СТИЛИЗАЦИИ ---
        // Убираем специальное форматирование для "пустой" обратной стороны,
        // так как теперь она всегда должна содержать перевод в этих режимах.
        const backFace = wordCard.querySelector('.card-back');
        // Просто устанавливаем стандартные стили (если они вдруг менялись)
        backFace.style.backgroundColor = '#d1e0eb'; // Restore default style
        backFace.style.color = '#222';         // Restore default style

        /* Старая логика, которая теперь не нужна:
        if (!backText || backText.trim() === "") {
             backFace.style.backgroundColor = '#f8f9fa'; // Lighter background
             backFace.style.color = '#adb5bd'; // Lighter text
             cardBackText.textContent = '-'; // Placeholder for empty back
        } else {
             backFace.style.backgroundColor = '#d1e0eb'; // Restore default style
             backFace.style.color = '#222';
        }
        */
    }

    function flipCard() {
        // --- ИЗМЕНЕНИЕ 2 ---
        // Убираем условие, которое запрещало переворот в режимах onlyRus/onlyEng
        /* Старое условие:
        if ((currentMode === 'onlyRus' || currentMode === 'onlyEng') && cardBackText.textContent === '-') {
             return;
        }
        */
        // Теперь просто переворачиваем карточку при клике в любом случае
        wordCard.classList.toggle('is-flipped');
    }

    function resetCardState() {
         wordCard.classList.remove('is-flipped');
    }

});
