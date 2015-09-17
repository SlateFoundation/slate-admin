/*jslint browser: true, undef: true *//*global Ext*/
/**
 * people.Profile controller handles events for the people.details.Profile
 */
Ext.define('SlateAdmin.controller.people.Profile', {
    extend: 'Ext.app.Controller',

    // controller config
    views: [
        'people.Manager',
        'people.details.Profile'
    ],

    refs: {
        profilePanel: {
            selector: 'people-details-profile',
            autoCreate: true,

            xtype: 'people-details-profile'
        },
        profileForm: 'people-details-profile form',
        cancelBtn: 'people-details-profile button[action=cancel]',
        saveBtn: 'people-details-profile button[action=save]',
        studentNumberField: 'people-details-profile field[name=StudentNumber]',
        accountLevelField: 'people-details-profile field[name=AccountLevel]',
        groupsField: 'people-details-profile field[name=groupIDs]',
        manager: 'people-manager'
    },

    control: {
        'people-manager #detailTabs': {
            beforerender: 'onBeforeTabsRender'
        },
        'people-details-profile': {
            personloaded: 'onPersonLoaded'
        },
        'people-details-profile form': {
            dirtychange: 'syncButtons',
            validitychange: 'syncButtons'
        },
        'people-details-profile button[action=cancel]': {
            click: 'onCancelButtonClick'
        },
        'people-details-profile button[action=save]': {
            click: 'onSaveButtonClick'
        }
    },


    // event handlers

    /**
     * Event Handler. Adds the profile panel to the details tab panel
     * @param {Ext.tab.Panel} detailsTabs The details tab panel defined in SlateAdmin.view.people.Manager
     * @return {void}
     */
    onBeforeTabsRender: function(detailTabs) {
        detailTabs.add(this.getProfilePanel());
    },

    /**
     * Event Handler. Handles personloaded event defined by SlateAdmin.view.people.details.AbstractDetails which fires when
     * the tab is activated or a new person is selected.  This initializes the form for the selected user.
     * @param {SlateAdmin.controller.people.Profile} profilePanel The profile panel.
     * @param {SlateAdmin.model.person.Person} person The person record.
     * @return {void}
     */
    onPersonLoaded: function(profilePanel, person) {
        var me = this,
            personClass = person.get('Class'),
            profileForm = me.getProfileForm(),
            groupsField = me.getGroupsField(),
            groupsStore = groupsField.getStore();

        me.getStudentNumberField().setVisible(personClass == 'Slate\\People\\Student');
        me.getAccountLevelField().setVisible(personClass != 'Emergence\\People\\Person');

        // ensure groups store is loaded before loading record because boxselect doesn't hande re-setting unknown values after local store load
        if (groupsStore.isLoaded()) {
            profileForm.loadRecord(person);
        } else {
            profilePanel.setLoading('Loading groups&hellip;');
            groupsStore.load({
                callback: function() {
                    profileForm.loadRecord(person);
                    profilePanel.setLoading(false);
                }
            });
        }
    },

    /**
     * Event Handler. Discards changes and resets form to last loaded state when cancel button is clicked.
     * @return {void}
     */
    onCancelButtonClick: function() {
        this.getProfileForm().getForm().reset();
    },

    /**
     * Event Handler. Saves changes to user profile.
     * @return {void}
     */
    onSaveButtonClick: function() {
        var me = this,
            profileForm = me.getProfileForm(),
            form = profileForm.getForm(),
            person = form.getRecord(),
            manager = me.getManager();

        profileForm.setLoading('Saving&hellip;');

        form.updateRecord(person);

        person.save({
            success: function(record) {
                // manually commit entire saved record until EXTJSIV-11442 is fixed
                // see: http://www.sencha.com/forum/showthread.php?273093-Dirty-red-mark-of-grid-cell-not-removed-after-record.save
                record.commit();

                manager.syncDetailHeader();

                profileForm.loadRecord(record);

                profileForm.setLoading(false);
            },
            failure: function(record, operation) {
                var rawData = record.getProxy().getReader().rawData,
                    errorMessage = 'There was a problem saving your changes, please double-check your changes and try again',
                    failed,
                    validationErrors;

                if (rawData && (failed = rawData.failed) && failed[0] && (validationErrors = failed[0].validationErrors)) {
                    Ext.Object.each(validationErrors, function(fieldName, error) {
                        var field = profileForm.getForm().findField(fieldName);

                        if (field) {
                            profileForm.getForm().findField(fieldName).markInvalid(error);
                        }
                    });
                    validationErrors = 'You\'ve tried to make invalid changes, please check the highlighted field(s) for details';
                }

                Ext.Msg.alert('Not saved', validationErrors);
                profileForm.setLoading(false);
            }
        });
    },

    // internal methods

    /**
     * Set the enabled/disabled states of the Save and Cancel buttons based on the dirty and valid properties of the form.
     * @return {void}
     */
    syncButtons: function() {
        var me = this,
            profileForm = me.getProfileForm(),
            valid = profileForm.isValid(),
            dirty = profileForm.isDirty();

        me.getCancelBtn().setDisabled(!dirty);
        me.getSaveBtn().setDisabled(!dirty || !valid);
    }
});
