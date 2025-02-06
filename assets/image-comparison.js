if (!customElements.get('image-comparison')) {
  customElements.define(
    'image-comparison',
    class ImageComparison extends HTMLElement {
      constructor() {
        super();

        this.active = false;
        this.button = this.querySelector('button');
        this.horizontal = this.dataset.direction === 'horizontal';

        if (FoxTheme.config.motionReduced) {
          this.init();
        } else {
          FoxTheme.Motion.inView(this.querySelector('.image-comparison__animation-trigger'), this.animation.bind(this));
        }
      }

      init() {
        this.button.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.body.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.body.addEventListener('touchmove', this.handleMouseMove.bind(this));

        this.button.addEventListener('mousedown', this.handleTouchStart.bind(this));
        document.body.addEventListener('mouseup', this.handleTouchEnd.bind(this));
        document.body.addEventListener('mousemove', this.handleMouseMove.bind(this));
      }

      animation() {
        this.setAttribute('is-visible', '');
        this.classList.add('is-animating');
        setTimeout(() => {
          this.classList.remove('is-animating');
        }, 1e3);
        this.init();
      }

      handleTouchStart() {
        document.body.classList.add('body-no-scrollbar');
        this.classList.add('is-dragging');
        this.active = true;
      }

      handleTouchEnd() {
        document.body.classList.remove('body-no-scrollbar');
        this.classList.remove('is-dragging');
        this.active = false;
      }

      handleMouseMove(e) {
        if (!this.active) return;

        const event = (e.touches && e.touches[0]) || e;
        const x = this.horizontal ? event.pageX - this.offsetLeft : event.pageY - this.offsetTop;

        this.handleChange(x);
      }

      handleChange(x) {
        const distance = this.horizontal ? this.clientWidth : this.clientHeight;

        const max = distance - 20;
        const min = 20;
        const mouseX = Math.max(min, Math.min(x, max));
        const mousePercent = (mouseX * 100) / distance;
        this.style.setProperty('--percent', mousePercent + '%');
      }
    }
  );
}
