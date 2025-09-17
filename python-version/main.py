from tkinter import *
import math, random

# Load sound FX
# import simpleaudio as sa
# sfxShot = sa.WaveObject.from_wave_file("Shot.wav")
# sfxImpact = sa.WaveObject.from_wave_file("Impact.wav")
# sfxCollision = sa.WaveObject.from_wave_file("Collision.wav")
# sfxExplosion = sa.WaveObject.from_wave_file("Explosion.wav")
# sfxPlayerDeath = sa.WaveObject.from_wave_file("PlayerDeath.wav")

# Set game constants
pi = math.pi
arenaSize = 600
arenaMargin = 25
hudHeight = 50

leftKey, rightKey, upKey, upKeyLast, wKey, sKey, aKey, dKey = False, False, False, False, False, False, False, False
shipCenter = {"x": 300, "y": 300}
shipPoint1, shipPoint2, shipPoint3, shipPoint4 = [0,0], [0,0], [0,0], [0,0]
shipLength1 = 24            # distance between shipCenter and front point of ship
shipLength2 = 5             # distance between shipCenter and back point of ship
shipWidth = 18              # distance between shipCenter and wing points of ship
shipRadius = 8              # radius of ship's hit box
shipAngle = pi/2            # the ship's angle in radians
shipWingAngle = 2 * pi/3    # the ship's wing angle
shipWingAngleR = shipAngle + shipWingAngle      # the angle of the ship's right wing relative to its front angle
shipWingAngleL = shipAngle - shipWingAngle      # the angle of the ship's left wing relative to its front angle
shipSpeed = 0
shipMaxForwardSpeed = 2
shipMaxBackwardSpeed = 1.5
shipJinkSpeed = 0
shipMaxJinkSpeed = 1
shipTurnSpeed = 0.02
shipForwardAccel = 0.03
shipBackwardAccel = 0.03
shipDecel = 0.01
shipJinkAccel = 0.02
shipJinkDecel = 0.01
shipDestroyed = False

gunCounter = 0
gunReloadTime = 20
impactCounter = 0           # for time between playing the sfxImpact sound
bulletRadius = 3
bulletLifeSpan = 100
bulletLifeSpan2 = 75
bulletLifeSpan3 = 50
bulletAngle1 = pi / 12
bulletAngle2 = pi / 6
bulletSpeed = 3
asteroidRadius = 30
asteroidLifeBar = 10
asteroidColour = "#ffff00"
explosionlifeSpan = 255
shipMargin = arenaMargin * 0.8

gameLevel = 0
lives = 3
score = 0
running = True
textFont = ("Helvetica", 20, "bold")
initialisePlayfield = True

# Define functions
def keyOn(event):
    global leftKey, rightKey, upKey, wKey, sKey, aKey, dKey
    k = event.keysym
    if k == "Left":
        leftKey = True
    if k == "Right":
        rightKey = True
    if k == "Up":
        upKey = True
    if k == "w":
        wKey = True
    if k == "s":
        sKey = True
    if k == "a":
        aKey = True
    if k == "d":
        dKey = True
def keyOff(event):
    global leftKey, rightKey, upKey, wKey, sKey, aKey, dKey
    k = event.keysym
    if k == "Left":
        leftKey = False
    if k == "Right":
        rightKey = False
    if k == "Up":
        upKey = False
    if k == "w":
        wKey = False
    if k == "s":
        sKey = False
    if k == "a":
        aKey = False
    if k == "d":
        dKey = False

def getDistance(x1,y1,x2,y2):
    xDelta, yDelta = x2 - x1, y2 - y1
    distance = math.sqrt((xDelta * xDelta) + (yDelta * yDelta))
    return distance

def newBullet(x, y, angle, lifeSpan):
    bullet = {"lifeSpan": lifeSpan,
              "x": x, "y": y,
              "angle": angle,
              "graphic": arena.create_oval(0, 0, 0, 0, fill="blue", outline="blue")}
    bullets.append(bullet)

def moveBullet(bullet):
    bullet["x"] += math.cos(bullet["angle"]) * bulletSpeed
    bullet["y"] -= math.sin(bullet["angle"]) * bulletSpeed
    bullet["lifeSpan"] -= 1

def newAsteroid(x, y, speed, angle):
    randomAngle = pi * 0.5 * random.randrange(0, 100) / 100
    asteroid = {"lifeBar": asteroidLifeBar, "colour": asteroidColour,
                "x": x, "y": y,
                "speed": speed, "angle": angle + randomAngle,
                "graphic": arena.create_oval(0, 0, 0, 0, fill="orange")}
    asteroids.append(asteroid)

