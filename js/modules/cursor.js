export default class CustomCursor {
    constructor() {
        if (window.matchMedia('(pointer: fine)').matches) {
            this.createCursorElement();
            this.init();
        }
    }

    createCursorElement() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        
        Object.assign(this.cursor.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            pointerEvents: 'none',
            display: 'none',
            willChange: 'transform'
        });
        document.body.appendChild(this.cursor);
    }

    init() {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        let isMoving = false;
        let rafId = null;
        let lastMoveTime = 0;

        const onMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            lastMoveTime = performance.now(); // Track time without timers

            if (!isMoving) {
                isMoving = true;
                this.cursor.style.display = 'block';
                if (!rafId) rafId = window.requestAnimationFrame(this.tick);
            }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });

        this.tick = (timestamp) => {
            // Smooth lerp math
            currentX += (mouseX - currentX) * 0.3;
            currentY += (mouseY - currentY) * 0.3;

            const offsetX = currentX - 6;
            const offsetY = currentY - 3;

            this.cursor.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;

            // Check if 1200ms has elapsed since the last mouse movement
            if (timestamp - lastMoveTime > 1200) {
                this.cursor.style.display = 'none';
                isMoving = false;
                rafId = null; // Let the loop die naturally
                return;
            }

            rafId = window.requestAnimationFrame(this.tick);
        };

        // Efficient event delegation using bubbling targets
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (target && (target.tagName === 'A' || target.tagName === 'BUTTON' || target.classList.contains('interactive') || target.closest('a, button, .interactive'))) {
                this.cursor.classList.add('active');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            if (target && (target.tagName === 'A' || target.tagName === 'BUTTON' || target.classList.contains('interactive') || target.closest('a, button, .interactive'))) {
                this.cursor.classList.remove('active');
            }
        });
    }
}