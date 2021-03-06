import UIElement, { EVENT } from "../../../util/UIElement";
import { BIND, POINTERSTART, MOVE, END, IF, KEYUP, DEBOUNCE, PREVENT } from "../../../util/Event";
import { Length } from "../../../editor/unit/Length";

import { editor } from "../../../editor/editor";
import Dom from "../../../util/Dom";
import SelectionToolView from "./SelectionToolView";
import GuideLineView from "./GuideLineView";
import PathEditorView from "./PathEditorView";
import PolygonEditorView from "./PolygonEditorView";
import GridLayoutLineView from "./GridLayoutLineView";


export default class ElementView extends UIElement {

    components() {
        return {
            SelectionToolView,
            GuideLineView,
            PathEditorView,
            PolygonEditorView,
            GridLayoutLineView,
        }
    }

    initState() {
        return {
            mode: 'selection',
            left: Length.px(0),
            top: Length.px(0),
            width: Length.px(10000),
            height: Length.px(10000),
            cachedCurrentElement: {},
            html: ''
        }
    }

    template() {
        return /*html*/`
            <div class='element-view' ref='$body'>
                <div class='canvas-view' ref='$view'></div>
                <div class='drag-area-rect' ref='$dragAreaRect'></div>
                <GuideLineView ref='$guideLineView' />
                <GridLayoutLineView ref='$gridLayoutLineView' />
                <SelectionToolView ref='$selectionTool' />
                <PathEditorView ref='$pathEditorView' />
                <PolygonEditorView ref='$polygonEditorView' />                     
            </div>
        `
    }

    getScrollXY () {
        return {
            width: this.refs.$body.scrollWidth(),
            height: this.refs.$body.scrollHeight(),
            left: this.refs.$body.scrollLeft(),
            top: this.refs.$body.scrollTop()
        }
    }

    [EVENT('after.change.mode')] () {
        this.$el.attr('data-mode', editor.mode);
    }


    [EVENT('hideSubEditor')] (e) {
        this.children.$pathEditorView.$el.hide();
        this.children.$polygonEditorView.$el.hide();
    }

    getElement (id) {
        return this.refs.$view.$(`[data-id="${id}"]`);
    }

    checkEmptyElement (e) {
        var $el = Dom.create(e.target)

        if (editor.isAddMode()) {
            return true; 
        }

        if (this.state.mode !== 'selection') {
            return false; 
        }

        return $el.hasClass('element-item') === false 
            && $el.hasClass('selection-tool-item') === false 
            && $el.hasClass('path-editor-view') === false 
            && $el.hasClass('polygon-editor-view') === false
            && $el.hasClass('point') === false
            && $el.hasClass('handle') === false            
            && $el.hasClass('perspective-handle') === false
            && $el.hasClass('transform-tool-item') === false
            && $el.hasClass('transform-tool') === false            
            && $el.isTag('svg') === false 
            && $el.isTag('path') === false
            && $el.isTag('textPath') === false
            && $el.isTag('polygon') === false
            && $el.attr('data-segment') !== 'true';
    }

    [POINTERSTART('$view') + IF('checkEmptyElement') + MOVE('movePointer') + END('moveEndPointer')] (e) {

        this.$target = Dom.create(e.target);

        this.dragXY = {x: e.xy.x, y: e.xy.y}; 

        this.rect = this.refs.$body.rect();            
        this.canvasOffset = this.refs.$view.rect();

        this.canvasPosition = {
            x: this.canvasOffset.left - this.rect.x,
            y: this.canvasOffset.top - this.rect.y
        }

        this.dragXY.x -= this.rect.x
        this.dragXY.y -= this.rect.y

        if (editor.isSelectionMode()) {

            var obj = {
                left: Length.px(this.dragXY.x),
                top: Length.px(this.dragXY.y),
                width: Length.px(0),
                height: Length.px(0)
            }        
    
            this.refs.$dragAreaRect.css(obj) 

            // editor.selection.empty();
        
            this.state.cachedCurrentElement = {}
            this.$el.$$('.selected').forEach(it => it.removeClass('selected'))
    
            // this.emit('initSelectionTool')        
        } else {
            // add mode 
            // NOOP 
        }

    }

