/*jslint browser: true, undef: true *//*global Ext*/
Ext.define('SlateAdmin.view.people.NavPanel', {
    extend: 'Ext.Panel',
    xtype: 'people-navpanel',
    requires: [
        'Ext.form.Panel',
        'Jarvus.ext.form.field.Search',
        'SlateAdmin.view.people.AdvancedSearchForm'
    ],

    title: 'People',
    autoScroll: true,

    config: {
        bodyPadding: 0 
    },

    setBodyPadding: function() {
        // try to figure out why bodypadding is being set to 10... 
        // debugger;
    },
    
    dockedItems: [{
        dock: 'top',

        xtype: 'form',
        cls: 'navpanel-search-form',
        items: [{
            xtype: 'jarvus-searchfield',
            anchor: '100%',
            emptyText: 'Search all people…'
        }]
    }],

    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [{
        xtype: 'people-advancedsearchform',
        border: 0,
        bodyPadding: '10 10 0'
    },{
        xtype: 'treepanel',
        itemId: 'groups',
        border: 0,

        // treepanel config
        store: 'people.GroupsTree',
        scroll: false,
        rootVisible: true,
        useArrows: true,
        singleExpand: true,
        hideHeaders: true,
        viewConfig: {
            toggleOnDblClick: false
        },
        columns: [{
            xtype: 'treecolumn',
            flex: 1,
            dataIndex: 'text'
//        },{
//            width: 20,
//            dataIndex: 'Population'
        }]
    }]
});