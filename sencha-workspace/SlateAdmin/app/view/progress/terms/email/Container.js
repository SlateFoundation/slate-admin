Ext.define('SlateAdmin.view.progress.terms.email.Container', {
    extend: 'Ext.container.Container',
    xtype: 'progress-terms-email-container',
    requires: [
        'SlateAdmin.widget.field.Person',
        'SlateAdmin.view.progress.terms.email.Grid',

        'Ext.form.Panel',
        'Ext.form.FieldSet',
        'Ext.form.field.ComboBox',
        'Ext.form.CheckboxGroup',
        'Ext.toolbar.Fill',
        'Ext.toolbar.Separator'
    ],


    componentCls: 'progress-terms-email-container',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    items: [
        {
            xtype: 'form',
            itemId: 'optionsForm',
            bodyPadding: 5,
            items: [
                {
                    xtype: 'fieldset',
                    itemId: 'filtersFieldset',
                    title: 'Filter reports by&hellip;',
                    layout: 'hbox',
                    padding: 10,
                    defaultType: 'combo',
                    defaults: {
                        flex: 1,
                        labelAlign: 'right',
                        labelWidth: 60,
                        forceSelection: true,
                        allowBlank: true,
                        valueField: 'ID'
                    },
                    items: [
                        {
                            name: 'term',
                            fieldLabel: 'Term',
                            emptyText: 'Current Term',

                            store: 'Terms',
                            displayField: 'Title',
                            valueField: 'Handle',

                            queryMode: 'local',
                            forceSelection: false
                        },
                        {
                            name: 'advisor',
                            fieldLabel: 'Advisor',
                            emptyText: 'Any',

                            store: 'Advisors',
                            displayField: 'SortName',
                            valueField: 'Username',

                            queryMode: 'local',
                            typeAhead: true,
                            forceSelection: false
                        },
                        {
                            name: 'author',
                            fieldLabel: 'Author',
                            emptyText: 'Any',

                            store: 'progress.terms.Authors',
                            displayField: 'SortName',
                            valueField: 'Username',

                            queryMode: 'local',
                            typeAhead: true,
                            forceSelection: false
                        },
                        {
                            xtype: 'slate-personfield',
                            name: 'student',
                            fieldLabel: 'Student',
                            emptyText: 'All',
                            appendQuery: 'class:student'
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    itemId: 'recipientsFieldset',
                    title: 'Recipients',
                    layout: 'hbox',
                    padding: 10,
                    defaultType: 'checkbox',
                    defaults: {
                        name: 'recipients[]',
                        value: true
                    },
                    items: [
                        {
                            boxLabel: 'Advisor',
                            inputValue: 'advisor'
                        },
                        {
                            boxLabel: 'Guardians',
                            inputValue: 'guardians'
                        }
                    ]
                }
            ],
            bbar: [
                { xtype: 'tbfill' },
                {
                    xtype: 'button',
                    text: 'Load Report Emails',
                    action: 'load-emails'
                },
                { xtype: 'tbseparator' },
                {
                    text: 'Reset Options',
                    action: 'reset-options'
                },
                { xtype: 'tbfill' }
            ]
        },
        {
            xtype: 'container',
            layout: 'border',
            flex: 1,
            items: [
                {
                    region: 'center',

                    xtype: 'progress-terms-email-grid',
                    bbar: [
                        { xtype: 'tbfill' },
                        {
                            xtype: 'tbtext',
                            itemId: 'emailsTotal',
                            text: 'No report emails loaded'
                        },
                        {
                            xtype: 'button',
                            text: 'Send All Emails',
                            action: 'send-emails',
                            disabled: true
                        }
                    ]
                },
                {
                    region: 'east',
                    split: true,
                    width: 500,

                    xtype: 'component',
                    itemId: 'emailPreview',
                    cls: 'email-preview',
                    renderTpl: '<iframe width="100%" height="100%"></iframe>',
                    renderSelectors: {
                        iframeEl: 'iframe'
                    },
                    listeners: {
                        afterrender: {
                            fn: function (emailPreviewCmp) {
                                var me = this;

                                me.mon(emailPreviewCmp.iframeEl, 'load', function () {
                                    me.fireEvent('previewload', me, emailPreviewCmp);
                                    emailPreviewCmp.setLoading(false);
                                });
                            },
                            delay: 10
                        }
                    }
                }
            ]
        }
    ]
});