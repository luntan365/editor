import BaseProperty from "./BaseProperty";
import { LOAD, CLICK, DEBOUNCE } from "../../../util/Event";
import { editor } from "../../../editor/editor";
import { EVENT } from "../../../util/UIElement";

import icon from "../icon/icon";


export default class TransformOriginProperty extends BaseProperty {

  getTitle() {
    return editor.i18n('transform.origin.property.title');  
  }

  getTools() {
    return /*html*/`
        <button type="button" class="remove" ref='$remove'>${icon.remove}</button>
    `
  }

  hasKeyframe () {
    return true; 
  }

  getKeyframeProperty () {
    return 'transform-origin'
  }  

  [CLICK('$remove')] () {
    this.trigger('changeTransformOrigin', '');
  }

  getBody() {
    return /*html*/`
      <div class="property-item full transform-origin-item" ref='$body'></div>
    `;
  }

  [LOAD('$body')] () {
    var current = editor.selection.current || {}; 
    var value = current['transform-origin'] || ''

    return /*html*/`<TransformOriginEditor ref='$1' value='${value}' onchange='changeTransformOrigin' />`
  }


  [EVENT('refreshSelection', 'refreshRect') + DEBOUNCE(100)]() {
    this.refreshShowIsNot(['project', 'artboard']);
  }

  [EVENT('changeTransformOrigin')] (value) {

    editor.selection.reset({ 
      'transform-origin': value 
    })

    this.emit("refreshSelectionStyleView");
  }

}
