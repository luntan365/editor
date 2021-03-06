import { EVENT } from "../../../util/UIElement";
import { LOAD } from "../../../util/Event";

import { Gradient } from "../../../editor/image-resource/Gradient";
import BasePopup from "./BasePopup";
import EmbedColorPicker from "../property-editor/EmbedColorPicker";
import ImageAssetPicker from "../property/ImageAssetPicker";
import FillEditor from "../property-editor/FillEditor";
import { SVGStaticGradient } from "../../../editor/image-resource/SVGStaticGradient";
export default class FillPickerPopup extends BasePopup {

  getTitle() {
    return 'SVG Fragment picker'
  }

  components() {
    return {
      ImageAssetPicker,
      EmbedColorPicker,
      FillEditor
    }
  }

  initState() {

    return {
      image: SVGStaticGradient.create()
    }
  }

  initialize() {
    super.initialize();

    this.selectedTab = "static-gradient";
  }

  getBody() {
    return /*html*/`
      <div class="gradient-picker" ref='$body' data-selected-editor=''>
        <div class='box'>
          <div ref='$gradientEditor'></div>
        </div>
        <div class='box'>
          <div class='colorpicker'>
            <EmbedColorPicker ref='$color' onchange='changeColor' />                    
          </div>
          <div class='assetpicker'>
            <ImageAssetPicker ref='$asset' onchange='changeImageUrl' />
          </div>
        </div>
      </div>
     
    `;
  }

  [EVENT('changeTabType')] (type) {
    this.refs.$body.attr('data-selected-editor', type);
  }

  getColorString() {
    var value = '' ;
    if (this.state.image instanceof Gradient) {
      value = this.state.image.getColorString()
    }


    return value; 
  }

  getCurrentColor() {
    return this.state.image.colorsteps[this.state.selectColorStepIndex || 0].color; 
  }

  [LOAD('$gradientEditor')] () {
    return /*html*/`<FillEditor 
      ref="$g" 
      value="${this.state.image}" 
      selectedIndex="${this.state.selectColorStepIndex}" 
      onchange='changeFillEditor'
    />`
  }

  [EVENT('changeFillEditor')] (data) {

    this.state.image = data;

    this.updateData();
  }

  [EVENT('changeColor')] (color) {
    this.children.$g.trigger('setColorStepColor', color);
  }

  [EVENT('changeImageUrl')] (url) {
    this.children.$g.trigger('setImageUrl', url);
  }

  [EVENT("showFillPickerPopup")](data, params) {
    this.show(432);

    data.changeEvent = data.changeEvent || 'changeFillPopup'
    // data.image = data.gradient
    data.params = params;
    this.setState(data);
  }

  [EVENT("selectColorStep")](color) {
    this.children.$color.setValue(color);
  }


  [EVENT("changeColorStep")](data = {}) {

    this.state.image.reset({
      ...data
    })

    this.updateData();
  }


  updateData() {
    this.state.instance.trigger(this.state.changeEvent, this.state.image, this.state.params);
  }

}
