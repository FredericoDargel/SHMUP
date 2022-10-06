class GameWindow {
    constructor() {

        var outerSizes = [640, 480];
        var innerSizes = [340, 400];

        this.canvasOuter = document.getElementById('outer');
        this.canvasInner = document.getElementById('inner');

        [this.canvasOuter.width, this.canvasOuter.height] = outerSizes;
        [this.canvasInner.width, this.canvasInner.height] = innerSizes;

        this.contextOuter = this.canvasOuter.getContext('2d');
        this.contextInner = this.canvasInner.getContext('2d');

        this.canvasInner.style.visibility  = 'hidden';
        
        // this.contextOuter.fillStyle = 'blue';
        // this.contextOuter.fillRect(0, 0, 640, 480);

        // this.contextInner.fillStyle = 'lightgrey';
        // this.contextInner.fillRect(0, 0, 340, 400);
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

class GameEngine {
    constructor() {
        this.gameWindow = new GameWindow();
        this.inputHandler = new InputHandler();

        this.gameStates = [];
        this.initGameStates();

        this.gameloop = setInterval(() => {
            if(this.gameStates.length == 0) { delete this; }

            this.gameStates[this.gameStates.length - 1].update(this);
            this.gameStates[this.gameStates.length - 1].draw(this);

        }, 1000 / 60 );
    }

    /**
     * This should append various game states to game state list.
     * I believe that core states are the Main Menu, which should be in the [0] position,
     * the Load State, which should be in [1] and Splash in [2].
     * 
     * From that point, Load State will load things required to run the Main Menu
     * and depending on what user choses in the Main Menu other states should be appended to be the last.
     * 
     * For now, I am going to append just the Game State, since it's the most important one.
     */
    initGameStates() {
        // this.gameStates.push(new MainMenu()); // Runs the Main Menu;
        // this.gameStates.push(new LoadState()); // Loads stuff for Main Menu
        // this.gameStates.push(new Splash()); // Display Splash screen.
        // this.gameStates.push(new LoadState()); // Loads stuff for the Splash.
        this.gameStates.push(new GameState(this));
    }
}

class GameState {
    constructor(GameEngine){
        this.input = GameEngine.inputHandler;
        this.gameWindow = GameEngine.gameWindow;
        this.gameWindow.canvasInner.style.visibility = 'visible';

        this.gameObjects = [];
        var startingPosition = [(340-25)/2, 400-(25*2.5)]
        this.gameObjects.push(new Player(startingPosition, 5, .5));
    }

    /**
     * TODO: GameObjects have a order to be drawn.
     * The draw order determines what is drawn on top of what.
     * I believe in a SHMUP like Touhou, the order is enemies, player, projectiles.
     * My reason for that is that enemies should not block the player's view of the player, 
     * however the projectiles must be drawn on top of the player so it can be visible for maneuvering.
     * Note: Player's projectiles must be drawn first.
     */
    sortGameObjects(){
    }

    update(GameEngine) {
        if (this.gameObjects.length == 0) { return; }

        // this.detectCollisions();
        this.gameObjects.forEach(gameObject => {
            gameObject.update(GameEngine);
        });
    }

    draw() {
        // UI
        this.gameWindow.contextOuter.fillStyle = 'darkblue';
        this.gameWindow.contextOuter.fillRect(
            0, 
            0, 
            this.gameWindow.canvasOuter.width, 
            this.gameWindow.canvasOuter.height
        )
        
        // Game Area
        this.gameWindow.contextInner.fillStyle = 'lightgrey';
        this.gameWindow.contextInner.fillRect(
            0, 
            0, 
            this.gameWindow.canvasInner.width, 
            this.gameWindow.canvasInner.height
        )

        this.gameObjects.forEach(gameObject => {
            gameObject.draw(this.gameWindow.contextInner);
        });

    }
};

class Player {
    constructor(startingPosition, normalSpeed, slowSpeedFactor) { 

        this.isAlive = true;

        this.startingPosition = startingPosition;
        this.position = this.startingPosition;
        this.direction = [0, 0];
        
        this.isBombing = false;
        this.isShooting = false;

        this.isSlowed = false;
        this.normalSpeed = normalSpeed; // Marisa and Reimu have different speed...
        this.slowedSpeed = normalSpeed * slowSpeedFactor; // ... and slow speed factor.

        this.width = 25;
        this.height = 25;
    }

    update(GameEngine) {
        this.inputControl(GameEngine.inputHandler);

        var boundaries = [0, 0, GameEngine.gameWindow.canvasInner.width - this.width, GameEngine.gameWindow.canvasInner.height - this.height];

        if (this.isShooting) { this.shoot() };
        if (this.isBombing) { this.bomb() };
        if (this.direction != [0, 0]) { this.move(boundaries) };

    }

    inputControl(input){
        if (!this.isAlive) { return }

        input.state['confirm'] ? this.isShooting = true : this.isShooting = false;
        input.state['cancel'] ? this.isBombing = true : this.isBombing = false;
        input.state['slow'] ? this.isSlowed = true : this.isSlowed = false;

        // Horizontal movement:
        if (input.state['right']) { this.direction[0] = 1 }
        else if (input.state['left']) { this.direction[0] = -1}
        else { this.direction[0] = 0 }

        // Vertical movement:
        if (input.state['down']) { this.direction[1] = 1 }
        else if (input.state['up']) { this.direction[1] = -1 }
        else { this.direction[1] = 0;}
    }

    shoot() {
        console.log('pew!');
    }

    bomb() {
        console.log('boom!');
    }

    move(boundaries) {
        // Changing speed:
        var speed = 0;
        this.isSlowed ? speed = this.slowedSpeed : speed = this.normalSpeed;

        // Normalize:
        if ( this.direction[0] != 0 && this.direction[1] != 0) {
            var normal = Math.sqrt(this.direction[0] ** 2 + this.direction[1] ** 2);
            this.direction[0] = this.direction[0] / normal;
            this.direction[1] = this.direction[1] / normal;
        }

        // New position:
        var horizontalMovement  = this.position[0] + this.direction[0] * speed;
        var verticalMovement    = this.position[1] + this.direction[1] * speed;

        if (horizontalMovement < boundaries[0])
        {
            horizontalMovement = boundaries[0];
        }

        if (horizontalMovement > boundaries[2])
        {
            horizontalMovement = boundaries[2];
        }

        if (verticalMovement < boundaries[1])
        {
            verticalMovement = boundaries[1];
        }

        if (verticalMovement > boundaries[3])
        {
            verticalMovement = boundaries[3];
        }

        this.position = [horizontalMovement, verticalMovement];
        // console.log(this.position);
    }

    draw(context) {
        // Less Verbosing:
        // var context = GameEngine.gameWindow.contextInner;

        // Draw Player:
        // context.fillStyle = 'red'; // Reimu is red;
        context.fillStyle = 'black'; // Marisa is black;
        context.fillRect(
            this.position[0],
            this.position[1],
            this.width,
            this.height,
        )

        if (this.isSlowed) {
            context.fillStyle = 'red';
            context.fillRect(
                this.position[0] + this.width / 2.6,
                this.position[1] + this.height / 2.6,
                this.width / 4,
                this.height / 4,
            )
        }
    }

}


var game = new GameEngine();