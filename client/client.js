console.log('client.js is executing')

// socket emitter across server
var socket = io();
let roomUniqueId = null;
let player1 = false;
const MAX_HEALTH = 50;
rerolls = 2;
let playerHP = MAX_HEALTH;
let opponentHP = MAX_HEALTH;
statuses = {
    'poisoned' : 0,
    'regeneration' : 0,
    'luck' : 0,
    'sunlight' : 0,
    'strength' : 0,
    'weakened' : 0,
    'vulnerable' : 0
};
player2Statuses = {
    'poisoned' : 0,
    'regeneration' : 0,
    'luck' : 0,
    'sunlight' : 0,
    'strength' : 0,
    'weakened' : 0,
    'vulnerable' : 0
};

const INITIAL_CARDS_PER_DRAFT = 3; // amount of cards per draft at start
const INITIAL_DRAFT_CARDS = 3; // amount of cards you draft at start
CARDS_PER_REG_DRAFT = 3; // cards per draft throughout game
draft_extra_card = 0; 
temp_draft_extra_card = 0;

chanceLuckAddsRare = 0.2;
chanceLuckAddsLegendaryIfNotRare = 0.15;

raresInDraft = 1;
legendariesInDraft = 0;

// this will store all of our cards
hand = [];
opponentHand = [];

function createGame(){
    // console.log([1, 5] == [1, 5]);
    // console.log([1, 5] == [1, 4]);
    // console.log([1, 5] == [1, 5, 1]);
    player1 = true;
    socket.emit('createGame');
}

function joinGame() {
    roomUniqueId = document.getElementById('roomUniqueId').value;
    socket.emit('joinGame', {roomUniqueId: roomUniqueId});
}

socket.on('newGame', (data) => {
    roomUniqueId = data.roomUniqueId;
    document.getElementById('initial').style.display = 'none';

    document.getElementById('gamePlay').style.display = 'flex';

    // create button with event listener that saves uniqueRoomId to clipboard
    let copyButton = document.createElement('button');
    copyButton.style.display = 'flex';
    copyButton.innerText = 'Copy Code';
    copyButton.addEventListener('click', () =>{
        navigator.clipboard.writeText(roomUniqueId).then(function() {
            console.log('Async: Copying to clipboard was successful');
        },  function(err){
            console.error('Async: Could not copy text: ', err)
        }); 
    });

    document.getElementById('waitingArea').innerHTML = `Waiting for opponent, please share code ${roomUniqueId} to join`;
    document.getElementById('waitingArea').appendChild(copyButton);
}); 

socket.on('playersConnected', () => {
    console.log('players connected');
    document.getElementById('initial').style.display ='none';
    document.getElementById('waitingArea').style.display ='none';
    document.getElementById('gameArea').style.display = 'flex';
    playerHP = MAX_HEALTH;
    //////////////// ADD HERE TO TEST CARDS
    hand = [];
    draftCard(INITIAL_CARDS_PER_DRAFT, INITIAL_DRAFT_CARDS, raresInDraft, legendariesInDraft);
});

// if opposing player data sent, show their card
socket.on('p1Choice', (data) => {
    console.log('player1choicecalled');
    if(!player1) {
        createOpponentChoiceButton(data);
    }
})

// if opposing player data sent, show their card
socket.on('p2Choice', (data) => {
    console.log('player2choicecalled');
    if(player1) {
        createOpponentChoiceButton(data);   
    }
})

