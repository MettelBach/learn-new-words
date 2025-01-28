document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.querySelector("#myForm"),
          inpFile = document.querySelector("#inpFile"),
          card = document.querySelector(".card"),
          nextButton = document.querySelector(".next"),
          frontWord = document.querySelector('.card-front-content h1'),
          backWord = document.querySelector('.card-back-content h1'),
          startArea = document.querySelector('.start-area'),
          buttons = document.querySelectorAll('.btns'),
          starButton = document.querySelector('.file-btn'),
          frontBackground = document.querySelector('.card-front'),
          backBackground = document.querySelector('.card-back'),
          statisticsSection = document.querySelector('.statistics'),
          controlButtons = document.querySelector('.control-buttons'),
          finishButton = document.querySelector('.finish'),
          restartButton = document.querySelector('.restart');

    // Statistics elements
    const correctCount = document.querySelector('.correct-count'),
          wrongCount = document.querySelector('.wrong-count'),
          skippedCount = document.querySelector('.skipped-count');

    // Statistics tracking
    let stats = {
        correct: 0,
        wrong: 0,
        skipped: 0
    };

    let currentIndex = 0;
    let currentDict = null;
    let isSequentialMode = false;

    myForm.addEventListener("submit", handleFormSubmit);
    
    // Add event listeners for control buttons
    document.querySelector('.correct').addEventListener('click', () => handleAnswer('correct'));
    document.querySelector('.wrong').addEventListener('click', () => handleAnswer('wrong'));
    document.querySelector('.skip').addEventListener('click', () => handleAnswer('skipped'));
    finishButton.addEventListener('click', showStatistics);
    restartButton.addEventListener('click', restartGame);

    function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append("inpFile", inpFile.files[0]);
        
        starButton.style.display = "block";
        getWordsFromFileWithWords(formData);
    }

    function getWordsFromFileWithWords(formData) {
        if (formData.has("inpFile")) {
            const file = formData.get("inpFile");
            const reader = new FileReader();

            reader.onload = function(event) {
                const fileContent = event.target.result;
                const wordsArray = fileContent.split(/\s*[\n-]+\s*/);

                myForm.style.display = "none";
                startArea.style.display = "block";

                addWordsToArray(wordsArray);
            };
            reader.readAsText(file);
        } else {
            console.error("Something went wrong");
        }
    }

    function addWordsToArray(wordsArray) {
        const wordsArrayRegex = /[a-zA-Z]/;
        let dict = {
            cyrillic: {
                words: [],
                check: []
            },
            latin: {
                words: [],
                check: []
            }
        };

        for (let word of wordsArray) {
            if (wordsArrayRegex.test(word.trim())) {
                dict.latin.words.push(word.trim().toLowerCase());
                dict.latin.check.push(true);
            } else {
                dict.cyrillic.words.push(word.trim().toLowerCase());
                dict.cyrillic.check.push(true);
            }
        }

        currentDict = dict;
        chosenMode(dict);
    }

    function handleAnswer(type) {
        // Update statistics
        stats[type]++;
        
        // Show next word
        if (isSequentialMode) {
            const words = returnSequentialWords(currentDict);
            if (words) {
                renderWords(words);
            }
        } else {
            const words = returnRandomWordFromDict(currentDict);
            renderWords(words);
        }
    }

    function returnSequentialWords(dict) {
        if (currentIndex >= dict.latin.words.length) {
            showStatistics();
            return null;
        }
        
        const words = [dict.latin.words[currentIndex], dict.cyrillic.words[currentIndex]];
        currentIndex++;
        return words;
    }

    function returnRandomWordFromDict(dict) {
        let randomIndex = Math.floor(Math.random() * dict.latin.words.length);
        // Always show English (latin) first
        const randomWord = dict.latin.words[randomIndex];
        const translationOfRandomElement = dict.cyrillic.words[randomIndex];
        
        return [randomWord, translationOfRandomElement];
    }

    function renderWords(words) {
        if (words) {
            setAnotherBackgrounds();
            frontWord.textContent = words[0];
            backWord.textContent = words[1];
        }
    }

    function chosenMode(dict) {
        // Infinity random mode
        buttons[0].addEventListener("click", function() {
            setupGame(dict, false);
        });

        // To end mode
        buttons[1].addEventListener("click", function() {
            setupGame(dict, true);
        });
    }

    function setupGame(dict, sequential) {
        startArea.style.display = "none";
        card.style.display = "block";
        statisticsSection.style.display = "none";
        isSequentialMode = sequential;
        currentIndex = 0;
        stats = { correct: 0, wrong: 0, skipped: 0 };
        
        // Show/hide finish button based on mode
        finishButton.style.display = sequential ? "none" : "block";
        
        // Show first word
        const words = sequential ? returnSequentialWords(dict) : returnRandomWordFromDict(dict);
        renderWords(words);
    }

    function showStatistics() {
        card.style.display = "none";
        statisticsSection.style.display = "block";
        
        // Update statistics display
        correctCount.textContent = stats.correct;
        wrongCount.textContent = stats.wrong;
        skippedCount.textContent = stats.skipped;
    }

    function restartGame() {
        statisticsSection.style.display = "none";
        startArea.style.display = "block";
        // Reset statistics
        stats = { correct: 0, wrong: 0, skipped: 0 };
        currentIndex = 0;
    }

    function setAnotherBackgrounds() {
        const colors = getRandomColors();
        frontBackground.style.backgroundColor = colors[0];
        backBackground.style.backgroundColor = colors[1];
    }

    function getRandomColors() {
        const colors = [
            '#4f4a2a', '#b00b1e', '#3f0e07', 
            '#4f4a2a', '#000080', '#801818', 
            '#556b2f', '#672c47', '#2c4767', 
            '#6f4e37', '#81655F', '#000000', 
            '#581845', '#900C3F', '#614751'
        ];

        const index1 = Math.floor(Math.random() * colors.length);
        let index2;
        do {
            index2 = Math.floor(Math.random() * colors.length);
        } while (index2 === index1);
      
        return [colors[index1], colors[index2]];
    }
});
