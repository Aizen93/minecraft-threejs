import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { RNG } from './rng';
import { blocks, resources } from './blocks';

const geometry = new THREE.BoxGeometry();
const loader = new RGBELoader(); // Make sure you import RGBELoader from Three.js
const textureLoader = new THREE.TextureLoader(); 


export class WorldChunk extends THREE.Group {
    /**
     * @type{{
     *  id: number,
     *  instanceId: number
     * }[][][]}
     */
    data = [];

    constructor(size, params, dataStore){
        super();
        this.loaded = false;
        this.size = size;
        this.params = params;
        this.dataStore = dataStore;
    }



    /**
     * Generates world data and meshes
     */
    generate() {
        
        const rng = new RNG(this.params.seed);
        this.initializeTerrain();
        this.generateRessources(rng);
        this.generateTerrain(rng);

        const start = performance.now();
        this.generateTrees(rng);
        console.log("Tree generated in : " + (performance.now() - start) + " ms");

        if(this.params.clouds.draw) this.generateClouds(rng);
        this.loadPlayerChanges();
        this.generateMeshes();

        this.loaded = true;

       
    }



    /**
     * Intialize world terrain
     */
    initializeTerrain() {
        this.data = [];

        for(let x = 0; x < this.size.width; x++) {
            const slice = [];
            for(let y = 0; y < this.size.height; y++) {
                const row = [];
                for(let z = 0; z < this.size.width; z++) {
                    row.push({
                        id: blocks.empty.id,
                        instanceId: null
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }



    /**
     * Generate resources (Stone, Coal, Diamonds, Gold...etc)
     */
    generateRessources(rng) {
        const simplex = new SimplexNoise(rng);

        resources.forEach(resource => {
            for(let x = 0; x < this.size.width; x++) {
                for(let y = 0; y < this.size.height; y++) {
                    for(let z = 0; z < this.size.width; z++) {
                        //Adding stones
                        const value = simplex.noise3d(
                            (this.position.x + x) / resource.scale.x, 
                            (this.position.y + y) / resource.scale.y, 
                            (this.position.z + z) / resource.scale.z);
                        if(value > resource.scarcity) {
                            this.setBlockId(x, y, z, resource.id);
                        }
                    }
                }
            }
        })
    }



    /**
     * Generate terrain data
     */
    generateTerrain(rng) {
        const simplex = new SimplexNoise(rng);

        for(let x = 0; x < this.size.width; x++) {
            for(let z = 0; z < this.size.width; z++) {
                //Compute the noise value at this x z location
                const value = simplex.noise(
                    (this.position.x + x) / this.params.terrain.scale, 
                    (this.position.z + z) / this.params.terrain.scale
                );

                //Scale the noise based on the magnitude/offset
                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;

                //Computing the height of the terrain in this x z location
                let height = Math.floor(scaledNoise);

                //Clamping height between 0 and max height
                height = Math.max(0, Math.min(height, this.size.height - 1));

                //Fill all blocks at or below the terrain height
                for(let y = 0; y <= this.size.height; y++) {
                    if(y <= this.params.terrain.waterHeight && y <= height){
                        this.setBlockId(x, y, z, blocks.sand.id);

                    } else if(y === height) {
                        this.setBlockId(x, y, z, blocks.grass.id);

                    } else if(y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
                        this.setBlockId(x, y, z, blocks.dirt.id);

                    } else if(y > height) {
                        this.setBlockId(x, y, z, blocks.empty.id);
                    }
                }
            }
        }
    }



    /**
     * 
     * @param {RNG} rng 
     */
    generateTrees() {
        const generateTreeTrunk = (x, z, rng) => {
            const minH = this.params.trees.trunkHeight.min;
            const maxH = this.params.trees.trunkHeight.max;
            const h = Math.round(minH + (maxH - minH) * rng.random());

            for (let y = 0; y < this.size.height; y++) {
                const block = this.getBlock(x, y, z);
                if(block && block.id === blocks.grass.id) {
                    for (let treeY = y + 1; treeY <= y + h; treeY++) {
                        this.setBlockId(x, treeY, z, blocks.flower_tree.id);
                    }
                    generateTreeCanopy(x, y + h, z, rng);
                    break;
                }
            }
        }

        const generateTreeCanopy = (centerX, centerY, centerZ, rng) => {
            const minR = this.params.trees.canopy.size.min;
            const maxR = this.params.trees.canopy.size.max;
            const r = Math.round(minR + (maxR - minR) * rng.random());
            
            for (let x = -r; x <= r; x++) {
                for (let y = -r; y <= r; y++) {
                    for (let z = -r; z <= r; z++) {
                        const n = rng.random();

                        if(x * x + y * y + z * z >= r * r) continue;

                        const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
                        if(block && block.id !== blocks.empty.id) continue;
                        if(n < this.params.trees.canopy.density) {
                            this.setBlockId(centerX + x, centerY + y, centerZ + z, blocks.flower_leaves.id);
                        }
                    }
                }
            }
        }

        let rng = new RNG(this.params.seed);
        let offset = this.params.trees.canopy.size.max;

        for (let x = offset; x < this.size.width - offset; x++) {
            for (let z = offset; z < this.size.width - offset; z++) {
                if(rng.random() < this.params.trees.frequency){
                    generateTreeTrunk(x, z, rng);
                }
            }
        }
    }



    /**
     * 
     * @param {*} rng 
     */
    generateClouds(rng) {
        const simplex = new SimplexNoise(rng);

        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const value = (simplex.noise(
                    (this.position.x + x) / this.params.clouds.scale,
                    (this.position.z + z) / this.params.clouds.scale,
                ) + 1) * 0.5;

                if(value < this.params.clouds.density) {
                    this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
                    
                }
            }
        }

    }



    loadPlayerChanges() {
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    // Overwrite with value in data store if it exists
                    if (this.dataStore.contains(this.position.x, this.position.z, x, y, z)) {
                        const blockId = this.dataStore.get(this.position.x, this.position.z, x, y, z);
                        this.setBlockId(x, y, z, blockId);
                    }
                }
            }
        }
    }



