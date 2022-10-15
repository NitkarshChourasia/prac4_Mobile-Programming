/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
    document.getElementById("btnInfo").addEventListener("click", NetFun);
    document.addEventListener("offline", offFun, false);
    document.addEventListener("online", onFun, false);
};

function NetFun(){
var networkState = navigator.connection.type;
   var states = {};
   states[Connection.UNKNOWN] = 'Unknown connection';
   states[Connection.ETHERNET]   = 'Ethernet connection';
   states[Connection.WIFI]       = 'WiFi connection';
   states[Connection.CELL_2G]   = 'Cell 2G connection';
   states[Connection.CELL_3G]   = 'Cell 3G connection';
   states[Connection.CELL_4G]   = 'Cell 4G connection';
   states[Connection.NONE]      = 'No network connection';
   
alert('Connection type: ' + states[networkState]);

    };

function offFun(){   
    alert('You are now offline!');
};

function onFun(){       
    alert('You are now online!');     
};