    movePointer (dx, dy) {

        var obj = {
            left: Length.px(this.dragXY.x + (dx < 0 ? dx : 0)),
            top: Length.px(this.dragXY.y + (dy < 0 ? dy : 0)),
            width: Length.px(Math.abs(dx)),
            height: Length.px(Math.abs(dy))
        }        

        this.refs.$dragAreaRect.css(obj)

        if (editor.isSelectionMode()) {

            var {left: x, top: y, width, height } = obj

            var rect = {
                x: Length.px(x.value -  this.canvasPosition.x), 
                y: Length.px(y.value - this.canvasPosition.y), 
                width, 
                height
            }

            rect.x2 = Length.px(rect.x.value + rect.width.value);
            rect.y2 = Length.px(rect.y.value + rect.height.value); 

            var artboard = editor.selection.currentArtboard;
            var items = editor.selection.items; 
            if (artboard) {
                Object.keys(rect).forEach(key => {
                    rect[key].div(editor.scale)
                })
    
                var items = artboard.checkInAreaForLayers(rect);

                if (rect.width.value === 0 && rect.height.value === 0) {
                    items = [] 
                }                 
    
                if (editor.selection.select(...items)) {
                    this.selectCurrentForBackgroundView(...items)
                }

            }

            if (editor.selection.select(...items)) {
                this.emit('refreshSelection')
            }

        }
    }

    moveEndPointer (dx, dy) {
        var [x, y, width, height ] = this.refs.$dragAreaRect
                .styles('left', 'top', 'width', 'height')
                .map(it => Length.parse(it))

        var rect = {
            x: Length.px(x.value -  this.canvasPosition.x), 
            y: Length.px(y.value - this.canvasPosition.y), 
            width, 
            height
        }

        rect.x2 = Length.px(rect.x.value + rect.width.value);
        rect.y2 = Length.px(rect.y.value + rect.height.value);

        this.refs.$dragAreaRect.css({
            left: Length.px(-10000),
            top: Length.px(0),
            width: Length.px(0),
            height: Length.px(0)
        })


        if (editor.isSelectionMode()) {

            var artboard = editor.selection.currentArtboard;
            var items = [] 
            if (artboard) {
                Object.keys(rect).forEach(key => {
                    rect[key].div(editor.scale)
                })

                items = artboard.checkInAreaForLayers(rect);

                if (rect.width.value === 0 && rect.height.value === 0) {
                    items = [] 
                } 

                if (items.length === 0) {
                    if (artboard.checkInArea(rect)) {
                        items = [artboard]
                    }
                }

                if (editor.selection.select(...items)) {
                    this.selectCurrentForBackgroundView(...items)
                }
    
                if (items.length) {
                    this.emit('refreshSelection')
                } else {
                    editor.selection.select();            
                    this.emit('emptySelection')
                }                
            } else {
                editor.selection.select();                
                this.emit('emptySelection')            
            }
    

        } else {
            var obj = {
                x: Length.px(rect.x.value / editor.scale),
                y: Length.px(rect.y.value / editor.scale),
                width: Length.px(rect.width.value / editor.scale),
                height: Length.px(rect.height.value / editor.scale)
            }

            if (editor.addType === 'image') { 
                this.emit('addImage', obj);
            } else {
                if (editor.isComponent) {
                    this.emit('new.component', editor.addType, obj);
                } else {
                    this.emit('new.layer', editor.addType, obj);
                }

            }

        }

        this.sendHelpMessage();
        this.emit('removeGuideLine')
    }

    sendHelpMessage () {

        if (editor.selection.length === 1) {
            var current = editor.selection.current;

            if (current.is('svg-path', 'svg-polygon', 'svg-textpath')) {
                this.emit('addStatusBarMessage', 'Please click if you want to edit to path ');
            }

        } 

    }


