/*
 *  VPX - Virtua Parse eXtended
 *  
 *  Copyright (C) 2018, Virtua SA, 2018. www.virtua.ch
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */ 

//'use strict';
//var Parse = require('parse/node');

function VirtuaParseExtended() {
    /**
     * Operation on these entities are logged by VPX.
     * @type string[]
     */
    var currentLoggedOperationEntities = [];

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
     * An empty array means no entities will be monitored,
     * a null value means all entities will be monitored.
     * @type string[]
     */
    var loggedOperationEntities = null;

    /**
     * Initialize VPX.
     * @returns void
     */
    this.init = function() {
        console.info('[VPX] Initializing ...');
        // Create the VpxEntityOperationLog collection if needed
        if (typeof Parse.Schema === "function") {
            var schema = new Parse.Schema('VpxEntityOperationLog');
            schema.get().catch(function(error) {
                const schema = new Parse.Schema('VpxEntityOperationLog');
                schema.addString('targetClass')
                    .addString('targetId')
                    .addString('operation');
                schema.save();
                console.info('[VPX] VpxEntityOperationLog schema created.');
            });
        } else {
            console.warn('[VPX] VpxEntityOperationLog schema cannot be created, please upgrade to parse-server@2.7.2 !');
        }
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
     * Register triggers on user Parse entities.
     * @argument object entity
     */
    monitorEntityOperation = function(className) {
        // Skip Parse Core entities, the log itself and already monitored entities
        if (!(className.startsWith('_') || className == 'VpxEntityOperationLog' || currentLoggedOperationEntities.includes(className))) {
            console.info('[VPX] Processing : ' + className + ' ...');
            Parse.Cloud.afterSave(className, afterSaveTrigger);
            Parse.Cloud.afterDelete(className, afterDeleteTrigger);
            currentLoggedOperationEntities.push(className);
            console.info('[VPX] Registred entity for operation logging: ' + className);
        }
    }

    /**
     * Loads configuration of Virtua Parse eXtended.
     * @returns void
     */
    load = function() {
        // Load configuration
        Parse.Config.get().then(function(config) {
            customCloudCode = config.get('VpxCustomCloudCode') || customCloudCode;
            loggedOperationEntities = config.get('VpxLoggedEntities') || loggedOperationEntities;
            loggedOperationTypes = config.get('VpxLoggedOperations') || loggedOperationTypes;
            console.info('[VPX] VpxCustomCloudCode: ' + customCloudCode);
            console.info('[VPX] VpxLoggedEntities: ' + loggedOperationEntities);
            console.info('[VPX] VpxLoggedOperations: ' + loggedOperationTypes);
            console.info('[VPX] Already monitored entities: ' + currentLoggedOperationEntities);
            // Register the triggers for every entities managed by Parse
            if (loggedOperationEntities === null && typeof Parse.Schema === "function") {
                console.info('[VPX] Discovering new entities to monitor ...');
                Parse.Schema.all().then(function(result) {
                    result.map(x => x.className).forEach(monitorEntityOperation);
                    console.info('[VPX] Monitored entities: ' + currentLoggedOperationEntities);
                });
            } else {
                console.info('[VPX] Using value of VpxLoggedEntities to register new entities to monitor ...');
                loggedOperationEntities.forEach(monitorEntityOperation);
                console.info('[VPX] Monitored entities: ' + currentLoggedOperationEntities);
            }
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
        try {
            eval(customCloudCode);
            console.info('[VPX] Custom cloud code executed !');
            status.success('Executed');
        } catch (e) {
            console.error('[VPX] Error while executing custom cloud code: ' + e);
            status.error('Error: ' + e);
        }
    }
};

module.exports = new VirtuaParseExtended();