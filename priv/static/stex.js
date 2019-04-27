(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.stex = factory());
}(this, function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var Socket = /** @class */ (function () {
        function Socket() {
            this.connections = [];
            this.keeper = null;
            this.requests = {};
            this.stores = {};
        }
        Socket.prototype.connect = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this.isConnected) {
                    resolve();
                }
                else {
                    _this.connections.push({ resolve: resolve, reject: reject });
                    if (_this.socket === void 0) {
                        var address = Stex.defaults.address || location.host + '/stex';
                        _this.socket = new WebSocket('ws://' + address);
                        _this.socket.binaryType = 'arraybuffer';
                        _this.socket.onopen = _this.opened.bind(_this);
                        _this.socket.onclose = _this.closed.bind(_this);
                        _this.socket.onmessage = _this.message.bind(_this);
                    }
                }
            });
        };
        Object.defineProperty(Socket.prototype, "isConnected", {
            get: function () {
                return this.socket !== void 0 && this.socket.readyState === this.socket.OPEN;
            },
            enumerable: true,
            configurable: true
        });
        Socket.prototype.send = function (data) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var request = Math.random().toString(36).substr(2, 5);
                var payload = data;
                payload.request = request;
                _this.socket.send(JSON.stringify(payload));
                _this.requests[request] = [resolve, reject];
            });
        };
        Socket.prototype.message = function (message) {
            var data = JSON.parse(message.data);
            var request = this.requests[data.request];
            if (request !== void 0) {
                var resolve = request[0], reject = request[1];
                resolve(data);
            }
            else {
                if (data.type === "mutation") {
                    var store = this.stores[data.store];
                    if (store !== void 0) {
                        store.state = data.data;
                    }
                }
            }
        };
        Socket.prototype.opened = function (event) {
            var _this = this;
            if (this.socket.readyState === this.socket.OPEN) {
                while (this.connections.length > 0) {
                    var _a = this.connections.shift(), resolve = _a.resolve, _ = _a._;
                    resolve();
                }
                this.keeper = setInterval(function () {
                    _this.send({
                        type: 'ping'
                    });
                }, 30000);
            }
            else {
                setTimeout(this.opened.bind(this, event), 100);
            }
        };
        Socket.prototype.closed = function (event) {
            while (this.connections.length > 0) {
                var _a = this.connections.shift(), _ = _a._, reject = _a.reject;
                reject();
            }
            console.log(event);
            var code = event.code;
            var reason = event.reason;
            if (code >= 4000) {
                console.error('[stex]', reason);
            }
            else if (code === 1000) {
                this.connect();
            }
            if (this.keeper !== null) {
                clearInterval(this.keeper);
            }
        };
        return Socket;
    }());
    var socket = new Socket();
    var Stex = /** @class */ (function () {
        function Stex(config) {
            this.session = config.session || null;
            this.config = config;
            this.socket = socket;
            this.state = null;
            if (!this.config.store) {
                console.error('[stex]', 'Store is required');
                return;
            }
            this.socket.connect().then(this._connected.bind(this));
        }
        Stex.prototype._connected = function () {
            var _this = this;
            this.socket.stores[this.config.store] = this;
            this.socket.send({
                type: 'join',
                store: this.config.store,
                data: __assign({}, Stex.defaults.params, this.config.params)
            }).then(function (response) {
                _this.session = response.session;
                _this.state = response.data;
            });
        };
        Stex.prototype.commit = function (name) {
            var _this = this;
            var data = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                data[_i - 1] = arguments[_i];
            }
            return this.socket.send({
                type: 'mutation',
                store: this.config.store,
                session: this.session,
                data: {
                    name: name, data: data
                }
            }).then(function (message) {
                _this.state = message.data;
            });
        };
        Stex.defaults = {
            params: {},
        };
        return Stex;
    }());

    return Stex;

}));