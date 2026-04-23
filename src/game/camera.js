export class Camera {
    constructor(container, screen) {
        this.container = container;
        this.screen = { width: screen.width, height: screen.height };
        this.targetZoom = 1.0;
        this.zoom = 1.0;
        // Follow position
        this.x = 0;
        this.y = 0;
    }

    resize(screen) {
        this.screen.width = screen.width;
        this.screen.height = screen.height;
    }

    follow(targetSprite, dt, currentSpeed) {
        // Linear Interpolation for smooth follow
        const lerpFactor = 0.1;
        
        // Calculate dynamic zoom based on speed (zoom out at high speeds)
        // Max speed roughly 25, so if speed is 20, zoom out a bit.
        const speedRatio = Math.min(currentSpeed / 25, 1.0);
        this.targetZoom = 1.2 - (speedRatio * 0.4); // zooms from 1.2 to 0.8
        
        this.zoom += (this.targetZoom - this.zoom) * 0.05;

        // Target position to center the car
        const targetX = targetSprite.x;
        const targetY = targetSprite.y;

        this.x += (targetX - this.x) * lerpFactor;
        this.y += (targetY - this.y) * lerpFactor;

        // Apply camera transforms to the world container
        // Center the screen
        this.container.x = (this.screen.width / 2) - (this.x * this.zoom);
        this.container.y = (this.screen.height / 2) - (this.y * this.zoom);
        
        this.container.scale.x = this.zoom;
        this.container.scale.y = this.zoom;
    }
}
