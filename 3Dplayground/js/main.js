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

var tm = UGLY_GLOBAL_SINCE_I_CANT_GET_MY_MODULE_INTO_THE_BROWSER;
var OPERATION = "normal"; // "normal" or "helices"

const CHIRALITY_CCW = 1;
const CHIRALITY_CW = 0;
var TET_DISTANCE = 0.5;

const MAX_PARAMETRIC_STEPS = 1000;
const PARAMETRIC_BISECTION_LIMIT = 50;


// Detects webgl
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('threecontainer').innerHTML = "";
}

function addShadowedLight(scene, x, y, z, color, intensity) {
    var directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
    directionalLight.castShadow = true;
    var d = 1;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.bias = -0.005;
}
function createParalellepiped(sx, sy, sz, pos, quat, material) {
    var pp = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    pp.castShadow = false;;
    pp.receiveShadow = true;
    pp.position.set(pos.x, pos.y, pos.z);
    return pp;

}
// Not sure how to use the quaternion here,
function createSphere(r, pos, color) {
    //    var cmat = memo_color_mat(tcolor);
    var tcolor = new THREE.Color(color);
    var cmat = new THREE.MeshPhongMaterial({ color: tcolor });
    var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 16), cmat);
    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = false;;
    ball.receiveShadow = true;

    return ball;
}

function get_member_color(gui, len) {
    if (len < am.MIN_EDGE_LENGTH)
        return d3.color("black");
    else if (len > am.MAX_EDGE_LENGTH)
        return d3.color("black");
    else {
        var p = (len - am.MIN_EDGE_LENGTH) / (am.MAX_EDGE_LENGTH - am.MIN_EDGE_LENGTH);
        return d3.rgb(gui.color_scale(len));
    }
}

function create_actuator(d, b_a, b_z, pos, cmat) {
    var len = b_z.distanceTo(b_a) + -am.JOINT_RADIUS * 2;
    var quat = new THREE.Quaternion();

    var pos = new THREE.Vector3(b_z.x, b_z.y, b_z.z);
    pos.add(b_a);
    pos.divideScalar(2);
    
    var mesh = createParalellepiped(
        am.INITIAL_EDGE_WIDTH,
        am.INITIAL_EDGE_WIDTH,
        len,
        pos,
        quat,
        cmat);

    mesh.lookAt(b_z);

    mesh.castShadow = false;;
    mesh.receiveShadow = true;
    am.scene.add(mesh);
    mesh.structureKind = "member";
    mesh.name = b_a.name + " " + b_z.name;
    return mesh;
}

function memo_color_mat(tcolor) {
    var string = tcolor.getHexString();
    if (!(string in am.color_material_palette)) {
        var cmat = new THREE.MeshPhongMaterial({ color: tcolor });
        am.color_material_palette[string] = cmat;
    }
    return am.color_material_palette[string]
}
function alphabetic_name(n) {
    if (n < 26) {
        return String.fromCharCode(65 + n);
    } else {
        if (n < 26 * 26) {
            return alphabetic_name(Math.floor(n / 26)) + alphabetic_name(n % 26);
        } else {
            return "" + n;
        }
    }
}

var scolors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo")];
var smats = [new THREE.Color(0x8B0000),
new THREE.Color(0xFF8C00),
new THREE.Color(0x000082)];
function load_NTetHelix(am, helix, tets, pvec, hparams) {
    var len = hparams.len;
    var rho = hparams.rho;
    var d = hparams.d;
    var radius = hparams.radius;
    var lambda = hparams.lambda;
    var chi = hparams.chirality;
    var n = tets + 3;

    var coords = [];


    for (var i = 0; i < n; i++) {

        var myRho = rho;
        var rail = i % 3;
        var num = Math.floor(i / 3);
        var q = tm.H_general(chi, num, rail, myRho, d, radius);
        var v = new THREE.Vector3(q[0], q[1], q[2]);
        coords.push(v);
    }
    return load_NTetHelixAux(am, helix, tets, pvec, coords);
}

function create_vertex_mesh(pos, c) {
        var mesh = createSphere(am.JOINT_RADIUS, pos, c.hex());
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        am.scene.add(mesh);
}


function add_vertex(am, d, i, params) {
    var colors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Blue")];
    var darkgreen = d3.color("#008000");
    var dcolor = [null, darkgreen, d3.color("purple")];

    var vertices = params.vertices;
    var indices = params.indices;
    var prev = params.prev;
    var helix = params.helix;
    var v;
    var c;
    var th;
    if (i < 3) return;
    if (i == 3) {
        var base = get_base(params.init_pos, params.l);
        params.vertices = vertices = base.v.slice(0);
        th = [0, 1, 2, 3];
        indices.push(th, th, th, th); //First 3 are dummy copies to align indices and vertices
        v = base.v[i];
        c = [base.ec[3], base.ec[4], base.ec[5]];
        if (params.wireframe == true) {
            create_vertex_mesh(base.v[0], base.ec[3]);
            create_vertex_mesh(base.v[1], base.ec[3]);
            create_vertex_mesh(base.v[2], base.ec[3]);
            create_actuator(v[0].distanceTo(base.v[1]), base.v[0], base.v[1], null, base.ec[2]);
            create_actuator(v[1].distanceTo(base.v[2]), base.v[1], base.v[2], null, base.ec[0]);
            create_actuator(v[2].distanceTo(base.v[0]), base.v[2], base.v[0], null, base.ec[1]);
        }
        else {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(vertices[0],vertices[1],vertices[2]);
            if (params.blendcolor == true) {
                geometry.faces.push(new THREE.Face3(0, 1, 2, undefined, [cto3(c[0]),cto3(c[1]),cto3(c[2])]));
            }
            else {
                geometry.faces.push(new THREE.Face3(0, 1, 2, undefined, new THREE.Color(0)));
            }
            var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
            var mesh = new THREE.Mesh(geometry, material);
            am.scene.add(mesh);
        }
    } else {
            //                var d = get_direction(i - 3, vertices, indices);
        switch (d) {
            case 0: th = [prev[1], prev[2], prev[3], i]; break;
            case 1: th = [prev[0], prev[3], prev[2], i]; break;
            case 2: th = [prev[3], prev[0], prev[1], i]; break;
            case 3: th = [prev[2], prev[1], prev[0], i]; break;
        }
        var l = params.l
        v = get_vertex(i, vertices, indices, vertices[th[0]], vertices[th[1]], vertices[th[2]], [l[0]+l[3],l[1]+l[4],l[2]+l[5]], params.l, params.m);
        vertices.push(v);
        indices.push(th);
        c = get_colors(i, vertices, indices);
    }
    if (params.wireframe == true) {
        //        v = v.add(pvec);
        var pos = new THREE.Vector3();
        pos.set(v.x, v.y, v.z);
        var mesh = createSphere(am.JOINT_RADIUS, pos, c[3].hex());
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        am.scene.add(mesh);

        var body = {};
        body.rail = i % 3;
        body.number = i / 3;
        body.name = alphabetic_name(i);
        body.mesh = mesh;
        helix.helix_joints.push(body);
        am.push_body_mesh_pair(body, mesh);
        console.log("HELIX",helix.helix_joints,i);
        for (var k = 0; k < Math.min(3, i); k++) {
            var pos = new THREE.Vector3();

            var b_z = helix.helix_joints[i];
            var b_a = helix.helix_joints[indices[i][k]];
            var o_a = b_a.mesh.position;
            var o_z = b_z.mesh.position;

            var v_z = new THREE.Vector3(o_a.x, o_a.y, o_a.z);
            var v_a = new THREE.Vector3(o_z.x, o_z.y, o_z.z);
            var dist = v_a.distanceTo(v_z);

            var v_avg = new THREE.Vector3(v_z.x, v_z.y, v_z.z);
            v_avg.add(v_a);
            v_avg.multiplyScalar(0.5);

            pos.set(v_avg.x, v_avg.y, v_avg.z);

            var tcolor = new THREE.Color(c[k].hex());
            var cmat = memo_color_mat(tcolor);
            var mesh = create_actuator(dist, v_a, v_z, pos, cmat);
            if (b_a.name > b_z.name) {
                var t = b_a;
                b_a = b_z;
                b_z = t;
            }
            var memBody = {};
            memBody.name = b_a.name + " " + b_z.name;
            memBody.link_a = b_a;
            memBody.link_z = b_z;
            memBody.endpoints = [];
            memBody.endpoints[0] = b_a;
            memBody.endpoints[1] = b_z;

            for (var x = helix.helix_members.length - 1; x >= 0; x--) {
                if (helix.helix_members[x].body.name == memBody.name) {
                    helix.helix_members.splice(x, 1);
                }
            }
            var link = { a: b_a, b: b_z, body: memBody };
            helix.helix_members.push(link);
            am.push_body_mesh_pair(memBody, mesh);
        }
    }
    else {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(vertices[th[0]],vertices[th[1]],vertices[th[2]],vertices[th[3]]);
        if (params.blendcolor == true) {
            geometry.faces.push(
                new THREE.Face3(2, 3, 0, undefined, [cto3(c[2]),cto3(c[3]),cto3(c[0])]),
                new THREE.Face3(3, 2, 1, undefined, [cto3(c[3]),cto3(c[2]),cto3(c[1])]),
                new THREE.Face3(1, 0, 3, undefined, [cto3(c[1]),cto3(c[0]),cto3(c[3])]));
        }
        else {
            geometry.faces.push(
                new THREE.Face3(2, 3, 0, undefined, cto3(c[1])),
                new THREE.Face3(3, 2, 1, undefined, cto3(c[0])),
                new THREE.Face3(1, 0, 3, undefined, cto3(c[2])));
        }
        var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
        var mesh = new THREE.Mesh(geometry, material);
        am.scene.add(mesh);
    }
    params.prev = th;
}
function cto3(c) {
     return new THREE.Color(c.hex());
}