def asteroidCollision(asteroid1, asteroid2):
    asteroid1["speed"], asteroid2["speed"] = asteroid2["speed"], asteroid1["speed"]
    asteroid1["angle"], asteroid2["angle"] = asteroid2["angle"], asteroid1["angle"]

def getAsteroidColor(asteroid):
    n = int(asteroid["lifeBar"] * 200 / 10)
    if n < 0: n = 0
    green = hex(n)[2:]
    if n < 16:
        green = "0" + green
    return "#ff" + green + "00"

def moveAsteroid(asteroid):
    asteroid["x"] += math.cos(asteroid["angle"]) * asteroid["speed"]
    asteroid["y"] -= math.sin(asteroid["angle"]) * asteroid["speed"]

def newExplosion(x, y):
    explosion = {"lifeSpan": explosionlifeSpan,
                 "x": x, "y": y,
                 "graphic": arena.create_oval(0, 0, 0, 0, fill="white", outline="white")}
    explosions.append(explosion)

def getExplosionColor(explosion):
    n = 256 - explosion["lifeSpan"]
    if n < 0: n = 0
    greenBlue = hex(n)[2:]
    if n < 16:
        greenBlue = "0" + greenBlue
    if n % 10 > 4:
        return "#ff" + greenBlue + greenBlue
    else:
        return "#ffff" + greenBlue

def getExplosionRadius(explosion):
    return (256 - explosion["lifeSpan"]) / 3



# Create main window and arena
window = Tk()
window.title("Asteroids")
arena = Canvas(window, width=arenaSize, height=arenaSize+hudHeight, bg="#cccccc")
arena.pack()
borders = arena.create_rectangle(0, 0, arenaSize, arenaSize+hudHeight, fill="#cccccc", outline="#cccccc")
playArea = arena.create_rectangle(arenaMargin,arenaMargin,
                                  arenaSize-arenaMargin,arenaSize-arenaMargin,
                                  fill="white", outline="white")

# Create key bindings
window.bind("<KeyPress>", keyOn)
window.bind("<KeyRelease>", keyOff)

# Initilise HUD
hudFont = ("Helvetica", 18)
scoreLine = arenaSize + 3
livesLine = scoreLine + 26
hudMargin = 30


# Main game loop

