// Copyright (C) 2018  Robert L. Read <read.robert@gmail.com

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

// Make an instance of two and place it on the page.
var elem = document.getElementById('visualsection');

// Constants

var INTERVAL = 100; // Milliseconds between steps
var MAX_STEPS = 100;

var params = { width: 1000, height: 1000 };
var two = new Two(params).appendTo(elem);

// var tx = 0;
// var ty = 0;
var dir = 90;

// Page Elements

var executeButton = document.getElementById("execute-button");
var generatorText = document.getElementById("user-defined-generator");
var generatorsSelector = document.getElementById("generators-selector");

// Event Handlers

executeButton.addEventListener("click", executeGenerator);
generatorsSelector.addEventListener("change", function() {
  generatorText.value = initial_generators[generatorsSelector.value] || '';
});

function generator(n) {
    return ((n < 6) ? "L" : "S");
}

var initial_generators = {};
initial_generators["beam"] = '(n) => { return ((n < 10) ? (((n % 2) == 0) ? "L" : "R" ): "S"); }';
initial_generators["hex"] = '(n) => { return ((n < 6) ?  "L" : "S"); }';

// The rand generator is not guaranteed not to self-collide!
initial_generators["rand"] = '(n) => { return ((n < 10) ? ((Math.random() < 0.5) ? "L" : "R" ) : "S"); }';


function step(tx,ty,f,n) {    
  var action = n < MAX_STEPS ? f(n) : 'S';
  switch(action) {
  case 'L':
    dir = (dir + 60)%360;
    break;
  case 'R':
    dir = (dir - 60)%360;
  break;
  case 'S':
    executeButton.disabled = false;
    return;
  }

  switch(dir) {
  case 30:
  case 330:
    tx++; break;
  case 90:
    ty++;
    break;
  case 150:
  case 210:
    tx--; break;
  case 270:
    ty--;
    break;
  }
  console.log("Turning " + action + ". New direction " + dir + ". New location (" + tx + ", " + ty + ").");
    //  mark_triangle(tx, ty, n);
    renderTriangle(tx,ty,n);
    setTimeout(step, INTERVAL,tx,ty,f,n+1);
}

function createGrid(s) {

    var size = s || 30;

    for(var j = -s; j < s; j++) {
    var x0 = -s;
    var y0 = j;
    var x1 = s;
    var y1 = j;

    var p0 = transform_to_viewport(new THREE.Vector2(x0,y0));
    var p1 = transform_to_viewport(new THREE.Vector2(x1,y1));
    var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
    a.stroke = '#6dcff6';
    }

    for(var j = -s; j < s; j++) {
    var x0 = j;
    var y0 = s;
    
    var x1 = j+s;
    var y1 = -s;

    var p0 = transform_to_viewport(new THREE.Vector2(x0,y0));
    var p1 = transform_to_viewport(new THREE.Vector2(x1,y1));
    var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
    a.stroke = '#6dcff6';

    var x1 = j+-s;
    
    var p1 = transform_to_viewport(new THREE.Vector2(x1,y1));
    var a = two.makeLine(p0[0], p0[1], p1[0], p1[1]);
    a.stroke = '#6dcff6';
    }

    two.update();
}

var w = 10.0;
var h = 10.0;


function createTrinagleGrid(s) {

    var size = s || 30;
    for(var i = -s; i < s; i++) {
    for(var j = -s; j < s; j++) {
        render_spot(i + (((j % 2) == 0) ? 0.0 : 0.5 ),
            j,
            'blue');
    }
    }
    two.update();
}



// Input is a THREE.Vector2, out put an [x,y] array...
function transform_to_viewport(pnt) {

    // Let's assume our play space is from -10 to + 10, centered on the origin...

    var x = pnt.x;
    var y = pnt.y;
    // first scale appropriately
    x = x * (params.width / (2 * w));
    y = y * (params.height / (2 * h));    
    // now move to origin....
    x += params.width/2;
    y = (-y) + params.height/2;

    // These adjust our weird grid background to the origin...
//    y = y + params.height / (2 *(2 * h));
//    x = x + params.width / (2 * (2 * w)) ;
    return [x,y];
}

function transform_from_viewport(x,y) {

        // now move to origin...
    x = x - (params.width)/2;
    y = y - (params.height)/2;

    
    // then unscale..
    x = x / (params.width / (2*w));
    y = - y / (params.height / (2*h));    


    
    return [x,y];
}

