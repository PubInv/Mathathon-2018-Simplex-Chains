var tm = UGLY_GLOBAL_SINCE_I_CANT_GET_MY_MODULE_INTO_THE_BROWSER;
var OPERATION = "normal"; // "normal" or "helices"

$("input[type='radio']").checkboxradio();

var OPTIMALITY = true;
function handleOptimalityChange(e) {
    var target = $(e.target);
    OPTIMALITY = (target[0].id == "optimal-1");
    if (OPTIMALITY) {
        HELIX_RADIUS = tm.optimal_radius(RAIL_ANGLE_RHO * Math.PI / 180, TET_DISTANCE);
        $("#helix_radius").slider('value', HELIX_RADIUS.toFixed(4));
        $("#helix_radius_val").val(HELIX_RADIUS.toFixed(4));
    }
    draw_central();
    console.log(OPTIMALITY);
    return true;
}

$("[name='optimal']").on("change", handleOptimalityChange);

const CHIRALITY_CCW = 1;
const CHIRALITY_CW = 0;

function handleChiralityChange(e) {
    var target = $(e.target);
    CHIRALITY_CCW = (target[0].id == "chi-1") ? -1 : 1;
    draw_central();
    console.log(CHIRALITY_CCW);
    return true;
}

$("[name='chi']").on("change", handleChiralityChange);

