import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { World } from './world';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { createUI } from './ui';
import { Player } from './player';
import { Physics } from './physics';
import { blocks } from './blocks';
import { VFX } from './vfx';

//Stats
const stats = new Stats();
document.body.append(stats.dom);

const renderer = new THREE.WebGLRenderer();
renderer .setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);


//Camera
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
orbitCamera.position.set(-32, 16, -32);
orbitCamera.lookAt(0, 0, 0);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();


//Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, 1000, 1000);//Fog(0x80a0e0, 26, 60);
const world = new World();
world.generate();
scene.add(world);


const player = new Player(scene);

const physics = new Physics(scene);

const sun = new THREE.DirectionalLight();

function setupLights() {
	sun.position.set(100, 50, 50);
	sun.castShadow = true;
	sun.shadow.camera.left = -100;
	sun.shadow.camera.right = 100;
	sun.shadow.camera.bottom = -100;
	sun.shadow.camera.top = 100;
	sun.shadow.camera.near = 0.1;
	sun.shadow.camera.far = 200;
	sun.shadow.bias = -0.0001;
	sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
	scene.add(sun);
	scene.add(sun.target);
	
	//const sunDirectionHelper = new THREE.CameraHelper(sun.shadow.camera);
	//scene.add(sunDirectionHelper);
	
	/*
	const light2 = new THREE.DirectionalLight();
	light2.position.set(-1, 1, -0.5);
	scene.add(light2);
	*/

	const ambient = new THREE.AmbientLight();
	ambient.intensity = 0.1;
	scene.add(ambient);
}


//const vfx = new VFX(scene);


let previousTime = performance.now();

//Render Loop
function animate() {
	let currentTime = performance.now();
	let dt = (currentTime - previousTime) / 1000;

	requestAnimationFrame(animate);

	if(player.controls.isLocked) {
		player.update(world);
		physics.update(dt, player, world);

		sun.position.copy(player.position);
		sun.position.sub(new THREE.Vector3(-50, -50, -50));
		sun.target.position.copy(player.position);
	}

	world.update(player);
	//vfx.animateBirds();
	//vfx.updateLeaves();

	renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
	stats.update();

	previousTime = currentTime;
}


function addCrossHair() {
	// Create a crosshair as a sprite
	const crosshairTexture = new THREE.TextureLoader().load('crosshair.png'); 
	const crosshairMaterial = new THREE.SpriteMaterial({ map: crosshairTexture, color: 0xffffff });
	const crosshair = new THREE.Sprite(crosshairMaterial);

	// Adjust size & position
	crosshair.scale.set(0.02, 0.02, 1);  // Keep small so it looks like a crosshair
	crosshair.position.set(0, 0, -0.2);  // Slightly in front of the camera

	// Attach to camera (so it moves with view)
	player.camera.add(crosshair);
}



function onMouseDown(event) {
	if(player.controls.isLocked && player.selectedCoords) {
		if(player.activeBlockId === blocks.empty.id){
			world.removeBlock(
				player.selectedCoords.x,
				player.selectedCoords.y,
				player.selectedCoords.z
			);

		} else {
			world.addBlock(
				player.selectedCoords.x,
				player.selectedCoords.y,
				player.selectedCoords.z,
				player.activeBlockId
			);
		}
	}
}
document.addEventListener('mousedown', onMouseDown);



window.addEventListener('resize', () => {
	orbitCamera.aspect = window.innerWidth / window.innerHeight;
	orbitCamera.updateProjectionMatrix();

	player.camera.aspect = window.innerWidth / window.innerHeight;
	player.camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
});


setupLights();
createUI(scene, world, player);
addCrossHair();
animate();