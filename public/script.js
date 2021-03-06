socket = io();  // io() auto discover
//socket = io.connect('http://192.168.100.9:8080');
var size = 3;
var index = 0;
var col = "Red";
var job = "defaut";
var cd = 0;
var stats = [size+1];
for (var i = 0; i < size+1; i++) {
  stats[i] = {
    kills: 0,
    name: "N/A"
  }
}
console.log(stats);
var preload = {
    name: "N/A",
    color: col,
    role: job                //red by defaut
}

var key = {
    id: 'N/A',
    dx: 0,
    dy: 0,
    angle: 0,
    rotate: false
}

var mouse = {
    x: 0,
    y: 0
}

/*
setInterval( () => {
  console.log(col);
}, 500)
**/
function setColor(cl) {
  col = cl;
  //console.log(col);
}
function setClass(cl) {
  job = cl;
  //console.log(job);
}

function Preload() {
    var preloaddiv = document.getElementById('preload');
    var rbox = document.getElementById('chat-box');
    var lbox = document.getElementById('hub');
    var pl = document.getElementById('pl');
    preload.name = pl.value;
    preload.color = col;
    preload.role = job;
    preloaddiv.style.display = 'none';
    rbox.style.display = 'block';
    lbox.style.display = 'block';
    //console.log(preload);
    socket.emit('newplayer', JSON.stringify(preload));
}

function sendMessage() {
    var input = document.getElementById("input");
    if(input.value != "") {
      socket.emit("chat",JSON.stringify({
        name: game.player.name,
        data: input.value
      }));
      input.value = "";
    }
}

var game = new Game();

function init() {
    if (game.init()) {
        console.log("init");
        game.start();
        game.chat.innerHTML += 'testing chat-box<br>';
    }
}

function Game() {
    this.canvas3 = document.getElementById('canvas3');
    this.canvas2 = document.getElementById('canvas2');
    this.canvas = document.getElementById('canvas');
    this.chat = document.getElementById('text');
    this.sta = document.getElementById('hub-content');

    this.otherPlayers = [size];
    for (var i = 0; i < size; i++) {
        this.otherPlayers[i] = new Player();
    }
    this.player = new Player();
    this.connected = true;

    this.init = function () {
        if (this.canvas.getContext) {
            Player.prototype.context = this.canvas.getContext('2d');
            Background.prototype.context = this.canvas2.getContext('2d');
            Arrow.prototype.context = this.canvas3.getContext('2d');

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.canvas2.width = window.innerWidth;
            this.canvas2.height = window.innerHeight;

            this.canvas3.width = window.innerWidth;
            this.canvas3.height = window.innerHeight;

            this.background = new Background();
            this.background.init(0, 0);

            document.addEventListener('keydown', function (e) {
                switch (e.keyCode) {
                    case 87:
                        key.dy = -2;
                        break;
                    case 83:
                        key.dy = +2;
                        break;
                    case 65:
                        key.dx = -2;
                        break;
                    case 68:
                        key.dx = +2;
                        break;
                    case 13:
                        sendMessage();
                        break;
                    case 81:
                        if (cd === 0) {
                          socket.emit('blink',JSON.stringify({
                            id: game.player.id,
                            cos: Math.cos(game.player.angle),
                            sin: Math.sin(game.player.angle)
                          }));
                          cd = 60*5;
                        }
                        break;
                }
            });

            document.addEventListener('keyup', function (e) {
                switch (e.keyCode) {
                    case 87:
                        key.dy = 0
                        break;
                    case 83:
                        key.dy = 0
                        break;
                    case 65:
                        key.dx = 0
                        break;
                    case 68:
                        key.dx = 0
                        break;
                }
            });

            document.addEventListener('mousemove', function (e) {
                var deg = Math.atan2( (e.pageX - game.player.x), - (e.pageY - game.player.y) ) - Math.PI/2;
                //game.position.innerHTML = "rotation: " + deg;
                key.angle = deg;
                key.rotate = true;
            });

            document.addEventListener("click", function(){
              //console.log(game.player);
              socket.emit('Mouseclick', JSON.stringify({
                id: game.player.id,
                x: game.player.x,
                y: game.player.y,
                angle: game.player.angle
              }));
            });

            return true;
        } else {
            return false;
        }
    }
    this.start = function () {
        this.background.draw();
        this.player.draw();        //draw player
        for (var i = 0; i < size; i++) {                               //draw other players
            if (this.otherPlayers[i].connected === true) {
                this.otherPlayers[i].draw();
            }
        }
        animate();
        console.log('start');
    }

}

