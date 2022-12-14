/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/* jshint jasmine: true */
/* global WinJS */

exports.defineAutoTests = function() {
    var isWindowsPhone8 = cordova.platformId == 'windowsphone';
    var isWindows = (cordova.platformId === "windows") || (cordova.platformId === "windows8");
    var isWindowsPhone81 = isWindows && WinJS.Utilities.isPhone;

    // Error callback spies should not be called
    var errorCallbacks = {};
    errorCallbacks[ContactError.UNKNOWN_ERROR]              = jasmine.createSpy('unknownErrorCallback');
    errorCallbacks[ContactError.INVALID_ARGUMENT_ERROR]     = jasmine.createSpy('invalidArgumentErrorCallback');
    errorCallbacks[ContactError.TIMEOUT_ERROR]              = jasmine.createSpy('timeoutErrorCallback');
    errorCallbacks[ContactError.PENDING_OPERATION_ERROR]    = jasmine.createSpy('pendingOperationErrorCallback');
    errorCallbacks[ContactError.IO_ERROR]                   = jasmine.createSpy('ioErrorCallback');
    errorCallbacks[ContactError.NOT_SUPPORTED_ERROR]        = jasmine.createSpy('notSupportedErrorCallback');
    errorCallbacks[ContactError.OPERATION_CANCELLED_ERROR]  = jasmine.createSpy('operationCancelledErrorCallback');
    errorCallbacks[ContactError.PERMISSION_DENIED_ERROR]    = jasmine.createSpy('permissionDeniedErrorCallback');

    var isIOSPermissionBlocked = false;

    var fail = function(done) {
            expect(true).toBe(false);
            done();
        };

    var MEDIUM_TIMEOUT = 30000;
    var HIGH_TIMEOUT = 120000;

    var removeContact = function(done, contactObj) {
        if (!contactObj) {
            done();
            return;
        }

        contactObj.remove(function() {
            done();
        }, function(contactError) {
            if (contactError) {
                if (errorCallbacks[contactError.code]) {
                    errorCallbacks[contactError.code]();
                } else {
                    fail(done);
                }
            }

            for (var error in errorCallbacks) {
                expect(errorCallbacks[error]).not.toHaveBeenCalled();
            }

            done();
        });
    };

    function removeContactsByFields(fields, filter, done) {
        var obj = new ContactFindOptions();
        obj.filter = filter;
        obj.multiple = true;
        navigator.contacts.find(fields, function(contacts) {
            var removes = [];
            contacts.forEach(function(contact) {
                removes.push(contact);
            });
            if (removes.length === 0) {
                done();
                return;
            }

            var nextToRemove;
            if (removes.length > 0) {
                nextToRemove = removes.shift();
            }

            function removeNext(item) {
                if (typeof item === 'undefined') {
                    done();
                    return;
                }

                if (removes.length > 0) {
                    nextToRemove = removes.shift();
                } else {
                    nextToRemove = undefined;
                }

                item.remove(function removeSucceeded() {
                    removeNext(nextToRemove);
                }, function removeFailed() {
                    removeNext(nextToRemove);
                });
            }
            removeNext(nextToRemove);
        }, done, obj);
    }

    describe("Contacts (navigator.contacts)", function() {
        this.contactObj = null;

        it("contacts.spec.1 should exist", function() {
            expect(navigator.contacts).toBeDefined();
        });

        it("contacts.spec.2 should contain a find function", function() {
            expect(navigator.contacts.find).toBeDefined();
            expect(typeof navigator.contacts.find).toBe('function');
        });

        describe("find method", function() {
            it("contacts.spec.3 success callback should be called with an array", function(done) {
                // Find method is not supported on Windows platform
                if (isWindows && !isWindowsPhone81) {
                    pending();
                    return;
                }
                var win = function(result) {
                        expect(result).toBeDefined();
                        expect(result instanceof Array).toBe(true);
                        done();
                    },
                    obj = new ContactFindOptions();

                obj.filter = "";
                obj.multiple = true;

                function failed(err) {
                    if (err.code == ContactError.PERMISSION_DENIED_ERROR) {
                        isIOSPermissionBlocked = true;
                        done();
                    }
                }
                navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], win, failed, obj);
            }, HIGH_TIMEOUT); // give permission buster or a user a chance to accept the permission alert

            it("contacts.spec.4 success callback should be called with an array, even if partial ContactFindOptions specified", function(done) {
                // Find method is not supported on Windows platform
                if ((isWindows && !isWindowsPhone81) || isIOSPermissionBlocked) {
                    pending();
                    return;
                }
                var win = function(result) {
                        expect(result).toBeDefined();
                        expect(result instanceof Array).toBe(true);
                        done();
                    };

                navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], win, fail.bind(null, done), {
                    multiple: true
                });
            });

            it("contacts.spec.5 should throw an exception if success callback is empty", function() {
                var obj = new ContactFindOptions();
                obj.filter = "";
                obj.multiple = true;

                expect(function() {
                    navigator.contacts.find(["displayName", "name", "emails", "phoneNumbers"], null, function (err) {
                        expect(err).toBeUndefined();
                    }, obj);
                }).toThrow();
            });

            it("contacts.spec.6 error callback should be called when no fields are specified", function(done) {
                var win = fail,
                    // we don't want this to be called
                    error = function(result) {
                        expect(result).toBeDefined();
                        expect(result.code).toBe(ContactError.INVALID_ARGUMENT_ERROR);
                        done();
                    },
                    obj = new ContactFindOptions();

                obj.filter = "";
                obj.multiple = true;
                navigator.contacts.find([], win, error, obj);
            });

            describe("with newly-created contact", function() {

                afterEach(function (done) {
                    removeContact(done, this.contactObj);
                });

                it("contacts.spec.7 should be able to find a contact by name", function(done) {
                    // Find method is not supported on Windows Store apps.
                    // also this test will be skipped for Windows Phone 8.1 because function "save" not supported on WP8.1
                    if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                        pending();
                    }

                    var specContext = this;
                    specContext.contactObj = new Contact();
                    specContext.contactObj.name = new ContactName();
                    specContext.contactObj.name.familyName = "Delete";

                    var foundName = function(result) {
                        var bFound = false;
                        try {
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].name.familyName == "Delete") {
                                    bFound = true;
                                    break;
                                }
                            }
                        } catch (e) {
                            return false;
                        }
                        return bFound;
                    };

                    var test = function(savedContact) {
                        // update so contact will get removed
                        specContext.contactObj = savedContact;
                        // ----
                        // Find asserts
                        // ---
                        var findWin = function(object) {
                                expect(object instanceof Array).toBe(true);
                                expect(object.length >= 1).toBe(true);
                                expect(foundName(object)).toBe(true);
                                done();
                            },
                            findFail = fail,
                            obj = new ContactFindOptions();

                        obj.filter = "Delete";
                        obj.multiple = true;

                        navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], findWin, findFail.bind(null, done), obj);
                    };

                    specContext.contactObj.save(test, fail.bind(null, done));
                });

                it("contacts.spec.7.1 should contain displayName if specified in desiredFields", function(done) {
                    if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                        pending();
                    }
                    var testDisplayName = "testContact";
                    var specContext = this;
                    specContext.contactObj = new Contact();
                    specContext.contactObj.displayName = testDisplayName;

                    var win = function(contactResult) {
                        expect(contactResult.length > 0).toBe(true);
                        var namesDisplayed = contactResult.every(function(contact, index) {
                            return contact.displayName !== null;
                        });
                        expect(namesDisplayed).toBe(true);
                        done();
                    };

                    var onSuccessSave = function(savedContact) {
                        specContext.contactObj = savedContact;
                        var options = new ContactFindOptions();
                        options.filter = testDisplayName;
                        options.multiple = true;
                        options.desiredFields = [navigator.contacts.fieldType.displayName];
                        navigator.contacts.find(["displayName", "nickname"], win, fail.bind(null, done), options);
                    };
                    specContext.contactObj.save(onSuccessSave, fail.bind(null, done));
                });
                it("contacts.spec.7.2 should find contact despite id isn't string ", function(done) {
                    if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                        pending();
                    }
                    var testDisplayName = "testContact";
                    var specContext = this;
                    specContext.contactObj = new Contact();
                    specContext.contactObj.displayName = testDisplayName;
                    var win = function(contactResult) {
                        expect(contactResult.length > 0).toBe(true);
                        done();
                    };
                    var onSuccessSave = function(savedContact) {
                        specContext.contactObj = savedContact;
                        var options = new ContactFindOptions();
                        options.filter = savedContact.id;
                        options.multiple = true;
                        navigator.contacts.find(["id"], win, fail.bind(null, done), options);
                    };
                    specContext.contactObj.save(onSuccessSave, fail.bind(null, done));
                });

                it("contacts.spec.7.3 should contain custom label in type", function(done) {
                    if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                        pending();
                    }
                    var testDisplayName = "testContact";
                    var customLabel = "myType";
                    var testContactDetail = new ContactField(customLabel, "a", true);
                    var contactFields = ["phoneNumbers", "emails", "urls", "ims"];
                    var specContext = this;

                    specContext.contactObj = new Contact();
                    specContext.contactObj.nickname = testDisplayName;
                    specContext.contactObj.displayName = testDisplayName;
                    contactFields.forEach(function(contactField) {
                        specContext.contactObj[contactField] = [];
                        specContext.contactObj[contactField][0] = testContactDetail;
                    });
                    specContext.contactObj.addresses = [];
                    specContext.contactObj.addresses[0]  = new ContactAddress(true, customLabel, "a", "b", "c", "d", "e", "f");
                    var checkTypes = function(contact) {
                        var allFieldsWithCustomLabel = contactFields.concat(["addresses"]);
                        return allFieldsWithCustomLabel.every(function(contactField) {
                            return contact[contactField] && contact[contactField][0].type === customLabel;
                        });
                    };
                    var win = function(contactResult) {
                        expect(contactResult.length > 0).toBe(true);
                        var typesCustomized = contactResult.every(function(contact) {
                            return checkTypes(contact);
                        });
                        expect(typesCustomized).toBe(true);
                        done();
                    };
                    var onSuccessSave = function(savedContact) {
                        expect(checkTypes(savedContact)).toBe(true);
                        specContext.contactObj = savedContact;
                        var options = new ContactFindOptions();
                        options.filter = testDisplayName;
                        options.multiple = true;
                        navigator.contacts.find(["displayName", "nickname"], win, fail.bind(null, done), options);
                    };
                    specContext.contactObj.save(onSuccessSave, fail.bind(null, done));
                });

                it('spec 7.4 contact detail type should equal default label', function(done) {
                    if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                        pending();
                    }
                    var specContext = this;
                    specContext.contactObj = navigator.contacts.create({
                        "displayName": "test name",
                        "ims": [{
                            "type": "SKYPE",
                            "value": "000"
                        }]
                    });
                    specContext.contactObj.save(onSuccessSave, fail.bind(null, done));
                    function onSuccessSave(savedContact) {
                        specContext.contactObj = savedContact;
                        var imsType = savedContact.ims[0].type;
                        var expectedType = (cordova.platformId == 'android') ? "Skype" : "skype";
                        expect(imsType).toBe(expectedType);
                        done();
                    }
                });
            });
        });

        describe('create method', function() {
            it("contacts.spec.8 should exist", function() {
                expect(navigator.contacts.create).toBeDefined();
                expect(typeof navigator.contacts.create).toBe('function');
            });

            it("contacts.spec.9 should return a Contact object", function() {
                var bDay = new Date(1976, 7, 4);
                var obj = navigator.contacts.create({
                    "displayName": "test name",
                    "gender": "male",
                    "note": "my note",
                    "name": {
                        "formatted": "Mr. Test Name"
                    },
                    "emails": [{
                        "value": "here@there.com"
                    }, {
                        "value": "there@here.com"
                    }],
                    "birthday": bDay
                });

                expect(obj).toBeDefined();
                expect(obj.displayName).toBe('test name');
                expect(obj.note).toBe('my note');
                expect(obj.name.formatted).toBe('Mr. Test Name');
                expect(obj.emails.length).toBe(2);
                expect(obj.emails[0].value).toBe('here@there.com');
                expect(obj.emails[1].value).toBe('there@here.com');
                expect(obj.nickname).toBe(null);
                expect(obj.birthday).toBe(bDay);
            });
        });

        describe("Contact object", function() {
            it("contacts.spec.10 should be able to create instance", function() {
                var contact = new Contact("a", "b", new ContactName("a", "b", "c", "d", "e", "f"), "c", [], [], [], [], [], "f", "i", [], [], []);
                expect(contact).toBeDefined();
                expect(contact.id).toBe("a");
                expect(contact.displayName).toBe("b");
                expect(contact.name.formatted).toBe("a");
                expect(contact.nickname).toBe("c");
                expect(contact.phoneNumbers).toBeDefined();
                expect(contact.emails).toBeDefined();
                expect(contact.addresses).toBeDefined();
                expect(contact.ims).toBeDefined();
                expect(contact.organizations).toBeDefined();
                expect(contact.birthday).toBe("f");
                expect(contact.note).toBe("i");
                expect(contact.photos).toBeDefined();
                expect(contact.categories).toBeDefined();
                expect(contact.urls).toBeDefined();
            });

            it("contacts.spec.11 should be able to define a ContactName object", function() {
                var contactName = new ContactName("Dr. First Last Jr.", "Last", "First", "Middle", "Dr.", "Jr.");
                expect(contactName).toBeDefined();
                expect(contactName.formatted).toBe("Dr. First Last Jr.");
                expect(contactName.familyName).toBe("Last");
                expect(contactName.givenName).toBe("First");
                expect(contactName.middleName).toBe("Middle");
                expect(contactName.honorificPrefix).toBe("Dr.");
                expect(contactName.honorificSuffix).toBe("Jr.");
            });

            it("contacts.spec.12 should be able to define a ContactField object", function() {
                var contactField = new ContactField("home", "8005551212", true);
                expect(contactField).toBeDefined();
                expect(contactField.type).toBe("home");
                expect(contactField.value).toBe("8005551212");
                expect(contactField.pref).toBe(true);
            });

            it("contacts.spec.13 ContactField object should coerce type and value properties to strings", function() {
                var contactField = new ContactField(12345678, 12345678, true);
                expect(contactField.type).toBe("12345678");
                expect(contactField.value).toBe("12345678");
            });

            it("contacts.spec.14 should be able to define a ContactAddress object", function() {
                var contactAddress = new ContactAddress(true, "home", "a", "b", "c", "d", "e", "f");
                expect(contactAddress).toBeDefined();
                expect(contactAddress.pref).toBe(true);
                expect(contactAddress.type).toBe("home");
                expect(contactAddress.formatted).toBe("a");
                expect(contactAddress.streetAddress).toBe("b");
                expect(contactAddress.locality).toBe("c");
                expect(contactAddress.region).toBe("d");
                expect(contactAddress.postalCode).toBe("e");
                expect(contactAddress.country).toBe("f");
            });

            it("contacts.spec.15 should be able to define a ContactOrganization object", function() {
                var contactOrg = new ContactOrganization(true, "home", "a", "b", "c", "d", "e", "f", "g");
                expect(contactOrg).toBeDefined();
                expect(contactOrg.pref).toBe(true);
                expect(contactOrg.type).toBe("home");
                expect(contactOrg.name).toBe("a");
                expect(contactOrg.department).toBe("b");
                expect(contactOrg.title).toBe("c");
            });

            it("contacts.spec.16 should be able to define a ContactFindOptions object", function() {
                var contactFindOptions = new ContactFindOptions("a", true, "b");
                expect(contactFindOptions).toBeDefined();
                expect(contactFindOptions.filter).toBe("a");
                expect(contactFindOptions.multiple).toBe(true);
            });

            it("contacts.spec.17 should contain a clone function", function() {
                var contact = new Contact();
                expect(contact.clone).toBeDefined();
                expect(typeof contact.clone).toBe('function');
            });

            it("contacts.spec.18 clone function should make deep copy of Contact Object", function() {
                var contact = new Contact();
                contact.id = 1;
                contact.displayName = "Test Name";
                contact.nickname = "Testy";
                contact.gender = "male";
                contact.note = "note to be cloned";
                contact.name = new ContactName("Mr. Test Name");

                var clonedContact = contact.clone();

                expect(contact.id).toBe(1);
                expect(clonedContact.id).toBe(null);
                expect(clonedContact.displayName).toBe(contact.displayName);
                expect(clonedContact.nickname).toBe(contact.nickname);
                expect(clonedContact.gender).toBe(contact.gender);
                expect(clonedContact.note).toBe(contact.note);
                expect(clonedContact.name.formatted).toBe(contact.name.formatted);
                expect(clonedContact.connected).toBe(contact.connected);
            });

            it("contacts.spec.19 should contain a save function", function() {
                var contact = new Contact();
                expect(contact.save).toBeDefined();
                expect(typeof contact.save).toBe('function');
            });

            it("contacts.spec.20 should contain a remove function", function() {
                var contact = new Contact();
                expect(contact.remove).toBeDefined();
                expect(typeof contact.remove).toBe('function');
            });
        });

        describe('save method', function() {

            afterEach(function (done) {
                removeContact(done, this.contactObj);
            });

            it("contacts.spec.21 should be able to save a contact", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }

                var specContext = this;
                var bDay = new Date(1976, 6, 4);
                var obj = {
                    "gender": "male",
                    "note": "my note",
                    "name": {
                        "familyName": "Delete",
                        "givenName": "Test"
                    },
                    "emails": [{
                        "value": "here@there.com"
                    }, {
                        "value": "there@here.com"
                    }],
                    "birthday": bDay
                };

                var saveSuccess = function(obj) {
                        specContext.contactObj = obj;
                        expect(obj).toBeDefined();
                        expect(obj.note).toBe('my note');
                        expect(obj.name.familyName).toBe('Delete');
                        expect(obj.name.givenName).toBe('Test');
                        expect(obj.emails.length).toBe(2);
                        expect(obj.emails[0].value).toBe('here@there.com');
                        expect(obj.emails[1].value).toBe('there@here.com');
                        expect(obj.birthday.toDateString()).toBe(bDay.toDateString());
                        expect(obj.addresses).toBe(null);
                        done();
                };
                var saveFail = fail.bind(null, done);

                navigator.contacts
                    .create(obj)
                    .save(saveSuccess, saveFail);
            });

            it("contacts.spec.22 update a contact", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }

                var specContext = this;
                var aDay = new Date(1976, 6, 4);
                var bDay;
                var noteText = "an UPDATED note";
                var savedContact;

                var contact = {
                    "gender": "male",
                    "note": "my note",
                    "name": {
                        "familyName": "Delete",
                        "givenName": "Test"
                    },
                    "emails": [{
                        "value": "here@there.com"
                    }, {
                        "value": "there@here.com"
                    }],
                    "birthday": aDay
                };

                var saveFail = fail.bind(null, done);

                function updateSuccess(obj) {
                    specContext.contactObj = obj;
                    expect(obj).toBeDefined();
                    expect(obj.id).toBe(savedContact.id);
                    expect(obj.note).toBe(noteText);
                    expect(obj.birthday.toDateString()).toBe(bDay.toDateString());
                    expect(obj.emails.length).toBe(1);
                    expect(obj.emails[0].value).toBe('here@there.com');
                    done();
                }

                var saveSuccess = function(newContact) {
                    specContext.contactObj = newContact;
                    savedContact = newContact;
                    newContact.emails[1].value = "";
                    bDay = new Date(1975, 5, 4);
                    newContact.birthday = bDay;
                    newContact.note = noteText;
                    newContact.save(updateSuccess, saveFail);
                };

                navigator.contacts
                    .create(contact)
                    .save(saveSuccess, saveFail);

            }, HIGH_TIMEOUT);
        });

        describe('Contact.remove method', function() {
            afterEach(function (done) {
                removeContact(done, this.contactObj);
            });

            it("contacts.spec.23 calling remove on a contact that has an id of null should return ContactError.UNKNOWN_ERROR", function(done) {
                var expectedFail = function(result) {
                    expect(result.code).toBe(ContactError.UNKNOWN_ERROR);
                    done();
                };

                var rmContact = new Contact();
                rmContact.remove(fail.bind(null, done), expectedFail);
            });

            it("contacts.spec.24 calling remove on a contact that does not exist should return ContactError.UNKNOWN_ERROR", function(done) {
                // remove method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var rmWin = fail.bind(null, done);
                var rmFail = function(result) {
                    expect(result.code).toBe(ContactError.UNKNOWN_ERROR);
                    done();
                };

                // this is a bit risky as some devices may have contact ids that large
                var contact = new Contact("this string is supposed to be a unique identifier that will never show up on a device");
                contact.remove(rmWin, rmFail);
            }, MEDIUM_TIMEOUT);
        });

        describe("Round trip Contact tests (creating + save + delete + find)", function() {
            var saveAndFindBy = function (contact, fields, filter, callback, specContext) {
                removeContactsByFields(["note"], "DeleteMe", function() {
                    contact.save(function(c_obj) {
                        specContext.contactObj = c_obj;
                        var findWin = function(cs) {
                            expect(cs.length).toBe(1);
                            specContext.contactObj = cs[0];
                            callback(cs[0]);
                        };
                        var findFail = fail;
                        var obj = new ContactFindOptions();
                        obj.filter = filter;
                        obj.multiple = true;
                        navigator.contacts.find(fields, findWin, findFail, obj);
                    }, fail);
                });
            };

            afterEach(function (done) {
                removeContact(done, this.contactObj);
            });

            it("contacts.spec.25 Creating, saving, finding a contact should work", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var contactName = "DeleteMe";
                var contact = new Contact();
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                contact.note = "DeleteMe";
                saveAndFindBy(contact, ["displayName", "name"], contactName, function() {
                    done();
                }, this);
            }, MEDIUM_TIMEOUT);

            it("contacts.spec.26 Creating, saving, finding a contact should work, removing it should work", function(done) {
                // Save method is not supported on Windows platform
                var specContext = this;
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var contactName = "DeleteMe";
                var contact = new Contact();
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                contact.note = "DeleteMe";
                saveAndFindBy(contact, ["displayName", "name"], contactName, function(savedContact) {
                    savedContact.remove(function() {
                        specContext.contactObj = null;
                        done();
                    }, function(e) {
                        throw ("Newly created contact's remove function invoked error callback. Test failed: " + JSON.stringify(e));
                    });
                }, this);
            }, MEDIUM_TIMEOUT);

            it("contacts.spec.27 Should not be able to delete the same contact twice", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var specContext = this;
                var contactName = "DeleteMe2";
                var contact = new Contact();
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                contact.note = "DeleteMe2";
                saveAndFindBy(contact, ["displayName", "name"], contactName, function(savedContact) {
                    savedContact.remove(function() {
                        specContext.contactObj = null;
                        var findWin = function(seas) {
                            expect(seas.length).toBe(0);
                            savedContact.remove(function(e) {
                                throw ("Success callback called after non-existent Contact object called remove(). Test failed: " + JSON.stringify(e));
                            }, function(e) {
                                expect(e.code).toBe(ContactError.UNKNOWN_ERROR);
                                done();
                            });
                        };
                        var obj = new ContactFindOptions();
                        obj.filter = contactName;
                        obj.multiple = true;
                        navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], findWin, fail, obj);
                    }, fail);
                }, this);
            }, MEDIUM_TIMEOUT);

            it("contacts.spec.28 should find a contact with unicode name", function (done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8) {
                    pending();
                }
                var contactName = "\u2602";
                var contact = new Contact();
                contact.note = "DeleteMe";
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                saveAndFindBy(contact, ["displayName", "name"], contactName, function() {
                    done();
                }, this);
            }, MEDIUM_TIMEOUT);

            it("contacts.spec.29 should find a contact without a name", function (done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8) {
                    pending();
                }

                var contact = new Contact();
                var phoneNumbers = [1];
                phoneNumbers[0] = new ContactField('work', '555-555-1234', true);
                contact.phoneNumbers = phoneNumbers;

                saveAndFindBy(contact, ["phoneNumbers"], "555-555-1234", function() {
                    done();
                }, this);

            }, MEDIUM_TIMEOUT);

            it("contacts.spec.31 Find should return a contact with correct birthday field type", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var contactName = "DeleteMe";
                var bDay = new Date(1976, 7, 4);
                var contact = new Contact();
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                contact.note = "DeleteMe";
                contact.birthday = bDay;
                saveAndFindBy(contact, ["displayName", "name"], contactName, function(found) {
                    expect(found.birthday).toEqual(jasmine.any(Date));
                    expect(found.birthday).toEqual(bDay);
                    done();
                }, this);
            }, MEDIUM_TIMEOUT);

            it("contacts.spec.32 Find should return a contact with correct IM field", function(done) {
                // Save method is not supported on Windows platform
                if (isWindows || isWindowsPhone8 || isIOSPermissionBlocked) {
                    pending();
                }
                var contactName = "DeleteMe";
                var ims = [{
                    type: "Skype",
                    value: "imValue"
                }];
                var contact = new Contact();
                contact.name = new ContactName();
                contact.name.familyName = contactName;
                contact.note = "DeleteMe";
                contact.ims = ims;
                saveAndFindBy(contact, ["displayName", "name"], contactName, function(found) {
                    expect(found.ims).toEqual(jasmine.any(Array));
                    expect(found.ims[0]).toBeDefined();
                    if (found.ims[0]) {
                        expect(found.ims[0].type).toEqual(cordova.platformId == 'android' ? ims[0].type : ims[0].type.toLowerCase());
                        expect(found.ims[0].value).toEqual(ims[0].value);
                    }
                    done();
                }, this);
            }, MEDIUM_TIMEOUT);
        });

        describe('ContactError interface', function() {
            it("contacts.spec.30 ContactError constants should be defined", function() {
                expect(ContactError.UNKNOWN_ERROR).toBe(0);
                expect(ContactError.INVALID_ARGUMENT_ERROR).toBe(1);
                expect(ContactError.TIMEOUT_ERROR).toBe(2);
                expect(ContactError.PENDING_OPERATION_ERROR).toBe(3);
                expect(ContactError.IO_ERROR).toBe(4);
                expect(ContactError.NOT_SUPPORTED_ERROR).toBe(5);
                expect(ContactError.OPERATION_CANCELLED_ERROR).toBe(6);
                expect(ContactError.PERMISSION_DENIED_ERROR).toBe(20);
            });
        });
    });
};

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

