var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    width: 80,
    height: 40,
    init: function () {
        this.display = new ROT.Display({
            width: this.width,
            height: this.height,
            fontSize: 18,
            layout: "hex"
        });
        document.body.appendChild(this.display.getContainer());

        this._generateMap();
        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },

    _generateMap: function () {
        map = new ROT.Map.Cellular(this.width, this.height, {
            topology: 6,
            born: [4, 5, 6],
            survive: [3, 4, 5, 6]
        });
        /* initialize with irregularly random values */
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                var dx = i / this.width - 0.5;
                var dy = j / this.height - 0.5;
                var dist = Math.pow(dx * dx + dy * dy, 0.3);
                if (ROT.RNG.getUniform() < dist) {
                    map.set(i, j, 1);
                }
            }
        }

        /* generate four iterations, show the last one */
        for (var i = 4; i >= 0; i--) {
            map.create(i ? null : this.display.DEBUG);
        }
        //var freeSpaces = this.map.map( x = >)
        console.log(map)
        display.draw(0, 0, "0,0", "", "#fff");
        display.draw(2, 0, "2,0", "", "#ccc");
        display.draw(4, 0, "4,0", "", "#888");
        display.draw(1, 1, "1,1", "", "#888");
        display.draw(3, 1, "3,1", "", "#fff");
        display.draw(5, 1, "5,1", "", "#ccc");
        display.draw(0, 2, "0,2", "", "#fff");
        display.draw(2, 2, "2,2", "", "#ccc");
        display.draw(4, 2, "4,2", "", "#888");
        display.draw(1, 3, "1,3", "", "#888");
        display.draw(3, 3, "3,3", "", "#fff");
        display.draw(5, 3, "5,3", "", "#ccc");
    },
}
var Player = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}
Player.prototype.act = function () {
    Game.engine.lock();
    window.addEventListener("keydown", this);
}

Player.prototype.handleEvent = function (e) {
    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if (!(code in keyMap)) {
        return;
    }

    /* is there a free space? */
    var dir = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) {
        return;
    }

    Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._draw = function () {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}
Game.init();
console.log(Game.map)