socket.on('determineRound', (data) => {
    player1Card = '';
    player2Card = '';
    player1Statuses = {};
    player2Statuses = {};

    // set card name this player played player1Card, and opposing player card name to player2Card 
    player1 ? player1Card = data.p1CardText : player2Card = data.p1CardText;
    player1 ? player2Card = data.p2CardText : player1Card = data.p2CardText;

    // set status of opposing player to player2Status, for tracking certain cards
    player1 ? player1Statuses = data.p1Status : player2Statuses = data.p1Status;
    player1 ? player2Statuses = data.p2Status : player1Statuses = data.p2Status;


    yourCard = deck.find(item => item.name === player1Card);
    theirCard = deck.find(item => item.name === player2Card);
    console.log(`you played ${yourCard.name}, they played ${theirCard.name}`)

    //use interactions from your card
    if(theirCard.name == 'cancel' || yourCard.name == 'cancel'){
        console.log('CANCELLED');
    }
    else if (theirCard.name in yourCard.playerInteractions){
        console.log('THEIR CARD AFFECTS YOUR CARDS ACTIONS ON YOURSELF');
        resolveCardInteractions(yourCard.playerInteractions[theirCard.name]);
    }
    else{
            console.log('resolving your cards base interactions')
        resolveCardInteractions(yourCard.playerInteractions['base']);
    }

    // status interactions after your card can interact w it, before it procs
    resolveStatusesMidInteractions();


    //use interactions from their card
    if(theirCard.name == 'cancel' || yourCard.name == 'cancel'){
        console.log('CANCELLED');
    }
    else if (yourCard.name in theirCard.opponentInteractions){
        console.log('YOUR CARD AFFECTS THEIR CARDS ACTIONS ON YOU')
        resolveCardInteractions(theirCard.opponentInteractions[yourCard.name]);
    }
    else{
        console.log('resolving their cards base interactions');
        resolveCardInteractions(theirCard.opponentInteractions['base']);
    }

    // status interactions after cards have resolved
    resolveStatusesPostInteractions();



    console.log('calling determineRound');

    const choiceEvent = player1 ? 'p1RoundValuesSent' : 'p2RoundValuesSent';
    socket.emit(choiceEvent, {
        rpsValue: data.rpsValue,
        roomUniqueId: roomUniqueId,
        playerHP: playerHP,
        statuses : statuses
    });

});

// when results are called, turn has been played. show results text and create continue button
socket.on('result', (data) => {

    //update statuses
    console.log('updatingstatus');
    player1 ? player1Statuses = data.p1Status : player2Statuses = data.p1Status;
    player1 ? player2Statuses = data.p2Status : player1Statuses = data.p2Status;


    // remove opponent's hand from showing
    document.getElementById('opponentHand').innerHTML = '';

    //determine the rare and legendary amount in the next draft
    raresInDraft = data.rares;
    legendariesInDraft = data.legendaries;


    //update player health
    playerStateString = createPlayerStateString(playerHP, statuses);
    document.getElementById('playerState').innerHTML = `You: ${playerStateString}`;
    //update opponent health and status
    player1 ? opponentHP = data.player2HP : opponentHP = data.player1HP;
    console.log(`Opponent ${player2Statuses['poisoned']}`);
    opponentString = createPlayerStateString(opponentHP, player2Statuses);
    document.getElementById('opponentState').innerHTML = `Opponent<br> ${opponentString}`;


    // update player health bars :)
    updateHealthBars();

    document.getElementById('winnerArea').style.display = 'flex';
    document.getElementById('winnerArea').classList.add('centerColumn');
    let winnerText = '';
    console.log(data.winner);
    console.log(player1)


    winnerText = 'Round results!';

    // show what opponent played w button made in make opponent button function
    //document.getElementById('opponentState').style.display = 'none';
    document.getElementById('opponentButton').style.display = 'flex';
    document.getElementById('winnerArea').innerHTML = winnerText;

    // create continue button
    let continueButton = document.createElement('button');
    continueButton.style.display = 'flex';
    continueButton.innerText = 'CONTINUE';
    
    // button emits nextRound to server and removes itself
    continueButton.addEventListener('click', () =>{
        console.log('pressed continue')
        continueButton.style.display = 'none';
        document.getElementById('winnerArea').innerHTML = 'Waiting on opponent...';
        socket.emit('nextRound', {
            roomUniqueId: roomUniqueId
        });
    });

    document.getElementById('winnerArea').appendChild(continueButton);
    
});

