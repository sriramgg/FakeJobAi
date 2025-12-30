/**
 * FakeJobAI - Neural Network Background Visualization
 * Adds a high-tech AI feel to the dashboard.
 */
class NeuralNetwork {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 40 : 85;

        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.willChange = 'transform'; // Hardware acceleration hint
        document.body.prepend(this.canvas);

        window.addEventListener('resize', () => this.resize());

        // Stop animation when tab is not visible to save CPU/Battery
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;
            if (this.isActive) this.animate();
        });

        this.isActive = true;
        this.resize();
        this.createParticles();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Use a slight downscale for better performance on high-DPI screens
        const dpr = window.devicePixelRatio > 1 ? 1.5 : 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2.5 + 2 // Increased size
            });
        }
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = 'rgba(124, 77, 255, 0.15)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            p.x += p.vx * 0.6; // Slightly faster for more life
            p.y += p.vy * 0.6;

            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            this.ctx.fillStyle = 'rgba(124, 77, 255, 0.55)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            for (let j = i + 1; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let dx = p.x - p2.x;
                if (Math.abs(dx) > 180) continue; // Increased connection range

                let dy = p.y - p2.y;
                if (Math.abs(dy) > 180) continue;

                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 180) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(124, 77, 255, ${0.25 - dist / 800})`;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    new NeuralNetwork();
});
