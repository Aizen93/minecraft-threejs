import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { DataStore } from './dataStore';


export class World extends THREE.Group {

    asyncLoading = true;

    drawDistance = 2;

    chunkSize = { 
        width: 32,
        height: 32
    };

    params = {
        seed: 0,
        terrain: {
            scale : 30,
            magnitude: 10,
            offset: 4,
            waterHeight: 5
        },
        trees: {
            trunkHeight: {
                min: 4,
                max: 7
            },
            canopy: {
                size: {
                    min: 2,
                    max: 4,
                },
                density: 0.8
            },
            frequency: 0.01
        },
        clouds: {
            draw: false,
            scale: 30,
            density: 0.35
        }
    }

    dataStore = new DataStore();


    constructor(seed = 0) {
        super();
        this.seed = seed;
    }



    generate(){
        this.dataStore.clear();
        this.disposeChunks();

        for(let x = this.drawDistance1; x <= this.drawDistance; x++) {
            for(let z = -this.drawDistance; z <= this.drawDistance; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
                chunk.position.set(
                    x * this.chunkSize.width,
                    0, 
                    z * this.chunkSize.width)
                chunk.userData = {x, z};
                chunk.generate();
                
                this.add(chunk);
            }
        }
    }



    /**
     * Updates the visible portion of the world based on the player's position
     * @param {Player} player 
     */
    update(player) {
        const visibleChunks = this.getVisibleChunks(player);

        const chunksToAdd = this.getChunksToAdd(visibleChunks);

        this.removeUnusedChunks(visibleChunks);

        for(const chunk of chunksToAdd) {
            this.generateChunk(chunk.x, chunk.z);
        }
    }



    /**
     * Returns an array containing the coordinates of the visible chunks
     * @param {Player} player 
     * @returns {{x: number, z: number}[]}
     */
    getVisibleChunks(player) {
        const visibleChunks = [];

        const coords = this.worldToChunkCoords(
            player.position.x,
            player.position.y,
            player.position.z,
        );

        const chunkX = coords.chunk.x;
        const chunkZ = coords.chunk.z;

        for(let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
            for(let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
                visibleChunks.push({x, z});
            }
        }

        return visibleChunks;
    }



    /**
     * Returns array containing coordinates of the chunks that are not yet loaded and need to be added to the scene
     * @param {{x: number, z: number}[]} visibleChunks 
     * @returns {{x: number, z: number}[]}
     */
    getChunksToAdd(visibleChunks) {
        return visibleChunks.filter((chunk) => {
            const chunkExist = this.children
                .map((obj) => obj.userData)
                .find(({x, z}) => (
                    chunk.x === x && chunk.z === z
                ));

            return !chunkExist;
        })
    }



    /**
     * Removes loaded chunks that are no longer visible
     * @param {{x: number, z: number}[]} visibleChunks 
     */
    removeUnusedChunks(visibleChunks) {
        const chunksToRemove = this.children.filter((chunk) => {
            const {x, z} = chunk.userData;
            const chunkExists = visibleChunks
                .find((visibleChunk) => (
                    visibleChunk.x === x && visibleChunk.z === z
                ));

            return !chunkExists;
        });

        for(const chunk of chunksToRemove) {
            chunk.disposeInstances();
            this.remove(chunk);
        }
    }



    /**
     * 
     * @param {number} x 
     * @param {number} z 
     */
    generateChunk(x, z) {
        const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
        chunk.position.set(
            x * this.chunkSize.width,
            0, 
            z * this.chunkSize.width)
        chunk.userData = {x, z};

        if(this.asyncLoading) {
            requestIdleCallback(chunk.generate.bind(chunk), {timeout: 1000});
        } else {
            chunk.generate();
        }
        
        this.add(chunk);
    }



    /**
     * Gets the block data at x y z
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {{id: number, instanceId: number} | null}
     */
    getBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if (chunk && chunk.loaded) {
            return chunk.getBlock(
                coords.block.x,
                coords.block.y,
                coords.block.z
            );
        }

        return null;
    }



    /**
     * Returns the coordinates of the block at world (x,y,z)
     *  - `chunk` is the coordinates of the chunk containing the block
     *  - `block` is the coordinates of the block relative to the chunk
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {{
     *  chunk: { x: number, z: number},
     *  block: { x: number, y: number, z: number}
     * }}
     */
    worldToChunkCoords(x, y, z) {
        const chunkCoords = {
            x: Math.floor(x / this.chunkSize.width),
            z: Math.floor(z / this.chunkSize.width)
        };
      
        const blockCoords = {
            x: x - this.chunkSize.width * chunkCoords.x,
            y,
            z: z - this.chunkSize.width * chunkCoords.z
        };
    
        return {
            chunk: chunkCoords,
            block: blockCoords
        }
    }



    /**
     * Returns the WorldChunk object at the specified coordinates
     * @param {number} chunkX
     * @param {number} chunkZ
     * @returns {WorldChunk | null}
     */
    getChunk(chunkX, chunkZ) {
        return this.children.find((chunk) => (
            chunk.userData.x === chunkX &&
            chunk.userData.z === chunkZ
        ));
    }



    disposeChunks() {
        this.traverse((chunk) => {
            if(chunk.disposeInstances) chunk.disposeInstances();
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
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if(chunk){
            chunk.removeBlock(
                coords.block.x,
                coords.block.y,
                coords.block.z
            );

            this.revealBlock(x - 1, y, z);
            this.revealBlock(x + 1, y, z);
            this.revealBlock(x, y - 1, z);
            this.revealBlock(x, y + 1, z);
            this.revealBlock(x, y, z - 1);
            this.revealBlock(x, y, z + 1);
        }
    }



    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    revealBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if(chunk){
            chunk.addBlockInstance(
                coords.block.x,
                coords.block.y,
                coords.block.z
            );
        }
    }




    /**
     * Adds a new block at (x,y,z)
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {number} blockId 
     */
    addBlock(x, y, z, blockId) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
        
        if (chunk) {
            chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);

            // Hide any blocks that may be totally obscured
            this.hideBlockIfNeeded(x - 1, y, z);
            this.hideBlockIfNeeded(x + 1, y, z);
            this.hideBlockIfNeeded(x, y - 1, z);
            this.hideBlockIfNeeded(x, y + 1, z);
            this.hideBlockIfNeeded(x, y, z - 1);
            this.hideBlockIfNeeded(x, y, z + 1);
        }
    }



    /**
     * Hides the block at (x,y,z) by removing the  new mesh instance
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    hideBlockIfNeeded(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
        
        // Remove the block instance if it is totally obscured
        if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
            chunk.deleteBlockInstance(
                coords.block.x, 
                coords.block.y, 
                coords.block.z
            );
        }
    }
}