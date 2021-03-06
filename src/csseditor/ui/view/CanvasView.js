import UIElement, { EVENT } from "../../../util/UIElement";

import { editor } from "../../../editor/editor";
import { DEBOUNCE, PREVENT, WHEEL, ALT, THROTTLE, IF, KEYUP, CONTROL, KEY, DRAGOVER, DROP, KEYPRESS, KEYDOWN } from "../../../util/Event";

import ElementView from "./ElementView";
import NumberRangeEditor from "../property-editor/NumberRangeEditor";
import { Length } from "../../../editor/unit/Length";
import Dom from "../../../util/Dom";
import PageTools from "../view-items/PageTools";
import PageSubEditor from "../view-items/PageSubEditor";
import RotateEditorView from "./RotateEditorView";



export default class CanvasView extends UIElement {

  components() {
    return {
      PageTools,
      NumberRangeEditor,
      ElementView,
      PageSubEditor,
      RotateEditorView
    }
  }

  afterRender() {

    this.emit('load.json');
  }
  template() {
    return/*html*/`
      <div class='page-container' tabIndex="-1">
        <div class='page-view'>
          <div class='page-lock scrollbar' ref='$lock'>
            <ElementView ref='$elementView' />
          </div>
        </div>
        <PageSubEditor />
        <PageTools />
        <RotateEditorView />
      </div>
    `;
  }

  [EVENT('toggle.fullscreen')] () {
    this.$el.fullscreen();
  }

  // [ANIMATIONITERATION()] (e) {
  //   // console.log(e.elapsedTime, e);
  // }

  [KEYUP('$el') + CONTROL + KEY('c')  + PREVENT ] (e) {
    this.emit('copy');
  }

  [KEYUP('$el') + CONTROL + KEY('v') + PREVENT ] () {
    this.emit('paste');
  }  

  isNumberKey(e) {
    return ((+e.key) + "") === e.key;
  }
  
  isArrowKey(e) {
    return e.key.includes('Arrow')
  }  

  isNotFormElement(e) {
    var tagName = e.target.tagName.toLowerCase();

    return ['input'].includes(tagName) === false && Dom.create(e.target).attr('contenteditable') !== 'true';
  }

  [KEYUP('$el') + IF('isNumberKey') + IF('isNotFormElement') + PREVENT] (e) {
    this.emit('keyup.canvas.view', e.key);
  }

  [KEYDOWN('$el') + IF('isArrowKey') + IF('isNotFormElement')] (e) {
    this.emit('arrow.keydown.canvas.view', e.key, e.altKey, e.shiftKey);
  }  

  [WHEEL('$lock') + ALT + PREVENT + THROTTLE(10)] (e) {

    var dt = e.deltaY < 0 ? 1.1 : 0.9;
    this.emit('changeScaleValue', editor.scale * dt);
  }

  getScrollTop() {
    if (this.refs.$lock) {
      return this.refs.$lock.scrollTop()
    }

    return 0;
  }

  getScrollLeft() {
    if (this.refs.$lock) {
      return this.refs.$lock.scrollLeft()
    }
    
    return 0; 
  }  

  get scrollXY () {
    return {
      screenX: Length.px(this.getScrollLeft()),
      screenY: Length.px(this.getScrollTop())
    }
  }

  get screenSize () {
    if (this.refs.$lock) {
      return this.refs.$lock.rect()
    }

    return {
      width: 0,
      height: 0
    }
  } 

  setScrollTop (value) {
    this.refs.$lock.setScrollTop(value);
  }

  addScrollTop (value) {
    this.setScrollTop(this.getScrollTop() + value)
  }

  setScrollLeft (value) {
    this.refs.$lock.setScrollLeft(value);
  }  

  addScrollLeft (value) {
    this.setScrollLeft(this.getScrollLeft() + value)
  }

  [EVENT('focusCanvasView')] () {
    this.$el.focus()
  }


  // 단축키 적용하기 
  [KEYUP() + IF('Backspace')] (e) {
    var $target = Dom.create(e.target);
    if ($target.attr('contenteditable')) {

    } else {
      editor.selection.remove()
      this.emit('refreshAllSelectArtBoard')
    }
  }

  [DRAGOVER() + PREVENT] (e) { }
  [DROP() + PREVENT] (e) { 
    var imageUrl = e.dataTransfer.getData('image/info');

    this.emit('drop.image.url', imageUrl)
  } 

  [EVENT('refreshComputedStyle') + DEBOUNCE(100)] (last) {
    var computedCSS = this.refs.$canvas.getComputedStyle(...last)
    
    this.emit('refreshComputedStyleCode', computedCSS)
  }

  // [EVENT('loadSketchData')] (sketchData) {
  //   var projects = SketchUtil.parse (sketchData);

  //   projects.forEach(p => {
  //     editor.add(p);
  //   })

  //   this.refresh();
  //   this.emit('addElement');    
  //   this.emit('refreshCanvas')
  //   this.emit('refreshStyleView')

  // }

}
