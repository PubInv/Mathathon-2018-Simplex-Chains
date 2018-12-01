// Copyright (C) 2018 by
//   Robert L. Read <read.robert@gmail.com>
//   David Jeschke <djeschke@gmail.com>

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
// var MAX_STEPS = 300;
var TWO_PARAMS = { width: 1000, height: 1000 };
var TRIANGLE_HEIGHT = Math.sqrt(3)/2;

var GRID_CONFIGS = { "S": { name: "S", w: 10.0, h: 10.0},
                     "M": { name: "M", w: 20.0, h: 20.0},
                     "L": { name: "L", w: 40.0, h: 40.0},
                     "XL": { name: "XL", w: 80.0, h: 80.0}}
var initial_grid = "small";

var WIDTH = 10.0;
var HEIGHT = 10.0;

var RED = "#ff0000";
var ORANGE = "#ff7f00";
var YELLOW = "#ffff00";
var GREEN = "#00ff00";
var BLUE = "#0000ff";
var VIOLET = "#8b00ff";

var RGB_COLORS = [RED, GREEN, BLUE];
var RAINBOW_COLORS = [RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET];

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
    },
    tile: {
        name: "Tile",
        src: '(n) => { if (n > Math.pow(8,2)*6-2) return "S"; var k = n + 1; var h = Math.floor(Math.sqrt(k/6)); var j = k - h * h * 6; if (j == 0) return "R"; else if (j == 1) return "L"; return (j % (2 * h + 1) % 2 == 0) ? "L" : "R"; }'
    }
};

// Page Elements

var executeButton = document.getElementById("execute-button");
var funcStatus = document.getElementById("function-status");
var generatorText = document.getElementById("user-defined-generator");
var spiralButton = document.getElementById("spiral-button");
var gridSizeButtons = document.getElementById("gridsize-buttons");
var startDir = document.getElementById("start-dir");
var SDoptions = [
    document.getElementById("start-dir-n"),
    document.getElementById("start-dir-ne"),        
    document.getElementById("start-dir-se"),
    document.getElementById("start-dir-s"),        
    document.getElementById("start-dir-sw"),
    document.getElementById("start-dir-nw")        
    ]
var startX = document.getElementById("start-x");
var startY = document.getElementById("start-y");
var visualSection = document.getElementById('visualsection');

// Global Variables

var two; // The Two canvas for our 2D drawing.

var DIRECTION = 90;
var COLOR_SCHEME = 'RGB'; // Color triangles alternately red, green, blue.
                          // Alternately 'RRLG', "right red, left green"

// Main

function main() {

    // Attach our event handlers
    executeButton.addEventListener("click", onExecute);
    spiralButton.addEventListener("click", onDrawGoldenSpiral);
    startX.addEventListener("input", onStartXChange);
    startY.addEventListener("input", onStartYChange);

    // Create a Two canvas and draw a grid on it.
    var w = document.getElementById('visualsection').offsetWidth;
    TWO_PARAMS.width = w;
    TWO_PARAMS.height = w;

    // We need to read window width to create this....
    two = new Two(TWO_PARAMS).appendTo(visualSection);
    drawEmptyGrid();
    renderStartTri();
    var value = null;
    $("#generator-buttons .btn-group > button.btn").on("click", function(){
        value = this.innerHTML;
        generatorText.value = Object.values(EXAMPLE_GENERATORS).find(el => (el.name == value)).src;
    });

    $("#gridsize-buttons .btn-group > button.btn").on("click", onGridSizeChanged);

    $("#colorscheme-buttons .btn-group > button.btn").on("click", function(){
        COLOR_SCHEME = this.innerHTML;
    });

    $("#direction-buttons .btn-group > button.btn").on("click", function(){
        value = this.innerHTML;
        switch(value) {
        case "N":
            DIRECTION = 90;
            break;
        case "NE":
            DIRECTION = 30;
            break;            
        case "SE":
            DIRECTION = 330;
            break;            
        case "S":
            DIRECTION = 270;
            break;            
        case "SW":
            DIRECTION = 210;
            break;            
        case "NW":
            DIRECTION = 150;
            break;            
        };
    });

    $('#selector button').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
        // TODO: insert whatever you want to do with $(this) here
        console.log(this);
    });
    
}

// Event Handlers
function onResizeBody() {
    var vs= document.getElementById('visualsection'); 
    var w = vs.offsetWidth;
    vs.removeChild(vs.childNodes[0]);
    TWO_PARAMS.width = w;
    TWO_PARAMS.height = w;

    // We need to read window width to create this....
    two = new Two(TWO_PARAMS).appendTo(visualSection);
    drawEmptyGrid();
    renderStartTri();
 }

function onGridSizeChanged(e) {
    var v = e.originalEvent.target.innerText;
    var gsize = GRID_CONFIGS[v || 'S'];
    WIDTH = gsize.w;
    HEIGHT = gsize.h;
    drawEmptyGrid();
    renderStartTri();
}
// Need to make sure DIRECTION is valid....
function ensure_valid_direction() {
    var c = getStartingCoordinates();
    var up = triangleIsUp(c.x, c.y);
    if (up && ((DIRECTION == 30) || (DIRECTION == 270) || (DIRECTION == 150))) {
        DIRECTION = ((DIRECTION + 120) % 360);
    }
    if (!up && ((DIRECTION == 90) || (DIRECTION == 330) || (DIRECTION == 210))) {
        DIRECTION = ((DIRECTION + 60) % 360);
    }
}
function onStartXChange(x) {
    ensure_valid_direction();
    renderStartTri();
}

