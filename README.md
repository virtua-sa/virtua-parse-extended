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

## Usage

*VPX* will monitor every modification made on user Parse entities and log them in the class `VpxEntityOperationLog`:

| Field         | Type     | Description
| :------------ | :------- | :------------------------------------------------------------
| `createdAt`   | `Date`   | Date of the event
| `operation`   | `String` | Operation executed, can be: `created`, `updated` or `deleted`
| `targetClass` | `String` | Class name of the entity modified
| `targetId`    | `String` | Parse ID of the entity modified

Note: by default, *VPX* will monitor *create*, *update* and *delete* operations. If a new class is added, *VPX* configuration must be reloaded with job `vpx-reload` or by restarting the Parse server in aim to monitor the added classes.

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

## Test it locally

You can use the `docker-compose` provided to run locally *VPX*, Parse Server and Parse Dashboard:

1. Clone or download this repository: `git clone https://github.com/virtua-sa/virtua-parse-extended.git`
2. Run docker-compose: `cd virtua-parse-extended`, then `docker-compose up`
3. Browse to: http://dashboard.vpx.docker/
   * Login and password can be found in the `docker-compose.yml` file, under section `parse-dashboard > environment > PARSE_DASHBOARD_USER_*`

Note: you'll need [`dnsdock`](https://github.com/aacebedo/dnsdock) in aim to use this setup.

## License terms

*VPX - Virtua Parse eXtended* is published under the terms of [GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.html), see the [LICENSE](LICENSE) file.