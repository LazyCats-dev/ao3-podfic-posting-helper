import {MDCChipSet} from '@material/chips';
import {MDCList} from '@material/list';
import {MDCSnackbar} from '@material/snackbar';
import {MDCTextField} from '@material/textfield';

interface Element {
  closest(selector: '.mdc-text-field'): {
    MDCTextField: MDCTextField;
  };
}

interface ParentNode {
  querySelector(selector: '.mdc-snackbar'): {
    MDCSnackbar: MDCSnackbar;
  };
  querySelector(selector: '.mdc-deprecated-list'): {
    MDCList: MDCList;
  };
  querySelector(selector: '.mdc-text-field'): {
    MDCTextField: MDCTextField;
  };
  querySelector(selector: '#audio-format-tags'): HTMLElement & {
    MDCChipSet: MDCChipSet;
  };
}
