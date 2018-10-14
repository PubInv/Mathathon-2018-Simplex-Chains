// Copyright (C) 2018  Robert L. Read <read.robert@gmail.com>

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// Constants

var INTERVAL = 100; // Milliseconds between steps
var MAX_STEPS = 100;
var TWO_PARAMS = { width: 1000, height: 1000 };
var WIDTH = 10.0;
var HEIGHT = 10.0;

// The rand generator is not guaranteed not to self-collide!
var EXAMPLE_GENERATORS = {
    beam: '(n) => { return ((n < 10) ? (((n % 2) == 0) ? "L" : "R" ): "S"); }',
    hex: '(n) => { return ((n < 6) ?  "L" : "S"); }',
    rand: '(n) => { return ((n < 10) ? ((Math.random() < 0.5) ? "L" : "R" ) : "S"); }',
    triangle: '(n) => {  return ((n % 12) == 0) ? "R" : (((n % 2) == 0 ) ? "L" : "R"); }',
    hexagon: '(n) => {  return (n > 41) ? "S" :  ((n % 7) == 0) ? "L" : ((((n + Math.round(n / 7) )% 2) == 0 ) ? "L" : "R"); }',
    trefoil: '(n) => {  return (n > 270) ? "S" :  ((n % 12) == 0) ? "L" : ((((n + Math.round(n / 12) )% 2) == 0 ) ? "L" : "R"); }'
};

// Page Elements

var executeButton = document.getElementById("execute-button");
var funcStatus = document.getElementById("function-status");
var generatorText = document.getElementById("user-defined-generator");
var generatorsSelector = document.getElementById("generators-selector");
var spiralButton = document.getElementById("spiral-button");
var visualSection = document.getElementById('visualsection');

// Global Variables

var two; // The Two canvas for our 2D drawing.

// Main

function main() {

    // Attach our event handlers
    executeButton.addEventListener("click", onExecute);
    generatorsSelector.addEventListener("change", onGeneratorChanged);
    spiralButton.addEventListener("click", onDrawGoldenSpiral);

    // Create a Two canvas and draw a grid on it.
    two = new Two(TWO_PARAMS).appendTo(visualSection);
    drawEmptyGrid();
}

// Event Handlers

function onDrawGoldenSpiral() {
    const phi = (1 + Math.sqrt(5))/2.0;
    const contraction = 2;
    for(var theta = 0; theta < 20; theta += 0.05) {
        r = Math.pow(phi, theta*2/Math.PI)/contraction;
        plotPolar(r, theta);
    }
    two.update();
}

function onExecute() {
    executeButton.disabled = true;
    var generatorFn;
    try {
        generatorFn = eval(generatorText.value);
    } catch(err) {
        funcStatus.innerHTML = "On Compilation:" + err.message;
        return;
    }
    funcStatus.innerHTML = "Function Compiled."

    two.clear();
    drawEmptyGrid();
    setTimeout(step, INTERVAL, 0, 0, 90, generatorFn, 0);
}

function onGeneratorChanged() {
    generatorText.value = EXAMPLE_GENERATORS[generatorsSelector.value] || '';
}

// Called when execution of the generator has completed because
// 1. The generator returned 'S'
// 2. We reached the maximum number of steps.
// 3. The generator threw an exception.
// 4. The generator returned a value other then 'L', 'R', or 'S'.
function onStop() {
    executeButton.disabled = false;
}

// Helper Functions

function color(c) {
    switch(c % 3) {
    case 0: return "#ff0000";
    case 1: return "#00ff00";
    case 2: return "#0000ff";
    default:
    alert("failure");
    }
}

function createGrid(s) {
    var size = s || 30;
    for(var j = -s; j < s; j++) {
        var x0 = -s;
        var y0 = j;
        var x1 = s;
        var y1 = j;
        var p0 = transformToViewport(new THREE.Vector2(x0, y0));
        var p1 = transformToViewport(new THREE.Vector2(x1, y1));
        var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
        a.stroke = '#6dcff6';
    }
    for(var j = -s; j < s; j++) {
        var x0 = j;
        var y0 = s;
        var x1 = j+s;
        var y1 = -s;
        var p0 = transformToViewport(new THREE.Vector2(x0, y0));
        var p1 = transformToViewport(new THREE.Vector2(x1, y1));
        var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
        a.stroke = '#6dcff6';
        var x1 = j+-s;
        var p1 = transformToViewport(new THREE.Vector2(x1, y1));
        var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
        a.stroke = '#6dcff6';
    }
}

function createTriangleGrid(s) {
    var size = s || 30;
    for(var i = -s; i < s; i++) {
        for(var j = -s; j < s; j++) {
            renderSpot(i + (((j % 2) == 0) ? 0.0 : 0.5 ), j, 'blue',1);
        }
    }
}

