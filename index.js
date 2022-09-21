class GameWindow {
    constructor(width, height) {
        this.resolution = [width, height];
        this.scale = 1;
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.scaleResolution();
    }

    scaleResolution() {
        [this.canvas.width, this.canvas.height] = [this.resolution[0] * this.scale, this.resolution[1] * this.scale];
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

        // Dunno how to do or to use this properly...

        // addEventListener('keypress', (ev) => {
        //     let key = this.keyMap[ev.code];
        //     if (!key) { return } // ignore other keys
        //     this.state[key] = true;
        //     console.log("KEYPRESSED: " + ev);
        // })

        addEventListener ("keyup", (ev) => {
            let key = this.keyMap[ev.code];
            if (!key) { return } // ignore other keys
            this.state[key] = false;
            // console.log("KEYUP: " + key);
        });
    } 
};

class Game {

    constructor() {
        this.gameWindow = new GameWindow(600, 400);
        this.inputHandler = new InputHandler();

        this.gameStates = [];
        this.gameStates.push(new GameState(this.gameWindow, this.inputHandler))

        // TODO: A proper game loop like a grown-up.
        this.gameloop = setInterval(() => {
            this.gameStates[this.gameStates.length - 1].update();
            this.gameStates[this.gameStates.length - 1].draw();
        }, 1000 / 60 );
    }
};

// TODO: Common attributes.
// TODO: Methods to enter, exit, etc...
class AbstractGameState {
    constructor() {
        if (this.constructor == AbstractGameState){
            throw new Error("Abstract classes can NOT be instatiated.");
        }
    }

    update(){
        throw new Error("Method 'update()' must be implemented.");
    }

    draw() {
        throw new Error("Method 'draw()' must be implemented.");
    }
};

class GameState extends AbstractGameState {

    constructor(gameWindow, inputHandler,
        // highScore, lives, bombs 
        ) {
        super();

        this.gameWindow = gameWindow;

        this.gameScreen = [240, 320]; // Maybe this is important, maybe not, I'm not sure.
        this.padding = 40;
        this.gameBoundaries = [this.padding, this.padding/1.5, 
                                this.gameScreen[0]+this.padding, this.gameScreen[1]+this.padding/1.5];

        
        // TODO: Decide wheater or not these should be in another class.
        // UI and game elements:
        this.highScore = 0;
        this.actualScore = 0;

        this.playerLives = 0;
        this.playerBombs = 3;

        this.playerPower = 0;
        this.graze = 0;
        this.score = 0;

        // Player Object:
        this.gameObjects = [];
        this.player = new Player(inputHandler);
        this.gameObjects.push(this.player);
    }

    update() {
        this.gameObjects.forEach(gameObject => {
            gameObject.update(this, this.gameBoundaries);
        });
    }

    draw() {
        // Background
        var res = this.gameWindow.resolution;
        this.gameWindow.context.fillStyle = 'darkblue';
        this.gameWindow.context.fillRect(0, 0, res[0], res[1]);
        
        // Game Area
        this.gameWindow.context.fillStyle = 'lightgrey';
        this.gameWindow.context.fillRect(this.padding, this.padding/1.5, 
                                            this.gameBoundaries[2], this.gameBoundaries[3]);
        
        // GameObjects:
        this.gameObjects.forEach(gameObject => {
            gameObject.draw(this.gameWindow);
        });
    }

    /* TODO: Not really. Is more 'IWantTo'.:
     * I want that everytime anything calls GameWindow.setScale(scale) 
     * this is ran as well.
     */
    scaleGameScreen(scale) {
        this.gameScreen = [this.gameScreen[0] * scale, 
                            this.gameScreen[1] * scale];
    }

};

class AbstractActor {
    constructor(width, height, startingPosition, speed) {
        if (this.constructor == AbstractActor){
            throw new Error("Abstract classes can NOT be instatiated.");
        }

        this.width      = width;
        this.height     = height;

        this.position   = startingPosition;
        this.speed      = speed;

        this.movement   = [0, 0];
    }