// next round called, we have to reset game state from RESULTS to CREATEGAME
socket.on('nextRound', () => {
    //resolve statuses at start of round?
    //resolveStatusesPreRound();

    // display correct area, reset playerChoices
    //reset visuals to start of round
    playerStateString = createPlayerStateString(playerHP, statuses);
    document.getElementById('playerState').innerHTML = `You: ${playerStateString}`;

    //resolve statuses at the start of the round before drafting
    resolveStatusesPreRound();

    // emit p1statuses or p2statuses w rpsValue choice in roomUniqueId 
    const statusEvent = player1 ? 'p1Status' : 'p2Status';
    console.log(`this is statuses ${statuses}`);
    socket.emit(statusEvent, {
        roomUniqueId: roomUniqueId,
        playerHP: playerHP,
        statuses: statuses   
    });
});
socket.on('updateStatuses', (data) => {
    console.log('updatingstatus');
    player1 ? player1Statuses = data.p1Status : player2Statuses = data.p1Status;
    player1 ? player2Statuses = data.p2Status : player1Statuses = data.p2Status;
    nextRoundDraft();
});

function nextRoundDraft(){
    console.log(`player 2 statuses`);
    console.log(`player 2 statuses = ${player2Statuses['poisoned']}`);

    // update player health bars :)
    updateHealthBars();
    
    document.getElementById('opponentState').style.display = 'flex'; //show opponent status
    opponentString = '';
    opponentString = createPlayerStateString(opponentHP, player2Statuses);
    console.log(`opponentString: ${opponentString}`);
    document.getElementById('opponentState').innerHTML = `Waiting for Opponent<br> ${opponentString}`; 
    document.getElementById('opponentCard').innerHTML = ''; //remove opponent card button
    document.getElementById('winnerArea').style.display = 'none'; //remove results area
    document.getElementById('playerChoices').innerHTML = ''; //reset player choices
    document.getElementById('gamePlay').style.display = 'flex'; //show area to play game



    if(statuses['luck'] > 0){
        //determine if luck adds a rare, legendary or common
        if (rollItem(chanceLuckAddsRare))
            raresInDraft++;
        else if (rollItem(chanceLuckAddsLegendaryIfNotRare))
            legendariesInDraft++;
        draftCard(CARDS_PER_REG_DRAFT + 1, 1 + draft_extra_card + temp_draft_extra_card, raresInDraft, legendariesInDraft);
    }    
    else
            draftCard(CARDS_PER_REG_DRAFT, 1 + draft_extra_card + temp_draft_extra_card, raresInDraft, legendariesInDraft);
    // for every card in our hand, we create a button that when clicked calls sendChoice() with its name + removes other cards

    // remove temporary extradraft
    temp_draft_extra_card = 0;

}

socket.on('gameOver', (data) => {
    winnerText = '';
    console.log('game over');
    // update healths
    playerStateString = createPlayerStateString(playerHP, statuses);
    document.getElementById('playerState').innerHTML = `You:<br>${playerStateString}`;
    player1 ? opponentHP = data.player2HP : opponentHP = data.player1HP;
    opponentString = createPlayerStateString(opponentHP, player2Statuses);
    document.getElementById('opponentState').innerHTML = `Opponent ${opponentString}`;
    // show what opponent played at end
    document.getElementById('opponentButton').style.display = 'flex';
    
    // update player health bars :)
    updateHealthBars();

    console.log(`data.winner = ${data.winner}`);

    if(data.winner != 'd'){
        console.log(`not draw`);

        if ( (data.winner == 'p1' && player1) ||  (data.winner == 'p2' && !player1) ){
            console.log(`victory `);
            winnerText = 'VICTORY!';
        } else {
            winnerText = 'DEFEAT';
        }
    }
    else
        winnerText = "DRAW";

    document.getElementById('winnerArea').style.display = 'flex';
    document.getElementById('winnerArea').classList.add('centerColumn');
    document.getElementById('winnerArea').innerHTML = `<h1>${winnerText}</h1>`;
    
});
    
