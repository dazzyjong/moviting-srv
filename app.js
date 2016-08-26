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
  serviceAccount: {
    projectId : "moviting",
    clientEmail: "moviting-backend@moviting.iam.gserviceaccount.com",
    privateKey : "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC9jd8XSdVeCGcW\n2mqYBfiFEuaF70o7cB2qMiW4tViPy+9iQWlnlbe42C3kgiMludbZgpBtT55V4UC4\nu5juesnhCd2QEgFuuxgIP1PBoWWMCUTfG5IDTLDMKbL02Rm0bELJu5bRZkBJQ1L6\ngl9wj+sY58ZNTCvbae0Pa+6cwzKb3pszl4kqDrlp2Erz72VNWxZc/WK/8ZgJvKes\npYmdz+RxaVEZ/GayNBChzb7t//udsqozLpsBaRtwzX0n8KR2YhAeh5qDLXDFejXx\nMd9jFDuCEG62DiWquUUxn+TkOl9ZeCsMYE4y80RJ3+nXytS4V5mWKkeyoLrI4DOR\nAudkjWQjAgMBAAECggEBAJFe/YnpuPYdsZoINhmS8q5z+VEcXCzLZiTBwsYuZdYa\nC+Op0MF9Q+JCAKgv2e6z4H79r+/1ULQCRVWnobi7eJnarA4ykOCwIdUpY/2q3qsP\n7L7CcS+QoEJjdHhtC1agdHQsJpU/Ouw08q1mUPWNmjqGfkGHulbSnNjn6J5W4ThB\no/KI3K0gENehU2KK6vZmKPiut6v7r/uVVOx3eecT4M463wu4GRgrlA1jCHhsxbWw\nHWBSo/oUjJEztsyPrrIiFgUDnMwPpzr5rAeVbWVucsr8/gIGqBJZwagLWNf7UfTb\n+Ey6RibMLlfB/jXn+mQ2DzRoYLhUCCZ4Qw9MVlyF/XkCgYEA8ylHxOPjwv3xBWNU\nnq1s1R2rg81Ag5GREcksIAoBagcNzp0vr+p8yctQ/4xoDGPhG9TrhhslIUKvsRZq\n33Aq0oyUoN6tchJ9QBdFTizcT0ODZ/9aWnNuSbzdgiNLyhN/fcaPn/fHn5n4jvqi\nCTqXEY4lvfFcbgZz/bQx5e9WLsUCgYEAx5ABI3w9pTgBei40EygfcKhaRz9R/cBc\n2K30q83fYPPz2i7QTkhGe2G0gYJbsaoeeK7ucWB8AGKbkE0KrQKA+NLlqCecwDcP\nkQqIhcSCQUQ19FDxV5SIpe2zzxlaTyA9YY46+cLPu2I47mKKIjIGqRMzLDiUzH1Q\nLG6KwlNjdccCgYEAk/o8NeLlucWmhrvjREmQIMXUmfov16Gfoi5GDx1nrOmsCl/4\nJFtUI836dfoxW9DwrmpOBqfAWdRmbSOSWHW/abCpxpic/v2ngXhn8eI1FHumnYR1\nrPPwWyl3t/nY5polDRroTtaQgl1GOWTndSxVwRY7e7NFp6N/tRaTAzY6wW0CgYEA\nsE0uVFUseMwTsgcjhlEKBZMVvp/YJZ9N5zc3UpicYaDjq7tz19TOP64/s7Kgo0Kx\njNiuWodsxUJYQJFvfw0ZN7nJnlbwineaTv7JQbQrhtFmASOJM2BLoJtxIOM6/3By\nCb+HpqNOtjK+LQvtEOy1KaWGreiGvGlw7O/zsl3NHn0CgYBv/NQbTY6AbIyPyXhY\n8k/ovBempBV7CBbG1DCYUij9/DgxJQMG7H/qYSKB3laYRaeQaFj6y2jTpksbY2NN\nwACfTR+5whtorRBqu9mkF5iHhJ26JiFh2a3z1EM/8NZRse+0NoLzY1H94pDMolOW\nVP5zWSVpprHMZt+R4VvtUprKGg==\n-----END PRIVATE KEY-----\n"
  },
  databaseURL: "https://moviting.firebaseio.com/"
});


var db = firebase.database();
var userRef = db.ref("users");
var maleEnrollRef = db.ref("enroll/male");
var femaleEnrolleRef = db.ref("enroll/female");
var proposed = db.ref("proposed");

userRef.on("child_added", function(snapshot, prevChildKey){
  console.log("child_added: " + snapshot.val().email);
  
  userRef.child(snapshot.key).on("child_changed", function(snapshot){
    if(snapshot.key == "userStatus") {
      console.log("child_changed: " + snapshot.val());
      if(snapshot.val() == "Enrolled") {
        snapshot.ref.parent.once("value", function(data){
          console.log("enrolled_user: " + data.key + " / " + data.val().gender + " / " + data.val().myAge );
          if(data.val().gender == "male") {
            var uid = data.key;
            maleEnrollRef.child(data.val().myAge + "/" + uid).set(true);
          } else {
            var uid = data.key;
            femaleEnrolleRef.child(data.val().myAge + "/" + uid).set(true);
          }
        })
      }
    }
  });
});

setTimeout(function(){
  
  setInterval(function(){

  }, 86400000 );
}, getIntervalByNoon());

maleEnrollRef.once("value").then(function(snapshot){
  snapshot.forEach(function(childSnapshot){
    // age
    console.log(childSnapshot.key);
    childSnapshot.ref.once("value").then(function(snapshot){
      snapshot.forEach(function(childSnapshot){
        // uid
        console.log(childSnapshot.key);
        userRef.child(childSnapshot.key).once("value").then(function(data){
          // min max pref age
          var minPrefAge = data.child("minPrefAge").val();
          var maxPrefAge = data.child("maxPrefAge").val();
          console.log(minPrefAge + " / " + maxPrefAge);
        });
      });
    });
  });
});

function getIntervalByNoon() {
  var today = new Date();
  var todayHours = today.getHours();
  if(todayHours >= 12) {
    var tomorrowNoon = new Date(today.getFullYear(), 
                                today.getMonth(), 
                                today.getDate() + 1, 
                                12,0,0,0);
    console.log("tomorrow: " + tomorrowNoon + " / " + tomorrowNoon.getTime() + " / " + today.getTime());
    return tomorrowNoon.getTime() - today.getTime();
  } else {
    var todayNoon = new Date(today.getFullYear(), 
                             today.getMonth(), 
                             today.getDate(), 
                             12,0,0,0);
    console.log("today: " + todayNoon + " / " + todayNoon.getTime() + " / " + today.getTime());
    return todayNoon.getTime() - today.getTime();
  }
}

userRef.on("child_removed", function(snapshot){
  console.log("child_removed: " + snapshot.val());
});