    generateMeshes() {
        this.clear();

        this.generateWater();

        const maxCount = this.size.width * this.size.width * this.size.height;

        //Creating a lookup table where the key is the block id
        const meshes = {};

        Object.values(blocks)
            .filter(blockType => blockType.id !== blocks.empty.id)
            .forEach(blockType => {
                const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
                mesh.name = blockType.id;
                mesh.count = 0;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                meshes[blockType.id] = mesh;
            });

        const matrix = new THREE.Matrix4();

        for(let x = 0; x < this.size.width; x++) {
            for(let y = 0; y < this.size.height; y++) {
                for(let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id;

                    if(blockId == blocks.empty.id) continue;

                    const mesh = meshes[blockId];
                    const instanceId = mesh.count;

                    if(!this.isBlockObscured(x, y, z)) {
                        matrix.setPosition(x, y, z);
                        mesh.setMatrixAt(instanceId, matrix);

                        this.setBlockInstanceId(x, y, z, instanceId);
                        mesh.count++;
                    }
                }
            }
        }

        this.add(...Object.values(meshes));
    }



    generateWater() {
        /*const textureLoader = new THREE.TextureLoader();
        const waterTexture = textureLoader.load('textures/Water.jpg'); // Replace with a proper texture

        // Enable tiling for the texture
        waterTexture.wrapS = THREE.RepeatWrapping;
        waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(4, 4);

        // Create a water material with reflections
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a9bdc, // Nice blue water color
            transparent: true,
            opacity: 0.6, // Slight transparency for realism
            roughness: 0.3, // Some smoothness but not perfect
            metalness: 0.5, // Helps with reflections
            map: waterTexture, // Adds surface details
            side: THREE.DoubleSide
        });*/

        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x9090e0,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          });

        const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), waterMaterial);
        waterMesh.rotateX(-Math.PI / 2);
        waterMesh.position.set(
            this.size.width / 2,
            this.params.terrain.waterHeight + 0.4,
            this.size.width / 2
        );
        waterMesh.scale.set(this.size.width, this.size.width, 1);
        waterMesh.layers.set(1);
        this.add(waterMesh);
    }



    /**
     * Gets the block data at x y z
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {{id: number, instanceId: number}}
     */
    getBlock(x, y, z) {
        if(this.inBounds(x, y, z)) {
            return this.data[x][y][z];
        }

        return null;
    }



    /**
     * Sets the block id for the block at x y z
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} id 
     */
    setBlockId(x, y, z, id) {
        if(this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
        }
    }



    setBlockIdWithoutShadow(x, y, z, id) {
        if(this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
            this.data[x][y][z].receiveShadow = false;
        }
    }



    /**
     * Sets the block instance id for the block at x y z
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @param {*} instanceId 
     */
    setBlockInstanceId(x, y, z, instanceId) {
        if(this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceId = instanceId;
        }
    }



    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {boolean}
     */
    inBounds(x, y, z){
        if(x >= 0 && x < this.size.width &&
            y >= 0 && y < this.size.height &&
            z >= 0 && z < this.size.width) {
            return true;
        }

        return false;
    }



    isBlockObscured(x, y, z) {
        const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
        const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
        const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
        const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
        const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
        const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

        if(up === blocks.empty.id || down === blocks.empty.id ||
            left === blocks.empty.id || right === blocks.empty.id ||
            forward === blocks.empty.id || back === blocks.empty.id
        ) {
            return false;
        }

        return true;
    }



    disposeInstances() {
        this.traverse((obj) => {
            if(obj.dispose) obj.dispose();
        });

        this.clear();
    }



    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    removeBlock(x, y, z) {
        const block = this.getBlock(x, y, z);
        if(block && block.id !== blocks.empty.id) {
            this.deleteBlockInstance(x, y, z);
            this.setBlockId(x, y ,z, blocks.empty.id);
            this.dataStore.set(this.position.x, this.position.z, x, y, z, blocks.empty.id);
        }
    }



    deleteBlockInstance(x, y, z) {
        const block = this.getBlock(x, y, z);

        if (block.id === blocks.empty.id || !block.instanceId) return;

        const mesh = this.children.find((instanceMesh) => instanceMesh.name === block.id);
        const instanceId = block.instanceId;

        const lastMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(mesh.count - 1, lastMatrix);

        const v = new THREE.Vector3();
        v.setFromMatrixPosition(lastMatrix);
        this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

        //Swapping transformation matrices
        mesh.setMatrixAt(instanceId, lastMatrix);

        mesh.count--;

        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();

        this.setBlockInstanceId(x, y, z, null);
    }



    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    addBlockInstance(x, y, z) {
        const block = this.getBlock(x, y, z);

        if(block && block.id !== blocks.empty.id && !block.instanceId) {
            const mesh = this.children.find((instanceMesh) => instanceMesh.name === block.id);
            const instanceId = mesh.count++;
            this.setBlockInstanceId(x, y, z, instanceId);

            const matrix = new THREE.Matrix4();
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        }
    }



    /**
     * Adds a new block at (x,y,z) of type `blockId`
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} blockId 
     */
    addBlock(x, y, z, blockId) {
        if (this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blockId);
            this.addBlockInstance(x, y, z);
            this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
        }
    }

}