// user has selected a choice! the choice will be a string stored in rpsValue
function sendChoice(rpsValue){
    // emit p1choice or p2choice w rpsValue choice in roomUniqueId 
    const choiceEvent = player1 ? 'p1Choice' : 'p2Choice';

    //health testing
    //playerHP--;

    socket.emit(choiceEvent, {
        rpsValue: rpsValue,
        roomUniqueId: roomUniqueId,
        playerHP: playerHP,
        statuses : statuses   
    });

    // following hides all cards and creates a new card that showcases the card selected

    // sets class = css classes to make it an image, e.g. 'class = rock'
    let playerChoiceButton = document.createElement('button');
    playerChoiceButton.style.display = 'flex';
    playerChoiceButton.classList.add(rpsValue.toString().toLowerCase());

    playerChoiceButton.innerText = rpsValue;
    document.getElementById('playerChoices').innerHTML = '';
    // center row makes appended elements next to each other in player1Choice
    document.getElementById('playerChoices').classList.add('centerRow');
    document.getElementById('playerChoices').appendChild(playerChoiceButton);

}   


function createOpponentHands(){
    for(card in opponentHand){
        // hide draft select
        document.getElementById('showHandForDraft').innerHTML ='';
        document.getElementById('thisIsYourHand').innerHTML ='';

        card = opponentHand[card];
        //console.log(`opponent's card: ${card.name}`)
        opponentString = createPlayerStateString(opponentHP, player2Statuses);    
        document.getElementById('opponentState').innerHTML = `Opponent's hand: (waiting)<br>${opponentString}`;

        //create each cards button
        let opponentCard = document.createElement('button');
        opponentCard.style.display = 'flex';
        opponentCard.classList.add(`rare${card.rarity}`);
        opponentCard.innerText = `rare${card.rarity}`;
        document.getElementById('opponentHand').classList.add('centerRow');
        document.getElementById('opponentHand').appendChild(opponentCard);         
        //each button can be clicked to call sendChoice and be the only card shown
    }

}

// takes in rpsValue:rpsValue and roomUniqueId:roomUniqueID
// 
function createOpponentChoiceButton(data){

    document.getElementById('opponentCard').innerHTML = '';

    opponentString = createPlayerStateString(opponentHP, player2Statuses);
    document.getElementById('opponentState').innerHTML = `Opponent made a choice<br> ${opponentString}`;

    let opponentButton = document.createElement('button');
    // sets class = css classes to make it an image, e.g. 'class = rock'
    opponentButton.classList.add(data.rpsValue.toString().toLowerCase());
    opponentButton.id = 'opponentButton';
    opponentButton.style.display = 'none';
    opponentButton.innerText = data.rpsValue;
    document.getElementById('opponentCard').appendChild(opponentButton);
}

socket.on('showHands', (data) => {

    player1 ? opponentHand = data.p2Hand : opponentHand = data.p1Hand;
    console.log(`opponent's hand: ${opponentHand}`);
    createOpponentHands();

    playCards();
});

// place all cards from hand onto area, choose one to sendChoice() with, remove that card from hand
function playCards(){
    //resolve status phase 1 after drafting b4 playing a card
    // I WANT TO EMIT THIS TO THE OTHER ROOMS

    //update heading
    document.getElementById('extraButtons').innerHTML = '';

    playerStateString = createPlayerStateString(playerHP, statuses);
    document.getElementById('playerState').innerHTML = `You:<br> ${playerStateString}`;
    document.getElementById('playerState').innerHTML = `Use a card:<br> ${playerStateString}`;
    for(card in hand){

        card = hand[card];
        //console.log(`creating card ${card.name}`)
        
        //create each cards button
        let playerChoiceButton = document.createElement('button');
        playerChoiceButton.style.display = 'flex';
        playerChoiceButton.classList.add(card.name);
        playerChoiceButton.innerText = card.name;
        document.getElementById('playerChoices').classList.add('centerRow');
        document.getElementById('playerChoices').appendChild(playerChoiceButton);         
        //each button can be clicked to call sendChoice and be the only card shown
        playerChoiceButton.addEventListener('click', () =>{

            console.log(`playing ${playerChoiceButton.innerText} card`)
            playerChoiceButton.style.display = 'none';
            //REMOVE PLAYED CARD FROM HAND
            cardObject = hand.find(item => item.name === playerChoiceButton.innerText);
            index = hand.indexOf(cardObject);
            if (index > -1) { // only splice array when item is found
              hand.splice(index, 1); // 2nd parameter means remove one item only
            }
            sendChoice(playerChoiceButton.innerText);
        });
    }
}

