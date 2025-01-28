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

        chosenMode(dict);
    }

    function returnWords(dict) {
        nextButton.addEventListener("click", function() {
            const words = returnRandomWordFromDict(dict);
            renderWords(words);
        });
    }

    function returnFirstWords(dict) {          
        const randomIndex = Math.floor(Math.random() * dict.latin.words.length);
        frontWord.textContent = dict.latin.words[randomIndex];
        backWord.textContent = dict.cyrillic.words[randomIndex];
    }

    function returnRandomWordFromDict(dict) {
        let randomIndex = Math.floor(Math.random() * dict.latin.words.length),
            randomLang = Math.round(Math.random()),
            // randomLang = 0,
            randomWord, 
            translationOfRandomElement;

        if (randomLang === 0) {
            randomWord = dict.latin.words[randomIndex];
            translationOfRandomElement = dict.cyrillic.words[randomIndex];
        } else {
            randomWord = dict.cyrillic.words[randomIndex];
            translationOfRandomElement = dict.latin.words[randomIndex];
        }

        return [randomWord, translationOfRandomElement];
    }

    function renderWords(words) {
        setAnotherBackgrounds();
        frontWord.textContent = words[0];
        backWord.textContent = words[1];
    }

    function handleNextButtonClick() {
        const words = returnRandomWordFromDict(dict);
        renderWords(words);
    }

    function chosenMode(dict) {
        buttons[0].addEventListener("click", function() {
            startArea.style.display = "none";
            card.style.display = "block";
            returnFirstWords(dict);
            returnWords(dict);
        });

        buttons[1].addEventListener("click", function() {
            console.log("Clicked on the second version button");
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
        '#581845', '#900C3F', '#614751'];

        const index1 = Math.floor(Math.random() * colors.length);
        let index2;
        do {
          index2 = Math.floor(Math.random() * colors.length);
        } while (index2 === index1);
      
        return [colors[index1], colors[index2]];
      }
});
