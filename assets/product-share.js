if (!customElements.get('product-share')) {
  customElements.define('product-share', class ProductShare extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      // Initialize the AbortController
      this.abortController = new AbortController();

      this.btnCopy = this.querySelector('.btn-copy');
      if( this.btnCopy ) {
        this.btnCopy.addEventListener('click', this.copyToClipboard.bind(this), {
          signal: this.abortController.signal,
        });
      }
    }
    
    copyToClipboard(evt) {
      evt.preventDefault()

      navigator.clipboard.writeText(evt.target.previousElementSibling.value);
      this.btnCopy.classList.add('copied');
      this.btnCopy.innerText = evt.target.dataset.copiedText;
    }

    disconnectedCallback() {
      this.abortController.abort();
    }
  });
}