// display cards from deck w no repeat, allow one to be picked and added to hand, allow rerolls too
function draftCard(cardCount, cardsLeft, rares, legendaries){
    // remove potential rerollButton
    document.getElementById('extraButtons').innerHTML = '';
    playerStateString = createPlayerStateString(playerHP, statuses);
    document.getElementById('playerState').innerHTML = `PICK A CARD TO ADD TO YOUR HAND <BR><mark>${cardsLeft} cards left.<br></mark>${playerStateString}`;

    // create list of cards to put in draft
    let draft = createDraftChoices(cardCount, rares, legendaries); // 1 card with rarity 1, 1 card with rarity 2, and 1 other

    //show your hand during the draft
    document.getElementById('showHandForDraft').innerHTML ='';
    document.getElementById('thisIsYourHand').innerHTML ='';

    displayHandDuringDraft();
    
    // displays all cards in hand to play
    for(card in draft){
        card = draft[card];
        //console.log(`creating card ${card.name}`)
        let playerChoiceButton = document.createElement('button');
        playerChoiceButton.style.display = 'flex';
        playerChoiceButton.classList.add(card.name);
        playerChoiceButton.innerText = card.name;
        document.getElementById('playerChoices').classList.add('centerRow');
        document.getElementById('playerChoices').appendChild(playerChoiceButton); 
        
        playerChoiceButton.addEventListener('click', () =>{
            console.log(`drafted ${playerChoiceButton.innerText} card`)
            //ADD DRAFTED CARD TO HAND
            cardObject = deck.find(item => item.name === playerChoiceButton.innerText);
            hand.push(cardObject)
            cardsLeft--;
            document.getElementById('playerChoices').innerHTML = '';
            if (cardsLeft == 0 || hand.length >= 8){

                document.getElementById('showHandForDraft').innerHTML ='';
                document.getElementById('thisIsYourHand').innerHTML ='';
            
                displayHandDuringDraft();
                            const choiceEvent = player1 ? 'p1Drafted' : 'p2Drafted';

                playerStateString = createPlayerStateString(playerHP, statuses);
                document.getElementById('playerState').innerHTML = `You:<br>${playerStateString}`;
            
                document.getElementById('playerChoices').innerHTML = '';
                document.getElementById('extraButtons').innerHTML = '';
        
                socket.emit(choiceEvent, {
                    // playerHP: playerHP,
                    roomUniqueId : roomUniqueId,
                    statuses : statuses,
                    hand : hand
                });            
                //playCards()
            }
            else
                draftCard(cardCount, cardsLeft, rares, legendaries);
        });
    }
    // REROLL BUTTON WEWOOO
    if(rerolls > 0){
        let rerollButton = document.createElement('button');
        rerollButton.style.display = 'block';
        rerollButton.innerText = `Reroll (${rerolls} left)`;
        // reroll button resets the draft w stats
        rerollButton.addEventListener('click', () =>{
            rerolls--;
            console.log('rerolled!')
            rerollButton.style.display = 'none';
            document.getElementById('playerChoices').innerHTML = '';
            document.getElementById('extraButtons').innerHTML = '';
            draftCard(cardCount, cardsLeft, rares, legendaries);
        });
        document.getElementById('extraButtons').appendChild(rerollButton);
    }
}

// resolve statuses at the start of the round before drafting
function resolveStatusesPreRound(){
    if(statuses['regeneration'] > 0){
        playerHP += statuses['regeneration'];
        statuses['regeneration'] = statuses['regeneration'] - 1;
    }
    if(statuses['luck'] > 0){
        statuses['luck'] -= 1;
    }

    ensureHpAndStatusValuesValid();
}

