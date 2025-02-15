import * as THREE from 'three';

export class VFX {

    // Create black birds with flocking behavior
    birdTexture = new THREE.TextureLoader().load('textures/birds.png'); 
        
    birds = [];
    birdCount = 50;

    // Flocking behavior and update functions
    MAX_VELOCITY = 0.3;
    MAX_FORCE = 0.05;


    leafTexture = new THREE.TextureLoader().load('textures/leaf.png');  // Load the leaf texture
    
    leaves = [];
    leafCount = 500;  // Adjust the number of leaves
    
    // Gravity and wind constants
    GRAVITY = -0.00001; // Reduce gravity to make the fall slower


    constructor(scene) {
        //---------------- Birds flying
        for (let i = 0; i < this.birdCount; i++) {
            const bird = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.birdTexture,
                transparent: true,
                opacity: 1.0,
                color: 0x000000  // Set bird color to black
            }));
        
            bird.position.set(
                Math.random() * 100 - 50,  
                Math.random() * 50 + 20,   
                Math.random() * 100 - 50   
            );
        
            bird.velocity = new THREE.Vector3(
                Math.random() * 0.2 - 0.1,  
                Math.random() * 0.1 + 0.05, 
                Math.random() * 0.2 - 0.1   
            );
        
            scene.add(bird);
            this.birds.push(bird);
        }

        //----------------------- Leaves falling
        // Create the leaves
        for (let i = 0; i < this.leafCount; i++) {
            const leaf = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.leafTexture,
                transparent: true,
                opacity: 1.0,
                color: 0xffa500  // Leaves can be green (or change as desired)
            }));
        
            // Set random initial positions
            leaf.position.set(
                Math.random() * 100 - 50,  // Random x position
                Math.random() * 50 + 50,   // Random y position, leaves start high
                Math.random() * 100 - 50   // Random z position
            );
        
            // Randomize the velocity and size of each leaf
            leaf.velocity = new THREE.Vector3(
                Math.random() * 0.05 - 0.025,  // Random horizontal velocity (small)
                Math.random() * -0.02 - 0.1,   // Random vertical velocity (falling down)
                Math.random() * 0.05 - 0.025   // Random horizontal velocity (small)
            );
        
            // Randomize the leaf's rotation speed for a more natural falling effect
            leaf.rotationSpeed = Math.random() * 0.02 - 0.01;  // Random rotation speed
            leaf.angularVelocity = Math.random() * 0.02 - 0.01;  // Random angular velocity to simulate spinning
        
            // Add the leaf to the scene and store it in the leaves array
            scene.add(leaf);
            this.leaves.push(leaf);
        }
    }


    separation(bird) {
        const desiredSeparation = 10;
        let steer = new THREE.Vector3();
        let count = 0;
    
        this.birds.forEach(otherBird => {
            const distance = bird.position.distanceTo(otherBird.position);
            if (distance > 0 && distance < desiredSeparation) {
                let diff = new THREE.Vector3().subVectors(bird.position, otherBird.position);
                diff.normalize();
                diff.divideScalar(distance);  // Weight by distance
                steer.add(diff);
                count++;
            }
        });
    
        if (count > 0) {
            steer.divideScalar(count);  // Average
        }
    
        if (steer.length() > 0) {
            steer.normalize();
            steer.multiplyScalar(this.MAX_VELOCITY);
            steer.sub(bird.velocity);
            steer.clampLength(0, this.MAX_FORCE);
        }
    
        return steer;
    }



    alignment(bird) {
        const neighborDist = 50;
        let steer = new THREE.Vector3();
        let count = 0;
    
        this.birds.forEach(otherBird => {
            const distance = bird.position.distanceTo(otherBird.position);
            if (distance > 0 && distance < neighborDist) {
                steer.add(otherBird.velocity);
                count++;
            }
        });
    
        if (count > 0) {
            steer.divideScalar(count);  // Average velocity
            steer.normalize();
            steer.multiplyScalar(this.MAX_VELOCITY);
            steer.sub(bird.velocity);
            steer.clampLength(0, this.MAX_FORCE);
        }
    
        return steer;
    }



    cohesion(bird) {
        const neighborDist = 50;
        let steer = new THREE.Vector3();
        let count = 0;
    
        this.birds.forEach(otherBird => {
            const distance = bird.position.distanceTo(otherBird.position);
            if (distance > 0 && distance < neighborDist) {
                steer.add(otherBird.position);
                count++;
            }
        });
    
        if (count > 0) {
            steer.divideScalar(count);  // Average position
            steer.sub(bird.position);  // Steer towards the target
            steer.normalize();
            steer.multiplyScalar(this.MAX_VELOCITY);
            steer.sub(bird.velocity);
            steer.clampLength(0, this.MAX_FORCE);
        }
    
        return steer;
    }



    updateBird(bird) {
        const sep = this.separation(bird);
        const align = this.alignment(bird);
        const coh = this.cohesion(bird);
    
        bird.velocity.add(sep);
        bird.velocity.add(align);
        bird.velocity.add(coh);
    
        bird.velocity.clampLength(0, this.MAX_VELOCITY);  // Limit speed
        bird.position.add(bird.velocity);  // Update position
    
        // Optional: Randomize vertical movement
        if (Math.random() < 0.05) {
            bird.velocity.y += Math.random() * 0.05 - 0.025;
        }
    
        // Keep birds flying within the y-axis limits
        if (bird.position.y > 60) bird.velocity.y = -Math.abs(bird.velocity.y);
        if (bird.position.y < 20) bird.velocity.y = Math.abs(bird.velocity.y);
    }
    


    animateBirds() {
        this.birds.forEach(bird => {
            this.updateBird(bird);
            
            // Handle out-of-bounds birds
            if (bird.position.x > 50) bird.position.x = -50;
            if (bird.position.x < -50) bird.position.x = 50;
            if (bird.position.z > 50) bird.position.z = -50;
            if (bird.position.z < -50) bird.position.z = 50;
        });
    }



    // Update the falling leaves
    updateLeaves() {
        this.leaves.forEach(leaf => {
            // Apply gravity to the leaf (slowly falling down)
            leaf.velocity.y += this.GRAVITY;
            
            // Apply wind gusts gently, with some random variations
            const randomWind = new THREE.Vector3(
                Math.random() * 0.02 - 0.01,  // Random horizontal drift
                0,                            // No vertical wind
                Math.random() * 0.02 - 0.01   // Random side-to-side drift
            );
    
            leaf.velocity.add(randomWind);  // Add small random wind gusts
    
            // Update leaf position based on its velocity
            leaf.position.add(leaf.velocity);
    
            // Apply rotation and slight wobbling for realism
            leaf.rotation.z += leaf.angularVelocity;
    
            // Leaf starts spinning randomly (simulating a leaf falling and flipping)
            leaf.angularVelocity += Math.random() * 0.001 - 0.0005;
    
            // Reset position if the leaf goes too low (looping back to top)
            if (leaf.position.y < -50) {
                leaf.position.y = Math.random() * 50 + 50;  // Random height to simulate reappearing at the top
                leaf.position.x = Math.random() * 100 - 50;
                leaf.position.z = Math.random() * 100 - 50;
                leaf.velocity.set(
                    Math.random() * 0.05 - 0.025,  // Reset horizontal velocity
                    Math.random() * -0.02 - 0.1,   // Reset vertical velocity (slow fall)
                    Math.random() * 0.05 - 0.025   // Reset horizontal velocity
                );
                leaf.angularVelocity = Math.random() * 0.02 - 0.01;  // Reset rotation
            }
        });
    }

}