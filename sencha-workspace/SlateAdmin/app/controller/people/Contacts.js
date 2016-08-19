/* global Ext*/
/**
 * people.Contacts controller
 */
Ext.define('SlateAdmin.controller.people.Contacts', {
    extend: 'Ext.app.Controller',
    requires: [
        'Ext.window.MessageBox',
        'Jarvus.view.TableErrors'
    ],


    // controller config
    views: [
        'people.details.Contacts'
    ],

    stores: [
        'people.ContactPointTemplates',
        'people.RelationshipTemplates'
    ],

    refs: {
        contactsPanel: {
            selector: 'people-details-contacts',
            autoCreate: true,

            xtype: 'people-details-contacts'
        },
        relationshipsGrid: 'people-details-contacts grid#relationships',
        contactsGrid: 'people-details-contacts grid#contactPoints'
    },

    control: {
        'people-manager #detailTabs': {
            beforerender: 'onBeforeTabsRender'
        },
        'people-details-contacts': {
            personloaded: 'onPersonLoaded'
        },
        'people-details-contacts grid#relationships': {
            beforeedit: 'onBeforeRelationshipsGridEdit',
            edit: 'onRelationshipsGridEdit',
            deleteclick: 'onRelationshipsGridDeleteClick',
            guardianclick: 'onRelationshipsGridGuardianClick'
        },
        'people-details-contacts grid#contactPoints': {
            beforeedit: 'onBeforeContactsGridEdit',
            edit: 'onContactsGridEdit',
            deleteclick: 'onContactsGridDeleteClick',
            primaryclick: 'onContactsGridPrimaryClick'
        }
    },

    // event handlers
    onBeforeTabsRender: function(detailTabs) {
        detailTabs.add(this.getContactsPanel());
    },

    onPersonLoaded: function(contactsPanel, person) {
        var me = this,
            contactPointTemplatesStore = me.getPeopleContactPointTemplatesStore(),
            contactPointTemplatesStoreLoaded = contactPointTemplatesStore.isLoaded(),
            relationshipTemplatesStore = me.getPeopleRelationshipTemplatesStore(),
            relationshipTemplatesStoreLoaded = relationshipTemplatesStore.isLoaded(),
            relationshipsGrid = me.getRelationshipsGrid(),
            relationshipsStore = relationshipsGrid.getStore(),
            relationshipsStoreLoaded = false,
            contactsGrid = me.getContactsGrid(),
            contactsStore = contactsGrid.getStore(), contactsStoreLoaded = false;

        Ext.defer(function() {
            // resume rendering and finish when all 3 stores are loaded
            var onStoresLoaded = function() {
                if (contactPointTemplatesStoreLoaded && relationshipTemplatesStoreLoaded && contactsStoreLoaded && relationshipsStoreLoaded) {
                    me.injectBlankRelationshipRecord();
                    me.injectBlankContactRecords();
                    contactsPanel.setLoading(false);
                    Ext.resumeLayouts(true);
                }
            };

            contactsPanel.setLoading('Loading contacts&hellip;');
            Ext.suspendLayouts();

            // load contact point templates only if needed
            if (!contactPointTemplatesStoreLoaded) {
                contactPointTemplatesStore.load({
                    callback: function() {
                        contactPointTemplatesStoreLoaded = true;
                        onStoresLoaded();
                    }
                });
            }

            // load relationship templates only if needed
            if (!relationshipTemplatesStoreLoaded) {
                relationshipTemplatesStore.load({
                    callback: function() {
                        relationshipTemplatesStoreLoaded = true;
                        onStoresLoaded();
                    }
                });
            }

            // load contacts
            contactsStore.getProxy().setExtraParam('person', person.getId());
            contactsStore.load({
                callback: function() {
                    contactsStoreLoaded = true;
                    onStoresLoaded();
                }
            });

            // load relationships
            relationshipsStore.getProxy().setExtraParam('person', person.getId());
            relationshipsStore.load({
                callback: function() {
                    relationshipsStoreLoaded = true;
                    onStoresLoaded();
                }
            });

        }, 1);
    },

    onBeforeRelationshipsGridEdit: function(editingPlugin, context) {
        var record = context.record,
            fieldName = context.field,
            activeEditor = editingPlugin.activeEditor,
            loadedPersonId, comboStore, val;

        if (record.phantom) {
            if (fieldName === 'RelatedPerson') {
                loadedPersonId = this.getContactsPanel().getLoadedPerson().getId();
                comboStore = context.column.getEditor(record).getStore();
                comboStore.clearFilter(true);
                comboStore.addFilter(function(comboRecord) {
                    var id = comboRecord.getId();

                    val = id !== loadedPersonId && context.store.findBy(function(existingRecord) {
                        return !existingRecord.phantom && existingRecord.get('RelatedPersonID') === id;
                    } === -1);
                });
            } else {
                val = !Ext.isEmpty(activeEditor && activeEditor.editorId === 'person' ? activeEditor.getValue() : record.get('RelatedPerson'));
            }
        } else {
            val = fieldName !== 'RelatedPerson';
        }

        return val;
    },

    onRelationshipsGridEdit: function(editingPlugin, context) {
        var me = this,
            value = context.value,
            originalValue = context.originalValue,
            fieldName = context.field,
            editedRecord = context.record,
            gridView = context.view,
            editor = context.column.getEditor(editedRecord),
            columnManager = context.grid.getColumnManager(),
            templateRecord, oldTemplateRecord, currentInverse, templateInverse, loadedPersonGender, phantomPerson;

        gridView.clearInvalid(editedRecord);

        if (fieldName === 'RelatedPerson') {
            if (Ext.isString(value)) {
                value = value.split(/\s+/);

                if (value.length < 2) {
                    editedRecord.set('RelatedPerson', {
                        LastName: value[0]
                    });
                    gridView.markCellInvalid(editedRecord, 'person', 'At least a first and last name must be provided to add a new person');
                } else {
                    editedRecord.set('RelatedPerson', {
                        LastName: value.pop(),
                        MiddleName: value.length === 1 ? null : value.pop(),
                        FirstName: value.join(' ')
                    });
                }
            } else if (Ext.isNumber(value)) {
                editedRecord.set({
                    RelatedPersonID: value,
                    RelatedPerson: editor.findRecordByValue(value).getData()
                });
            }

            if (!editedRecord.get('Label')) {
                // auto advance to relationship column if the editor isn't already active after a short delay
                // this delay is necessary in case this completeEdit was already spawned by a startEdit on another field that's not finished yet
                Ext.defer(function() {
                    if (!editingPlugin.editing) {
                        editingPlugin.startEdit(editedRecord, columnManager.getHeaderById('relationship'));
                    }
                }, 50);
                return;
            }
        } else if (fieldName === 'Label') {
            templateRecord = editor.findRecordByValue(value);
            loadedPersonGender = me.getContactsPanel().getLoadedPerson().get('Gender');
            currentInverse = editedRecord.get('InverseRelationship');

            // apply template defaults for relationship and related person if this is a new record
            if (editedRecord.phantom && templateRecord) {
                if (templateRecord.get('Relationship')) {
                    editedRecord.set(templateRecord.get('Relationship'));
                }

                phantomPerson = editedRecord.get('RelatedPerson');
                if (phantomPerson && !phantomPerson.ID && templateRecord.get('Person')) {
                    Ext.applyIf(phantomPerson, templateRecord.get('Person'));
                }
            }

            // auto-set inverse for new or changes between stock values, or advance editor to inverse field
            if (
                templateRecord
                && (!currentInverse
                    || !currentInverse.Label
                    || (oldTemplateRecord = editor.findRecordByValue(originalValue))
                    && oldTemplateRecord.getInverseLabel(loadedPersonGender) === currentInverse.Label)
                && (templateInverse = templateRecord.getInverseLabel(loadedPersonGender))
            ) {
                editedRecord.set('InverseRelationship', {
                    Label: templateInverse
                });
            } else {
                // auto advance to inverse column if the editor isn't already active after a short delay
                // this delay is necessary in case this completeEdit was already spawned by a startEdit on another field that's not finished yet
                Ext.defer(function() {
                    if (!editingPlugin.editing) {
                        editingPlugin.startEdit(editedRecord, columnManager.getHeaderById('inverse'));
                    }
                }, 50);
                return;
            }
        } else if (fieldName === 'InverseRelationship.Label' && value !== originalValue) {
            if (value) {
                editedRecord.set('InverseRelationship', {
                    Label: value
                });
            } else {
                gridView.markCellInvalid(editedRecord, 'inverse', 'Enter an inverse label for this relationship');
            }
        }

        if (editedRecord.dirty && editedRecord.isValid()) {
            editedRecord.save({
                callback: function() {
                    // ensure there is a blank row for creating another record
                    me.injectBlankRelationshipRecord();
                }
            });
        }
    },

    onRelationshipsGridDeleteClick: function(grid, record) {
        var relatedPerson = record.get('RelatedPerson');

        if (record.phantom) {
            if (record.dirty) {
                record.reject();
            }

            return;
        }

        Ext.Msg.confirm('Delete relationship', Ext.String.format('Are you sure you want to delete the relationship with {0} {1}?', relatedPerson.FirstName, relatedPerson.LastName), function(btn) {
            if (btn === 'yes') {
                record.destroy();
            }
        });
    },

    onRelationshipsGridGuardianClick: function(grid, record) {
        if (record.phantom) {
            return;
        }

        grid.setLoading('Toggling guardian status&hellip;');
        record.set('Class', record.get('Class') === 'Emergence\\People\\Relationship' ? 'Emergence\\People\\GuardianRelationship' : 'Emergence\\People\\Relationship');
        record.save({
            callback: function() {
                grid.setLoading(false);
            }
        });
    },

    onBeforeContactsGridEdit: function(editingPlugin, context) {
        var me = this,
            masterLabelStore = me.getPeopleContactPointTemplatesStore(),
            cm = context.grid.getColumnManager(),
            fieldName = context.field,
            record = context.record,
            editor = context.column.getEditor(record),
            labelEditor, valueEditor, labelStore, templateRecord, valueField, placeholder;

        // get both components
        if (fieldName === 'Label') {
            labelEditor = editor;
            valueEditor = cm.getHeaderById('value').getEditor(record);
        } else if (fieldName === 'String') {
            if (record.phantom && !record.get('Label')) {
                return false;
            }

            labelEditor = cm.getHeaderById('label').getEditor(record);
            valueEditor = editor;
        }

        // populate templates store for label combo
        labelStore = labelEditor.getStore();

        if (!labelStore.isLoaded()) {
            labelStore.loadRecords(masterLabelStore.getRange());
        }

        labelStore.clearFilter(true);
        labelStore.filter('class', record.get('Class'));

        // configure value editor
        valueField = valueEditor.field;

        templateRecord = labelEditor.findRecordByValue(record.get('Label')) || labelStore.getAt(0);
        placeholder = templateRecord && templateRecord.get('placeholder') || '';
        valueField.emptyText = placeholder;
        valueField.applyEmptyText();

        return true;
    },

    onContactsGridEdit: function(editingPlugin, context) {
        var me = this,
            editedRecord = context.record,
            gridView = context.view;

        if (context.field === 'Label' && !editedRecord.get('String')) {
            // auto advance to value column if the editor isn't already active after a short delay
            // this delay is necessary in case this completeEdit was already spawned by a startEdit on another field that's not finished yet
            Ext.defer(function() {
                if (!editingPlugin.editing) {
                    editingPlugin.startEdit(editedRecord, context.grid.getColumnManager().getHeaderById('value'));
                }
            }, 50);
            return;
        }

        if (editedRecord.dirty && editedRecord.isValid()) {
            gridView.clearInvalid(editedRecord, 'value');

            editedRecord.save({
                callback: function() {
                    // render any server-side validation errors
                    Ext.Array.each(editedRecord.getProxy().getReader().rawData.failed || [], function(result) {
                        gridView.markCellInvalid(editedRecord, 'value', result.validationErrors);
                    });

                    // ensure each class has a phantom row
                    me.injectBlankContactRecords();
                }
            });
        }
    },

    onContactsGridDeleteClick: function(grid, record) {
        if (record.phantom) {
            if (record.dirty) {
                record.reject();
            }

            return;
        }

        Ext.Msg.confirm('Delete contact point', Ext.String.format('Are you sure you want to delete the contact point labeled "{0}"?', record.get('Label')), function(btn) {
            if (btn === 'yes') {
                record.erase();
            }
        });
    },

    onContactsGridPrimaryClick: function(grid, record) {
        var me = this,
            loadedPerson = me.getContactsPanel().getLoadedPerson(),
            primaryFieldName, originalValue, newValue, originalRecord;

        switch (record.get('Class')) {
            case 'Emergence\\People\\ContactPoint\\Email':
                primaryFieldName = 'PrimaryEmailID';
                break;
            case 'Emergence\\People\\ContactPoint\\Phone':
                primaryFieldName = 'PrimaryPhoneID';
                break;
            case 'Emergence\\People\\ContactPoint\\Postal':
                primaryFieldName = 'PrimaryPostalID';
                break;
            default:
                return false;
        }

        originalValue = loadedPerson.get(primaryFieldName);
        newValue = record.getId();

        if (newValue === originalValue) {
            return false;
        }

        grid.setLoading('Changing primary contact point&hellip;');
        Ext.suspendLayouts();
        loadedPerson.set(primaryFieldName, newValue);
        loadedPerson.save({
            callback: function(records, operation, success) {
                if (success) {
                    originalRecord = grid.getStore().getById(originalValue);
                    if (originalRecord) {
                        originalRecord.set('Primary', false);
                    }

                    record.set('Primary', true);
                }

                grid.setLoading(false);
                Ext.resumeLayouts(true);
            }
        });

        return true;
    },


    // controller methods
    injectBlankContactRecords: function() {
        var me = this,
            loadedPerson = me.getContactsPanel().getLoadedPerson(),
            pointsStore = me.getContactsGrid().getStore(),
            templatesStore = me.getPeopleContactPointTemplatesStore(),
            pointClasses = templatesStore.collect('class'),
            pointClassesLen = pointClasses.length, i = 0, pointClass, phantomIndex,
            findFunc = function(record) {
                return record.phantom && record.get('Class') === pointClass;
            };

        Ext.suspendLayouts();

        for (; i < pointClassesLen; i++) {
            pointClass = pointClasses[i];
            phantomIndex = pointsStore.findBy(findFunc);

            if (phantomIndex === -1) {
                pointsStore.add({
                    Class: pointClass,
                    PersonID: loadedPerson.getId()
                });
            }
        }

        Ext.resumeLayouts(true);
    },

    injectBlankRelationshipRecord: function() {
        var me = this,
            loadedPerson = me.getContactsPanel().getLoadedPerson(),
            relationshipsStore = me.getRelationshipsGrid().getStore(),
            phantomIndex = relationshipsStore.findBy(function(record) {
                return record.phantom;
            });

        if (phantomIndex === -1) {
            relationshipsStore.add({
                PersonID: loadedPerson.getId()
            });
        }
    }
});
