let deck = [];
let playerHand = [];
let dealerHand = [];
let gameState = 'betting';
let shillings = 100;
let currentBet = 0;

// Build a standard 52-card deck
function buildDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // 1 = Ace, 11 = J, 12 = Q, 13 = K
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Convert a card object to HTML element
function cardToHTML(card) {
    const suits = {
        'hearts': '♥',
        'diamonds': '♦',
        'clubs': '♣',
        'spades': '♠'
    };
    const rankDisplay = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][card.rank];
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.suit}`;
    cardDiv.textContent = `${rankDisplay}${suits[card.suit]}`;
    return cardDiv;
}

// Calculate hand value, handling aces as 1 or 11
function calculateHandValue(hand) {
    let total = 0;
    let aces = 0;
    for (let card of hand) {
        if (card.rank >= 2 && card.rank <= 10) {
            total += card.rank;
        } else if (card.rank >= 11 && card.rank <= 13) {
            total += 10; // J, Q, K are worth 10
        } else if (card.rank === 1) {
            aces += 1;
            total += 1; // Initially count ace as 1
        }
    }
    if (aces > 0 && total + 10 <= 21) {
        total += 10; // Count one ace as 11 if it doesn't bust
    }
    return total;
}

// Update shillings display
function updateShillings() {
    document.getElementById('shillings').textContent = shillings;
}

// Update the game display
function updateDisplay() {
    const playerHandDiv = document.getElementById('player-hand');
    playerHandDiv.innerHTML = '';
    for (let card of playerHand) {
        playerHandDiv.appendChild(cardToHTML(card));
    }

    const dealerHandDiv = document.getElementById('dealer-hand');
    dealerHandDiv.innerHTML = '';
    if (gameState === 'player-turn') {
        dealerHandDiv.appendChild(cardToHTML(dealerHand[0]));
        const hiddenCard = document.createElement('div');
        hiddenCard.className = 'card hidden';
        hiddenCard.textContent = '?';
        dealerHandDiv.appendChild(hiddenCard);
    } else {
        for (let card of dealerHand) {
            dealerHandDiv.appendChild(cardToHTML(card));
        }
    }

    document.getElementById('player-score').textContent = `Score: ${calculateHandValue(playerHand)}`;
    if (gameState === 'dealer-turn' || gameState === 'game-over') {
        document.getElementById('dealer-score').textContent = `Score: ${calculateHandValue(dealerHand)}`;
    } else {
        document.getElementById('dealer-score').textContent = 'Score: ?';
    }
}

// Deal a card from the deck to a hand
function dealCardTo(hand) {
    hand.push(deck.pop());
}

// Start a new game after a valid bet
function startGame() {
    if (shillings <= 0) {
        endGame('Game Over - No shillings left!');
        return;
    }
    deck = buildDeck();
    shuffle(deck);
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    gameState = 'player-turn';
    updateDisplay();

    // Check for immediate Blackjack
    if (calculateHandValue(playerHand) === 21) {
        if (calculateHandValue(dealerHand) === 21) {
            endGame('Push');
        } else {
            endGame('Player wins with Blackjack!');
        }
    } else if (calculateHandValue(dealerHand) === 21) {
        gameState = 'game-over';
        updateDisplay();
        endGame('Dealer wins with Blackjack!');
    }
}

// Player hits (takes another card)
function hit() {
    if (gameState !== 'player-turn') return;
    dealCardTo(playerHand);
    updateDisplay();
    if (calculateHandValue(playerHand) > 21) {
        endGame('Dealer wins - Player busts');
    }
}

// Player stands (ends their turn)
function stand() {
    if (gameState !== 'player-turn') return;
    gameState = 'dealer-turn';
    updateDisplay();
    dealerTurn();
}

// Dealer's turn
function dealerTurn() {
    while (calculateHandValue(dealerHand) < 17) {
        dealCardTo(dealerHand);
        updateDisplay();
    }
    const playerScore = calculateHandValue(playerHand);
    const dealerScore = calculateHandValue(dealerHand);
    if (dealerScore > 21 || playerScore > dealerScore) {
        endGame('Player wins');
    } else if (playerScore < dealerScore) {
        endGame('Dealer wins');
    } else {
        endGame('Push');
    }
}

// End the game and handle payouts
function endGame(result) {
    gameState = 'game-over';
    updateDisplay();

    // Handle betting payouts
    if (result.includes('Player wins')) {
        shillings += currentBet * 2; // Player gets bet back + dealer's match
    } else if (result === 'Push') {
        shillings += currentBet; // Bet returned
    } // Loss: Bet already deducted, no change
    updateShillings();

    alert(result);

    // Check for game over due to no shillings
    if (shillings <= 0) {
        alert('Game Over - You have no shillings left!');
        document.getElementById('place-bet').disabled = true;
        document.getElementById('hit').disabled = true;
        document.getElementById('stand').disabled = true;
    } else {
        gameState = 'betting';
        currentBet = 0;
        document.getElementById('hit').disabled = true;
        document.getElementById('stand').disabled = true;
    }
}

// Place bet and start game
document.getElementById('place-bet').addEventListener('click', () => {
    if (gameState !== 'betting') return;
    const betInput = document.getElementById('bet-amount').value;
    const bet = parseInt(betInput);
    if (isNaN(bet) || bet <= 0 || bet > shillings) {
        alert('Please enter a valid bet (1 to ' + shillings + ' shillings)');
        return;
    }
    currentBet = bet;
    shillings -= bet; // Deduct bet immediately
    updateShillings();
    document.getElementById('hit').disabled = false;
    document.getElementById('stand').disabled = false;
    startGame();
});

// Add event listeners to game buttons (disabled until bet is placed)
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);

// Initial setup: Disable hit/stand until bet is placed
document.getElementById('hit').disabled = true;
document.getElementById('stand').disabled = true;