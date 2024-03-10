document.addEventListener('DOMContentLoaded', function() {
    let fileInputOpened = false; // Флаг для отслеживания открытия окна выбора файла

    getWords();

    function getWords() {
        const myForm = document.querySelector("#myForm");
        const inpFile = document.querySelector("#inpFile");
        const inpFileLabel = document.querySelector("#inpFileLabel");
    
        inpFileLabel.addEventListener("click", function() {
            if (!fileInputOpened) {
                inpFile.click();
                fileInputOpened = true;
            }
        });
    
        myForm.addEventListener("submit", function(e) {
            e.preventDefault();
    
            const formData = new FormData();
            formData.append("inpFile", inpFile.files[0]);

            getWordsFromFileWithWords(formData, myForm);
        });
    }
    
    function getWordsFromFileWithWords(formData, myForm) {
        if (formData.has("inpFile")) {
            const file = formData.get("inpFile");
            const reader = new FileReader();
            const card = document.querySelector(".card");
    
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
        }
    
        for (let word of wordsArray) {
            if (wordsArrayRegex.test(word.trim())) {
                dict.latin.words.push(word.trim().toLowerCase());
                dict.latin.check.push(true);
            } else {
                dict.cyrillic.words.push(word.trim().toLowerCase());
                dict.cyrillic.check.push(true);
            }
        }
        console.log(dict);
        const nextButton = document.querySelector(".next");
        const cardCont = document.querySelector(".card-container");
    
        returnWords(dict, nextButton, cardCont);
    }
    

    function returnWords(dict, nextButton, cardCont) {
        console.log(dict);
        nextButton.addEventListener("click", function(e) {
            const words = returnRandomWordFromDict(dict);
            console.log(words);
            cardCont.innerHTML = `
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
        });
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

    // function whileWordsDontEnd(dict) {}
});
