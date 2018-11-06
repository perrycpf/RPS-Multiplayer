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
var userKey = "";   // Current active player
var playerName1 = "";   // Player name one
var playerName2 = "";   // Player name two
var pOneWin = 0;        // Player one game win #
var pOneLoss = 0;       // Player one game loss #
var pTwoWin = 0;        // Player two game win #
var pTwoLoss = 0;       // Player two game loss #
var pTurn = "";         // Player turn (one or two)
var p1Choice = "";      // Player one choice
var p2Choice = "";      // Player two choice
var panelMessage = "";  // Panel messages
var panelResult = "";   // Panel result
var rockImage = "assets/images/rock.jpg";
var paperImage = "assets/images/paper.jpg";
var scissorsImage = "assets/images/scissors.jpg";
var gameImage = "assets/images/game.jpg";

// DOM caching
const $panelM = $("#panel-message");
const $panelR = $("#panel-result");
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
const $chatUl = $('#chatRoom').find('ul');
const $greeting = $('#greeting');

var turn = {
    pOneTurn: "one",
    pTwoTurn: "two"
}
var messages = {
    playerOneMessage: "Waiting for player 2....",
    playerTwoMessage: "Play Now!",
    p1winMessage: "Player One Wins!",
    p2winMessage: "Player Two Wins!",
    tieMesseage: "Tie!",
    p1LeftMessage: "Player one left. Awaiting new player",
    p2LeftMessage: "Player two left. Awaiting new player",
    gameInProgress: "Game is already in progress! Please wait...."
};

