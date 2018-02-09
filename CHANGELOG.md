# ![Virtua SA logo](https://www.virtua.ch/favicon.png) VPX - Virtua Parse eXtender :: Changelog

## 1.0.1

* Add `VpxLoggedEntities` configuration to force *VPX* to monitor only given entities
* *VPX* is now able to run Parse Server intances older than 2.7.2

## 1.0.0 - First public release

*VPX* supports for now : 

* Entity operation logging (`created`, `updated`, `deleted`) in `VpxOperationEntityLog`
* Custom cloud code execution (stored in `VpxCustomCloudCode`, called with `vpx-exec-ccc`)