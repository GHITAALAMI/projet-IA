class Piece {
    constructor(type) {
        this.type = type;
        this.patterns = {
            'I': [[1, 1, 1, 1]],
            'O': [[1, 1], [1, 1]],
            'T': [[0, 1, 0], [1, 1, 1]],
            'L': [[1, 0], [1, 0], [1, 1]],
            'J': [[0, 1], [0, 1], [1, 1]],
            'S': [[0, 1, 1], [1, 1, 0]],
            'Z': [[1, 1, 0], [0, 1, 1]]
        };
        this.pattern = this.patterns[type];
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.colors = {
            'I': '#00f0f0',
            'O': '#f0f000',
            'T': '#a000f0',
            'L': '#f0a000',
            'J': '#0000f0',
            'S': '#00f000',
            'Z': '#f00000'
        };
        this.color = this.colors[type];
    }

    rotate() {
        const rotated = [];
        for (let i = 0; i < this.pattern[0].length; i++) {
            const row = [];
            for (let j = this.pattern.length - 1; j >= 0; j--) {
                row.push(this.pattern[j][i]);
            }
            rotated.push(row);
        }
        this.pattern = rotated;
    }

    moveLeft() {
        this.x--;
    }

    moveRight() {
        this.x++;
    }

    moveDown() {
        this.y++;
    }
}

