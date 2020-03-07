# Pipes: CS420X Final Project

A recreation of the classic [Windows XP "Pipes" Screensaver](https://www.youtube.com/watch?v=MKqrLGFoK9E)

[Video Demo](https://www.youtube.com/watch?v=cqNNFK9VpVA)

[Demo](https://ollien.github.io/pipes-simulation/)

If you get poor performance with the demo, shrink your window and/or lower the quality. The raymarching technique used by the shader can be quite expensive, especially with a large number of pipes. I have also seen unexplainable performance dips in Firefox on Windows.

![Image of the simulation](https://raw.githubusercontent.com/ollien/pipes-simulation/master/screenshot.png?token=AAHOR72HUL2ASVX3ZGU4HX26NQYRY)

## Installation

To run the development server, run.
```
npm install
npm start
```
If you just wish to build the static files and host this on your own webserver, you can run
```
npm run-script build
```
