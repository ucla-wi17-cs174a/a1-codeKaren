"use strict";

// SET UP WEBGL AND HTML CANVAS
var canvas;
var gl;

// INITIALIZE ARRAYS FOR POINTS, COLOURS, AND CROSSHAIRS
var points = [];
var NumVertices = 14;  // need 14 vertices to draw cube since using triangle strip

var outlinePoints = [];
var NumOutlinePoints = 24; 

var vertices = [
    vec4( -0.5, -0.5, +0.5, 1.0 ),   // manually plan out the cube
    vec4( -0.5, +0.5, +0.5, 1.0 ),
    vec4( +0.5, +0.5, +0.5, 1.0 ),
    vec4( +0.5, -0.5, +0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5, +0.5, -0.5, 1.0 ),
    vec4( +0.5, +0.5, -0.5, 1.0 ),
    vec4( +0.5, -0.5, -0.5, 1.0 )
];

var colors = [
    [ 1.0, 0.0, 0.0, 1.0 ],  // red
    [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
    [ 0.0, 1.0, 0.0, 1.0 ],  // green
    [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
    [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
    [ 0.0, 0.5, 0.5, 1.0 ],  // turquoise
    [ 0.9, 0.4, 0.5, 1.0 ],  // pink
    [ 1.0, 1.0, 1.0, 1.0 ]  // white
];

var colourIndexOffset = 0;  // indicates which colours to assign to which cubes

var crosshairs = [
    [ 1.0, 0, 0, 1.0 ],
    [ -1.0, 0, 0, 1.0 ],
    [ 0, 1.0, 0, 1.0 ],
    [ 0, -1.0, 0, 1.0 ]
];

// DECLARE VARIABLES FOR UNIFORM LOCATIONS
var modelTransformMatrixLoc;
var cameraTransformMatrixLoc;
var perspectiveMatrixLoc;
var currentColourLoc;

// INITIALIZE ALL TRANSFORMATION MATRICES TO IDENTITY MATRIX
var modelTransformMatrix = mat4();  // identity matrix
var perspectiveMatrix = mat4();
var cameraTransformMatrix = mat4();
var resetCameraTransformMatrix = mat4();  // use to reset camera transforms
var resetPerspectiveMatrix = mat4();  // use to reset perspective projection matrix
var tempModelTransform = mat4();  // use to generate transformations and rotations for each cube

// SET UP BUFFER AND ATTRIBUTES
var vPosition;
var vBuffer;
var vCrossHairBuffer;
var vOutlineBuffer;

// INITIALIZE MISCELLANEOUS VARIABLES 
var currentFOV = 50;   // adjust this later for narrow or width FOV
var displayCrossHair = 0;  // Boolean to determine whether or not to display crosshair on screen
var currDegrees = 0;  // indicate current degree for the azimuth of the camera heading

// INITIALIZE VARIABLES NEEDED TO ROTATE AND SCALE CUBES CONTINUOUSLY
var rotationStep = 20/60 * 360; // need to do 20 rpm, and 360 degrees per rotation = 120 degrees per second
var currRotation = 0.0;  // current rotation of the cubes around the y-axis
var prevTime = 0;   // use to calculate time difference between calls to render so can rotate cubes
var currScale = 1;  // determine whether or not to scale larger or smaller at a given iteration
var isGrowingCube = 1;  // determine whether or not to scale larger or smaller at a given iteration

window.onload = function init()   // this is like int main() in C
{
    // SET UP WEBGL 
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );  
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height); 
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    // LOAD SHADERS AND INITIALIZE ATTRIBUTE BUFFERS
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );  // compile and link shaders, then return a pointer to the program
    gl.useProgram( program ); 

    // BUFFER AND ATTRIBUTE FOR THE CUBE POINTS
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );  
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );  // tell attribute how to get data out of buffer and binds current buffer to the attribute; vPosition will always be bound to vBuffer now
    gl.enableVertexAttribArray( vPosition );

    // BUFFER AND ATTRIBUTE FOR THE CROSSHAIRS
    vCrossHairBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vCrossHairBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(crosshairs), gl.DYNAMIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" ); 
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );  
    gl.enableVertexAttribArray( vPosition );

    // BUFFER AND ATTRIBUTES FOR THE CUBE OUTLINE POINTS
    vOutlineBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vOutlineBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(outlinePoints), gl.DYNAMIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" ); 
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );  
    gl.enableVertexAttribArray( vPosition );

    // SET VALUES FOR UNIFORMS FOR SHADERS
    modelTransformMatrixLoc = gl.getUniformLocation(program, "modelTransformMatrix"); 
    cameraTransformMatrixLoc = gl.getUniformLocation(program, "cameraTransformMatrix"); 
    perspectiveMatrixLoc = gl.getUniformLocation(program, "perspectiveMatrix");
    currentColourLoc = gl.getUniformLocation(program, "currentColour");

    // INITIALIZE THE TRANSFORMATION MATRICES    
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(modelTransformMatrix)); 

    // apply camera transformations
    // want to move camera in the +z direction since you are looking down the -z axis
    // in reality, since we are taking the inverse matrix, we are moving all the objects in the -z direction
    cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0, 0, 50)));
    gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));

    resetCameraTransformMatrix = cameraTransformMatrix;  // save the original value so we can reset the camera transform later

    // apply symmetric perspective projection
    perspectiveMatrix = perspective(currentFOV, 1, 1, 100);
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
    resetPerspectiveMatrix = perspectiveMatrix;  // save the original value of the perspective matrix so we can reset it later for the cross hairs

    // ADD EVENT LISTENERS
    // for ASCII character keys
    addEventListener("keypress", function(event) {
        switch (event.keyCode) {
            case 99:  // ’c’ key
                console.log("c key");
                ++colourIndexOffset;
                if (colourIndexOffset == 8) {
                    colourIndexOffset = 0;
                }
                break;
            case 105:  // 'i' key
                console.log("i key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0.25*Math.sin(radians(currDegrees)), 0, -0.25*Math.cos(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 106:  // 'j' key
                console.log("j key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(-0.25*Math.cos(radians(currDegrees)), 0, -0.25*Math.sin(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 107:  // 'k' key
                console.log("k key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0.25*Math.cos(radians(currDegrees)), 0, 0.25*Math.sin(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 109:  // 'm' key
                console.log("m key");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(-0.25*Math.sin(radians(currDegrees)), 0, 0.25*Math.cos(radians(currDegrees)))));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            case 114:  // 'r' key
                console.log("r key");
                cameraTransformMatrix = resetCameraTransformMatrix;
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                perspectiveMatrix = resetPerspectiveMatrix;
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                currentFOV = 50;
                currDegrees = 0;
                break;
            case 110:  // 'n' key 
                console.log("n key");
                // change the FOV of the projection but keep the correct heading
                perspectiveMatrix = mult(perspective(--currentFOV, 1, 1, 100), quarternionRotate(-1*currDegrees, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            case 119:  // 'w' key
                console.log("w key");
                perspectiveMatrix = mult(perspective(++currentFOV, 1, 1, 100), quarternionRotate(-1*currDegrees, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break; 
            case 43:  // '+' key
            case 61:  // '=' key is the same as '+' on the keyboard
                console.log("+ key");
                // toggle the value of displayCrossHair
                if (displayCrossHair == 0) {
                    displayCrossHair = 1;
                }
                else {
                    displayCrossHair = 0;
                }
                break;
        }
    });

    // for UP, DOWN, LEFT, RIGHT keys (no ASCII code since they are physical keys)
    addEventListener("keydown", function(event) {
        switch(event.keyCode) {
            // rotate the heading/azimuth left by 4 degrees
            case 37:  // LEFT key 
                // currDegrees has opposite sign of rotation degree because we are facing in opposite direction to rotation
                currDegrees -= 4;
                console.log("LEFT");
                perspectiveMatrix = mult(perspectiveMatrix, quarternionRotate(4, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            // move position of the Y-axis up by 0.25 units
            case 38:  // UP key
                console.log("UP");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0, 0.25, 0)));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
            // rotate the heading/azimuth right by 4 degrees
            case 39:  // RIGHT key
                currDegrees += 4;
                console.log("RIGHT");
                perspectiveMatrix = mult(perspectiveMatrix, quarternionRotate(-4, vec3(0, 1, 0)));
                gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
                break;
            // move position of the Y-axis down by 0.25 units
            case 40:  // DOWN key
                console.log("DOWN");
                cameraTransformMatrix = mult(cameraTransformMatrix, inverse(translate(0, -0.25, 0)));
                gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
                break;
        }
    });

    // populate the points array 
    generateCube();

    // populate the outline points array
    generateCubeOutline();

    // start drawing cubes and repeatedly call this function
    render(0);
}

// generate vertices for the cube points using triangle strip (14 points total)
function generateCube() {
    var vertexTriangleStripOrder = [6, 5, 2, 1, 0, 5, 4, 6, 7, 2, 3, 0, 7, 4];
    var length = vertexTriangleStripOrder.length;
    for (var i = 0; i < length; ++i) {
        points.push(vertices[vertexTriangleStripOrder[i]]);
    }
}

// generate vertices for the cube outline
function generateCubeOutline() {
    // generate lines for front face of the cube
    outlinePoints.push(vertices[0]);
    for (var i = 1; i < 4; i++) {
        outlinePoints.push(vertices[i]);
        outlinePoints.push(vertices[i]);
    }
    outlinePoints.push(vertices[0]);
    // generate lines for the back face of the cube
    outlinePoints.push(vertices[4]);
    for (var j = 5; j < 8; j++) {
        outlinePoints.push(vertices[j]);
        outlinePoints.push(vertices[j]);
    }
    outlinePoints.push(vertices[4]);
    // generate four lines to connect the top face to the bottom face
    for (var k = 0; k < 4; k++) {
        outlinePoints.push(vertices[k]);
        outlinePoints.push(vertices[k+4]);
    }
}

function drawCrossHairs() {
    // reset the transform matrices in the uniforms so that the crosshair doesn't move
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(modelTransformMatrix));
    gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(resetCameraTransformMatrix));
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(resetPerspectiveMatrix));
    // bind the correct buffer for draw arrays
    gl.bindBuffer( gl.ARRAY_BUFFER, vCrossHairBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(crosshairs), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vPosition);
    // make crosshairs white
    gl.uniform4fv(currentColourLoc, colors[8]); 
    gl.drawArrays( gl.LINES, 0, 4 );
    // set the camera and perspective matrix back to what they were so we draw the cubes correctly
    gl.uniformMatrix4fv(cameraTransformMatrixLoc, false, flatten(cameraTransformMatrix));
    gl.uniformMatrix4fv(perspectiveMatrixLoc, false, flatten(perspectiveMatrix));
}

