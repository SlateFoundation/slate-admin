/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true */
/* global Ext */

/**
 * @abstract
 * An abstract class for singletons that facilitates communication with backend services
 *
 * TODO:
 * - add events for all lifecycle events: beforerequest, request, beforexception, exception, unauthorized
 */
Ext.define('Jarvus.util.AbstractAPI', {
    extend: 'Ext.data.Connection',
    requires: [
        'Ext.Array'
    ],

    config: {
        /**
         * @cfg {String/null}
         * A hostname to prefix URLs with, or null to leave paths domain-relative
         */
        hostname: null,

        /**
         * @cfg {Boolean}
         * True to use HTTPS when prefixing hostname. Only used if {@link #cfg-hostname} is set
         */
        useSSL: null,

        /**
         * @cfg {Boolean}
         * Default value of withCredentials option to use with all XHR calls
         */
        withCredentials: true
    },

    /**
     * @protected
     * @template
     */
    buildUrl: function(path, options) {
        var me = this,
            hostname = me.getHostname(),
            useSSL = me.getUseSSL();

        if (useSSL === null) {
            useSSL = location.protocol == 'https:';
        }

        return hostname ? (useSSL ? 'https://' : 'http://') + hostname + path : path;
    },

    /**
     * @protected
     * @template
     */
    buildHeaders: function(headers, options) {
        return headers;
    },

    /**
     * @protected
     * @template
     */
    buildParams: function(params, options) {
        return params || null;
    },

    /**
     * Override {@link Ext.data.Connection#method-request} to implement auto-decoding and retry handler
     * @inheritdoc
     */
    request: function(options) {
        var me = this;

        return this.callParent([Ext.applyIf({
            url: options.url ? me.buildUrl(options.url, options) : null,
            headers: me.buildHeaders(options.headers || {}, options),
            params: me.buildParams(options.params || {}, options),
            success: function(response) {

                if (options.autoDecode !== false && response.getResponseHeader('Content-Type') == 'application/json') {
                    response.data = Ext.decode(response.responseText, true);

                    me.fireEvent('responsedecoded', response.data || {}, true, response);
                }

                //Calling the callback function sending the decoded data
                Ext.callback(options.success, options.scope, [response]);

            },
            failure: function(response) {

                if (options.autoDecode !== false && response.status > 0 && response.getResponseHeader('Content-Type') == 'application/json') {
                    response.data = Ext.decode(response.responseText, true);

                    me.fireEvent('responsedecoded', response.data || {}, false, response);
                }

                if (response.aborted) {
                    Ext.callback(options.abort, options.scope, [response]);
                    return;
                }

                if (options.failure && options.failureStatusCodes && Ext.Array.contains(options.failureStatusCodes, response.status)) {
                    Ext.callback(options.failure, options.scope, [response]);
                } else if (options.exception) {
                    Ext.callback(options.exception, options.scope, [response]);
                } else {
                    Ext.Msg.confirm('An error occurred', 'There was an error trying to reach the server. Do you want to try again?', function(btnId) {
                        if (btnId === 'yes') {
                            me.request(options);
                        }
                    });
                }

            },
            scope: options.scope
        }, options)]);
    }
});