// Paddle Properties
const PADDLE_WIDTH = canvas.width / 3;
const PADDLE_HEIGHT = 22;
const PADDLE_XV = 12;
const PADDLE_XV1 = canvas.width / 3;
const PADDLE_GAP = 10;
const PADDLE_Y = canvas.height - PADDLE_HEIGHT - PADDLE_GAP;
let paddle_X = canvas.width / 2 - PADDLE_WIDTH / 2;
let noChoiceMadeYet = true;
let prevSpeedY = 0;
let prevSpeedX = 0;
let ballplayerconnect = true;


const updatePaddlePosition = () => {
    if (heldKeys['ArrowLeft'] && paddle_X > 0) {
        paddle_X -= PADDLE_XV;
    }

    if (heldKeys['ArrowRight'] && paddle_X + PADDLE_WIDTH < canvas.width) {
        paddle_X += PADDLE_XV;
    }
};

document.addEventListener('keydown', logKey);

function logKey(e) {
    // stops anything from happen when holding down a key
    if (e.repeat) {
        return;
    }

    // enter key
    if (e.keyCode == 13) {
        if (!ballplayerconnect) {
            choosePosition();
        } else {
            if (gameOver) {
                gameOverReset();
            } else if (ballplayerconnect) {
                if (heldKeys['ArrowLeft'] == true) {
                    balls[0].velocityX = INITIAL_BALL_XV;
                } else if (heldKeys['ArrowRight'] == true) {
                    balls[0].velocityX = -INITIAL_BALL_XV;
                }
                ballplayerconnect = false;
            }
            if (cannon) {
                fireBullets = true;
            }
        }
    }

    // space bar
    if (e.keyCode == 32) {
        togglePosition();
    }
}

function choosePosition() {
    document.getElementById("top").removeAttribute("style");
    document.getElementById("bottom").setAttribute("style", "background: palegreen;");
    balls[0].velocityX = prevSpeedX;
    balls[0].velocityY = prevSpeedY;
    // balls[0].x += 6;
    balls[0].y = 431;
    score = 0;
}

function togglePosition() {
    document.getElementById("bottom").removeAttribute("style");
    document.getElementById("top").setAttribute("style", "background: palegreen;");


    if (paddle_X == (canvas.width / 2 - PADDLE_WIDTH / 2) - (canvas.width / 3)) {
        paddle_X = (canvas.width / 2 - PADDLE_WIDTH / 2);
    } else if (paddle_X == canvas.width / 2 - PADDLE_WIDTH / 2) {
        paddle_X = (canvas.width / 2 - PADDLE_WIDTH / 2) + (canvas.width / 3);
    } else {
        paddle_X = (canvas.width / 2 - PADDLE_WIDTH / 2) - (canvas.width / 3);
    }
}


// Ball Properties
const BALL_COLOR = 'white';
const BALL_DIA = 20;
const INITIAL_BALL_XV = -5;
const INITIAL_BALL_YV = -5;
let ballPaddleHitSound = new soundOverlapsClass("audio/hit");
let ballBrickSound = new soundOverlapsClass("audio/brick");
let ballMissSound = new soundOverlapsClass("audio/miss");
let stickyBall = false;
let redBall = false;
let multiBall = false;
let bonusLifeEligible = true;
let balls = [];

class Ball {
    constructor() {
        this.velocityX = INITIAL_BALL_XV;
        this.velocityY = INITIAL_BALL_YV;
        this.y = PADDLE_Y - BALL_DIA / 2;
        this.x = paddle_X + PADDLE_WIDTH / 2;
        //ball connected to player paddle
        this.chainBounce = false;
        this.useless = false;
    }
    updatePosition() {
        if (ballplayerconnect) {
            this.y = PADDLE_Y - 10;
            this.x = paddle_X + (PADDLE_WIDTH / 2);
        } else {
            this.move();
            this.brickHandling();
            this.paddleHandling();
        }
    }

    reset() {
        this.velocityX = INITIAL_BALL_XV;;
        this.velocityY = INITIAL_BALL_YV;
        this.y = PADDLE_Y - BALL_DIA / 2;
        this.x = paddle_X + PADDLE_WIDTH / 2;
    }

