/*jshint esversion: 6 */
var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    pedro: null,
    ananas: null,
    data: {},

    init: function () {
        var options = {
            bg: "#000",
            fontSize:'18',
            spacing: 1.1,
        };

        this.display = new ROT.Display(options);
        if (!!document.body){
        document.body.appendChild(this.display.getContainer());
        }
        this._generateMap();

        var scheduler = new ROT.Scheduler.Simple(); //this is just a fancy async/await engine that handles events for me.
        scheduler.add(this.player, true);
        scheduler.add(this.pedro, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },

    _generateMap: function () {
        var digger = new ROT.Map.Digger(); // creates a NetHack-like dungeon layout.
        var freeCells = [];

        var digCallback = function (x, y, value) {
            this.data[x+","+y] = value;
            if (value) {
                return;
            }
            var key = x + "," + y;
            this.map[key] = ".";
            freeCells.push(key);
        };
        digger.create(digCallback.bind(this));

        this._generateBoxes(freeCells); //creates the items.

        //this._drawWholeMap();

        this.player = this._createBeing(Player, freeCells);
        this.pedro = this._createBeing(Pedro, freeCells); //TODO: make this spawn 4 - 10 monsters.
    //this is as simple as looping but I have to make a monster first.
    },

    _createBeing: function (being, freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        return new being(x, y);
    },

    _generateBoxes: function (freeCells) {
       //console.log("the map keys generated are:");
        for (var i = 2; i < 12; i++) {
            
            var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            var key = freeCells.splice(index, 1)[0];
            this.map[key] = [".", "*"];
            let address = key.toString().split(",");
            let roll = ROT.RNG.getPercentage();
           // console.log(`${key}`);
            if (roll < 25) {
                let loot = new Item(address[0], address[1], "sword", "weapon");
                loot.announce();
                itemArray.push(loot);
            }
            if (roll >= 25 && roll < 50) {
                let loot = new Item(address[0], address[1], "leather armor", "armor");
                loot.announce();
                itemArray.push(loot);
            }
            if (roll >= 50 && roll < 75) {
                let loot = new Item(address[0], address[1], "health potion", "potion");
                loot.announce();
                itemArray.push(loot);
            }
            if (roll >= 75) {
                let loot = new Item(address[0], address[1], "rock", "rock");
                loot.announce();
                itemArray.push(loot);
            }
        }
    },

    _drawWholeMap: function () {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, "");
        }
    },


};

var itemArray = [];
var Player = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
};

Player.prototype.getSpeed = function () {
    return 100;
};
Player.prototype.getX = function () {
    return this._x;
};
Player.prototype.getY = function () {
    return this._y;
};

Player.prototype.act = function () {
    Game.engine.lock();
    window.addEventListener("keydown", this);
};

Player.prototype.handleEvent = function (e) {
    var code = e.keyCode;
    if (code == 13 || code == 32) {
        console.log('getting item');
        this._getItem();
        return;
    }

    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

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

    // TODO: add attack logic. (if enemy on cell, do attack.)

    Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y], "#fff", "#000");
    this._x = newX;
    this._y = newY;
    Game._drawWholeMap();
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
};

