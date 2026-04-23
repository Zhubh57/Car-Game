import * as PIXI from 'pixi.js';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import Matter from 'matter-js';
import { Input } from './game/input.js';
import { Car } from './game/car.js';
import { World } from './game/world.js';
import { Camera } from './game/camera.js';
import { Traffic } from './game/traffic.js';
import { Minimap } from './game/minimap.js';

// Setup PIXI App
const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x1a0033, // Deep purple
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});

document.getElementById('app').appendChild(app.view);

// Setup World Container
const worldContainer = new PIXI.Container();
app.stage.addChild(worldContainer);

// Setup Bloom Filter
const bloomFilter = new AdvancedBloomFilter({
    threshold: 0.1,
    bloomScale: 1.5,
    brightness: 1,
    blur: 4,
    quality: 4
});
app.stage.filters = [bloomFilter];

// Setup Physics Engine (Top-down, so no gravity)
const engine = Matter.Engine.create();
engine.gravity.x = 0;
engine.gravity.y = 0;

// Initialize Game Systems
const input = new Input();
const world = new World(worldContainer, engine.world);
const traffic = new Traffic(worldContainer, engine.world);
const car = new Car(worldContainer, engine.world);
const camera = new Camera(worldContainer, app.screen);
const minimap = new Minimap(document.getElementById('minimap-canvas'));

// Initial Position
Matter.Body.setPosition(car.body, { x: 50, y: 50 });

// UI Elements
const speedValueEl = document.querySelector('.speed-value');

// Game Loop
app.ticker.add((delta) => {
    const dtSeconds = delta / 60; 
    
    // Step physics engine
    Matter.Engine.update(engine, app.ticker.deltaMS);

    // Update Systems
    car.update(dtSeconds, input);
    world.update(car.sprite.x, car.sprite.y);
    traffic.update(dtSeconds, car.sprite.x, car.sprite.y);
    camera.follow(car.sprite, dtSeconds, car.getSpeed());
    
    // Render minimap
    minimap.render(car.sprite.x, car.sprite.y, car, world, traffic);

    // Update UI Speedometer
    let displaySpeed = Math.floor(Math.abs(car.getSpeed() * 5));
    if (displaySpeed > 145) displaySpeed = 145; // Hard cap
    if (Number.isNaN(displaySpeed)) displaySpeed = 0;
    speedValueEl.innerText = displaySpeed;
});

// Update resize handler for camera center
window.addEventListener('resize', () => {
    camera.resize(app.screen);
});
