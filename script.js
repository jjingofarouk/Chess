const chess = new Chess();
const boardElement = document.getElementById('board');
const gameStatus = document.getElementById('game-status');
const moveSound = document.getElementById('move-sound');
const captureSound = document.getElementById('capture-sound');

let selectedSquare = null;
let moveHistory = [];
let redoStack = [];
let isAIGame = false;
let aiDifficulty = 3;

function createBoard() {
    boardElement.innerHTML = '';
    const board = chess.board();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const squareColor = (row + col) % 2 === 0 ? 'light' : 'dark';
            square.className = `square ${squareColor}`;
            square.dataset.position = `${String.fromCharCode(97 + col)}${8 - row}`;
            
            const piece = board[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.style.backgroundImage = `url('https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png')`;
                square.appendChild(pieceElement);
            }
            
            square.addEventListener('click', () => handleSquareClick(square));
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(square) {
    const position = square.dataset.position;
    const piece = chess.get(position);

    if (selectedSquare === position) {
        clearHighlights();
        selectedSquare = null;
        return;
    }

    if (piece && piece.color === chess.turn()) {
        selectedSquare = position;
        clearHighlights();
        showValidMoves(position);
    } else if (selectedSquare) {
        tryMove(selectedSquare, position);
    }
}

function tryMove(from, to) {
    const move = chess.move({ from, to, promotion: 'q' });
    if (move) {
        playSound(move.captured ? captureSound : moveSound);
        moveHistory.push(chess.fen());
        redoStack = [];
        updateGameStatus();
        clearHighlights();
        selectedSquare = null;
        createBoard();
        
        if (isAIGame && chess.turn() === 'b') {
            setTimeout(makeAIMove, 500);
        }
    }
}

function showValidMoves(position) {
    const moves = chess.moves({ square: position, verbose: true });
    moves.forEach(move => {
        const square = document.querySelector(`[data-position="${move.to}"]`);
        square.classList.add('highlight');
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('highlight');
    });
}

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

function updateGameStatus() {
    if (chess.isCheckmate()) {
        gameStatus.textContent = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    } else if (chess.isDraw()) {
        gameStatus.textContent = "Draw!";
    } else if (chess.isCheck()) {
        gameStatus.textContent = `Check! ${chess.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    } else {
        gameStatus.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    }
}

function makeAIMove() {
    const moves = chess.moves({ verbose: true });
    const difficulty = document.getElementById('ai-difficulty').value;
    const depth = parseInt(difficulty);
    
    // Simple minimax implementation for AI
    let bestMove = null;
    let bestValue = -Infinity;
    
    moves.forEach(move => {
        chess.move(move);
        const value = minimax(depth - 1, -Infinity, Infinity, false);
        chess.undo();
        
        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
    });
    
    if (bestMove) {
        tryMove(bestMove.from, bestMove.to);
    }
}

function minimax(depth, alpha, beta, maximizing) {
    if (depth === 0 || chess.isGameOver()) {
        return evaluateBoard();
    }
    
    if (maximizing) {
        let maxEval = -Infinity;
        const moves = chess.moves({ verbose: true });
        for (const move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            chess.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = chess.moves({ verbose: true });
        for (const move of moves) {
            chess.move(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            chess.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard() {
    // Simple piece value evaluation
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let evaluation = 0;
    const board = chess.board();
    
    board.forEach(row => {
        row.forEach(square => {
            if (square) {
                const value = pieceValues[square.type];
                evaluation += square.color === 'w' ? value : -value;
            }
        });
    });
    
    return evaluation;
}

// Game controls
function toggleGameMode() {
    isAIGame = !isAIGame;
    document.getElementById('game-mode').textContent = isAIGame ? 'vs AI' : 'vs Human';
    newGame();
}

function undoMove() {
    if (moveHistory.length > 1) {
        redoStack.push(moveHistory.pop());
        chess.load(moveHistory[moveHistory.length - 1]);
        createBoard();
        updateGameStatus();
    }
}

function redoMove() {
    if (redoStack.length > 0) {
        const fen = redoStack.pop();
        moveHistory.push(fen);
        chess.load(fen);
        createBoard();
        updateGameStatus();
    }
}

function newGame() {
    chess.reset();
    moveHistory = [chess.fen()];
    redoStack = [];
    createBoard();
    updateGameStatus();
}

// Initialize game
document.getElementById('ai-difficulty').addEventListener('change', (e) => {
    aiDifficulty = parseInt(e.target.value);
});

newGame();