function drawEmptyGrid() {
    createGrid(TWO_PARAMS.width / (2 * 10.0));
//    createTriangleGrid(30);
    renderSpot(0.0, 0.0, 'red',2);
    two.update();
}

function plotPolar(r, theta) {
    var y = r*Math.sin(theta);
    var x = r*Math.cos(theta);
    renderSpot(x, y, "black",1);
}

function renderSpot(x, y, color,w) {
    var pnt = transformToViewport(new THREE.Vector2(x, y));
    var circle = two.makeCircle(pnt[0], pnt[1], 3);
    circle.fill = color;
    circle.stroke = color; // Accepts all valid css color
    circle.linewidth = w;
}

function renderTriangle(x, y, c) {
    var v = verticesOfTriangle(x, y);
    var vpa = transformToViewport(new THREE.Vector2(v[0], v[1]));
    var vpb = transformToViewport(new THREE.Vector2(v[2], v[3]));
    var vpc = transformToViewport(new THREE.Vector2(v[4], v[5]));
    var path = two.makePath(vpa[0], vpa[1], vpb[0], vpb[1], vpc[0], vpc[1], false);
    path.linewidth = 2;
    path.stroke = "#000000";
    path.fill = color(c);
    two.add(path);
    two.update();
}

function step(tx, ty, dir, f, n) {

    // Call the generator function, which returns a direction, 'L' for left or 'R' for right,
    // or 'S' for stop.
    // If we have reached the maximum number of steps, then assume 'S'.
    var action;
    try {
        action = f(n);
    } catch(err) {
        funcStatus.innerHTML = "On Evaluation:" + err.message;
        action = 'S';
    }

    if (action == 'L' || action == 'R') {

        // Update our direction of travel.
        // Left is a counter-clockwise turn of 60 degrees.
        // Right is a clockwise turn of 60 degrees.
        if (action == 'L') { dir = (dir + 60)%360 }
        else { dir = (dir + 300)%360; }

        // Update the triangle (tx, ty) coordinates based on our new direction
        switch(dir) {
        case 30:
        case 330:
            tx++; break;
        case 90:
            ty++; break;
        case 150:
        case 210:
            tx--; break;
        case 270:
            ty--; break;
        }

        // Draw the triangle at the new (tx, ty) coordinates.
        renderTriangle(tx, ty, n);

        if (n+1<MAX_STEPS) {
            setTimeout(step, INTERVAL, tx, ty, dir, f, n+1);
        } else {
            onStop();
        }

    } else {
        if (action != 'S') {
            funcStatus.innerHTML = "Unexpected generator return value: " + action.toString();
        }
        onStop();
    }
}

// Not currently used:
// function transformFromViewport(x, y) {
//     // now move to origin...
//     x = x - (TWO_PARAMS.width)/2;
//     y = y - (TWO_PARAMS.height)/2;
//     // then unscale..
//     x = x / (TWO_PARAMS.width / (2*WIDTH));
//     y = - y / (TWO_PARAMS.height / (2*HEIGHT));
//     return [x, y];
// }

// Input is a THREE.Vector2, output an [x, y] array...
function transformToViewport(pnt) {
    // Let's assume our play space is from -10 to + 10, centered on the origin...
    var x = pnt.x;
    var y = pnt.y;
    // first scale appropriately
    x = x * (TWO_PARAMS.width / (2 * WIDTH));
    y = y * (TWO_PARAMS.height / (2 * HEIGHT));
    // now move to origin....
    x += TWO_PARAMS.width/2;
    y = (-y) + TWO_PARAMS.height/2;
    // These adjust our weird grid background to the origin...
    //    y = y + params.height / (2 *(2 * h));
    //    x = x + params.width / (2 * (2 * w)) ;
    return [x, y];
}

// compute the 3 vertices (in cartesian cooreds) of Triangle x, y
function verticesOfTriangle(x, y) {
    // first let us decide if the triangle is upwardpointing..
    // a is the apex, b is East, c is West.
    var ax;
    var ay;
    var bx, by;
    var cx, cy;
    if (((x+y) % 2) == 0) {
        // this is up
        ax = x/2.0;
        ay = y;
        bx = ax - 0.5;
        by = y - 1.0;
        cx = ax + 0.5;
        cy = y - 1.0;
    } else {
        // this is down
        ax = (x/2.0);
        ay = y - 1.0;
        bx = ax + 0.5;
        by = y;
        cx = ax - 0.5;
        cy = y;
    }
    return [ax, ay, bx, by, cx, cy];
}

main();
