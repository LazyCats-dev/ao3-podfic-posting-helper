/**
 * Sets the value of the input, triggering all necessary events.
 * @param inputElement {HTMLInputElement}
 * @param value {string}
 */
export function setInputValue(inputElement, value) {
  const event = new InputEvent('input', {bubbles: true, data: value});
  inputElement.value = value;
  // Replicates the value changing.
  inputElement.dispatchEvent(event);
  // Replicates the user leaving focus of the input element.
  inputElement.dispatchEvent(new Event('change'));
}

/**
 * Sets the state of a checkbox, triggering all necessary events.
 * @param checkboxElement {HTMLInputElement}
 * @param isChecked {boolean}
 */
export function setCheckboxState(checkboxElement, isChecked) {
  checkboxElement.checked = isChecked;
  // Replicates the user leaving focus of the input element.
  checkboxElement.dispatchEvent(new Event('change'));
}