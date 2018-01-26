/*
 * VPX - Virtua Parse eXtended
 * Copyright (c) Virtua SA, 2018. www.virtua.ch
 */ 

'use strict';

var Parse = require('parse/node');

var VPX = {
    // Private Variables
    /**
     * Custom script that can be evaluated.
     * @private
     * @property
     * @type string
     */
    _customCloudCode: null,
    /**
     * Operation types logged by VPX.
     * @private
     * @property
     * @type string[]
     */
    _loggedOperationTypes: ['created', 'updated', 'deleted'],
    /**
     * Operation on these entities will be logged by VPX.
     * @private
     * @property
     * @type string[]
     */
    _loggedOperationEntities: [],
    // Public Functions
    /**
     * Initialize VPX.
     * @public
     * @function
     */
    init: function() {
        console.info('VPX is initializing ...');
        // Create the VpxEntityOperationLog collection if needed
        Parse.Schema.get('VpxEntityOperationLog').catch(function(error) {
            const schema = new Parse.Schema('VpxEntityOperationLog');
            schema.addString('className')
                  .addString('operation')
                  .addString('entityId');
            schema.save();
        });
        // Register jobs
        Parse.Cloud.job("vpx-reload", this._reload);
        // Load initial configuration
        this._load();
        console.info('VPX started !');
    },
    // Private Functions
    _afterDeleteTrigger: function(request) {
        return this._logEntityOperation(request.object.className, 'deleted', request.object.id);
    },
    _afterSaveTrigger: function(request) {
        return this._logEntityOperation(
            request.object.className, request.object.isNew() ? 'created' : 'updated', request.object.id);
    },
    _logEntityOperation: function(className, operation, entityId) {
        // Do not log Parse Core entities and the log itself
        if (className.startsWith('_') || className == 'VpxEntityOperationLog') {
            return;
        }
        var log = new Parse.Object('VpxEntityOperationLog');
        // Save the log
        log.save({
            className: className,
            operation: operation,
            entityId: entityId
        }, {
            error: function(logfailled, error) {
                console.error('Error saving entity operation log: className=' + className
                + ', operation=' + operation + ', entityId=' + entityId
                + '(' +  error.code + ': ' + error.message + ')');
            }
        });
    },
    _load: function() {
        // Register the triggers for every entities managed by Parse
        Parse.Schema.all().forEach(function(entity) {
            var className = entity.className;
            // Skip Parse Core entities and the log itself
            if (!(className.startsWith('_') || className == 'VpxEntityOperationLog' || this._loggedOperationEntities.contains(className))) {
                Parse.Cloud.afterSave(className, this._afterSaveTrigger);
                Parse.Cloud.afterDelete(className, this._afterDeleteTrigger);
                this._loggedOperationEntities.add(className);
            }
        });
        // Load configuration
        this._customCloudCode = Parse.Config.current.get('VpxCustomCloudCode') || null;
        this._loggedOperations = Parse.Config.current.get('VpxLoggedOperations') || ['created', 'updated', 'deleted'];
    },
    _reload: function(request, status) {
        // Reload VPX configuration
        console.info('VPX is reloading its configuration ...');
        this._load();
        console.info('VPX configuration reloaded !');
    }
};

module.exports = VPX;