// status triggers before cards resolve, adding status from card doesn't insta-decrement
function resolveStatusesMidInteractions(){
    // poison damage ticks at start, so initial poison count is damage taken
    if(statuses['poisoned'] > 0 )
        playerHP -= statuses['poisoned'];

    ensureHpAndStatusValuesValid();
}

// status triggers after cards resolve
function resolveStatusesPostInteractions(){
    if(statuses['poisoned'] > 0 ){
        statuses['poisoned'] = statuses['poisoned'] -1;
    }
    // ensure hp do not go above max
    if(playerHP > MAX_HEALTH){
        playerHP = MAX_HEALTH;
    }        
    ensureHpAndStatusValuesValid();
}

function ensureHpAndStatusValuesValid(){
    // ensure statuses do not go negative
    for (let status in statuses) {
        if (statuses[status] < 0 && status != 'strength') {
            statuses[status] = 0;
        }
    }
    // ensure hp does not go above max
    if(playerHP > MAX_HEALTH){
        playerHP = MAX_HEALTH;
    }
}

function resolveCardInteractions(interactionsDict){
    initialHP = playerHP;
    selfDamage = false;

    // check if card has selfdamage tag
    if(interactionsDict['selfDamage'])
        selfDamage = true;

    // stampede and medicinalherb, nature sunlight dependent cards go before sunlight consumption
    if(interactionsDict['HPxSunlight']){
        playerHP += statuses['sunlight'] * interactionsDict['HPxSunlight'];
        console.log(`healing ${statuses['sunlight'] * interactionsDict['HPxSunlight']} hp!`)
    }if(interactionsDict['DMGxSunlight'])
        playerHP += player2Statuses['sunlight'] * interactionsDict['DMGxSunlight'];
    
    // you play elephant, check if you have 6 sunlight, then heal
    if(interactionsDict['elephantHeal'])
        if(statuses['sunlight'] >= 10){
            playerHP = MAX_HEALTH;
            statuses['sunlight'] -= 10;
        }
    // opponent plays elephant, if they have less than 6 sunlight take 12 dmg
    if(interactionsDict['elephantAttack']){
        if(player2Statuses['sunlight'] < 10){
            playerHP -= 16;
        }
    }

    // nighttime, 10 sunlight to gain extra draft, or gain x sunlight 
    if (interactionsDict['nighttime']){
        if((statuses['sunlight'] + player2Statuses['sunlight'])>= 10)
            draft_extra_card++;
        else
            statuses['luck'] += statuses['sunlight'] + player2Statuses['sunlight'];
        statuses['sunlight'] = 0;
    }
    // nighttime blocked by shield, 10 sunlight to gain extra draft, or gain x sunlight 
    if (interactionsDict['nighttimeHalf']){
        if(statuses['sunlight'] >= 10)
            draft_extra_card++;
        else
            statuses['luck'] += statuses['sunlight'];
        statuses['sunlight'] = 0;
    }

    // withered petals
    if (interactionsDict['witheredpetals']){
        totalConsumed = statuses['sunlight'] + statuses['poisoned'] + player2Statuses['sunlight'] + player2Statuses['poisoned'];
        playerHP += totalConsumed;
        statuses['sunlight'] = 0;
        statuses['poisoned'] = 0;
    }
    // withered petals
    if (interactionsDict['witheredpetalsBlocked']){
        totalConsumed = statuses['sunlight'] + statuses['poisoned'] +  player2Statuses['poisoned'];
        playerHP += totalConsumed;
        statuses['sunlight'] = 0;
        statuses['poisoned'] = 0;
    }


    if(interactionsDict['hp']){
        playerHP += interactionsDict['hp'];
    }
    if(interactionsDict['poison']){
        // if adding poison, and currently poisoned, add extra poison to offset decrement
        if(statuses['poisoned'] == 0 && interactionsDict['poison'] > 0)
            statuses['poisoned'] += interactionsDict['poison'] + 1;
        else
            statuses['poisoned'] += interactionsDict['poison'];
    }
    if(interactionsDict['sunlight']){
        statuses['sunlight'] += interactionsDict['sunlight'];
    }
    if(interactionsDict['reroll']){
        rerolls += interactionsDict['reroll'];
    }
    if(interactionsDict['luck']){
        statuses['luck'] += interactionsDict['luck'];
    }
    if(interactionsDict['regen']){
        statuses['regeneration'] += interactionsDict['regen'];
    }
    if(interactionsDict['strength']){
        statuses['strength'] += interactionsDict['strength'];
    }

    if(interactionsDict['clearNegativeEffects']){
        statuses['poisoned'] = 0;
        statuses['weakened'] = 0;
        statuses['vulnerable'] = 0;
        
    }

    // chemist : apply 3 poison, if they were already poisoned deal 3dmg
    if(interactionsDict['chemist']){
        if(statuses['poisoned'] > 0 )
            playerHP -= 4;
        statuses['poisoned'] += 3;
    }
    // venomsting, if poision'd get poison'd for 5, else get poison'd for 3
    if(interactionsDict['venomsting']){
        if(statuses['poisoned'] > 0)
            statuses['poisoned'] += 2;
        statuses['poisoned'] += 3;
    }
    // neurotoxins: apply 3 poison, then deal dmg according to poison
    if(interactionsDict['neurotoxins']){
        statuses['poisoned'] += 3;
        playerHP -= statuses['poisoned'];

        if(statuses['poisoned'] == 3)
            statuses['poisoned'] += 1;
    }

    // leach : apply 3 poison, then heal according to poison
    if(interactionsDict['leech']){
        playerHP += player2Statuses['poisoned'] + 3;
    }
    // epidemic: apply 2 poison, then double poison on opponent
    if(interactionsDict['epidemic']){
        statuses['poisoned'] += 3;
        statuses['poisoned'] *= 2;
    }
    //discardleftmostcard
    // reset hands, now pick two cards each turn
    if(interactionsDict['throwCard']){
        if (hand.length > 1){
            hand.shift();
        }
    }
    // armsrace, empty hand, get 2 cards every turn now
    if(interactionsDict['armsrace']){
        hand = [];
        draft_extra_card++
    }
    // scavenge, increase # cards every turn next turn
    if(interactionsDict['scavenge']){
        temp_draft_extra_card++;
    }
    // merge both players statuses
    if(interactionsDict['mergerealities']){
        for (let status in statuses) {
            statuses[status] += player2Statuses[status];
            }
    }    

    ensureHpAndStatusValuesValid();

    // calculate damage modifiers like strength, vulnerable, and weak
    damageTaken = initialHP - playerHP;    
    if ((damageTaken) > 0 && !selfDamage){
        damageTaken += player2Statuses['strength'];
    
        playerHP = initialHP;
        playerHP -= damageTaken;
    }
    

    
}