while running:
    # Initialise the playfield if necessary
    if initialisePlayfield:
        scoreText0 = arena.create_text(hudMargin, scoreLine, text="SCORE:", font=hudFont, anchor="w")
        scoreText = arena.create_text(hudMargin + 80, scoreLine, text=str(score), font=hudFont, anchor="w")
        livesText0 = arena.create_text(hudMargin, livesLine, text="LIVES:", font=hudFont, anchor="w")
        livesText = arena.create_text(hudMargin + 80, livesLine, text=str(lives-1), font=hudFont, anchor="w")

        shipCenter["x"], shipCenter["y"], shipAngle, shipSpeed, shipJinkSpeed = 300, 300, pi/2, 0, 0
        ship = arena.create_polygon(shipPoint1[0], shipPoint1[1], shipPoint2[0], shipPoint2[1],
                                    shipPoint3[0], shipPoint3[1], shipPoint4[0], shipPoint4[1], fill="black")
        # lists for bullet, asteroid and explosion dictionaries
        bullets = []
        explosions = []
        asteroids = []
        newAsteroid(100, 100, 1.5, pi / 3)
        newAsteroid(200, 400, 2, pi)
        newAsteroid(480, 500, 1.2, 7 * pi / 5)
        newAsteroid(300, 500, 1, pi / 5)
        newAsteroid(180, 200, 1.3, 4 * pi / 5)
        if gameLevel > 0:
            newAsteroid(300, 100, 1.3, 2 * pi / 5)
            if gameLevel > 2:
                newAsteroid(400, 400, 1.2, 6 * pi / 5)
                if gameLevel > 4:
                    newAsteroid(500, 100, 1, 4 * pi / 5)
                    if gameLevel > 5:
                        newAsteroid(100, 500, 1.5, 4 * pi / 5)
        initialisePlayfield = False
    # Process key inputs
    if leftKey:
        shipAngle += shipTurnSpeed
    if rightKey:
        shipAngle -= shipTurnSpeed
    if wKey:
        shipSpeed += shipForwardAccel
        if shipSpeed > shipMaxForwardSpeed:
            shipSpeed = shipMaxForwardSpeed
    if sKey:
        shipSpeed -= shipBackwardAccel
        if shipSpeed < -shipMaxBackwardSpeed:
            shipSpeed = -shipMaxBackwardSpeed
    if not (wKey or sKey):
        if shipSpeed > 0:
            shipSpeed -= shipDecel
        elif shipSpeed < 0:
            shipSpeed += shipDecel
        if abs(shipSpeed) < 0.001:
            shipSpeed = 0
    if aKey:
        shipJinkSpeed -= shipJinkAccel
        if shipJinkSpeed < -shipMaxJinkSpeed:
            shipJinkSpeed = -shipMaxJinkSpeed
    if dKey:
        shipJinkSpeed += shipJinkAccel
        if shipJinkSpeed > shipMaxJinkSpeed:
            shipJinkSpeed = shipMaxJinkSpeed
    if not (aKey or dKey):
        if shipJinkSpeed > 0:
            shipJinkSpeed -= shipJinkDecel
        elif shipJinkSpeed < 0:
            shipJinkSpeed += shipJinkDecel
        if abs(shipJinkSpeed) < 0.001:
            shipJinkSpeed = 0
    if upKey:
        if not upKeyLast:               # allows for rapid fire by repeatedly mashing the fire button
            gunCounter = 0
        if gunCounter <= 0:
            newBullet(shipCenter["x"], shipCenter["y"], shipAngle, bulletLifeSpan)
            # sfxShot.play()
            if gameLevel > 1:
                newBullet(shipCenter["x"], shipCenter["y"], shipAngle - bulletAngle1, bulletLifeSpan2)
                newBullet(shipCenter["x"], shipCenter["y"], shipAngle + bulletAngle1, bulletLifeSpan2)
                if gameLevel > 3:
                    newBullet(shipCenter["x"], shipCenter["y"], shipAngle - bulletAngle2, bulletLifeSpan3)
                    newBullet(shipCenter["x"], shipCenter["y"], shipAngle + bulletAngle2, bulletLifeSpan3)
            gunCounter += gunReloadTime
        elif gunCounter > 0:
            gunCounter -= 1
    upKeyLast = upKey
    # Draw explosions
    for i in range(len(explosions)):
        # calculate upper/lower/left/right bounds
        radius = getExplosionRadius(explosions[i])
        colour = getExplosionColor(explosions[i])
        x1 = explosions[i]["x"] - radius
        y1 = explosions[i]["y"] - radius
        x2 = explosions[i]["x"] + radius
        y2 = explosions[i]["y"] + radius
        # redraw explosion
        explosions[i]["lifeSpan"] -= 1
        arena.delete(explosions[i]["graphic"])
        explosions[i]["graphic"] = arena.create_oval(x1, y1, x2, y2, fill=colour, outline=colour)
        # remove explosions when it fizzles out or goes out of bounds
        if explosions[i]["lifeSpan"] <= 0:
            arena.delete(explosions[i]["graphic"])
            explosions[i] = None
        elif x1 < arenaMargin or x2 > arenaSize - arenaMargin:
            arena.delete(explosions[i]["graphic"])
            explosions[i] = None
        elif y1 < arenaMargin or y2 > arenaSize - arenaMargin:
            arena.delete(explosions[i]["graphic"])
            explosions[i] = None
    # Remove dead explosions from lists
    explosions = [e for e in explosions if e != None]
    # Move ship center
    shipCenter["x"] += shipSpeed * math.cos(shipAngle)
    shipCenter["y"] -= shipSpeed * math.sin(shipAngle)
    shipCenter["x"] += shipJinkSpeed * math.cos(shipAngle - (pi/2))
    shipCenter["y"] -= shipJinkSpeed * math.sin(shipAngle - (pi/2))
    if shipCenter["x"] - shipRadius < arenaMargin:
        shipCenter["x"] = arenaMargin + shipRadius
    elif shipCenter["x"] + shipRadius > arenaSize - arenaMargin:
        shipCenter["x"] = arenaSize - arenaMargin - shipRadius
    if shipCenter["y"] - shipRadius < arenaMargin:
        shipCenter["y"] = arenaMargin + shipRadius
    elif shipCenter["y"] + shipRadius > arenaSize - arenaMargin:
        shipCenter["y"] = arenaSize - arenaMargin - shipRadius
    # Recalculate ship's points
    shipWingAngleR = shipAngle - shipWingAngle
    shipWingAngleL = shipAngle + shipWingAngle
    shipPoint1[0] = shipCenter["x"] + (math.cos(shipAngle) * shipLength1)
    shipPoint1[1] = shipCenter["y"] - (math.sin(shipAngle) * shipLength1)
    shipPoint2[0] = shipCenter["x"] + (math.cos(shipWingAngleR) * shipWidth)
    shipPoint2[1] = shipCenter["y"] - (math.sin(shipWingAngleR) * shipWidth)
    shipPoint3[0] = shipCenter["x"] + (math.cos(shipAngle + pi) * shipLength2)
    shipPoint3[1] = shipCenter["y"] - (math.sin(shipAngle + pi) * shipLength2)
    shipPoint4[0] = shipCenter["x"] + (math.cos(shipWingAngleL) * shipWidth)
    shipPoint4[1] = shipCenter["y"] - (math.sin(shipWingAngleL) * shipWidth)
    # Redraw ship
    arena.delete(ship)
    ship = arena.create_polygon(shipPoint1[0], shipPoint1[1], shipPoint2[0], shipPoint2[1], shipPoint3[0], shipPoint3[1],
                         shipPoint4[0], shipPoint4[1], fill="black")

    # Move and redraw bullets
    for bullet in bullets:
        # calculate upper/lower/left/right bounds
        x1 = bullet["x"] - bulletRadius
        y1 = bullet["y"] - bulletRadius
        x2 = bullet["x"] + bulletRadius
        y2 = bullet["y"] + bulletRadius
        # move and redraw bullet
        moveBullet(bullet)
        arena.delete(bullet["graphic"])
        bullet["graphic"] = arena.create_oval(x1, y1, x2, y2, fill="blue", outline="blue")
        # remove bullet if it fizzles out or goes out of bounds
        if bullet["lifeSpan"] <= 0:
            arena.delete(bullet["graphic"])
            bullet = None
        elif bullet["x"] < arenaMargin or bullet["x"] > arenaSize - arenaMargin:
            arena.delete(bullet["graphic"])
            bullet = None
        elif bullet["y"] < arenaMargin or bullet["y"] > arenaSize - arenaMargin:
            arena.delete(bullet["graphic"])
            bullet = None
    # Check for collisions between asteroids
    for i in range(len(asteroids)):
        for j in range(i + 1, len(asteroids)):
            x1 = asteroids[i]["x"]
            y1 = asteroids[i]["y"]
            x2 = asteroids[j]["x"]
            y2 = asteroids[j]["y"]
            distance = getDistance(x1,y1,x2,y2)
            if distance < 2 * asteroidRadius:
                asteroidCollision(asteroids[i], asteroids[j])
                # sfxCollision.play()
    # Check for collisions between asteroids and bullets
    impact = False
    if impactCounter > 0:
        impactCounter -= 1
    for asteroid in asteroids:
        for j in range(len(bullets)):
            if bullets[j] == None:
                continue
            x1 = asteroid["x"]
            y1 = asteroid["y"]
            x2 = bullets[j]["x"]
            y2 = bullets[j]["y"]
            distance = getDistance(x1, y1, x2, y2)
            if distance < asteroidRadius + bulletRadius:
                impact = True
                asteroid["lifeBar"] -= 1
                arena.delete(bullets[j]["graphic"])
                bullets[j] = None
                shipDistance = getDistance(x1, y1, shipCenter["x"], shipCenter["y"])
                if shipDistance < 2 * asteroidRadius:
                    score += 50
                else:
                    score += 20
                arena.itemconfig(scoreText, text=str(score))
    # Only play impact sound if enough time has elapsed since the previous one
    if impact and impactCounter == 0:
        # sfxImpact.play()
        impactCounter = 20
    # Remove dead bullets from bullet list
    bullets = [b for b in bullets if b != None]
    # Check for collisions between asteroids and ship
    for asteroid in asteroids:
        distance = getDistance(asteroid["x"], asteroid["y"], shipCenter["x"], shipCenter["y"])
        if distance < asteroidRadius + shipRadius:
            shipDestroyed = True
    # Move and redraw asteroids
    for i in range(len(asteroids)):
        # calculate upper/lower/left/right bounds
        x1 = asteroids[i]["x"] - asteroidRadius
        y1 = asteroids[i]["y"] - asteroidRadius
        x2 = asteroids[i]["x"] + asteroidRadius
        y2 = asteroids[i]["y"] + asteroidRadius
        # bounce the asteroid if it hits a wall
        if x1 <= arenaMargin:
            asteroids[i]["angle"] = pi - asteroids[i]["angle"]
        elif x2 >= arenaSize - arenaMargin:
            asteroids[i]["angle"] = pi - asteroids[i]["angle"]
        if y1 <= arenaMargin:
            asteroids[i]["angle"] = -asteroids[i]["angle"]
        elif y2 >= arenaSize - arenaMargin:
            asteroids[i]["angle"] = -asteroids[i]["angle"]
        # move asteroid and refresh screen
        moveAsteroid(asteroids[i])
        arena.delete(asteroids[i]["graphic"])
        colour = getAsteroidColor(asteroids[i])
        asteroids[i]["graphic"] = arena.create_oval(x1, y1, x2, y2, fill=colour, outline="black")
        # remove asteroid if it gets destroyed and create explosion
        if asteroids[i]["lifeBar"] <= 0:
            # sfxExplosion.play()
            newExplosion(asteroids[i]["x"], asteroids[i]["y"])
            arena.delete(asteroids[i]["graphic"])
            asteroids[i] = None
            score += 1000
            arena.itemconfig(scoreText, text=str(score))
    # Remove dead asteroids from lists
    asteroids = [a for a in asteroids if a != None]
    # All asteroids destroyed sequence
    if len(asteroids) == 0 and len(explosions) == 0:
        arena.delete(ship)
        for i in range(len(bullets)):
            arena.delete(bullets[i]["graphic"])
        for i in range(len(asteroids)):
            arena.delete(asteroids[i]["graphic"])
        for i in range(len(explosions)):
            arena.delete(explosions[i]["graphic"])
        bullets, asteroids, explosions = [], [], []
        initialisePlayfield = True
        text1 = arena.create_text(300, 300, text="ARENA CLEARED!", fill="black", font=textFont)
        for i in range(20000):
            window.update()
        arena.delete(text1)
        arena.delete(borders)
        arena.delete(playArea)
        borders = arena.create_rectangle(0, 0, arenaSize, arenaSize + hudHeight, fill="#cccccc", outline="#cccccc")
        playArea = arena.create_rectangle(arenaMargin, arenaMargin,
                                          arenaSize - arenaMargin, arenaSize - arenaMargin,
                                          fill="white", outline="white")
        text1 = arena.create_text(300, 300, text="GET READY FOR THE NEXT WAVE!", fill="black", font=textFont)
        for i in range(20000):
            window.update()
        arena.delete(text1)
        for i in range(5000):
            window.update()
        gameLevel += 1
        score += 500
        arena.itemconfig(scoreText, text=str(score))
    # Ship destroyed sequence
    if shipDestroyed:
        # sfxPlayerDeath.play()
        arena.delete(ship)
        explosions = []         # clear explosions list so explosions[0] is invariably the ship explosion
        newExplosion(shipCenter["x"], shipCenter["y"])
        for i in range(255):
            colour = getExplosionColor(explosions[0])
            explosionSize = getExplosionRadius(explosions[0])
            x1 = shipCenter["x"] - explosionSize
            x2 = shipCenter["x"] + explosionSize
            y1 = shipCenter["y"] - explosionSize
            y2 = shipCenter["y"] + explosionSize
            arena.delete(explosions[0]["graphic"])
            explosions[0]["graphic"] = arena.create_oval(x1, y1, x2, y2, fill=colour, outline=colour)
            explosions[0]["lifeSpan"] -= 1
            window.update()
        lives -= 1
        gameLevel -= 2
        if gameLevel < 0: gameLevel = 0
        shipDestroyed = False
        initialisePlayfield = True
        text1 = arena.create_text(300, 300, text="YOU DIED!", fill="black", font=textFont)
        text2 = arena.create_text(300, 340, text="Lives remaining: " + str(lives), fill="black", font=textFont)
        for i in range(20000):
            window.update()
        arena.delete(text1, text2)
        for i in range(len(bullets)):
            arena.delete(bullets[i]["graphic"])
        for i in range(len(asteroids)):
            arena.delete(asteroids[i]["graphic"])
        for i in range(len(explosions)):
            arena.delete(explosions[i]["graphic"])
        bullets, asteroids, explosions = [], [], []
        arena.delete(borders)
        arena.delete(playArea)
        borders = arena.create_rectangle(0, 0, arenaSize, arenaSize+hudHeight, fill="#cccccc", outline="#cccccc")
        playArea = arena.create_rectangle(arenaMargin, arenaMargin,
                                          arenaSize - arenaMargin, arenaSize - arenaMargin,
                                          fill="white", outline="white")
        if lives > 0:
            text1 = arena.create_text(300, 300, text="GET READY!", fill="black", font=textFont)
            for i in range(20000):
                window.update()
            arena.delete(text1)
        else:
            running = False
        for i in range(5000):
            window.update()

    window.update()

# Game over sequence
arena.create_text(300,300,text="GAME OVER", fill="black", font=textFont)
arena.create_text(300,340,text="Final score: " + str(score), fill="black", font=textFont)

window.mainloop()