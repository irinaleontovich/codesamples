/** Rich Edit HTML editor that wraps CkEditor.
 */

import React from 'react';
import S from 'string';
import ckeditor from './ckeditor';
import PTLinkDialog from './ptLinkDialog';
import Uploader from 'component-upload';

export default React.createClass({

    displayName: 'view/components/input/richedit',

    propTypes: {
        value: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        icon: React.PropTypes.element,
        iconCls: React.PropTypes.string,
        withClearIcon: React.PropTypes.bool,
        focused: React.PropTypes.bool,
        clearIcon: React.PropTypes.element,
        clearIconCls: React.PropTypes.string,
        withCounters: React.PropTypes.bool,
        maxLength: React.PropTypes.number,
        relatedEnabled: React.PropTypes.bool,

        onChange: React.PropTypes.func.isRequired,
        onFocus: React.PropTypes.func,
        onBlur: React.PropTypes.func,
        onLinkAction: React.PropTypes.func // (bookmark, recirculated, promo, related)
    },

    //mixins: [React.addons.PureRenderMixin], // TODO: this fails to compare onChange

    getDefaultProps() {
        return {
            onChange: () => {},
            relatedEnabled: true,
            value: '',
            placeholder: '',
            icon: null,
            iconCls: null,
            withClearIcon: false,
            clearIcon: null,
            clearIconCls: null,
            withCounters: true,
            maxLength: 1000000,
            onFocus: () => {},
            onBlur: () => {}
        }
    },

    getInitialState() {
        return {
            www: false
        }
    },


    renderIcon() {
        if (!this.props.icon && !this.props.iconCls) {
            return null;
        }
        return this.props.icon ? this.props.icon :
            <i className={this.props.iconCls}></i>;
    },

    renderClear() {
        if (!this.props.withClearIcon) {
            return null;
        }
        if (!this.props.clearIcon && !this.props.clearIconCls) {
            return null;
        }
        return this.props.clearIcon ? this.props.clearIcon :
            <a onClick={this.onClear}><i className={this.props.clearIconCls}></i></a>;
    },


    render() {
        let value = this.props.value || '',
            chars = this.countChars(value),
            words = this.countWords(value),
            error = this.props.maxLength && chars > this.props.maxLength ? 'Too much text has been entered' : null,
            cls = 'richedit' + (error ? ' error' : '');

        return (
            <div className={cls} ref="richeditid">
                <div className="icons">
                    <div className="icon" onClick={this.focus}>{this.renderIcon()}</div>
                    <div className="icon">{this.renderClear()}</div>
                </div>
                <textarea ref='editor'/>

                <div className="info">
                    {this.props.withCounters && <span>{words} words</span>}
                    {this.props.withCounters && <span>{chars} characters</span>}
                </div>
                {error && <div className='error'>{error}</div>}
            </div>
        );
    },

    componentDidMount() {
        let me = this;

        CKEDITOR.config.language = 'en';

        // Save the old CKEDITOR.plugins.load
        var orgLoad = CKEDITOR.plugins.load;

        // Overwrite CKEDITOR.plugins.load
        CKEDITOR.plugins.load = function () {
            // Save the old callback argument.
            var oldCallback = arguments[1];

            // Overwrite the old callback argument.
            arguments[1] = function (plugins) {
                // Modify the plugin by adding beforeInit to the definition.
                plugins.format.beforeInit = function (editor) {
                    editor.lang.format.label = 'Paragraph';
                    editor.lang.format.tag_p = 'Paragraph';
                };

                // Call the old callback.
                oldCallback.call(this, plugins);
            };

            // Call old CKEDITOR.plugins.load
            orgLoad.apply(this, arguments);
        };

        me.editor = CKEDITOR.replace(me.refs.editor.getDOMNode(), {
            language: 'en',
            resize_enabled: false,
            removePlugins: 'elementspath',
            extraPlugins: 'confighelper',
            toolbar: [
                ['ExpandToolbar'],
                ['Format', 'Bold', 'Italic', 'Underline', 'Blockquote'],
                ['JustifyLeft', 'JustifyCenter', 'JustifyRight'],
                ['BulletedList', 'NumberedList'], ['ptAddLink', 'Unlink'], ['Source'],
                ['Font', 'FontSize', 'TextColor'], ['BGColor', 'PasteText', 'RemoveFormat'],
                ['Image'], ['CollapseToolbar'],
                ['Link'] //['Link'] element need to be loaded to do links pre-processing
            ],
            placeholder: this.props.placeholder,
            contentsCss: 'style/ckeditor.css'
        });

        PTLinkDialog.register(me.editor, {
            related: this.props.relatedEnabled,
            onOpen: ()=> {},
            onClose: ()=> { me.props.onLinkAction(null); },
            onSelectColumn: (type)=> { me.props.onLinkAction(type); }
        });

        me.editor.on('instanceReady', ()=> {
            if (me.props.value) {
                me.editor.setData(me.props.value);
            }
        });

        me.editor.addCommand("CollapseToolbar", {
            exec: function (edt) {
                var field = document.getElementById('cke_' + me.editor.name);
                var c = 'cketoolbar_collapsed';
                var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
                field.className = field.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
            }
        });

        me.editor.ui.addButton('CollapseToolbar', {
            label: "Collapse",
            command: 'CollapseToolbar',
            toolbar: 'insert',
            icon: ''
        });

        me.editor.addCommand("ExpandToolbar", {
            exec: function (edt) {
                var field = document.getElementById('cke_' + me.editor.name);
                var c = 'cketoolbar_collapsed';
                var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
                if (re.test(field.className)) return;
                field.className = (field.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
            }
        });

        me.editor.ui.addButton('ExpandToolbar', {
            label: "Expand",
            command: 'ExpandToolbar',
            toolbar: 'insert',
            icon: ''
        });

        me.editor.on('change', e => {
            me.props.onChange(e.editor.getData());
        });

        me.editor.on('focus', e => {
            this.props.onFocus();
        });
        me.editor.on('blur', e => {
            this.props.onBlur();
        });
        me.editor.on('mode', function () {
            if (this.mode == 'source') {
                let editable = me.editor.editable();
                editable.attachListener(editable, 'input', function (data) {
                    // Handle changes made in the source mode.
                    if (data && data.data && data.data.$ && data.data.$.target) {
                        let input = data.data.$.target,
                            value = input ? input.value : '';
                        me.props.onChange(value);
                    }
                });
            }
        });


        me.editor.on('instanceReady', (e) => {
            if (me.props.focused) {
                let focusManager = new CKEDITOR.focusManager(me.editor);
                focusManager.focus();

                me.focus();
            }

            e.editor.lang.link.targetFrameName = 'Target Window Name';
        });


        CKEDITOR.on('dialogDefinition', (e) => {
            // Take the dialog name and its definition from the event data.
            var dialogName = e.data.name;
            var dialogDefinition = e.data.definition;

            // Check if the definition is from the dialog we're interested on (the "Link" dialog).
            switch (dialogName) {
                case 'link':
                    // Get a reference to the "Link Info" tab.
                    var infoTab = dialogDefinition.getContents('info');
                    var targetTab = dialogDefinition.getContents('target');

                    dialogDefinition.removeContents('advanced');

                    // Get a reference to the link type
                    var linkOptions = infoTab.get('linkType');
                    var linkTargetOptions = targetTab.get('linkTargetType');

                    linkOptions['items'] = [['URL', 'url'], ['E-mail', 'email']];
                    linkTargetOptions['items'] = [['Not Set', 'notSet'], ['Blank', '_blank'], ['Named Window', 'frame'], ['Top', '_top'], ['Self', '_self'], ['Parent', '_parent']];
                    break;

                case 'image':
                    var imageInfoTab = dialogDefinition.getContents('info'),
                        imageBrowseButton = imageInfoTab.get('btnBrowse'),
                        imageUrl = imageInfoTab.get('txtUrl');

                    if (!imageBrowseButton) {
                        imageInfoTab.add({
                            type: 'button',
                            id: 'btnBrowse',
                            class: 'cke-btn-browse',
                            label: 'Browse',
                            title: 'Browse Image',
                            onClick: function () {
                                var fileSelector = document.createElement('input');
                                fileSelector.setAttribute('type', 'file');
                                fileSelector.onchange = function (evt) {
                                    var files = evt.target.files,
                                        errorMsg = document.getElementById('txtUrl-message');

                                    if (errorMsg) errorMsg.remove();

                                    var dialogBody = document.getElementsByClassName('cke_dialog_contents')[0],
                                        dialogBodyClass = 'loading';

                                    me.showLoadbar(dialogBody, dialogBodyClass);

                                    let upload = Uploader(files[0]),
                                        uploadUrl = '/services/image/upload';
                                    upload.to(uploadUrl);
                                    upload.on('end', function (response) {
                                        var txtUrl = CKEDITOR.dialog.getCurrent().getContentElement('info', 'txtUrl').getInputElement();

                                        if (response && response.status) {
                                            if (response.status >= 200 && response.status < 300) {
                                                var result = JSON.parse(response.responseText);

                                                if (result.success) {
                                                    txtUrl.setValue(result.imageUrl);
                                                }
                                                else {
                                                    me.onUploadError(dialogBody, dialogBodyClass, 'Failed to upload');
                                                }
                                            }
                                            else {
                                                me.onUploadError(dialogBody, dialogBodyClass, 'Failed to upload');
                                            }
                                        }
                                        me.hideLoadbar(dialogBody, dialogBodyClass);
                                    });
                                    upload.on('error', function (response) {
                                        me.onUploadError(dialogBody, dialogBodyClass, 'Failed to upload');
                                    });

                                    upload.on('abort', function (response) {
                                        me.onUploadError(dialogBody, dialogBodyClass, 'Upload aborted');
                                    });


                                };
                                fileSelector.style.opacity = 0;
                                document.body.appendChild(fileSelector);
                                fileSelector.click();
                            }
                        });
                    }
                    break;
                default:
                    break;
            }

        });
    },

    componentWillUnmount() {
        this.editor.destroy();
        this.editor = null;
    },

    componentDidUpdate() {
        if (this.editor.getData() != this.props.value) {
            this.editor.setData(this.props.value);
        }
    },

    shouldComponentUpdate(nextProps, nextState) {
        //console.log("shouldComponentUpdate", newProps, newState);
        //return React.addons.PureRenderMixin.shouldComponentUpdate.call(this, newProps, newState)
        return this.props.value != nextProps.value;
    },

    focus() {
        this.editor.focus();

        // fix for some browsers
        setTimeout(() => this.editor.focus(), 500);
    },

    onClear() {
        this.props.onChange('');
    },

    countWords(s) {
        const words = S(s).stripTags().decodeHTMLEntities().match(/\w+/g);
        return words ? words.length : 0;
    },

    countChars(s) {
        return S(s).stripTags().decodeHTMLEntities().collapseWhitespace().length;
    },

    showLoadbar(el, className) {
        var re = new RegExp("(^|\\s)" + className + "(\\s|$)", "g");
        if (!re.test(el.className)) {
            el.className = (el.className + " " + className).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
        }
    },

    hideLoadbar(el, className) {
        var re = new RegExp("(^|\\s)" + className + "(\\s|$)", "g");
        el.className = el.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
    },

    onUploadError(el, className, error) {
        var txtUrl = CKEDITOR.dialog.getCurrent().getContentElement('info', 'txtUrl').getInputElement();

        txtUrl.getParent().appendHtml('<p id="txtUrl-message">' + error + '</p>');
        this.hideLoadbar(el, className);
    }
});