    move() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.x < 0 && this.velocityX < 0.0) { //left
            this.velocityX *= -1;
        }

        if (this.x > canvas.width && this.velocityX > 0.0) { // right
            this.velocityX *= -1;
        }

        if (this.y < 0 && this.velocityY < 0.0) { // top
            this.velocityY *= -1;
        }

        if (this.y > canvas.height) { // bottom
            if (numLives > 1) {
                if (balls.length == 1) {
                    numLives--;
                    ballMissSound.play();
                    lifeLossReset();
                } else {
                    this.useless = true;
                }

            } else {
                ballMissSound.play();
                gameOver = true;
                status = "You are Dead";
            }

        }
    }


    paddleHandling() {
        let paddleTopEdgeY = PADDLE_Y - PADDLE_GAP;
        let paddleBottomEdgeY = PADDLE_Y + PADDLE_HEIGHT;
        let paddleLeftEdgeX = paddle_X;
        let paddleRightEdgeX = paddleLeftEdgeX + PADDLE_WIDTH;
        if (this.y > paddleTopEdgeY && // below the top of paddle
            this.y < paddleBottomEdgeY && // above bottom of paddle
            this.x > paddleLeftEdgeX && // right of the left side of paddle
            this.x < paddleRightEdgeX) { // left of the left side of paddle

            scoreHandling();

            if (!stickyBall) {

                this.velocityY *= -1;
                let centerOfPaddleX = paddle_X + PADDLE_WIDTH / 2;
                let ballDistFromPaddleCenterX = this.x - centerOfPaddleX;
                this.velocityX = ballDistFromPaddleCenterX * 0.3;
                this.speedIncrement(0.04);
                this.chainBounce = false;
                ballPaddleHitSound.play();

            } else if (stickyBall) {
                score = 0;
                ballplayerconnect = true;
                //Potential bug
                balls[0].reset();
            }


        } // ball center inside paddle
    } // end of ballPaddleHandling

    brickHandling() {
        //have to take into consideration how ball is travelling left to right,r

        let prevBallX = this.x - this.velocityX;
        let prevBallY = this.y - this.velocityY;
        let prevBrickCol = Math.floor(prevBallX / BRICK_WIDTH);
        let prevBrickRow = Math.floor(prevBallY / BRICK_HEIGHT);
        let bothTestsFailed = true;

        let ballBrickCol, ballBrickRow;

        //if ball is coming towards brick from left
        // x,y is center of ball
        if (prevBallX < this.x) {
            ballBrickCol = Math.floor((this.x + (BALL_DIA / 2)) / BRICK_WIDTH);
        }

        //if ball is coming towards brick from right
        if (prevBallX > this.x) {
            ballBrickCol = Math.floor((this.x - (BALL_DIA / 2)) / BRICK_WIDTH);
        }

        //if ball is coming towards brick from top
        if (prevBallY < this.y) {
            ballBrickRow = Math.floor((this.y + (BALL_DIA / 2)) / BRICK_HEIGHT);
        }

        //if ball is coming towards brick from bottom
        if (prevBallY > this.y) {
            ballBrickRow = Math.floor((this.y - (BALL_DIA / 2)) / BRICK_HEIGHT);

        }


        if (ballBrickCol >= 0 && ballBrickCol < BRICK_COLS && ballBrickRow >= 0 && ballBrickRow < BRICK_ROWS) {
            let brickIndexUnderBall = rowColToArrayIndex(ballBrickCol, ballBrickRow);
            if (bricks[brickIndexUnderBall] > 0) {
                bricks[brickIndexUnderBall]--;
                if (bricks[brickIndexUnderBall] == 0) {
                    bricksLeft--;
                }
                this.chainBounce ? score += 20 : score += 10;
                scoreHandling();
                this.speedIncrement(0.02);
                this.chainBounce = true;
                ballBrickSound.play();
                let random = Math.floor(Math.random() * 20);
                if (random == 0) {
                    let decideWhichPowerup = Math.ceil(Math.random() * 6);
                    let powerup;
                    switch (decideWhichPowerup) {
                        case 1:
                            powerup = new Powerup(this.x, this.y, cannonPowerupPic, "cannon");
                            break;
                        case 2:
                            powerup = new Powerup(this.x, this.y, extraScorePowerupPic, "extraScore");
                            break;
                        case 3:
                            powerup = new Powerup(this.x, this.y, multiBallPowerupPic, "multiBall");
                            break;
                        case 4:
                            powerup = new Powerup(this.x, this.y, redBallPowerupPic, "redBall");
                            break;
                        case 5:
                            powerup = new Powerup(this.x, this.y, stickyBallPowerupPic, "stickyBall");
                            break;
                        case 6:
                            powerup = new Powerup(this.x, this.y, lifePic, "freeLife");
                            break;
                    }
                    powerups.push(powerup);
                    powerup.move();

                }
                if (bricksLeft == 0 && numLives > 0) {
                    goToNextLevel();
                } // out of bricks



                if (!redBall) {
                    if (prevBrickCol != ballBrickCol) {
                        if (isBrickAtColRow(prevBrickCol, ballBrickRow) == false) {
                            this.velocityX *= -1;
                            bothTestsFailed = false;
                        }
                    }
                    if (prevBrickRow != ballBrickRow) {
                        if (isBrickAtColRow(ballBrickCol, prevBrickRow) == false) {
                            this.velocityY *= -1;
                            bothTestsFailed = false;
                        }
                    }
                    if (bothTestsFailed) { // armpit case, prevents ball from going through
                        this.velocityX *= -1;
                        this.velocityY *= -1;
                    }
                }
            } // end of brick found
        } // end of valid col and row
    } // end of ballBrickHandling func

    speedIncrement(inc) {

        if (!ballplayerconnect) {
            if (this.velocityX < 0) {
                this.velocityX -= inc;
            }

            if (this.velocityX >= 0) {
                this.velocityX += inc;
            }


            if (this.velocityY < 0) {
                this.velocityY -= inc;
            }

            if (this.velocityY >= 0) {
                this.velocityY += inc;
            }

        }

    }
}