    [KEYUP('$view .element-item.text')] (e) {
        var content = e.$delegateTarget.html()
        var text = e.$delegateTarget.text().trim()
        var id = e.$delegateTarget.attr('data-id');

        var arr = [] 
        editor.selection.items.filter(it => it.id === id).forEach(it => {
            it.reset({ content, text })
            arr.push({id:it.id, content, text})
        })

        this.emit('refreshContent', arr);
    }

    checkEditMode () {
        return editor.isSelectionMode()
    }

    [POINTERSTART('$view .element-item') + IF('checkEditMode')  + MOVE('calculateMovedElement') + END('calculateEndedElement')] (e) {
        this.startXY = e.xy ; 
        this.$element = e.$delegateTarget;

        if (this.$element.hasClass('text') && this.$element.hasClass('selected')) {
            return false; 
        }

        var id = this.$element.attr('data-id')        
        this.hasSVG = false;

        if (e.shiftKey) {
            editor.selection.toggleById(id);
        } else {

            if (editor.selection.check({ id } )) {
                if (editor.selection.current.is('svg-path', 'svg-textpath', 'svg-polygon')) {
                    this.hasSVG = true; 
                }
            } else {
                editor.selection.selectById(id);    
            }

        }
    
        this.selectCurrent(...editor.selection.items)
        editor.selection.setRectCache()        
        this.emit('refreshSelection');

    }

    calculateMovedElement (dx, dy) {
        this.children.$selectionTool.refreshSelectionToolView(dx, dy, 'move');
        this.updateRealPosition();     
    }

    updateRealPositionByItem (item) {
        var {x, y, width, height} = item.toBound();
        var cachedItem = this.state.cachedCurrentElement[item.id]

        if (!cachedItem) {
            this.state.cachedCurrentElement[item.id] = this.getElement(item.id);
            cachedItem = this.state.cachedCurrentElement[item.id]
        }

        if (cachedItem) {
            cachedItem.cssText(`left: ${x};top:${y};width:${width};height:${height}; transform: ${item.transform};`)
        }
    }

    updateRealPosition() {
        editor.selection.each(item => {
            this.updateRealPositionByItem(item);
        })

        this.emit('refreshRect');        
    }
    [EVENT('refreshArtBoardName')] (id, title) {
        this.$el.$(`[data-id='${id}']`).attr('data-title', title);
    }

    calculateEndedElement (dx, dy) {

        var current = editor.selection.items.length === 1 ? editor.selection.current : null;


        if (dx === 0 && dy === 0) {

            if (this.hasSVG) {
                this.emit('openPathEditor');
                return; 
            }

        }


        this.children.$selectionTool.refreshSelectionToolView(dx, dy, 'move');


        this.emit('refreshElement', current);
        editor.selection.setRectCache()                

        if (dx != 0 || dy != 0) {
            this.emit('removeGuideLine')        
        }
    }

    [BIND('$body')] () {
        var width = Length.px(10000);
        var height = Length.px(10000);

        return {
            'data-mode': editor.mode,
            style: {
                'position': 'relative',
                width,
                height
            }
        }
    }


    [BIND('$view')] () {
        return {
            style: {
                // 'background-image': createGridLine(100),
                // 'box-shadow': '0px 0px 5px 0px rgba(0, 0, 0, .5)',
                transform: `scale(${editor.scale})`
            },
            innerHTML: this.state.html
        }
    }    

    [EVENT('addElement')] () {
        var artboard = editor.selection.currentArtboard || { html : ''} 
        var html = artboard.html;

        this.setState({ html }, false)
        // this.bindData('$view');
        this.refs.$view.updateDiff(html)

        this.emit('refreshSelectionTool')
    }

    selectCurrent (...args) {
        this.state.cachedCurrentElement = {}
        var $selectedElement = this.$el.$$('.selected');

        if ($selectedElement) {
            $selectedElement.forEach(it => it.removeClass('selected'))
        }

        if(args.length) {

            var selector = args.map(it => `[data-id='${it.id}']`).join(',')

            var list = this.$el.$$(selector);
            
            list.forEach(it => {
                this.state.cachedCurrentElement[it.attr('data-id')] = it; 
                it.addClass('selected')
            })
            
        } else {
            editor.selection.select(editor.selection.currentArtboard)
        }
        // this.emit('refreshSelection')           

        this.emit('initSelectionTool')

    }


