export class Minimap {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.scale = 0.05; // how much to shrink the game world to fit viewport
    }

    render(playerX, playerY, car, world, traffic) {
        // Clear old frame
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.ctx.fillStyle = 'rgba(26, 0, 51, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Helper to map world coordinates to minimap coordinates relative to player center
        const getMapPos = (wx, wy) => {
            const dx = (wx - playerX) * this.scale;
            const dy = (wy - playerY) * this.scale;
            return {
                x: this.width/2 + dx,
                y: this.height/2 + dy
            };
        };

        // Draw Buildings
        this.ctx.fillStyle = 'rgba(0, 245, 255, 0.3)'; // cyan blocks
        for (const b of world.buildings) {
            const pos = getMapPos(b.x, b.y);
            const mw = b.w * this.scale;
            const mh = b.h * this.scale;
            this.ctx.fillRect(pos.x - mw/2, pos.y - mh/2, mw, mh);
        }

        // Draw Traffic
        this.ctx.fillStyle = '#00f5ff'; // solid cyan for traffic
        for (const t of traffic.cars) {
            if (t.active) {
                const pos = getMapPos(t.body.position.x, t.body.position.y);
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 2, 0, Math.PI*2);
                this.ctx.fill();
            }
        }

        // Draw Player (Neon Pink)
        this.ctx.fillStyle = '#ff2e88';
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height/2, 4, 0, Math.PI*2);
        this.ctx.fill();
        
        // Draw player heading line
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width/2, this.height/2);
        const headingX = Math.sin(car.body.angle) * 10;
        const headingY = -Math.cos(car.body.angle) * 10;
        this.ctx.lineTo(this.width/2 + headingX, this.height/2 + headingY);
        this.ctx.stroke();
    }
}