function onStartYChange(y) {
    ensure_valid_direction();    
    renderStartTri();
}

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
    gridSizeButtons.disabled = true;
    generatorFn = compileGenerator(generatorText.value);
    if (!generatorFn) {
        executeButton.disabled = false;
//        gridSizeSelector.disabled = false;        
        return;
    }

    two.clear();
    drawEmptyGrid();

    var c = getStartingCoordinates();

    console.log(`Starting at (${c.x},${c.y}) dir ${c.d}`);

    var acc = []; // List of occupied triangles.
    acc.push([c.x,c.y]); // initial position is a part of every chain.
    renderTriangle(c.x, c.y, BLUE);

    setTimeout(step, INTERVAL, c.x, c.y, c.d, generatorFn, 0, acc);
}

function onGeneratorChanged() {
    alert("changed");
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

function accContains(acc, x, y) {
    return acc.filter( tri => (tri[0] == x) && (tri[1] == y)).length > 0;
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
    // Draw the horizontals
    for(var j = -s; j < s; j++) {
        var x0 = -s;
        var y0 = j*TRIANGLE_HEIGHT;
        var x1 = s;
        var y1 = j*TRIANGLE_HEIGHT;
        var p0 = transformToViewport(new THREE.Vector2(x0, y0));
        var p1 = transformToViewport(new THREE.Vector2(x1, y1));
        var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
        a.stroke = '#6dcff6';
    }

    // draw the slants
    for(var j = -s; j < s; j++) {
        var x0 = j;
        var y0 = s * TRIANGLE_HEIGHT;
        var x1 = j+s;
        var y1 = -s * TRIANGLE_HEIGHT;
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
    //    createGrid(TWO_PARAMS.width / (2 * WIDTH));
    createGrid(4*WIDTH);
//    createTriangleGrid(30);
    renderSpot(0.0, 0.0, 'red',2);
    two.update();
}

function getCoordinateFromInput(inputBox) {
    var c = parseInt(inputBox.value);
    return !isNaN(c) ? c : 0;
}

function getStartingCoordinates() {
    return {
        x: getCoordinateFromInput(startX),
        y: getCoordinateFromInput(startY),
        d: DIRECTION
    };
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

function renderStartTri() {
    two.clear();
    drawEmptyGrid();

    var c = getStartingCoordinates();

    var up = triangleIsUp(c.x, c.y);
    console.log(up,DIRECTION);
    
//    var options = startDir.options;
    SDoptions[0].disabled = !up;
    SDoptions[1].disabled = up;
    SDoptions[2].disabled = !up;
    SDoptions[3].disabled = up;
    SDoptions[4].disabled = !up;
    SDoptions[5].disabled = up;
    renderTriangle(c.x, c.y, "#ffffff");
}

function renderTriangle(x, y, c) {
    var v = verticesOfTriangle(x, y);
    var vpa = transformToViewport(new THREE.Vector2(v[0], v[1]));
    var vpb = transformToViewport(new THREE.Vector2(v[2], v[3]));
    var vpc = transformToViewport(new THREE.Vector2(v[4], v[5]));
    var path = two.makePath(vpa[0], vpa[1], vpb[0], vpb[1], vpc[0], vpc[1], false);
    path.linewidth = 1;
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

        var collision = accContains(acc,tx,ty);
        // console.log(`${n}: ${action} (${tx},${ty}) dir ${dir}`);
        if (collision) {
            renderTriangle(tx, ty, "#000000");
        } else {
            var color;
            switch (COLOR_SCHEME) {
                case 'RRLG': color = (action == 'R' ? RED : GREEN); break;
                case 'Rainbow': color = RAINBOW_COLORS[n%RAINBOW_COLORS.length]; break;
                case 'RGB': // fall thru
                default: color = RGB_COLORS[n%RGB_COLORS.length]; break;
            }
            renderTriangle(tx, ty, color);
            acc.push([tx,ty]);
        }

        // if (n+1<MAX_STEPS) {
            setTimeout(step, INTERVAL, tx, ty, dir, f, n+1, acc);
        // } else {
        //    onStop();
        // }

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
    return [x, y];
}

function triangleIsUp(x, y) { return (x+y)%2 == 0; }

// compute the 3 vertices (in cartesian cooreds) of Triangle x, y
function verticesOfTriangle(x, y) {
    // first let us decide if the triangle is upwardpointing..
    // a is the apex, b is East, c is West.
    var ax;
    var ay;
    var bx, by;
    var cx, cy;
    if (triangleIsUp(x, y)) {
        // this is up
        ax = x/2.0;
        ay = y * TRIANGLE_HEIGHT;
        bx = ax - 0.5;
        by = (y - 1.0) * TRIANGLE_HEIGHT;
        cx = ax + 0.5;
        cy = (y - 1.0) * TRIANGLE_HEIGHT;
    } else {
        // this is down
        ax = (x/2.0);
        ay = (y - 1.0) * TRIANGLE_HEIGHT;
        bx = ax + 0.5;
        by = y * TRIANGLE_HEIGHT;
        cx = ax - 0.5;
        cy = y * TRIANGLE_HEIGHT;
    }
    return [ax, ay, bx, by, cx, cy];
}

main();