function get_random_int(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function get_direction(n, v, i) {
    if (n < 10)
        return get_random_int(3);
    else return -1;
}

function get_vertex(n, v, i, pa, pb, pc, s, l, m) {
    var valid = { v: true };
    var l0 = pa.distanceTo(pb);
    var l1 = pc.distanceTo(pa);
    var l2 = pb.distanceTo(pc);
    var ad = m ? s[0]-l0 : (n % 2 == 0) ? l[0] : l[3];
    var bd = m ? s[1]-l1 : (n % 2 == 0) ? l[1] : l[4];
    var cd = m ? s[2]-l2 : (n % 2 == 0) ? l[2] : l[5];
    var pd = find_fourth_point_given_three_points_and_three_distances(
        CHIRALITY_CCW,
        pa, pb, pc,
        ad, bd, cd,
        valid);
    return pd;
}
var colors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo"), d3.color("purple"), d3.color("black")];
function get_colors(n, v, i) {
    return [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Indigo"), d3.color("purple")];
}

var cs = [];
cs[0] = new THREE.Vector3(0, 0, 0);
cs[1] = new THREE.Vector3(3, 0, 0);
cs[2] = new THREE.Vector3(.5, -Math.sqrt(3) / 2, 0);

function calculate_tetrahedron(l) {
    var v = [new THREE.Vector3( l[1]/2,0,0),
             new THREE.Vector3(      0,0,0),
             new THREE.Vector3(-l[1]/2,0,0),
             new THREE.Vector3(      0,0,0)];
    v1 = v[1];
    v3 = v[3];
    s0 = l[0]*l[0];
    s1 = l[1]*l[1];
    s2 = l[2]*l[2];
    s3 = l[3]*l[3];
    s4 = l[4]*l[4];
    s5 = l[5]*l[5];
    var x1 = v1.x = -(s2-s0)/2/l[1];
    var x3 = v3.x = -(s3-s5)/2/l[1];
    var xm = (x1+x3)/2;
    var xyz1s = (s2+s0-s1/2)/2;
    var xyz3s = (s3+s5-s1/2)/2;
    var zs = (xyz1s+xyz3s-s4/2)/2-xm*xm;
    var z = Math.sqrt(zs);
    var zd = (s4/4-xyz1s+zs)/2/z;
    var z1 = v1.z = ((3*(s2+s0)+(s3+s5)-2*s1-2*s4)/8-x1*xm)/z;
    v3.z = 2*z-z1;
    v1.y = -(v3.y=Math.sqrt(xyz1s-x1*x1-z1*z1));
    return v;
}

// v [a, b, c, d], vc[a, b, c, d], ec[cb, ac, ba, ad, bd, cd]
function get_base(init_pos, l) {
    return { v: calculate_tetrahedron(l),
             vc: [colors[3], colors[3], colors[3], colors[3]], ec: [colors[4], colors[4], colors[4], colors[0], colors[1], colors[2]] };
}

var AM = function () {
    this.container,
        this.stats;
    this.camera;
    this.controls;
    this.scene;
    this.sceneOrtho;
    this.renderer;
    this.textureLoader;
    this.clock = new THREE.Clock();
    this.clickRequest = false;
    this.mouseCoords = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
    this.pos = new THREE.Vector3();
    this.quat = new THREE.Quaternion();


    this.BT_CONSTRAINT_STOP_CFM = 3;
    this.BT_CONSTRAINT_STOP_ERP = 1
    this.myCFMvalue = 0.0;
    this.myERPvalue = 0.8;

    this.jointBody = null;

    this.playgroundDimensions = {
        w: 10,
        d: 10,
        h: 3
    };
    this.GROUND_WIDTH = 1.0;

    this.gravity_on = true;
    this.margin = 0.05;

    this.armMovement = 0;

    //    this.window_height_factor = 1/4.0;
    this.window_height_factor = 0.5;
    // Sadly, this seems to do nothing!
    this.CAMERA_RADIUS_FACTOR = 1;

    this.grid_scene = null;
    // Used in manipulation of objects
    this.gplane = false;


    this.INITIAL_EDGE_LENGTH = TET_DISTANCE;
    this.INITIAL_EDGE_WIDTH = this.INITIAL_EDGE_LENGTH / 40;
    this.INITIAL_HEIGHT = 3 * this.INITIAL_EDGE_LENGTH / 2;
    this.NUMBER_OF_TETRAHEDRA = 70;
    //       this.NUMBER_OF_TETRAHEDRA = 5;


    this.JOINT_RADIUS = 0.09 * this.INITIAL_EDGE_LENGTH; // This is the current turret joint ball.

    this.LENGTH_FACTOR = 20;

    // Helices look like this...
    // {
    // 	helix_joints: [],
    // 	helix_members: []
    // }
    this.helices = [];



    this.meshes = [];
    this.bodies = [];


    // This is sometimes useful for debugging.    
    //    this.jointGeo = new THREE.BoxGeometry( this.JOINT_RADIUS*2,this.JOINT_RADIUS*2,this.JOINT_RADIUS*2);
    this.jointGeo = new THREE.SphereGeometry(this.JOINT_RADIUS, 32, 32);
    this.jointMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });

    this.floorTexture = new THREE.ImageUtils.loadTexture("images/logo-white-background.png");

    this.MIN_EDGE_LENGTH = this.INITIAL_EDGE_LENGTH / 2;
    this.MAX_EDGE_LENGTH = this.INITIAL_EDGE_LENGTH * 2;
    this.color_scale = d3.scale.quantile().domain([this.MIN_EDGE_LENGTH, this.MAX_EDGE_LENGTH])
        .range(['violet', 'indigo', '#8A2BE2', 'blue', 'green', 'yellow', '#FFD700', 'orange', '#FF4500']);
    this.color_material_palette = {};

    this.GROUND_PLANE_MESH;
    this.GROUND_BODY;

    this.latestLookAt = new THREE.Vector3(0, 0, 0);

    this.helix_params = [];

    // a final adjustment
    this.INITIAL_EDGE_WIDTH *= 4;
    this.JOINT_RADIUS *= 3;

}
AM.prototype.push_body_mesh_pair = function (body, mesh) {
    this.meshes.push(mesh);
    this.bodies.push(body);
}
AM.prototype.remove_body_mesh_pair = function (body, mesh) {
    for (var i = this.meshes.length - 1; i >= 0; i--) {
        if (this.meshes[i].name === mesh.name) {
            this.meshes.splice(i, 1);
            this.bodies.splice(i, 1);
        }
    }
}

AM.prototype.clear_non_floor_body_mesh_pairs = function () {
    this.meshes = [];
    this.bodies = [];
    this.meshes.push(am.GROUND_PLANE_MESH);
    this.bodies.push(am.GROUND_BODY);
}

var am = new AM();


