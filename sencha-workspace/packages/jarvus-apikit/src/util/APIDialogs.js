/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true */
/* global Ext, Jarvus */

/**
 * Monitors a connection for failures and displays a retry UI
 * TODO: our event handlers don't seem to be able to return false, maybe a limitation of observe?
 */
Ext.define('Jarvus.util.APIDialogs', function() {
    var retryQueue = [];

    return {
        singleton: true,
        requires: [
            'Jarvus.util.AbstractAPI',
            'Ext.window.MessageBox'
        ],

        config: {
            retryPromptEnabled: true,
            retryPromptStatusBlacklist: [400, 403, 404, 405],
            failureAlertEnabled: true,
            failureAlertStatusBlacklist: [404]
        },

        constructor: function(config) {
            this.initConfig(config);

//            // report on all connection events
//            Ext.mixin.Observable.capture(Jarvus.util.AbstractAPI.prototype, function(eventName, connection) {
//                console.info('%s->%s(%o)', connection.$className, eventName, Array.prototype.slice.call(arguments, 2));
//            });

            Ext.mixin.Observable.observe(Jarvus.util.AbstractAPI, {
                scope: this,
                beforefailure: 'onBeforeFailure',
                beforecallback: 'onBeforeCallback'
            });
        },

        onBeforeFailure: function(connection, response, request, options) {
            var me = this,
                retryPromptStatusBlacklist = options.retryPromptStatusBlacklist || me.getRetryPromptStatusBlacklist() || [],
                failureAlertStatusBlacklist = options.failureAlertStatusBlacklist || me.getFailureAlertStatusBlacklist() || [];

            if (request.aborted) {
                return true;
            }

            if (
                me.getRetryPromptEnabled() &&
                !Ext.Array.contains(retryPromptStatusBlacklist, response.status) &&
                !options.disableRetryPrompt &&
                options.originalOptions
            ) {
                retryQueue.push(request);

                Ext.Msg.confirm('An error occurred', 'There was an error trying to reach the server. Do you want to try again?', function(btnId) {
                    if (btnId === 'yes') {
                        while (retryQueue.length) {
                            connection.request(retryQueue.shift().options.originalOptions);
                        }
                    } else {
                        retryQueue = [];
                    }
                });

                return false; // return false to suppress failure handler
            }

            if (
                me.getFailureAlertEnabled() &&
                !Ext.Array.contains(failureAlertStatusBlacklist, response.status) &&
                !options.disableFailureAlert &&
                retryQueue.length == 0
            ) {
                Ext.Msg.alert('An error occurred', 'There was an error trying to reach the server. Please save your work and try again later.');

                return true;
            }
        },

        onBeforeCallback: function(connection, success, response, request, options) {
            debugger;
            // beforefailure runs before beforecallback, so abort callback if beforefailure put request in queue
            var ret = !Ext.Array.contains(retryQueue, request);
            debugger;
            return ret;
        }
    };
});