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
    document.getElementById('save').addEventListener('click', getContact);
    document.getElementById('find').addEventListener('click', findContact);
    document.getElementById('delete').addEventListener('click',deleteCon);
};

function getContact(){
    var myContact = navigator.contacts.create({"displayName": "Cordova Contact"});
    var phoneNumbers = [];
    phoneNumbers[0] = new ContactField('work', '8840926059', false);
    phoneNumbers[1] = new ContactField('mobile', '7304121104', true); // preferred number
    myContact.phoneNumbers = phoneNumbers;
    myContact.save(onSuccess,onError);
};
function onSuccess(myContact) {
    alert("Save Success");
};

function onError(myContactError) {
    alert("Error = " + myContactError.code);

};

function findContact(){
var options      = new ContactFindOptions();
options.filter   = "Cordova Contact";
options.multiple = true;
options.desiredFields = [navigator.contacts.fieldType.id];
options.hasPhoneNumber = true;
var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
navigator.contacts.find(fields, onfind, onError, options);
};

function onfind(contacts) {
    alert('Found ' + contacts.length + ' contacts.');
};

function deleteCon() {
   var options = new ContactFindOptions();
   options.filter = "Cordova Contact";
   options.multiple = false;
   fields = ["displayName"];
   navigator.contacts.find(fields, contactfindSuccess, contactfindError, options);

   function contactfindSuccess(contacts) {
      var contact = contacts[0];
      contact.remove(contactRemoveSuccess, contactRemoveError);

      function contactRemoveSuccess(contact) {
         alert("Contact Deleted");
      };

      function contactRemoveError(message) {
         alert('Failed because: ' + message);
      };
   };

   function contactfindError(message) {
      alert('Failed because: ' + message);
   };
    
};


