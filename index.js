class GameWindow {

    constructor(scale) {
        // do not assign anything from here directly!
        this.resolution = [640, 480];
        this.scale      = scale;
        this.canvas     = document.querySelector('canvas');
        this.context    = this.canvas.getContext('2d');

        this.scaleResolution();
    }

    scaleResolution() {
        this.resolution = [this.resolution[0] * this.scale, 
                            this.resolution[1] * this.scale];
                            
        [this.canvas.width, this.canvas.height] = [this.resolution[0], this.resolution[1]];
    }

    setScale(scale) {
        if (scale <= 0 || this.scale == scale) { return }

        this.scale = scale;
        this.scaleResolution();
    }
};

class InputHandler {

    constructor() {
        // do not assign anything from here directly!

        // Game Controls:
        this.state = {
            up:         false,     
            down:       false,   
            right:      false,  
            left:       false,   
            slow:       false,   
            confirm:    false, // or shoot
            cancel:     false, // or bomb
            pause:      false,  
            menu:       false,   
        };

        // Input:
        this.keyMap = {
            ArrowUp:    'up',    
            ArrowDown:  'down',
            ArrowRight: 'right',
            ArrowLeft:  'left',  
            ShiftLeft:  'slow',  
            KeyZ:       'confirm',        
            KeyX:       'cancel',        
            Enter:      'pause',     
            Escape:     'menu',    
        };

        addEventListener ('keydown', (ev) => {
            let key = this.keyMap[ev.code];
            if (!key) { return } //ignore other keys
            this.state[key] = true;
            // console.log("KEYDOWN: " + key);
        });

        addEventListener ("keyup", (ev) => {
            let key = this.keyMap[ev.code];
            if (!key) { return } // ignore other keys
            this.state[key] = false;
            // console.log("KEYUP: " + key);
        });

        /* Dunno how to do or to use this properly...
         * addEventListener('keypress', (ev) => {
         *     let key = this.keyMap[ev.code];
         *     if (!key) { return } // ignore other keys
         *     this.state[key] = true;
         *     console.log("KEYPRESSED: " + ev);
         * })
         */
    } 
};

class Game {

    constructor() {

        this.gameWindow     = new GameWindow(1);
        this.inputHandler   = new InputHandler();
        
        this.gameStates     = [];

        this.initGameStates();

        // TODO: A proper game loop like a grown-up.
        this.gameloop = setInterval(() => {

            if(this.gameStates.length == 0) { delete this; }

            this.gameStates[this.gameStates.length - 1].update(this.inputHandler, this.gameWindow);
            this.gameStates[this.gameStates.length - 1].draw(this.gameWindow);

        }, 1000 / 60 );
    }

    initGameStates() {
        var gameState = new GameState(this.gameWindow.scale);

        this.gameStates.push(gameState);
    }
};

class AbstractGameState {
    constructor(scale) {
        if (this.constructor == AbstractGameState) {
            throw new Error("Abstract classes can NOT be instatiated.");
        }

        this.scale = scale;
    }

    update() {
        throw new Error("Method 'update()' must be implemented.");
    }

    draw() {
        throw new Error("Method 'draw()' must be implemented.");
    }
};

class GameState extends AbstractGameState {
    constructor(scale) {
        super(scale);

        // Native resolution values:
        this.gameScreen = [340, 400];
        this.padding = 40;

        // Game UI:
        this.gameUI = new GameUI(this);

        // GameObjects:
        this.gameObjects = [];

        // "Native" player width and height:
        var playerWidth = 25;   // Read Player Class comments!
        var playerHeight = 25;  // As above!

        // Testing bullshit:
        var calculatedArea = this.calculateGameArea();
        var startingPosition = [
            calculatedArea[2] / 2 + (playerWidth * this.scale),
            calculatedArea[3] - (playerHeight * this.scale)      
        ]
        this.player = new Player(playerWidth, playerHeight, startingPosition, 4 * scale, [0, 0]);
        this.enemy = new Enemy(playerWidth, playerHeight,  [startingPosition[0], calculatedArea[1] + playerHeight * this.scale], 1 * scale, [1, .25]);
        
        this.gameObjects.push(this.enemy);
        this.gameObjects.push(this.player);
    }

    update(inputHandler, gameWindow) {
        if (this.gameObjects.length == 0) { return; }
        this.controlPlayer(inputHandler);
        this.gameObjects.forEach(gameObject => {
            gameObject.update(this, this.calculateGameArea());
        });
    }

