Karen Li, UID: 204563235
CS 174A Assignment #1
========================

Included Files
==============
MV.js -- functions to manipulate matrices

README.md -- documentation for project

cube.html -- html file containing shaders 

cube.js -- code to draw cubes and implement all features

initShaders.js --  function to initialize shaders

webgl-utils.js -- functions needed by WebGL

MV.js, initShaders.js, and webgl-utils.js were supplied by Edward Angel's "Interactive Computer Graphics" textbook.

Additional Information
======================

I completed all of the requirements as well as all of the extra credit tasks. For extra credit #1, in order to instance each of the eight cubes from the same geometry data, I use the same vertex array for each cube and then translated each to the correct positions before drawing them. For extra credit #2, I used fourteen vertices to implement the cube as a single triangle strip. For extra credit #3, I implemented a rotation matrix using quarternions. For extra credit #4, I rotated and scaled each cube individually so they grew and shrank in size continuously while rotating in a synchronized fashion.

To run my program, include all of the files in this repository in a single folder, and open "cube.html" in a browser. My program works correctly in Google Chrome; it has not been tested in other browsers. 

Please grade tagged version v1.9. 

Requirements
============
 
1. Implement the assignment in a clean and understandable manner. Your code must be readily understandable for grading including extensive comments. A README.md that explains what you did (i.e. extra credit) and anything the grader needs to know to run your assignment – 5 points.
 
2. Set up a WebGL capable HTML canvas able to display without error. Its size should be at least 960x540 and should have the z-buffer enabled and cleared to a black background. Implement necessary shader codes without error – 5 points.

3. Display eight (8) unit cubes using a symmetric perspective projection. Each of the eight cubes should be centered at (+/- 10, +/- 10, +/- 10) from the origin. Each of the eight cubes should be drawn with a different color. You can use any colors except black or white. All eight cubes should be visible from an initial camera position along the Z axis - 20 points.

4. Draw each cube’s outline (the edges) in white so the faces are apparent (needed because there is no lighting in this assignment) - 15 points.

5. The ‘c’ key should cycle the colors between the cubes - 5 points.

6. The cubes should display in a square aspect ratio (they should not be stretched or squeezed when displayed) – 5 points.
 
7. Implement a simple camera navigation system using the keyboard. Up and down arrow keys should control the position of the camera along the Y axis (+Y is up and -Y is down by default in WebGL). Each key press should adjust position by 0.25 units. - 5 points.

8. The left and right arrow keys control the heading (azimuth, like twisting your neck to say 'no') of the camera. Each key press should rotate the heading by four (4) degrees - 10 points.

9. The letters i, j, k and m control forward, left, right and backward, respectively, relative to the camera's current heading. Each key press should adjust position by 0.25 units. The ‘r’ key should reset the view to the start position (recall, the start position is defined only in that all cubes are visible and the eye be positioned along the Z axis) – 20 points.

10. The ‘n’ and ‘w’ keys should adjust the horizontal field of view (FOV) narrower or wider. One (1) degree per key press. Keep the display of your scene square as the FOV changes - 5 points.

11. The ‘+’ key should toggle the display of an orthographic projection of a cross hair centered over your scene. The cross hairs themselves can be a simple set of lines rendered in white – 5 points.

Extra Credit
============

1. Instance each of the eight cubes from the same geometry data - 5 points.

2. Implement the cube geometry as a single triangle strip primitive – 5 points.

3. Implement your navigation system rotations using quaternions - 5 points.

4. Smoothly, continuously and individually rotate and scale each of the cubes while the application is running. The rotation of each cube can be around any axis you choose. The rotation speed should be constant and should be 20 rpm and the scale should vary by no more than twenty percent (20%) for their original size (scale can be either smaller, larger or both, you decide). The cubes shall remain centered around their initial positions – 15 points.
