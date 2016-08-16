// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

var firebase = require("firebase");

firebase.initializeApp({
  databaseURL: "https://moviting.firebaseio.com/"
});

var db = firebase.database();
var ref = db.ref("users");

ref.on("child_added", function(snapshot, prevChildKey){
  console.log("child_added: " + snapshot);
});

ref.on("child_changed", function(snapshot){
  console.log("child_changed: " + snapshot);
});

ref.on("child_removed", function(snapshot){
  console.log("child_removed: " + snapshot);
});