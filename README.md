# asteroids
Asteroids-type game originally coded in Python. Later ported to JavaScript, making it playable in a web browser

I first wrote this game in Python, using the standard TKinter graphics library. It was one of many small projects I undertook while teaching myself Python. The code is 100% my own, having figured out how a game-loop would work simply by thinking it through in my head. Also, no AI was used to assist me in writing it.

The first iteration of this project used Python's object-oriented fuctionalities. However, the overall performance was quite poor. I gained a significant increase in performance by using dictionaries instead of objects, and making the class methods standard functions. As such, the code is now completely procedural, and runs a whole lot better than it did before. 

Later, in order to gain a better grasp of JavaScript, I ported the code to JavaScript with the relevant HTML and CSS files required to get it running in a webbrowser. This version can be run simply by double-clicking the index.html file.

The controls of both versions are as follows:

W: move ship forwards
S: move ship backwards
A: move ship left
D: move ship right
Left arrow: turn ship left
Right arrow: turn ship right
Up arrow: fire gun