function createDraftChoices(cardCount = 3, rares = 0, legendaries = 0) {
    draft = [];
    // Filter cards by rarity
    raresDeck = deck.filter(card => card.rarity == 2);
    legendsDeck = deck.filter(card => card.rarity == 3);
    commons = deck.filter(card => card.rarity !== 2 && card.rarity !== 3);

    // Shuffle each group of cards
    shuffledRares = raresDeck.sort(() => 0.5 - Math.random());
    shuffledLegends = legendsDeck.sort(() => 0.5 - Math.random());
    shuffledCommons = commons.sort(() => 0.5 - Math.random());


    // select rare and legendary cards for the draft (legendaries + rares will always be less than 4)
    if(legendaries > 0 && rares > 0){
        draft = [
            ...shuffledLegends.slice(0, legendaries),
            ...shuffledRares.slice(0, rares),
        ];
    }
    else if (legendaries > 0){
        draft = [
            ...shuffledLegends.slice(0, legendaries),
        ];
    }
    else if (rares > 0){
        draft = [
            ...shuffledRares.slice(0, rares),
        ];
    }
    
    // fill remaining slots with common cards
    const remainingCount = cardCount - draft.length;
    if (remainingCount > 0) {
        draft.push(...shuffledCommons.slice(0, remainingCount));
    }

    // reverse so it goes commons, rares, legendaries
    draft.reverse();
    return draft;

    // ensure hp do not go above max
    if(playerHP > MAX_HEALTH){
        playerHP = MAX_HEALTH;
    }
}

