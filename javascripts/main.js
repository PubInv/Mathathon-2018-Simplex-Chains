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

var INTERVAL = 25; // Milliseconds between steps
var MAX_STEPS = 300;
var TWO_PARAMS = { width: 1000, height: 1000 };
var WIDTH = 10.0;
var HEIGHT = 10.0;

// The rand generator is not guaranteed not to self-collide!
var EXAMPLE_GENERATORS = {
    beam: {
        name: "Beam",
        src: '(n) => { return ((n < 12) ? (((n % 2) == 0) ? "L" : "R" ): "S"); }'
    },
    hex: {
        name: "Small Hexagon",
        src: '(n) => { return ((n < 5) ?  "L" : "S"); }'
    },
    rand: {
        name: "Random Walk",
        src: '(n) => { return ((n < 10) ? ((Math.random() < 0.5) ? "L" : "R" ) : "S"); }'
    },
    triangle: {
        name: "Triangle",
        src: '(n) => {   return (n > 34) ? "S" :  ((n % 12) == 0) ? "R" : (((n % 2) == 0 ) ? "L" : "R"); }'
    },
    hexagon: {
        name: "Large Hexagon",
        src: '(n) => {  return (n > 40) ? "S" :  ((n % 7) == 0) ? "L" : ((((n + Math.round(n / 7) )% 2) == 0 ) ? "L" : "R"); }'
    },
    trefoil: {
        name: "Trefoil",
        src: '(n) => {  return (n > 70) ? "S" :  ((n % 12) == 0) ? "L" : ((((n + Math.round(n / 12) )% 2) == 0 ) ? "L" : "R"); }'
    }
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

    // Fill the example selector
    for (var key in EXAMPLE_GENERATORS) {
        if (EXAMPLE_GENERATORS.hasOwnProperty(key)) {
            var entry = EXAMPLE_GENERATORS[key];
            generatorsSelector.options[generatorsSelector.options.length] = new Option(entry.name, key);
        }
    }

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
    generatorFn = compileGenerator(generatorText.value);
    if (!generatorFn) {
        executeButton.disabled = false;
        return;
    }

    two.clear();
    drawEmptyGrid();
    // To this list we will push the triangles that are part of the history.
    var acc = [];
    acc.push([0,0]);
    // Note: Currently we consider [0,0] a part of every chain.
    renderTriangle(0, 0, color(0));    
    setTimeout(step, INTERVAL, 0, 0, 90, generatorFn, 0, acc);
}

function onGeneratorChanged() {
    funcStatus.innerHTML = '';
    generatorText.value = EXAMPLE_GENERATORS[generatorsSelector.value].src || '';
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

// Returns the compiled function, or undefined if the function cannot be compiled.
// As a side effect, this will put an error message in funcStatus.
function compileGenerator(src) {
    var fn;
    try { fn = eval(src); }
    catch(err) {
        funcStatus.innerHTML = err.message;
        return undefined;
    }
    var fnType = typeof fn;
    if (fnType != 'function') {
        funcStatus.innerHTML = "Generator needs to be a function, not " + fnType;
        return undefined;
    }
    funcStatus.innerHTML = "";
    return fn;
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
    path.fill = c;
    two.add(path);
    two.update();
}

// tx - x coordinate of current triangle
// ty - y coordinate of current triangle
// dir -direction current triangle enterred from
// f  - generator function
// n - nth turn
// acc -- accumulated set of triangles as part of the system.
function step(tx, ty, dir, f, n, acc) {
    function acc_contains(acc,x,y) {
        return acc.filter( tri => (tri[0] == x) && (tri[1] == y)).length > 0;
    }

    // Call the generator function, which returns a direction, 'L' for left or 'R' for right,
    // or 'S' for stop.
    // If we have reached the maximum number of steps, then assume 'S'.
    var action;
    try {
        action = f(n);
    } catch(err) {
        funcStatus.innerHTML = "Step " + n + ": " + err.message;
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
        // If tx,ty has occurred in the accumulator, render as black.

        if (acc_contains(acc,tx,ty)) {
            renderTriangle(tx, ty, "#000000");                    
        } else {
            renderTriangle(tx, ty, color(n));
            acc.push([tx,ty]);            
        }


        if (n+1<MAX_STEPS) {
            setTimeout(step, INTERVAL, tx, ty, dir, f, n+1, acc);
        } else {
            onStop();
        }

    } else {
        if (action != 'S') {
            funcStatus.innerHTML = "Step " + n + ": Unexpected return value " + JSON.stringify(action);
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
