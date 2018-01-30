# ![Virtua SA logo](https://www.virtua.ch/favicon.png) VPX - Virtua Parse eXtender

*Virtua Parse eXtender* or *VPX* is a free and open source extension for [Parse](https://github.com/parse-community/parse-server) providing, for now:

* A customisable log for all operations done on Parse entities (create, update and **delete**) ;
* A possibility to run a custom [cloud code](http://docs.parseplatform.org/cloudcode/guide/#getting-started) from Parse API or Parse Dashboard ;
* *VPX* allow users to reload its configuration through Parse API and [Parse Dashboard](https://github.com/parse-community/parse-dashboard).

## Installation

1. Copy file `cloud/virtua-parse-extended.js` to your `Parse Cloud` folder (default is `./cloud`)
2. Add following lines to your `./cloud/main.js` file:
   ```js
   const vpx = require('./virtua-parse-extended');
   vpx.init();
   ```
3. Restart your Parse server.

## Configuration

*VPX* can be configuration through configuration parameters available with Parse.
These parameters can be created with Parse Dashboard in `Config > Create a parameter`.

| Parameter             | Type     | Default value                       | Description
| :-------------------- | :------- | :---------------------------------- | :-------------------------------------------
| `VpxCustomCloudCode`  | `String` | `null`                              | Your custom cloud code to run on Parse server
| `VpxLoggedOperations` | `Array`  | `["created", "updated", "deleted"]` | Operation types allowed to be logged

## Jobs

*VPX* exposes jobs that can be executed through Parse API and Parse Dashboard:

* `vpx-reload`: Reloads *VPX* configuration, can be called when new Parse classes have been added to monitor them.
* `vpx-exec-ccc`: Executes the custom cloud code.

## Licence terms

*VPX - Virtua Parse eXtended* is published under the terms of [GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.html), see the [LICENSE](LICENSE) file.