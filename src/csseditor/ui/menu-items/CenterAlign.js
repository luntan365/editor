import MenuItem from "./MenuItem";
import Sort from "../../../editor/Sort";
   
export default class CenterAlign extends MenuItem {
  getIcon() {
    return 'center';
  }
  getTitle() {
    return "Center";
  }
 
  isHideTitle () {
    return true; 
  } 

  clickButton(e) {
    Sort.center();
    this.emit('refreshSelectionStyleView')
    this.emit('refreshSelectionTool')
  }
}
