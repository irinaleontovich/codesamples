import React from 'react'
import Dialog from '../components/dialog';

export default React.createClass({

    displayName: 'components/confirmChangeDialog',

    propTypes: {
        show: React.PropTypes.bool,
        onYes: React.PropTypes.func,
        onHide: React.PropTypes.func,
        text: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            onYes: () => {}
        }
    },

    getInitialState() {
        return {
            show: !!this.props.show
        }
    },

    componentWillReceiveProps(props) {
        if (props.hasOwnProperty('show')) {
            this.setState({show: props.show});
        }
    },

    render() {
        const changeDialogTitle = 'Confirmation',
            changeDialogYes = 'Yes',
            emptyFn = () => {},
            hideFn = () => { this.setState({show: false}) };
        let text = this.props.text ? this.props.text:
            'You have changes pending that are unsaved, do you wish to continue?';
        return <Dialog show={this.state.show}
                       title={changeDialogTitle}
                       yesText={changeDialogYes}
                       onHide={this.props.onHide || hideFn}
                       onYes={this.props.onYes || emptyFn}>
            <p>{text}</p>
        </Dialog>
    }
});