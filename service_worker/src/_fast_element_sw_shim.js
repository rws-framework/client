/**
 * Minimal @microsoft/fast-element shim for Service Worker context.
 * DI (fast-foundation) only uses `emptyArray` and `FASTElement` from fast-element.
 * This avoids pulling in DOM-dependent code (dom.js, element-styles.js, controller.js).
 */

const emptyArray = Object.freeze([]);

class FASTElement {}

export { emptyArray, FASTElement };
export default FASTElement;
