import BaseProperty from "./BaseProperty";
import { DEBOUNCE, CLICK } from "../../../util/Event";
import { EVENT } from "../../../util/UIElement";
import icon from "../icon/icon";
import { editor } from "../../../editor/editor";

const i18n = editor.initI18n('export.property');

export default class ExportProperty extends BaseProperty {

  getTitle() {
    return i18n('title');
  }



  [EVENT('refreshSelection', 'refreshContent') + DEBOUNCE(100)]() {

    this.refreshShowIsNot('project');

  }  

  getClassName() {
    return 'export-property'
  }


  getBody() {
    return /*html*/`
        <div class='export-item svg'>
          <label>SVG</label>
          <button ref='$svg'>${icon.archive} ${i18n('download')}</button>
        </div>
        <div class='export-item png'>
          <label>PNG</label>
          <button ref='$png'>${icon.archive} ${i18n('download')}</button>
        </div> 
      `;
  }  

  [CLICK('$svg')] () {
    this.emit('download.to.svg');
  }

  [CLICK('$png')] () {
    this.emit('download.to.png');
  }  
}