var RAIL_ANGLE_RHO_d = tm.BCrho * 180 / Math.PI;
var LAMBDA = 0;
var TET_DISTANCE = 0.5;
var HELIX_RADIUS = tm.optimal_radius(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
var MIN_PITCH = tm.pitch_min(TET_DISTANCE);
var MAX_PITCH = 30;
var ADD_PITCH = tm.pitchForOptimal(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE) - MIN_PITCH;
var PITCH = MIN_PITCH + ADD_PITCH;



$("#pitch_input").val(ADD_PITCH.toFixed(4));
$("#pitch_input_min").val(MIN_PITCH.toFixed(4));
$("#actual_pitch").val(PITCH.toFixed(4));


$("#tet_pitch").val((PITCH / (tm.find_drho_from_r_el(RAIL_ANGLE_RHO_d * Math.PI / 180, HELIX_RADIUS, TET_DISTANCE))).toFixed(4));

var origin = [0, 0];

function show_pitch() {
    if (RAIL_ANGLE_RHO_d < 0.3) {
        $("#pitchundefined").show();
        $("#validpitch").hide();
    } else {
        $("#pitchundefined").hide();
        $("#validpitch").show();
    }
}

show_pitch();
$(function () {
    $("#rail_angle_slider").slider({
        range: "max",
        min: 0,
        max: tm.BCrho * 180 / Math.PI,
        value: RAIL_ANGLE_RHO_d,
        step: 0.001,
        slide: function (event, ui) {
            $("#rail_angle_rho").val(ui.value);
            RAIL_ANGLE_RHO_d = ui.value;
            show_pitch();
            if (OPTIMALITY) {
                HELIX_RADIUS = tm.optimal_radius(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
                $("#helix_radius").slider('value', HELIX_RADIUS.toFixed(4));
                $("#helix_radius_val").val(HELIX_RADIUS.toFixed(4));
                if (RAIL_ANGLE_RHO_d != 0); {
                    PITCH = tm.pitchForOptimal(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
                    ADD_PITCH = PITCH - MIN_PITCH;
                }
                $("#pitch_input").val(ADD_PITCH.toFixed(4));
                $("#pitch_input_min").val(MIN_PITCH.toFixed(4));
                $("#actual_pitch").val(PITCH.toFixed(4));
                $("#tet_pitch").val((PITCH / (tm.find_drho_from_r_el(RAIL_ANGLE_RHO_d * Math.PI / 180, HELIX_RADIUS, TET_DISTANCE))).toFixed(4));
                $("#pitch_input_slider").slider('value', ADD_PITCH.toFixed(4));
            }
            draw_central();
        }
    });
    $("#rail_angle_rho").val($("#rail_angle_slider").slider("value"));
});


// A pitch too big produces and Equitetrabeam....there is no provision in here
// for that.  Also, very small pitches are deeply weird.
// In the case of optimality we should limit the Rail angle to the BC Continuum.
$(function () {
    $("#pitch_input_slider").slider({
        range: "max",
        min: 0,
        max: 30,
        value: ADD_PITCH,
        step: 0.01,
        slide: function (event, ui) {
            $("#pitch_input").val(ui.value);
            ADD_PITCH = ui.value;
            PITCH = MIN_PITCH + ADD_PITCH;
            $("#actual_pitch").val(PITCH.toFixed(4));
            $("#tet_pitch").val((PITCH / (tm.find_drho_from_r_el(RAIL_ANGLE_RHO_d * Math.PI / 180, HELIX_RADIUS, TET_DISTANCE))).toFixed(4));

            $("#pitch_input").val(ADD_PITCH.toFixed(4));
            if (OPTIMALITY) {
                var rho_for_pitch_radians =
                    newtonRaphson((x) => (tm.pitchForOptimal(x, TET_DISTANCE) - PITCH), RAIL_ANGLE_RHO_d * Math.PI / 180);
                RAIL_ANGLE_RHO_d = rho_for_pitch_radians * 180 / Math.PI;
                $("#rail_angle_slider").slider('value', RAIL_ANGLE_RHO_d.toFixed(4));
                $("#rail_angle_rho").val(RAIL_ANGLE_RHO_d.toFixed(4));

                HELIX_RADIUS = tm.optimal_radius(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
                $("#helix_radius").slider('value', HELIX_RADIUS.toFixed(4));
                $("#helix_radius_val").val(HELIX_RADIUS.toFixed(4));
            } else {
                // here we want to make sure the pitch matches PITCH by changing the TET_DISTANCE.
                var dopt = tm.optimal_distance(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
                var desired_d = (RAIL_ANGLE_RHO_d * Math.PI / 180) * PITCH / (2 * Math.PI);
                var len = Math.sqrt(desired_d * desired_d +
                    4 * HELIX_RADIUS * HELIX_RADIUS *
                    Math.sin(RAIL_ANGLE_RHO_d * Math.PI / (2 * 180)) * Math.sin(RAIL_ANGLE_RHO_d * Math.PI / (2 * 180)));
                console.log("NEW LEN", desired_d, len, TET_DISTANCE);
                TET_DISTANCE = len;
                $("#tet_distance_val").val(TET_DISTANCE.toFixed(4));
                $("#tet_distance").slider('value', TET_DISTANCE.toFixed(4));
            }
            draw_central();
        }
    });
    $("#pitch_input").val($("#pitch_input_slider").slider("value"));
});

$(function () {
    $("#tet_distance").slider({
        range: "max",
        min: 0,
        max: 3,
        value: TET_DISTANCE,
        step: 0.01,
        slide: function (event, ui) {
            $("#tet_distance_val").val(ui.value);
            TET_DISTANCE = ui.value;
            MIN_PITCH = tm.pitch_min(TET_DISTANCE);
            PITCH = MIN_PITCH + ADD_PITCH;
            $("#pitch_input_slider").slider('option', { min: 0, max: MAX_PITCH });
            $("#pitch_input_min").val(MIN_PITCH.toFixed(4));
            $("#actual_pitch").val(PITCH.toFixed(4));
            $("#tet_pitch").val((PITCH / (tm.find_drho_from_r_el(RAIL_ANGLE_RHO_d * Math.PI / 180, HELIX_RADIUS, TET_DISTANCE))).toFixed(4));
            if (OPTIMALITY) {
                HELIX_RADIUS = tm.optimal_radius(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE);
                $("#helix_radius").slider('value', HELIX_RADIUS.toFixed(4));
                $("#helix_radius_val").val(HELIX_RADIUS.toFixed(4));

                $("#pitch_input_slider").slider('value', tm.pitchForOptimal(RAIL_ANGLE_RHO_d * Math.PI / 180, TET_DISTANCE).toFixed(4));
            }
            draw_central();
        }
    });
    $("#tet_distance_val").val($("#tet_distance").slider("value"));
});

$(function () {
    $("#helix_radius").slider({
        range: "max",
        min: 0.0,
        max: 3,
        value: HELIX_RADIUS,
        step: 0.01,
        slide: function (event, ui) {
            $("#helix_radius_val").val(ui.value);
            HELIX_RADIUS = ui.value;
            if (OPTIMALITY) {
                // here we must compute the optimal The Rail Angle...
                var rho = RAIL_ANGLE_RHO_d * Math.PI / 180;
                var opt_el_for_this_radius =
                    newtonRaphson((x) => (tm.optimal_radius(rho, x) - HELIX_RADIUS), rho);
                console.log("optimum edge:", opt_el_for_this_radius);
                TET_DISTANCE = opt_el_for_this_radius;
                $("#tet_distance_val").val(TET_DISTANCE.toFixed(4));
                $("#tet_distance").slider('value', TET_DISTANCE.toFixed(4));

            }
            draw_central();
        }
    });
    $("#helix_radius_val").val($("#helix_radius").slider("value"));
});


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
    var len = d + -am.JOINT_RADIUS * 2;
    var quat = new THREE.Quaternion();

    var d = new THREE.Vector3(b_z.x, b_z.y, b_z.z);
    d.sub(b_a);
    d.divideScalar(2);
    d.add(pos);
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
function load_NTetHelixAux(am, helix, tets, pvec, coords) {
    var colors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Blue")];
    var darkgreen = d3.color("#008000");
    var dcolor = [null, darkgreen, d3.color("purple")];

    var n = tets + 3;
    var base = get_base();
    var vertices = [];
    var indices = [];
    var prev = [];
    for (var i = 0; ; i++) {
        var v;
        var c;
        var th;
        if (i < 3) {
            v = base.v[i];
            switch (i) {
                case 0: th = [0, 0, 0, i]; c = [0, 0, 0, base.vc[i]]; break;
                case 1: th = [0, 0, 0, i]; c = [base.ec[0], 0, 0, base.vc[i]]; break;
                case 2: th = [1, 0, 0, i]; c = [base.ec[1], base.ec[2], 0, base.vc[i]]; break;
            }
            vertices.push(v);
            indices.push(th);
            console.log("" + i + " th " + th);
        }
        else {
            if (i == 3)
                th = [0, 1, 2, 3];
            else {
                var d = get_direction(i - 3, vertices, indices);
                switch (d) {
                    case -1: return;
                    case 0: th = [prev[1], prev[2], prev[3], i]; break;
                    case 1: th = [prev[0], prev[3], prev[2], i]; break;
                    case 2: th = [prev[3], prev[0], prev[1], i]; break;
                    case 3: th = [prev[2], prev[1], prev[0], i]; break;
                }
            }
            console.log(d);
            console.log("" + i + " th " + th);
            console.log(vertices[th[0]]);
            console.log(vertices[th[1]]);
            console.log(vertices[th[2]]);
            v = get_vertex(i, vertices, indices, vertices[th[0]], vertices[th[1]], vertices[th[2]]);
            vertices.push(v);
            indices.push(th);
            c = get_colors(i, vertices, indices);
        }
        console.log("Vertex " + i + " Color " + c[3].hex());
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

        for (var k = 0; k < Math.min(3, i); k++) {
            //            var h = i-(k+1);

            // Sadly, increasing the mass of the members seems to be
            // necessary to keep the edges from passing through the obstacles.
            // This is a very unfortunate tuning...I suspect it is a weakness
            // in the solver of physics engine.
            var pos = new THREE.Vector3();
            var quat = new THREE.Quaternion();

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
            quat.set(0, 0, 0, 1);

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
                if (helix.helix_members[x].body.name == memBody) {
                    helix.helix_member.splice(x, 1);
                }
            }
            var link = { a: b_a, b: b_z, body: memBody };
            helix.helix_members.push(link);
            am.push_body_mesh_pair(memBody, mesh);
        }
        console.log("th " + th);
        prev = th;
    }
}

function get_random_int(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function get_direction(n, v, i) {
    if (n < 10)
        return get_random_int(3);
    else return -1;
}

function get_vertex(n, v, i, pa, pb, pc) {
    var valid = { v: true };
    var ad = 1;
    var bd = 1;
    var cd = 1;
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
cs[1] = new THREE.Vector3(1, 0, 0);
cs[2] = new THREE.Vector3(.5, Math.sqrt(3) / 2, 0);

// v [a, b, c], vc[a, b, c], ec[ab, bc, ac]
function get_base() {
    return { v: cs, vc: [colors[3], colors[3], colors[3]], ec: [colors[4], colors[4], colors[4]] };
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

function add_equitetrabeam_helix(am, chi, lambda, rho, radius, pvec, len) {
    am.helices.push(
        {
            helix_joints: [],
            helix_members: []
        });
    var onehop = tm.one_hop(radius, rho, len);
    var twohop = tm.two_hop(radius, rho, len);
    var d = tm.find_drho_from_r_el(rho, radius, len);
    var pitch = 2 * Math.PI * d / rho;
    am.helix_params.push({
        rho: rho,
        len: len,
        chirality: chi,
        radius: radius,
        onehop: onehop,
        twohop: twohop,
        d: d,
        pitch: pitch,
        lambda: lambda
    });

    var hp = am.helix_params.slice(-1)[0];
    load_NTetHelix(am, am.helices.slice(-1)[0],
        am.NUMBER_OF_TETRAHEDRA,
        pvec, hp);
    //    build_central();    
    return hp;
}

initiation_stuff();

init();
animate();

// var len = am.INITIAL_EDGE_LENGTH;


function compute_helix_minimax(helix) {
    var min = 100000000;
    var max = 0.0;
    for (var i = 0; i < Math.min(helix.helix_members.length, 100); i++) {
        var member = helix.helix_members[i];
        var a = member.a.mesh.position;
        var b = member.b.mesh.position;
        var d = a.distanceTo(b);
        if (i < 100) {
            //	    console.log("member:",i);
            //	    console.log("a:",member.a.mesh.position);
            //	    console.log("b:",member.b.mesh.position);
            var q0 = 180 * Math.atan2(member.a.mesh.position.x,
                member.a.mesh.position.y) / Math.PI;
            var q1 = 180 * Math.atan2(member.b.mesh.position.x,
                member.b.mesh.position.y) / Math.PI;

            //	    console.log("distance:",d,q1-q0);
        }

        if (min > d) min = d;
        if (max < d) max = d;
    }
    //    console.log("min, max", min, max);
    //    console.log("score: ", (100*max/min -100) + "%");

    return [min, max, (100 * max / min - 100)];
}


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
    // var h = am.helices.slice(-1)[0];
    // var score = compute_helix_minimax(h)[2];
    // hp.score = score;
    // hp.inradius = tm.inradius_assumption1(hp.rho,hp.radius);
    // register_trials(trial++,OPTIMALITY,RAIL_ANGLE_RHO_d,HELIX_RADIUS,hp.d,TET_DISTANCE,
    //     	    hp.onehop,
    //     	    hp.twohop,
    //     	    hp.pitch,
    //     	    hp.inradius,
    //     	    hp.score);
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




// This is an experiment. Instead of generating a tetrahelix chain
// by on the surface of a cylinder via my formulae, I'm going to
// begin computation, starting with a single tetrahedron.

// This routine is an attempt to build a proper mesh construction
// from coordinates for the nodes. After this, we will have
// to do the same thing from face-determinations and length functions.
function draw_generated(pvec, coords, helix) {
    var n = coords.length;
    var colors = [d3.color("DarkRed"), d3.color("DarkOrange"), d3.color("Blue")];
    var darkgreen = d3.color("#008000");
    var dcolor = [null, darkgreen, d3.color("purple")];

    for (var i = 0; i < n; i++) {
        //	var myRho = rho;
        var rail = i % 3;
        var num = Math.floor(i / 3);
        //	var q = tm.H_general(chi,num,rail,myRho,d,radius);
        //	var v = new THREE.Vector3(q[0], q[1], q[2]);
        v = coords[i];
        v = v.add(pvec);

        var pos = new THREE.Vector3();
        pos.set(v.x, v.y, v.z);
        var mesh = createSphere(am.JOINT_RADIUS, pos, smats[rail]);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        am.scene.add(mesh);

        var body = {};
        body.rail = rail;
        body.number = i / 3;
        body.name = alphabetic_name(i);
        body.mesh = mesh;
        helix.helix_joints.push(body);
        am.push_body_mesh_pair(body, mesh);

        for (var k = 0; k < Math.min(3, i) && k < i; k++) {
            var h = i - (k + 1);

            // Sadly, increasing the mass of the members seems to be
            // necessary to keep the edges from passing through the obstacles.
            // This is a very unfortunate tuning...I suspect it is a weakness
            // in the solver of physics engine.
            var pos = new THREE.Vector3();
            var quat = new THREE.Quaternion();

            var b_z = helix.helix_joints[i];
            var b_a = helix.helix_joints[h];
            var o_a = b_a.mesh.position;
            var o_z = b_z.mesh.position;

            var v_z = new THREE.Vector3(o_a.x, o_a.y, o_a.z);
            var v_a = new THREE.Vector3(o_z.x, o_z.y, o_z.z);
            var dist = v_a.distanceTo(v_z);

            var v_avg = new THREE.Vector3(v_z.x, v_z.y, v_z.z);
            v_avg.add(v_a);
            v_avg.multiplyScalar(0.5);

            pos.set(v_avg.x, v_avg.y, v_avg.z);
            quat.set(0, 0, 0, 1);

            var diff = ((b_a.rail - b_z.rail) + 3) % 3;
            var cmat;
            var tcolor;
            if (diff != 0) {
                if (OPERATION == "helices") {
                    // What we really want to do here is to interpolate the
                    // color of the end nodes!
                    tcolor = new THREE.Color(0x008800);
                    cmat = memo_color_mat(tcolor);
                } else {
                    if (diff == 2) {
                        tcolor = new THREE.Color(0x9400D3);
                        cmat = memo_color_mat(tcolor);
                    }
                    if (diff == 1) {
                        tcolor = new THREE.Color(0x008000);
                        cmat = memo_color_mat(tcolor);
                    }
                }
            } else {
                var cm = smats[b_a.rail]
                cmat = new THREE.MeshPhongMaterial({ color: cm });
            }
            var member_color = (diff != 0) ? dcolor[diff] : colors[b_a.rail];

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
                if (helix.helix_members[x].body.name == memBody) {
                    helix.helix_member.splice(x, 1);
                }
            }
            var link = { a: b_a, b: b_z, body: memBody };
            helix.helix_members.push(link);
            am.push_body_mesh_pair(memBody, mesh);
        }
    }
}
function renderComputedObsolete() {
    var pvec = new THREE.Vector3(0, 1, 0);
    am.helices.push(
        {
            helix_joints: [],
            helix_members: []
        });
    var coords = [];

    coords[0] = new THREE.Vector3(0, 0, 0);
    coords[1] = new THREE.Vector3(0, 0, 1);
    coords[2] = new THREE.Vector3(1, 0, 0);
    coords[3] = new THREE.Vector3(0.5, 0.5, 0.5);
    var tets = 1;

    am.INITIAL_EDGE_WIDTH *= 4;
    am.JOINT_RADIUS *= 3;

    load_NTetHelixAux(am, am.helices[0], tets, pvec, coords);
    //    draw_generated(pvec,coords,am.helices[0]);
}

function renderComputed() {
    var pvec = new THREE.Vector3(0, 1, 0);
    am.helices.push(
        {
            helix_joints: [],
            helix_members: []
        });

    am.INITIAL_EDGE_WIDTH *= 4;
    am.JOINT_RADIUS *= 3;

    var cs = [];
    var pa = cs[0] = new THREE.Vector3(-1, 0, 0);
    var pb = cs[1] = new THREE.Vector3(1, 0, 0);
    var pc = cs[2] = new THREE.Vector3(0, 1, 0);
    var valid = { v: true };
    var ad = 1;
    var bd = 1;
    var cd = 1;
    var pd = find_fourth_point_given_three_points_and_three_distances(
        CHIRALITY_CCW,
        pa, pb, pc,
        ad, bd, cd,
        valid);
    cs.push(pd);

    var pe = find_fourth_point_given_three_points_and_three_distances(
        CHIRALITY_CCW,
        pb, pc, pd,
        1, 1, 1,
        valid);
    cs.push(pe);
    var tets = 2;
    load_NTetHelixAux(am, am.helices[0], tets, pvec, cs);
}

// if (OPERATION == "normal") {
//      draw_and_register();
//      // draw_many();


//     for(var i = 0; i < am.helices.length; i++) {
// 	console.log(am.helix_params[i]);
// 	compute_helix_minimax(am.helices[i]);
// 	console.log(am.helix_params[i]);    
//     }
// } else if (OPERATION == "helices") {
//     am.NUMBER_OF_TETRAHEDRA  = 7;
//     am.INITIAL_EDGE_WIDTH /= 0.5;
//     am.JOINT_RADIUS /= 1;
//     //    this.jointGeo = new THREE.SphereGeometry( this.JOINT_RADIUS,32,32);
//     draw_helices();
// }


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
    D = new THREE.Vector3(sx, sy, (sense == CHIRALITY_CCW) ? sz : -sz);
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
    console.log("a0b0c0", a0, b0, c0);

    var xaxis = new THREE.Vector3(1, 0, 0);
    var yaxis = new THREE.Vector3(0, 1, 0);
    var zaxis = new THREE.Vector3(0, 0, 1);

    var b0norm = new THREE.Vector3(b0.x, b0.y, b0.z).normalize();
    console.log("b0norm", b0norm);

    var q = new THREE.Quaternion()
    q.setFromUnitVectors(b0norm, xaxis);
    console.log("quaternion", q);
    var b1 = new THREE.Vector3(b0.x, b0.y, b0.z);
    console.log("b1", b1);
    var c1 = new THREE.Vector3(c0.x, c0.y, c0.z);

    b1 = b1.applyQuaternion(q);

    console.log("b1", b1);
    c1 = c1.applyQuaternion(q);
    // now b1 should be on the x axis..
    console.log("b1", b1);
    var m1 = new THREE.Matrix4();
    m1.setRotationFromQuaternion(q);

    var m2 = new THREE.Matrix4();

    m2.multiplyMatrices(m1, m);
    // m2 applied to our original points should give us b1,c1
    var ct = new THREE.Vector3(pc.x, pc.y, pc.z);
    ct.applyMatrix4(m2);
    console.log("===", ct, c1);


    // Now finally, we need to rotate point c into the xy plane
    var c2 = new THREE.Vector3(pc.x, pc.y, pc.z);


    console.log("c2 first", c2);
    c2.applyMatrix4(m2);

    console.log("c2 trans", c2);

    var theta = Math.atan2(c2.z, c2.y);
    console.log("theta", theta);

    var m3 = new THREE.Matrix4();
    m3.makeRotationX(-theta);

    // If this is applied to C, it should place it in the XY plane (z = 0);
    c2.applyMatrix4(m3);
    console.log("C2 after rotation", c2);

    //    m4.multiplyMatrices(m2,m3);
    //    console.log(m,m3,m4);

    // m4 applied to our stating point must place it in the XY plane
    var c3 = new THREE.Vector3(pc.x, pc.y, pc.z);
    c3.applyMatrix4(m);
    c3.applyMatrix4(m1);
    c3.applyMatrix4(m3);
    console.log("POINT C3 FINAL", c3);

    var c4 = new THREE.Vector3(pc.x, pc.y, pc.z);
    var m4 = new THREE.Matrix4();
    m4.identity()
    m4.premultiply(m);
    m4.premultiply(m1);
    m4.premultiply(m3);
    c4.applyMatrix4(m4);
    console.log("POINT C4 FINAL", c4);

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

(function () {

    $(function () { main(); });

    function main() {
        var executeButton = document.getElementById('execute-button');
        executeButton.addEventListener('click', onExecute);
    }

    function onExecute() {
        alert("Execute pressed!");
    }

})();