function test_transforms() {
    for(var x = -10; x < 10; x++) {
    for(var y = -10; y < 10; y++) {
        var p = transform_from_viewport(x,y);
        var v = new THREE.Vector2(p[0],p[1]);
        var r = transform_to_viewport(v);
        console.log(x,y);
        console.log(r);
        
//	    assert(r.x == x);
//	    assert(r.y == y);
    }
    }
}


function render_origin() {
    var origin = transform_to_viewport(new THREE.Vector2(o0,0));
    var circle = two.makeCircle(origin[0], origin[1], 2);
    circle.fill = '#000000';
    circle.stroke = 'black'; // Accepts all valid css color
    circle.linewidth = 2;
}

function render_spot(x,y,color) {
    var pnt = transform_to_viewport(new THREE.Vector2(x,y));
    var circle = two.makeCircle(pnt[0], pnt[1], 3);
    circle.fill = color;
    circle.stroke = color; // Accepts all valid css color
    circle.linewidth = 2;
}

function draw_empty_grid() {
    createGrid(params.width / (2 * 10.0));
    createTrinagleGrid(30);
    render_spot(0.0,0.0,'red');
    two.update();
}

draw_empty_grid();

// This function converts "Triangle coordinates" into a point close to the center 
// of the "Cartesian coordinate" triangle
function cartesian_spot_triangle(x,y) {
    var ctx,cty;
    ctx = x/2.0;
    cty = y - 0.5;
    return {x: ctx, y: cty};
}
// compute the 3 vertices (in cartesian cooreds) of trinagle x,y
function vertices_of_triangle(x,y) {
    // first let us decide if the triangle is upwardpointing..
    // a is the apex, b is East, c is West.
    var ax;
    var ay;
    var bx,by;
    var cx,cy;
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
    return [ax,ay,bx,by,cx,cy];
}
// 
function mark_triangle(x,y,c) {

    var cc = cartesian_spot_triangle(x,y);
    render_spot(cc.x,cc.y,c);
    two.update() ;   
}

var x_t = 0;
var y_t = 0;
var c = 0;
function color(c) {
    switch(c % 3) {
	case 0: return "#ff0000";
	case 1: return "#00ff00";
	case 2: return "#0000ff";
    default:
	alert("failure");
    }
}
function renderTriangle(x,y,c) {
    var v = vertices_of_triangle(x,y);

    var vpa = transform_to_viewport(new THREE.Vector2(v[0],v[1]));
    var vpb = transform_to_viewport(new THREE.Vector2(v[2],v[3]));
    var vpc = transform_to_viewport(new THREE.Vector2(v[4],v[5]));    
    var path = two.makePath(vpa[0],vpa[1],
			    vpb[0],vpb[1],
			    vpc[0],vpc[1],
 		       false);
    path.linewidth = 2;
    path.stroke = "#000000";
    path.fill = color(c);
    two.add(path);
    two.update();
}


function markNextTriangle() {
    mark_triangle(x_t,y_t,color(c));
    
    renderTriangle(x_t,y_t,c);
    
    c++;
    x_t += 1;
    y_t += 1;
}
function plot_polar(r,theta) {
    var y = r*Math.sin(theta);
    var x = r*Math.cos(theta);
    render_spot(x,y,"black");
}

function drawGoldenSpiral() {
    const phi = (1 + Math.sqrt(5))/2.0;
    const contraction = 2;
    for(var theta = 0; theta < 20; theta += 0.05) {
	r = Math.pow(phi,theta*2/Math.PI)/contraction;
	console.log(theta);
	plot_polar(r,theta);
    }
    
}

function executeGenerator() {
    executeButton.disabled = true;
    var fsrc = generatorText.value;
    console.log(fsrc);
    var funcstatus = 	document.getElementById("function-status");
    try {
	var new_func = eval(fsrc);
	try {
	    two.clear();
	    draw_empty_grid();
	    setTimeout(step, INTERVAL,0,0,new_func,0);	    
	} catch(err) {
	    funcstatus.innerHTML = "On Evaluation:" + err.message;
	}
    }
    catch(err) {
	funcstatus.innerHTML = "On Compilation:" + err.message;
	return ;
    }
    
    funcstatus.innerHTML = "Function Compiled."

    
}
