declare namespace mdc {
  export * from 'material-components-web';
}

interface Element {
  closest(selector: '.mdc-text-field'): {
    MDCTextField: mdc.textField.MDCTextField;
  };
}

interface ParentNode {
  querySelector(selector: '.mdc-snackbar'): {
    MDCSnackbar: mdc.snackbar.MDCSnackbar;
  };
  querySelector(selector: '.mdc-deprecated-list'): {
    MDCList: mdc.list.MDCList;
  };
  querySelector(selector: '.mdc-text-field'): {
    MDCTextField: mdc.textField.MDCTextField;
  };
}