var bulbLight, bulbMat, ambientLight, object, loader, stats;
var ballMat, cubeMat, floorMat;
// ref for lumens: http://www.power-sure.com/lumens.htm
var bulbLuminousPowers = {
    "110000 lm (1000W)": 110000,
    "3500 lm (300W)": 3500,
    "1700 lm (100W)": 1700,
    "800 lm (60W)": 800,
    "400 lm (40W)": 400,
    "180 lm (25W)": 180,
    "20 lm (4W)": 20,
    "Off": 0
};
// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
var hemiLuminousIrradiances = {
    "0.0001 lx (Moonless Night)": 0.0001,
    "0.002 lx (Night Airglow)": 0.002,
    "0.5 lx (Full Moon)": 0.5,
    "3.4 lx (City Twilight)": 3.4,
    "50 lx (Living Room)": 50,
    "100 lx (Very Overcast)": 100,
    "350 lx (Office Room)": 350,
    "400 lx (Sunrise/Sunset)": 400,
    "1000 lx (Overcast)": 1000,
    "18000 lx (Daylight)": 18000,
    "50000 lx (Direct Sun)": 50000
};
var params = {
    shadows: true,
    exposure: 0.68,
    bulbPower: Object.keys(bulbLuminousPowers)[4],
    hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0]
};


