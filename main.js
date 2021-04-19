document.addEventListener('DOMContentLoaded', () => {
    var BOARDWIDTH = 10;
    var BOARDHEIGHT = 20;
    var BOARDSIZE = BOARDWIDTH * BOARDHEIGHT;

    var FIGURES = [
        {
            cells: [0, BOARDWIDTH, BOARDWIDTH*2, BOARDWIDTH*2+1],
            width: 3,
            color: 'lFigure',
        },
        {
            cells: [1, BOARDWIDTH+1, BOARDWIDTH*2, BOARDWIDTH*2+1],
            width: 3,
            color: 'jFigure',
        },
        {
            cells: [0, 1, BOARDWIDTH+1, BOARDWIDTH+2],
            width: 3,
            color: 'zFigure',
        },
        {
            cells: [1, 2, BOARDWIDTH, BOARDWIDTH+1],
            width: 3,
            color: 'sFigure'
        },
        {
            cells: [1, BOARDWIDTH, BOARDWIDTH+1, BOARDWIDTH*2+1],
            width: 3,
            color: 'tFigure'
        },
        {
            cells: [0, 1, BOARDWIDTH, BOARDWIDTH+1],
            width: 2,
            color: 'oFigure',
        },
        {
            cells: [1, BOARDWIDTH+1, BOARDWIDTH*2+1, BOARDWIDTH*3+1],
            width: 4,
            color: 'iFigure',
        }
    ]

    var NEXTFIGURES = {
        lFigure: [5, 9, 13, 14],
        jFigure: [6, 9, 10, 14],
        zFigure: [4, 5, 9, 10],
        sFigure: [6, 7, 9, 10],
        tFigure: [7, 11, 14, 15],
        oFigure: [5, 6, 9, 10],
        iFigure: [1, 5, 9, 13]
    }

    

    var gameFinished = false;
    var gamePaused = false;
    var gameInFocus = false;
    var stepTimer;

    var nextFigure = [];

    var NEXTFIGUREWIDTH = 4;
    var NEXTFIGUREHEIGHT = 4;
    var NEXTFIGURESIZE = NEXTFIGUREHEIGHT * NEXTFIGUREWIDTH;

    // Функция генерации новой фигуты и добавление ее в массив следующих фигур
    function addNextFigur() {
        var addFigureNumber = Math.floor(Math.random()*FIGURES.length);        
        nextFigure.push(addFigureNumber);
    }
    // 

    var nextFigurBoardElement = document.getElementById('next-figure-board');

    var boardElement = document.getElementById('board');
    boardElement.style.width = 30*BOARDWIDTH+'px';
    boardElement.style.height = 30*BOARDHEIGHT+'px';

    var gameBoard = {
        cells: [],
        finishedLines: 0,
        score: 0,
        stepDelay: 1000,
        currentFigure: null,
        currentFigureWidth: 0,
        currentColor: '',
        currentPosition: 0,
        nextPosition: 0,
    };

    var nextBoard = {
        cells: [],
        currentFigure: null,
        currentColor: '',
        currentPosition: 0,
    };

    // Вывод текстовых полей с состоянием игры
    var scoreElement = document.getElementById('score');
    var linesElement = document.getElementById('lines');
    function renderCounters() {
        scoreElement.innerHTML = 'Счет игры: '+gameBoard.score;
        linesElement.innerHTML = 'Собрано линий: '+gameBoard.finishedLines;
    }

    // Функция завершения игры
    function gameOver() {
        console.log('Взрыв! Вы проиграли!');
        boardElement.style.borderColor = 'red';
        gameFinished = true;
    }

    function pauseHandler() {
        if (gamePaused) {
            if (gameFinished) {
                gameFinished = false;
                initBoard();
            }
            stepTimer = setTimeout(gameStep, gameBoard.stepDelay, true);
            boardElement.style.borderColor = '#dcd6bc';
            console.log('Игра возобновлена');
            gameBoard.cells.forEach((cell) => cell.element.className = cell.haveBlock?cell.color:'closed');
            drawFigure();
            gamePaused = false;
        } else {
            clearTimeout(stepTimer);
            boardElement.style.borderColor = 'green';
            gameBoard.cells.forEach((cell) => cell.element.className = 'closed');
            console.log('Игра на паузе')
            gamePaused = true;
        }
    }

    function undrawFigure() {
        if (gameBoard.currentFigure) {
            gameBoard.currentFigure.forEach((cellPos) => {
                gameBoard.cells[gameBoard.currentPosition+cellPos].element.className = 'closed';
            });
        }
    }
    
    function drawFigure() {
        if (gameBoard.currentFigure) {
            gameBoard.currentFigure.forEach((cellPos) => {
                gameBoard.cells[gameBoard.currentPosition+cellPos].element.className = gameBoard.currentColor;
            });
        }
    }

    function drawNextFigure() {
        for (let i = 0; i <= NEXTFIGURESIZE; i++) {
            if (nextBoard.cells[i]) {
                nextBoard.cells[i].element.className = 'closed';
            }
        }
        NEXTFIGURES[FIGURES[nextFigure[0]].color].forEach((cellPos) => {
            nextBoard.cells[cellPos].element.className = nextBoard.currentColor;
        })
    }

    function canMove(newPosition) {
        var result = true;
        var maxXOld = -1, maxXNew = -1;
        var minXOld = BOARDWIDTH, minXNew = BOARDWIDTH;
        gameBoard.currentFigure.forEach((cellPos) => {
            if (newPosition+cellPos<0 || newPosition+cellPos>=BOARDSIZE) {
                result = false;
            } else if (gameBoard.cells[newPosition+cellPos].haveBlock) {
                result = false;
            }
            minXOld = Math.min(minXOld, (gameBoard.currentPosition+cellPos)%BOARDWIDTH);
            minXNew = Math.min(minXNew, (newPosition+cellPos)%BOARDWIDTH);
            maxXOld = Math.max(maxXOld, (gameBoard.currentPosition+cellPos)%BOARDWIDTH);
            maxXNew = Math.max(maxXNew, (newPosition+cellPos)%BOARDWIDTH);
        });
        if (Math.abs(minXOld-minXNew)>1 ||
            Math.abs(maxXOld-maxXNew)>1 ||
            Math.abs(maxXNew-minXNew)>4) {
            result = false;
        }
        return result;
    }

    function getFullLines() {
        var result = [];

        for (var i=0; i<BOARDHEIGHT; i++) {
            var lineEmpty = true;
            for (var j=0; j<BOARDWIDTH; j++) {
                if (!gameBoard.cells[i*BOARDWIDTH+j].haveBlock) {
                    lineEmpty = false;
                }
            }
            if (lineEmpty) {
                result.push(i);
            }
        }
        return result;
    }

    function gameStep(isDown) {
        clearTimeout(stepTimer);
        if (canMove(gameBoard.nextPosition)) {
            undrawFigure();
            gameBoard.currentPosition = gameBoard.nextPosition;
            gameBoard.nextPosition += BOARDWIDTH;
            drawFigure();
        } else if (isDown) {
            // Фиксация фигуры и запуск следующей
            gameBoard.currentFigure.forEach((cellPos) => {
                gameBoard.cells[gameBoard.currentPosition+cellPos].haveBlock = true;
                gameBoard.cells[gameBoard.currentPosition+cellPos].color = gameBoard.currentColor;
            })
            gameBoard.score += gameBoard.currentFigure.length;
            var fullLines = getFullLines();
            fullLines.forEach((line) => {
                for (var i = line*BOARDWIDTH-1; i>=0; i--) {
                    gameBoard.cells[i+BOARDWIDTH].haveBlock = gameBoard.cells[i].haveBlock;
                    gameBoard.cells[i+BOARDWIDTH].color = gameBoard.cells[i].color;
                    gameBoard.cells[i+BOARDWIDTH].element.className = gameBoard.cells[i].color;
                }
            })
            for (var i = 0; i<fullLines.length*BOARDWIDTH; i++) {
                gameBoard.cells[i].haveBlock = false;
                gameBoard.cells[i].color = '';
                gameBoard.cells[i].element.className = 'closed';
            }
            if (fullLines.length>0) {
                gameBoard.score += Math.pow(2, fullLines.length-1)*10;
            }
            gameBoard.finishedLines += fullLines.length;
            renderCounters();
            gameBoard.stepDelay = Math.max(100, 1000-10*gameBoard.finishedLines);
            setNewFigure();
            addNextFigur();
            if (!canMove(gameBoard.currentPosition)) {
                gameOver(false);
            }
        }
        if (!gameFinished) {
            stepTimer = setTimeout(gameStep, gameBoard.stepDelay, true);
        }
    }

    function moveFigure(position, isDown) {
        if (canMove(position)) {
            gameBoard.nextPosition = position;
            gameStep(isDown);
        }
    }

    function rotateFigure() {
        var oldFigure = gameBoard.currentFigure;

        undrawFigure();
        gameBoard.nextPosition = gameBoard.currentPosition;
        gameBoard.currentFigure = gameBoard.currentFigure.map((cellPos) => {
            var x = cellPos%BOARDWIDTH;
            var y = Math.floor(cellPos/BOARDWIDTH);

            return x*BOARDWIDTH + gameBoard.currentFigureWidth-1-y;
        })
        if (!canMove(gameBoard.currentPosition)) {
            gameBoard.currentFigure = oldFigure;
        }
        gameStep();
    }

    function keyHandler(event) {
        if (gameInFocus) {
            // console.log(event.key, event.code);
            switch (event.code) {
                case 'ArrowLeft':
                    moveFigure(gameBoard.currentPosition-1);
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    moveFigure(gameBoard.currentPosition+1);
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                    rotateFigure();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    moveFigure(gameBoard.currentPosition+BOARDWIDTH, true);
                    event.preventDefault();
                    break;
                case 'KeyP':
                    pauseHandler();
                    event.preventDefault();
                    break;
            }
        }
    }

    function setNewFigure() {
        gameBoard.currentFigureNumber = nextFigure[0];
        nextFigure.shift();
        gameBoard.currentFigure = FIGURES[gameBoard.currentFigureNumber].cells;
        gameBoard.currentColor = FIGURES[gameBoard.currentFigureNumber].color;
        gameBoard.currentFigureWidth = FIGURES[gameBoard.currentFigureNumber].width;
        console.log(FIGURES[nextFigure[0]]);
        console.log(NEXTFIGURES[FIGURES[nextFigure[0]].color]);
    
        // Здесь была фиксированная константа (4), заменил ее формулой, чтобы появление фигур было по центру в зависимости от ширины поля
        gameBoard.currentPosition = (BOARDWIDTH / 2) - 1; 
        gameBoard.nextPosition = gameBoard.currentPosition;
        // 
        nextBoard.currentFigureNumber = nextFigure[0];
        nextBoard.currentFigure = FIGURES[nextBoard.currentFigureNumber].cells;
        nextBoard.currentColor = FIGURES[nextBoard.currentFigureNumber].color;
        nextBoard.currentPosition = (NEXTFIGUREWIDTH / 2) - 1;
        drawNextFigure();
    }


    function initBoard() {
        // Очищаем поле на странице
        boardElement.innerHTML = '';        
        nextFigurBoardElement.innerHTML = '';

        // Создаем поле
        nextBoard.cells = [];
        for (let i = 0; i < NEXTFIGURESIZE; i++) {
            const cell = document.createElement('div');

            cell.className = 'closed'

            nextFigurBoardElement.append(cell)

            nextBoard.cells[i] = { element: cell, index: i, haveBlock: false, color: '' };
        }


        gameBoard.cells = [];
        for (var i = 0; i < BOARDSIZE; i++) {
            const cell = document.createElement('div');

            // cell.setAttribute('index', i);
            cell.className = 'closed';
            // gameBoard.closedCellsNum++;

            boardElement.appendChild(cell);

            gameBoard.cells[i] = { element: cell, index: i, haveBlock: false, color: '' };
        }

        boardElement.addEventListener('click', pauseHandler);
        document.addEventListener('keydown', keyHandler);
        boardElement.addEventListener('mouseenter', () => gameInFocus = true);
        boardElement.addEventListener('mouseleave', () => gameInFocus = false);

        // Заполнение массива следующих фигур
        while (nextFigure.length < 4) {
            addNextFigur();
        }
        // 

        gameBoard.finishedLines = 0;
        gameBoard.score = 0;
        gameBoard.stepDelay = 1000;
        setNewFigure();
        // Выводим счетчики
        renderCounters();
        // console.log(nextFigure[0].color);
    }

    initBoard();
    pauseHandler();
})