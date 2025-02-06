if (!customElements.get('variant-selects')) {
  customElements.define(
    'variant-selects',
    class VariantSelects extends HTMLElement {
      constructor() {
        super();
        this.addEventListener('change', this.onVariantChange);

        this.selectors = {
          variantIdInput: 'input[name="id"]',
        };
        this.sectionId = this.dataset.section;
        this.container = this.closest(`#ProductInfo-${this.sectionId}`);
      }

      connectedCallback() {
        this.getVariantData();
        const variantIdInput = this.container && this.container.querySelector(this.selectors.variantIdInput);
        this.currentVariant = variantIdInput
          ? this.variantData.find((variant) => variant.id === Number(variantIdInput.value))
          : false;

        if (this.currentVariant) {
          this.updateMedia();
        }
      }

      onVariantChange(event) {
        this.updateOptions();
        this.updateMasterId();
        this.updateSelectedSwatchValue(event);
        this.toggleAddButton(true, '', false);
        this.updatePickupAvailability();
        this.removeErrorMessage();
        this.updateVariantStatuses();

        if (!this.currentVariant) {
          this.toggleAddButton(true, '', true);
          this.setUnavailable();
        } else {
          this.updateURL();
          this.updateVariantInput();
          this.updateMedia();
          this.renderProductInfo();
          this.updateShareUrl();

          document.dispatchEvent(
            new CustomEvent('variant:changed', {
              detail: {
                variant: this.currentVariant,
              },
            })
          );
        }
      }

      updateOptions() {
        this.options = Array.from(this.querySelectorAll('select, fieldset'), (element) => {
          if (element.tagName === 'SELECT') {
            return element.value;
          }
          if (element.tagName === 'FIELDSET') {
            return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
          }
        });
      }

      updateMasterId() {
        this.currentVariant = this.getVariantData().find((variant) => {
          return !variant.options
            .map((option, index) => {
              return this.options[index] === option;
            })
            .includes(false);
        });
      }

      updateSelectedSwatchValue({ target }) {
        const { name, value, tagName } = target;

        if (tagName === 'SELECT' && target.selectedOptions.length) {
          const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
          const selectedDropdownSwatchValue = this.querySelector(`[data-selected-dropdown-swatch="${name}"] > .swatch`);
          if (!selectedDropdownSwatchValue) return;
          if (swatchValue) {
            selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
            selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
          } else {
            selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
            selectedDropdownSwatchValue.classList.add('swatch--unavailable');
          }

          selectedDropdownSwatchValue.style.setProperty(
            '--swatch-focal-point',
            target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
          );
        } else if (tagName === 'INPUT' && target.type === 'radio') {
          const selectedSwatchValue = this.querySelector(`[data-selected-swatch-value="${name}"]`);
          if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
        }
      }

      updateURL() {
        if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
        window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
      }

      updateShareUrl() {
        const shareButton = document.getElementById(`Share-${this.dataset.section}`);
        if (!shareButton || !shareButton.updateUrl) return;
        shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
      }

      updateVariantInput() {
        const productForms = document.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        );
        productForms.forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = this.currentVariant.id;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }

      updateVariantStatuses() {
        const selectedOptionOneVariants = this.variantData.filter(
          (variant) => this.querySelector(':checked').value === variant.option1
        );
        const inputWrappers = [...this.querySelectorAll('.product-form__input')];
        inputWrappers.forEach((option, index) => {
          if (index === 0) return;
          const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
          const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
          const availableOptionInputsValue = selectedOptionOneVariants
            .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
            .map((variantOption) => variantOption[`option${index + 1}`]);
          this.setInputAvailability(optionInputs, availableOptionInputsValue);
        });
      }

      setInputAvailability(elementList, availableValuesList) {
        elementList.forEach((element) => {
          const value = element.getAttribute('value');
          const availableElement = availableValuesList.includes(value);

          if (element.tagName === 'INPUT') {
            element.classList.toggle('disabled', !availableElement);
          } else if (element.tagName === 'OPTION') {
            element.innerText = availableElement
              ? value
              : FoxTheme.variantStrings.unavailable_with_option.replace('[value]', value);
          }
        });
      }

      updatePickupAvailability() {
        const pickUpAvailability = document.querySelector('pickup-availability');
        if (!pickUpAvailability) return;

        if (this.currentVariant && this.currentVariant.available) {
          pickUpAvailability.fetchAvailability(this.currentVariant.id);
        } else {
          pickUpAvailability.removeAttribute('available');
          pickUpAvailability.innerHTML = '';
        }
      }

      removeErrorMessage() {
        const section = this.closest('section');
        if (!section) return;

        const productForm = section.querySelector('product-form');
        if (productForm) productForm.handleErrorMessage();
      }

      updateMedia() {
        const productMedia = document.querySelector(`[id^="MediaGallery-${this.dataset.section}"]`);
        if (productMedia) {
          if (typeof productMedia.setActiveMedia === 'function') {
            productMedia.setActiveMedia(this.currentVariant);
          } else {
            this.timer = setInterval(() => {
              if (typeof productMedia.setActiveMedia === 'function') {
                clearInterval(this.timer);
                productMedia.setActiveMedia(this.currentVariant);
              }
            }, 100);
          }
        }
      }

      renderProductInfo() {
        const requestedVariantId = this.currentVariant.id;
        const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

        fetch(
          `${this.dataset.url}?variant=${requestedVariantId}&section_id=${
            this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section
          }`
        )
          .then((response) => response.text())
          .then((responseText) => {
            // Prevent unnecessary ui changes from abandoned selections.
            if (this.currentVariant.id !== requestedVariantId) return;

            let html = new DOMParser().parseFromString(responseText, 'text/html');

            // Need parse DOM from template for quick view.
            const quickView = html.querySelector('#MainProduct-quick-view__content');
            if (quickView) {
              html = quickView.content.cloneNode(true);
            }

            const destination = document.getElementById(`price-${this.dataset.section}`);
            const source = html.getElementById(
              `price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
            );
            const skuSource = html.getElementById(
              `Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
            );
            const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
            const inventorySource = html.getElementById(
              `Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
            );
            const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);

            if (source && destination) destination.innerHTML = source.innerHTML;
            if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
            if (skuSource && skuDestination) {
              skuDestination.innerHTML = skuSource.innerHTML;
              skuDestination.classList.toggle('hidden', skuSource.classList.contains('hidden'));
            }

            const badgesSource = html.getElementById(
              `Badges-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
            );
            const badgesDestination = document.getElementById(`Badges-${this.dataset.section}`);
            if (badgesSource && badgesDestination) {
              badgesDestination.innerHTML = badgesSource.innerHTML;
            }

            const price = document.getElementById(`price-${this.dataset.section}`);
            if (price) price.classList.remove('hidden');

            if (inventoryDestination) inventoryDestination.classList.toggle('hidden', inventorySource.innerText === '');

            const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
            this.toggleAddButton(
              addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
              FoxTheme.variantStrings.soldOut
            );

            FoxTheme.pubsub.publish(FoxTheme.pubsub.PUB_SUB_EVENTS.variantChange, {
              data: {
                sectionId,
                html,
                variant: this.currentVariant,
              },
            });
          });
      }

      toggleAddButton(disable = true, text, modifyClass = true) {
        const productForm = document.getElementById(`product-form-${this.dataset.section}`);
        if (!productForm) return;
        const addButton = productForm.querySelector('[name="add"]');
        const addButtonText = productForm.querySelector('[name="add"] > span');
        if (!addButton) return;

        if (disable) {
          addButton.setAttribute('disabled', 'disabled');
          if (text) addButtonText.textContent = text;
        } else {
          addButton.removeAttribute('disabled');
          addButtonText.textContent = FoxTheme.variantStrings.addToCart;
        }

        if (!modifyClass) return;
      }

      setUnavailable() {
        const button = document.getElementById(`product-form-${this.dataset.section}`);
        const addButton = button.querySelector('[name="add"]');
        const addButtonText = button.querySelector('[name="add"] > span');
        const price = document.getElementById(`price-${this.dataset.section}`);
        const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
        const sku = document.getElementById(`Sku-${this.dataset.section}`);

        if (!addButton) return;
        addButtonText.textContent = FoxTheme.variantStrings.unavailable;
        if (price) price.classList.add('hidden');
        if (inventory) inventory.classList.add('hidden');
        if (sku) sku.classList.add('hidden');
      }

      getVariantData() {
        this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
        return this.variantData;
      }
    }
  );
}