    // TODO: Boundaries are not working properly.
    move(boundaries) {

        // Keeping inbounds and actually moving:
        var horizontalMovement  = this.position[0] + this.movement[0] * this.speed;
        var verticalMovement    = this.position[1] + this.movement[1] * this.speed;

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

        if (this.movement[0] != 0) {

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

        if (this.movement[1] != 0) {

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

        // Debug:
        // if (this instanceof Player)
        // {
        //     if ( this.movement[0] != 0 || this.movement[1] != 0) {
        //         console.log(this.position);
        //     }
        // }
    }
};

class Player extends AbstractActor {
    constructor(input) {
        super(25, 25, [160, 300], 3);

        this.input = input;

        this.slowed     = 0.5;
        this.isSlowed   = false;
        
        this.lastShot         = performance.now();
        this.shootingCooldown = 50 ;
    }

    update(gameState, boundaries) {

        if (this.input.state['slow']) {
            this.isSlowed = true;
        } else {
            this.isSlowed = false;
        }

        if (this.input.state['confirm'] 
            && performance.now() - this.lastShot > this.shootingCooldown)
        {
            this.shoot(gameState);
        }

        if (this.input.state['cancel'])
        {
            this.bomb(gameState);
        }

        this.moveInput(this.input);
        this.move(boundaries);
    }

    draw(gameWindow) {
        // gameWindow.context.fillStyle = 'green';
        // gameWindow.context.fillRect(this.position[0], this.position[1],
        //                 this.width * gameWindow.scale, this.height * gameWindow.scale);

        gameWindow.context.beginPath()
        gameWindow.context.moveTo(this.position[0], this.position[1]+this.height)  
        gameWindow.context.lineTo(this.position[0]+this.height/2, this.position[1]) 
        gameWindow.context.lineTo(this.position[0]+this.height, this.position[1]+this.width)
        gameWindow.context.lineTo(this.position[0], this.position[1]+this.height)
        gameWindow.context.fillStyle = 'green';
        gameWindow.context.fill();
        gameWindow.context.closePath();

        

        // Shows hitbox
        if (this.isSlowed) {
            gameWindow.context.beginPath();
            gameWindow.context.arc(
                this.position[0] + this.width * .5, 
                this.position[1] + (this.height * .65), 
                (this.width / 7) * gameWindow.scale, 
                0, 
                2 * Math.PI);
            gameWindow.context.closePath();
            gameWindow.context.fillStyle = 'red';
            gameWindow.context.fill();
        }
    }

    moveInput(input) {
        // Horizontal movement:
        if (input.state['right']) { this.movement[0] = 1 }
        else if (input.state['left']) { this.movement[0] = -1}
        else { this.movement[0] = 0 }

        // Vertical movement:
        if (input.state['down']) { this.movement[1] = 1 }
        else if (input.state['up']) { this.movement[1] = -1 }
        else { this.movement[1] = 0;}

        // Normalize:
        if ( this.movement[0] != 0 && this.movement[1] != 0) {
            var normal = Math.sqrt( this.movement[0]**2 + this.movement[1]**2 );
            this.movement[0] = this.movement[0] / normal;
            this.movement[1] = this.movement[1] / normal;
        }

        // Apply slowed speed after normalization:
        if (this.isSlowed) {
            this.movement[0] *= this.slowed;
            this.movement[1] *= this.slowed;
        }
    }

    shoot(gameState) { 
        // console.log("Pew!");
        this.lastShot = performance.now();
        var shootPosition =  [this.position[0] + this.width / 2, this.position[1]-this.height/2.75];
        gameState.gameObjects.push(new Projectile(shootPosition, 10, [0, -1]))
    }

    bomb(gameState) {
        // console.log("Boom!");
        if (gameState.playerBombs <= 0) {return}

        gameState.playerBombs--;
        console.log(gameState.playerBombs);
        for (let i = 0; i < gameState.gameObjects.length; i++) {
            var element = gameState.gameObjects[i];
            if (!(element instanceof Player)) {
                gameState.gameObjects.pop(element);
            }
        }
    }
};

class Projectile extends AbstractActor {
    constructor(startingPosition, speed, direction) {
        super(5, 7, startingPosition, speed);

        this.movement = direction;
        // this.target = target;
    }

    update (gameState, boundaries) {

        var shootingBoundaries = Object.assign({}, boundaries);

        shootingBoundaries[0] -= this.width/5;
        shootingBoundaries[1] -= this.height/5;

        // shootingBoundaries[2] += this.width;
        // shootingBoundaries[3] += this.height;

        this.move(shootingBoundaries);

        if ((this.position[0] <= shootingBoundaries[0] || this.position[0] >= shootingBoundaries[2]) 
            || (this.position[1] <= shootingBoundaries[1] || this.position[0] >= shootingBoundaries[3]))
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
        gameWindow.context.ellipse(this.position[0], this.position[1], this.width/1.5 * gameWindow.scale, this.height * gameWindow.scale, 0, 0, 2 * Math.PI)
        gameWindow.context.closePath();
        gameWindow.context.fillStyle = 'yellow';
        gameWindow.context.fill();
        // gameWindow.context.fillRect(this.position[0], this.position[1],
        //                 this.width * gameWindow.scale, this.height * gameWindow.scale);
    }
};

let game = new Game();