function drawCube() {
    // bind the current buffer that we want to draw (the one with the points)
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );  // tell attribute how to get data out of buffer and binds current buffer to the attribute; vPosition will always be bound to vBuffer now
    gl.enableVertexAttribArray( vPosition );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, NumVertices );  // draw cube using triangle strip
}

function drawOutline() {
    // bind the current buffer that we want to draw (the one with the points)
    gl.bindBuffer( gl.ARRAY_BUFFER, vOutlineBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(outlinePoints), gl.DYNAMIC_DRAW );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );  // tell attribute how to get data out of buffer and binds current buffer to the attribute; vPosition will always be bound to vBuffer now
    gl.enableVertexAttribArray( vPosition );
    gl.uniform4fv(currentColourLoc, colors[8]);  // make the outline white 
    gl.drawArrays( gl.LINES, 0, NumOutlinePoints );
}

function scaleAndRotateCube() {
    if (isGrowingCube == 1) {
        // scale the cubes larger
        currScale += 0.001;
        tempModelTransform = mult(tempModelTransform, scalem(currScale, currScale, currScale));
        // if the cubes become too big
        if (currScale >= 1.2) {
            isGrowingCube = 0;
        }
    }
    else {
        // scale the cubes smaller
        currScale -= 0.001;
        tempModelTransform = mult(tempModelTransform, scalem(currScale, currScale, currScale));
        // if the cubes become too small
        if (currScale <= 1) {
            isGrowingCube = 1;
        }
    }
    // rotate and scale the cube continuously
    tempModelTransform = mult(tempModelTransform, quarternionRotate(currRotation, vec3(0, 1, 0)));
}

