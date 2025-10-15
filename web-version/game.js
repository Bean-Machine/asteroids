// Get canvas + context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Define constants from Python version
const pi = Math.PI;
const arenaSize = 600;
const arenaMargin = 25;
const hudHeight = 50;
const arenaWidth = arenaSize - (2 * arenaMargin);

const shipLength1 = 24;            // distance between shipCenter and front point of ship
const shipLength2 = 5;             // distance between shipCenter and back point of ship
const shipWidth = 18;              // distance between shipCenter and wing points of ship
const shipRadius = 8;              // radius of ship's hit box
const shipWingAngle = 2 * pi/3;    // the ship's wing angle
const shipMaxForwardSpeed = 2;
const shipMaxBackwardSpeed = 1.5;
const shipMaxJinkSpeed = 1.5;
const shipTurnSpeed = 0.02;
const shipForwardAccel = 0.03;
const shipBackwardAccel = 0.03;
const shipDecel = 0.01;
const shipJinkAccel = 0.03;
const shipJinkDecel = 0.01;
const shipBoostDecel = 0.05;
const shipMaxBoostSpeed = 3;
const boostRechargeTime = 60;

const gunReloadTime = 20;
const bulletRadius = 3;
const bulletLifeSpan = 100;
const bulletLifeSpan2 = 75;
const bulletLifeSpan3 = 50;
const bulletAngle1 = pi / 12;
const bulletAngle2 = pi / 6;
const bulletSpeed = 3;
const asteroidRadius = 30;
const asteroidLifeBar = 10;
const asteroidColour = "#ffff00";
const explosionlifeSpan = 255;
const shipMargin = arenaMargin * 0.8;


// Initilise HUD constants
const textFont = "28px Helvetica";
const countdownLength = 600;
const hudFont = "20px Helvetica";
const scoreLine = arenaSize + 3;
const livesLine = scoreLine + 26;
const hudMargin = 30;


// Initial ship settings
let shipCenter = {x: arenaSize / 2 + arenaMargin, y: arenaSize / 2 + arenaMargin};
let shipAngle = pi/2;            				   	// the ship's initial angle in radians
let shipWingAngleR = shipAngle + shipWingAngle;     // the angle of the ship's right wing relative to its front angle
let shipWingAngleL = shipAngle - shipWingAngle;     // the angle of the ship's left wing relative to its front angle
let shipSpeed = 0;
let shipJinkSpeed = 0;
let shipBoostSpeed = 0;
let boostRecharge = 0;
let shipDestroyed = false;
let gunCounter = 0;
let impactCounter = 0;           // for time between playing the sfxImpact sound

let gameLevel = 0;
let lives = 3;
let gameOver = false;
let score = 0;
let running = true;
let initialisePlayfield = true;
let betweenLevelsCountdown = 0;
let lifeLostCountdown = 0;

let bullets = [];
let asteroids = [];
let explosions = [];

let upKeyLast = false;




// Input handling
let keys = {};
document.addEventListener ("keydown", e => keys[e.key] = true);
document.addEventListener ("keyup", e => keys[e.key] = false);


// Game functions
function getDistance (x1, y1, x2, y2)
{
    let xDelta = x2 - x1;
    let yDelta = y2 - y1;
    let distance = Math.sqrt ((xDelta * xDelta) + (yDelta * yDelta));
    return distance;
}

function newBullet (xCo, yCo, ang, ls)
{
	let newBullet = { x: xCo, y: yCo, angle: ang, lifeSpan: ls };
	bullets.push (newBullet);
}

function newAsteroid (xCo, yCo, spd, ang)
{
    let randomAngle = pi * 0.5 * Math.random();
    asteroid = {lifeBar: asteroidLifeBar, colour: asteroidColour,
                x: xCo, y: yCo, speed: spd, angle: ang + randomAngle};
    asteroids.push (asteroid);
}

function asteroidCollision (asteroid1, asteroid2)
{
    let tempSpeed = asteroid1.speed;
    asteroid1.speed = asteroid2.speed;
    asteroid2.speed = tempSpeed;
    let tempAngle = asteroid1.angle;
    asteroid1.angle = asteroid2.angle;
    asteroid2.angle = tempAngle;
}

function getAsteroidColor (asteroid)
{
    let n = Math.floor (asteroid.lifeBar * 200 / 10);
    if (n < 0)
        n = 0;

    // Convert to 2-digit hex
    let green = n.toString (16);
    if (n < 16)
        green = "0" + green;

    return "#ff" + green + "00";
}

