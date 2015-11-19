import React from 'react';
import Moment from 'moment';
import Immutable from 'immutable';
import {Input} from 'react-bootstrap';
import CollapsiblePanel from '../collapsiblePanel';

/**
 * Bookmark details. Pure view
 */
export default React.createClass({

    displayName: 'components/bookmarks/itemDetails',

    mixins: [React.addons.PureRenderMixin],

    props: {
        item: React.PropTypes.objectOf(Immutable.Map),
        annotationExpanded: React.PropTypes.bool,
        curatorExpanded: React.PropTypes.bool,
        embedExpanded: React.PropTypes.bool
    },

    render: function () {
        let item = this.props.item,
            annotation = item.getIn(['annotation', 'annotation']) || '',
            author = item.getIn(['annotation', 'authorName']) || '',
            embed = item.getIn(['embed', 'code']) || '',
            showAnnotationToggle = annotation.length > 96,
            annotationTruncated = annotation.substr(0, 96) + '...',
            annotationToggleClass = this.props.annotationExpanded ? 'glyphicon fa-minus-circle' : 'glyphicon fa-plus-circle',
            expandedCuratorHeader = (<span className="title">Curator</span>),
            collapsedCuratorHeader = (
                <span>
                    <span className="title">Curator</span>
                </span>),
            expandedEmbedHeader = (<span className="title">Embed</span>),
            collapsedEmbedHeader = (<span className="title">Embed</span>);

        return (
            <div className="line-item-row bookmarks-tab bookmarks-details-tab">
                {annotation &&
                <CollapsiblePanel expanded={this.props.curatorExpanded}
                                  expandedHeader={expandedCuratorHeader}
                                  collapsedHeader={collapsedCuratorHeader}>
                    <div className="bookmarks-details-tab-body">
                        <div>
                            <span className="annotation-icon pull-left"><i className="glyphicon fa-user"/></span>
                            <span className="annotation-author pull-left">{author},</span>
                            <span className="annotation-date pull-left">{Moment(item.getIn(['annotation', 'updateDate'])).format('MM/DD/YYYY, ha')}</span>
                        </div>
                        <div className="annotation">
                            <span className="annotation-text">
                                {(this.props.annotationExpanded || !showAnnotationToggle ? annotation : annotationTruncated)}
                            </span>
                            {showAnnotationToggle &&
                            <a className="pull-right annotation-text-toggler" onClick={this.toggleAnnotation}>
                                <i className={annotationToggleClass}/>
                            </a>}
                        </div>
                    </div>
                </CollapsiblePanel>}
                {embed && <CollapsiblePanel expanded={this.props.embedExpanded}
                                            expandedHeader={expandedEmbedHeader}
                                            collapsedHeader={collapsedEmbedHeader}>
                    <div className="bookmarks-details-tab-body">
                        <Input type='textarea' value={embed} readOnly/>
                    </div>
                </CollapsiblePanel>}
            </div>
        );
    }
});