/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true */
/* global Ext */

/**
 * @abstract
 * An abstract class for singletons that facilitates communication with backend services
 *
 * TODO:
 * - figure out how to suppress callback when retry is happening
 * - document fired events
 */
Ext.define('Jarvus.util.AbstractAPI', {
    extend: 'Ext.data.Connection',
    requires: [
        'Ext.Array'
    ],

    config: {
        /**
         * @cfg {String/null}
         * A host to prefix URLs with, or null to leave paths domain-relative
         */
        host: null,

        /**
         * @cfg {Boolean}
         * True to use HTTPS when prefixing host. Only used if {@link #cfg-host} is set
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
            host = me.getHost(),
            useSSL = me.getUseSSL();

        if (useSSL === null) {
            useSSL = location.protocol == 'https:';
        }

        return host ? (useSSL ? 'https://' : 'http://') + host + path : path;
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
        var me = this,
            request;

        return request = this.callParent([Ext.applyIf({
            originalOptions: options,
            url: options.url ? me.buildUrl(options.url, options) : null,
            headers: me.buildHeaders(options.headers || {}, options),
            params: me.buildParams(options.params || {}, options),
            success: function(response, ajaxOptions) {

                if (options.autoDecode !== false && response.getResponseHeader('Content-Type') == 'application/json') {
                    response.data = Ext.decode(response.responseText, true);

                    me.fireEvent('responsedecode', me, response.data || {}, true, response, request, ajaxOptions);
                }

                if (false !== me.fireEvent('beforesuccess', me, response, request, ajaxOptions)) {
                    Ext.callback(options.success, options.scope, [response, ajaxOptions, request]);
                }
            },
            failure: function(response, ajaxOptions) {

                if (options.autoDecode !== false && response.status > 0 && response.getResponseHeader('Content-Type') == 'application/json') {
                    response.data = Ext.decode(response.responseText, true);

                    me.fireEvent('responsedecode', me, response.data || {}, false, response, request, ajaxOptions);
                }
debugger;
                if (false !== me.fireEvent('beforefailure', me, response, request, ajaxOptions)) {
                    Ext.callback(options.failure, options.scope, [response, ajaxOptions, request]);
                }
            },
            callback: function(ajaxOptions, success, response) {
                debugger;
                var ret = me.fireEvent('beforecallback', me, success, response, request, ajaxOptions);
                debugger;
                if (false !== ret) {
                    Ext.callback(options.callback, options.scope, [ajaxOptions, success, response, request]);
                }
            },
            scope: options.scope
        }, options)]);
    }
});