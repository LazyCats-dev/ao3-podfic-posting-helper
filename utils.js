/**
 * Sets the value of the input, trigger all necessary events.
 * @param inputElement {HTMLInputElement} 
 * @param value {string}
 */
 export function setInputValue(inputElement, value) {
    const event = new InputEvent('input', {
        bubbles: true,
        data: value
    });
    inputElement.value = value;
    // Replicates the value changing.
    inputElement.dispatchEvent(event);
    // Replicates the user leaving focus of the input element.
    inputElement.dispatchEvent(new Event('change'));
}