class Board {
    constructor(canvasId, width = 10, height = 20) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(0));
        this.currentPiece = null;
        this.score = 0;
        this.blockSize = this.canvas.width / width;
        this.nextPiece = null;
        this.nextPieceCanvas = document.getElementById(canvasId === 'human-board' ? 
            'next-piece-preview' : 'ai-next-piece-preview');
        this.nextPieceCtx = this.nextPieceCanvas ? this.nextPieceCanvas.getContext('2d') : null;
    }

    draw() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner la grille
        this.drawGrid();
        
        // Dessiner les pièces fixes
        this.drawFixedBlocks();
        
        // Dessiner la pièce courante
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;

        // Lignes verticales
        for (let x = 0; x <= this.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Lignes horizontales
        for (let y = 0; y <= this.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
    }

    drawFixedBlocks() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(x, y, this.grid[y][x]);
                }
            }
        }
    }

    drawPiece(piece) {
        for (let y = 0; y < piece.pattern.length; y++) {
            for (let x = 0; x < piece.pattern[y].length; x++) {
                if (piece.pattern[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
    }

    isValidMove(piece, newX, newY, newPattern = null) {
        const pattern = newPattern || piece.pattern;
        
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (pattern[y][x]) {
                    const testX = newX + x;
                    const testY = newY + y;
                    
                    // Vérifier les limites
                    if (testX < 0 || testX >= this.width || testY >= this.height) {
                        return false;
                    }
                    
                    // Vérifier la collision avec les blocs existants
                    if (testY >= 0 && this.grid[testY][testX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    clearLines() {
        let linesCleared = 0;
        
        // Vérifier chaque ligne de bas en haut
        for (let y = this.height - 1; y >= 0; y--) {
            if (this.isLineFull(y)) {
                this.removeLine(y);
                linesCleared++;
                y++; // Revérifier la même position après la chute des lignes
            }
        }

        // Calculer et mettre à jour le score seulement si des lignes ont été effacées
        if (linesCleared > 0) {
            console.log(`${linesCleared} lignes complétées`);
            this.updateScore(linesCleared);
            this.animateLinesClear();
        }

        return linesCleared;
    }

    isLineFull(y) {
        return this.grid[y].every(cell => cell !== 0);
    }

    removeLine(y) {
        // Faire descendre toutes les lignes au-dessus
        for (let i = y; i > 0; i--) {
            this.grid[i] = [...this.grid[i - 1]];
        }
        // Créer une nouvelle ligne vide en haut
        this.grid[0] = Array(this.width).fill(0);
    }

    updateScore(linesCleared) {
        // Points de base par ligne
        const basePoints = 50;
        
        // Bonus pour les combos
        let bonus = 0;
        switch(linesCleared) {
            case 2:
                bonus = 100;
                break;
            case 3:
                bonus = 200;
                break;
            case 4: // Tetris!
                bonus = 300;
                break;
        }

        const points = (linesCleared * basePoints) + bonus;
        this.score += points;
        
        // Mettre à jour l'affichage du score
        const scoreId = this.canvas.id === 'human-board' ? 'human-score' : 'ai-score';
        const scoreElement = document.getElementById(scoreId);
        if (scoreElement) {
            scoreElement.textContent = this.score;
            console.log(`Score mis à jour pour ${scoreId}: ${this.score}`);
        }

        // Règles spéciales basées sur le nombre de lignes
        if (linesCleared === 2) {
            // Cadeau surprise pour l'adversaire
            const otherBoard = this.canvas.id === 'human-board' ? 
                window.game.aiBoard : window.game.humanBoard;
            window.game.giftEasyPiece(otherBoard);
        }
        else if (linesCleared === 4) {
            // Échange de lignes après un Tetris
            const otherBoard = this.canvas.id === 'human-board' ? 
                window.game.aiBoard : window.game.humanBoard;
            window.game.exchangeLines(this, otherBoard);
        }

        // Vérifier la pause douceur tous les 1000 points
        if (Math.floor(this.score / 1000) > Math.floor((this.score - points) / 1000)) {
            console.log("Pause douceur activée !");
            window.game.triggerSlowdown();
        }
    }

    animateLinesClear() {
        // Ajouter une classe pour l'animation
        this.canvas.classList.add('line-complete');
        setTimeout(() => {
            this.canvas.classList.remove('line-complete');
        }, 500);
    }

    checkSpecialRules() {
        // Pause douceur tous les 1000 points
        if (this.score % 1000 === 0 && this.score > 0) {
            console.log("Pause douceur activée !");
            window.game.triggerSlowdown();
        }
    }

    triggerSpecialPiece() {
        const specialPieces = {
            'HEART': [
                [0,1,0,1,0],
                [1,1,1,1,1],
                [0,1,1,1,0],
                [0,0,1,0,0]
            ],
            'STAR': [
                [0,0,1,0,0],
                [1,1,1,1,1],
                [0,1,1,1,0],
                [1,0,1,0,1]
            ]
        };
        
        const type = Object.keys(specialPieces)[Math.floor(Math.random() * 2)];
        const pattern = specialPieces[type];
        
        this.nextPiece = {
            pattern: pattern,
            color: '#FF69B4', // Rose
            isSpecial: true,
            x: 0,
            y: 0,
            moveLeft() { this.x--; },
            moveRight() { this.x++; },
            moveDown() { this.y++; },
            rotate() { /* Pas de rotation pour les pièces spéciales */ }
        };
        
        console.log("Pièce spéciale débloquée :", type);
    }

    checkSpecialPiecePlacement(piece) {
        if (!piece.isSpecial) return 0;
        
        // Vérifier si la pièce est bien placée (pas de trous en dessous)
        let isWellPlaced = true;
        const bottomY = piece.y + piece.pattern.length;
        
        for (let x = piece.x; x < piece.x + piece.pattern[0].length; x++) {
            if (bottomY < this.height && this.grid[bottomY][x] === 0) {
                isWellPlaced = false;
                break;
            }
        }
        
        return isWellPlaced ? 100 : 0; // Bonus de 100 points si bien placée
    }

    freezePiece() {
        if (!this.currentPiece) return;
        
        const piece = this.currentPiece;
        for (let y = 0; y < piece.pattern.length; y++) {
            for (let x = 0; x < piece.pattern[y].length; x++) {
                if (piece.pattern[y][x]) {
                    const gridY = piece.y + y;
                    const gridX = piece.x + x;
                    if (gridY >= 0 && gridY < this.height && gridX >= 0 && gridX < this.width) {
                        this.grid[gridY][gridX] = piece.color;
                    }
                }
            }
        }
        
        // Vérifier les lignes complètes après avoir gelé la pièce
        this.clearLines();
    }

    drawNextPiece() {
        if (!this.nextPieceCtx || !this.nextPiece) return;
        
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        const blockSize = 20;
        const offsetX = (this.nextPieceCanvas.width - this.nextPiece.pattern[0].length * blockSize) / 2;
        const offsetY = (this.nextPieceCanvas.height - this.nextPiece.pattern.length * blockSize) / 2;

        for (let y = 0; y < this.nextPiece.pattern.length; y++) {
            for (let x = 0; x < this.nextPiece.pattern[y].length; x++) {
                if (this.nextPiece.pattern[y][x]) {
                    this.nextPieceCtx.fillStyle = this.nextPiece.color;
                    this.nextPieceCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }

    animateLineExchange(lineIndex) {
        const canvas = this.canvas;
        const y = lineIndex * this.blockSize;
        
        // Ajouter une classe pour l'animation
        canvas.style.position = 'relative';
        
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.left = '0';
        line.style.top = `${y}px`;
        line.style.width = '100%';
        line.style.height = `${this.blockSize}px`;
        line.style.backgroundColor = '#ffeb3b';
        line.style.opacity = '0.5';
        line.classList.add('exchange-animation');
        
        canvas.parentNode.appendChild(line);
        
        setTimeout(() => {
            canvas.parentNode.removeChild(line);
        }, 1000);
    }
}

class AI {
    constructor(board) {
        this.board = board;
    }

    // Évalue la meilleure position pour la pièce courante
    findBestMove(piece) {
        let bestScore = -Infinity;
        let bestX = 0;
        let bestRotation = 0;

        // Essayer toutes les rotations possibles
        for (let rotation = 0; rotation < 4; rotation++) {
            // Essayer toutes les positions horizontales
            for (let x = -2; x < this.board.width + 2; x++) {
                const testPiece = new Piece(piece.type);
                // Appliquer la rotation
                for (let r = 0; r < rotation; r++) {
                    testPiece.rotate();
                }
                testPiece.x = x;
                testPiece.y = 0;

                // Trouver la position la plus basse possible
                while (this.board.isValidMove(testPiece, testPiece.x, testPiece.y + 1)) {
                    testPiece.y++;
                }

                // Si la position est valide, évaluer le score
                if (this.board.isValidMove(testPiece, testPiece.x, testPiece.y)) {
                    const score = this.evaluatePosition(testPiece);
                    if (score > bestScore) {
                        bestScore = score;
                        bestX = x;
                        bestRotation = rotation;
                    }
                }
            }
        }

        return { x: bestX, rotation: bestRotation };
    }

    // Évalue une position donnée
    evaluatePosition(piece) {
        let score = 0;

        // Préférer les positions basses
        score += piece.y * 2;

        // Éviter de créer des trous
        score -= this.countHoles(piece) * 10;

        // Préférer les positions qui complètent des lignes
        score += this.countCompletedLines(piece) * 20;

        return score;
    }

    // Compte le nombre de trous créés
    countHoles(piece) {
        let holes = 0;
        const tempGrid = this.getTemporaryGrid(piece);

        for (let x = 0; x < this.board.width; x++) {
            let foundBlock = false;
            for (let y = 0; y < this.board.height; y++) {
                if (tempGrid[y][x]) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        return holes;
    }

    // Compte le nombre de lignes qui seraient complétées
    countCompletedLines(piece) {
        const tempGrid = this.getTemporaryGrid(piece);
        let lines = 0;

        for (let y = 0; y < this.board.height; y++) {
            if (tempGrid[y].every(cell => cell !== 0)) {
                lines++;
            }
        }
        return lines;
    }

    // Crée une grille temporaire avec la pièce placée
    getTemporaryGrid(piece) {
        const tempGrid = this.board.grid.map(row => [...row]);
        
        for (let y = 0; y < piece.pattern.length; y++) {
            for (let x = 0; x < piece.pattern[y].length; x++) {
                if (piece.pattern[y][x]) {
                    const gridY = piece.y + y;
                    const gridX = piece.x + x;
                    if (gridY >= 0 && gridY < this.board.height && 
                        gridX >= 0 && gridX < this.board.width) {
                        tempGrid[gridY][gridX] = piece.color;
                    }
                }
            }
        }
        return tempGrid;
    }
}

class Game {
    constructor() {
        this.humanBoard = new Board('human-board');
        this.aiBoard = new Board('ai-board');
        this.isRunning = false;
        this.gameSpeed = 200; // Vitesse initiale plus rapide (500ms au lieu de 1000ms)
        this.initialSpeed = 200;
        this.level = 1;
        this.linesForNextLevel = 10; // Nombre de lignes pour passer au niveau suivant
        this.totalLinesCleared = 0;
        this.pieceTypes = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        this.ai = new AI(this.aiBoard);
        this.setupEventListeners();
        console.log('Jeu initialisé');
        this.gameTime = 0;
        this.lastRainbowTime = 0;
        this.specialPieces = {
            'HEART': [[0,1,0,1,0],
                     [1,1,1,1,1],
                     [0,1,1,1,0],
                     [0,0,1,0,0]],
            'STAR': [[0,0,1,0,0],
                     [1,1,1,1,1],
                     [0,1,1,1,0],
                     [1,0,1,0,1]]
        };
        this.isGameOver = false;
        this.winner = null;
        this.timerElement = document.getElementById('timer');
        window.game = this; // Rendre l'instance du jeu accessible globalement
    }

    setupEventListeners() {
        this.keyState = {};
        
        // Supprimer l'ancien écouteur et en créer un nouveau
        const startButton = document.getElementById('start-game');
        startButton.removeEventListener('click', this.start);
        startButton.addEventListener('click', () => {
            if (!this.isRunning && !this.isGameOver) {
                console.log('Démarrage du jeu');
                this.start();
                startButton.disabled = true; // Désactiver le bouton après le démarrage
            }
        });

        // Stocker les références aux fonctions pour pouvoir les retirer plus tard
        this.handleKeyUp = (e) => {
            this.keyState[e.key] = false;
        };

        this.handleInput = (e) => {
            if (!this.isRunning || this.isGameOver) return;
            this.keyState[e.key] = true;
            
            const piece = this.humanBoard.currentPiece;
            if (!piece) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (this.humanBoard.isValidMove(piece, piece.x - 1, piece.y)) {
                        piece.moveLeft();
                    }
                    break;
                case 'ArrowRight':
                    if (this.humanBoard.isValidMove(piece, piece.x + 1, piece.y)) {
                        piece.moveRight();
                    }
                    break;
                case 'ArrowDown':
                    if (this.humanBoard.isValidMove(piece, piece.x, piece.y + 1)) {
                        piece.moveDown();
                    }
                    break;
                case 'ArrowUp':
                    const rotatedPattern = [...piece.pattern];
                    piece.rotate();
                    if (!this.humanBoard.isValidMove(piece, piece.x, piece.y)) {
                        piece.pattern = rotatedPattern;
                    }
                    break;
            }
            this.humanBoard.draw();
        };

        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isGameOver = false;
        
        // Réinitialiser les plateaux si nécessaire
        this.humanBoard.grid = Array(this.humanBoard.height).fill().map(() => Array(this.humanBoard.width).fill(0));
        this.aiBoard.grid = Array(this.aiBoard.height).fill().map(() => Array(this.aiBoard.width).fill(0));
        
        // Dessiner les plateaux vides
        this.humanBoard.draw();
        this.aiBoard.draw();
        
        // Créer les premières pièces
        this.spawnNewPiece(this.humanBoard);
        this.spawnNewPiece(this.aiBoard);
        
        // Démarrer la boucle de jeu
        this.gameLoop();
        
        console.log('Jeu démarré');
    }

    spawnNewPiece(board) {
        if (board.nextPiece) {
            board.currentPiece = board.nextPiece;
        } else {
            const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
            board.currentPiece = new Piece(type);
        }

        // Créer la prochaine pièce
        const nextType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        board.nextPiece = new Piece(nextType);
        board.drawNextPiece();

        board.currentPiece.x = Math.floor((board.width - board.currentPiece.pattern[0].length) / 2);
        board.currentPiece.y = 0;

        if (!board.isValidMove(board.currentPiece, board.currentPiece.x, board.currentPiece.y)) {
            this.handleGameOver(board);
        }
    }

    handleInput(e) {
        if (!this.isRunning) return;
        console.log('Touche pressée:', e.key);
        const piece = this.humanBoard.currentPiece;
        if (!piece) return;

        switch (e.key) {
            case 'ArrowLeft':
                if (this.humanBoard.isValidMove(piece, piece.x - 1, piece.y)) {
                    piece.moveLeft();
                }
                break;
            case 'ArrowRight':
                if (this.humanBoard.isValidMove(piece, piece.x + 1, piece.y)) {
                    piece.moveRight();
                }
                break;
            case 'ArrowDown':
                if (this.humanBoard.isValidMove(piece, piece.x, piece.y + 1)) {
                    piece.moveDown();
                }
                break;
            case 'ArrowUp':
                const rotatedPattern = [...piece.pattern];
                piece.rotate();
                if (!this.humanBoard.isValidMove(piece, piece.x, piece.y)) {
                    piece.pattern = rotatedPattern;
                }
                break;
        }
        this.humanBoard.draw();
    }

    gameLoop() {
        if (!this.isRunning || this.isGameOver) return;

        this.gameTime += this.gameSpeed;
        this.updateTimer();
        
        // Mettre à jour les plateaux
        this.updateBoard(this.humanBoard);
        this.updateBoard(this.aiBoard);

        // Redessiner les plateaux
        this.humanBoard.draw();
        this.aiBoard.draw();

        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }

    updateBoard(board) {
        if (!board.currentPiece) {
            this.spawnNewPiece(board);
            return;
        }

        // Accélérer la chute avec la touche bas
        const fastDrop = board === this.humanBoard && this.keyState && this.keyState.ArrowDown;
        const currentSpeed = fastDrop ? this.gameSpeed / 4 : this.gameSpeed;

        if (board === this.aiBoard) {
            // Logique de l'IA
            this.updateAIBoard();
        } else {
            // Logique du joueur humain
            if (board.isValidMove(board.currentPiece, board.currentPiece.x, board.currentPiece.y + 1)) {
                board.currentPiece.moveDown();
            } else {
                this.freezePiece(board);
                this.spawnNewPiece(board);
            }
        }
    }

    updateAIBoard() {
        const piece = this.aiBoard.currentPiece;
        const bestMove = this.ai.findBestMove(piece);

        // Appliquer les rotations
        while (piece.rotation < bestMove.rotation) {
            piece.rotate();
            piece.rotation++;
        }

        // Déplacer horizontalement
        if (piece.x < bestMove.x) piece.moveRight();
        if (piece.x > bestMove.x) piece.moveLeft();

        // Déplacer vers le bas
        if (this.aiBoard.isValidMove(piece, piece.x, piece.y + 1)) {
            piece.moveDown();
        } else {
            this.freezePiece(this.aiBoard);
            this.spawnNewPiece(this.aiBoard);
        }
    }

    freezePiece(board) {
        if (!board.currentPiece) return;
        
        const piece = board.currentPiece;
        for (let y = 0; y < piece.pattern.length; y++) {
            for (let x = 0; x < piece.pattern[y].length; x++) {
                if (piece.pattern[y][x]) {
                    const gridY = piece.y + y;
                    const gridX = piece.x + x;
                    if (gridY >= 0 && gridY < board.height && gridX >= 0 && gridX < board.width) {
                        board.grid[gridY][gridX] = piece.color;
                    }
                }
            }
        }
        
        // Vérifier et effacer les lignes complètes
        const linesCleared = board.clearLines();
        if (linesCleared > 0) {
            console.log(`${board.canvas.id} a complété ${linesCleared} lignes`);
            this.updateLevel(linesCleared);
        }
    }

    // Fonction pour le cadeau surprise
    giftEasyPiece(board) {
        const easyPieces = ['I', 'O']; // Pièces faciles
        const type = easyPieces[Math.floor(Math.random() * easyPieces.length)];
        
        const giftPiece = new Piece(type);
        giftPiece.color = '#FFD700'; // Couleur dorée pour le cadeau
        giftPiece.isGift = true;
        
        board.nextPiece = giftPiece;
        board.drawNextPiece();
        
        // Animation du cadeau
        board.canvas.classList.add('gift-animation');
        setTimeout(() => board.canvas.classList.remove('gift-animation'), 1000);
        
        console.log(`Cadeau surprise pour ${board.canvas.id}: ${type}`);
    }

    // Fonction pour l'échange de lignes
    exchangeLines(sourceBoard, targetBoard) {
        // Trouver une ligne pleine dans sourceBoard
        let fullLineIndex = null;
        for (let y = sourceBoard.height - 1; y >= 0; y--) {
            if (sourceBoard.isLineFull(y)) {
                fullLineIndex = y;
                break;
            }
        }

        // Trouver une ligne vide ou presque vide dans targetBoard
        let emptyLineIndex = null;
        for (let y = targetBoard.height - 1; y >= 0; y--) {
            const filledCells = targetBoard.grid[y].filter(cell => cell !== 0).length;
            if (filledCells <= 2) { // Ligne vide ou presque vide
                emptyLineIndex = y;
                break;
            }
        }

        if (fullLineIndex !== null && emptyLineIndex !== null) {
            // Sauvegarder les lignes
            const fullLine = [...sourceBoard.grid[fullLineIndex]];
            const emptyLine = [...targetBoard.grid[emptyLineIndex]];
            
            // Échanger les lignes
            sourceBoard.grid[fullLineIndex] = emptyLine;
            targetBoard.grid[emptyLineIndex] = fullLine;
            
            // Animation et son
            sourceBoard.animateLineExchange(fullLineIndex);
            targetBoard.animateLineExchange(emptyLineIndex);
            
            console.log('Échange de lignes effectué !');
        }
    }

    // Mode arc-en-ciel
    triggerRainbowMode() {
        const rainbowColors = [
            '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
            '#0000FF', '#4B0082', '#8F00FF'
        ];
        
        let colorIndex = 0;
        const originalColors = {};
        
        // Sauvegarder les couleurs originales
        this.pieceTypes.forEach(type => {
            originalColors[type] = Piece.prototype.colors[type];
        });

        // Changer les couleurs
        const rainbowInterval = setInterval(() => {
            this.pieceTypes.forEach(type => {
                Piece.prototype.colors[type] = rainbowColors[colorIndex];
            });
            colorIndex = (colorIndex + 1) % rainbowColors.length;
        }, 1000);

        // Restaurer les couleurs après 20 secondes
        setTimeout(() => {
            clearInterval(rainbowInterval);
            this.pieceTypes.forEach(type => {
                Piece.prototype.colors[type] = originalColors[type];
            });
        }, 20000);
    }

    // Ajouter la gestion du niveau et de la vitesse
    updateLevel(linesCleared) {
        this.totalLinesCleared += linesCleared;
        
        if (this.totalLinesCleared >= this.level * this.linesForNextLevel) {
            this.level++;
            this.updateSpeed();
            // Mettre à jour l'affichage du niveau
            document.getElementById('level').textContent = `Niveau: ${this.level}`;
            console.log(`Niveau ${this.level} ! Vitesse augmentée`);
        }
    }

    updateSpeed() {
        // Réduire le délai de 50ms par niveau, avec un minimum de 100ms
        this.gameSpeed = Math.max(100, this.initialSpeed - (this.level - 1) * 50);
    }

    handleGameOver(losingBoard) {
        this.isGameOver = true;
        this.isRunning = false;
        
        // Déterminer le gagnant
        this.winner = losingBoard === this.humanBoard ? 'IA' : 'Humain';
        
        // Afficher le message de fin de partie
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // Créer l'overlay de Game Over
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        
        const message = document.createElement('div');
        message.className = 'game-over-message';
        message.innerHTML = `
            <h2>Game Over!</h2>
            <p>Gagnant : ${this.winner}</p>
            <p>Score Humain : ${this.humanBoard.score}</p>
            <p>Score IA : ${this.aiBoard.score}</p>
            <button id="restart-game">Rejouer</button>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);

        // Ajouter l'événement pour redémarrer avec une fonction nommée
        const restartButton = document.getElementById('restart-game');
        const restartHandler = () => {
            this.restart();
            document.body.removeChild(overlay);
            // Retirer l'écouteur d'événement pour éviter les doublons
            restartButton.removeEventListener('click', restartHandler);
        };
        restartButton.addEventListener('click', restartHandler);
    }

    restart() {
        // Réinitialiser les scores dans l'interface
        document.getElementById('human-score').textContent = '0';
        document.getElementById('ai-score').textContent = '0';

        // Réinitialiser les plateaux
        this.humanBoard = new Board('human-board');
        this.aiBoard = new Board('ai-board');
        this.ai = new AI(this.aiBoard);
        
        // Réinitialiser les variables de jeu
        this.isGameOver = false;
        this.winner = null;
        this.isRunning = false;
        this.gameTime = 0;
        this.lastRainbowTime = 0;
        this.level = 1;
        this.totalLinesCleared = 0;
        this.gameSpeed = this.initialSpeed;
        
        // Nettoyer les anciens écouteurs d'événements
        this.cleanupEventListeners();
        // Réinitialiser les écouteurs d'événements
        this.setupEventListeners();
        
        // Effacer les canvas
        this.humanBoard.ctx.clearRect(0, 0, this.humanBoard.canvas.width, this.humanBoard.canvas.height);
        this.aiBoard.ctx.clearRect(0, 0, this.aiBoard.canvas.width, this.aiBoard.canvas.height);
        
        // Réactiver le bouton start
        document.getElementById('start-game').disabled = false;
        
        // Redémarrer le jeu
        this.start();
    }

    cleanupEventListeners() {
        // Retirer les anciens écouteurs d'événements
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        this.timerElement.textContent = `Temps: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Vérifier l'arc-en-ciel toutes les 2 minutes
        if (this.gameTime - this.lastRainbowTime >= 120000) {
            this.triggerRainbowMode();
            this.lastRainbowTime = this.gameTime;
        }
    }

    triggerSlowdown() {
        const originalSpeed = this.gameSpeed;
        // Ralentir de 20%
        this.gameSpeed = this.gameSpeed * 1.2;
        
        console.log("Vitesse ralentie à:", this.gameSpeed);
        
        // Restaurer la vitesse après 10 secondes
        setTimeout(() => {
            this.gameSpeed = originalSpeed;
            console.log("Vitesse restaurée à:", originalSpeed);
        }, 10000);
    }
}

// Initialisation du jeu
const game = new Game(); 