//Bricks
//These will be set of coordinates which will be displayed via loop
//Different levels can be loaded based on this map which will be stored in different file

const BRICK_HEIGHT = 23;
const BRICK_WIDTH = 71;
const BRICK_GAP = 2;
const BRICK_COLS = 16;
const BRICK_ROWS = 12;
const CANNON_WIDTH = 15;
const CANNON_HEIGHT = 50;
let cannon = false;
let fireBullets = false;
let level = 0;
let bricks = levels[level].slice();

balls.push(new Ball())

const countBricks = () => {
    let brickCount = 0;
    for (let i = 0; i < bricks.length; i++) {
        if (bricks[i]) brickCount++;
    }
    console.log(brickCount)
    return brickCount;
}

let bricksLeft = countBricks();

const mainGame = () => {
    if (balls[0].y >= 350 && balls[0].y <= 399 && score > 0) {
        prevSpeedX = balls[0].velocityX;
        prevSpeedY = balls[0].velocityY;
    }

    if (balls[0].y >= 400 && balls[0].y <= 430 && score > 0) {
        balls[0].velocityX = 0;
        balls[0].velocityY = 0;
    }

    if (!gameOver) {
        ctx.drawImage(skyPic, 0, 0);
        drawBricks();
        updatePaddlePosition();
        ctx.drawImage(paddlePic, paddle_X, PADDLE_Y);

        if (multiBall && balls.length == 1) {
            let ball1 = new Ball();
            let ball2 = new Ball();
            balls.push(ball1);
            balls.push(ball2);
            console.log(balls);

            for (let i = 1; i <= 2; i++) {
                balls[i].velocityX = balls[0].velocityX + (Math.ceil(Math.random() * 3) - Math.ceil(Math.random() * 3))
                balls[i].velocityY = balls[0].velocityX + (Math.ceil(Math.random() * 3) - Math.ceil(Math.random() * 3))
                balls[i].x = balls[0].x;
                balls[i].y = balls[0].y;
            }

            multiBall = false;
        }

        //displaying all balls.
        for (let i = 0; i < balls.length; i++) {
            if (!balls[i].useless) {
                balls[i].updatePosition();
                if (redBall) {
                    ctx.drawImage(redBallPic, balls[i].x - BALL_DIA / 2, balls[i].y - BALL_DIA / 2);
                } else {
                    ctx.drawImage(ballPic, balls[i].x - BALL_DIA / 2, balls[i].y - BALL_DIA / 2);
                }
            } else {
                balls.splice(i, 1);
            }
        }

        //powerup display
        if (powerups.length > 0) {

            //draw it.
            for (let i = 0; i < powerups.length; i++) {
                if (!powerups[i].useless) {
                    powerups[i].move();
                } else if (powerups[i].useless) {
                    powerups.splice(i, 1);
                }
            }
        }

        if (cannon) {
            ctx.drawImage(cannonPic, paddle_X + PADDLE_WIDTH / 4, PADDLE_Y - CANNON_HEIGHT);
        }

        if (fireBullets && bullets.length < 1) {
            bullets.push(new Bullet());
            fireBullets = false;
        }

        if (bullets.length == 1) {
            bullets[0].draw();
        }

        let lifePicOffset = 0
        for (let i = 0; i < numLives; i++) {
            ctx.drawImage(lifePic, canvas.width - 50 - lifePicOffset, 15);
            lifePicOffset += 30;
        }
        // colorText('Score : ' + score ,20,30,"white",'16px Arial');
        colorText('Level : ' + (level + 1), canvas.width / 2, 30, "white", '16px Arial', 'center');
    } else {
        // colorRect(0, 0, canvas.width, canvas.height,BRICK_COLOR);
        ctx.drawImage(skyPic, 0, 0);
        colorText(status, canvas.width / 2, canvas.height / 3, "white", '60px Arial', 'center');
        // colorText("Final Score : " + score,canvas.width/2, canvas.height/2 - 50,"white",'25px Arial','center');
        colorText("(Click) to play again", canvas.width / 2, canvas.height / 2, "white", '20px Arial', 'center');
    }



}