function createFirstCards(){

    console.log('displaying first cards');
    cardsDisplayed = 3;
    let firstCards =  deck;
    firstCards = firstCards.sort(() => Math.random() - Math.random()).slice(0, cardsDisplayed)
    for(card in firstCards){
        card = firstCards[card];
        //create each cards button
        let firstCard = document.createElement('button');
        firstCard.style.display = 'flex';
        firstCard.classList.add(card.name);
        firstCard.innerText = card.name;
        document.getElementById('firstCards').classList.add('centerRow');
        document.getElementById('firstCards').appendChild(firstCard);
    }
}
function displayHandDuringDraft(){
    document.getElementById('thisIsYourHand').innerHTML = 'Current Hand:';

    for(card in hand){

        card = hand[card];
        //console.log(`creating card ${card.name}`)
        
        //create each cards button
        let playerChoiceButton = document.createElement('button');
        playerChoiceButton.style.display = 'flex';
        playerChoiceButton.classList.add(card.name);
        playerChoiceButton.innerText = card.name;
        document.getElementById('showHandForDraft').classList.add('centerRow');
        document.getElementById('showHandForDraft').appendChild(playerChoiceButton);
    }
}

function createPlayerStateString(playerHP, statusesString){
    playerStateString = '';
    playerStateString += `${playerHP}/${MAX_HEALTH}hp`;
    if(statusesString['strength'] != 0 )
        playerStateString += `, strength: ${statusesString['strength']}`;

    if(statusesString['sunlight'] > 0 )
        playerStateString += `, sunlight: ${statusesString['sunlight']}`;

    if(statusesString['luck'] > 0 )
        playerStateString += `, Luck: ${statusesString['luck']}`;

    if(statusesString['regeneration'] > 0 )
        playerStateString += `, Regen: ${statusesString['regeneration']}`;

    if(statusesString['poisoned'] > 0 )
        playerStateString += `, Poison: ${statusesString['poisoned']}`;

    return playerStateString;
}

// returns true or false if a chance of chance % occurs
function rollItem(chance) {
    let roll = Math.random();

    if (roll < chance) return true;
    
    return false; 
}

function updateHealthBars(){

    healthBar = document.getElementById("healthBar");
    poisonBar = document.getElementById("poisonBar");
    healthBarOpp = document.getElementById("healthBarOpp");
    poisonBarOpp = document.getElementById("poisonBarOpp");
    if(playerHP > 0){
        if(statuses['poisoned'] * 2 > playerHP){
            healthBar.style.width = `$0%`; 
            poisonBar.style.width = `${playerHP * 2}%`;        
        }
        else{
            healthBar.style.width = `${(playerHP * 2) - (statuses['poisoned'] * 2)}%`; 
            poisonBar.style.width = `${statuses['poisoned'] * 2}%`;
        } 
    } else {
        healthBar.style.width = `0%`; 
        poisonBar.style.width = `0%`;         
    }

    if(opponentHP > 0){
        if(player2Statuses['poisoned'] * 2 > opponentHP){
            healthBarOpp.style.width = `$0%`; 
            poisonBarOpp.style.width = `${opponentHP * 2}%`;        
        }
        else{
        healthBarOpp.style.width = `${(opponentHP * 2) - (player2Statuses['poisoned'] * 2)}%`; 
        poisonBarOpp.style.width = `${player2Statuses['poisoned'] * 2}%`; 
        }
    }
    else{
        healthBarOpp.style.width = `0%`; 
        poisonBarOpp.style.width = `0%`;         
        
    }
}

{/* <div id='healthBar' class="progress-bar progress-bar-danger" role="progressbar" style="width: 20%">
</div>
<div id='poisonBar' class="progress-bar progress-bar-success" role="progressbar" style="width: 50%">
</div> */}
