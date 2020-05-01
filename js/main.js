const canvas = document.getElementById('mainGame');
const ctx = canvas.getContext('2d');

// Lives
const LIVES = 3;
let numLives = LIVES;
let gameOver = false; 
let status;
let score = 0;


window.onload = () => {
    alert("The classic Breakout game but the ball freezes before reaching the player's paddle. You can then toggle between three choices of where to place the paddle using the space bar, and choose with the enter key.")
    addHoldKeyListener('ArrowLeft');
    addHoldKeyListener('ArrowRight');
    addEventListener('mousedown', mouseClickHandle);
    document.getElementById("top").addEventListener("click", logKey);
    document.getElementById("bottom").addEventListener("click", logKey);
    //debug 
    // addEventListener('keydown', (evt) => {
    //    if(evt.key == 'n'){
    //    		level++;
    //       if(level >= levels.length){
    //         level = 0;
    //       }
    //    		bricks = levels[level].slice();
    //    }

    //    if(evt.key == 'm'){
    //      multiBall = !multiBall;
    //    }
    //     if(evt.key == 'c'){
    //      cannon = !cannon;
    //    }
    // });
    loadImages();
};

const loadingDoneSoStartGame = () => {
	  // these next few lines set up our game logic and render to happen 30 times per second
	    const FRAMES_PER_SECOND = 50;
      setInterval(mainGame, 1000 / FRAMES_PER_SECOND);
       for(let i = 0; i < balls.length; i++ ){
             setInterval(balls[i].speedIncrement(0.03), 1000)
        }
       
     ;

};


