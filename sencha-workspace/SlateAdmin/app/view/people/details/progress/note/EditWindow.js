/*jslint browser: true, undef: true, white: false, laxbreak: true *//*global Ext,Slate*/
Ext.define('SlateAdmin.view.people.details.progress.note.EditWindow',{
    extend: 'Ext.window.Window',
    xtype: 'people-details-progress-note-editwindow',
    requires: [
        'Ext.layout.container.Border',
        'SlateAdmin.view.people.details.progress.note.RecipientGrid',
        'SlateAdmin.view.people.details.progress.note.Viewer',
        'SlateAdmin.view.people.details.progress.note.Form'
    ],

    progressNote: null,

    layout: 'border',
    height: 500,
    width: 800,
    title: 'Compose Progress Note',
    bbar: [{
        xtype: 'button',
        text: 'Discard Changes',
        cls: 'glyph-danger',
        glyph: 0xf057, // fa-times-circle
        action: 'discardProgressNote'
    },{
        xtype: 'tbfill'
    },{
        xtype: 'button',
        text: 'Send &amp; Submit to Official Record',
        cls: 'glyph-accent',
        glyph: 0xf1d9, // fa-send-o
        action: 'sendProgressNote'
    }],
    modal: true,
    items: [{
        xtype: 'container',
        layout: 'card',
        region: 'center',
        itemId: 'progressNoteCt',
        items: [{
            xtype: 'people-details-progress-note-form'
        },{
            xtype: 'people-details-progress-note-viewer'
        }]
    },{
        xtype: 'people-details-progress-note-recipientgrid',
        width: 320,
        region: 'east'
    }],


    //helper functions
    updateProgressNote: function(progressNote){
        if(!progressNote)
            return false;

        var me = this,
            activeItem = this.down('#progressNoteCt').getLayout().getActiveItem(),
            noteForm = this.down('people-details-progress-note-form');

        if(activeItem == noteForm) {
            noteForm.loadRecord(progressNote);
        }
        else {
            this.down('people-details-progress-note-viewer').update(progressNote);
        }

        this.progressNote = progressNote;
    },

    getProgressNote: function() {
        var me = this,
            activeItem = this.down('#progressNoteCt').getLayout().getActiveItem(),
            noteForm = this.down('people-details-progress-note-form');

        if(activeItem == noteForm) {
            var record = noteForm.getRecord();

            record.set(noteForm.getValues());

            return record;
        }
        else {
            return this.progressNote;
        }
    }
});
