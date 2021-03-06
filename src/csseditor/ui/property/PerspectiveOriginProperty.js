import BaseProperty from "./BaseProperty";
import { LOAD, CLICK, DEBOUNCE } from "../../../util/Event";
import { editor } from "../../../editor/editor";
import { EVENT } from "../../../util/UIElement";

import icon from "../icon/icon";


export default class PerspectiveOriginProperty extends BaseProperty {

  getTitle() {
    return editor.i18n('perspective.origin.property.title')
  }

  hasKeyframe () {
    return true; 
  }

  isFirstShow() {
    return false; 
  }  

  getKeyframeProperty () {
    return 'perspective-origin'
  }

  getTools() {
    return /*html*/`
        <button type="button" class="remove" ref='$remove'>${icon.remove}</button>
    `
  }

  [CLICK('$remove')] () {
    this.trigger('changePerspectiveOrigin', '');
  }  

  getBody() {
    return /*html*/`
      <div class="property-item full perspective-origin-item" ref='$body'></div>
    `;
  }

  [LOAD('$body')] () {
    var current = editor.selection.current || {}; 
    var value = current['perspective-origin'] || ''

    return /*html*/`<PerspectiveOriginEditor 
              ref='$1' 
              value='${value}' 
              onchange='changePerspectiveOrigin' 
            />`
  }


  [EVENT('refreshSelection') + DEBOUNCE(100)]() {
    this.refreshShowIsNot('project');
  }

  [EVENT('changePerspectiveOrigin')] (value) {

    editor.selection.reset({ 
      'perspective-origin': value 
    })

    this.emit("refreshSelectionStyleView");
  }

}
