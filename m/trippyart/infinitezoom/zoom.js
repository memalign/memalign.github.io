var INFINITEZOOM = (function() {

/*
CAPTURE

ffmpeg -r 25 -i %08d.png -c:v libx264 -preset veryfast -tune animation -crf 23 -pix_fmt yuv420p ../sultan.mp4

ffmpeg -r 30 -i %08d.png -c:v libx264 -preset veryfast -tune animation -crf 23 ../infinitezoom-h264-veryfast-animation.mp4

ffmpeg -r 25 -i %08d.png -c:v libx264 -preset veryfast -tune animation -crf 23 ../infinitezoom_632.mp4

ffmpeg -r 20 -i %08d.png -c:v libx264 -preset veryslow -tune animation -crf 23 ../infinitezoom_632.mp4

ffmpeg -r 30 -i %08d.png ../circles.gif

convert -delay 10 -loop 0 *.png animation.gif
convert -delay 1 -loop 0 *.png ../leaf.gif



*/

// var worldArray = [
// 0	worlds.Leaf,
// 1	worlds.Blossom,
// 2	worlds.Akanthus,
// 3	worlds.Crest,
// 4	worlds.General,
// 5	worlds.Circles,
// 6	worlds.Circuit,
// 7	worlds.Cube,
// 8	worlds.Sultan
// ];

var CAPTURE = false;
var ONECYCLE = true;
var frame = 0;
var capturespeed = 1/20;
// var capturesegments = [0,1,2,3,4,5,6,7,8];
var capturesegments = [0];
var currentsegment = 0;
var capturesegmentlength = 12*30;
// var totalcapturelength = capturesegmentlength * capturesegments.length + (2*30);
// var totalcapturelength = 20;

var video_width = 1920;
var video_height = 1080;
// var video_width = 632;
// var video_height = 354;
// var video_width = 1080;
// var video_height = 1080;
var playback = true;
/*

*/
var colorstyle = 'color';

var width = window.innerWidth;
var height = window.innerHeight;

if (CAPTURE) {
	width = video_width;
	height = video_height;
}

if(window.devicePixelRatio !== undefined) {
    dpr = window.devicePixelRatio;
} else {
    dpr = 1;
}
var size = Math.max(width, height)/4;
var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -500, 1000 );
camera.aspect = width / height;
camera.updateProjectionMatrix();
var scene = new THREE.Scene();
var clock = new THREE.Clock(true);
var renderer = new THREE.WebGLRenderer({ precision: "lowp", devicePixelRatio:dpr, antialias:false });
var lastrandom = Math.random();
renderer.setSize(window.innerWidth, window.innerHeight);
// this.renderer.setPixelRatio(window.devicePixelRatio);

renderer.setClearColor( '#ffffff' );
document.body.appendChild(renderer.domElement);
/*********/
var zpos = 0;
var zoomSpeed = 0.9;



function inherit(C, P) {
	C.prototype = new P();
}


function radians(angle){
	return (angle) * (Math.PI / 180);
}

function degrees(radians){
	return radians * (180/Math.PI);
}

function randomColorMaterial() {
	return new THREE.MeshBasicMaterial({
		color:randomColor()
	});
}
function colorMaterial(theColor) {
	return new THREE.MeshBasicMaterial({
		color: theColor,
		side: THREE.DoubleSide
	});
}

function randomColor() {
	if (colorstyle === 'color') {
		return new THREE.Color(Math.random(),Math.random(),Math.random());
	} else {
		var g = Math.random();
		return new THREE.Color(g,g,g);
	}
}

function drawingInterface(that) {
	that.drawing = new THREE.Object3D();
	that.geometries = {};
	that.colors = {};
	that.currentColor;
	that.zCounter = 0;
	that.shapeRenderer = {
		rect: function(x, y, w, h) {
			var g = new THREE.Geometry();
			g.vertices.push(new THREE.Vector3(x,y,0));
			g.vertices.push(new THREE.Vector3(x+w,y,0));
			g.vertices.push(new THREE.Vector3(x+w,y+h,0));
			g.vertices.push(new THREE.Vector3(x,y+h,0));
			g.faces.push(new THREE.Face3(0,1,2));
			g.faces.push(new THREE.Face3(0,2,3));
			g.computeFaceNormals();
			g.verticesNeedUpdate = true;
			g.zIndex = that.zCounter;
			that.colors[that.currentColor].geometries.push(g);
			that.zCounter++;
		},
		rotateRect: function(x, y, originX, originY, width, height, scaleX, scaleY, angle) {
			var cos = Math.cos(radians(angle));
			var sin = Math.sin(radians(angle));
			var fx = -originX;
			var fy = -originY;
			var fx2 = width - originX;
			var fy2 = height - originY;
			var worldOriginX = x + originX;
			var worldOriginY = y + originY;
			var x1 = cos * fx - sin * fy + worldOriginX;
			var y1 = sin * fx + cos * fy + worldOriginY;
			var x2 = cos * fx2 - sin * fy + worldOriginX;
			var y2 = sin * fx2 + cos * fy + worldOriginY;
			var x3 = cos * fx2 - sin * fy2 + worldOriginX;
			var y3 = sin * fx2 + cos * fy2 + worldOriginY;
			var x4 = x1 + (x3 - x2);
			var y4 = y3 - (y2 - y1);
			var g = new THREE.Geometry();
			g.vertices.push(new THREE.Vector3(x1,y1,0));
			g.vertices.push(new THREE.Vector3(x2,y2,0));
			g.vertices.push(new THREE.Vector3(x3,y3,0));
			g.vertices.push(new THREE.Vector3(x4,y4,0));
			g.faces.push(new THREE.Face3(0,1,2));
			g.faces.push(new THREE.Face3(0,2,3));
			g.computeFaceNormals();
			g.verticesNeedUpdate = true;
			g.zIndex = that.zCounter;
			that.colors[that.currentColor].geometries.push(g);
			that.zCounter++;
		},
		quad: function(x1, y1, x2, y2, x3, y3, x4, y4) {
			var g = new THREE.Geometry();
			g.vertices.push(new THREE.Vector3(x1,y1,0));
			g.vertices.push(new THREE.Vector3(x2,y2,0));
			g.vertices.push(new THREE.Vector3(x3,y3,0));
			g.vertices.push(new THREE.Vector3(x4,y4,0));
			g.faces.push(new THREE.Face3(0,1,2));
			g.faces.push(new THREE.Face3(0,2,3));
			g.computeFaceNormals();
			g.verticesNeedUpdate = true;
			g.zIndex = that.zCounter;
			that.colors[that.currentColor].geometries.push(g);
			that.zCounter++;
		},
		triangle: function(x1, y1, x2, y2, x3, y3) {
			var g = new THREE.Geometry();
			g.vertices.push(new THREE.Vector3(x1,y1,0));
			g.vertices.push(new THREE.Vector3(x2,y2,0));
			g.vertices.push(new THREE.Vector3(x3,y3,0));
			g.faces.push(new THREE.Face3(0,1,2));
			g.computeFaceNormals();
			g.verticesNeedUpdate = true;
			g.zIndex = that.zCounter;
			that.colors[that.currentColor].geometries.push(g);
			that.zCounter++;
		},
		setColor: function(color) {
			if (! that.colors[color.getHexString()]) {
				that.colors[color.getHexString()] = {
					geometries : [],
					color: color
				}
			}
			that.currentColor = color.getHexString();
		},
		returnDrawing: function() {
			var zKey = 10/that.zCounter;
			for (color in that.colors) {
    			if (that.colors.hasOwnProperty(color)) {
					var g = new THREE.Geometry();
					for (var j = 0; j < that.colors[color].geometries.length; j++) {
						var gI = that.colors[color].geometries[j]
						var zV = gI.zIndex*zKey;
						for (var i = 0; i < gI.vertices.length; i++) {
							gI.vertices[i].setZ(zV);
						};
						g.merge(gI);
					};
				}
				that.drawing.add( new THREE.Mesh( g, colorMaterial(that.colors[color].color) ) );
			};
			return that.drawing;
		}
	};
}

function Vector2(x,y) {
	this.x = x;
	this.y = y;
	this.rotate = function(angle) {
		var r = radians(angle);
		var cos = Math.cos(r);
		var sin = Math.sin(r);
		var newX = this.x * cos - this.y * sin;
		var newY = this.x * sin + this.y * cos;
		this.x = newX;
		this.y = newY;
		return this;
	};
	this.cpy = function() {
		return new Vector2(this.x, this.y);
	};
	this.scl = function(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	};
	this.add = function(x,y) {
		this.x += x;
		this.y += y;
		return this;
	}
	this.sub = function(vector) {
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	}
}
function World() {
	this.visibleSteps = 6;
	this.length = 12;
	this.stepScale = 2;
	this.angle = 45;
	this.startScale = 1.2;
	this.steps = [];
}
World.prototype.step = function() {
	var drawing = new THREE.Object3D();
	var shape = new THREE.Shape();
	shape.moveTo( -1,-1 );
	shape.lineTo( -1, 1 );
	shape.lineTo( 1, 1 );
	shape.lineTo( 1, -1 );
	shape.lineTo( -1, -1 );
	drawing.add( new THREE.Mesh( shape.makeGeometry(), randomColorMaterial() ) );
	// drawing.updateMatrixWorld();
	// drawing.colorsNeedUpdate = true;
	return drawing;
};
World.prototype.constructSteps = function() {
	for (var i = 0; i < this.length; i++) {
		this.steps[i] = this.step(i);
		this.steps[i].rotation.z = radians(this.angle);
	}
}

var worlds = {
	Leaf: function() {
		this.visibleSteps = 11;
		this.stepScale = 1.9;
		this.angle = 18;
		this.startScale = 4;
		this.step = function(index) {
			drawingInterface(this);
			var cl1 = randomColor();
			var cl2 = randomColor();
			var cl3 = randomColor();
			var cl4 = randomColor();
			var r = 1/20;
			var hv = new Vector2(r,0);
			var vv = new Vector2(0,r);
			var sr = this.shapeRenderer;

			if (index%2 == 0) {
				hv.rotate(180);
				vv.rotate(180);
			}

			var leaves = 5;
			var a = -360/ leaves;
			for (var i = 0; i < leaves; i++) {

				sr.setColor(cl3);
				sr.triangle(
						hv.x*0 + vv.x*3.5,	hv.y*0 + vv.y*3.5,
						hv.x*-3.5 + vv.x*3.5,	hv.y*-3.5 + vv.y*3.5,
						0,0
				);
				sr.quad(hv.x*0 + vv.x*3.5,	hv.y*0 + vv.y*3.5,
						hv.x*-3.5 + vv.x*3.5,	hv.y*-3.5 + vv.y*3.5,
						hv.x*-3.5 + vv.x*10.5,	hv.y*-3.5 + vv.y*10.5,
						hv.x*0 + vv.x*10.5,	hv.y*0 + vv.y*10.5
				);
				sr.quad(	hv.x*0 + vv.x*10.5,	hv.y*0 + vv.y*10.5,
						hv.x*-3.5 + vv.x*10.5,	hv.y*-3.5 + vv.y*10.5,
						hv.x*-1 + vv.x*14,	hv.y*-1 + vv.y*14,
						hv.x*0 + vv.x*14,	hv.y*0 + vv.y*14
				);
				sr.setColor(cl4);
				sr.triangle(
						hv.x*0 + vv.x*3.5,	hv.y*0 + vv.y*3.5,
						hv.x*3.5 + vv.x*3.5,	hv.y*3.5 + vv.y*3.5,
						0,0
				);
				sr.quad(	hv.x*0 + vv.x*3.5,	hv.y*0 + vv.y*3.5,
						hv.x*3.5 + vv.x*3.5,	hv.y*3.5 + vv.y*3.5,
						hv.x*3.5 + vv.x*10.5,	hv.y*3.5 + vv.y*10.5,
						hv.x*0 + vv.x*10.5,	hv.y*0 + vv.y*10.5
				);
				sr.quad(	hv.x*0 + vv.x*10.5,	hv.y*0 + vv.y*10.5,
						hv.x*3.5 + vv.x*10.5,	hv.y*3.5 + vv.y*10.5,
						hv.x*1 + vv.x*14,	hv.y*1 + vv.y*14,
						hv.x*0 + vv.x*14,	hv.y*0 + vv.y*14
				);
				sr.setColor(cl1);
				sr.quad(	0,0,
						hv.x*-1 + vv.x*1,	hv.y*-1 + vv.y*1,
						hv.x*-1 + vv.x*13,	hv.y*-1 + vv.y*13,
						hv.x*0 + vv.x*12,	hv.y*0 + vv.y*12
				);
				sr.setColor(cl2);
				sr.quad(	0,0,
						hv.x*1 + vv.x*1,	hv.y*1 + vv.y*1,
						hv.x*1 + vv.x*13,	hv.y*1 + vv.y*13,
						hv.x*0 + vv.x*12,	hv.y*0 + vv.y*12
						);
				for (var j = 4; j < 8; j+=2) {
					sr.quad(	hv.x*0 + vv.x*(0+j),	hv.y*0 + vv.y*(0+j),
							hv.x*-3 + vv.x*(3+j),	hv.y*-3 + vv.y*(3+j),
							hv.x*-3 + vv.x*(4+j),	hv.y*-3 + vv.y*(4+j),
							hv.x*0 + vv.x*(1+j),	hv.y*0 + vv.y*(1+j)
					);
				}
				var k = 8;
				sr.quad(	hv.x*0 + vv.x*(0+k),	hv.y*0 + vv.y*(0+k),
						hv.x*-2.25 + vv.x*(2.25+k),	hv.y*-2.25 + vv.y*(2.25+k),
						hv.x*-2.25 + vv.x*(3.25+k),	hv.y*-2.25 + vv.y*(3.25+k),
						hv.x*0 + vv.x*(1+k),	hv.y*0 + vv.y*(1+k)
				);
				k = 10;
				sr.quad(	hv.x*0 + vv.x*(0+k),	hv.y*0 + vv.y*(0+k),
						hv.x*-1.5 + vv.x*(1.5+k),	hv.y*-1.5 + vv.y*(1.5+k),
						hv.x*-1.5 + vv.x*(2.5+k),	hv.y*-1.5 + vv.y*(2.5+k),
						hv.x*0 + vv.x*(1+k),	hv.y*0 + vv.y*(1+k)
						);
				sr.setColor(cl1);
				k = 8;
				sr.quad(	hv.x*0 + vv.x*(0+k),	hv.y*0 + vv.y*(0+k),
						hv.x*+2.25 + vv.x*(2.25+k),	hv.y*+2.25 + vv.y*(2.25+k),
						hv.x*+2.25 + vv.x*(3.25+k),	hv.y*+2.25 + vv.y*(3.25+k),
						hv.x*0 + vv.x*(1+k),	hv.y*0 + vv.y*(1+k)
						);
				k = 10;
				sr.quad(	hv.x*0 + vv.x*(0+k),	hv.y*0 + vv.y*(0+k),
						hv.x*1.5 + vv.x*(1.5+k),	hv.y*1.5 + vv.y*(1.5+k),
						hv.x*1.5 + vv.x*(2.5+k),	hv.y*1.5 + vv.y*(2.5+k),
						hv.x*0 + vv.x*(1+k),	hv.y*0 + vv.y*(1+k)
						);
				for (var j = 4; j < 8; j+=2) {
					sr.quad(	hv.x*0 + vv.x*(0+j),	hv.y*0 + vv.y*(0+j),
							hv.x*+3 + vv.x*(3+j),	hv.y*+3 + vv.y*(3+j),
							hv.x*+3 + vv.x*(4+j),	hv.y*+3 + vv.y*(4+j),
							hv.x*0 + vv.x*(1+j),	hv.y*0 + vv.y*(1+j)
					);
				}
				hv.rotate(a);
				vv.rotate(a);
			}
			return this.shapeRenderer.returnDrawing();
		};
	},
	Circles: function() {
		this.visibleSteps = 9;
		this.stepScale = 2;
		this.angle = 0;
		this.startScale = 3;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			var c1 = randomColor();
			var c2 = randomColor();
			var c3 = randomColor();
			var c4 = randomColor();
			var sr = this.shapeRenderer;

			var r = 1/2;
			var rs = r/2/4;

			var r2 = r - rs;
			var r3 = r - rs*2;
			var r4 = r - rs*3;

			var segments = 36;
			var a = 360 / segments;

			var v1 = new Vector2(0,r);
			var v12 = new Vector2(0,r).rotate(a);

			var v2 = new Vector2(0,r2);
			var v22 = new Vector2(0,r2).rotate(a);

			var v3 = new Vector2(0,r3);
			var v32 = new Vector2(0,r3).rotate(a);

			var v4 = new Vector2(0,r4);
			var v42 = new Vector2(0,r4).rotate(a);

			sr.setColor(c1);

			for (var i = 0; i < segments; i++) {
				sr.triangle(v1.x, v1.y, v12.x, v12.y, 0,0);
				v1.rotate(a);
				v12.rotate(a);
			}

			sr.setColor(c2);

			for (var i = 0; i < segments; i++) {
				sr.triangle(v2.x, v2.y, v22.x, v22.y, 0,0);
				v2.rotate(a);
				v22.rotate(a);
			}

			sr.setColor(c3);

			for (var i = 0; i < segments; i++) {
				sr.triangle(v3.x, v3.y, v32.x, v32.y, 0,0);
				v3.rotate(a);
				v32.rotate(a);
			}

			sr.setColor(c4);

			for (var i = 0; i < segments; i++) {
				sr.triangle(v4.x, v4.y, v42.x, v42.y, 0,0);
				v4.rotate(a);
				v42.rotate(a);
			}


			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Crest: function() {
		this.visibleSteps = 9;
		this.stepScale = 3;
		this.angle = 0;
		this.startScale = 3;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			var cl1 = randomColor();
			var cl2 = randomColor();
			var cl3 = randomColor();
			var cl4 = randomColor();
			var sr = this.shapeRenderer;
			var r = 1/30;
			var hv = new Vector2(r,0);
			var vv = new Vector2(0,r);
			var leaves = 4;
			var segments = 2;
			var a = -360/ leaves;
			for (var i = 0; i < leaves; i++) {

				for (var ax = 0; ax < 2; ax++) {
					var sv = new Vector2(0,0);
					var s = ax;
					var axis = 1;
					if (ax == 0)
						axis = -1;
					if (s%2 == 0)
						sr.setColor(cl4);
					else
						sr.setColor(cl1);
					if (s%2 == 0)
						sr.setColor(cl4);
					else
						sr.setColor(cl1);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*0,		sv.y+ axis*hv.y*0 + vv.y*0,
							sv.x + axis*hv.x*-6 + vv.x*6,		sv.y+ axis*hv.y*-6 + vv.y*6,
							sv.x + axis*hv.x*-5 + vv.x*7,		sv.y+ axis*hv.y*-5 + vv.y*7,
							sv.x + axis*hv.x*0 + vv.x*2,		sv.y+ axis*hv.y*0 + vv.y*2
					);
					sr.quad(
							sv.x + axis*hv.x*-0 + vv.x*2,		sv.y+ axis*hv.y*-0 + vv.y*2,
							sv.x + axis*hv.x*-10 + vv.x*12,		sv.y+ axis*hv.y*-10 + vv.y*12,
							sv.x + axis*hv.x*-9 + vv.x*13,		sv.y+ axis*hv.y*-9 + vv.y*13,
							sv.x + axis*hv.x*-0 + vv.x*4,		sv.y+ axis*hv.y*-0 + vv.y*4
					);
					if (s%2 == 0)
						sr.setColor(cl1);
					else
						sr.setColor(cl4);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*4,		sv.y+ axis*hv.y*0 + vv.y*4,
							sv.x + axis*hv.x*-9 + vv.x*13,		sv.y+ axis*hv.y*-9 + vv.y*13,
							sv.x + axis*hv.x*-8 + vv.x*14,		sv.y+ axis*hv.y*-8 + vv.y*14,
							sv.x + axis*hv.x*0 + vv.x*6,		sv.y+ axis*hv.y*0 + vv.y*6
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*6,		sv.y+ axis*hv.y*0 + vv.y*6,
							sv.x + axis*hv.x*-5 + vv.x*11,		sv.y+ axis*hv.y*-5 + vv.y*11,
							sv.x + axis*hv.x*-4 + vv.x*12,		sv.y+ axis*hv.y*-4 + vv.y*12,
							sv.x + axis*hv.x*0 + vv.x*8,		sv.y+ axis*hv.y*0 + vv.y*8
					);
					if (s%2 == 0)
						sr.setColor(cl4);
					else
						sr.setColor(cl1);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*8,		sv.y+ axis*hv.y*0 + vv.y*8,
							sv.x + axis*hv.x*-4 + vv.x*12,		sv.y+ axis*hv.y*-4 + vv.y*12,
							sv.x + axis*hv.x*-3 + vv.x*13,		sv.y+ axis*hv.y*-3 + vv.y*13,
							sv.x + axis*hv.x*0 + vv.x*10,		sv.y+ axis*hv.y*0 + vv.y*10
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*10,		sv.y+ axis*hv.y*0 + vv.y*10,
							sv.x + axis*hv.x*-8 + vv.x*18,		sv.y+ axis*hv.y*-8 + vv.y*18,
							sv.x + axis*hv.x*-7 + vv.x*19,		sv.y+ axis*hv.y*-7 + vv.y*19,
							sv.x + axis*hv.x*0 + vv.x*12,		sv.y+ axis*hv.y*0 + vv.y*12
					);
					if (s%2 == 0)
						sr.setColor(cl1);
					else
						sr.setColor(cl4);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*12,		sv.y+ axis*hv.y*0 + vv.y*12,
							sv.x + axis*hv.x*-7 + vv.x*19,		sv.y+ axis*hv.y*-7 + vv.y*19,
							sv.x + axis*hv.x*-6 + vv.x*20,		sv.y+ axis*hv.y*-6 + vv.y*20,
							sv.x + axis*hv.x*0 + vv.x*14,		sv.y+ axis*hv.y*0 + vv.y*14
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*14,		sv.y+ axis*hv.y*0 + vv.y*14,
							sv.x + axis*hv.x*-3 + vv.x*17,		sv.y+ axis*hv.y*-3 + vv.y*17,
							sv.x + axis*hv.x*-2 + vv.x*18,		sv.y+ axis*hv.y*-2 + vv.y*18,
							sv.x + axis*hv.x*0 + vv.x*16,		sv.y+ axis*hv.y*0 + vv.y*16
					);
					if (s%2 == 0)
						sr.setColor(cl4);
					else
						sr.setColor(cl1);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*16,		sv.y+ axis*hv.y*0 + vv.y*16,
							sv.x + axis*hv.x*-2 + vv.x*18,		sv.y+ axis*hv.y*-2 + vv.y*18,
							sv.x + axis*hv.x*-1 + vv.x*19,		sv.y+ axis*hv.y*-1 + vv.y*19,
							sv.x + axis*hv.x*0 + vv.x*18,		sv.y+ axis*hv.y*0 + vv.y*18
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*18,		sv.y+ axis*hv.y*0 + vv.y*18,
							sv.x + axis*hv.x*-4 + vv.x*22,		sv.y+ axis*hv.y*-4 + vv.y*22,
							sv.x + axis*hv.x*-3 + vv.x*23,		sv.y+ axis*hv.y*-3 + vv.y*23,
							sv.x + axis*hv.x*0 + vv.x*20,		sv.y+ axis*hv.y*0 + vv.y*20
					);
					if (s%2 == 0)
						sr.setColor(cl1);
					else
						sr.setColor(cl4);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*20,		sv.y+ axis*hv.y*0 + vv.y*20,
							sv.x + axis*hv.x*-3 + vv.x*23,		sv.y+ axis*hv.y*-3 + vv.y*23,
							sv.x + axis*hv.x*-2 + vv.x*24,		sv.y+ axis*hv.y*-2 + vv.y*24,
							sv.x + axis*hv.x*0 + vv.x*22,		sv.y+ axis*hv.y*0 + vv.y*22
					);
					sr.setColor(cl2);
					sv.x = axis*hv.x*-4 + vv.x*12;
					sv.y = axis*hv.y*-4 + vv.y*12;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*-2 + vv.x*0,		sv.y+ axis*hv.y*-2 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*0 + vv.x*2,		sv.y+ axis*hv.y*0 + vv.y*2,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);
					sv.x = axis*hv.x*-2 + vv.x*18;
					sv.y = axis*hv.y*-2 + vv.y*18;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*-2 + vv.x*0,		sv.y+ axis*hv.y*-2 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*0 + vv.x*2,		sv.y+ axis*hv.y*0 + vv.y*2,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);
					sv.x = axis*hv.x*-6 + vv.x*6;
					sv.y = axis*hv.y*-6 + vv.y*6;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*-2 + vv.x*0,		sv.y+ axis*hv.y*-2 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*0 + vv.x*2,		sv.y+ axis*hv.y*0 + vv.y*2,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);
					sr.setColor(cl3);
					sv.x = axis*hv.x*-9 + vv.x*13;
					sv.y = axis*hv.y*-9 + vv.y*13;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*0 + vv.x*-2,		sv.y+ axis*hv.y*0 + vv.y*-2,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*2 + vv.x*0,		sv.y+ axis*hv.y*2 + vv.y*0,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);
					sv.x = axis*hv.x*-7 + vv.x*19;
					sv.y = axis*hv.y*-7 + vv.y*19;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*0 + vv.x*-2,		sv.y+ axis*hv.y*0 + vv.y*-2,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*2 + vv.x*0,		sv.y+ axis*hv.y*2 + vv.y*0,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);
					sv.x = axis*hv.x*-3 + vv.x*23;
					sv.y = axis*hv.y*-3 + vv.y*23;
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*-1 + vv.x*0,		sv.y+ axis*hv.y*-1 + vv.y*0,
							sv.x + axis*hv.x*-1 + vv.x*-1,		sv.y+ axis*hv.y*-1 + vv.y*-1,
							sv.x + axis*hv.x*0 + vv.x*-2,		sv.y+ axis*hv.y*0 + vv.y*-2,
							sv.x + axis*hv.x*0 + vv.x*-1,		sv.y+ axis*hv.y*0 + vv.y*-1
					);
					sr.quad(
							sv.x + axis*hv.x*0 + vv.x*1,		sv.y+ axis*hv.y*0 + vv.y*1,
							sv.x + axis*hv.x*1 + vv.x*1,		sv.y+ axis*hv.y*1 + vv.y*1,
							sv.x + axis*hv.x*2 + vv.x*0,		sv.y+ axis*hv.y*2 + vv.y*0,
							sv.x + axis*hv.x*1 + vv.x*0,		sv.y+ axis*hv.y*1 + vv.y*0
					);

				}
				hv.rotate(a);
				vv.rotate(a);
			}
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Akanthus: function() {
		this.visibleSteps = 9;
		this.stepScale = 2.9;
		this.angle = 18 + 180;
		this.startScale = 2;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			var c1 = randomColor();
			var c4 = randomColor();
			var sr = this.shapeRenderer;
			var r = 1/10;
			var hv = new Vector2(r,0);
			var vv = new Vector2(0,r);

			if (index%2 == 1) {
				hv.rotate(36);
				vv.rotate(36);
			}

			var leaves = 5;
			var segments = 2;
			var a = -360/ leaves;
			for (var i = 0; i < leaves; i++) {
				for (var ax = 0; ax < 2; ax++) {
					var sv = new Vector2(0,0);
					sv.add(vv.x*1.5,vv.y*1.5);
					var s = ax;
					var axis = 1;
					if (ax == 0)
						axis = -1;
					if (s%2 == 0)
						sr.setColor(c4);
					else
						sr.setColor(c1);
					sr.triangle(
							0,0,
							sv.x + axis*hv.x*0 + vv.x*3.5,		sv.y+ axis*hv.y*0 + vv.y*3.5,
							sv.x + axis*hv.x*-4 + vv.x*4,		sv.y+ axis*hv.y*-4 + vv.y*4
					);

					for (var j = 0; j < segments; j++) {
						if (s%2 == 0)
							sr.setColor(c4);
						else
							sr.setColor(c1);


						sr.quad(sv.x + axis*hv.x*-1 + vv.x*6.5,		sv.y+ axis*hv.y*-1 + vv.y*6.5,
								sv.x + axis*hv.x*0 + vv.x*7.5,		sv.y+ axis*hv.y*0 + vv.y*7.5,
								sv.x + axis*hv.x*0 + vv.x*3.5,		sv.y+ axis*hv.y*0 + vv.y*3.5,
								sv.x + axis*hv.x*-1 + vv.x*2.5,		sv.y+ axis*hv.y*-1 + vv.y*2.5 );

						sr.quad(sv.x + axis*hv.x*-2 + vv.x*4,		sv.y+ axis*hv.y*-2 + vv.y*4,
								sv.x + axis*hv.x*-0.5 + vv.x*5.5,	sv.y+ axis*hv.y*-0.5 + vv.y*5.5,
								sv.x + axis*hv.x*-1 + vv.x*2.5,		sv.y+ axis*hv.y*-1 + vv.y*2.5,
								sv.x + axis*hv.x*-2.5 + vv.x*2.5,	sv.y+ axis*hv.y*-2.5 + vv.y*2.5 );

						sr.quad(sv.x + axis*hv.x*-2 + vv.x*4,		sv.y+ axis*hv.y*-2 + vv.y*4,
								sv.x + axis*hv.x*-2.5 + vv.x*2.5,	sv.y+ axis*hv.y*-2.5 + vv.y*2.5,
								sv.x + axis*hv.x*-3 + vv.x*4,		sv.y+ axis*hv.y*-3 + vv.y*4,
								sv.x + axis*hv.x*-3 + vv.x*5,		sv.y+ axis*hv.y*-3 + vv.y*5);

						sr.quad(sv.x + axis*hv.x*-3 + vv.x*4,		sv.y+ axis*hv.y*-3 + vv.y*4,
								sv.x + axis*hv.x*-2.5 + vv.x*2.5,	sv.y+ axis*hv.y*-2.5 + vv.y*2.5,
								sv.x + axis*hv.x*-4 + vv.x*4,		sv.y+ axis*hv.y*-4 + vv.y*4,
								sv.x + axis*hv.x*-4 + vv.x*5,		sv.y+ axis*hv.y*-4 + vv.y*5 );

						sr.quad(sv.x + axis*hv.x*-1 + vv.x*5,		sv.y+ axis*hv.y*-1 + vv.y*5,
								sv.x + axis*hv.x*-3 + vv.x*5,		sv.y+ axis*hv.y*-3 + vv.y*5,
								sv.x + axis*hv.x*-2.5 + vv.x*6.5,	sv.y+ axis*hv.y*-2.5 + vv.y*6.5,
								sv.x + axis*hv.x*-1 + vv.x*6.5,		sv.y+ axis*hv.y*-1 + vv.y*6.5 );

						sr.quad(sv.x + axis*hv.x*-2.5 + vv.x*6.5,	sv.y+ axis*hv.y*-2.5 + vv.y*6.5,
								sv.x + axis*hv.x*-3 + vv.x*5,		sv.y+ axis*hv.y*-3 + vv.y*5,
								sv.x + axis*hv.x*-5 + vv.x*7,		sv.y+ axis*hv.y*-5 + vv.y*7,
								sv.x + axis*hv.x*-4 + vv.x*7,		sv.y+ axis*hv.y*-4 + vv.y*7 );

						sr.quad(sv.x + axis*hv.x*-2.5 + vv.x*6.5,	sv.y+ axis*hv.y*-2.5 + vv.y*6.5,
								sv.x + axis*hv.x*-4 + vv.x*7,		sv.y+ axis*hv.y*-4 + vv.y*7,
								sv.x + axis*hv.x*-5 + vv.x*8,		sv.y+ axis*hv.y*-5 + vv.y*8,
								sv.x + axis*hv.x*-4 + vv.x*8,		sv.y+ axis*hv.y*-4 + vv.y*8 );
						sv.add(vv.x*4,vv.y*4);
						s++;

					}
					if (s%2 == 0)
						sr.setColor(c4);
					else
						sr.setColor(c1);
					sr.quad(sv.x + axis*hv.x*-1 + vv.x*8,			sv.y+ axis*hv.y*-1 + vv.y*8,
							sv.x + axis*hv.x*0 + vv.x*7,			sv.y+ axis*hv.y*0 + vv.y*7,
							sv.x + axis*hv.x*0 + vv.x*3.5,			sv.y+ axis*hv.y*0 + vv.y*3.5,
							sv.x + axis*hv.x*-1 + vv.x*2.5,			sv.y+ axis*hv.y*-1 + vv.y*2.5 );

					sr.quad(sv.x + axis*hv.x*-2 + vv.x*4,			sv.y+ axis*hv.y*-2 + vv.y*4,
							sv.x + axis*hv.x*-0.5 + vv.x*4,			sv.y+ axis*hv.y*-0.5 + vv.y*4,
							sv.x + axis*hv.x*-1 + vv.x*2.5,			sv.y+ axis*hv.y*-1 + vv.y*2.5,
							sv.x + axis*hv.x*-2.5 + vv.x*2.5,		sv.y+ axis*hv.y*-2.5 + vv.y*2.5 );

					sr.quad(sv.x + axis*hv.x*-2 + vv.x*4,			sv.y+ axis*hv.y*-2 + vv.y*4,
							sv.x + axis*hv.x*-2.5 + vv.x*2.5,		sv.y+ axis*hv.y*-2.5 + vv.y*2.5,
							sv.x + axis*hv.x*-3 + vv.x*4,			sv.y+ axis*hv.y*-3 + vv.y*4,
							sv.x + axis*hv.x*-3 + vv.x*5,			sv.y+ axis*hv.y*-3 + vv.y*5 );

					sr.quad(sv.x + axis*hv.x*-3 + vv.x*4,			sv.y+ axis*hv.y*-3 + vv.y*4,
							sv.x + axis*hv.x*-2.5 + vv.x*2.5,		sv.y+ axis*hv.y*-2.5 + vv.y*2.5,
							sv.x + axis*hv.x*-4 + vv.x*4,			sv.y+ axis*hv.y*-4 + vv.y*4,
							sv.x + axis*hv.x*-4 + vv.x*5,			sv.y+ axis*hv.y*-4 + vv.y*5 );
					sr.quad(sv.x + axis*hv.x*-1 + vv.x*4,			sv.y+ axis*hv.y*-1 + vv.y*4,
							sv.x + axis*hv.x*-2 + vv.x*5,			sv.y+ axis*hv.y*-2 + vv.y*5,
							sv.x + axis*hv.x*-2 + vv.x*7,			sv.y+ axis*hv.y*-2 + vv.y*7,
							sv.x + axis*hv.x*-1 + vv.x*6,			sv.y+ axis*hv.y*-1 + vv.y*6 );

				}
				hv.rotate(a);
				vv.rotate(a);
			}
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	General: function() {
		this.visibleSteps = 9;
		this.stepScale = 2;
		this.angle = 0;
		this.startScale = 4;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			var c1 = randomColor();
			var c2 = randomColor();
			var c3 = randomColor();
			var c4 = randomColor();
			var sr = this.shapeRenderer;
			var cells = 12;
			var p = -360/(cells*3);
			var r = 1/2;
			var m = r/this.stepScale*0.66;
			var d = r/this.stepScale;
			var ov1 = new Vector2(0,r);
			var ov2 = ov1.cpy().rotate(p);
			var mv1 = new Vector2(0,r-m).rotate(p*0.5);
			var mv2 = mv1.cpy().rotate(p);
			var iv1 = new Vector2(0,r-d);
			var iv2 = iv1.cpy().rotate(p);
			for (var i = 0; i < cells; i++) {
				sr.setColor(c1);
				sr.triangle(ov1.x,ov1.y,
							ov2.x,ov2.y,
							mv1.x,mv1.y);
				sr.setColor(c2);
				sr.triangle(iv1.x,iv1.y,
							iv2.x,iv2.y,
							mv1.x,mv1.y);
				sr.setColor(c1);
				sr.triangle(ov2.x,ov2.y,
							mv2.x,mv2.y,
							mv1.x,mv1.y);
				sr.setColor(c2);
				sr.triangle(iv2.x,iv2.y,
							mv2.x,mv2.y,
							mv1.x,mv1.y);
				ov1.rotate(p*1);
				ov2.rotate(p*1);
				mv1.rotate(p*1);
				mv2.rotate(p*1);
				iv1.rotate(p*1);
				iv2.rotate(p*1);
				sr.setColor(c1);
				sr.triangle(iv2.x,iv2.y,
							mv1.x,mv1.y,
							mv2.x,mv2.y);
				sr.setColor(c2);
				sr.triangle(ov2.x,ov2.y,
						mv1.x,mv1.y,
						mv2.x,mv2.y);
				sr.setColor(c4);
				sr.triangle(mv1.x,mv1.y,
							iv1.x,iv1.y,
							iv2.x,iv2.y);
				sr.triangle(iv1.x,iv1.y,
							iv2.x,iv2.y,
							0,0);
				ov1.rotate(p*1);
				ov2.rotate(p*1);
				mv1.rotate(p*1);
				mv2.rotate(p*1);
				iv1.rotate(p*1);
				iv2.rotate(p*1);
				sr.setColor(c2);
				sr.triangle(ov1.x,ov1.y,
							ov2.x,ov2.y,
							mv1.x,mv1.y);

				sr.setColor(c1);
				sr.triangle(iv1.x,iv1.y,
							iv2.x,iv2.y,
							mv1.x,mv1.y);
				sr.setColor(c4);
				sr.triangle(ov2.x,ov2.y,
							mv1.x,mv1.y,
							mv2.x,mv2.y);
				sr.triangle(mv1.x,mv1.y,
							mv2.x,mv2.y,
							iv2.x,iv2.y);
				ov1.rotate(p*1);
				ov2.rotate(p*1);
				mv1.rotate(p*1);
				mv2.rotate(p*1);
				iv1.rotate(p*1);
				iv2.rotate(p*1);
			}
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Sultan: function() {
		this.visibleSteps = 9;
		this.stepScale = 2;
		this.angle = 0;
		this.startScale = 4;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			var c1 = randomColor();
			var c2 = randomColor();
			var c3 = randomColor();
			var c4 = randomColor();
			var cells = 16;
			var p = -360/(cells);
			var r = 0.5;
			var m = r/2*0.5;
			var d = r/2;
			var s = (index%2===0)?0:p*0.5;

			var ov2 = new Vector2(0,r).rotate(p+s);
			var mv1 = new Vector2(0,r-m).rotate(p*0.5+s);
			var mv2 = mv1.cpy().rotate(p);
			var iv2 = new Vector2(0,r-d).rotate(p+s);

			var sr = this.shapeRenderer;
			for (var i = 0; i < cells; i++) {
				sr.setColor(c1);
				sr.triangle(iv2.x,iv2.y,
							mv1.x,mv1.y,
							0,0);
				sr.setColor(c2);
				sr.triangle(iv2.x,iv2.y,
						mv2.x,mv2.y,
						0,0);
				sr.setColor(c3);
				sr.triangle(mv1.x,mv1.y,
						ov2.x,ov2.y,
						iv2.x,iv2.y);
				sr.setColor(c4);
				sr.triangle(mv2.x,mv2.y,
						ov2.x,ov2.y,
						iv2.x,iv2.y);
				ov2.rotate(p);
				mv1.rotate(p);
				mv2.rotate(p);
				iv2.rotate(p);
			}
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Blossom: function() {
		this.visibleSteps = 10;
		this.stepScale = 2;
		this.angle = 0;
		this.startScale = 3.5;
		this.step = function(index) {
			drawingInterface(this);
			//*****//
			c_L = randomColor();
			c_T = randomColor();
			c_R = randomColor();
			c_B = randomColor();
			var step_w = 1;
			var step_h = 1;
			var left = -(step_w/2);
			var bottom = -(step_h/2);
			var right = step_w/2;
			var top = step_h/2;
			var hleft = -(step_w/4);
			var hbottom = -(step_h/4);
			var hright = step_w/4;
			var htop = step_h/4;
			var length = step_w/4;
			var slength = (Math.sqrt(step_w*step_w+step_h*step_h)/2 -length*2 )/2;
			var sr = this.shapeRenderer;
			if (index%2 === 0) {
				sr.setColor(c_R);
			} else {
				sr.setColor(c_B);
			}
			sr.quad(left,0,0,top,right,0,0,bottom);

			sr.setColor(c_L);
			drawLeaf(sr, left,0,length,270);
			drawLeaf(sr, left,0,length,180);
			drawLeaf(sr, left,0,length,0);
			drawLeaf(sr, right,0,length,90);
			drawLeaf(sr, right,0,length,180);
			drawLeaf(sr, right,0,length,0);
			drawLeaf(sr, 0,top,length,180);
			drawLeaf(sr, 0,top,length,90);
			drawLeaf(sr, 0,top,length,270);
			drawLeaf(sr, 0,bottom,length,0);
			drawLeaf(sr, 0,bottom,length,90);
			drawLeaf(sr, 0,bottom,length,270);

			sr.setColor(c_T);
			drawLeaf(sr, left,0,length,45);
			drawLeaf(sr, left,0,length,135);
			drawLeaf(sr, left,0,length,225);
			drawLeaf(sr, left,0,length,315);
			drawLeaf(sr, right,0,length,45);
			drawLeaf(sr, right,0,length,135);
			drawLeaf(sr, right,0,length,225);
			drawLeaf(sr, right,0,length,315);
			drawLeaf(sr, 0,top,length,45);
			drawLeaf(sr, 0,top,length,135);
			drawLeaf(sr, 0,top,length,225);
			drawLeaf(sr, 0,top,length,315);
			drawLeaf(sr, 0,bottom,length,45);
			drawLeaf(sr, 0,bottom,length,135);
			drawLeaf(sr, 0,bottom,length,225);
			drawLeaf(sr, 0,bottom,length,315);
			// diagonal
			sr.setColor(c_L);
			drawLeaf(sr,hleft,htop,slength,45);
			drawLeaf(sr,hleft,htop,slength,135);
			drawLeaf(sr,hleft,htop,slength,225);
			drawLeaf(sr,hleft,htop,slength,315);
			drawLeaf(sr,hleft,hbottom,slength,45);
			drawLeaf(sr,hleft,hbottom,slength,135);
			drawLeaf(sr,hleft,hbottom,slength,225);
			drawLeaf(sr,hleft,hbottom,slength,315);
			drawLeaf(sr,hright,htop,slength,45);
			drawLeaf(sr,hright,htop,slength,135);
			drawLeaf(sr,hright,htop,slength,225);
			drawLeaf(sr,hright,htop,slength,315);
			drawLeaf(sr,hright,hbottom,slength,45);
			drawLeaf(sr,hright,hbottom,slength,135);
			drawLeaf(sr,hright,hbottom,slength,225);
			drawLeaf(sr,hright,hbottom,slength,315);

			sr.setColor(c_T);
			drawLeaf(sr,hleft,htop,slength,0);
			drawLeaf(sr,hleft,htop,slength,90);
			drawLeaf(sr,hleft,htop,slength,180);
			drawLeaf(sr,hleft,htop,slength,270);
			drawLeaf(sr,hleft,hbottom,slength,0);
			drawLeaf(sr,hleft,hbottom,slength,90);
			drawLeaf(sr,hleft,hbottom,slength,180);
			drawLeaf(sr,hleft,hbottom,slength,270);
			drawLeaf(sr,hright,htop,slength,0);
			drawLeaf(sr,hright,htop,slength,90);
			drawLeaf(sr,hright,htop,slength,180);
			drawLeaf(sr,hright,htop,slength,270);
			drawLeaf(sr,hright,hbottom,slength,0);
			drawLeaf(sr,hright,hbottom,slength,90);
			drawLeaf(sr,hright,hbottom,slength,180);
			drawLeaf(sr,hright,hbottom,slength,270);

			function drawLeaf( sr, ox, oy, l, angle){
				var V1 = new Vector2(0,l).rotate(angle);
				var ls = 0.445;
				var la = 22.5;
				var IL1 = V1.cpy().scl(ls).rotate(-la);
				var IL2 = V1.cpy().scl(ls).rotate(la);
				var OL1 = V1.cpy().sub(IL2);
				var OL2 = V1.cpy().sub(IL1);
				sr.triangle(ox, oy,
							ox+IL1.x, oy+IL1.y,
							ox+IL2.x, oy+IL2.y);
				sr.quad(ox+IL1.x, oy+IL1.y,
						ox+IL2.x, oy+IL2.y,
						ox+OL2.x, oy+OL2.y,
						ox+OL1.x, oy+OL1.y
				);
				sr.triangle(
						ox+OL2.x, oy+OL2.y,
						ox+OL1.x, oy+OL1.y,
						ox+V1.x,oy+V1.y
				);
			}
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Cube: function() {
		this.visibleSteps = 5;
		this.stepScale = 5;
		this.angle = 0;
		this.startScale = 1;
		this.step = function() {
			drawingInterface(this);
			//*****//
			var sr = this.shapeRenderer;
			var ql = 1/5;
			var c1 = randomColor();
			var c2 = randomColor();
			var c3 = randomColor();
			var c4 = randomColor();
			var V1_5 = new Vector2(0,-ql*5);
			var V2_5 = V1_5.cpy().rotate(360/3);
			var V3_5 = V1_5.cpy().rotate(360/3*2);
			var V1 = new Vector2(0,-ql);
			var V2 = V1.cpy().rotate(360/3);
			var V3 = V1.cpy().rotate(360/3*2);
			sr.setColor(c1);
			sr.quad(0,0,
					V3_5.x, V3_5.y,
					-V1_5.x, -V1_5.y,
					V2_5.x, V2_5.y);
			sr.setColor(c3);
			sr.quad(0,0,
					V1_5.x,V1_5.y,
					V1_5.x + V2_5.x, V1_5.y + V2_5.y,
					V2_5.x, V2_5.y);
			sr.setColor(c2);
			sr.quad(0,0,
					V1_5.x,V1_5.y,
					V1_5.x + V3_5.x, V1_5.y + V3_5.y,
					V3_5.x, V3_5.y);
			///// inner bg
			sr.setColor(c4);
			sr.triangle(
				V3.x, V3.y,
				V3.x - V2.x, V3.y - V2.y,
				V3.x + V1.x, V3.y + V1.y);
			sr.triangle(
					-V1.x, -V1.y,
					-V1.x - V2.x, -V1.y - V2.y,
					-V1.x + V3.x, -V1.y + V3.y);
			sr.triangle(
					-V1.x, -V1.y,
					-V1.x + V2.x, -V1.y + V2.y,
					-V1.x - V3.x, -V1.y - V3.y);
			sr.triangle(
					V2.x, V2.y,
					V2.x - V3.x, V2.y - V3.y,
					V2.x + V1.x, V2.y + V1.y);
			sr.triangle(
					V1.x, V1.y,
					V1.x - V2.x, V1.y - V2.y,
					V1.x + V3.x, V1.y + V3.y);
			sr.triangle(
					V1.x, V1.y,
					V1.x + V2.x, V1.y + V2.y,
					V1.x - V3.x, V1.y - V3.y);
			// outer bg
			sr.triangle(
					V3.x - V2.x, V3.y - V2.y,
					V3.x - V2.x*2, V3.y - V2.y*2,
					V3.x*2 - V2.x, V3.y*2 - V2.y);
			sr.triangle(
					V1.x - V2.x, V1.y - V2.y,
					V1.x*2 - V2.x, V1.y*2 - V2.y,
					V1.x - V2.x*2, V1.y - V2.y*2);
			sr.triangle(
					V1.x - V3.x, V1.y - V3.y,
					V1.x*2 - V3.x, V1.y*2 - V3.y,
					V1.x - V3.x*2, V1.y - V3.y*2);
			sr.triangle(
					V2.x - V3.x, V2.y - V3.y,
					V2.x - V3.x*2, V2.y - V3.y*2,
					V2.x*2 - V3.x, V2.y*2 - V3.y);
			sr.triangle(
					-V1.x + V2.x, -V1.y + V2.y,
					-V1.x*2 + V2.x, -V1.y*2 + V2.y,
					-V1.x + V2.x*2, -V1.y + V2.y*2);
			sr.triangle(
					-V1.x + V3.x, -V1.y + V3.y,
					-V1.x*2 + V3.x, -V1.y*2 + V3.y,
					-V1.x + V3.x*2, -V1.y + V3.y*2);
			// right sides
			sr.setColor(c3);
			sr.quad(V3.x, V3.y,
					V3.x - V1.x, V3.y - V1.y,
					V3.x*2, V3.y*2,
					V3.x - V2.x, V3.y - V2.y);
			sr.quad(V1.x + V3.x*3, V1.y + V3.y*3,
					V1.x + V3.x*4, V1.y + V3.y*4,
					V1.x*4 + V3.x*4, V1.y*4 + V3.y*4,
					V1.x*3 + V3.x*3, V1.y*3 + V3.y*3);
			sr.quad(-V2.x, -V2.y,
					-V2.x + V1.x, -V2.y + V1.y,
					-V2.x*2 + V1.x, -V2.y*2 + V1.y,
					-V2.x*3, -V2.y*3);
			sr.quad(-V1.x, -V1.y,
					-V1.x*3, -V1.y*3,
					-V1.x*3 -V3.x, -V1.y*3 -V3.y,
					-V1.x*2 -V3.x, -V1.y*2 -V3.y);
			sr.quad(-V1.x*3, -V1.y*3,
					-V1.x*4, -V1.y*4,
					-V1.x + V3.x*3, -V1.y + V3.y*3,
					-V1.x + V3.x*2, -V1.y + V3.y*2);
			// left sides
			sr.setColor(c2);
			sr.quad(V2.x, V2.y,
					V2.x - V1.x, V2.y - V1.y,
					V2.x*2, V2.y*2,
					V2.x - V3.x, V2.y - V3.y);
			sr.quad(V1.x + V2.x*3, V1.y + V2.y*3,
					V1.x + V2.x*4, V1.y + V2.y*4,
					V1.x*4 + V2.x*4, V1.y*4 + V2.y*4,
					V1.x*3 + V2.x*3, V1.y*3 + V2.y*3);
			sr.quad(-V3.x, -V3.y,
					-V3.x + V1.x, -V3.y + V1.y,
					-V3.x*2 + V1.x, -V3.y*2 + V1.y,
					-V3.x*3, -V3.y*3);
			sr.quad(-V1.x, -V1.y,
					-V1.x*3, -V1.y*3,
					-V1.x*3 -V2.x, -V1.y*3 -V2.y,
					-V1.x*2 -V2.x, -V1.y*2 -V2.y);
			sr.quad(-V1.x*3, -V1.y*3,
					-V1.x*4, -V1.y*4,
					-V1.x + V2.x*3, -V1.y + V2.y*3,
					-V1.x + V2.x*2, -V1.y + V2.y*2);
			// top sides
			sr.setColor(c1);
			sr.quad(V1.x, V1.y,
					V1.x-V2.x, V1.y-V2.y,
					V1.x*2, V1.y*2,
					V1.x-V3.x, V1.y-V3.y);
			sr.quad(-V2.x, -V2.y,
					-V2.x + V3.x, -V2.y + V3.y,
					-V2.x*2 + V3.x, -V2.y*2 + V3.y,
					-V2.x*3, -V2.y*3 );
			sr.quad(-V3.x, -V3.y,
					-V3.x + V2.x, -V3.y + V2.y,
					-V3.x*2 + V2.x, -V3.y*2 + V2.y,
					-V3.x*3, -V3.y*3 );
			sr.quad(V1.x*4 + V3.x, V1.y*4 + V3.y,
					V1.x*4 + V3.x*4, V1.y*4 + V3.y*4,
					V1.x*3 + V3.x*3, V1.y*3 + V3.y*3,
					V1.x*3 + V3.x, V1.y*3 + V3.y);
			sr.quad(V1.x*4 + V2.x, V1.y*4 + V2.y,
					V1.x*4 + V2.x*4, V1.y*4 + V2.y*4,
					V1.x*3 + V2.x*3, V1.y*3 + V2.y*3,
					V1.x*3 + V2.x, V1.y*3 + V2.y);
			//*****//
			return this.shapeRenderer.returnDrawing();
		};
	},
	Circuit : function() {
		this.visibleSteps = 7;
		this.stepScale = 3;
		this.angle = 45;
		this.startScale = 6;
		this.step = function(index) {
			drawingInterface(this);
			var c_1 = randomColor();
			var c_2 = randomColor();
			var step_w = 1;
			var step_h = 1;
			var left = -(step_w/2);
			var bottom = -(step_h/2);
			var right = step_w/2;
			var top = step_h/2;
			var boxscale = step_w/4;
			var wallheight = 3*boxscale;
			var V1 = new Vector2(0,wallheight);
			var V2 = V1.cpy().rotate(-360/3);
			var wallwidth = V2.x;
			var step = -V2.y;
			var cx = left+step_w/2;
			var cy = bottom-step/3;
			cx = 0;
			cy = 0;
			var sh = this.shapeRenderer;
			sh.setColor(c_1);
			var breite = step_w/3;
			drawBox(sh, cx-breite, cy, breite);
			drawBox(sh, cx+breite, cy, breite);
			drawBox(sh, cx, cy+breite, breite);
			drawBox(sh, cx, cy-breite, breite);
			drawBox(sh, cx-breite, cy+breite, breite);
			drawBox(sh, cx-breite, cy-breite, breite);
			drawBox(sh, cx+breite, cy+breite, breite);
			drawBox(sh, cx+breite, cy-breite, breite);
			var lh = breite/14;
			var cr = breite/7;
			sh.setColor(c_2);
			sh.rect(-breite/2 + lh/2,-breite/2 +lh/2 +cr,breite-lh,breite-lh-cr*2);
			sh.quad(cx-breite/2 + lh/2,cy-breite/2 +lh/2 +cr,
					-breite/2 +lh/2 +cr,-breite/2 +lh/2,
					breite/2 -lh/2 -cr,-breite/2 +lh/2,
					cx+breite/2 - lh/2,cy-breite/2 +lh/2 +cr
			);
			sh.quad(cx-breite/2 + lh/2,cy+breite/2 -lh/2 -cr,
					-breite/2 +lh/2 +cr,breite/2 -lh/2,
					breite/2 -lh/2 -cr,breite/2 -lh/2,
					cx+breite/2 - lh/2,cy+breite/2 -lh/2 -cr
			);
			function drawBox(sr,cx,cy,breite) {
				var cw = breite/7;
				var cr = breite/7;
				var crl = Math.sqrt(cr*cr+cr*cr);
				drawBlob(sr, cx, cy, cw*6.5, cr, crl);
				drawBlob(sr, cx, cy, cw*4.5, cr, crl);
				drawBlob(sr, cx, cy, cw*2.5, cr, crl);
			}
			function drawBlob(sr,cx,cy,cw,cr,crl){
				var lh = cr /2;
				sr.rect(cx-(cw/2)+cr,
						cy-(cw/2),
						cw - cr*2, lh);
				sr.rect(cx-(cw/2)+cr,
						cy+(cw/2)-lh,
						cw - cr*2, lh);
				sr.rect(cx-(cw/2),
						cy-(cw/2)+cr,
						lh, cw - cr*2);
				sr.rect(cx+(cw/2)-lh,
						cy-(cw/2)+cr,
						lh, cw - cr*2);
				sr.rotateRect(cx+cw/2 -cr,
						cy-cw/2,
						0,0,
						crl, crl/2, 1, 1, 45);
				sr.rotateRect(cx-cw/2+cr,
						cy+cw/2,
						0,0,
						crl, crl/2, 1, 1, 45+180);
				sr.rotateRect(cx+cw/2,
						cy+cw/2-cr,
						0,0,
						crl, crl/2, 1, 1, 45+90);
				sr.rotateRect(cx-cw/2,
						cy-cw/2+cr,
						0,0,
						crl, crl/2, 1, 1, 45-90);
			}
			return this.shapeRenderer.returnDrawing();
		};
	}
}


function render() {
	var delta = clock.getDelta();

	if (playback) {
		if (CAPTURE) {
			zpos += zoomSpeed*capturespeed / world.stepScale;
		} else {
			zpos += zoomSpeed*delta / world.stepScale;
		}
		if (zpos > world.length && !ONECYCLE) {
			zpos -= world.length;
		}
	}

	var currentPosition = Math.floor(zpos-1);
	if (currentPosition <= world.length) {
		currentPosition += world.length;
	}

	var stepArray = [];

	for (var i = 0; i < world.visibleSteps; i++) {
		var j = (currentPosition+i)%world.steps.length;
		stepArray[i] = world.steps[ j ];
	};

	var blendstep = zpos%1;

	for (var i = 0; i < world.length; i++) {
		world.steps[i].visible = false;
		world.steps[i].onscreen = false;
	};
	var scale = Math.pow(world.stepScale,(zpos%1))*world.stepScale*world.startScale;
	for (var i = 0; i < stepArray.length; i++) {
		stepArray[i].visible = true;
		stepArray[i].scale.x = size*scale;
		stepArray[i].scale.y = size*scale;
		stepArray[i].position.z = i*10;
		if (i == stepArray.length-1) {
			alpha = blendstep;
		}
		scale *= 1/world.stepScale;
		stepArray[i].onscreen = true;
		stepArray[i].colorchange = true;
	};
	renderer.render(scene, camera);


	if (CAPTURE) {
		if (!ONECYCLE && frame > 0 && frame%capturesegmentlength==0 && currentsegment < capturesegments.length-1) {
			currentsegment++;
			setWorld(capturesegments[currentsegment]);
		}
		if ( (ONECYCLE && zpos < world.length) || (!ONECYCLE && frame < totalcapturelength) ) {
			writeImage();
			window.setTimeout(render, 1);
		}
		if (ONECYCLE) {
			console.log(zpos.toFixed(2)+" / "+world.length);
		}
	} else if (!CAPTURE) {
		requestAnimationFrame(render);
	}


	for (var i = 0; i < world.length; i++) {
		if (!world.steps[i].onscreen && world.steps[i].colorchange && !CAPTURE && !ONECYCLE) {
			world.steps[i].colorchange = false;
			changeColor(world.steps[i]);
		}
	};

};

// function writeImage() {
// 	var canvasData = renderer.domElement.toDataURL('image/png');
// 	var ajax = new XMLHttpRequest();
// 	ajax.open("POST",'capture/write.php?type=png&frame='+frame,false);
// 	ajax.setRequestHeader('Content-Type', 'application/upload');
// 	ajax.send(canvasData );
// 	frame++;
// }

function writeImage() {
	// var canvasData = canvas.toDataURL('image/jpeg', 0.95);
  /*
	var canvasData = renderer.domElement.toDataURL('image/png');

	$.ajax({
		url: 'capture/write.php',
		method: "POST",
		data: {
			type: 'png',
			frame: frame,
			imagedata: canvasData
		}
	}).done(function(data) {
	}).error(function( jqXHR, textStatus, errorThrown ) {
		console.log( "Saving image failed: " + textStatus + ": " + errorThrown );
	});
	frame++;
  */
}



function changeColor(step) {
	for (var i = 0; i < step.children.length; i++) {
		step.children[i].material.color = randomColor();
		step.children[i].colorsNeedUpdate = true;
	}
}
function changeAllColors() {
	for (var i = 0; i < world.length; i++) {
		world.steps[i].colorchange = false;
		changeColor(world.steps[i]);
	};
}


/** init **/
for (w in worlds) {
    if (worlds.hasOwnProperty(w)) {
		inherit(worlds[w], World);
		worlds[w] = new worlds[w]();
		worlds[w].constructSteps();
    }
}

var worldArray = [
	worlds.Leaf,
	// worlds.Blossom,
	worlds.Akanthus,
	// worlds.Crest,
	worlds.General,
	worlds.Circuit,
	worlds.Sultan,
	worlds.Cube,
	worlds.Circles
];
var world;
var worldIndex = 0;

function setWorld(index) {
	worldIndex = index;
	index = index%worldArray.length;
	for(var j = 0 ; j < worldbuttons.length; j++){
		 if (worldbuttons[j].classList.contains('current')) {
		 	worldbuttons[j].classList.remove('current');
		 }
	}
	worldbuttons[index].classList.add('current');
	if (world) {
		for (var i = 0; i < world.steps.length; i++) {
			scene.remove(world.steps[i]);
		}
	}
	world = worldArray[index];
	for (var i = 0; i < world.steps.length; i++) {
		scene.add(world.steps[i]);
	}
	changeAllColors();
}

function prevWorld() {
	if (worldIndex>0)
		setWorld(worldIndex-1);
	else
		setWorld(worldArray.length-1);
}
function nextWorld() {
	setWorld(worldIndex+1);
}
//** ui **/

window.addEventListener('keydown', function(e) {
    switch(e.keyCode) {
    	case 49:
    		setWorld(0);
    		break;
       	case 50:
    		setWorld(1);
    		break;
       	case 51:
    		setWorld(2);
    		break;
       	case 52:
    		setWorld(3);
    		break;
       	case 53:
    		setWorld(4);
    		break;
    	case 54:
    		setWorld(5);
    		break;
    	case 55:
    		setWorld(6);
    		break;
    	case 56:
    		setWorld(7);
    		break;
    	case 57:
    		setWorld(8);
    		break;
    	case 37:
    		prevWorld();
    		break;
    	case 39:
    		nextWorld();
    		break;
    	case 38:
    		prevWorld();
    		break;
    	case 40:
    		nextWorld();
    		break;
    	case 32:
    		nextWorld();
    		break;
    }
	// switch (e.key) {
	// 		case "p":
	// 			playback = (! playback );
	// 			console.log(playback);
	// 			break;
	// 		case "r":
	// 			changeAllColors();
	// 			break;
	// 	}
	// console.log(e.key);
});


var worldbuttons = document.getElementById('worldbuttons').childNodes;
for(var j = 0 ; j < worldbuttons.length; j++){
    var elem = worldbuttons[j];
    elem.onclick = function(e){
        for(var i = 0 ; i < worldbuttons.length; i++){
        	if (worldbuttons[i] === this)
        		break;
        }
        setWorld(i);
    };
}
var colorbutton = document.getElementById('color');
var greybutton = document.getElementById('grey');

colorbutton.onclick = function (e) {
	greybutton.classList.remove('current');
	colorbutton.classList.add('current');
	colorstyle = 'color';
	changeAllColors();
}
greybutton.onclick = function (e) {
	greybutton.classList.add('current');
	colorbutton.classList.remove('current');
	colorstyle = 'grey';
	changeAllColors();
}



var idletime = Date.now();
var nav = document.getElementById("nav");

if (!CAPTURE) {
	document.body.addEventListener('mousemove', function(e) {
		idletime = Date.now();
	});
	function navFade(){
		if (Date.now() - idletime > 5000) {
			document.body.classList.add("navhidden");
		} else {
			document.body.classList.remove("navhidden");
		}
		setTimeout(navFade,100)
	};
	setTimeout(navFade,100)
}

//** **//

function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	if (CAPTURE) {
		width = video_width;
		height = video_height;
	}
	size = Math.max(width, height)/4;
	camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -500, 1000 );
	camera.aspect = width / height;
    camera.updateProjectionMatrix();
	renderer.setSize(width, height);
}


window.addEventListener('resize', resize, false);

/****************/
/* Fullscreen	*/
/****************/

var isFullscreen = false;

document.addEventListener('fullscreenchange', function () {
    isFullscreen = !!document.fullscreen;
}, false);
document.addEventListener('mozfullscreenchange', function () {
    isFullscreen = !!document.mozFullScreen;
}, false);
document.addEventListener('webkitfullscreenchange', function () {
    isFullscreen = !!document.webkitIsFullScreen;
}, false);
function toggleFullScreen() {
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
		enterFull();
	} else {
		exitFull();
	}
}

function enterFull() {
	if (document.documentElement.requestFullscreen) {
	  document.documentElement.requestFullscreen();
	} else if (document.documentElement.msRequestFullscreen) {
	  document.documentElement.msRequestFullscreen();
	} else if (document.documentElement.mozRequestFullScreen) {
	  document.documentElement.mozRequestFullScreen();
	} else if (document.documentElement.webkitRequestFullscreen) {
	  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	}
}

function exitFull() {
	if (document.exitFullscreen) {
	  document.exitFullscreen();
	} else if (document.msExitFullscreen) {
	  document.msExitFullscreen();
	} else if (document.mozCancelFullScreen) {
	  document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
	  document.webkitExitFullscreen();
	}
}

document.getElementById('fullscreentoggle').addEventListener('click', toggleFullScreen);

//** go **//

if (CAPTURE) {
	setWorld(capturesegments[currentsegment]);
	resize();
} else {
	setWorld(0);
	renderer.domElement.onclick = function() {
		nextWorld();
	};

}
render();

})();