    selectCurrentForBackgroundView (...args) {
        this.state.cachedCurrentElement = {}
        var $selectedElement = this.$el.$$('.selected');

        if ($selectedElement) {
            $selectedElement.forEach(it => it.removeClass('selected'))
        }

        if(args.length) {

            var selector = args.map(it => `[data-id='${it.id}']`).join(',')

            var list = this.$el.$$(selector);
            
            list.forEach(it => {
                this.state.cachedCurrentElement[it.attr('data-id')] = it; 
                it.addClass('selected')
            })
            
        } else {
            // editor.selection.select()
        }
        this.emit('refreshSelection')           

        this.emit('initSelectionTool')

    }    
    
    [EVENT('refreshSelection')] () {

        if (!this.state.html) {
            this.trigger('addElement');
        }

        // var current = editor.selection.current || { id : ''} 
        // this.selectCurrent(current);        
        this.emit('initSelectionTool')
    }

    modifyScale () {
        this.refs.$view.css({
            transform: `scale(${editor.scale})`
        })

        this.emit('makeSelectionTool', true);
    }

    [EVENT('changeScale')] () {
       this.modifyScale();
    }

    // 객체를 부분 업데이트 하기 위한 메소드 
    [EVENT('refreshCanvasForPartial', 'refreshSelectionStyleView')] (obj, isChangeFragment = true,  isLast = false) {
        var items = obj ? [obj] : editor.selection.items;

        items.forEach(current => {
            this.updateElement(current, isChangeFragment, isLast);
        })
    }

    updateElement (item, isChangeFragment = true, isLast = false) {
        item.updateFunction(this.getElement(item.id), isChangeFragment, isLast);
        this.updateRealPositionByItem(item);
    }

    [EVENT('playTimeline', 'moveTimeline')] () {

        var artboard = editor.selection.currentArtboard;

        if (artboard) {
            var timeline = artboard.getSelectedTimeline();
            timeline.animations.map(it => artboard.searchById(it.id)).forEach(current => {
                this.updateElement(current);
            })
        }
    }    

    // @deprecated 
    // [EVENT('refreshCanvas')] (obj) {
    //     if (obj) {

    //         this.updateElement(obj);
    //     } else {
    //         this.trigger('addElement')
    //     }

    // }

    [EVENT('refreshAllCanvas')] () {
        var artboard = editor.selection.currentArtboard || { html : ''} 
        var html = artboard.html

        this.setState({ html })
        this.emit('refreshSelectionTool')        
    }

    refresh() {
        if (this.state.html != this.prevState.html) {
            this.load();
        } else {
            // NOOP 
        }
    }

    [EVENT('refreshAllElementBoundSize')] () {

        var selectionList = editor.selection.items.map(it => it.is('artboard') ? it : it.parent)

        var list = [...new Set(selectionList)];
        list.forEach(it => {
            this.trigger('refreshElementBoundSize', it);
        })

        editor.selection.setRectCache()
    }

    [EVENT('refreshElementBoundSize')] (parentObj) {
        if (parentObj) {
            parentObj.layers.forEach(it => {
                if (it.isLayoutItem()) {
                    var $el = this.getElement(it.id);

                    if ($el) {
                        const {x, y, width, height} = $el.offsetRect();

                        it.reset({
                            x: Length.px(x),
                            y: Length.px(y),
                            width: Length.px(width),
                            height: Length.px(height)
                        })
    
                        if (it.is('component')) {
                            this.emit('refreshStyleView', it, true);
                        }
    
                        // svg 객체  path, polygon 은  크기가 바뀌면 내부 path도 같이 scale up/down  이 되어야 하는데 
                        // 이건 어떻게 적용하나 ....                     
                        this.trigger('refreshSelectionStyleView', it, true);
                    }
                }

                this.trigger('refreshElementBoundSize', it);  
            })
        }
    }   
}