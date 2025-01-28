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
          backBackground = document.querySelector('.card-back');

    let currentIndex = 0;
    let currentDict = null;
    let isSequentialMode = false;

    myForm.addEventListener("submit", handleFormSubmit);
    nextButton.addEventListener("click", handleNextButtonClick);

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

    function returnSequentialWords(dict) {
        if (currentIndex >= dict.latin.words.length) {
            alert("You've reached the end of the word list!");
            currentIndex = 0;
        }
        
        const words = [dict.latin.words[currentIndex], dict.cyrillic.words[currentIndex]];
        currentIndex++;
        return words;
    }

    function returnWords(dict) {
        nextButton.addEventListener("click", function() {
            const words = isSequentialMode ? 
                         returnSequentialWords(dict) : 
                         returnRandomWordFromDict(dict);
            renderWords(words);
        });
    }

    function returnFirstWords(dict) {          
        frontWord.textContent = dict.latin.words[0];
        backWord.textContent = dict.cyrillic.words[0];
        currentIndex = 1;
    }

    function returnRandomWordFromDict(dict) {
        let randomIndex = Math.floor(Math.random() * dict.latin.words.length);
        // Always show English (latin) first
        const randomWord = dict.latin.words[randomIndex];
        const translationOfRandomElement = dict.cyrillic.words[randomIndex];
        
        return [randomWord, translationOfRandomElement];
    }

    function renderWords(words) {
        setAnotherBackgrounds();
        frontWord.textContent = words[0];
        backWord.textContent = words[1];
    }

    function handleNextButtonClick() {
        const words = isSequentialMode ? 
                     returnSequentialWords(currentDict) : 
                     returnRandomWordFromDict(currentDict);
        renderWords(words);
    }

    function chosenMode(dict) {
        // Infinity random mode
        buttons[0].addEventListener("click", function() {
            startArea.style.display = "none";
            card.style.display = "block";
            isSequentialMode = false;
            returnFirstWords(dict);
            returnWords(dict);
        });

        // To end mode
        buttons[1].addEventListener("click", function() {
            startArea.style.display = "none";
            card.style.display = "block";
            isSequentialMode = true;
            currentIndex = 0;
            returnFirstWords(dict);
            returnWords(dict);
        });
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
