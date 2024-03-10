document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.querySelector("#myForm");
    const inpFile = document.querySelector("#inpFile");
    const inpFileLabel = document.querySelector("#inpFileLabel");
    const card = document.querySelector(".card");
    const nextButton = document.querySelector(".next");
    const frontWord = document.querySelector('.card-front-content h1');
    const backWord  = document.querySelector('.card-back-content h1');

    inpFileLabel.addEventListener("click", function() {
        inpFile.click();
    });

    myForm.addEventListener("submit", handleFormSubmit);
    nextButton.addEventListener("click", handleNextButtonClick);

    function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append("inpFile", inpFile.files[0]);
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
                card.style.display = "block";

                addWordsToArray(wordsArray);
            };
            reader.readAsText(file);
        } else {
            console.error("Файл не был передан");
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

        returnFirstWords(dict);
        returnWords(dict);
    }

    function returnWords(dict) {
        nextButton.addEventListener("click", function() {
            const words = returnRandomWordFromDict(dict);
            renderWords(words);
        });
    }

    function returnFirstWords(dict) {          
        frontWord.innerHTML = `${dict.latin.words[0]}`;
        backWord.innerHTML = `${dict.cyrillic.words[0]}`;
    }

    function returnRandomWordFromDict(dict) {
        let randomIndex = Math.floor(Math.random() * dict.latin.words.length);
        let randomLang = Math.round(Math.random());
        let randomWord, translationOfRandomElement;

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
        card.innerHTML = `
            <div class="card-horizontal">
                <div class="card-front"> 
                    <article class="card-front-content">
                        <h1>${words[0]}</h1>
                    </article>
                </div>
                <div class="card-back card-back-hr">
                    <article class="card-back-content">
                        <h1>${words[1]}</h1>
                    </article>
                </div>
            </div>
        `;
    }

    function handleNextButtonClick() {
        const words = returnRandomWordFromDict(dict);
        renderWords(words);
    }
});