function moveAsteroid (asteroid)
{
    asteroid.x += Math.cos (asteroid.angle) * asteroid.speed;
    asteroid.y -= Math.sin (asteroid.angle) * asteroid.speed;
}

function newExplosion (xCo, yCo)
{
    let explosion = {lifeSpan: explosionlifeSpan, x: xCo, y: yCo};
    explosions.push (explosion);
}

function getExplosionColor (explosion)
{
    let n = 256 - explosion.lifeSpan;
    if (n < 0)
    	n = 0;
  	let greenBlue = n.toString (16);
    if (n < 16)
        greenBlue = "0" + greenBlue;
    if (n % 10 > 4)
        return "#ff" + greenBlue + greenBlue;
    return "#ffff" + greenBlue;
}

function getExplosionRadius (explosion)
{
    return (256 - explosion.lifeSpan) / 3;
}

function clearScreen()
{
	ctx.fillStyle = "grey";
	ctx.fillRect (0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";
	ctx.fillRect (arenaMargin, arenaMargin, arenaWidth, arenaWidth);
}

function displayScore()
{
	ctx.fillStyle = "white";
	ctx.font = hudFont;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";
	ctx.fillText ("SCORE: " + score, hudMargin, scoreLine);
	ctx.fillText ("LIVES: " + lives, hudMargin, livesLine);
}

function displayGameMessage (message)
{
	ctx.fillStyle = "black";
	ctx.font = textFont;
	ctx.textAlign = "center";
	ctx.textBaseline = "alphabetic";
	ctx.fillText (message, 300, 300);
}


function mainGameLoop()
{
	// Between levels sequence (while counting down, none of the rest of the game loop is executed)
    if (betweenLevelsCountdown > 0)
    {
    	if (betweenLevelsCountdown === countdownLength)
        {
			// Clear screen
			clearScreen();
			displayScore();
			displayGameMessage ("ARENA CLEARED!");
		}
		else if (betweenLevelsCountdown === countdownLength / 2)
        {
			// Clear screen
			clearScreen();
			displayScore();
			displayGameMessage ("GET READY FOR THE NEXT WAVE!");
		}
  		betweenLevelsCountdown--;
		return;
    }
    // Ship destroyed sequence
    else if (shipDestroyed)
    {
    	// Finish all explosion animations
    	for (let i = 0; i < explosions.length; i++)
    	{
			let radius = getExplosionRadius (explosions[i]);
			let colour = getExplosionColor (explosions[i]);
			explosions[i].lifeSpan -= 1;
			// redraw explosion
			ctx.beginPath();
			ctx.arc (explosions[i].x, explosions[i].y, radius, 0, pi * 2); 	// x, y, radius, startAngle, endAngle
			ctx.fillStyle = colour;
			ctx.fill();
		}
		// Remove dead explosions from list
    	explosions = explosions.filter (explosion => explosion.lifeSpan > 0);
		if (explosions.length <= 0)
		{
			shipDestroyed = false;
			lifeLostCountdown = countdownLength;
			gameLevel -= 1;
			if (gameLevel < 0)
				gameLevel = 0;
			lives -= 1;
			if (lives <= 0)
				gameOver = true;
        	initialisePlayfield = true;
		}
		return;
    }
    // Countdown sequence after losing a life
    else if (lifeLostCountdown > 0)
    {
    	if (lifeLostCountdown === countdownLength)
        {
			// Clear screen
			clearScreen();
			displayScore();
			displayGameMessage ("YOU DIED!");
		}
		else if (lifeLostCountdown === countdownLength / 2)
        {
        	if (gameOver)
        	{
				// Clear screen
				clearScreen();
				displayScore();
				displayGameMessage ("GAME OVER");
				return;
			}	
			// Clear screen
			clearScreen();
			displayScore();
			displayGameMessage ("GET READY!");
		}
  		lifeLostCountdown--;
		return;
    }
    

	// Initialise playfield upon new round 
	if (initialisePlayfield)
	{
        shipCenter.x = 300, shipCenter.y = 300, shipAngle = pi/2, shipSpeed = 0, shipJinkSpeed = 0;
        shipBoostSpeed = 0, boostRecharge = 0; 

        // lists for bullet, asteroid and explosion dictionaries
        bullets = [];
        explosions = [];
        asteroids = [];
        newAsteroid (100, 100, 1.5, pi / 3);
        newAsteroid (200, 400, 2, pi);
        newAsteroid (480, 500, 1.2, 7 * pi / 5);
        newAsteroid (300, 500, 1, pi / 5);
        newAsteroid (180, 200, 1.3, 4 * pi / 5);
        if (gameLevel > 0)
        {
            newAsteroid (300, 100, 1.3, 2 * pi / 5);
            if (gameLevel > 2)
            {
                newAsteroid (400, 400, 1.2, 6 * pi / 5);
                if (gameLevel > 4)
                {
                    newAsteroid (500, 100, 1, 4 * pi / 5);
                    if (gameLevel > 5)
                        newAsteroid (100, 500, 1.5, 4 * pi / 5);
                }
            }
        }
        initialisePlayfield = false;
    }

    // Process joypad and keyboard inputs
    const gp = navigator.getGamepads()?.[0];
    const dpadUp = gp?.buttons?.[12]?.pressed;
    const dpadDown = gp?.buttons?.[13]?.pressed;
    const dpadLeft = gp?.buttons?.[14]?.pressed;
    const dpadRight = gp?.buttons?.[15]?.pressed;
    const triggerL = gp?.buttons?.[6]?.pressed;
    const triggerR = gp?.buttons?.[7]?.pressed;
    const buttonL = gp?.buttons?.[4]?.pressed;
    const buttonR = gp?.buttons?.[5]?.pressed;
    const button1 = gp?.buttons?.[2]?.pressed;
    const button2 = gp?.buttons?.[0]?.pressed;
    const button3 = gp?.buttons?.[1]?.pressed;
    const button4 = gp?.buttons?.[3]?.pressed;

    const turnLeft = dpadLeft || keys["ArrowLeft"];
    const turnRight = dpadRight || keys["ArrowRight"];
    const moveForward = dpadUp || keys["e"];
    const moveBack = dpadDown || keys["d"];
    const moveLeft = triggerL || keys["s"];
    const moveRight = triggerR || keys["f"];
    const boostLeft = button1 || keys["a"];
    const boostRight = button3 || keys[" "];
    const shoot = button4 || keys["ArrowUp"];

	// Apply inputs
    if (turnLeft)
        shipAngle += shipTurnSpeed;
    if (turnRight)
        shipAngle -= shipTurnSpeed;
    if (moveForward)
    {
        shipSpeed += shipForwardAccel;
        if (shipSpeed > shipMaxForwardSpeed)
            shipSpeed = shipMaxForwardSpeed;
    }
    if (moveBack)
    {
        shipSpeed -= shipBackwardAccel;
        if (shipSpeed < -shipMaxBackwardSpeed)
            shipSpeed = -shipMaxBackwardSpeed;
    }
    if (! (moveForward || moveBack))
    {
        if (shipSpeed > 0)
            shipSpeed -= shipDecel;
        else if (shipSpeed < 0)
            shipSpeed += shipDecel;
        if (Math.abs (shipSpeed) < 0.001)
            shipSpeed = 0;
    }
	if (moveLeft)
    {
        shipJinkSpeed -= shipJinkAccel;
        if (shipJinkSpeed < -shipMaxJinkSpeed)
            shipJinkSpeed = -shipMaxJinkSpeed;
    }
    if (moveRight)
    {
        shipJinkSpeed += shipJinkAccel;
        if (shipJinkSpeed > shipMaxJinkSpeed)
            shipJinkSpeed = shipMaxJinkSpeed;
    }
    if (! (moveLeft || moveRight))
    {
        if (shipJinkSpeed > 0)
            shipJinkSpeed -= shipJinkDecel;
        else if (shipJinkSpeed < 0)
            shipJinkSpeed += shipJinkDecel;
        if (Math.abs (shipJinkSpeed) < 0.001)
            shipJinkSpeed = 0;
    }
    if (boostLeft)
    {
        if (boostRecharge <= 0)
        {
            boostRecharge = boostRechargeTime;
            shipBoostSpeed = -shipMaxBoostSpeed;
            if (shipJinkSpeed > 0)
                shipJinkSpeed = -shipJinkSpeed;
        }
    }
    else if (boostRight)
    {
        if (boostRecharge <= 0)
        {
            boostRecharge = boostRechargeTime;
            shipBoostSpeed = shipMaxBoostSpeed;
            if (shipJinkSpeed < 0)
                shipJinkSpeed = -shipJinkSpeed;
        }
    }
    if (shoot)
    {
        if (! upKeyLast)               // allows for rapid fire by repeatedly mashing the fire button
            gunCounter = 0;
        if (gunCounter <= 0)
        {
            newBullet (shipCenter["x"], shipCenter["y"], shipAngle, bulletLifeSpan);
            if (gameLevel > 1)
            {
                newBullet (shipCenter["x"], shipCenter["y"], shipAngle - bulletAngle1, bulletLifeSpan2);
                newBullet (shipCenter["x"], shipCenter["y"], shipAngle + bulletAngle1, bulletLifeSpan2);
                if (gameLevel > 3)
                {
                    newBullet (shipCenter["x"], shipCenter["y"], shipAngle - bulletAngle2, bulletLifeSpan3);
                    newBullet (shipCenter["x"], shipCenter["y"], shipAngle + bulletAngle2, bulletLifeSpan3);
                }
            }
            gunCounter += gunReloadTime;
        }
        else if (gunCounter > 0)
            gunCounter -= 1;
    }
    upKeyLast = keys["ArrowUp"];

	// Clear screen
  	clearScreen();
	displayScore();
  	
  	// Draw explosions
    for (let i = 0; i < explosions.length; i++)
    {
        // calculate upper/lower/left/right bounds
        let radius = getExplosionRadius (explosions[i]);
        let colour = getExplosionColor (explosions[i]);
        let x1 = explosions[i].x - radius;
        let y1 = explosions[i].y - radius;
        let x2 = explosions[i].x + radius;
        let y2 = explosions[i].y + radius;
        explosions[i].lifeSpan -= 1;
    	// redraw explosion
        ctx.beginPath();
  		ctx.arc (explosions[i].x, explosions[i].y, radius, 0, pi * 2); 	// x, y, radius, startAngle, endAngle
  		ctx.fillStyle = colour;
		ctx.fill();
    	// remove explosions when it goes out of bounds
        if (x1 < arenaMargin || x2 > arenaSize - arenaMargin)
            explosions[i].lifeSpan = 0;
        else if (y1 < arenaMargin || y2 > arenaSize - arenaMargin)
            explosions[i].lifeSpan = 0;
    }
    // Remove dead explosions from list
    explosions = explosions.filter (explosion => explosion.lifeSpan > 0);
  	
  	// Move ship center
    shipCenter.x += shipSpeed * Math.cos (shipAngle);
    shipCenter.y -= shipSpeed * Math.sin (shipAngle);
    shipCenter.x += (shipJinkSpeed + shipBoostSpeed) * Math.cos (shipAngle - (pi/2));
    shipCenter.y -= (shipJinkSpeed + shipBoostSpeed) * Math.sin (shipAngle - (pi/2));
    if (shipCenter.x - shipRadius < arenaMargin)
        shipCenter.x = arenaMargin + shipRadius;
    else if (shipCenter.x + shipRadius > arenaSize - arenaMargin)
        shipCenter.x = arenaSize - arenaMargin - shipRadius;
    if (shipCenter.y - shipRadius < arenaMargin)
        shipCenter.y = arenaMargin + shipRadius;
    else if (shipCenter.y + shipRadius > arenaSize - arenaMargin)
        shipCenter.y = arenaSize - arenaMargin - shipRadius;

    // Decrease boost speed and boost recharge
    if (shipBoostSpeed < 0)
        shipBoostSpeed += shipBoostDecel;
    else if (shipBoostSpeed > 0)
        shipBoostSpeed -= shipBoostDecel;
    if (boostRecharge > 0)
        boostRecharge -= 1
  	
  	// Recalculate ship's points
    shipWingAngleR = shipAngle - shipWingAngle;
    shipWingAngleL = shipAngle + shipWingAngle;
    const shipPoint1X = shipCenter.x + (Math.cos (shipAngle) * shipLength1);
    const shipPoint1Y = shipCenter.y - (Math.sin (shipAngle) * shipLength1);
    const shipPoint2X = shipCenter.x + (Math.cos (shipWingAngleR) * shipWidth);
    const shipPoint2Y = shipCenter.y - (Math.sin (shipWingAngleR) * shipWidth);
    const shipPoint3X = shipCenter.x + (Math.cos (shipAngle + pi) * shipLength2);
    const shipPoint3Y = shipCenter.y - (Math.sin (shipAngle + pi) * shipLength2);
    const shipPoint4X = shipCenter.x + (Math.cos (shipWingAngleL) * shipWidth);
    const shipPoint4Y = shipCenter.y - (Math.sin (shipWingAngleL) * shipWidth);
  	// Draw ship
  	ctx.fillStyle = "black";
  	ctx.beginPath();
  	ctx.moveTo (shipPoint1X, shipPoint1Y);
  	ctx.lineTo (shipPoint2X, shipPoint2Y);
  	ctx.lineTo (shipPoint3X, shipPoint3Y);
  	ctx.lineTo (shipPoint4X, shipPoint4Y);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	
	// Move and redraw bullets
	for (let bullet of bullets)
	{
		bullet.x += Math.cos (bullet.angle) * bulletSpeed;
		bullet.y -= Math.sin (bullet.angle) * bulletSpeed;
		bullet.lifeSpan -= 1;
		// draw bullet as a circle
		ctx.beginPath();
  		ctx.arc (bullet.x, bullet.y, bulletRadius, 0, pi * 2); 	// x, y, radius, startAngle, endAngle
  		ctx.fillStyle = "blue";
		ctx.fill();
		// remove bullet if goes out of bounds
        if (bullet.x < arenaMargin || bullet.x > arenaSize - arenaMargin)
            bullet.lifeSpan = 0;
        else if (bullet.y < arenaMargin || bullet.y > arenaSize - arenaMargin)
            bullet.lifeSpan = 0;
	}
	// Check for collisions between asteroids and bullets
    let impact = false;
    if (impactCounter > 0)
        impactCounter -= 1;
   	for (let asteroid of asteroids)
   	{
   		for (let j = 0; j < bullets.length; j++)
   		{
   			if (bullets[j].lifeSpan <= 0)
   				continue;
   			let x1 = asteroid.x;
            let y1 = asteroid.y;
            let x2 = bullets[j].x;
            let y2 = bullets[j].y;
            let distance = getDistance (x1, y1, x2, y2);
            if (distance < asteroidRadius + bulletRadius)
            {
            	impact = true;
            	asteroid.lifeBar -= 1;
            	bullets[j].lifeSpan = 0;
            	let shipDistance = getDistance (x1, y1, shipCenter.x, shipCenter.y);
                if (shipDistance < 2 * asteroidRadius)
                    score += 50;
                else
                    score += 20;
            }
   		}
   	}

	// Remove dead bullets
	bullets = bullets.filter (bullet => bullet.lifeSpan > 0);
	
	// Check for collisions between asteroids and ship
    for (let asteroid of asteroids)
    {
        let distance = getDistance (asteroid.x, asteroid.y, shipCenter.x, shipCenter.y);
        if (distance < asteroidRadius + shipRadius)
        {
            shipDestroyed = true;
            newExplosion (shipCenter.x, shipCenter.y);
        }
    }
	
	// Check for collisions between asteroids
    for (let i = 0; i < asteroids.length; i++)
    {
        for (let j = i + 1; j < asteroids.length; j++)
        {
            let x1 = asteroids[i].x;
            let y1 = asteroids[i].y;
            let x2 = asteroids[j].x;
            let y2 = asteroids[j].y;
            let distance = getDistance (x1, y1, x2, y2);
            if (distance < 2 * asteroidRadius)
                asteroidCollision (asteroids[i], asteroids[j]);
        }
    }
	
	// Move and redraw asteroids
    for (let i = 0; i < asteroids.length; i++)
    {
        // calculate upper/lower/left/right bounds
        x1 = asteroids[i].x - asteroidRadius;
        y1 = asteroids[i].y - asteroidRadius;
        x2 = asteroids[i].x + asteroidRadius;
        y2 = asteroids[i].y + asteroidRadius;
        // bounce the asteroid if it hits a wall
        if (x1 <= arenaMargin)
            asteroids[i].angle = pi - asteroids[i].angle;
        else if (x2 >= arenaSize - arenaMargin)
            asteroids[i].angle = pi - asteroids[i].angle;
        if (y1 <= arenaMargin)
            asteroids[i].angle = -asteroids[i].angle;
        else if (y2 >= arenaSize - arenaMargin)
            asteroids[i].angle = -asteroids[i].angle;
        // move asteroid and refresh screen
        moveAsteroid (asteroids[i]);
        // redraw asteroid
        colour = getAsteroidColor (asteroids[i]);
		ctx.beginPath();
  		ctx.arc (asteroids[i].x, asteroids[i].y, asteroidRadius, 0, pi * 2); 	// x, y, radius, startAngle, endAngle
  		ctx.fillStyle = colour;
		ctx.fill();
		ctx.stroke();

        // remove asteroid if it gets destroyed and create explosion
        if (asteroids[i].lifeBar <= 0)
        {
            newExplosion (asteroids[i].x, asteroids[i].y);
            score += 1000;
        }
    }
    // Remove dead asteroids from list
    asteroids = asteroids.filter (asteroid => asteroid.lifeBar > 0);
    
    // Set between levels countdown if all asteroids and explosions have been destroyed
    if (asteroids.length === 0 && explosions.length === 0)
    {
    	betweenLevelsCountdown = countdownLength;
    	bullets = [], asteroids = [], explosions = [];
        initialisePlayfield = true;
        gameLevel += 1;
        score += 500;
    }
}

function loop()
{
	mainGameLoop();
  	requestAnimationFrame(loop);
}

loop(); // Start game loop