function animate() {
  //clearSelection();
    game.player.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    Arrow.prototype.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    game.player.draw();        //draw player
    if(game.player.arrow.alive) {
      game.player.arrow.draw();
    }
    for (var i = 0; i < size; i++) {                               //draw other players
        if (game.otherPlayers[i].connected === true) {
            game.otherPlayers[i].draw();
            if(game.otherPlayers[i].arrow.alive) {
              game.otherPlayers[i].arrow.draw();
            }
        }
    }
    requestAnimFrame(animate);
}

setInterval(() => {
  if (key.dx != 0 || key.dy != 0 || key.rotate) {
      socket.emit('input', JSON.stringify(key));
      key.rotate = false;
  }
  if (cd != 0) {
    cd--;
  }
},1000/60);

socket.on('gameState', (pool) => {
    var state = JSON.parse(pool);
    console.log(state);
    for (var i = 0; i < size; i++) {
        if (state[i].connected === true && state[i].id != game.player.id) {
            game.otherPlayers[index].id = state[i].id;
            game.otherPlayers[index].connected = true;
            game.otherPlayers[index].name = state[i].name;
            game.otherPlayers[index].init(state[i].x, state[i].y, state[i].color, state[i].angle);
            index++;
        }
    }
    console.log(game.otherPlayers);
    init();
})

socket.on('player_data', (val) => {
    var pos = JSON.parse(val);
    console.log(pos);
    game.player.name = pos.name;
    game.player.init(pos.x, pos.y, pos.color, pos.angle);
    game.player.id = pos.id;
    key.id = pos.id;
})

socket.on('addplayer', (val) => {
    var player = JSON.parse(val);
    game.chat.innerHTML += "<b>"+player.name + " connected</b><br>";
    if (player.id != game.player.id) {
        game.otherPlayers[index].id = player.id;
        game.otherPlayers[index].connected = true;
        game.otherPlayers[index].name = player.name;
        game.otherPlayers[index].init(player.x, player.y, player.color, player.angle);
        index++;
    }
})

socket.on('update', (val) => {
  var pos = JSON.parse(val);
  //console.log(game.player.id + ' ' + pos[game.player.id]);
  for (var i = 0; i < pos.length; i++) {
    if(pos[i].id === game.player.id) {
      game.player.x = pos[i].x;
      game.player.y = pos[i].y;
      game.player.angle = pos[i].angle;
      game.player.health = pos[i].health;
      game.player.kills = pos[i].kills;
      game.player.arrow.alive = pos[i].arrow.alive;
      game.player.arrow.x = pos[i].arrow.x;
    } else {
      for (var j = 0; j < index; j++) {
        if (game.otherPlayers[j].id === pos[i].id) {
          game.otherPlayers[j].x = pos[i].x;
          game.otherPlayers[j].y = pos[i].y;
          game.otherPlayers[j].angle = pos[i].angle;
          game.otherPlayers[j].health = pos[i].health;
          game.otherPlayers[j].kills = pos[i].kills;
          game.otherPlayers[j].arrow.alive = pos[i].arrow.alive;
          game.otherPlayers[j].arrow.x = pos[i].arrow.x;
        }
      }
    }
  }
  for (var i = 0; i < pos.length; i++) {
    stats[i].name = pos[i].name;
    stats[i].kills = pos[i].kills;
  }
  stats.sort(function(a, b){return b.kills-a.kills});
  game.sta.innerHTML = "";
  game.sta.innerHTML += "Leaderboard <br>";
  for (var i = 0; i < stats.length; i++) {
    if (stats[i].name != "not connected") {
      var r = i+1;
      game.sta.innerHTML += r+". "+stats[i].name+": "+stats[i].kills+" kills <br>";
    }
  }
    /*                                                          Bugged version
  game.player.x = pos[game.player.id].x;
  game.player.y = pos[game.player.id].y;
  game.player.angle = pos[game.player.id].angle;
  game.player.health = pos[game.player.id].health;
  game.player.kills = pos[game.player.id].kills;
  game.player.arrow.alive = pos[game.player.id].arrow.alive;
  game.player.arrow.x = pos[game.player.id].arrow.x;
  for (var i = 0; i < index; i++) {
    //console.log(game.otherPlayers[i].id);
    game.otherPlayers[i].x = pos[game.otherPlayers[i].id].x;
    game.otherPlayers[i].y = pos[game.otherPlayers[i].id].y;
    game.otherPlayers[i].angle = pos[game.otherPlayers[i].id].angle;
    game.otherPlayers[i].health = pos[game.otherPlayers[i].id].health;
    game.otherPlayers[i].kills = pos[game.otherPlayers[i].id].kills;
    game.otherPlayers[i].arrow.alive = pos[game.otherPlayers[i].id].arrow.alive;
    game.otherPlayers[i].arrow.x = pos[game.otherPlayers[i].id].arrow.x;
  }
  **/
})

