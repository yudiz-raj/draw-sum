var game;
var savedData;
var score;
var gameOptions = {
    bgColors: [0x806033, 0x565110],
    gameWidth: 750,
    gameHeight: 1334,
    tileSize: 140,
    fieldSize: {
        rows: 5,
        cols: 5
    },
    fallSpeed: 250,
    localStorageName: "drawsumgame"
}
window.onload = function () {
    var windowRatio = window.innerWidth / window.innerHeight;
    if (windowRatio < gameOptions.gameWidth / gameOptions.gameHeight) {
        gameOptions.gameHeight = gameOptions.gameWidth / windowRatio;
    }
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("Boot", boot);
    game.state.add("Preload", preload);
    game.state.add("TitleScreen", titleScreen);
    game.state.add("TheGame", theGame);
    game.state.add("GameOver", gameOver);
    game.state.start("Boot");
}
class boot {
    constructor(game) { }
    preload() {
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.stage.disableVisibilityChange = true;
        game.stage.backgroundColor = 0x051f21;
        this.game.load.image("playbutton", "assets/sprites/playbutton.png");
    }
    create() {
        game.plugin = game.plugins.add(Phaser.Plugin.FadePlugin);
        game.state.start("Preload");
    }
}
class preload {
    constructor(game) { }
    preload() {
        var loadingBar = this.add.sprite(game.width / 2, game.height / 2, "playbutton");
        loadingBar.anchor.setTo(0.5);
        game.load.image("playbutton", "assets/sprites/playbutton.png");
        game.load.image("hand", "assets/sprites/hand.png");
        game.load.image("bigtile", "assets/sprites/bigtile.png");
        game.load.image("title", "assets/sprites/title.png");
        game.load.image("item", "assets/sprites/item.png");
        game.load.spritesheet("tiles", "assets/sprites/tiles.png", gameOptions.tileSize, gameOptions.tileSize);
        game.load.spritesheet("arrows", "assets/sprites/arrows.png", gameOptions.tileSize * 3, gameOptions.tileSize * 3);
        game.load.spritesheet("numbers", "assets/sprites/numbers.png", gameOptions.tileSize, gameOptions.tileSize);
        // game.load.bitmapFont("bignumbersfont", "assets/fonts/bignumbersfont.png", "assets/fonts/bignumbersfont.fnt");
        // game.load.bitmapFont("recapfont", "assets/fonts/recapfont.png", "assets/fonts/recapfont.ftn");
        // game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.ftn");
        game.load.audio("pop", ["assets/sounds/pop.mp3", "assets/sounds/pop.ogg"]);
        game.load.audio("pop2", ["assets/sounds/pop.mp3", "assets/sounds/pop.ogg"]);
        game.load.audio("pop3", ["assets/sounds/pop.mp3", "assets/sounds/pop.ogg"]);
        game.load.audio("fail", ["assets/sounds/fail.mp3", "assets/sounds/fail.ogg"]);
        game.load.audio("done", ["assets/sounds/done.mp3", "assets/sounds/done.ogg"]);
        game.load.audio("gameover", ["assets/sounds/gameover.mp3", "assets/sounds/gameover.ogg"]);
    }
    create() {
        game.plugin.fadeAndPlay(0x051f21, 0.25, "TitleScreen");
    }
}
class titleScreen {
    constructor(game) { }
    create() {
        savedData = localStorage.getItem(gameOptions.localStorageName) == null ? { score: 0 } : JSON.parse(localStorage.getItem(gameOptions.localStorageName));
        var title = game.add.image(game.width / 2, 20, "title");
        title.anchor.set(0.5, 0);
        var playButton = game.add.button(game.width / 2, game.height / 2, "playbutton", this.startGame);
        playButton.anchor.set(0.5);
        var tween = game.add.tween(playButton).to({
            width: 220,
            height: 220
        }, 1500, "Linear", true, 0, -1, true);
        game.add.text(game.width / 2, game.height - 200, "BEST SCORE", { fontFamily: "timesnewroman", fontSize: 72 }).anchor.set(0.5);
        game.add.text(game.width / 2, game.height - 100, savedData.score.toString(), { fontFamily: "Bungee", fontSize: 72 }).anchor.set(0.5);
    }
    startGame() {
        game.plugin.fadeAndPlay(0x051f21, 0.25, "TheGame");
    }
}
class theGame {
    constructor() { }
    create() {
        this.createLevel();
        game.input.onDown.add(this.pickTile, this);
        this.popSound = [game.add.audio("pop"), game.add.audio("pop2"), game.add.audio("pop3")];
        this.failSound = game.add.audio("fail");
        this.doneSound = game.add.audio("done");
        this.gameOverSound = game.add.audio("gameover");
    }
    createLevel() {
        game.stage.visible = false;
        this.tilesArray = [];
        this.arrowsArray = [];
        this.targetsArray = [];
        this.matches = 0;
        this.energyLoss = 0.3;
        this.gameOver = false;
        score = 0;
        this.firstPick = true;
        this.tintColor = gameOptions.bgColors[0];
        this.altTintColor = gameOptions.bgColors[1];
        this.tileGroup = game.add.group();
        this.tileGroup.x = (game.width - gameOptions.tileSize * gameOptions.fieldSize.cols) / 2;
        this.tileGroup.y = (game.height - gameOptions.tileSize * gameOptions.fieldSize.rows) - 50;
        this.arrowsGroup = game.add.group();
        this.arrowsGroup.x = this.tileGroup.x;
        this.arrowsGroup.y = this.tileGroup.y;
        var item = game.add.image(game.width / 2, this.tileGroup.y - 70, "item");
        item.anchor.set(0.5);
        item.tint = 0x443A11;
        this.recapText = game.add.text(40, item.y - 40, "", { fontFamily: "recapfont", fontSize: 72 });
        this.scoreText = game.add.text(game.width - 40, item.y - 130, "", { fontFamily: "font", fontSize: 72 });
        this.scoreText.anchor.set(1, 0);
        this.targetGroup = game.add.group();
        this.arcGraphics = game.add.graphics(0, 0);
        this.tileMask = game.add.graphics(this.tileGroup.x, this.tileGroup.y - 40);
        this.tileMask.beginFill(0xffffff);
        this.tileMask.drawRect(0, 0, gameOptions.tileSize * gameOptions.fieldSize.cols, gameOptions.tileSize * gameOptions.fieldSize.rows + 40);
        this.tileGroup.mask = this.tileMask;
        for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
            this.tilesArray[i] = [];
            for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                this.addTile(i, j);
            }
        }
        this.removedTiles = [];
        for (i = 0; i < 5; i++) {
            var target = game.add.sprite((i % 3) * 230 + 115 * Math.floor(i / 3), 15 + Math.floor(i / 3) * 200, "bigtile");
            target.tint = this.altTintColor;
            target.numberToMatch = game.rnd.between(10, 14);
            target.energy = 360;
            target.energyLoss = this.energyLoss;
            var bigNumber = game.add.text(100, 110, target.numberToMatch.toString(), { fontFamily: "bignumbersfont", fontSize: 90 });
            bigNumber.anchor.set(0.5);
            target.addChild(bigNumber);
            this.targetGroup.add(target);
            this.targetsArray.push(target);
            this.arcGraphics.arc(this.targetsArray[i].x + 100 + this.targetGroup.x, this.targetsArray[i].y + 100, 80, 0, Phaser.Math.degToRad(this.targetsArray[i].energy), false);
        }
        this.targetGroup.x = (game.width - this.targetGroup.width) / 2;
        this.timeLoop = game.time.events.loop(Phaser.Timer.SECOND / 20, this.updateCounter, this);
        var tweenArray = this.findSum(this.targetsArray[0].numberToMatch);
        if (tweenArray.length == 0) {
            game.state.start("TheGame");
            return;
        }
        game.stage.visible = true;
        this.finger = game.add.sprite(this.tilesArray[tweenArray[0]][tweenArray[1]].x - 80, this.tilesArray[tweenArray[0]][tweenArray[1]].y, "hand");
        this.tileGroup.add(this.finger);
        game.add.tween(this.finger).to({
            x: this.tilesArray[tweenArray[2]][tweenArray[3]].x - 80,
            y: this.tilesArray[tweenArray[2]][tweenArray[3]].y
        }, 500, Phaser.Easing.Linear.None, true, 0, -1, true);
        this.infoText = game.add.text(game.width / 2, item.y, "Connect blue numbers to sum them and\nmatch red numbers before time runs out\nLonger connections give more points", { fontFamily: "Bungee", fontSize: 24 });
        this.infoText.anchor.set(0.5);
    }
    updateCounter() {
        this.arcGraphics.clear();
        this.arcGraphics.lineStyle(20, 0xffffff);
        for (var i = 0; i < this.targetsArray.length; i++) {
            this.targetsArray[i].energy -= this.targetsArray[i].energyLoss;
            if (this.targetsArray[i].energy > 0) {
                this.arcGraphics.arc(this.targetsArray[i].x + 100 + this.targetGroup.x, this.targetsArray[i].y + 100, 80, 0, Phaser.Math.degToRad(this.targetsArray[i].energy), false);
            }
            else {
                game.time.events.remove(this.timeLoop);
                this.gameOver = true;
                game.add.tween(this.targetsArray[i]).to({
                    y: game.height + 200
                }, 500, Phaser.Easing.Cubic.In, true);
            }
        }
        if (this.gameOver) {
            this.gameOverSound.play();
            game.time.events.loop(Phaser.Timer.SECOND * 2, function () {
                game.plugin.fadeAndPlay("rgb(38, 41, 44)", 0.25, "GameOver");
            }, this);
        }
    }
    addTile(row, col) {
        var tileXPos = col * gameOptions.tileSize + gameOptions.tileSize / 2;
        var tileYPos = row * gameOptions.tileSize + gameOptions.tileSize / 2;
        var theTile = game.add.sprite(tileXPos, tileYPos, "tiles");
        theTile.anchor.set(0.5);
        theTile.picked = false;
        theTile.coordinate = new Phaser.Point(col, row);
        this.tilesArray[row][col] = theTile;
        theTile.value = game.rnd.between(1, 9);
        theTile.tint = this.tintColor;
        var number = game.add.sprite(0, 0, "numbers");
        number.anchor.set(0.5);
        number.frame = theTile.value - 1;
        theTile.addChild(number);
        this.tileGroup.add(theTile);
    }
    pickTile(e) {
        if (this.firstPick) {
            this.infoText.destroy();
            this.finger.destroy();
            this.firstPick = false;
        }
        this.visitedTiles = [];
        this.visitedTiles.length = 0;
        if (this.tileGroup.getBounds().contains(e.position.x, e.position.y)) {
            var col = Math.floor((e.position.x - this.tileGroup.x) / gameOptions.tileSize);
            var row = Math.floor((e.position.y - this.tileGroup.y) / gameOptions.tileSize);
            this.tilesArray[row][col].tint = this.altTintColor;
            this.tilesArray[row][col].picked = true;
            game.input.onDown.remove(this.pickTile, this);
            game.input.onUp.add(this.releaseTile, this);
            game.input.addMoveCallback(this.moveTile, this);
            this.visitedTiles.push(this.tilesArray[row][col].coordinate);
            this.recapText.text = this.tilesArray[row][col].value;
            Phaser.ArrayUtils.getRandomItem(this.popSound).play();
        }
    }
    moveTile(e) {
        if (this.tileGroup.getBounds().contains(e.position.x, e.position.y)) {
            var col = Math.floor((e.position.x - this.tileGroup.x) / gameOptions.tileSize);
            var row = Math.floor((e.position.y - this.tileGroup.y) / gameOptions.tileSize);
            var distance = new Phaser.Point(e.position.x - this.tileGroup.x, e.position.y - this.tileGroup.y).distance(this.tilesArray[row][col]);
            if (distance < gameOptions.tileSize * 0.4) {
                if (!this.tilesArray[row][col].picked && this.checkAdjacent(new Phaser.Point(col, row), this.visitedTiles[this.visitedTiles.length - 1])) {
                    if (this.visitedTiles.length < 8) {
                        this.tilesArray[row][col].picked = true;
                        this.tilesArray[row][col].tint = this.altTintColor;
                        this.visitedTiles.push(this.tilesArray[row][col].coordinate);
                        this.addArrow();
                        Phaser.ArrayUtils.getRandomItem(this.popSound).play();
                    }
                }
                else {
                    if (this.visitedTiles.length > 1 && row == this.visitedTiles[this.visitedTiles.length - 2].y && col == this.visitedTiles[this.visitedTiles.length - 2].x) {
                        this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].picked = false;
                        this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].tint = this.tintColor;
                        this.visitedTiles.pop();
                        this.arrowsArray[this.arrowsArray.length - 1].destroy();
                        this.arrowsArray.pop();
                        Phaser.ArrayUtils.getRandomItem(this.popSound).play();
                    }
                }
                var stringToShow = this.tilesArray[this.visitedTiles[0].y][this.visitedTiles[0].x].value;
                for (var i = 1; i < this.visitedTiles.length; i++) {
                    stringToShow += "+" + this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].value;
                }
                this.recapText.text = stringToShow;
            }
        }
    }
    releaseTile() {
        this.recapText.text = "";
        var didMatch = false;
        var totalSum = 0;
        for (var i = 0; i < this.visitedTiles.length; i++) {
            totalSum += this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].value;
        }
        if (!this.gameOver) {
            for (i = 0; i < 5; i++) {
                if (totalSum == this.targetsArray[i].numberToMatch) {
                    this.matches++;
                    var tween = game.add.tween(this.targetsArray[i]).to({
                        alpha: 0
                    }, gameOptions.fallSpeed / 2, Phaser.Easing.Linear.None, true);
                    this.targetsArray[i].numberToMatch = game.rnd.between(10, 14 + this.matches);
                    tween.onComplete.add(function (e) {
                        e.children[0].text = e.numberToMatch;
                        var tween = game.add.tween(e).to({
                            alpha: 1
                        }, gameOptions.fallSpeed / 2, Phaser.Easing.Linear.None, true);
                    }, this);
                    this.targetsArray[i].energy = 360;
                    this.targetsArray[i].energyLoss = this.energyLoss;
                    didMatch = true;
                    score += totalSum * (this.visitedTiles.length - 1);
                    this.scoreText.text = score.toString();
                }
            }
        }
        game.input.onUp.remove(this.releaseTile, this);
        game.input.deleteMoveCallback(this.moveTile, this);
        this.arrowsGroup.removeAll(true);
        if (didMatch) {
            this.doneSound.play();
            this.energyLoss += 0.02;
            this.clearPath();
            this.tilesFallDown();
            this.placeNewTiles();
        }
        else {
            for (var i = 0; i < this.visitedTiles.length; i++) {
                this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].tint = this.tintColor;
                this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].picked = false;
            }
            this.failSound.play();
            this.nextPick();
        }
    }
    checkAdjacent(p1, p2) {
        return (Math.abs(p1.x - p2.x) <= 1) && (Math.abs(p1.y - p2.y) <= 1);
    }
    addArrow() {
        var fromTile = this.visitedTiles[this.visitedTiles.length - 2];
        var arrow = game.add.sprite(this.tilesArray[fromTile.y][fromTile.x].x, this.tilesArray[fromTile.y][fromTile.x].y, "arrows");
        arrow.tint = this.tintColor;
        this.arrowsGroup.add(arrow);
        arrow.anchor.set(0.5);
        var tileDiff = new Phaser.Point(this.visitedTiles[this.visitedTiles.length - 1].x, this.visitedTiles[this.visitedTiles.length - 1].y);
        tileDiff.subtract(this.visitedTiles[this.visitedTiles.length - 2].x, this.visitedTiles[this.visitedTiles.length - 2].y);
        if (tileDiff.x == 0) {
            arrow.angle = -90 * tileDiff.y;
        }
        else {
            arrow.angle = 90 * (tileDiff.x + 1);
            if (tileDiff.y != 0) {
                arrow.frame = 1;
                if (tileDiff.y + tileDiff.x == 0) {
                    arrow.angle -= 90;
                }
            }
        }
        this.arrowsArray.push(arrow);
    }
    clearPath() {
        for (var i = 0; i < this.visitedTiles.length; i++) {
            this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].visible = false;
            this.removedTiles.push(this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x]);
            this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x] = null;
        }
    }
    tilesFallDown() {
        for (var i = gameOptions.fieldSize.cols - 1; i >= 0; i--) {
            for (var j = 0; j < gameOptions.fieldSize.rows; j++) {
                if (this.tilesArray[i][j] != null) {
                    var holes = this.holesBelow(i, j);
                    if (holes > 0) {
                        var coordinate = new Phaser.Point(this.tilesArray[i][j].coordinate.x, this.tilesArray[i][j].coordinate.y);
                        var destination = new Phaser.Point(j, i + holes);
                        var tween = game.add.tween(this.tilesArray[i][j]).to({
                            y: this.tilesArray[i][j].y + holes * gameOptions.tileSize
                        }, gameOptions.fallSpeed, Phaser.Easing.Linear.None, true);
                        tween.onComplete.add(this.nextPick, this);
                        this.tilesArray[destination.y][destination.x] = this.tilesArray[i][j];
                        this.tilesArray[coordinate.y][coordinate.x] = null;
                        this.tilesArray[destination.y][destination.x].coordinate = new Phaser.Point(destination.x, destination.y);
                        this.tilesArray[destination.y][destination.x].children[0].text = "R" + destination.y + ", C" + destination.x;
                    }
                }
            }
        }
    }
    placeNewTiles() {
        for (var i = 0; i < gameOptions.fieldSize.cols; i++) {
            var holes = this.holesInCol(i);
            if (holes > 0) {
                for (var j = 1; j <= holes; j++) {
                    var tileXPos = i * gameOptions.tileSize + gameOptions.tileSize / 2;
                    var tileYPos = -j * gameOptions.tileSize + gameOptions.tileSize / 2;
                    var theTile = this.removedTiles.pop();
                    theTile.position = new Phaser.Point(tileXPos, tileYPos);
                    theTile.visible = true;
                    theTile.tint = this.tintColor;
                    theTile.picked = false;
                    var tween = game.add.tween(theTile).to({
                        y: theTile.y + holes * gameOptions.tileSize
                    }, gameOptions.fallSpeed, Phaser.Easing.Linear.None, true);
                    tween.onComplete.add(this.nextPick, this);
                    theTile.coordinate = new Phaser.Point(i, holes - j);
                    theTile.value = game.rnd.between(1, 9);
                    theTile.children[0].frame = theTile.value - 1;
                    this.tilesArray[holes - j][i] = theTile;
                }
            }
        }
    }
    nextPick() {
        if (!game.input.onDown.has(this.pickTile, this)) {
            game.input.onDown.add(this.pickTile, this);
        }
    }
    holesBelow(row, col) {
        var result = 0;
        for (var i = row + 1; i < gameOptions.fieldSize.rows; i++) {
            if (this.tilesArray[i][col] == null) {
                result++;
            }
        }
        return result;
    }
    holesInCol(col) {
        var result = 0;
        for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
            if (this.tilesArray[i][col] == null) {
                result++;
            }
        }
        return result;
    }
    findSum(n) {
        for (var i = 1; i < gameOptions.fieldSize.rows - 3; i++) {
            for (var j = 1; j < gameOptions.fieldSize.cols - 2; j++) {
                for (var k = 0; k <= 1; k++) {
                    for (var l = 0; l <= 1; l++) {
                        var newRow = i + k;
                        var newCol = j + l;
                        if ((k != 0 || l != 0) && newRow < gameOptions.fieldSize.rows && newRow >= 0 && newCol < gameOptions.fieldSize.cols && newCol >= 0) {
                            if (this.tilesArray[i][j].value + this.tilesArray[newRow][newCol].value == n) {
                                return ([i, j, newRow, newCol]);
                            }
                        }
                    }
                }
            }
        }
        return [];
    }
}
class gameOver {
    constructor() { }
    create() {
        var bestScore = Math.max(score, savedData.score);
        game.add.text(game.width / 2, 100, "Your score", { fontFamily: "font", fontSize: 48 }).anchor.set(0.5);
        game.add.text(game.width / 2, 200, score.toString(), { fontFamily: "bignumbersfont", fontSize: 90 }).anchor.set(0.5);
        game.add.text(game.width / 2, game.height - 200, "Best score", { fontFamily: "font", fontSize: 48 }).anchor.set(0.5);
        game.add.text(game.width / 2, game.height - 100, bestScore.toString(), { fontFamily: "bignumbersfont", fontSize: 90 }).anchor.set(0.5);
        localStorage.setItem(gameOptions.localStorageName, JSON.stringify({
            score: bestScore
        }));
        var playButton = game.add.button(game.width / 2, game.height / 2, "playbutton", this.startGame);
        playButton.anchor.set(0.5);
        var tween = game.add.tween(playButton).to({
            width: 220,
            height: 220
        }, 1500, "Linear", true, 0, -1, true);
    }
    startGame() {
        game.plugin.fadeAndPlay("rgb(38, 41, 44)", 0.25, "TheGame");
    }
}
Phaser.Plugin.FadePlugin = function (game, parent) {
    Phaser.Plugin.call(this, game, parent);
};
Phaser.Plugin.FadePlugin.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.FadePlugin.prototype.constructor = Phaser.Plugin.SamplePlugin;
Phaser.Plugin.FadePlugin.prototype.fadeAndPlay = function (style, time, nextState) {
    this.crossFadeBitmap = this.game.make.bitmapData(this.game.width, this.game.height);
    this.crossFadeBitmap.rect(0, 0, this.game.width, this.game.height, style);
    this.overlay = this.game.add.sprite(0, 0, this.crossFadeBitmap);
    this.overlay.alpha = 0;
    var fadeTween = this.game.add.tween(this.overlay);
    fadeTween.to({
        alpha: 1
    },
        time * 1000, Phaser.Easing.None, true);
    fadeTween.onComplete.add(function () {
        this.game.state.start(nextState);
    }, this);
};