function initGraphics() {

    am.container = document.getElementById('threecontainer');

    var PERSPECTIVE_NEAR = 0.3;


    if (OPERATION == "helices") {
        var width = 10;
        var height = width * (window.innerHeight * am.window_height_factor) / window.innerWidth;
        am.camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
    } else {
        am.camera = new THREE.PerspectiveCamera(60, window.innerWidth / (window.innerHeight * am.window_height_factor), PERSPECTIVE_NEAR, 2000);
    }

    //   am.camera.aspect = window.innerWidth / (window.innerHeight * am.window_height_factor);

    var origin = new THREE.Vector3(0, 0, 0);
    am.camera.lookAt(origin);

    //    am.camera.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), (Math.PI/2));

    am.scene = new THREE.Scene();
    am.scene.fog = new THREE.Fog(0x000000, 500, 10000);

    am.camera.position.x = -0.25;
    am.camera.position.y = 1.5;
    am.camera.position.z = 2;

    am.controls = new THREE.OrbitControls(am.camera, am.container);
    am.controls.target.set(0, 0, 0);

    am.renderer = new THREE.WebGLRenderer({ antialias: true });
    am.renderer.setClearColor(0xffffff);
    am.renderer.autoClearColor = true;

    am.renderer.setPixelRatio(window.devicePixelRatio);
    am.renderer.setSize(window.innerWidth, window.innerHeight * am.window_height_factor);
    am.SCREEN_WIDTH = am.renderer.getSize().width;
    am.SCREEN_HEIGHT = am.renderer.getSize().height;
    am.camera.radius = (am.SCREEN_WIDTH + am.SCREEN_HEIGHT) / this.CAMERA_RADIUS_FACTOR;


    am.cameraOrtho = new THREE.OrthographicCamera(0, am.SCREEN_WIDTH, am.SCREEN_HEIGHT, 0, - 10, 10);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    am.scene.add(hemiLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position = new THREE.Vector3(100, 5, 0);
    am.scene.add(directionalLight);

    var ambientLight = new THREE.AmbientLight(0x404040);

    am.grid_scene = new THREE.Scene();
    am.grid_scene.fog = new THREE.Fog(0x000000, 500, 10000);

    // GROUND
    var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
    var groundMat;
    if (OPERATION == "normal") {
        groundMat = new THREE.MeshPhongMaterial({ color: 0x777777, specular: 0x050505 });
    } else {
        groundMat = new THREE.MeshPhongMaterial({ color: 0xfffffff, specular: 0x050505 });
    }
    //    groundMat.color.setHSL( 0.095, 1, 0.75 );

    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.name = "GROUND";
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    am.scene.add(ground);

    ground.receiveShadow = true;


    // HACK:  These diemensions are probably not right here!
    gridInit(am.grid_scene, am.playgroundDimensions);

    am.container.innerHTML = "";

    am.container.appendChild(am.renderer.domElement);

    am.sceneOrtho = new THREE.Scene();

    window.addEventListener('resize', onWindowResize, false);

}

AM.prototype.push_body_mesh_pair = function (body, mesh) {
    this.meshes.push(mesh);
    this.bodies.push(body);
}
AM.prototype.remove_body_mesh_pair = function (body, mesh) {
    for (var i = this.meshes.length - 1; i >= 0; i--) {
        if (this.meshes[i].name === mesh.name) {
            this.meshes.splice(i, 1);
            this.bodies.splice(i, 1);
        }
    }
    delete mesh["ammo_obj"];
    for (var i = this.rigidBodies.length - 1; i >= 0; i--) {
        if (this.rigidBodies[i].name === body.name) {
            this.rigidBodies.splice(i, 1);
        }
    }
}


function onWindowResize() {
    am.camera.aspect = window.innerWidth / (window.innerHeight * am.window_height_factor);
    am.renderer.setSize(window.innerWidth, window.innerHeight * am.window_height_factor);

    am.camera.updateProjectionMatrix();
    am.SCREEN_WIDTH = am.renderer.getSize().width;
    am.SCREEN_HEIGHT = am.renderer.getSize().height;
    am.camera.radius = (am.SCREEN_WIDTH + am.SCREEN_HEIGHT) / this.CAMERA_RADIUS_FACTOR;

    am.cameraOrtho = new THREE.OrthographicCamera(0, am.SCREEN_WIDTH, am.SCREEN_HEIGHT, 0, - 10, 10);
}

function animate() {
    // Seems this is likely to be a problem...
    requestAnimationFrame(animate);
    render();
}

var sprite_controls = new function () {
    this.size = 50;
    this.sprite = 0;
    this.transparent = true;
    this.opacity = 0.6;
    this.colorize = 0xffffff;
    this.textcolor = "yellow";
    this.rotateSystem = true;

    this.clear = function (x, y) {
        am.sceneOrtho.children.forEach(function (child) {
            if (child instanceof THREE.Sprite) am.sceneOrtho.remove(child);
        })
    };

    this.draw_and_create = function (sprite, x, y, message) {
        var fontsize = 128;
        var ctx, texture,
            spriteMaterial,
            canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        ctx.font = fontsize + "px Arial";

        // setting canvas width/height before ctx draw, else canvas is empty
        canvas.width = ctx.measureText(message).width;
        canvas.height = fontsize * 2; // fontsize * 1.5

        // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
        ctx.font = fontsize + "px Arial";
        ctx.fillStyle = this.textcolor;
        ctx.fillText(message, 0, fontsize);

        texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.LinearFilter; // NearestFilter;
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({
            opacity: this.opacity,
            color: this.colorize,
            transparent: this.transparent,
            map: texture
        });

        spriteMaterial.scaleByViewport = true;
        spriteMaterial.blending = THREE.AdditiveBlending;

        if (!sprite) {
            sprite = new THREE.Sprite(spriteMaterial);
        }

        sprite.scale.set(this.size, this.size, this.size);
        sprite.position.set(x, y, 0);

        am.sceneOrtho.add(sprite);
        return sprite;
    };
};

function render() {
    var deltaTime = am.clock.getDelta();

    sprite_controls.clear();
    am.controls.update(deltaTime);

    // note this....
    //    am.renderer.autoClear = true;        
    am.renderer.render(am.scene, am.camera);
    if (OPERATION == "normal") {
        am.renderer.render(am.grid_scene, am.camera);
    }
    am.renderer.autoClear = false;
    am.renderer.render(am.sceneOrtho, am.cameraOrtho);
}

function initiation_stuff() {
    // Initialize Three.js
    if (!Detector.webgl) Detector.addGetWebGLMessage();
}


function init() {
    initGraphics();
    //    createGround(am);
}


initiation_stuff();

init();
animate();


//  var r0 = (2/3)*Math.sqrt(2/3);
var r0 = (2 / 3) * Math.sqrt(2 / 3);
// This is the splitting difference.
// var r0 = Math.sqrt(35/9)/4;
var trial = 0;
var num = 4;

//add_equitetrabeam_helix_lambda(am, 1.0, pvec0, len);



function draw_central() {
    am.clear_non_floor_body_mesh_pairs();
    for (var i = am.scene.children.length - 1; i >= 0; i--) {
        var obj = am.scene.children[i];
        if (obj.type == "Mesh" && obj.name != "GROUND") {
            am.scene.remove(obj);
        }
    }
    am.helices = [];
    am.helix_params = [];
    draw_and_register();
}


function draw_and_register() {
    var pvec0 = new THREE.Vector3(0, HELIX_RADIUS * 3, -3);
    var hp = draw_new(pvec0);
}

function draw_new(pvec) {
    return add_equitetrabeam_helix(am, CHIRALITY_CCW, null,
        RAIL_ANGLE_RHO_d * Math.PI / 180,
        HELIX_RADIUS, pvec, TET_DISTANCE);
}

function draw_many() {
    for (var i = 0; i < 6; i++) {
        var rho = (i / 5.0) * RAIL_ANGLE_RHO_d * Math.PI / 180;
        var pvec0 = new THREE.Vector3(((5 - i) / 2.0) * 2 + -3, HELIX_RADIUS * 3, -3);
        add_equitetrabeam_helix(am, CHIRALITY_CCW, null, rho, HELIX_RADIUS, pvec0, TET_DISTANCE);
    }
}

function build_central() {
    //    var pvec0 = new THREE.Vector3(0,0,0);
    var pvec0 = new THREE.Vector3(0, HELIX_RADIUS * 3, -3);

    // I can't figure out if HELIX_RADIUS is wrong, if
    // my formula is wrong, or if the CylinderGeometry is wrong....
    // The formula checks out in the 2-D 2case.
    var ir1 = tm.inradius_assumption1(Math.PI * RAIL_ANGLE_RHO_d / 180, HELIX_RADIUS);
    var ir2 = tm.inradius_assumption2(Math.PI * RAIL_ANGLE_RHO_d / 180, HELIX_RADIUS);

    console.log("inradius1", ir1);
    console.log("inradius2", ir2);
    {
        var geometry = new THREE.CylinderGeometry(ir1, ir1, 3, 32);
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        var cylinder = new THREE.Mesh(geometry, material);
        cylinder.rotateX(Math.PI / 2);
        cylinder.translateZ(-HELIX_RADIUS * 3);
        am.scene.add(cylinder);
    }
}



function draw_helices() {
    var pvec0 = new THREE.Vector3(0, HELIX_RADIUS * 2.1, -1.0);
    var hp = draw_new(pvec0);
    var h = am.helices.slice(-1)[0];
    var score = compute_helix_minimax(h)[2];
    hp.score = score;
    hp.inradius = tm.inradius_assumption1(hp.rho, hp.radius);
    register_trials(trial++, OPTIMALITY, RAIL_ANGLE_RHO_d, HELIX_RADIUS, hp.d, TET_DISTANCE,
        hp.onehop,
        hp.twohop,
        hp.pitch,
        hp.inradius,
        hp.score);

    var factor = 3 * tm.BCtheta / tm.BCrho;
    draw_helix(pvec0, 0, hp, factor, "black", 1.0, 0.003);

    draw_helix(pvec0, 0, hp, 1, "red", 1.2, 0.005);
    draw_helix(pvec0, 1, hp, 1, "orange", 1.2, 0.005);
    draw_helix(pvec0, 2, hp, 1, "blue", 1.2, 0.005);
}

function draw_helix(pvec, rail, hparams, factor, color, fudge, lw) {
    var lineGeometry = new THREE.Geometry();
    var path = new THREE.Group();

    var currentPosition = new THREE.Vector3(0, 0, 0);
    var lastPosition = null;


    var tets = am.NUMBER_OF_TETRAHEDRA;

    var len = hparams.len;
    var rho = hparams.rho;
    var d = hparams.d;
    var radius = hparams.radius * fudge;
    var lambda = hparams.lambda;

    var big = (tets + 1) * d;

    var limit = 1000.0;
    for (var i = 0; i < limit; i++) {
        var chi = hparams.chirality;
        var n = i * (big / limit);
        var q = tm.H_general_factor(chi, n, rail, rho, d, radius, factor);
        var v = new THREE.Vector3(q[0], q[1], q[2]);
        v = v.add(pvec);
        currentPosition = v;
        if (!lastPosition) lastPosition = currentPosition;

        lineGeometry.vertices.push(currentPosition);

        lastPosition = currentPosition;
    }

    var line = new MeshLine();
    line.setGeometry(lineGeometry);

    var material = new MeshLineMaterial({
        color: new THREE.Color(color),
        lineWidth: lw
    }
    );
    //    material.color = new THREE.Color("red");

    var mesh = new THREE.Mesh(line.geometry, material);
    am.scene.add(mesh);
}


function renderComputed() {
    alert("renderComputed");
    var pvec = new THREE.Vector3(0, 1, 0);
    am.helices.push(
        {
            helix_joints: [],
            helix_members: []
        });

    var cs = [];
    var tets = 2;
    load_NTetHelixAux(am, am.helices[0], tets, pvec, cs);
}



// for testing, we need to know when somethigns is "closeto a target"
// to deal with roundoff error

function near(x, y, e) {
    return Math.abs(x - y) <= e;
}

// Find the normal to a triangle in 3space: https://stackoverflow.com/questions/19350792/calculate-normal-of-a-single-triangle-in-3d-space
// arguments THREE.js Vector3's
function normal(a, b, c) {
    var U = b.sub(a);
    var V = c.sub(a);
    return U.cross(V);
}


// Very useful for debugging, determine the "handedness" or chirality
// of a tetrahedron: Is the 4th point to the "right" (CCW) of the plane of the
// first three, or the left? (CW)
// arguments are THREE.js Vector3's
function tet_chirality(a, b, c, d) {
    var N = normal(a, b, c);
    var prod = N.dot(d);
    return (prod > 0) ? CHIRALITY_CCW : CHIRALITY_CW;
}

function test_tet_chirality() {
    var c = [];
    c[0] = new THREE.Vector3(0, 0, 0);
    c[1] = new THREE.Vector3(1, 0, 0);
    c[2] = new THREE.Vector3(0, 1, 0);
    c[3] = new THREE.Vector3(0, 0, 1);
    var chi0 = tet_chirality(c[0], c[1], c[2], c[3]);
    // This should be different,
    var chi1 = tet_chirality(c[0], c[2], c[1], c[3]);
    console.assert(chi0 == CHIRALITY_CCW);
    console.assert(chi1 == CHIRALITY_CW);
    console.log("TEST CHIRALITY", chi0, chi1);
}

// This is a tricky but essential routine. Given a triangle abc and three distances
// to a point d (da, db, dc), we have to find the point d.
// The best way to do this is to translate and rotate the point to
// the origin in a specific way, then comupte things simply, then perform the inverse transport.
// We are using the right-hand rule. Following computer graphichs convention, is condidered "up"
// and the Z dimenstion is considered depth.
// A is at the origin
// B is on the x axis (positive)
// C is in the x-y plane
// D is in the positive Z semiplane
// I need to work out the naming very clearly! That is a task for tomorrow.
// The input is the 6 distances.
// This code inspired by Dave Barber: view-source:http://tamivox.org/redbear/tetra_calc/index.html

function find_point_from_transformed(sense, AB, AC, AD, BC, BD, CD, v) {
    // _m2 means "squared"
    var AB_m2 = AB * AB; var AC_m2 = AC * AC;
    var AD_m2 = AD * AD; var BC_m2 = BC * BC;
    var BD_m2 = BD * BD; var CD_m2 = CD * CD;
    var qx = AB;
    var rx = (AB_m2 + AC_m2 - BC_m2) / (2.0 * AB);
    var ry = Math.sqrt(AC_m2 - rx * rx);
    var sx = (AB_m2 + AD_m2 - BD_m2) / (2.0 * AB);
    var sy = (BD_m2 - (sx - qx) * (sx - qx) - CD_m2 + (sx - rx) * (sx - rx) + ry * ry) / (2 * ry);
    var factor = AD_m2 - sx * sx - sy * sy;
    var sz = 0;
    var debug = 0;
    if (factor < 0) {
        if (debug) {
            console.log("INTERNAL ERROR: this is not a legal tetrahedron\n");
            console.log("AB AC AD BC BD CD\n");
            console.log(AB, AC, AD, BC, BD, CD);
        }
        // I have no idea what to return here -- I'll return half the average distance.
        sz = (AB + AC + AD + BC + BD + CD) / (6 * 2);
        v.valid = false;
    } else {
        sz = Math.sqrt(AD_m2 - sx * sx - sy * sy);
        v.valid = true;
    }
    A = new THREE.Vector3(0.0, 0.0, 0.0);
    B = new THREE.Vector3(qx, 0.0, 0.0);
    D = new THREE.Vector3(sx, sy, (sense == CHIRALITY_CCW) ? -sz : sz);
    // We compute this only for debugging purposesn
    C = new THREE.Vector3(rx, ry, 0.0);

    // if (debug) {
    //   Chirality senseABC = tet_chirality(A,B,C,D);
    //     console.log("chirality (demanded, computed) ",sense,", ",senseABC,"\n");
    //   if (sense != senseABC) {
    //       console.log("SENSE CHECK ON TET FAILED!\n");
    //       console.log(A,B,C,D);
    //   }
    //   assert(sense == senseABC);	      
    // }
    return D;

}

// This tries to rotate the vector A-B on to the X-Axis. C should end up in the XY plane.
// I think if the the vector A-B points in the negative x direction, we have a special case
// that causes a problem here. In that case we are 180 degrees out of sync. I need to think
// carefully about how to handle this.
function compute_transform_to_axes2(pa, pb, pc) {
    var m = new THREE.Matrix4();
    // Translate a to the origin...
    m.makeTranslation(-pa.x, -pa.y, -pa.z);

    var a0 = new THREE.Vector3(pa.x, pa.y, pa.z);
    var b0 = new THREE.Vector3(pb.x, pb.y, pb.z);
    var c0 = new THREE.Vector3(pc.x, pc.y, pc.z);

    a0.applyMatrix4(m);
    b0.applyMatrix4(m);
    c0.applyMatrix4(m);

    // now a0 should be at the origin;
    var debug = 0;
    if (debug) console.log("a0b0c0", a0, b0, c0);

    var xaxis = new THREE.Vector3(1, 0, 0);
    var yaxis = new THREE.Vector3(0, 1, 0);
    var zaxis = new THREE.Vector3(0, 0, 1);

    var b0norm = new THREE.Vector3(b0.x, b0.y, b0.z).normalize();
    if (debug) console.log("b0norm", b0norm);

    var q = new THREE.Quaternion()
    q.setFromUnitVectors(b0norm, xaxis);
    if (debug) console.log("quaternion", q);
    var b1 = new THREE.Vector3(b0.x, b0.y, b0.z);
    if (debug) console.log("b1", b1);
    var c1 = new THREE.Vector3(c0.x, c0.y, c0.z);

    b1 = b1.applyQuaternion(q);

    if (debug) console.log("b1", b1);
    c1 = c1.applyQuaternion(q);
    // now b1 should be on the x axis..
    if (debug) console.log("b1", b1);
    var m1 = new THREE.Matrix4();
    m1.makeRotationFromQuaternion(q);

    var m2 = new THREE.Matrix4();

    m2.multiplyMatrices(m1, m);
    // m2 applied to our original points should give us b1,c1
    var ct = new THREE.Vector3(pc.x, pc.y, pc.z);
    ct.applyMatrix4(m2);
    if (debug) console.log("===", ct, c1);


    // Now finally, we need to rotate point c into the xy plane
    var c2 = new THREE.Vector3(pc.x, pc.y, pc.z);


    if (debug) console.log("c2 first", c2);
    c2.applyMatrix4(m2);

    if (debug) console.log("c2 trans", c2);

    var theta = Math.atan2(c2.z, c2.y);
    if (debug) console.log("theta", theta);

    var m3 = new THREE.Matrix4();
    m3.makeRotationX(-theta);

    // If this is applied to C, it should place it in the XY plane (z = 0);
    c2.applyMatrix4(m3);
    if (debug) console.log("C2 after rotation", c2);

    //    m4.multiplyMatrices(m2,m3);
    //    console.log(m,m3,m4);

    // m4 applied to our stating point must place it in the XY plane
    var c3 = new THREE.Vector3(pc.x, pc.y, pc.z);
    c3.applyMatrix4(m);
    c3.applyMatrix4(m1);
    c3.applyMatrix4(m3);
    if (debug) console.log("POINT C3 FINAL", c3);

    var c4 = new THREE.Vector3(pc.x, pc.y, pc.z);
    var m4 = new THREE.Matrix4();
    m4.identity()
    m4.premultiply(m);
    m4.premultiply(m1);
    m4.premultiply(m3);
    c4.applyMatrix4(m4);
    if (debug) console.log("POINT C4 FINAL", c4);

    return m4;
}

function test_compute_transform_to_axes2() {
    var c = [];

    c[0] = new THREE.Vector3(0, -0.5, 0.5);
    c[1] = new THREE.Vector3(1, 1, 4);
    c[2] = new THREE.Vector3(0, 10, 10);

    var trans = compute_transform_to_axes2(c[0], c[1], c[2]);

    c[1].applyMatrix4(trans);
    console.log("point b transformed", c[1]);

    console.assert(near(c[1].y, 0, 1e-5) && near(c[1].z, 0, 1e-5));
    c[2].applyMatrix4(trans);
    console.log("point c transformed", c[2]);
    console.assert(near(c[2].z, 0, 1e-5));
    console.log(trans);
}

test_compute_transform_to_axes2();

function find_fourth_point_given_three_points_and_three_distances(
    sense,
    pa, pb, pc,
    ad, bd, cd,
    valid) {

    var debug = 0;
    if (debug) console.log("ad bd cd\n");
    if (debug) console.log(ad, bd, cd);

    // First compute all 6 distances....
    var ab = pa.distanceTo(pb);
    var ac = pa.distanceTo(pc);
    var bc = pb.distanceTo(pc);

    // Now find transformation that rotates and translates to axes...
    if (debug) console.log("pa pb pc \n");
    if (debug) console.log(pa, pb, pc);

    var tform = compute_transform_to_axes2(pa, pb, pc);

    var Ap, Bp, Cp;

    var Ap = pa.clone();
    var Bp = pb.clone();
    var Cp = pc.clone();

    Ap = Ap.applyMatrix4(tform);
    if (debug) console.log("Ap \n");
    if (debug) console.log(Ap);

    Bp = Bp.applyMatrix4(tform);
    if (debug) console.log("Bp \n");
    if (debug) console.log(Bp);

    Cp = Cp.applyMatrix4(tform);
    if (debug) console.log("Cp \n");
    if (debug) console.log(Cp);

    // Not written yet!
    //    point_transform_affine3d tform_inv = inv(tform);
    var tform_inv = new THREE.Matrix4();
    tform_inv.getInverse(tform);

    if (debug) console.log("tform inv\n");
    if (debug) console.log(tform_inv.get_m());

    // Now get the fourth point...
    if (debug) console.log("INPUT YYY\n");
    if (debug) console.log(ab, ac, ad, bc, bd, cd);
    // TODO: Need to translate this
    var D = find_point_from_transformed(sense, ab, ac, ad, bc, bd, cd, valid);

    if (isNaN(D.x) || isNaN(D.y) || isNaN(D.z)) {
        console.log("INPUT YYY\n");
        console.log(D.x);
        console.log(D.y);
        console.log(D.z);
        console.log(ab, ac, ad, bc, bd, cd);
    }
    // if (debug) {
    //     Chirality untransformed = tet_chirality(pa,pb,pc,tform_inv(D));
    //     Chirality transformed = tet_chirality(Ap,Bp,Cp,D);

    //     console.log("Chirality demanded: " << sense << "\n";  
    //                 console.log("Chirality of transformed computations: " << transformed << "\n";
    //                             console.log("Chirality of untransformed computations: " << untransformed << "\n";
    // }
    var D_inv = D.clone();
    D_inv.applyMatrix4(tform_inv);
    return D_inv;
}

function test_find_point_from_transformed() {
    var v = { valid: true };
    var chi = CHIRALITY_CCW;
    var AB = 1;
    var AC = 1;
    var AD = 1;
    var BC = 1;
    var BD = 1;
    var CD = 1;

    var D = find_point_from_transformed(chi, AB, AC, AD, BC, BD, CD, v)
    console.log(D, v);

}
test_find_point_from_transformed();
test_tet_chirality();



function test_find_fourth_point_given_three_points_and_three_distance() {
    var c = [];
    var pa = c[0] = new THREE.Vector3(-1, 0, 0);
    var pb = c[1] = new THREE.Vector3(1, 0, 0);
    var pc = c[2] = new THREE.Vector3(0, 1, 0);
    var valid = { v: true };
    var ad = 1;
    var bd = 1;
    var cd = 1;
    var d = find_fourth_point_given_three_points_and_three_distances(
        CHIRALITY_CCW,
        pa, pb, pc,
        ad, bd, cd,
        valid);
    console.log("computed point", d, valid);
}

test_find_fourth_point_given_three_points_and_three_distance();

function clearAm() {
    am.clear_non_floor_body_mesh_pairs();
    for (var i = am.scene.children.length - 1; i >= 0; i--) {
        var obj = am.scene.children[i];
        if (obj.type == "Mesh" && obj.name != "GROUND") {
            am.scene.remove(obj);
        }
    }
    am.helices = [];
    am.helix_params = [];
}

function initialParameters(init_pos,wf,bc,l,a) { 
    var params = { vertices: [], indices: [], prev: [], helix: {helix_joints: [], helix_members: [],
                                                               },
                 init_pos: init_pos};
    if (wf === undefined)
        wf = true;
    if (bc === undefined)
        bc = true;
    params.wireframe = wf;
    params.blendcolor = bc;
    params.l = l;
    params.m = !a;
//    for (var i = 0; i < 3; i++) {
//        add_vertex(am, 0, i, params);
//    }
    add_vertex(am, 0, 3, params);
    return params;
}

function drawTetrahedron(dir, i, other_params) {
    // ... do stuff
    add_vertex(am, dir, i + 3, other_params);
    return other_params;
}

(function () {

    var EXAMPLE_GENERATORS = {
        alert: {
            name: "Random",
            src: '(i) => { return i<6 ? Math.floor(Math.random() * 3): -1; }'
        },
        console: {
            name: "Regular",
            src: '(i) => { return i<20 ? [ 2,1,0,1,2][i%5]: -1; }'
        }
    };

    // CONSTANTS
    
    var INTERVAL = 25; // milliseconds between steps.
    
    // GLOBAL VARIABLES
    
    var generatorFn;
    
    // PAGE ELEMENTS
    
    var executeButton;
    var funcStatus;
    var generatorsSelector;
    var generatorText;
    
    // MAIN FUNCTION
    
    $(function () { main(); });
    function main() {
        executeButton = document.getElementById('execute-button');
        funcStatus = document.getElementById('function-status');
        generatorsSelector = document.getElementById("generators-selector");
        generatorText = document.getElementById('user-defined-generator');
        
        executeButton.addEventListener('click', onExecute);
        generatorsSelector.addEventListener("change", onGeneratorChanged);

        // TEMPORARY: Render button is placeholder until example generators are working.
        var renderButton = document.getElementById('render-button');
        renderButton.addEventListener('click', renderComputed);

        var renderTestGeneratorsButton = document.getElementById('render-test-generators');
        console.log("AAAA",renderTestGeneratorsButton);
        renderTestGeneratorsButton.addEventListener('click', renderTestGenerators);

        document.getElementById("stacking-helix-table").addEventListener("click", function(){ stackingHelixTable(); });
        
        // Add the Parametric Curve functionality
        document.getElementById("circle-button").addEventListener("click", function(){ followParametricCurve(parametricCircle, false); });
        document.getElementById("sine-button").addEventListener("click", function(){ followParametricCurve(parametricSineWave, true); });
        document.getElementById("cone-button").addEventListener("click", function(){ followParametricCurve(parametricCone, true); });
        document.getElementById("helix-button").addEventListener("click", function(){ followParametricCurve(parametricHelix, true); });

        // Fill the generators selector
        for (var key in EXAMPLE_GENERATORS) {
            if (EXAMPLE_GENERATORS.hasOwnProperty(key)) {
                var entry = EXAMPLE_GENERATORS[key];
                generatorsSelector.options[generatorsSelector.options.length] = new Option(entry.name, key);
            }
        }

    }

    // STEP FUNCTION
    
    function step(fn, i, other_params) {
        var dir;
        try {
            dir = fn(i);
//            dir = generatorFn(i);
        } catch (err) {
           funcStatus.innerHTML = "Step " + i + ": " + err.message;
           dir = -1;
        }
        
        if (dir!==-1 && dir!==0 && dir!==1 && dir!==2) {
            funcStatus.innerHTML = "Step " + i + ": Unexpected return value " + dir;
            dir = -1;    
        }
        
//        console.log('Step ' + i + ' direction ' + dir);
        if (dir != -1) {
            other_params = drawTetrahedron(dir, i, other_params);
            setTimeout(step, INTERVAL, fn, i+1, other_params);
        } else {
                var vertices = other_params.vertices;
                var indices = other_params.indices;
                var th = indices.slice(-1)[0];
                console.log(vertices[th[0]], vertices[th[1]], vertices[th[2]], vertices[th[3]]);

            executeButton.disabled = false;
        }
    }
    
    // EVENT HANDLERS

    function generator_init(params) {
//        for (var i = 0; i < 3; i++) {
//            add_vertex(am, 0, i, params);            
//        }
//        return params;
    }

    function onExecute() {
        executeButton.disabled = true;
        generatorFn = compileGenerator(generatorText.value);
        if (!generatorFn) { 
            executeButton.disabled = false;
            return;
        }
        clearAm();
        var wf = document.getElementById('wireframe').checked;
        var bc = document.getElementById('blendcolor').checked;
        var a = document.getElementById('alternate').checked;
        var l = [];
        for(var i = 0; i < 6; i++) {
            l[i] = +document.getElementById('l'+i).value || 1;
            console.log(l[i]);
        }
        create_vertex_mesh(new THREE.Vector3(0,0,0),d3.color("white"));
        create_vertex_mesh(new THREE.Vector3(1,0,0),d3.color("red"));
        create_vertex_mesh(new THREE.Vector3(0,1,0),d3.color("green"));
        create_vertex_mesh(new THREE.Vector3(0,0,1),d3.color("blue"));
        var other_params = initialParameters(new THREE.Vector3(0,0,0),wf,bc,l,a);
//        generator_init(other_params);
        setTimeout(step, INTERVAL, generatorFn, 1, other_params);
    }

    function renderTestGenerators() {
        executeButton.disabled = true;
        var test_gen = [];
        for(var i = 0; i < 4; i++) {
            //            test_gen[i] = "(i) => { const K = "+i+";\n return i<200 ? ((\n(i % K) == 7) ||  ((K % 24) == 8)\n ? 1 : 2 ): -1; }";
            test_gen[i] = (i+0.5)*1+ 0.105;
        }
        clearAm();
        
        test_gen.forEach((x,j) => {
            console.log("calling with x",x);
            followParametricCurve(i => { return parametricCircle_rad(i,x);}, true);
                                 }
        );
    }
    
    function renderTestGenerators_orig() {
        executeButton.disabled = true;
        var test_gen = [];
        for(var i = 0; i < 4; i++) {
            //            test_gen[i] = "(i) => { const K = "+i+";\n return i<200 ? ((\n(i % K) == 7) ||  ((K % 24) == 8)\n ? 1 : 2 ): -1; }";
            test_gen[i] = "(i) => { const K = "+(i+20)+";\n return i<200 ? ((((i % K) == K-1) || ((i % K) == K-2) )? 1 : 2 ): -1; }";            
        }
        clearAm();
        var wf = document.getElementById('wireframe').checked;
        var bc = document.getElementById('blendcolor').checked;
        test_gen.forEach( (x,i) => 
                            {
                                console.log("XXXX",x,i);
                                generatorFn = compileGenerator(x);
                                if (!generatorFn) { 
                                    executeButton.disabled = false;
                                    return;
                                }
                                // clearAm();
                                console.log("AAA");
                                const square = 3;
                                var y = Math.floor(i / square);
                                var x = i % square;
                                const space = 10;
                                var l = [];
                                for(var i = 0; i < 6; i++) {
                                    l[i] = document.getElementById('l'+i).value || 1;
                                }

                                var other_params = initialParameters(new THREE.Vector3(x*space -(space/2),5,y*space - (space/2)),wf,bc,l);

                                setTimeout(step, INTERVAL, generatorFn, 0, other_params);
                            });
    }
    
        
    function onGeneratorChanged() {
        funcStatus.innerHTML = '';
        generatorText.value = EXAMPLE_GENERATORS[generatorsSelector.value].src || '';
    }
    
    // HELPER FUNCTIONS
    
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

    // return true iff lpt is inside the tetrahedron formed
    // by a,b,c,d
    // https://stackoverflow.com/questions/25179693/how-to-check-whether-the-point-is-in-the-tetrahedron-or-not
    function SameSide(v1, v2, v3, v4, p)
    {
        var v21 = v2.clone();
        v21.sub(v1);
        var v31 = v3.clone();
        v31.sub(v1);
        var normal = new THREE.Vector3();
        normal.crossVectors(v21,v31);
        //        var normal = cross(v2 - v1, v3 - v1);
        var v41 = v4.clone();
        v41.sub(v1);
        
        var dotV4 = normal.dot(v41);
        var p_v1 = p.clone();
        p_v1.sub(v1);
        var dotP = normal.dot(p_v1);

        var r = (Math.sign(dotV4) == Math.sign(dotP));
        return r;
    }
    function test_SameSide() {
        var c = [];
        c[0] = new THREE.Vector3(0, 0, 0);
        c[1] = new THREE.Vector3(1, 0, 0);
        c[2] = new THREE.Vector3(0, 1, 0);
        c[3] = new THREE.Vector3(0, 0, 1);
        var psam = new THREE.Vector3(2, 2, 2);
        var pnsam = new THREE.Vector3(2, 2, -2);        
        console.assert(SameSide(c[0],c[1],c[2],c[3],psam));
        console.assert(!SameSide(c[0],c[1],c[2],c[3],pnsam));
        var small = new THREE.Vector3(2, 2, 2);
        console.assert(SameSide(c[0],c[1],c[2],c[3],small));        
    }
    test_SameSide();
    
    
    function pointIsInsideTetPnts(p, v1,v2,v3,v4) {
        var A =  SameSide(v1, v2, v3, v4, p);
        var B = SameSide(v2, v3, v4, v1, p);
        var C = SameSide(v3, v4, v1, v2, p);
        var D = SameSide(v4, v1, v2, v3, p);
        return A && B && C && D;

    }

    function test_pointIsInsideTet() {
        var c = [];
        c[0] = new THREE.Vector3(0, 0, 0);
        c[1] = new THREE.Vector3(1, 0, 0);
        c[2] = new THREE.Vector3(0, 1, 0);
        c[3] = new THREE.Vector3(0, 0, 1);
        var pin = new THREE.Vector3(0.1, .1, 0.1);
        var pout = new THREE.Vector3(2,2,2);        
        
        console.assert(pointIsInsideTetPnts(pin,c[0],c[1],c[2],c[3]));
        
        console.assert(!pointIsInsideTetPnts(pout,c[0],c[1],c[2],c[3]));        
    }

    function addDebugSphere(am,pos,color) {
        if (!color) {
            color = "yellow";
        }
        var mesh = createSphere(am.JOINT_RADIUS/5, pos, color);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.debugObject = true;
        am.scene.add(mesh);
    }
    function pointIsInsideTet(lpt, tc, params) {
        var N = params.vertices.length - 1;
        var prev = params.prev;
        var vs = [];
        vs[0] = params.vertices[prev[0]];
        vs[1] = params.vertices[prev[1]];
        vs[2] = params.vertices[prev[2]];
        // This is the most recently added point.
        vs[3] = params.vertices[prev[3]];
        return pointIsInsideTetPnts(lpt,vs[0],vs[1],vs[2],vs[3]);
    }
    test_pointIsInsideTet();

    // PARAMETRIC CURVE FUNCTIONALITY

    // lpt is a Vector3. tc is the index
    // return value if very weird here, since we have cases.
    function nextParametricTet(lpt, tc,params) {
        if (pointIsInsideTet(lpt, tc,params)) { return "INSIDECURRENT"; }
        var debug = false;
        if (debug) addDebugSphere(am,lpt,"white");
        var prev = params.prev;
        var vs = [];
        vs[0] = params.vertices[prev[0]];
        vs[1] = params.vertices[prev[1]];
        vs[2] = params.vertices[prev[2]];
        // This is the most recently added point.
        vs[3] = params.vertices[prev[3]];

        // Face and direction 0 are OPPOSITE vertex 0.
        // Face and direction 3 are GOING BACKWARD.

        var te = 1.0;
        var valid = { v: true };        
        var v0 = find_fourth_point_given_three_points_and_three_distances(
            CHIRALITY_CCW,
            vs[1], vs[2], vs[3],
            te, te, te,
            valid);
        console.assert(valid.v);

        if (debug) addDebugSphere(am,v0,"green");
        
        if (pointIsInsideTetPnts(lpt,v0,vs[1],vs[2],vs[3])) {
            console.log("return",lpt,0);
            return 0;
        }

        // I don't know why I need this chirality change, but I do.
        var v1 = find_fourth_point_given_three_points_and_three_distances(
            CHIRALITY_CCW,
             vs[2],vs[0], vs[3],            
            te, te, te,
            valid);
        console.assert(valid.v);
        if (debug) addDebugSphere(am,v1,"blue");        
        
        if (pointIsInsideTetPnts(lpt,vs[0],v1,vs[2],vs[3])) {
            console.log("return",lpt,1);            
            return 1;
        }
        
        var v2 = find_fourth_point_given_three_points_and_three_distances(
            CHIRALITY_CCW,
            vs[0], vs[1], vs[3],
            te, te, te,
            valid);
        console.assert(valid.v);
        
        if (pointIsInsideTetPnts(lpt,vs[0],vs[1],v2,vs[3])) {
            console.log("return",lpt,2);                        
            return 2;
        }

        if (debug) addDebugSphere(am,v2,"red");                

        var v3 = find_fourth_point_given_three_points_and_three_distances(
            CHIRALITY_CCW,
            vs[0], vs[1], vs[2],            
            te, te, te,
            valid);
        console.assert(valid.v);

        addDebugSphere(am,v3,"gray");
        
        if (pointIsInsideTetPnts(lpt,vs[0],vs[1],vs[2],v3)) {
            console.log("CURVE WENT BACKWARD!");
            return 3;
        }
        console.log("NORREACH",lpt);
        // otherwise we can't reach it in one...
        return "NOREACH";
        
        // var tcLeft = [ tc[0]-1, tc[1] ];
        // if (pointIsInsideTriangle(lpt, tcLeft)) { return tcLeft; }
        // else {
        //     var tcRight = [ tc[0]+1, tc[1] ];
        //     if (pointIsInsideTriangle(lpt, tcRight)) { return tcRight; }
        //     else {
        //         var tcAboveOrBelow = triangleIsUp(tc[0], tc[1]) ? [ tc[0], tc[1]-1 ] : [ tc[0], tc[1]+1 ];
        //         if (pointIsInsideTriangle(lpt, tcAboveOrBelow)) { return tcAboveOrBelow; }
        //         else {
        //             funcStatus.innerHTML = "Parametric curve point is unreachable.";
        //             return false;
        //         }
        //     }
        // }
    }


    function test_nextParametricTet() {
        var initialPt = new THREE.Vector3(0,0,0);
        var offset = new THREE.Vector3(initialPt.x-0.5,
                                       initialPt.y-(Math.sqrt(3) / 2)/2,
                                       initialPt.z-0.2);
        
        var wf = document.getElementById('wireframe').checked;
        var bc = document.getElementById('blendcolor').checked;
        var l = [];
        for(var i = 0; i < 6; i++) {
            l[i] = document.getElementById('l'+i).value || 1;
        }

        var params = initialParameters(offset,wf,bc,l);
        add_vertex(am,0,3,params);
        var prev = params.prev;
        var vs = [];
        console.log(prev);
        console.log(params);
        console.log(params.vertices);
        vs[0] = params.vertices[prev[0]];
        vs[1] = params.vertices[prev[1]];
        vs[2] = params.vertices[prev[2]];
        // This is the most recently added point.
        vs[3] = params.vertices[prev[3]];

        // A should be the midpoint of 2 and 3
        var A = new THREE.Vector3(0,0,0);
        A.add(vs[1]);
        A.add(vs[2]);
        A.multiplyScalar(0.5);
        A.x += 0.0;
        A.y += 0.1;
        A.z += 0.2;                

        addDebugSphere(am,A,"red");
        console.log("vs[1],vs[2]",vs[1],vs[2]);
        console.log("A",A);
        var nt = nextParametricTet(A, 3 ,params);
        console.log("nt",nt);
        console.assert(0 == nt );        
        // var B = new THREE.Vector3(0,0,0);
        // console.assert(nextParametricTet(B, 3 ,params) );                 var C = new THREE.Vector3(0,0,0);
        // console.assert(nextParametricTet(C, 3 ,params) );
        clearAm();        
    }
    test_nextParametricTet();


    // These are hard-wired test functions, not fully parametrized.
    // They were taken from the 2D case, but planar figures
    // are of great interest in the 3D world.
    // At present, I will place all of these at Z = 0.
    // I will probably change the format to have a definite end
    // point and a definite start point and move the point along
    // the unit interval later.
    var MAX_X = 10.0; // These have a different meaning here in 3space
    var MAX_Y = 10.0; // These have a different meaning here in 3space
    function polarToXY(r, theta) {
        return [ r*Math.cos(theta), r*Math.sin(theta) ];
    }
    function parametricCircle_rad(i,r) {        
        if (i>=360) { return false; }
        var theta = i/360*2*Math.PI;
        var radius = r;
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta);
        return new THREE.Vector3(x,y,0);
//        return [x,y];
        }
    function parametricCircle(i) {
        return parametricCircle_rad(i,(MAX_X * 0.75) + 0.001);          
    }
                                      
    function parametricHelix(i) {
        if (i>=720) { return false; }
        var j = i * 10;
        var theta = j/360*2*Math.PI;
        var radius = 2;
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta);
        var z = j/320;
        return new THREE.Vector3(x,y,z);
    }
    function parametricCone(i) {
        if (i>=360) { return false; }
        var j = i * 10;
        var theta = j/360*2*Math.PI;
        var radius = 1 + (i/120);
        var x = radius * Math.cos(theta);
        var y = radius * Math.sin(theta);
        var z = j/319;
        return new THREE.Vector3(x,y,z);
    }

    // Takes integer i parameter 0,1,2,..., returns [x,y] curve coordinate.
    function parametricGoldenSpiral(i) {
        const phi = (1 + Math.sqrt(5))/2.0;
        const contraction = 2;
        var theta = i*0.05;
        var r = Math.pow(phi, theta*2/Math.PI)/contraction;
        var lpt = polarToXY(r, theta);
        return new THREE.Vector3(lpt[0],lpt[1],0);        
//        return [ lpt[0]+3, lpt[1]+2 ]; // Shift up and right to see more spiral
    }

    // Takes integer i parameter 0,1,2,..., returns [x,y] curve coordinate.
    function parametricSineWave(i) {
        if (i>360) { return false; }
        var frac = i/360; // fraction between 0-1.
        var x = -0.75 * MAX_X + frac * 1.5 * MAX_X + 0.1;
        var y = Math.sin(frac * 2*Math.PI) * MAX_Y * 0.75;
        return new THREE.Vector3(x,y,0);                
//        return [x,y];
    }

    // This is much tricker in 3D than in two.
    // THREE.js has sophsticated splines and curvepath
    // objects that could be used to both represent and
    // render our relatively primite parametric curves.
    // It unclear to me if using them is better than
    // using a polyline or a collection of dots.
    function renderParametricCurve(am,curveFn, open) {
        var onCanvas = true;
//        var points = [];
        var points3D = new THREE.Geometry();

        
        for (var i=0; i<MAX_PARAMETRIC_STEPS && onCanvas; i++) {
            const lpt = curveFn(i);
            // drawSpot(lpt[0], lpt[1], 'black', 1);
            if (lpt) {
//                points.push(lpt);
                points3D.vertices.push(lpt);
            }
        }
        // for now, test with fake data...
        // points3D.vertices.push(        
        //     new THREE.Vector3(0, 0, 0.5),
        //     new THREE.Vector3(2, 0, 1),
        //     new THREE.Vector3(2, 2, 2),
        //     new THREE.Vector3(0, 2, 3),
        //     new THREE.Vector3(0, 0, 0.5) // there is no autoClose function here, thus we need the fifth point
        // );
        var line2 = new THREE.Line(points3D, new THREE.LineBasicMaterial({color: "red"}));
        am.scene.add(line2);

    }

    // This is an attempt to follow David Jeschke's code
    // from the 2D solution.
    function followParametricCurve(curveFn, open) {
//    two.clear();
        //    drawEmptyGrid();
        clearAm();

    var i = 0;
    var initialPt = curveFn(i);
    // if (!initialPt || !logicalPointIsVisible(initialPt)) {
    //     funcStatus.innerHTML = "Initial point of parametric curve is not visible.";
    //     return;
    // }
    if (!initialPt) {
         return;
    }


        // Although debatable, we will basically create the
        // first tet centered on initialPot
        // We will move this over a little to get it in the center.
        var offset = new THREE.Vector3(initialPt.x-0.5,
                                       initialPt.y-(Math.sqrt(3) / 2)/2,
                                       initialPt.z-0.5);
        
        var wf = document.getElementById('wireframe').checked;
        var bc = document.getElementById('blendcolor').checked;
        var l = [];
        for(var i = 0; i < 6; i++) {
            l[i] = document.getElementById('l'+i).value || 1;
        }
        var params = initialParameters(offset,wf,bc,l);
    
//    var tc = triangleCoordsFromLogicalPt(initialPt); // current triangle coordinates.
//    ;;    drawTriangle(tc[0], tc[1], RED);
    
    // We will have to use "vertices" for this.
//    const occupiedTets = [ tc ];

    // This is the index in params of the highest-numbered vertex
    // in the tet we are producing
    // intialParameters adds an initial triangle, we will
    // go ahead and add a value here to have tet to start with.
    add_vertex(am,0,3,params);
    var tci = 3;

    for ( ; true; i+=1) {

        var lpt = curveFn(i);
        if (!lpt) { /* we are done! */ break; }

        //        tcNext = nextParametricTriangle(lpt, tc);
        
        // We will mark a tet by it's highest number vertex.
        var tetNext = nextParametricTet(lpt,tci,params);
        if (tetNext == "INSIDECURRENT") {
            continue;
        }


        var last_i = i-1;
        var next_i = i;
        var j = 0;
        for ( ; (tetNext == "NOREACH") && next_i > last_i && j<PARAMETRIC_BISECTION_LIMIT; j++) {

            // var tc2 = triangleCoordsFromLogicalPt(lpt); // For debugging output only.
            // console.log("Bisect r" + j + "(" + lpt[0] + ", " + lpt[1] + "), T(" + tc[0] + ", " + tc[1] + ") (" + tc2[0] + ", " + tc2[1] + ")");

            i = (next_i+last_i)/2;
            lpt = curveFn(i);
            if (!lpt) {
                break;
            }
            tetNext = nextParametricTet(lpt, tci,params);
            if (tetNext == "INSIDECURRENT") {
                console.log("Bisecting at " + i + "[" + (next_i-last_i) + "]. Same triangle.");
                last_i = i; tetNext = "NOREACH";
            }
            else if (tetNext == "NOREACH") {
                console.log("Bisecting at " + i + "[" + (next_i-last_i) + "/" + next_i + "]. Not adjacent.");
                next_i = i
            }
        }
        if (tetNext == "NOREACH") {
            if (j>=PARAMETRIC_BISECTION_LIMIT) {
                funcStatus.innerHTML = "Parametric bisection algorithm reached limit.";
            } else {
                funcStatus.innerHTML = "Parametric bisection algorithm failed.";
            }
            break;
        }

        // TODO: Handle case where self collision happens because we returned to the starting point
        // in a closed curve. I am going to comment out.
        // if (triangleIsOccupied(occupiedTriangles, tcNext[0], tcNext[1])) {
        //     funcStatus.innerHTML = "Self-collision at p(" + i + ") = (" + lpt[0] + ", " + lpt[1] + ") / (" + tcNext[0] + ", " + tcNext[1] + ")";
        //     break;
        // }

        
        //        tc = tetNext;

        add_vertex(am, tetNext, tci+1, params);
        
        tci++;
        
        // const color = RAINBOW_COLORS[occupiedTriangles.length%RAINBOW_COLORS.length];
        // drawTriangle(tc[0], tc[1], color);
        // occupiedTriangles.push(tc);
    }

        
        renderParametricCurve(am,curveFn,open);
    }

    function helix_parameters(alpha, theta, L) {
        var a = L * Math.cos(alpha);
        var x = L + 2*a;
        var z = L * Math.sin(alpha);
        var w = z * Math.sin(theta);
        var h = Math.sqrt(z*z - w*w);
        var D = Math.sqrt(4*w*w + x*x);
        var phi = Math.arctan(z/L);
        var E = (D/2)*Math.sin(ph) + psi
        var F = Math.sin(phi);
        var r = 2*Math.pow(F,3/2)/Math.sqrt(3F-E);
        var iv = F*F(F+E)/(E-3F);
        var t0= -2 * Math.arctan(x)*(r+Math.sqrt(iv));
        var k = L/(4*Math.arctan((r+Math.sqrt(iv))/F));
        return [r,k,t0];
    }

    // MATH FOR STACKING HELIX
    function stackingHelixTable() {
        var tab = document.getElementById('stacking_table');
        function addRow(table,alpha,theta,radius, kappa, t0) {
            var row = table.insertRow(1);

// Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
            var cell0 = row.insertCell(0);
            cell0.innerHTML = alpha;
            var cell1 = row.insertCell(1);
            cell1.innerHTML = theta;
            var cell2 = row.insertCell(2);
            cell2.innerHTML = radius;            
            var cell3 = row.insertCell(3);
            cell3.innerHTML = kappa;            
            var cell4 = row.insertCell(4);
            cell4.innerHTML = t0;            
// Add some text to the new cells:
        }
        var alpha = 0;
        var theta = 0;
        var radius = 0;
        var kappa = 0;
        var t0 = 0;
        var L = 0;
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; jk++) {
                var res = helix_parameters(i*10*Math.PI/180,j*10*Math.PI/180,L);
                    addRow(tab,alpha,theta,res[0],res[1],res[2]);                
            }
        }

    }
})();