function quarternionRotate(angle, axis) {
    // ignore the 4th element of the axis vector when normalizing
    var unitRotationAxis = normalize(vec4(axis[0], axis[1], axis[2], 1.0), 1);
    var angleRad = radians(angle);

    // compute w, x, y, z for the quarternion
    var w = Math.cos(angleRad/2);
    var x = Math.sin(angleRad/2) * unitRotationAxis[0];
    var y = Math.sin(angleRad/2) * unitRotationAxis[1];
    var z = Math.sin(angleRad/2) * unitRotationAxis[2];

    // compute the result for the rotation by quarternions
    var result = mat4(
        vec4( 1 - 2*(Math.pow(y, 2) + Math.pow(z, 2)), 2*(x*y - w*z), 2*(x*z + w*y), 0.0 ),
        vec4( 2*(x*y + w*z), 1 - 2*(Math.pow(x,2) + Math.pow(z, 2)), 2*(y*z - w*x), 0.0 ),
        vec4( 2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(Math.pow(x,2) + Math.pow(y,2)),   0.0 ),
        vec4( 0.0, 0.0, 0.0, 1.0 )
    );
    // must return inverse so that rotation goes in the correct direction
    return inverse(result);
}

function render(timeStamp) 
{
    // clear colour buffer and depth buffer
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // rotate the cubes by a constant speed
    // first, get the time difference since the last call to render
    var timeDiff = (timeStamp - prevTime)/1000;  // must divide by 1000 since measured in milliseconds
    currRotation = (currRotation + (timeDiff * rotationStep)) % 360;
    prevTime = timeStamp;  // set the previous time for the next iteration equal to the current time

    // cube #1
    // order of transformations: rotate, scale, then translate (since you read from to top to get matrix transformation order)
    tempModelTransform = mult(modelTransformMatrix, translate(10, 10, 10));
    scaleAndRotateCube();
    // apply the correct matrix transformation to the points for each cube, then draw cube and outline 
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform));
    // draw the outline
    drawOutline();
    // change the colour for the cube
    gl.uniform4fv(currentColourLoc, colors[colourIndexOffset % 8]); 
    // draw the cube 
    drawCube();

    // cube #2
    tempModelTransform = mult(modelTransformMatrix, translate(10, 10, -10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 1) % 8]);
    drawCube();

    // cube #3
    tempModelTransform = mult(modelTransformMatrix, translate(10, -10, 10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 2) % 8]);
    drawCube();

    // cube #4
    tempModelTransform = mult(modelTransformMatrix, translate(10, -10, -10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 3) % 8]);
    drawCube();

    // cube #5
    tempModelTransform = mult(modelTransformMatrix, translate(-10, 10, 10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 4) % 8]); 
    drawCube();

    // cube #6
    tempModelTransform = mult(modelTransformMatrix, translate(-10, 10, -10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 5) % 8]);
    drawCube();

    // cube #7
    tempModelTransform = mult(modelTransformMatrix, translate(-10, -10, 10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 6) % 8]);
    drawCube();

    // cube #8
    tempModelTransform = mult(modelTransformMatrix, translate(-10, -10, -10));
    scaleAndRotateCube();
    gl.uniformMatrix4fv(modelTransformMatrixLoc, false, flatten(tempModelTransform)); 
    drawOutline();
    gl.uniform4fv(currentColourLoc, colors[(colourIndexOffset + 7) % 8]);
    drawCube();

    // draw the crosshairs using two line objects
    if (displayCrossHair == 1) {
        drawCrossHairs();
    }

    // render again (repeatedly as long as program is running)
    requestAnimationFrame( render );
}