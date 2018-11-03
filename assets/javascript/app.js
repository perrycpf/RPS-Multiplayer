// Initialize Firebase
var config = {
    apiKey: "AIzaSyDL4rMrP58kSGjatIlqRWDk2V8omZwlx8Q",
    authDomain: "rps-multiplayer-game-bbebb.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-game-bbebb.firebaseio.com",
    projectId: "rps-multiplayer-game-bbebb",
    storageBucket: "rps-multiplayer-game-bbebb.appspot.com",
    messagingSenderId: "715843035156"
};
firebase.initializeApp(config);
var database = firebase.database(); // Reference to the firebase database

var playersRef = database.ref("players"); // Folder directory to store all players information
var turnRef = database.ref('turn'); // Track the turn for players
var pOneRef = playersRef.child('one'); // Reference to players/player One folder
var pTwoRef = playersRef.child('two'); // Reference to players/player Two folder
var chatRef = playersRef.child('chat'); // Reference to chat room for players

var activePlayers = 0;  // Number of players in the game
var userKey = "pOne";   // Current active player
var playerName1 = "";   // Player name one
var playerName2 = "";   // Player name two
var pOneWin = 0;        // Player one game win #
var pOneLoss = 0;       // Player one game loss #
var pTwoWin = 0;        // Player two game win #
var pTwoLoss = 0;       // Player two game loss #
var pTurn = "";         // Player turn (one or two)
var p1Choice = "";      // Player one choice
var p2Choice = "";      // Player two choice
var rockImage = "assets/images/rock.jpg"
var paperImage = "assets/images/paper.jpg"
var scissorsImage = "assets/images/scissors.jpg"

// DOM caching
const $rPanel = $("#resultPanel");
const $pOneName = $("#playerOneName");
const $pTwoName = $("#playerTwoName");
const $p1WinCount = $("#p1WinCount");
const $p1LossCount = $("#p1LoseCount");
const $p2WinCount = $('#p2WinCount');
const $p2LossCount = $("#p2LoseCount");
const $option1 = $(".option-1");
const $option2 = $(".option-2");
const $p1ChoiceImg = $('.p1ChoiceImg');
const $p2ChoiceImg = $('.p2ChoiceImg');

var turn = {
    pOneTurn: "one",
    pTwoTurn: "two"
}
var messages = {
    playerOneMessage: "Waiting for player 2....",
    playerTwoMessage: "Play Now!",
    winMessage: " Wins!",
    gameInProgress: "Game is already in progress! Please wait...."
};

