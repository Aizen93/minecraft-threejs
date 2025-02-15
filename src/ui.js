import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { resources } from "./blocks";

export function createUI(scene, world, player) {
    const gui = new GUI();

    const playerFolder = gui.addFolder('Player');
    playerFolder.add(player, 'maxSpeed', 1, 30).name("Max Speed");
    playerFolder.add(player.cameraHelper, 'visible').name('FPS Camera helper');


    const worldFolder = gui.addFolder('World');
    worldFolder.add(world.chunkSize, 'width', 8, 128, 1).name('Width');
    worldFolder.add(world.chunkSize, 'height', 8, 64, 1).name('Height');
    worldFolder.add(world, 'drawDistance', 0, 5, 1).name('Draw Distance');
    worldFolder.add(world, 'asyncLoading').name('Async chunk loading');


    const fogFolder = gui.addFolder('Fog');
    fogFolder.add(scene.fog, 'near', 1, 1000, 10).name('Near');
    fogFolder.add(scene.fog, 'far', 1, 1000, 10).name('Far');
    

    const terrainFolder = gui.addFolder('Terrain');
    terrainFolder.add(world.params, 'seed', 0, 10000).name('Seed');
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 32, 1).name('Magnitude');
    terrainFolder.add(world.params.terrain, 'offset', 0, 32, 1).name('Offset');
    terrainFolder.add(world.params.terrain, 'waterHeight', 0, 32, 1).name('Water level');


    const resourcesFolder = gui.addFolder('Ressources').close();
    resources.forEach(resource => {
        const resourceFolder = resourcesFolder.addFolder(resource.name);
        resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity');

        const scaleFolder = resourceFolder.addFolder('Scale');
        scaleFolder.add(resource.scale, 'x', 10, 100).name('X Scale');
        scaleFolder.add(resource.scale, 'y', 10, 100).name('Y Scale');
        scaleFolder.add(resource.scale, 'z', 10, 100).name('Z Scale');
        scaleFolder.close();
        resourceFolder.close();
    });

    const treesFolder = terrainFolder.addFolder('Trees').close();
    treesFolder.add(world.params.trees, 'frequency', 0, 0.2).name('Frequency');
    treesFolder.add(world.params.trees.trunkHeight, 'min', 0, 10, 1).name('Min Trunk Height');
    treesFolder.add(world.params.trees.trunkHeight, 'max', 0, 10, 1).name('Max Trunk Height');
    treesFolder.add(world.params.trees.canopy.size, 'min', 0, 10, 1).name('Min Canopy Size');
    treesFolder.add(world.params.trees.canopy.size, 'max', 0, 10, 1).name('Max Canopy Size');
    treesFolder.add(world.params.trees.canopy, 'density', 0, 1).name('Canopy density');


    const cloudsFolder = terrainFolder.addFolder('Clouds').close();
    cloudsFolder.add(world.params.clouds, 'density', 0, 1).name('Cloud Cover');
    cloudsFolder.add(world.params.clouds, 'scale', 0, 100).name('Cloud Size');
    cloudsFolder.add(world.params.clouds, 'draw').name('Draw Clouds');


    worldFolder.onFinishChange(() => {
        world.generate();
    });

    terrainFolder.onFinishChange(() => {
        world.generate();
    });

    resourcesFolder.onFinishChange(() => {
        world.generate();
    });
    
}