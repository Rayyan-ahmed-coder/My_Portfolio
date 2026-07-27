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

        const onMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isMoving) {
                isMoving = true;
                this.cursor.style.display = 'block';
                this.tick();
            }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true })
        this.tick = () => {
            currentX += (mouseX - currentX) * 0.3;
            currentY += (mouseY - currentY) * 0.3;

            const offsetX = currentX - 6;
            const offsetY = currentY - 3;

            this.cursor.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;

            window.requestAnimationFrame(this.tick);
        };

        document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .interactive')) {
            this.cursor.classList.add('active');
        }
        });

        document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .interactive')) {
            this.cursor.classList.remove('active');
        }
        });
    }
}