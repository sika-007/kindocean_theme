if (!customElements.get('card-images')) {
  class CardImages extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        sliderWrapper: '.card-images__items',
        pagination: '.swiper-pagination',
        nextEl: '.swiper-btn-next',
        prevEl: '.swiper-btn-prev',
      };
      this.classes = {
        grid: 'f-grid',
        swiper: 'swiper',
        swiperWrapper: 'swiper-wrapper',
      };

      this.domNodes = window.FoxTheme.utils.queryDomNodes(this.selectors);

      this.sectionId = this.dataset.sectionId;
      this.section = this.closest(`.section-${this.sectionId}`);
      this.sliderWrapper = this.querySelector(this.selectors.sliderWrapper);

      this.enableSlider = this.dataset.enableSlider === 'true';
      this.items = parseInt(this.dataset.items);
      this.tabletItems = parseInt(this.dataset.tabletItems);

      this.sliderInstance = false;

      if (!this.enableSlider) return;

      this.init();
    }

    init() {
      this.initSlider();
    }

    initSlider() {
      const columnGap = window.getComputedStyle(this.sliderWrapper).getPropertyValue('--column-gap');
      const spaceBetween = parseFloat(columnGap.replace('rem', '')) * 10;

      const sliderOptions = {
        modules: [FoxTheme.Swiper.Navigation, FoxTheme.Swiper.Pagination],
        slidesPerView: 1,
        spaceBetween: spaceBetween,
        navigation: {
          nextEl: this.section.querySelector(this.selectors.nextEl),
          prevEl: this.section.querySelector(this.selectors.prevEl),
        },
        pagination: {
          el: this.section.querySelector('.swiper-pagination'),
          clickable: true,
        },
        breakpoints: {
          1024: {
            slidesPerView: this.tabletItems > 3 ? 3 : parseInt(this.tabletItems),
          },
          1280: {
            slidesPerView: parseInt(this.items),
          },
        },
        loop: true,
        threshold: 2,
      };

      if (typeof this.sliderInstance !== 'object') {
        this.classList.add(this.classes.swiper);
        this.sliderWrapper.classList.remove(this.classes.grid);
        this.sliderWrapper.classList.add(this.classes.swiperWrapper);
        this.sliderInstance = new window.FoxTheme.Carousel(this, sliderOptions);
        this.sliderInstance.init();
        const focusableElements = FoxTheme.a11y.getFocusableElements(this);

        focusableElements.forEach((element) => {
          element.addEventListener('focusin', () => {
            const slide = element.closest('.swiper-slide');
            this.sliderInstance.slider.slideTo(this.sliderInstance.slider.slides.indexOf(slide));
          });
        });
      }

      if (Shopify.designMode && typeof this.sliderInstance === 'object') {
        document.addEventListener('shopify:block:select', (e) => {
          if (e.detail.sectionId != this.sectionId) return;
          let { target } = e;
          const index = Number(target.dataset.index);

          this.sliderInstance.slider.slideToLoop(index);
        });
      }
    }

    destroySlider() {
      if (typeof this.sliderInstance === 'object') {
        this.classList.remove(this.classes.swiper);
        this.sliderWrapper.classList.remove(this.classes.swiperWrapper);
        this.sliderWrapper.classList.add(this.classes.grid);
        this.sliderInstance.slider.destroy();
        this.sliderInstance = false;
      }
    }
  }
  customElements.define('card-images', CardImages);
}
