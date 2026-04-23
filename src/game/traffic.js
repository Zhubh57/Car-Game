import * as PIXI from 'pixi.js';
import Matter from 'matter-js';

export class Traffic {
    constructor(container, physicsWorld) {
        this.container = container;
        this.world = physicsWorld;
        this.cars = [];
        this.poolSize = 12;
        
        for (let i = 0; i < this.poolSize; i++) {
            this.spawnCar();
        }
    }

    spawnCar() {
        const sprite = new PIXI.Graphics();
        
        // Traffic car graphics
        sprite.lineStyle(2, 0x00f5ff, 0.8);
        sprite.beginFill(0x1a0033);
        sprite.drawRect(-10, -20, 20, 40);
        sprite.endFill();
        sprite.beginFill(0xff0000, 0.9);
        sprite.drawRect(-8, 17, 5, 3);
        sprite.drawRect(3, 17, 5, 3);
        sprite.endFill();

        this.container.addChild(sprite);

        // Physics Body (dynamic so they can be crashed into!)
        const body = Matter.Bodies.rectangle(-9999, -9999, 20, 40, {
            mass: 1200,
            frictionAir: 0.05,
            restitution: 0.4
        });
        Matter.World.add(this.world, body);

        this.cars.push({
            sprite: sprite,
            body: body,
            baseSpeed: 10 + Math.random() * 5,
            direction: 0, 
            active: false
        });
    }

    resetCar(car, playerX, playerY) {
        // Spawn distance
        const cellSize = 200;
        
        let gridX = Math.floor(playerX / cellSize) + (Math.floor(Math.random() * 8) - 4);
        let gridY = Math.floor(playerY / cellSize) + (Math.floor(Math.random() * 8) - 4);
        
        let spawnX, spawnY, angle;

        if (Math.random() > 0.5) {
            // Vertical road
            gridX = Math.round(gridX / 5) * 5; 
            car.direction = Math.random() > 0.5 ? 0 : 2; // up or down
            spawnX = gridX * cellSize + (car.direction === 0 ? 50 : 150); 
            spawnY = gridY * cellSize + (Math.random() * cellSize - cellSize/2);
            angle = car.direction === 0 ? 0 : Math.PI;
        } else {
            // Horizontal road
            gridY = Math.round(gridY / 5) * 5; 
            car.direction = Math.random() > 0.5 ? 1 : 3; // right or left
            spawnY = gridY * cellSize + (car.direction === 1 ? 150 : 50); 
            spawnX = gridX * cellSize + (Math.random() * cellSize - cellSize/2);
            angle = car.direction === 1 ? Math.PI/2 : -Math.PI/2;
        }

        Matter.Body.setPosition(car.body, { x: spawnX, y: spawnY });
        Matter.Body.setAngle(car.body, angle);
        Matter.Body.setVelocity(car.body, { x: 0, y: 0 }); // reset velocity
        Matter.Body.setAngularVelocity(car.body, 0);

        car.active = true;
    }

    update(dt, playerX, playerY) {
        const despawnDistSq = 1500 * 1500;

        for (const car of this.cars) {
            if (!car.active) {
                this.resetCar(car, playerX, playerY);
                continue;
            }

            // Dist check
            const distSq = (car.body.position.x - playerX)**2 + (car.body.position.y - playerY)**2;
            if (distSq > despawnDistSq) {
                car.active = false;
                Matter.Body.setPosition(car.body, { x: -9999, y: -9999 }); // hide away
                continue;
            }

            // Apply forward force to keep them moving if they haven't crashed (crudely check velocity)
            const speed = Math.sqrt(car.body.velocity.x**2 + car.body.velocity.y**2);
            
            // If they are mostly facing the right way (meaning they haven't been spun out violently)
            // we keep applying 'engine' force.
            if (speed < car.baseSpeed) {
                const forceX = Math.sin(car.body.angle) * 0.8;
                const forceY = -Math.cos(car.body.angle) * 0.8;
                Matter.Body.applyForce(car.body, car.body.position, { x: forceX, y: forceY });
            }
            
            // Apply lateral friction so they don't slide sideways endlessly after a crash
            const rightVector = { x: Math.cos(car.body.angle), y: Math.sin(car.body.angle) };
            const lateralVelocity = (car.body.velocity.x * rightVector.x) + (car.body.velocity.y * rightVector.y);
            
            const lateralForceX = -rightVector.x * lateralVelocity * 0.8 * car.body.mass * 0.01;
            const lateralForceY = -rightVector.y * lateralVelocity * 0.8 * car.body.mass * 0.01;
            Matter.Body.applyForce(car.body, car.body.position, { x: lateralForceX, y: lateralForceY });

            // Sync sprite
            car.sprite.x = car.body.position.x;
            car.sprite.y = car.body.position.y;
            car.sprite.rotation = car.body.angle;
        }
    }
}
