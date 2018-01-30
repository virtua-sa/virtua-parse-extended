/*
 * VPX - Virtua Parse eXtended
 * Copyright (c) Virtua SA, 2018. www.virtua.ch
 */ 

//'use strict';
//var Parse = require('parse/node');

function VirtuaParseExtended() {
    /**
     * Custom script that can be evaluated.
     * @private
     * @property
     * @type string
     */
    var customCloudCode = null;

    /**
     * Operation types logged by VPX.
     * @type string[]
     */
    var loggedOperationTypes = ['created', 'updated', 'deleted'];

    /**
     * Operation on these entities will be logged by VPX.
     * @type string[]
     */
    var loggedOperationEntities = [];

    /**
     * Initialize VPX.
     * @returns void
     */
    this.init = function() {
        console.info('[VPX] Initializing ...');
        // Create the VpxEntityOperationLog collection if needed
        var schema = new Parse.Schema('VpxEntityOperationLog');
        schema.get().catch(function(error) {
            const schema = new Parse.Schema('VpxEntityOperationLog');
            schema.addString('targetClass')
                  .addString('targetId')
                  .addString('operation');
            schema.save();
            console.info('[VPX] VpxEntityOperationLog schema created.');
        });
        // Register jobs
        Parse.Cloud.job('vpx-reload', reloadJob);
        Parse.Cloud.job('vpx-exec-ccc', execCustomCloudCodeJob);
        // Load initial configuration
        load();
        console.info('[VPX] Started !');
    }

    /**
     * Handler for Parse trigger afterDelete.
     * @argument Parse.Cloud.TriggerRequest request
     * @returns Parse.Cloud.TriggerResponse
     */
    afterDeleteTrigger = function(request) {
        return this.logEntityOperation(request.object.className, 'deleted', request.object.id);
    }

    /**
     * Handler for Parse trigger afterDelete.
     * @argument Parse.Cloud.TriggerRequest request
     * @returns Parse.Cloud.TriggerResponse
     */
    afterSaveTrigger = function(request) {
        return this.logEntityOperation(
            request.object.className,
            request.object.createdAt == request.object.updatedAt ? 'created' : 'updated',
            request.object.id);
    }

    /**
     * Log operations on monitored entities.
     * @argument string className
     * @argument string operation
     * @argument string entityId
     * @returns Parse.Cloud.TriggerResponse
     */
    logEntityOperation = function(className, operation, entityId) {
        console.info('[VPX] Call: logEntityOperation(' + className + ', ' + operation + ', ' + entityId + ')');
        // Do not log Parse Core entities, the log itself or non allowed operation types
        if (className.startsWith('_') || className == 'VpxEntityOperationLog' || !loggedOperationTypes.includes(operation)) {
            return;
        }
        var log = new Parse.Object('VpxEntityOperationLog');
        // Save the log
        log.save({
            targetClass: className,
            targetId: entityId,
            operation: operation
        }, {
            error: function(logfailled, error) {
                console.error('[VPX] Error saving entity operation log: className=' + className
                + ', operation=' + operation + ', entityId=' + entityId
                + '(' +  error.code + ': ' + error.message + ')');
            }
        });
    }

    /**
     * Loads configuration of Virtua Parse eXtended.
     * @returns void
     */
    load = function() {
        console.log('[VPX] Already monitored entities: ' + loggedOperationEntities);
        // Register the triggers for every entities managed by Parse
        Parse.Schema.all().then(function(result) {
            result.forEach(function(entity) {
                var className = entity.className;
                // Skip Parse Core entities, the log itself and already monitored entities
                if (!(className.startsWith('_') || className == 'VpxEntityOperationLog' || loggedOperationEntities.includes(className))) {
                    console.info('[VPX] Processing : ' + className + ' ...');
                    Parse.Cloud.afterSave(className, afterSaveTrigger);
                    Parse.Cloud.afterDelete(className, afterDeleteTrigger);
                    loggedOperationEntities.push(className);
                    console.info('[VPX] Registred entity for operation logging: ' + className);
                }
            });
            console.log('[VPX] Monitored entities: ' + loggedOperationEntities);
        });
        // Load configuration
        Parse.Config.get().then(function(config) {
            customCloudCode = config.get('VpxCustomCloudCode') || customCloudCode;
            loggedOperationTypes = config.get('VpxLoggedOperations') || loggedOperationTypes;
            console.info('[VPX] VpxCustomCloudCode: ' + customCloudCode);
            console.info('[VPX] VpxLoggedOperations: ' + loggedOperationTypes);
        });
    }

    /**
     * Handler for Parse job 'vpx-reload'.
     */
    reloadJob = function(request, status) {
        // Reload VPX configuration
        console.info('[VPX] Reloading configuration (job) ...');
        load();
        console.info('[VPX] Configuration reloaded !');
        status.success('Reloaded');
    }

    /**
     * Handler for Parse job 'vpx-exec-ccc'.
     */
    execCustomCloudCodeJob = function(request, status) {
        // Execute custom cloud code
        console.info('[VPX] Executing custom cloud code (job) ...');
        console.info('[VPX] VpxCustomCloudCode: ' + customCloudCode);
        eval(customCloudCode);
        console.info('[VPX] Custom cloud code executed !');
        status.success('Executed');
    }
};

module.exports = new VirtuaParseExtended();