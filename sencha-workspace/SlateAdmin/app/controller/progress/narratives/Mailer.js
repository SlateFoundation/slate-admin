/*jslint browser: true, undef: true, white: true, laxbreak: true *//*global Ext*/
Ext.define('SlateAdmin.controller.progress.narratives.Mailer', {
    extend: 'Ext.app.Controller',

    // entry points
    routes: {
        'progress/narratives/email': 'showNarrativeMailer'
    },

    control: {
        termCombo: {
            afterrender: 'onTermComboRender',
            storeload: 'onTermComboStoreLoad'
        },
        'progress-narratives-mailer combo#studentCombo': {
            beforequery: 'onStudentComboBeforeQuery'
        },
        'progress-narratives-mailer button[action=clear-filters]': {
            click: 'onClearFiltersClick'
        },
        'progress-narratives-mailer button[action=search]': {
            click: 'onSearchClick'
        },
        narrativesMailerGrid: {
            select: 'onNarrativesMailerGridSelect'
        },
        'progress-narratives-mailergrid button[action="send-all"]': {
            click: 'onSendAllClick'
        }
    },

    listen: {
        store: {
            '#progress.narratives.Reports': {
                load: 'onReportStoreLoad'
            }
        }
    },


    // controller configuration
    views: [
        'progress.narratives.Mailer',
        'progress.narratives.MailerGrid'
    ],

    stores: [
        'Terms',
        'people.Advisors',
        'people.People',
        'progress.narratives.Students',
        'progress.narratives.Reports'
    ],

    refs: {
        progressNavPanel: 'progress-navpanel',

        narrativesMailer: {
            selector: 'progress-narratives-mailer',
            autoCreate: true,

            xtype: 'progress-narratives-mailer'
        },
        narrativesMailerForm: 'progress-narratives-mailer form#filterForm',
        narrativesMailerGrid: 'progress-narratives-mailergrid',
        narrativesMailerGridTotal: 'progress-narratives-mailergrid component#total',
        narrativesMailerPreviewBox: 'progress-narratives-mailer component#previewBox',
        termCombo: 'progress-narratives-mailer combo#termCombo'
    },


    // route handler
    showNarrativeMailer: function () {
        var me = this,
            navPanel = me.getProgressNavPanel();

        Ext.suspendLayouts();

        Ext.util.History.suspendState();
        navPanel.setActiveLink('progress/narratives/print');
        navPanel.expand();
        Ext.util.History.resumeState(false); // false to discard any changes to state

        me.application.getController('Viewport').loadCard(me.getNarrativesMailer());

        Ext.resumeLayouts(true);
    },


    // event handlers
    onTermComboRender: function (combo) {
        var me = this,
            mailer = me.getNarrativesMailer(),
            store = combo.getStore();

        combo.relayEvents(store, ['load'], 'store');

        if(!store.isLoaded()) {
            mailer.setLoading('Loading terms&hellip;');
            store.load();
        }
    },

    onTermComboStoreLoad: function (store) {
        var me = this,
            mailer = me.getNarrativesMailer(),
            combo = me.getTermCombo();

        if (!combo.getValue()) {
            combo.setValue(store.getReportingTerm().getId());
            mailer.setLoading(false);
        }
    },

    onStudentComboBeforeQuery: function(queryPlan) {
        if (queryPlan.query) {
            queryPlan.query += ' class:Student';
        } else {
            queryPlan.query += 'class:Student';
        }
    },

    onClearFiltersClick: function () {
        var me = this,
            store = me.getProgressNarrativesReportsStore(),
            preview = document.getElementById(me.getNarrativesMailerPreviewBox().iframeEl.dom.id);

        me.getNarrativesMailerForm().getForm().reset();
        store.clearFilter(true);
        store.removeAll();
        preview.src = 'about:blank';
    },

    onSearchClick: function () {
        var me = this,
            formValues = me.getNarrativesMailerForm().getForm().getValues(),
            recipients = formValues.Recipients,
            store = me.getProgressNarrativesReportsStore(),
            filters = me.grabFilters(),
//            params = { include: 'Student,EmailRecipients' };
            params = { include: 'Student,SelfRecipients,AdvisorRecipients,GuardianRecipients' };

        filters = this.grabFilters();
        store.clearFilter(true);
        store.addFilter(filters, true);

/*
        // add recipients to params if requested
        if (recipients) {
            if (Ext.isArray(recipients)) {
                recipients = recipients.join(',');
            }

            params = Ext.apply({
                Recipients: recipients
            }, params);
        }
*/

        store.getProxy().setExtraParams(params);
        store.load();

    },

    onNarrativesMailerGridSelect: function (row, rec) {
        var me = this,
            previewBox = me.getNarrativesMailerPreviewBox();

        query = {
            q: 'narrativeID:'+rec.get('ID')
        };

        previewBox.enable();
        previewBox.setLoading({msg: 'Loading previewreports&hellip;'});

        previewBox.iframeEl.on('load', function () {
            me.fireEvent('previewload', me, previewBox);
            previewBox.setLoading(false);
        }, me, { single: true, delay: 10 });

        SlateAdmin.API.request({
            url: '/progress/narratives/reports',
            headers: {
                'Accept': 'text/html'
            },
            params: query,
            scope: me,
            success: function (res) {
                var doc = document.getElementById(previewBox.iframeEl.dom.id).contentWindow.document;

                doc.open();
                doc.write(res.responseText);
                doc.close();
            }
        });
    },

    onSendAllClick: function() {
        var me = this,
            grid = me.getNarrativesMailerGrid(),
            store = me.getProgressNarrativesReportsStore(),
            proxy = store.getProxy(),
            filters = proxy.encodeFilters(store.getFilters().getRange()),
            params = Ext.apply(Ext.apply({}, proxy.getExtraParams()), { q: filters }),
            msg;

        grid.mask('Sending emails');

        SlateAdmin.API.request({
            url: proxy.getUrl()+'/email',
            params: params,
            scope: me,
            success: function (res) {
                grid.unmask();
                if (res && res.data && res.data) {
                    msg = '<p>' + res.data.successful + ' emails sent successfully.</p>';
                    if (res.data.failed > 0) {
                        msg += '<p>' + res.data.failed+ ' emails were not able to be sent.<ul>';
                        Ext.Array.each(res.data.errors, function(err) {
                            msg += '<li>' + err + '</li>';
                        });
                        msg += '</ul></p>';
                    }
                    Ext.Msg.alert('Results', msg);
                } else {
                    Ext.Msg.alert('An error occurred while trying to send emails.  Please check logs for details');
                }
            }
        });
    },

    /*
     * TODO: This store is used in multiple places.  When/if this application is upgraded to Ext JS 6,
     * this might be better handled in a handler for the grid's load event, which does not exist in Ext JS 5
     */
    onReportStoreLoad: function (store, records) {
        var grid = this.getNarrativesMailerGrid(),
            total = this.getNarrativesMailerGridTotal();

        if (grid && total && records) {
            total.setText(records.length + ' Report' + (records.length == 1 ? ' ' : 's'));
        }
    },


    // custom controller methods
    grabParams: function() {
        var filters = this.grabFilters(),
            params = [],
            filtersLength = filters.length,
            i = 0, param;

        for (; i<filtersLength; i++) {
            param = {};
            param[filters[i].property] = filters[i].value;
            params.push(param);
        }
        return params;
    },

    grabFilters: function () {
        var me = this,
            formValues = me.getNarrativesMailerForm().getForm().getValues(),
            currentTerm = me.getTermCombo().getStore().getReportingTerm().getId(),
            filters = [];

        /*
         * TODO: - toString() can be removed when/if this pull request is merged:
         * https://github.com/JarvusInnovations/emergence-apikit/pull/4
         */
        // Set filters
        if (formValues.termID) {
            filters.push({property: 'termID', value: formValues.termID.toString()});
        } else {
            filters.push({property: 'termID', value: currentTerm.toString()});
        }

        if (formValues.advisorID) {
            filters.push({property: 'advisorID', value: formValues.advisorID.toString()});
        }

        if (formValues.studentID) {
            filters.push({property: 'studentID', value: formValues.studentID.toString()});
        }

        if (formValues.authorID) {
            filters.push({property: 'authorID', value: formValues.authorID.toString()});
        }

        return filters;

    }

});
