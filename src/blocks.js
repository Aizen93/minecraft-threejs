import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    return texture;
}


const textures = {
    dirt : loadTexture('textures/dirt.png'),
    grass : loadTexture('textures/grass2.png'),
    grassSide : loadTexture('textures/grass_side.png'),
    stone : loadTexture('textures/stone.png'),
    coal : loadTexture('textures/coal_ore.png'),
    iron : loadTexture('textures/iron_ore.png'),
    diamond : loadTexture('textures/diamond_ore.png'),
    gold : loadTexture('textures/gold_ore.png'),
    flower_leaves: loadTexture('textures/flower_tree_leaves.png'),
    flower_tree_side: loadTexture('textures/flower_tree_side.png'),
    flower_tree_top: loadTexture('textures/flower_tree_top.png'),
    sand: loadTexture('textures/sand.png'),
    snow: loadTexture('textures/snow.png'),
    jungleLeaves: loadTexture('textures/jungle_leaves.png'),
    jungleTreeSide: loadTexture('textures/jungle_tree_side.png'),
    jungleTreeTop: loadTexture('textures/jungle_tree_top.png'),
};



export const blocks = {
    empty: {
        id: 0,
        name: 'empty'
    },

    grass: {
        id: 1,
        name: 'grass',
        color: 0x559020,
        material: [
            new THREE.MeshLambertMaterial({map: textures.grassSide }),//right
            new THREE.MeshLambertMaterial({map: textures.grassSide }),//left
            new THREE.MeshLambertMaterial({map: textures.grass }),//top
            new THREE.MeshLambertMaterial({map: textures.dirt }),//bottom
            new THREE.MeshLambertMaterial({map: textures.grassSide }),//front
            new THREE.MeshLambertMaterial({map: textures.grassSide })//back
        ]
    },

    dirt: {
        id: 2,
        name: 'dirt',
        color: 0x807020,
        material: new THREE.MeshLambertMaterial({ map: textures.dirt })
    },

    stone: {
        id: 3,
        name: 'stone',
        color: 0x808080,
        scale: { x : 30, y : 30, z : 30 },
        scarcity : 0.5,
        material: new THREE.MeshLambertMaterial({ map: textures.stone })
    },

    coal: {
        id: 4,
        name: 'coal',
        color: 0x202020,
        scale: { x : 20, y : 20, z : 20 },
        scarcity : 0.75,
        material: new THREE.MeshLambertMaterial({ map: textures.coal })
    },

    iron: {
        id: 5,
        name: 'iron',
        color: 0x806060,
        scale: { x : 60, y : 60, z : 60 },
        scarcity : 0.8,
        material: new THREE.MeshLambertMaterial({ map: textures.iron })
    },

    flower_tree: {
        id: 6,
        name: 'tree',
        material: [
            new THREE.MeshLambertMaterial({map: textures.flower_tree_side }),//right
            new THREE.MeshLambertMaterial({map: textures.flower_tree_side }),//left
            new THREE.MeshLambertMaterial({map: textures.flower_tree_top }),//top
            new THREE.MeshLambertMaterial({map: textures.flower_tree_top }),//bottom
            new THREE.MeshLambertMaterial({map: textures.flower_tree_side }),//front
            new THREE.MeshLambertMaterial({map: textures.flower_tree_side })//back
        ]
    },

    flower_leaves: {
        id: 7,
        name: 'leaves',
        material: new THREE.MeshLambertMaterial({ map: textures.flower_leaves, transparent: true, alphaTest: 0.5 })
    },

    sand: {
        id: 8,
        name: 'sand',
        material: new THREE.MeshLambertMaterial({ map: textures.sand })
    },

    diamond: {
        id: 9,
        name: 'diamond',
        scale: { x : 80, y : 25, z : 29 },
        scarcity : 0.92,
        material: new THREE.MeshLambertMaterial({ map: textures.diamond })
    },

    gold: {
        id: 10,
        name: 'gold',
        scale: { x : 46, y : 18, z : 42 },
        scarcity : 0.88,
        material: new THREE.MeshLambertMaterial({ map: textures.gold })
    },

    cloud: {
        id: 11,
        name: 'cloud',
        material: new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            
        })
    },

    snow: {
        id: 12,
        name: 'snow',
        material: new THREE.MeshLambertMaterial({ map: textures.snow })
    },

    jungleTree: {
        id: 13,
        name: 'jungleTree',
        material: [
            new THREE.MeshLambertMaterial({map: textures.jungleTreeSide }),//right
            new THREE.MeshLambertMaterial({map: textures.jungleTreeSide }),//left
            new THREE.MeshLambertMaterial({map: textures.jungleTreeTop }),//top
            new THREE.MeshLambertMaterial({map: textures.jungleTreeTop }),//bottom
            new THREE.MeshLambertMaterial({map: textures.jungleTreeSide }),//front
            new THREE.MeshLambertMaterial({map: textures.jungleTreeSide })//back
        ]
    },

    jungleLeaves: {
        id: 14,
        name: 'jungleLeaves',
        material: new THREE.MeshLambertMaterial({ map: textures.jungleLeaves, transparent: true, alphaTest: 0.5 })
    },
}

export const resources = [
    blocks.stone,
    blocks.coal,
    blocks.iron,
    blocks.diamond,
    blocks.gold
]