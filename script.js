const chess = new Chess();
const board = document.getElementById('board');
const moveHistory = document.getElementById('move-history');
const gameStatus = document.getElementById('game-status');
let selectedSquare = null;
let whiteTime = 600; // 10 minutes in seconds
let blackTime = 600;
let timerInterval;

// Initialize the game
function initGame() {
    updateBoard();
    updateClocks();
    startTimer();
    updateGameStatus();
}

// Update the chess board display
function updateBoard() {
    board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const isWhite = (row + col) % 2 === 0;
            square.className = `square ${isWhite ? 'white' : 'black'}`;
            square.dataset.position = `${String.fromCharCode(97 + col)}${8 - row}`;
            
            const piece = chess.get(square.dataset.position);
            if (piece) {
                square.textContent = getUnicodePiece(piece);
                square.draggable = true;
                square.addEventListener('dragstart', handleDragStart);
                square.addEventListener('dragend', handleDragEnd);
            }
            
            square.addEventListener('dragover', handleDragOver);
            square.addEventListener('drop', handleDrop);
            board.appendChild(square);
        }
    }
}

// Get Unicode character for piece
function getUnicodePiece(piece) {
    const unicodePieces = {
        'w': { 'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔' },
        'b': { 'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚' }
    };
    return unicodePieces[piece.color][piece.type];
}

// Handle drag start
function handleDragStart(e) {
    selectedSquare = e.target;
    e.target.classList.add('dragging');
    const moves = chess.moves({ square: e.target.dataset.position, verbose: true });
    highlightMoves(moves);
}

// Handle drag end
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    removeHighlights();
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    const from = selectedSquare.dataset.position;
    const to = e.target.dataset.position;
    
    try {
        const move = chess.move({ from, to, promotion: 'q' });
        if (move) {
            updateBoard();
            updateMoveHistory(move);
            updateGameStatus();
        }
    } catch (err) {
        // Invalid move
    }
    
    selectedSquare = null;
}

// Highlight valid moves
function highlightMoves(moves) {
    moves.forEach(move => {
        const square = document.querySelector(`[data-position="${move.to}"]`);
        square.classList.add('highlight');
    });
}

// Remove move highlights
function removeHighlights() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('highlight');
    });
}

// Update move history
function updateMoveHistory(move) {
    const moveString = `${Math.ceil(chess.history().length / 2)}. ${move.san}`;
    moveHistory.innerHTML += `<div>${moveString}</div>`;
}

// Update game status
function updateGameStatus() {
    if (chess.in_checkmate()) {
        gameStatus.textContent = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
        stopTimer();
    } else if (chess.in_draw()) {
        gameStatus.textContent = "Game drawn!";
        stopTimer();
    } else if (chess.in_check()) {
        gameStatus.textContent = "Check!";
    } else {
        gameStatus.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    }
}

// Timer functions
function startTimer() {
    timerInterval = setInterval(() => {
        chess.turn() === 'w' ? whiteTime-- : blackTime--;
        updateClocks();
        checkTimeExpired();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateClocks() {
    document.getElementById('white-time').textContent = formatTime(whiteTime);
    document.getElementById('black-time').textContent = formatTime(blackTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function checkTimeExpired() {
    if (whiteTime <= 0 || blackTime <= 0) {
        stopTimer();
        gameStatus.textContent = `Time's up! ${whiteTime <= 0 ? 'Black' : 'White'} wins!`;
    }
}

// Initialize the game
initGame();
