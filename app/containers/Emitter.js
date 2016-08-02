import React, {Component, PropTypes} from "react";
import {AutoComplete, TableRow, TableRowColumn, IconButton, TextField, Dialog, FlatButton, Snackbar} from "material-ui";
import ArrowUpward from "material-ui/lib/svg-icons/navigation/arrow-upward";
import Code from "material-ui/lib/svg-icons/action/code";
import {connect} from "react-redux";
import {List, Set} from "immutable";
import ExtendedEmitter from "../components/ExtendedEmitter";
import * as actions from "../actions";

class Emitter extends Component {
    state = {
        open: false,
        templateNameOpen: false,
        template: {},
        templateName: '',
        snackbarOpen: false
    };

    openExtendedEmitter() {
        this.setState({open: true});
    }

    closeExtendedEmitter() {
        this.setState({open: false});
    }

    render() {
        let {lastValue, templates} = this.props;
        var dataSource = this._prepareDataSource();
        return (
            <TableRow selectable={false}>
                <TableRowColumn title="Send" width="5%">
                    <IconButton onClick={e => this.doEmit()}>
                        <ArrowUpward/>
                    </IconButton>
                </TableRowColumn>
                <TableRowColumn>
                    <AutoComplete
                        ref="type"
                        hintText="Event name"
                        dataSource={dataSource}
                        searchText={lastValue && lastValue.eventType}
                        triggerUpdateOnFocus={true}
                        autoComplete="off"
                        fullWidth={true}
                        onKeyUp={e => e.keyCode === 13 && this.doEmit()}
                    />
                </TableRowColumn>
                <TableRowColumn>
                    <TextField
                        hintText="String will be used as first argument for event"
                        fullWidth={true}
                        ref="text"
                        onKeyUp={e => e.keyCode === 13 && this.doEmit()}
                    />
                </TableRowColumn>
                <TableRowColumn width="5%">
                    <IconButton title="Extended" onClick={() => this.openExtendedEmitter()}>
                        <Code/>
                    </IconButton>
                    <ExtendedEmitter
                        handleClose={() => this.closeExtendedEmitter()}
                        open={this.state.open}
                        onEmit={this.onExtendedEmit.bind(this)}
                        onSave={this.onRequestSave.bind(this)}
                        dataSource={dataSource}
                        searchText={lastValue && lastValue.eventType}
                        templates={templates && templates.toJS()}
                    />
                    <Dialog
                        actions={[
                            <FlatButton
                                label="Cancel"
                                onTouchTap={e => this.setState({templateNameOpen: false})}
                            />,
                            <FlatButton
                                label="Ok"
                                primary={true}
                                onTouchTap={() => this.onTemplateSave()}
                                disabled={this.disabled}
                            />
                        ]}
                        modal={false}
                        open={this.state.templateNameOpen}
                        onRequestClose={e => this.setState({templateNameOpen: false})}
                        title="Input template name"
                    >
                        <TextField
                            value={this.state.templateName}
                            fullWidth={true}
                            onChange={event => this.setState({templateName: event.target.value})}
                        />
                    </Dialog>
                    <Snackbar
                        open={this.state.snackbarOpen}
                        message="Template saved"
                        autoHideDuration={2000}
                        onRequestClose={e => this.setState({snackbarOpen: false})}
                    />
                </TableRowColumn>
            </TableRow>
        );
    }

    doEmit() {
        this.onEmit(this.refs.type.getValue(), this.refs.text.getValue());
    }

    _prepareDataSource() {
        let {history} = this.props;
        return history.toJS().filter(Boolean);
    }

    onEmit(type, text) {
        let {dispatch} = this.props;
        dispatch(actions.emit(type, text));
    }

    onExtendedEmit(type, args, cb) {
        let {dispatch} = this.props;
        this.closeExtendedEmitter();
        if (cb) {
            var callback = function (...callbackArgs) {
                dispatch(actions.addEvent('callback:' + type, callbackArgs, true));
            };
            callback.toString = () => 'function() { /* code hidden */ }';
            args.push(callback);
        }
        dispatch(actions.emit(type, ...args));
    }

    onRequestSave(eventType, args, callbackUsed) {
        this.setState({template: {eventType, args, callbackUsed}, templateNameOpen: true, templateName: eventType});
    }

    onTemplateSave() {
        let template = this.state.template;
        this.props.dispatch(actions.addTemplate(template.eventType, template.args, template.callbackUsed, this.state.templateName));
        this.setState({templateNameOpen: false, snackbarOpen: true});
    }
}

Emitter.propTypes = {
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.instanceOf(Set),
    templates: PropTypes.instanceOf(List),
    lastValue: PropTypes.string
};

function mapStateToProps(state) {
    const emitter = state.emitter;
    let history = emitter.get('history');
    let templates = emitter.get('templates');
    let lastValue = emitter.get('lastValue');
    if (!history) history = Set.of();
    return {history, lastValue, open, templates};
}

export default connect(mapStateToProps)(Emitter);