    calculateGameArea() {
        var padding = this.padding * this.scale;

        var gameArea = [
            padding,                                        // Start X
            padding / 1.5,                                  // Start Y
            (this.gameScreen[0] * this.scale) + padding,         // End X
            (this.gameScreen[1] * this.scale) + (padding / 1.5)  // End Y
        ];

        return gameArea;
    }

    controlPlayer(input) {

        if (input.state['slow']) {
            this.player.isSlowed = true;
        } else {
            this.player.isSlowed = false;
        }

        if (input.state['confirm']) {
            this.player.shoot(this);
        }

        // if (input.state['cancel'])
        // {
        //     this.bomb(gameState);
        // }

        this.player.direction = this.moveInput(input);
    }

    moveInput(input) {
        var direction = [0, 0];

        // Horizontal movement:
        if (input.state['right']) { direction[0] = 1 }
        else if (input.state['left']) { direction[0] = -1}
        else { direction[0] = 0 }

        // Vertical movement:
        if (input.state['down']) { direction[1] = 1 }
        else if (input.state['up']) { direction[1] = -1 }
        else { direction[1] = 0;}

        // Normalize:
        if ( direction[0] != 0 && direction[1] != 0) {
            var normal = Math.sqrt( direction[0]**2 + direction[1]**2 );
            direction[0] = direction[0] / normal;
            direction[1] = direction[1] / normal;
        }

        // Apply slowed speed after normalization:
        // if (this.player.isSlowed) {
        //     direction[0] *= this.player.slowed;
        //     direction[1] *= this.player.slowed;
        // }

        return direction;
    }

    draw(gameWindow) {
        
        var context = gameWindow.context;
        var scale = gameWindow.scale;

        this.drawBackground(gameWindow);
        this.gameUI.draw(gameWindow, gameWindow.scale);

        this.drawGameArea(context, scale);
        this.gameObjects.forEach(gameObject => {
            gameObject.draw(gameWindow);
        });
    }

    drawBackground(gameWindow) {
        gameWindow.context.fillStyle = 'darkblue';
        gameWindow.context.fillRect(0, 0, gameWindow.resolution[0], gameWindow.resolution[1]);
    }

    drawGameArea(context, scale){
        var gameArea = this.calculateGameArea(scale)

        context.fillStyle = 'lightgrey';
        context.fillRect(
            gameArea[0], 
            gameArea[1], 
            gameArea[2], 
            gameArea[3]
        );
    }
};

class GameUI {

    constructor(GameState /* difficulty */) {

        this.gameState = GameState;

        // Font:
        this.fontSize = 20;
        this.fontStyle = "Courier";
        this.fontColour = "lightgrey";
        this.fontStroke = "lightgrey";

        // Game:
        this.highScore = 0; // TODO: get from a file..?
        this.playerScore = 0; // Starts at 0;

        this.playerLives = 3; // Depends on difficulty;
        this.playerBombs = 3; // As above;

        this.playerPower = 0; 
        this.playerMaxPower = 0; // Dunno.
        this.grazeCounter = 0;
        this.collectedScore = 0;
    }

    setValuesFromDifficulty( /* difficulty */) {
        /* TODO:
        * Set lives and bombs according to difficulty
        */
    }

    update() {
        if (this.playerLives == 0) {/* exit this state */}
    }