socket.on('fire', (id) => {
  //console.log('input: ' + id);
  var pos = JSON.parse(id);
  if (pos.id === game.player.id) {
      game.player.arrow.spawn(pos.pX, pos.pY, pos.angle);
      //console.log(game.player.arrow);
  } else {
      for (var i = 0; i < index; i++) {
          if (game.otherPlayers[i].id === pos.id) {
            game.otherPlayers[i].arrow.spawn(pos.pX, pos.pY, pos.angle);
            console.log(game.otherPlayers[i].arrow);
          }
      }
  }
})

socket.on('message', (mes) => {
  var buf = JSON.parse(mes);
  game.chat.innerHTML += buf.name+":  "+buf.data+"<br>";
})

socket.on('disconnect', (data) => {
  var id = JSON.parse(data);
  for (var i = 0; i < index; i++) {
      if (game.otherPlayers[i].id === id) {
        game.otherPlayers[i].reset();                        //fix reload error where splice doesnt include method
        //console.log(pool[i].init);
        game.otherPlayers.splice(i,1);
        game.otherPlayers.push(new Player());
        //console.log(pool[size-1].init);
        index--;
      }
  }
})



function Player() {
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = 24;
    this.angle = 0;
    this.color = 'undefined';
    this.name = 'not connected';
    this.connected = false;
    this.colision = false;
    this.health = 100;
    this.kills = 0;

    this.arrow = new Arrow();

    this.init = function (x, y, color, angle) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = angle;
    }

    this.draw = function () {
        //  rotate
        this.context.translate(this.x,this.y);
        this.context.rotate(+this.angle);
        //draw player
        this.context.beginPath();
        this.context.arc(0 + this.r/2 + this.r/6, 0 + this.r/2 + this.r/12, this.r/3 + this.r/12, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();

        this.context.beginPath();
        this.context.arc(0 + this.r/2 + this.r/6, 0 - this.r/2 - this.r/12, this.r/3 + this.r/12, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();

        this.context.beginPath();
        this.context.arc(0, 0, this.r, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();
        this.context.drawImage(ImageAsset.bow, 0 - ImageAsset.bow.width * 0.2/2, 0 - ImageAsset.bow.height * 0.2/2, ImageAsset.bow.width * 0.2, ImageAsset.bow.height * 0.2);
        //  rotate
        this.context.rotate(-this.angle);
        this.context.translate(-this.x,-this.y);
        // player name
        this.context.font = "15px Comic Sans MS";
        this.context.fillStyle = 'black';
        this.context.fillText(this.name+" kills: "+this.kills, this.x - this.context.measureText(this.name).width / 2, this.y - this.r - this.r/6);
        //health  bar
        this.context.beginPath();
        this.context.rect(this.x - 50, this.y + this.r + this.r/3, this.health, 10);
        this.context.fillStyle = 'green';
        this.context.fill();
        this.context.stroke();
    }

    this.reset = function() {
      this.connected = false;
      this.id = 'N/A';
      this.x = 0;
      this.y = 0;
      this.r = 24;
      this.angle = 0;
      this.color = 'undefined';
      this.name = 'not connected';
    }
}

var ImageAsset = new function () {
    this.background = new Image();
    this.background.src = "/img/top-down-dungeon.jpg";
    this.bow = new Image();
    this.bow.src = "/img/bow.png";
    this.arrow = new Image();
    this.arrow.src = "/img/arrow.png";
}

function DrawableObj() {
    this.x = 0;
    this.y = 0;

    this.init = function (x, y) {
        this.x = x;
        this.y = y;
    }
}

function Background() {
    this.draw = function () {
        this.context.scale(window.innerWidth/ImageAsset.background.width,window.innerHeight/ImageAsset.background.height);
        this.context.drawImage(ImageAsset.background, this.x, this.y);
    }
}

function Arrow() {
    this.speed = 20;
    this.alive = false;
    this.angle = 0;
    this.originX = 0;
    this.originY = 0;
    this.x = 0;

    this.draw = function () {
        this.context.translate(this.originX, this.originY);
        this.context.rotate(+this.angle);
        this.context.drawImage(ImageAsset.arrow,this.x - ImageAsset.arrow.width * 0.2/2, 0 - ImageAsset.arrow.height/2 * 0.2, ImageAsset.arrow.width * 0.2, ImageAsset.arrow.height * 0.2);
        this.context.rotate(-this.angle);
        this.context.translate(- this.originX,- this.originY);
    };

    this.reset = function () {
      this.angle = 0;
      this.originX = 0;
      this.originY = 0;
      this.x = 0;
      this.alive = false;
    };

    this.spawn = function (x, y, angle) {
        this.alive = true;
        this.angle = angle;
        this.originX = x;
        this.originY = y;
    };
}

//Arrow.prototype = new DrawableObj();
Background.prototype = new DrawableObj();

function clearSelection() {
    if(document.selection && document.selection.empty) {
        document.selection.empty();
    } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
