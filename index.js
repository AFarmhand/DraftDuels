/*
fnm env --use-on-cd | Out-String | Invoke-Expression
// use this to set up fast node manager environment
use nodemon index.js to contionusly run
*/


const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

rooms = {};

app.use(express.static(path.join(__dirname, 'client')));

app.get('/healthcheck', (req, res) => {
    res.send('Game Running...');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

io.on("connect_error", (err) => {
    // the reason of the error, for example "xhr poll error"
    console.log(err.message);
});

// when there is a connection, check for all in-game events
io.on('connection', ( socket ) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('createGame', () => {
        const roomUniqueId = makeId(6);
        console.log(`checking roomId: ${roomUniqueId}`)
        rooms[roomUniqueId] = {};
        rooms[roomUniqueId].continueCount = 0;
        socket.join(roomUniqueId);
        socket.emit("newGame", {roomUniqueId: roomUniqueId});
        console.log(roomUniqueId);
        rooms[roomUniqueId].full = false;
    });

    // called when player 2 joins room
    socket.on('joinGame', (data) => {
        if(rooms[data.roomUniqueId] != null && !rooms[data.roomUniqueId].full) {
            rooms[data.roomUniqueId].full = true;
            // joins player2's socket with player1 and emits playersConnected to room
            socket.join(data.roomUniqueId);
            console.log(`emitting with roomUniqueId: ${data.roomUniqueId}`);
            socket.to(data.roomUniqueId).emit("playersConnected", {});
            socket.emit("playersConnected");
        }
    })

    // when player 1 has made a choice, set p1choice to that
    socket.on('p1Choice', (data) => {
        let rpsValue = data.rpsValue;
        //set room status (players choices and hp)
        rooms[data.roomUniqueId].p1Choice = rpsValue;
        rooms[data.roomUniqueId].player1HP = data.playerHP;
        rooms[data.roomUniqueId].player1Status = data.statuses;
        
        socket.to(data.roomUniqueId).emit('p1Choice', {rpsValue : data.rpsValue});
        if(rooms[data.roomUniqueId].p2Choice != null){
            sendCardValues(data.roomUniqueId);
        }
    });

    // when player 2 has made a choice, set p2choice to that choice
    socket.on('p2Choice', (data) => {
        let rpsValue = data.rpsValue;

        //set room status (players choices and hp)
        rooms[data.roomUniqueId].p2Choice = rpsValue;
        rooms[data.roomUniqueId].player2HP = data.playerHP;
        rooms[data.roomUniqueId].player2Status = data.statuses;


        socket.to(data.roomUniqueId).emit('p2Choice', {rpsValue : data.rpsValue});
        if(rooms[data.roomUniqueId].p1Choice != null){
            sendCardValues(data.roomUniqueId);
        }
    });

    socket.on('nextRound', (data) => {
        rooms[data.roomUniqueId].continueCount += 1;
        if(rooms[data.roomUniqueId].continueCount > 1){
            socket.to(data.roomUniqueId).emit("nextRound", {});
            socket.emit("nextRound");
        }
    });
    socket.on('p1RoundValuesSent', (data) =>{
        let rpsValue = data.rpsValue;
        //set room status (players choices and hp)
        rooms[data.roomUniqueId].p1Choice = data.rpsValue;
        rooms[data.roomUniqueId].player1HP = data.playerHP;
        rooms[data.roomUniqueId].player1Status = data.statuses;
        if(rooms[data.roomUniqueId].player2Status != null){
            determineResult(data.roomUniqueId);
        }
    });

    socket.on('p2RoundValuesSent', (data) =>{
        let rpsValue = data.rpsValue;

        //set room status (players choices and hp)
        rooms[data.roomUniqueId].p2Choice = data.rpsValue;
        rooms[data.roomUniqueId].player2HP = data.playerHP;
        rooms[data.roomUniqueId].player2Status = data.statuses;

        if(rooms[data.roomUniqueId].player1Status != null){
            determineResult(data.roomUniqueId);
        }
    });

    socket.on('p1Status', (data) =>{
        
        rooms[data.roomUniqueId].player1HP = data.playerHP;
        rooms[data.roomUniqueId].player1Status = data.statuses;
        if(rooms[data.roomUniqueId].player2Status != null){
            updateStatuses(data.roomUniqueId);
        }
    });
    socket.on('p2Status', (data) =>{
        rooms[data.roomUniqueId].player2HP = data.playerHP;
        rooms[data.roomUniqueId].player2Status = data.statuses;
        if(rooms[data.roomUniqueId].player1Status != null){
            updateStatuses(data.roomUniqueId);
        }
    });

    socket.on('p1Drafted', (data) =>{
        // rooms[data.roomUniqueId].player1HP = data.playerHP;
        // rooms[data.roomUniqueId].player1Status = data.statuses;
        rooms[data.roomUniqueId].player1Hand = data.hand;
        if(rooms[data.roomUniqueId].player2Hand != null){
            console.log('both players drafted');
            showHands(data.roomUniqueId);
        }
    });
    socket.on('p2Drafted', (data) =>{
        // rooms[data.roomUniqueId].player1HP = data.playerHP;
        // rooms[data.roomUniqueId].player1Status = data.statuses;
        rooms[data.roomUniqueId].player2Hand = data.hand;
        if(rooms[data.roomUniqueId].player1Hand != null){
            console.log('both players drafted');
            showHands(data.roomUniqueId);
        }
    });
});

// sends opposing hand to opponents before they play cards
function showHands(roomUniqueId){
    io.sockets.to(roomUniqueId).emit("showHands", {
        // p1CardText : rooms[roomUniqueId].p1Choice,
        // p2CardText : rooms[roomUniqueId].p2Choice,
        // p1Status : rooms[roomUniqueId].player1Status,
        // p2Status : rooms[roomUniqueId].player2Status,
        p1Hand : rooms[roomUniqueId].player1Hand,
        p2Hand : rooms[roomUniqueId].player2Hand
    });
    rooms[roomUniqueId].player1Hand = null;
    rooms[roomUniqueId].player2Hand = null;
}


// sends statuses to both players before they draftcards
function updateStatuses(roomUniqueId){
    io.sockets.to(roomUniqueId).emit("updateStatuses", {
        p1CardText : rooms[roomUniqueId].p1Choice,
        p2CardText : rooms[roomUniqueId].p2Choice,
        p1Status : rooms[roomUniqueId].player1Status,
        p2Status : rooms[roomUniqueId].player2Status
    });
    rooms[roomUniqueId].player1Status = null;
    rooms[roomUniqueId].player2Status = null;
}


// sends player1 and 2 cards to client to determine final health and statuses
function sendCardValues(roomUniqueId){
    io.sockets.to(roomUniqueId).emit("determineRound", {
        p1CardText : rooms[roomUniqueId].p1Choice,
        p2CardText : rooms[roomUniqueId].p2Choice,
        p1Status : rooms[roomUniqueId].player1Status,
        p2Status : rooms[roomUniqueId].player2Status
    });
 
    rooms[roomUniqueId].player1Status = null;
    rooms[roomUniqueId].player2Status = null;
    
}

/*  input:      roomUniqueId
    output:     emits 'result' with winner:winner
                set rooms[roomUniqueId] choices to null
    purpose:    use roomUniqueId.p1Choice and roomUniqueId.p2Choice to determine winner then reset player choices */  
function determineResult(roomUniqueId){
    let p1Choice = rooms[roomUniqueId].p1Choice;
    let p2Choice = rooms[roomUniqueId].p2Choice;
    let winner = null;
    // from rock paper scissors prototype
    //  if (p1Choice == p2Choice) 
    //     winner = 'd';
    // else if (p1Choice == 'paper') {
    //     if (p2Choice == "scissors")
    //         winner = 'p2';
    //     else
    //         winner = 'p1';
    // } else if (p1Choice == 'rock') {
    //     if (p2Choice == "paper")
    //         winner = 'p2';
    //     else
    //         winner = 'p1';
    // } else if (p1Choice == 'scissors') {
    //     if (p2Choice == "rock")
    //         winner = 'p2';
    //     else
    //         winner = 'p1';
    // }

    // if there is no hp at 0, go to results and next round, else end game
    if ((rooms[roomUniqueId].player1HP) > 0 && (rooms[roomUniqueId].player2HP > 0)){

        // create amount of rares / legendaries in next draft
        // chance sbuffed for testing
        // final will likely be, 1legend = 0.25, 1 rare = 0.33
        chanceOf1Rare = 0.50;
        chanceOf2RareGiven1Rare = 0.25;
        chanceOf3RareGiven2Rare = 0.25;
        chanceOf1Legend = 0.5;
        chanceOf2LegendGiven1Legend = 0.5;
        rares = 0;
        legendaries = 0;
        // determine if there is 1 rare, 2 or 3
        if (rollItem(chanceOf1Rare)){
            if(rollItem(chanceOf2RareGiven1Rare)){
                if(chanceOf3RareGiven2Rare){
                    rares = 3;
                }
                else{
                    rares = 2;
                }
            }
            else
                rares = 1;            
        }
        if (rares != 3){
            if(rollItem(chanceOf1Legend)){
                if(rollItem(chanceOf2LegendGiven1Legend))
                    legendaries = 2;
                else
                    legendaries = 1;
            }
        }

        io.sockets.to(roomUniqueId).emit('result', {
            winner : winner,
            player1HP : rooms[roomUniqueId].player1HP,
            player2HP : rooms[roomUniqueId].player2HP,
            p1Status : rooms[roomUniqueId].player1Status,
            p2Status : rooms[roomUniqueId].player2Status,
            rares : rares,
            legendaries : legendaries
        });
        rooms[roomUniqueId].continueCount = 0;
        rooms[roomUniqueId].p1Choice = null;
        rooms[roomUniqueId].p2Choice = null;
        rooms[roomUniqueId].p1Status = null;
        rooms[roomUniqueId].p2Status = null;
    } else{
        if (rooms[roomUniqueId].player1HP < 1 && rooms[roomUniqueId].player2HP < 1)
            winner = 'd';
        else if (rooms[roomUniqueId].player1HP > 0)
            winner = 'p1';
        else
            winner = 'p2';

        io.sockets.to(roomUniqueId).emit("gameOver", {
            winner : winner,
            player1HP : rooms[roomUniqueId].player1HP,
            player2HP : rooms[roomUniqueId].player2HP
        });   
        rooms[roomUniqueId].continueCount = 0;
        rooms[roomUniqueId].p1Choice = null;
        rooms[roomUniqueId].p2Choice = null;
        rooms[roomUniqueId].p1Status = null;
        rooms[roomUniqueId].p2Status = null;

    }
}

// listening on port 3000 :D
server.listen(3000, () => {
    console.log('listening on *:3000');
});

/*
    input:      integer length
    output:     randomized string to make unique room id
*/
function makeId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


// returns true or false if a chance of chance % occurs
function rollItem(chance) {
    let roll = Math.random();

    if (roll < chance) return true;
    
    return false;  //
}
