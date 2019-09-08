import UIElement from "../../../util/UIElement";
import { LOAD, INPUT, DEBOUNCE } from "../../../util/Event";
import PathParser from "../../../editor/parse/PathParser";

export default class PathDataEditor extends UIElement {

    

    initState() { 
        var parser = new PathParser(this.props.value || '')
        return {
            parser
        }
    }

    makeSegments () {
        return this.refs.$data.$$('segment').map($segment => {
            var command = $segment.$('.command').data('command');
            var values = $segment.$('.values input[type=number]').map(it => {
                return +it.value; 
            })

            return {
                command,
                values
            }
        })
    }

    updateData() {
        var segments = this.makeSegments()

        this.state.parser.resetSegments(segments);

        this.modifyPathData();
    }

    modifyPathData() {
        this.parent.trigger(this.props.onchange, this.props.key, this.state.parser.joinPath(), this.props.params);
    }

    setValue (value) {
        this.setState({
            parser: new PathParser(value)
        })
    }

    getValue () {
        return this.state.parser.joinPath();
    }

    template() {

        return /*html*/`
            <div class='path-data-editor'>
                <div class='data' ref='$data'></div>
            </div>
        `
    }

    [LOAD('$data')] () {
        return this.state.parser.segments.map(it => {
            return /*html*/`
                <div class='segment'>
                    <div class='command' data-command='${it.command}'>${it.command}</div>
                    <div class='values'>
                        ${it.values.map(v => {
                            return /*html*/`
                                <input type="number" value="${v}" />
                            `
                        }).join('')}
                    </div>
                </div>
            `
        })
    }

    [INPUT('$data input[type=number]') + DEBOUNCE(300)] (e) {
        this.updateData();
    }
}