    draw(gameWindow, scale) {
        
        var context = gameWindow.context;
        
        var positionXOffset = 1.45;        
        var menuItems = [];
        
        var highScore = {
            text: "HighScore: " + this.highScore,
            position: [gameWindow.resolution[0] / positionXOffset, 
                        (this.gameState.padding) * scale],
        };
        menuItems.push(highScore);

        var playerScore = {
            text: "Score: " + this.playerScore,
            position: [gameWindow.resolution[0] / positionXOffset, 
                         (this.fontSize * 3) * scale],
        };
        menuItems.push(playerScore);

        var lives = "";
        for (let index = 0; index < this.playerLives; index++) {lives += "*";}

        var playerLives = {
            text: "Lives: " + lives,
            position: [gameWindow.resolution[0] / positionXOffset,
                        (this.fontSize * 5.5) * scale],
        };
        menuItems.push(playerLives);

        var bombs = "";
        for (let index = 0; index < this.playerLives; index++) {bombs += "*";}
        var playerBombs = {
            text: "Bombs: " + bombs,
            position: [gameWindow.resolution[0] / positionXOffset,
                        (this.fontSize * 6.5) * scale],
        };
        menuItems.push(playerBombs);

        var playerPower = {
            text: "Power: " + this.playerPower,
            position: [gameWindow.resolution[0] / positionXOffset,
                        (this.fontSize * 9) * scale],
        };
        menuItems.push(playerPower);

        var grazeCounter = {
            text: "Graze: " + this.grazeCounter,
            position: [gameWindow.resolution[0] / positionXOffset,
                        (this.fontSize * 10.0 ) * scale],
        }; 
        menuItems.push(grazeCounter);

        var collectedScore = {
            text: "Score: " + this.collectedScore,
            position: [gameWindow.resolution[0] / positionXOffset, 
                        (this.fontSize * 11) * scale],
        }; 
        menuItems.push(collectedScore);
        
        menuItems.forEach(item => {
            this.drawText(item, context, scale);
        });

        var circleCenter = [0.83, 0.78];

        context.beginPath();
        context.arc(
            gameWindow.resolution[0] * circleCenter[0],
            gameWindow.resolution[1] * circleCenter[1],
            60 * gameWindow.scale,
            0,
            2* Math.PI
        );
        context.closePath();
        context.fillStyle = "red";
        context.fill();

        context.beginPath();
        context.arc(
            gameWindow.resolution[0] * circleCenter[0],
            gameWindow.resolution[1] * circleCenter[1],
            55 * gameWindow.scale,
            0,
            2* Math.PI
        );
        context.closePath();
        context.fillStyle = "lightgrey";
        context.fill();

        context.beginPath();
        context.arc(
            gameWindow.resolution[0] * circleCenter[0],
            gameWindow.resolution[1] * circleCenter[1],
            50 * gameWindow.scale,
            0,
            2* Math.PI
        );
        context.closePath();
        context.fillStyle = "red";
        context.fill();

        context.beginPath();
        context.arc(
            gameWindow.resolution[0] * circleCenter[0],
            gameWindow.resolution[1] * circleCenter[1],
            45 * gameWindow.scale,
            0,
            2* Math.PI
        );
        context.closePath();
        context.fillStyle = "darkblue";
        context.fill();
    }

    drawText(item, context, scale) {

        context.font = this.fontSize * scale + 'px ' + this.fontStyle;
        context.fillStyle = this.fontColour;
        context.strokeStyle = this.fontStroke;
        context.textAlign = "left";

        context.fillText(item.text, item.position[0], item.position[1]);
        context.strokeText(item.text, item.position[0], item.position[1]);
    }
};

class AbstractActor {
    constructor(width, height, startingPosition, speed, direction) {
        if (this.constructor == AbstractActor){
            throw new Error("Abstract classes can NOT be instatiated.");
        }

        this.width      = width;
        this.height     = height;

        this.position   = startingPosition;
        this.speed      = speed;

        this.direction   = direction;
    }

    // TODO: Boundaries are not working properly.
    move(boundaries) {

        // Keeping inbounds and actually moving:
        var horizontalMovement  = this.position[0] + this.direction[0] * this.speed;
        var verticalMovement    = this.position[1] + this.direction[1] * this.speed;

        var startX  = boundaries[0];
        var endX    = boundaries[2];

        var startY  = boundaries[1];
        var endY    = boundaries[3];
        
        // Debug:
        // console.log(startX);
        // console.log(endX);
        // console.log(startY);
        // console.log(endY);

        // console.log(endX - startX);
        // console.log(endY - startY);

        if (this.direction[0] != 0) {

            if ( horizontalMovement >= startX && horizontalMovement <= endX ) {
                this.position[0] = horizontalMovement;
            }

            else if (horizontalMovement <= startX) {
                this.position[0] = startX;
            }

            else if (horizontalMovement >= endX){
                this.position[0] = endX;
            }
        }

        if (this.direction[1] != 0) {

            if ( verticalMovement >= startY && verticalMovement <= endY ) {
                this.position[1] = verticalMovement;
            }
            
            else if (verticalMovement <= startY) {
                this.position[1] = startY;
            }
            
            else if (verticalMovement >= endY){
                this.position[1] = endY;
            }
        }
    }
};

class Player extends AbstractActor {
    /* For some made up reason in my head I believe that actor's width and height 
     * should not be passed scaled.
     * The reason for that is that whenever these are real sprites you will want to define 
     * in the constructor their sizes to be cropped from the sheet, animation and other stuff.
     * So you want to pass the "Native" resolution for the Actor, player, enemy, whatever 
     * and let the draw() method do the scaling.
     */
    constructor(width, height, startingPosition, speed, direction) {
        super(width, height, startingPosition, speed, direction);

        this.standardSpeed  = speed;
        this.slowedSpeed    = speed * 0.5;
        this.isSlowed       = false;
        
        this.lastShot         = performance.now();
        this.shootingCooldown = 50 ;
    }

