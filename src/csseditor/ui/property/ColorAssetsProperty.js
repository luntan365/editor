import BaseProperty from "./BaseProperty";
import { editor } from "../../../editor/editor";
import { LOAD, BIND, CLICK, INPUT, DEBOUNCE } from "../../../util/Event";
import { EVENT } from "../../../util/UIElement";
import icon from "../icon/icon";
import Color from "../../../util/Color";
import AssetParser from "../../../editor/parse/AssetParser";


export default class ColorAssetsProperty extends BaseProperty {

  getTitle() {
    return "Color";
  }

  initState() {
    return {
      mode: 'grid'
    }
  }

  getClassName() {
    return 'color-assets-property'
  }

  [EVENT('refreshSelection') + DEBOUNCE(100)] () {
    this.show();
  }

  getBody() {
    return `
      <div class='property-item color-assets'>
        <div class='color-list' ref='$colorList' data-view-mode='${this.state.mode}'></div>
      </div>
    `;
  }

  [LOAD("$colorList")]() {
    var current = editor.selection.currentProject || { colors: [] }

    var colors = current.colors;   

    var results = colors.map( (item, index) => {

      return /*html*/`
        <div class='color-item' data-index="${index}">
          <div class='preview' data-index="${index}"><div class='color-view' style='background-color: ${item.color};'></div></div>
          <div class='title'>
            <div>
              <input type='text' class='color' data-key='color' readonly value='${item.color}' placeholder="color" />
            </div>
            <div>
              <input type='text' class='name' data-key='name' value='${item.name}' placeholder="name" />
            </div>
            <!--<div>
              <input type='text' class='var' data-key='variable' value='${item.variable}' placeholder="--var" />
            </div>-->
          </div>
          <div class='tools'>
            <button type="button" class='copy'>${icon.copy}</button>          
            <button type="button" class='remove'>${icon.remove}</button>
          </div>
        </div>
      `
    })

    results.push(`<div class='add-color-item'><butto type="button">${icon.add}</button></div>`)

    return results
  }

  executeColor (callback, isRefresh = true, isEmit = true ) {
    var project = editor.selection.currentProject;

    if(project) {

      callback && callback (project) 

      if (isRefresh) this.refresh();
      if (isEmit) this.emit('refreshColorAssets');
    } else{
      alert('Please select a project.')
    }
  }
  
  [CLICK('$colorList .add-color-item')] () {

    this.executeColor((project) => {
      project.createColor({
        color: Color.random(),
        name: '',
        variable: ''
      })
    })
  }

  [CLICK('$colorList .remove')] (e) {
    var $item = e.$delegateTarget.closest('color-item');
    var index = +$item.attr('data-index');

    this.executeColor(project => {
      project.removeColor(index);
    })
  }


  [CLICK('$colorList .copy')] (e) {
    var $item = e.$delegateTarget.closest('color-item');
    var index = +$item.attr('data-index');

    this.executeColor(project => {
      project.copyColor(index);
    })
  }  

  [INPUT('$colorList input')] (e) {
    var $item = e.$delegateTarget.closest('color-item');
    var index = +$item.attr('data-index');
    var obj = e.$delegateTarget.attrKeyValue('data-key');    

    this.executeColor(project => {
      project.setColorValue(index, obj);      
    }, false)
  }

  [CLICK("$colorList .preview")](e) {
    var $item = e.$delegateTarget.closest('color-item');    
    var index = +$item.attr('data-index')
    this.state.$el = e.$delegateTarget.$('.color-view');
    this.state.$color = $item.$('.color');
    var color = this.state.$el.css('background-color')

    this.emit("showColorPickerPopup", {
        hideColorAssets: true,
        changeEvent: 'changeColorAssets',
        color
    }, {
        id: this.id,
        index
    });
  }


  [EVENT('changeColorAssets')] (color, params) {
    if (params.id === this.id) {

      this.executeColor(project => {
        project.setColorValue(params.index, {color});      
        this.state.$el.css('background-color', color);
        this.state.$color.val(color);
      }, false)
    }
  }
}
