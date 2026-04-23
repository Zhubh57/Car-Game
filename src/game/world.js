import * as PIXI from 'pixi.js';
import Matter from 'matter-js';

export class World {
    constructor(container, physicsWorld) {
        this.container = container;
        this.physicsWorld = physicsWorld;
        
        this.gridGraphic = new PIXI.Graphics();
        this.container.addChildAt(this.gridGraphic, 0);

        this.cellSize = 200;
        this.viewDistance = 5; // grid cells radius
        
        this.lastGridX = -999;
        this.lastGridY = -999;

        // Track active buildings
        this.buildings = []; // to expose to minimap
        this.buildingBodies = new Map(); // key -> Matter.Body
    }

    update(playerX, playerY) {
        const gridX = Math.floor(playerX / this.cellSize);
        const gridY = Math.floor(playerY / this.cellSize);

        if (gridX !== this.lastGridX || gridY !== this.lastGridY) {
            this.lastGridX = gridX;
            this.lastGridY = gridY;
            this.regenerateWorld(gridX, gridY);
        }
    }

    regenerateWorld(cx, cy) {
        this.gridGraphic.clear();
        this.buildings = [];
        
        // Track what we need this frame
        const neededKeys = new Set();
        
        this.gridGraphic.lineStyle(1, 0x1a0033, 0.5);
        
        for (let i = -this.viewDistance; i <= this.viewDistance; i++) {
            for (let j = -this.viewDistance; j <= this.viewDistance; j++) {
                const gx = cx + i;
                const gy = cy + j;
                const px = gx * this.cellSize;
                const py = gy * this.cellSize;
                
                const isMainRoad = gx % 5 === 0 || gy % 5 === 0;

                if (isMainRoad) {
                    this.gridGraphic.lineStyle(2, 0xff2e88, 0.3); // pink lanes
                } else {
                    this.gridGraphic.lineStyle(1, 0x00f5ff, 0.1); 
                }

                this.gridGraphic.drawRect(px, py, this.cellSize, this.cellSize);

                // If not road, maybe it's a building block
                if (!isMainRoad) {
                    // pseudo random
                    const rand = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233)) * 43758.5453 % 1;
                    if (rand > 0.5) {
                        const bSize = this.cellSize * 0.7;
                        
                        // Center of the block
                        const bx = px + this.cellSize / 2;
                        const by = py + this.cellSize / 2;
                        
                        // Draw building
                        this.gridGraphic.beginFill(0x1a0033, 0.8);
                        this.gridGraphic.lineStyle(2, 0x00f5ff, 0.8); // cyan neon outline
                        this.gridGraphic.drawRect(bx - bSize/2, by - bSize/2, bSize, bSize);
                        this.gridGraphic.endFill();

                        // Add to minimap array
                        this.buildings.push({ x: bx, y: by, w: bSize, h: bSize });

                        const key = `${gx},${gy}`;
                        neededKeys.add(key);

                        // If not explicitly spawned in physics engine, spawn it
                        if (!this.buildingBodies.has(key)) {
                            const body = Matter.Bodies.rectangle(bx, by, bSize, bSize, { 
                                isStatic: true,
                                restitution: 0.5 // bouncy
                            });
                            Matter.World.add(this.physicsWorld, body);
                            this.buildingBodies.set(key, body);
                        }
                    }
                }
            }
        }

        // Cleanup bodies that are too far away (not in neededKeys)
        for (const [key, body] of this.buildingBodies.entries()) {
            if (!neededKeys.has(key)) {
                Matter.World.remove(this.physicsWorld, body);
                this.buildingBodies.delete(key);
            }
        }
    }
}
