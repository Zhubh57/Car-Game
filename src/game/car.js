import * as PIXI from 'pixi.js';
import Matter from 'matter-js';

export class Car {
    constructor(container, physicsWorld) {
        this.container = container;
        this.world = physicsWorld;
        
        // Car graphic
        this.sprite = new PIXI.Graphics();
        
        // Draw retro style car (neon pink outline over dark purple)
        this.sprite.lineStyle(2, 0xff2e88, 1);
        this.sprite.beginFill(0x1a0033);
        // Body (centered at 0,0 since Matter.js bodies are center-anchored)
        this.sprite.drawRect(-10, -20, 20, 40);
        // Windshield (cyan)
        this.sprite.beginFill(0x00f5ff, 0.4);
        this.sprite.drawRect(-8, -10, 16, 8);
        this.sprite.endFill();
        // Headlights
        this.sprite.beginFill(0xffffff, 0.8);
        this.sprite.drawRect(-8, -20, 4, 3);
        this.sprite.drawRect(4, -20, 4, 3);
        this.sprite.endFill();

        this.container.addChild(this.sprite);

        // Physics Body
        this.body = Matter.Bodies.rectangle(0, 0, 20, 40, {
            mass: 1000,
            frictionAir: 0.05, // natural slowdown
            restitution: 0.5 // bounciness when hitting buildings/cars
        });
        Matter.World.add(this.world, this.body);

        // Physics/Movement properties
        // Base sensitivity was 0.05. Reduced by 10% = 0.045
        this.turnSpeed = 0.045; 
        this.engineForce = 1.0; 
        this.brakeForce = 0.5;
        this.driftFrictionMultiplier = 0.1; // allows sliding sideways

        // Skidmarks container
        this.skidmarks = new PIXI.Graphics();
        this.container.addChildAt(this.skidmarks, 0); // behind car
    }

    update(dt, input) {
        const vel = this.body.velocity;
        let speed = Math.sqrt(vel.x**2 + vel.y**2);
        
        let targetVelocityX = vel.x;
        let targetVelocityY = vel.y;

        // Acceleration Settings
        const accelParams = 0.5; // pixel velocity increments
        
        // Engine Force (Forward/Reverse)
        if (input.keys.up) {
            targetVelocityX += Math.sin(this.body.angle) * accelParams;
            targetVelocityY += -Math.cos(this.body.angle) * accelParams;
        } else if (input.keys.down) {
            targetVelocityX += -Math.sin(this.body.angle) * accelParams * 0.5; 
            targetVelocityY += Math.cos(this.body.angle) * accelParams * 0.5;
        }

        Matter.Body.setVelocity(this.body, { x: targetVelocityX, y: targetVelocityY });

        // Update speed after acceleration 
        speed = Math.sqrt(this.body.velocity.x**2 + this.body.velocity.y**2);

        // Brakes (Spacebar) -> High air friction to slow down
        if (input.keys.space) {
            Matter.Body.set(this.body, "frictionAir", 0.08); 
        } else {
            Matter.Body.set(this.body, "frictionAir", 0.04);
        }

        // Steering (only if moving)
        if (speed > 0.5) {
            // Direction of movement relative to car's heading to know whether moving forward or backward
            const forwardDot = (this.body.velocity.x * Math.sin(this.body.angle)) + (this.body.velocity.y * -Math.cos(this.body.angle));
            const turnDir = forwardDot >= 0 ? 1 : -1;
            
            const driftMulti = input.keys.space ? 1.5 : 1.0;
            
            if (input.keys.left) {
                Matter.Body.setAngle(this.body, this.body.angle - this.turnSpeed * turnDir * driftMulti);
                Matter.Body.setAngularVelocity(this.body, 0); // kill auto-spin
            } else if (input.keys.right) {
                Matter.Body.setAngle(this.body, this.body.angle + this.turnSpeed * turnDir * driftMulti);
                Matter.Body.setAngularVelocity(this.body, 0);
            }
        }

        // Apply Lateral Friction to kill perfectly sideways sliding (mimics tyre grip)
        const rightVector = { x: Math.cos(this.body.angle), y: Math.sin(this.body.angle) };
        const lateralVelocity = (this.body.velocity.x * rightVector.x) + (this.body.velocity.y * rightVector.y);
        
        // Grip strength (lower = more sliding)
        const tyreGrip = input.keys.space ? 0.02 : 0.2; 
        
        // Remove a portion of the lateral velocity to prevent endless sliding
        Matter.Body.setVelocity(this.body, {
            x: this.body.velocity.x - (rightVector.x * lateralVelocity * tyreGrip),
            y: this.body.velocity.y - (rightVector.y * lateralVelocity * tyreGrip)
        });

        // Kill angular velocity naturally so it doesn't float around endlessly
        Matter.Body.setAngularVelocity(this.body, this.body.angularVelocity * 0.9);

        // Sync Sprite to Body
        this.sprite.x = this.body.position.x;
        this.sprite.y = this.body.position.y;
        this.sprite.rotation = this.body.angle;

        // Effects: Skidmarks if drifting while moving fast laterally
        if (input.keys.space && Math.abs(lateralVelocity) > 2.0 && speed > 3.0) {
            this.drawSkidmark();
        }
    }

    drawSkidmark() {
        const rearWheelDist = 18;
        const widthOff = 8;
        
        const dx1 = Math.sin(this.body.angle + Math.PI/2) * widthOff;
        const dy1 = -Math.cos(this.body.angle + Math.PI/2) * widthOff;
        
        const rX = this.body.position.x - Math.sin(this.body.angle) * rearWheelDist;
        const rY = this.body.position.y + Math.cos(this.body.angle) * rearWheelDist;

        this.skidmarks.beginFill(0x00f5ff, 0.3); // cyan skidmarks
        this.skidmarks.drawCircle(rX + dx1, rY + dy1, 1.5);
        this.skidmarks.drawCircle(rX - dx1, rY - dy1, 1.5);
        this.skidmarks.endFill();
    }

    getSpeed() {
        return Math.sqrt(this.body.velocity.x**2 + this.body.velocity.y**2);
    }
}