// Game start
function gameStart() {
    $("#submit-name").on("click", function() {
        var name = $('#input-name').val().trim();
        
        if (playerName1 == "" && name !="") {   
            userKey = 'one';
            playerInit (userKey, name, pOneRef);
        } else if (playerName2 == "" && name !="") {
            userKey = 'two';
            playerInit (userKey, name, pTwoRef);
        } else if (playerName1 != "" && playerName2 != "") {
            $panelM.text(messages.gameInProgress);
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
        panelMessage = messages.playerOneMessage;
        $greeting.text(`Hi ${pName}! You are Player One`);
    } else if (userKey == "two") {
        playerName2 = pName;
        $pTwoName.text(`Player Two: ${pName}`);
        initPchoices ($('.rock-2'),$('.paper-2'),$('.scissors-2'));
        panelMessage = messages.playerTwoMessage;
        $greeting.text(`Hi ${pName}! You are Player Two`);
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
    database.ref().on("value", function(){
    if (userKey == "one" || userKey == "two") {
        console.log(`userKey: ${userKey}`);
        playersRef.child(userKey).onDisconnect().remove();
    }
    });
}
// Remove all chats when players disconnected
chatRef.on("value", function() {
    chatRef.onDisconnect().remove();
});
// Refresh game screen
function refreshGameScreen() {
    // Trigger whenever the DB value is changed
 
    database.ref().on("value", function(snapshot){
        if (snapshot.child("players").child("one").exists()) {
            $panelM.text(panelMessage);
            $panelR.text(panelResult);
            playerName1 = snapshot.val().players.one.name;
            pOneWin = snapshot.val().players.one.win;
            pOneLoss = snapshot.val().players.one.loss;
            refreshPlayerData($pOneName, `Player One: ${playerName1}`, $p1WinCount, $p1LossCount, pOneWin, pOneLoss); 
        }
        if (snapshot.child("players").child("two").exists()) {
            $panelM.text(panelMessage);
            $panelR.text(panelResult);
            playerName2 = snapshot.val().players.two.name;
            pTwoWin = snapshot.val().players.two.win;
            pTwoLoss = snapshot.val().players.two.loss;
            refreshPlayerData($pTwoName, `Player Two: ${playerName2}`, $p2WinCount, $p2LossCount, pTwoWin, pTwoLoss); 
        }
        if (snapshot.child('players').child('one').exists() && snapshot.child('players').child('two').exists()) {
            var whoseTurn = snapshot.val().turn.whoseTurn;

           $panelM.text(`Player ${whoseTurn}'s turn!`);
           if (whoseTurn == turn.pOneTurn) {
               $(".card-1").css("border", "solid 2px blue");
               $(".card-2").css("border", "solid 2px black");
               getPchoices(whoseTurn);     
           }
           if (whoseTurn == turn.pTwoTurn) {
               $(".card-1").css("border", "solid 2px black");
               $(".card-2").css("border", "solid 2px blue");
               getPchoices(whoseTurn);  
           }
           p1Choice = snapshot.val().players.one.choice;
           p2Choice = snapshot.val().players.two.choice;
           if (p1Choice != "" && p2Choice !="") {
               updateHand (p1Choice, $p1ChoiceImg);
               updateHand (p2Choice, $p2ChoiceImg);
               compareResults(p1Choice, p2Choice, pOneWin, pOneLoss, pTwoWin, pTwoLoss);
           }
        }
    });
}
// Show the result of choices made by player one and two
function compareResults(p1Choice, p2Choice, pOneWin, pOneLoss, pTwoWin, pTwoLoss) {

    if (p1Choice == p2Choice) {
        panelResult = messages.tieMesseage;
    } else if ((p1Choice == 'rock' && p2Choice == 'paper') || (p1Choice == 'scissors' && p2Choice == 'rock') || (p1Choice == 'paper' && p2Choice == 'scissors')) {
        panelResult = messages.p2winMessage;
        pOneLoss++;
        pTwoWin++;
    } else {
        panelResult = messages.p1winMessage;
        pOneWin++;
        pTwoLoss++;
    }
    pOneRef.update({choice:"", loss: pOneLoss, win: pOneWin});
    pTwoRef.update({choice:"", loss: pTwoLoss, win: pTwoWin});
    p1Choice = p2Choice = "";
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
            pTurn = turn.pTwoTurn;
            updateHand (p1Choice, $p1ChoiceImg);
            $option1.off("click");
            pOneRef.update({choice:p1Choice});
            turnRef.update({whoseTurn: pTurn});
        });
    }
    if (pTurn == turn.pTwoTurn) {  
        $option2.on('click', function() {
            p2Choice = $(this).attr('data-playerChoice');
            pTurn = turn.pOneTurn;
            updateHand (p2Choice, $p2ChoiceImg);
            $option2.off("click");
            pTwoRef.update({choice:p2Choice});
            turnRef.update({whoseTurn: pTurn});
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
// Reset the game
function reset ($pName, $pWinCount, $pLossCount, message) {
    $pName.text(message);
    panelMessage = message;
    panelResult = "";
    $pWinCount.text("0");
    $pLossCount.text("0");
    $p1ChoiceImg.attr({src:gameImage, alt:'User Choice'});
    $p2ChoiceImg.attr({src:gameImage, alt:'User Choice'});
}
// Remove player one if disconnected
playersRef.on("child_removed", function(snap) {
    var pKey = snap.key;
    console.log("disconnect: " + pKey);
    if (pKey == 'one') {
        playerName1 = "";
        reset($pOneName, $p1WinCount, $p1LossCount, messages.p1LeftMessage);
        pTwoRef.update({choice:'',win:0,loss:0});
    } else if (pKey == 'two') {
        playerName2 = "";
        reset($pTwoName, $p2WinCount, $p2LossCount, messages.p2LeftMessage);
        pOneRef.update({choice:'',win:0,loss:0});
    }
});
// Chat room
function chatRoom() {
    $('#chat-send').on('click', function(){
        var comment =$('#chat-message').val().trim();
        if (comment != "") {
            if (userKey == 'one') {
                var playerN = playerName1;
            } else {
                var playerN = playerName2;
            }
            chatRef.push({user:userKey,userName: playerN, message:comment});
            $('#chat-message').val('');
        }
    });

    chatRef.on("child_added", function(snap) {
        var message = snap.val().message;
        var user = snap.val().user;
        var userN = snap.val().userName;
        var dToday = new Date();
        var dString = dToday.toUTCString();

        if (user == 'one') {
            var msgStr = `<li class="list-group-item list-group-item-dark">Player One(${userN}): ${message} (${dString})`;
            $chatUl.prepend(msgStr);
        } else if (user == 'two') {
            var msgStr = `<li class="list-group-item list-group-item-dark">Player Two(${userN}): ${message} (${dString})`;
            $chatUl.prepend(msgStr);
        }
    });
}
// Game starts
$(document).ready(function() {
    gameStart();
    refreshGameScreen();
    chatRoom();
    disconnect();
})
