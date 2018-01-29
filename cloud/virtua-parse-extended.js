/*
 * VPX - Virtua Parse eXtended
 * Copyright (c) Virtua SA, 2018. www.virtua.ch
 */ 

//'use strict';
//var Parse = require('parse/node');

function VPX() {
    /**
     * Custom script that can be evaluated.
     * @private
     * @property
     * @type string
     */

    var _customCloudCode = null;
    /**
     * Operation types logged by VPX.
     * @private
     * @property
     * @type string[]
     */
    var _loggedOperationTypes = ['created', 'updated', 'deleted'];

    /**
     * Operation on these entities will be logged by VPX.
     * @private
     * @property
     * @type string[]
     */
    var _loggedOperationEntities = [];

    /**
     * Initialize VPX.
     * @public
     * @function
     */
    this.init = function() {
        console.info('[VPX] Initializing ...');
        // Create the VpxEntityOperationLog collection if needed
        var schema = new Parse.Schema('VpxEntityOperationLog');
        schema.get().catch(function(error) {
            const schema = new Parse.Schema('VpxEntityOperationLog');
            schema.addString('className')
                  .addString('operation')
                  .addString('entityId');
            schema.save();
            console.info('[VPX] VpxEntityOperationLog schema created.');
        });
        // Register jobs
        Parse.Cloud.job("vpx-reload", _reload);
        // Load initial configuration
        _load();
        console.info('[VPX] Started !');
    }

    _afterDeleteTrigger = function(request) {
        return this._logEntityOperation(request.object.className, 'deleted', request.object.id);
    }

    _afterSaveTrigger = function(request) {
        return this._logEntityOperation(
            request.object.className, request.object.isNew() ? 'created' : 'updated', request.object.id);
    }

    _logEntityOperation = function(className, operation, entityId) {
        // Do not log Parse Core entities, the log itself or non allowed operation types
        if (className.startsWith('_') || className == 'VpxEntityOperationLog' || ! operation in _loggedOperationTypes) {
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
                console.error('[VPX] Error saving entity operation log: className=' + className
                + ', operation=' + operation + ', entityId=' + entityId
                + '(' +  error.code + ': ' + error.message + ')');
            }
        });
    }

    _load = function() {
        // Register the triggers for every entities managed by Parse
        Parse.Schema.all().then(function(result) {
            result.forEach(function(entity) {
                var className = entity.className;
                console.info('[VPX] Processing : ' + className + ' ...');
                // Skip Parse Core entities and the log itself
                if (!(className.startsWith('_') || className == 'VpxEntityOperationLog' || className in _loggedOperationEntities)) {
                    Parse.Cloud.afterSave(className, _afterSaveTrigger);
                    Parse.Cloud.afterDelete(className, _afterDeleteTrigger);
                    _loggedOperationEntities.add(className);
                    console.info('[VPX] Registred entity for operation logging: ' + className);
                }
            });
        });
        // Load configuration
        Parse.Config.get().then(function(config){
            _customCloudCode = config.get('VpxCustomCloudCode') || null;
            _loggedOperationTypes = config.get('VpxLoggedOperations') || ['created', 'updated', 'deleted'];
            console.info('[VPX] VpxCustomCloudCode: ' + _customCloudCode);
            console.info('[VPX] VpxLoggedOperations: ' + _loggedOperationTypes);
        });
    }
    
    _reload = function(request, status) {
        // Reload VPX configuration
        console.info('[VPX] Reloading configuration ...');
        _load();
        console.info('[VPX] Configuration reloaded !');
        status.success("Reloaded");
    }
};

module.exports = new VPX();