const rowColToArrayIndex = (col, row) => {

    return col + BRICK_COLS * row;

}


const drawBricks = () => {

    let brickLeftEdgeX = 0;
    let brickTopEdgeY = 0;
    for (let eachRow = 0; eachRow < BRICK_ROWS; eachRow++) {
        brickLeftEdgeX = 0;
        for (let eachCol = 0; eachCol < BRICK_COLS; eachCol++) {
            let arrayIndex = rowColToArrayIndex(eachCol, eachRow);
            if (bricks[arrayIndex] == 1) {
                ctx.drawImage(brick1Pic, brickLeftEdgeX, brickTopEdgeY);
            }
            if (bricks[arrayIndex] == 2) {
                ctx.drawImage(brick2Pic, brickLeftEdgeX, brickTopEdgeY);
            }
            if (bricks[arrayIndex] == 3) {
                ctx.drawImage(brick3Pic, brickLeftEdgeX, brickTopEdgeY);
            }
            brickLeftEdgeX += BRICK_WIDTH;
        }
        brickTopEdgeY += BRICK_HEIGHT;
    }

};



const isBrickAtColRow = (col, row) => {

    if (col >= 0 && col < BRICK_COLS && row >= 0 && row < BRICK_ROWS) {
        let brickIndexUnderCoord = rowColToArrayIndex(col, row);
        return bricks[brickIndexUnderCoord];
    } else {
        return false;
    }

}

const lifeLossReset = () => {

    balls[0].reset();
    gameOver = false;
    ballplayerconnect = true;
    score = 0;

}; //gameReset


const gameOverReset = () => {

    initializeBricks();
    paddle_X = canvas.width / 2 - PADDLE_WIDTH / 2;
    lifeLossReset();
    numLives = LIVES;
    level = 0;
    score = 0;

};


const goToNextLevel = () => {

    lifeLossReset();
    level++;
    initializeBricks();
    paddle_X = canvas.width / 2 - PADDLE_WIDTH / 2;
    numLives = LIVES;

}


const initializeBricks = () => {

    bricks = levels[level].slice();
    bricksLeft = countBricks();

}

const scoreHandling = () => {

    if (score >= 10000 && bonusLifeEligible) {
        numLives += 1;
        bonusLifeEligible = false;
    }

}