// Game start
function gameStart() {
    $("#submit-name").on("click", function() {
        var name = $('#input-name').val().trim();
        
        if (playerName1 == "" && name !="") {   
            console.log("user name1: " + name);  
            userKey = 'one';
            playerInit (userKey, name, pOneRef);
        } else if (playerName2 == "" && name !="") {
            console.log("user name2: " + name);  
            userKey = 'two';
            playerInit (userKey, name, pTwoRef);
        } else if (playerName1 != "" && playerName2 != "") {
            $rPanel.text(messages.gameInProgress);
            $(".player-input").hide();
        }
    });   
}
// Initialize data for player
function playerInit (userKey, pName, pRef) {

    activePlayers++;
    $(".player-input").hide();
    if (userKey == "one") {
        playerName1 = pName;
        $pOneName.text(`Player One: ${pName}`);
        initPchoices ($('.rock-1'),$('.paper-1'),$('.scissors-1'));
    } else if (userKey == "two") {
        playerName2 = pName;
        $pTwoName.text(`Player Two: ${pName}`);
        initPchoices ($('.rock-2'),$('.paper-2'),$('.scissors-2'));
    }
    pRef.set({name: pName,choice:"",win:0,loss:0});
    if (playerName1 != "" && playerName2 != "") {
        turnRef.set({whoseTurn: turn.pOneTurn});
    }
    $('#input-name').val("");
}
// Inititalize player choices
function initPchoices ($rock, $paper, $scissors) {
    $rock.addClass("btn btn-info");
    $rock.text('Rock');
    $paper.addClass("btn btn-info");
    $paper.text('Paper');
    $scissors.addClass("btn btn-info");
    $scissors.text('Scissors');
}
// Remove player if player1 or player2 disconnected
function disconnect() {
    database.ref().on("value", function(snapshot){
    if (userKey == "one" || userKey == "two") {
        playersRef.child(userKey).onDisconnect().remove();
    }
    });
}
// Refresh game screen
function refreshGameScreen() {
    // Trigger whenever the DB value is changed
 
    database.ref().on("value", function(snapshot){
        if (snapshot.child("players").child("one").exists()) {
            $rPanel.text(messages.playerOneMessage);
            playerName1 = snapshot.val().players.one.name;
            pOneWin = snapshot.val().players.one.win;
            pOneLoss = snapshot.val().players.one.loss;
            refreshPlayerData($pOneName, `Player One: ${playerName1}`, $p1WinCount, $p1LossCount, pOneWin, pOneLoss); 
        }
        if (snapshot.child("players").child("two").exists()) {
            $rPanel.text(messages.playerTwoMessage);
            playerName2 = snapshot.val().players.two.name;
            pTwoWin = snapshot.val().players.two.win;
            pTwoLoss = snapshot.val().players.two.loss;
            refreshPlayerData($pTwoName, `Player Two: ${playerName2}`, $p2WinCount, $p2LossCount, pTwoWin, pTwoLoss); 
        }
        if (snapshot.child('players').child('one').exists() && snapshot.child('players').child('two').exists()) {
            var whoseTurn = snapshot.val().turn.whoseTurn;

           $("#resultPanel").text(`Player ${whoseTurn}'s turn!`);
           if (whoseTurn == turn.pOneTurn) {
               $(".card-1").css("border-color", "blue");
               $(".card-2").css("border-color", "black");
               getPchoices(whoseTurn);     
           }
           if (whoseTurn == turn.pTwoTurn) {
               $(".card-1").css("border-color", "black");
               $(".card-2").css("border-color", "blue");
               getPchoices(whoseTurn);  
           }
           
           p1Choice = snapshot.val().players.one.choice;
           p2Choice = snapshot.val().p1ayers.two.choice;  //Program throws exception at this line when the WebSocket is already in CLOSING or CLOSED state appeared

           if (p1Choice != "" && p2Choice !="") {
               updateHand (p1Choice, $p1ChoiceImg);
               updateHand (p2Choice, $p2ChoiceImg);
               showResult();
           }
        }
    });
}
// Show the result of choices made by player one and two
function showResults() {
    // pOneRef.update({choice:""});
    // pTwoRef.update({choice:""});
    // if (p1Choice == p2Choice) {
    console.log('this is the showresults');   
    // }
}
// Refresh player data
function refreshPlayerData($name, name, $win, $loss, win, loss) {
    $name.text(name);
    $win.text(win);
    $loss.text(loss);
}
// Get player choice
function getPchoices (pTurn) {
    if (pTurn == turn.pOneTurn) {
        $option1.on('click', function() {
            p1Choice = $(this).attr('data-playerChoice');
            console.log(`p1Choice ${p1Choice}`);
            pOneRef.update({choice:p1Choice});
            pTurn = turn.pTwoTurn;
            turnRef.update({whoseTurn: pTurn});
            $option1.off("click");
            updateHand (p1Choice, $p1ChoiceImg);
        });
    }
    if (pTurn == turn.pTwoTurn) {  
        $option2.on('click', function() {
            p2Choice = $(this).attr('data-playerChoice');
            console.log(`p2Choice ${p2Choice}`);
            pTwoRef.update({choice:p2Choice});
            pTurn = turn.pOneTurn;
            turnRef.update({whoseTurn: pTurn})
            $option2.off("click");
            updateHand (p2Choice, $p2ChoiceImg);
        });
    }
};

// Update hand image
function updateHand (pChoice, $handImage) {
    var image = "";
    switch (pChoice) {
        case 'rock':
            image = rockImage
            break;
        case 'paper':
            image = paperImage
            break;
        case 'scissors':
            image = scissorsImage
            break;
    }
    $handImage.attr({src:image, alt:pChoice});
}

// Game starts
$(document).ready(function() {
    gameStart();
    refreshGameScreen();
    disconnect();
})