exports.defineManualTests = function(contentEl, createActionButton) {
    function getContacts(filter) {
        var results = document.getElementById('contact_results');
        var obj = new ContactFindOptions();
        if (filter) {
            obj.filter = filter;
        }
        obj.multiple = true;
        navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails", "urls", "note"], function(contacts) {
            var s = "";
            if (contacts.length === 0) {
                s = "No contacts found";
            } else {
                s = "Number of contacts: " + contacts.length + "<br><table width='100%'><tr><th>Name</th><td>Phone</td><td>Email</td></tr>";
                for (var i = 0; i < contacts.length; i++) {
                    var contact = contacts[i];
                    var contactNameTag = contact.name ? "<tr><td>" + contact.name.formatted + "</td><td>" : "<tr><td>(No Name)</td><td>";
                    s = s + contactNameTag;
                    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                        s = s + contact.phoneNumbers[0].value;
                    }
                    s = s + "</td><td>";
                    if (contact.emails && contact.emails.length > 0) {
                        s = s + contact.emails[0].value;
                    }
                    s = s + "</td></tr>";
                }
                s = s + "</table>";
            }

            results.innerHTML = s;
        }, function(e) {
            if (e.code === ContactError.NOT_SUPPORTED_ERROR) {
                results.innerHTML = "Searching for contacts is not supported.";
            } else {
                results.innerHTML = "Search failed: error " + e.code;
            }
        }, obj);
    }

    function filterContacts() {
        var filter = document.getElementById('searchstring');
        getContacts(filter.value);
    }

    function pickContact() {
        var results = document.getElementById('contact_results');
        navigator.contacts.pickContact(
            function (contact) {
                results.innerHTML = contact ?
                    "Picked contact: <pre>" + JSON.stringify(contact, null, 4) + "</pre>" :
                    "No contacts found";

            },
            function (e) {
                results.innerHTML = (e && e.code === ContactError.NOT_SUPPORTED_ERROR) ?
                    "Searching for contacts is not supported." :
                    (e && e.code === ContactError.OPERATION_CANCELLED_ERROR) ?
                        "Pick cancelled" :
                        "Pick failed: error " + (e && e.code);
            }
        );
    }

    function addContact(displayName, name, phoneNumber, birthday) {
        try {
            var results = document.getElementById('contact_results');
            var contact = navigator.contacts.create({ "displayName": displayName, "name": name, "birthday": birthday, "note": "DeleteMe" });

            var phoneNumbers = [1];
            phoneNumbers[0] = new ContactField('work', phoneNumber, true);
            contact.phoneNumbers = phoneNumbers;

            contact.save(function() {
                results.innerHTML = (displayName || "Nameless contact") + " saved.";
            }, function(e) {
                if (e.code === ContactError.NOT_SUPPORTED_ERROR) {
                    results.innerHTML = "Saving contacts not supported.";
                } else {
                    results.innerHTML = "Contact save failed: error " + e.code;
                }
            });
        } catch (e) {
            console.error(e.message);
        }
    }

    function addDooneyEvans() {
        var displayName = "Dooney Evans";
        var contactName = {
            formatted: "Dooney Evans",
            familyName: "Evans",
            givenName: "Dooney",
            middleName: ""
        };
        var phoneNumber = '512-555-1234';
        var birthday = new Date(1985, 0, 23);

        addContact(displayName, contactName, phoneNumber, birthday);
    }

    function addNamelessContact() {
        addContact();
    }

    function addUnicodeContact() {
        var displayName = "Н€йромонах \nФеофаЊ";
        var contactName = {
            formatted: "Н€йромонах \nФеофаЊ",
            familyName: "\nФеофаЊ",
            givenName: "Н€йромонах",
            middleName: ""
        };

        addContact(displayName, contactName);
    }

    function renameDooneyEvans() {
        var results = document.getElementById('contact_results');
        var obj = new ContactFindOptions();
        obj.filter = 'Dooney Evans';
        obj.multiple = false;

        navigator.contacts.find(['displayName', 'name'], function(contacts) {
            if (contacts.length === 0) {
                results.innerHTML = 'No contacts to update.';
                return;
            }
            var contact = contacts[0];
            contact.displayName = "Urist McContact";
            var name = new ContactName();
            name.givenName = "Urist";
            name.familyName = "McContact";
            contact.name = name;
            contact.save(function(updated) {
                results.innerHTML = 'Contact updated.';
            },function(e) {
                results.innerHTML = 'Update failed: error ' + e.code;
            });
        }, function(e) {
            if (e.code === ContactError.NOT_SUPPORTED_ERROR) {
                results.innerHTML = 'Searching for contacts is not supported.';
            } else {
                results.innerHTML = 'Search failed: error ' + e.code;
            }
        }, obj);
    }

    function removeTestContacts() {
        var results = document.getElementById('contact_results');
        results.innerHTML = "";
        var obj = new ContactFindOptions();
        obj.filter = 'DeleteMe';
        obj.multiple = true;
        navigator.contacts.find(['note'], function(contacts) {
            var removes = [];
            contacts.forEach(function(contact) {
                removes.push(contact);
            });
            if (removes.length === 0) {
                results.innerHTML = "No contacts to remove";
                return;
            }

            var nextToRemove;
            if (removes.length > 0) {
                nextToRemove = removes.shift();
            }

            function removeNext(item) {
                if (typeof item === 'undefined') {
                    return;
                }

                if (removes.length > 0) {
                    nextToRemove = removes.shift();
                } else {
                    nextToRemove = undefined;
                }

                item.remove(function removeSucceeded() {
                    results.innerHTML += "Removed a contact with ID " + item.id + "<br/>";
                    removeNext(nextToRemove);
                }, function removeFailed() {
                    results.innerHTML += "Failed to remove a contact with ID " + item.id + "<br/>";
                    removeNext(nextToRemove);
                });
            }
            removeNext(nextToRemove);
        }, function(e) {
            if (e.code === ContactError.NOT_SUPPORTED_ERROR) {
                results.innerHTML = 'Searching for contacts is not supported.';
            } else {
                results.innerHTML = 'Search failed: error ' + e.code;
            }
        }, obj);
    }

    /******************************************************************************/

    contentEl.innerHTML = '<div id="info">' +
        '<b>Results:</b><br>' +
            '<div id="contact_results"></div>' +
        '</div>' +
        '<div id="get_contacts"></div>' +
            '<p>Expected result: Status box will show number of contacts and list them. May be empty on a fresh device until you click Add.</p>' +
        '<div id="filter_contacts">Search: <input type="text" id="searchstring"></div>' +
            '<p>Expected result: Will return only contacts which contain specified string</p>' +
        '<div id="pick_contact"></div>' +
            '<p>Expected result: Device\'s address book will be shown. After picking a contact status box will show Contact object, passed to success callback</p>' +
        '<div id="add_contact"></div>' +
            '<p>Expected result: Will add a new contact. Log will say "Contact saved." or "Saving contacts not supported." if not supported on current platform. Verify by running Get phone contacts again</p>' +
        '<div id="update_contact"></div>' +
            '<p>Expected result: Will rename "Dooney Evans" to "Urist McContact".</p>' +
        '<div id="remove_contacts"></div>' +
            '<p>Expected result: Will remove all contacts created by these tests. Log will output success or failure and ID of the deleted contacts.</p>';

    createActionButton("Get phone's contacts", function() {
        getContacts();
    }, 'get_contacts');

    createActionButton("Filter contacts", function() {
        filterContacts();
    }, 'filter_contacts');

    createActionButton("Pick contact", function() {
        pickContact();
    }, 'pick_contact');

    createActionButton("Add a new contact 'Dooney Evans'", function() {
        addDooneyEvans();
    }, 'add_contact');

    createActionButton("Add new nameless contact", function() {
        addNamelessContact();
    }, 'add_contact');

    createActionButton("Add new unicode contact", function() {
        addUnicodeContact();
    }, 'add_contact');

    createActionButton("Rename 'Dooney Evans'", function() {
        renameDooneyEvans();
    }, 'update_contact');

    createActionButton("Delete all test contacts", function() {
        removeTestContacts();
    }, 'remove_contacts');
};
