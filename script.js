

window.onchoosefn = function(event) {

    document.querySelector("#choose-dialog").style.display = "none";
    var NUM_COLUMNS = 4;

    var MAX_SAD = 10;
    
    var customers = [ "bird.svg", "cheetah.svg", "chicken.svg", "cow.svg", "crocodile.svg", "elk.svg", "fox.svg", "frog.svg", "giraffe.svg", "hippo.svg", "jellyfish.svg", "lion.svg", "monkey.svg", "octopus.svg", "owl.svg", "pig.svg", "rabbit.svg", "rattlesnake.svg", "turtle.svg", "weasel.svg", "zebra.svg", "sailor-penguin.svg", "bear.svg", "elephant.svg", "dog.svg", "squirrel.svg", "bee.svg" ];
    
    var iceCreamColors = [
        {
            css: "#6b3e26",
            filter: "invert(25%) sepia(38%) saturate(792%) hue-rotate(337deg) brightness(92%) contrast(89%)"
        },
        {
            css: "#ffc5d9",
            filter: "invert(82%) sepia(5%) saturate(2133%) hue-rotate(298deg) brightness(103%) contrast(101%)"
        },
        {
            css: "#c2f2d0", 
            filter: "invert(93%) sepia(13%) saturate(684%) hue-rotate(71deg) brightness(104%) contrast(90%)"
        },
        {
            css: "#fdf5c9",
            filter: "invert(96%) sepia(5%) saturate(2804%) hue-rotate(318deg) brightness(109%) contrast(101%)"
        }
    ];
    
    var numCustomers = 35, numHappy = 0, numSad = 0;
    
    var OFFSET_CUTOFF = 0.75;
    
    var slimeColumnContainer = document.querySelector("#slimes");
    var aimContainer = document.querySelector("#aim-container");
    /** @type {HTMLElement} */
    var aimerContainer = document.querySelector("#aimer-container");
    
    var questionContainer = document.querySelector(".ice-cream-info");
    
    var customer = document.querySelector(".customer");
    
    var icecreams = document.querySelector(".icecreams");
    
    var columnDivs = icecreams.querySelectorAll(".ice-cream-bowl");
    var rocket = document.querySelector(".rocket");
    
    var scoop = document.querySelector(".scoop");
    var cone = document.querySelector(".cone");
    
    var aimerColumn = 0;
    
    var slimeColumns = [];
    
    for(var i = 0; i < NUM_COLUMNS; i++) {
        slimeColumns[i] = { column: columnDivs[i] };
        columnDivs[i].style.backgroundColor = iceCreamColors[i].css;
        columnDivs[i].setAttribute("data-filter", "brightness(0) saturate(100%) " + iceCreamColors[i].filter);
    }
    
    var missileFiring = false;
    
    var missile = document.querySelector(".missile-container");
    
    var operation = event.currentTarget.textContent.toLowerCase();
    
    var currentCorrectAnswer;
    
    var queuedMissile = -1;
    
    var points = 0;
    
    
    Howler.autoSuspend = false;
    
    var incorrectSound = new Howl({
        src: ['incorrect.wav']
    });
    
    var correctSound = new Howl({
        src: ['correct.wav'],
    });
    
    var maxResultSize = document.querySelector("#facts-to-5").checked ? 5 : 9;
    if(isNaN(maxResultSize)) {
        window.alert("need ?max to be a number");
    }
    window.maxResultSize = maxResultSize;
    
    window.generateMathQuestions(operation, maxResultSize);
    numCustomers = Math.min(Math.round(window.mathQuestions.length * 1.1), numCustomers);
    function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
    }
    
    var prevMove = null;
    
    function regenerateColumn(columnIndex, value) {
        columnDivs[columnIndex].querySelector("span").innerHTML = value;
    }
    
    function factors(number) {
        return Array.from(Array(number + 1), function(_, i) { return i }).filter(function(i) { return number % i === 0 });
    }
    
    var firstTry = false;
    
    function newQuestion(pointDelta, filter) {

        var delay500 = pointDelta == 0 ? 0 : 500;

        if(pointDelta < 0)
            incorrectSound.play();
        else if(pointDelta > 0)
            correctSound.play();
        
        if(pointDelta < 0 && firstTry) {
            firstTry = false;
            customer.classList.add("customer-angers");
            Swal.fire({
                title: 'Nope!',
                icon: 'error',
                text: 'Give it another try.'
            });
            return;
        }
    
        if(pointDelta < 0) {
            numSad++;
            customer.classList.remove("customer-ordering");
            Swal.fire({
                title: 'Nope!',
                icon: 'error',
                text: 'The correct answer was ' + currentCorrectAnswer + '.'
            });
        } else if(pointDelta > 0) {
            numHappy++;
            customer.classList.remove("customer-angers");
            customer.classList.add("customer-leaving-happily");
        }
    
        scoop.style.display = "";
        scoop.style.filter = "brightness(0%) saturate(100%) " + filter;
        questionContainer.style.display = "none";
        icecreams.classList.add("bowls-hidden");
        setTimeout(function() {
            customer.classList.remove("customer-ordering");
            customer.classList.remove("customer-angers");
            customer.classList.remove("customer-leaving-happily");
            numCustomers--;
            document.querySelector("#happy-customers").innerHTML = numHappy;
            document.querySelector("#sad-customers").innerHTML = numSad;
            document.querySelector("#inline-customers").innerHTML = numCustomers;
            var percent = (1-(numSad/MAX_SAD));
            document.querySelector("#happiness-bar").style.width = percent*100 + "%";
        
            scoop.style.display = "none";
            cone.style.display = "none";
    
            if(percent <= 0) {
                document.getElementById("fail-dialog").style.display = "";
                return;
            }
            if(numCustomers == 0) {
                document.getElementById("win-dialog").style.display = "";
                return;
            }
            var correctInitialColumn = getRandomIntInclusive(0, NUM_COLUMNS - 1);
            /* MATH CORE BEGIN */
            var firstFactor, secondFactor, symbol;
            var retrievedQuestion = window.getNextMathQuestion();
            firstFactor = retrievedQuestion.operands[0];
            secondFactor = retrievedQuestion.operands[1];
            symbol = window.mathSymbol;
            currentCorrectAnswer = retrievedQuestion.currentCorrectAnswer;
            
            /* MATH CORE END */
            document.querySelector("#question-span").innerHTML = "" + firstFactor + " " + symbol + " " + secondFactor;
            var incorrectAnswers = [];
            for(var i = 0; i < (NUM_COLUMNS-1); i++) {
                var value;
                do {
                    value = getRandomIntInclusive(0, currentCorrectAnswer + 5);
                } while(incorrectAnswers.indexOf(value) != -1 || value == currentCorrectAnswer);
                incorrectAnswers.push(value);
            }
            for(var i = 0; i < NUM_COLUMNS; i++) {
                regenerateColumn(i, i == correctInitialColumn ? currentCorrectAnswer : incorrectAnswers.pop());
                slimeColumns[i].isCorrect = i == correctInitialColumn;
            }
            firstTry = true;
            customer.style.visibility = "hidden";
            customer.querySelector("img").src = customers[getRandomIntInclusive(0, customers.length - 1)];
            setTimeout(function() {
                customer.style.visibility = "";
                customer.classList.add("customer-ordering");
                setTimeout(function() {
                    icecreams.classList.remove("bowls-hidden");
                    questionContainer.style.display = "";
                    cone.style.display = "";
                }, delay500);
            }, delay500);
        }, delay500);
        
    }
    
    function onIceCreamClick(e) {
        var icecream = e.currentTarget;
        var n = parseInt(icecream.querySelector("span").textContent);
        newQuestion(n == currentCorrectAnswer ? 5 : -5, icecream.getAttribute("data-filter"));
    }
    
    columnDivs.forEach(icecream => icecream.addEventListener("click", onIceCreamClick));
    
    newQuestion(0);
}
