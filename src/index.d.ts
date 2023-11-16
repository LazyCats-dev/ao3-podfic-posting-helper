import {MDCChipSet} from '@material/chips/deprecated';
import {MDCList} from '@material/list';
import {MDCSnackbar} from '@material/snackbar';
import {MDCTextField} from '@material/textfield';

declare global {
  interface Element {
    closest(selector: '.mdc-text-field'): {
      MDCTextField: MDCTextField;
    };
  }

  interface ParentNode {
    querySelector(selector: '.mdc-snackbar'): HTMLElement & {
      readonly MDCSnackbar: MDCSnackbar;
    };
    querySelector(selector: '.mdc-deprecated-list'): HTMLElement & {
      readonly MDCList: MDCList;
    };
    querySelector(selector: '.mdc-text-field'): HTMLElement & {
      readonly MDCTextField: MDCTextField;
    };
    querySelector(selector: '#audio-format-tags'): HTMLElement & {
      readonly MDCChipSet: MDCChipSet;
    };
  }
}