Player.prototype._draw = function () {
    Game.display.draw(this._x, this._y, "@", "#ff0");
    posConsole.write(`I am at ${this._x} and ${this._y}`)
    function lightPasses(x, y) {
        var key = x+","+y;
        if (key in Game.data) { return (Game.data[key] == 0); }
        return false;
    }
    var fov =  new ROT.FOV.PreciseShadowcasting(lightPasses);
    var lightLevel = 2;
    fov.compute(this._x, this._y, lightLevel, function(x, y, r, visibility) {
        var key = x+","+y;
        var ch = (r ? Game.map[key] : "@");
        var color = (Game.data[x+","+y] ? "#556": "#aa0");
        //console.log("b game map is " + Game.data[x+","+y]);
        //TODO: hold floor tiles and show them here
        Game.display.draw(x, y, ch, "#fff", color);
    });
};
Player.prototype._checkBox = function () {
    var key = this._x + "," + this._y;
    if (Game.map[key][1] != "*") {
        console.log(Game.map[key]);
        alert("There is no box here!");
    } else if (key == Game.ananas) {
        alert("Hooray! You found a banana and won this game.");
        Game.engine.lock();
        window.removeEventListener("keydown", this);
    } else {
        alert("This box is empty :-(");
    }
};
Player.prototype._getItem = function () {
    var key = this._x + "," + this._y;
    console.log(`my coordinates are ${this._x} and ${this._y}`);
    if (Game.map[key][1] == "*") {
        // console.log('calling for item');
        for (const item of itemArray) { 
        // console.log("checking for item...");
        if (item._x == this._x && item._y == this._y) {
            // console.log(`${item.name} found!`);
        playerInv.addItem(item);
        // console.log("you picked up the " + item.name);
        // console.log(`removing item from array\n
        // ${itemArray.length}`);
        itemArray = itemArray.filter(x => x !== item);
        // console.log(`removed item from array\n
        // ${itemArray.length}`);
        }
    }
    }
};

Player.prototype._getView = function (x, y) {
    
};

class Inventory {
    constructor(items = []) {
        this.items = items;
    }
    addItem(item) {
        this.items.concat(item);
        return this.items;
    }
    dropItem(itemName) {
        let newInventory = this.items.filter(function (item) {
            return item.name !== itemName;
        });
        this.items = newInventory;
        return this.items;
    }
    display() {
        list = Inventory.items.join(", ");
        Game.display.drawText(2, 1 );
    }
}

var Pedro = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
};

Pedro.prototype.getSpeed = function () {
    return 100;
};

Pedro.prototype.act = function () {
    var x = Game.player.getX();
    var y = Game.player.getY();

    var passableCallback = function (x, y) {
        return (x + "," + y in Game.map);
    };
    var astar = new ROT.Path.AStar(x, y, passableCallback, {
        topology: 4
    });

    var path = [];
    var pathCallback = function (x, y) {
        path.push([x, y]);
    };
    astar.compute(this._x, this._y, pathCallback);

    path.shift();
    if (path.length == 1) {
        Game.engine.lock();
        alert("Game over - you were captured by Pedro!");
    } else {
        x = path[0][0];
        y = path[0][1];
        Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y]);
        this._x = x;
        this._y = y;
        this._draw();
    }
};

Pedro.prototype._draw = function () {
    Game.display.draw(this._x, this._y, "P", "red");
};

class Item {
    constructor(x, y, name, type) {
        this.name = name;
        this.type = type;
        this._x = x;
        this._y = y;
    }

    pickUp(Player) {

    }
    announce() {
        //console.log(`${this.name} spawned at ${this._x}, ${this._y} coordinates. It is a ${this.type}`);
    }
}
var playerInv = new Inventory([]);

class Sword extends Item {
    constructor(x, y, name, type) {
        super(x, y, name, type);
        this.damageModifier = 3;
    }
}

class leatherArmor extends Item {
    constructor(x, y, name, type) {
        super(x, y, name, type);
        this.protection = 3;
    }
}
class healthPotion extends Item {
    constructor(x, y, name, type) {
        super(x, y, name, type);
        this.healing = 7;
    }
}

class console {
    constructor (x,y) {
        this._x = x;
        this._y = y;
    }
    write(message) {
            Game.display.drawText(this._x, this._y, message);
        }
}
var fightConsole = new console(1,1);
var posConsole = new console(2,1);
var itemConsole = new console(3,1);

/*function backgroundGet(x, y, string) {
    key = this.x + "," + this.y;
    if (Game.map[key] == ".") {
        return [",", string]
    } else {
        return string;
    }
} */