    update(gameState, boundaries) {

        var movingBoundaries = Object.assign({}, boundaries);
        // It works tho:
        // movingBoundaries[2] += this.width / 1.67 * gameState.scale ;
        // movingBoundaries[3] += this.height * .1 * gameState.scale;

        if (this.isSlowed)
        {
            this.speed = this.slowedSpeed;
        } else {
            this.speed = this.standardSpeed;
        }

        this.move(movingBoundaries);
    }

    shoot(gameState) { 
        if (!(performance.now() - this.lastShot > this.shootingCooldown)) { return; }
        
        this.lastShot = performance.now();
        var shootPosition =  [
            this.position[0] + this.width * gameState.scale / 2,
            this.position[1] - this.height * gameState.scale / 10
        ];
        
        gameState.gameObjects.push(new Projectile(shootPosition, 10, [0, -1], undefined, 'yellow'))
    }

    draw(gameWindow) {
        // Less Verbose:
        var context = gameWindow.context;
        var scale = gameWindow.scale;

        // Drawing Triangles is hard:
        context.beginPath();
        context.moveTo(this.position[0], this.position[1] + this.height * scale);
        context.lineTo(this.position[0] + (this.height * scale) / 2, this.position[1]);
        context.lineTo(this.position[0] + this.height * scale, this.position[1] + this.width * scale);
        context.lineTo(this.position[0], this.position[1]+this.height * scale);
        context.fillStyle = 'black';
        context.fill();
        context.closePath();

        

        // Shows hitbox
        if (this.isSlowed) {
            context.beginPath();
            context.arc(
                this.position[0] + this.width * scale * .5, 
                this.position[1] + (this.height * scale * .65), 
                (this.width / 7) * scale, 
                0, 
                2 * Math.PI
            );
            context.closePath();
            context.fillStyle = 'red';
            context.fill();
        }
    }
};

class Enemy extends AbstractActor {

    constructor(width, height, startingPosition, speed, direction) {
        super(width, height, startingPosition, speed, direction);

        this.hitpoints = 1;

    }

    update(gameState, boundaries) {
        this.move(boundaries);
        if (this.position[0] <= boundaries[0]+this.width || this.position[0] >= boundaries[2]-this.width) {
            this.direction[0] *= -1;
        }
        if (this.position[1] <= boundaries[1]+this.height || this.position[1] >= boundaries[3]-this.height ) {
            for (let i = 0; i < gameState.gameObjects.length; i++) {
                var gameObject = gameState.gameObjects[i];
                if (gameObject === this) {
                    gameState.gameObjects.splice(i, 1);
                }
                
            }
        }
    }

    draw(gameWindow) {
        gameWindow.context.fillStyle = 'purple';
        gameWindow.context.fillRect(this.position[0], this.position[1],
                        this.width * gameWindow.scale, this.height * gameWindow.scale);
    }
};

class Projectile extends AbstractActor {
    constructor(startingPosition, speed, direction, target, colour) {
        super(5, 7, startingPosition, speed);

        this.direction = direction;
        this.target = target;
        this.colour = colour;
    }

    update (gameState, boundaries) {

        var shootingBoundaries = Object.assign({}, boundaries);
        // This time did not work...
        // shootingBoundaries[2] += this.width * gameState.scale ;
        // shootingBoundaries[3] += this.height * .1 * gameState.scale;

        this.move(shootingBoundaries);

        if (this.position[0] <= shootingBoundaries[0] ||
            this.position[1] <= shootingBoundaries[1] ||
            this.position[0] >= shootingBoundaries[2] ||
            this.position[0] >= shootingBoundaries[3]) 
        {
            for (let i = 0; i < gameState.gameObjects.length; i++) {
                var gameObject = gameState.gameObjects[i];
                if (gameObject === this) {
                    gameState.gameObjects.splice(i, 1);
                }
            }
        }
    }

    draw (gameWindow) {
        gameWindow.context.beginPath();
        gameWindow.context.ellipse(
            this.position[0], this.position[1],
            this.width/1.5 * gameWindow.scale,
            this.height * gameWindow.scale, 
            0, 
            0, 
            2 * Math.PI
        )
        gameWindow.context.closePath();
        gameWindow.context.fillStyle = this.colour;
        gameWindow.context.fill();
    }
};

const game = new Game();