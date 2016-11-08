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
var async = require('async');
var FCM = require('fcm-push-notif');

firebase.initializeApp({
  serviceAccount: {
    projectId: "moviting",
    clientEmail: "moviting-backend@moviting.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC9jd8XSdVeCGcW\n2mqYBfiFEuaF70o7cB2qMiW4tViPy+9iQWlnlbe42C3kgiMludbZgpBtT55V4UC4\nu5juesnhCd2QEgFuuxgIP1PBoWWMCUTfG5IDTLDMKbL02Rm0bELJu5bRZkBJQ1L6\ngl9wj+sY58ZNTCvbae0Pa+6cwzKb3pszl4kqDrlp2Erz72VNWxZc/WK/8ZgJvKes\npYmdz+RxaVEZ/GayNBChzb7t//udsqozLpsBaRtwzX0n8KR2YhAeh5qDLXDFejXx\nMd9jFDuCEG62DiWquUUxn+TkOl9ZeCsMYE4y80RJ3+nXytS4V5mWKkeyoLrI4DOR\nAudkjWQjAgMBAAECggEBAJFe/YnpuPYdsZoINhmS8q5z+VEcXCzLZiTBwsYuZdYa\nC+Op0MF9Q+JCAKgv2e6z4H79r+/1ULQCRVWnobi7eJnarA4ykOCwIdUpY/2q3qsP\n7L7CcS+QoEJjdHhtC1agdHQsJpU/Ouw08q1mUPWNmjqGfkGHulbSnNjn6J5W4ThB\no/KI3K0gENehU2KK6vZmKPiut6v7r/uVVOx3eecT4M463wu4GRgrlA1jCHhsxbWw\nHWBSo/oUjJEztsyPrrIiFgUDnMwPpzr5rAeVbWVucsr8/gIGqBJZwagLWNf7UfTb\n+Ey6RibMLlfB/jXn+mQ2DzRoYLhUCCZ4Qw9MVlyF/XkCgYEA8ylHxOPjwv3xBWNU\nnq1s1R2rg81Ag5GREcksIAoBagcNzp0vr+p8yctQ/4xoDGPhG9TrhhslIUKvsRZq\n33Aq0oyUoN6tchJ9QBdFTizcT0ODZ/9aWnNuSbzdgiNLyhN/fcaPn/fHn5n4jvqi\nCTqXEY4lvfFcbgZz/bQx5e9WLsUCgYEAx5ABI3w9pTgBei40EygfcKhaRz9R/cBc\n2K30q83fYPPz2i7QTkhGe2G0gYJbsaoeeK7ucWB8AGKbkE0KrQKA+NLlqCecwDcP\nkQqIhcSCQUQ19FDxV5SIpe2zzxlaTyA9YY46+cLPu2I47mKKIjIGqRMzLDiUzH1Q\nLG6KwlNjdccCgYEAk/o8NeLlucWmhrvjREmQIMXUmfov16Gfoi5GDx1nrOmsCl/4\nJFtUI836dfoxW9DwrmpOBqfAWdRmbSOSWHW/abCpxpic/v2ngXhn8eI1FHumnYR1\nrPPwWyl3t/nY5polDRroTtaQgl1GOWTndSxVwRY7e7NFp6N/tRaTAzY6wW0CgYEA\nsE0uVFUseMwTsgcjhlEKBZMVvp/YJZ9N5zc3UpicYaDjq7tz19TOP64/s7Kgo0Kx\njNiuWodsxUJYQJFvfw0ZN7nJnlbwineaTv7JQbQrhtFmASOJM2BLoJtxIOM6/3By\nCb+HpqNOtjK+LQvtEOy1KaWGreiGvGlw7O/zsl3NHn0CgYBv/NQbTY6AbIyPyXhY\n8k/ovBempBV7CBbG1DCYUij9/DgxJQMG7H/qYSKB3laYRaeQaFj6y2jTpksbY2NN\nwACfTR+5whtorRBqu9mkF5iHhJ26JiFh2a3z1EM/8NZRse+0NoLzY1H94pDMolOW\nVP5zWSVpprHMZt+R4VvtUprKGg==\n-----END PRIVATE KEY-----\n"
  },
  databaseURL: "https://moviting.firebaseio.com/"
});

var db = firebase.database();
var userRef = db.ref("users");
var maleEnrollRef = db.ref("enroller/male");
var femaleEnrollRef = db.ref("enroller/female");
var proposeRef = db.ref("propose");
var matchMemberPaymentRef = db.ref("match_member_payment");
var matchChatRef = db.ref("match_chat");
var userMatchRef = db.ref("user_match");
var matchTicket = db.ref("match_ticket");
var userCoupon = db.ref("user_coupon");
var userPoint = db.ref("user_point");
var ticketPullRef = db.ref("ticket_pull");

var serverKey = 'AIzaSyD68kMn8f6lFp1DHv5s1oG0OxQ8RWF19x8';
var fcm = new FCM(serverKey);
var HashMap = require('hashmap');
var timerMap = new HashMap();

//listener of user added
userRef.on("child_added", function(snapshot, prevChildKey) {
  console.log("child_added: " + snapshot.val().email);

  // listener of each user's userStatus changed
  userRef.child(snapshot.key).on("child_changed", function(snapshot) {
    // userStatus && Enrolled
    if (snapshot.key == "userStatus" && snapshot.val() == "Enrolled") {
      console.log("child_changed: " + snapshot.val());
      
      snapshot.ref.parent.once("value", function(data) {
        console.log("enrolled_user: " + data.key + " / " + data.val().gender + " / " + data.val().myAge);
        if (data.val().gender == "male") {
          var uid = data.key;
          maleEnrollRef.child(data.val().myAge + "/" + uid).set(true);
        } else {
          var uid = data.key;
          femaleEnrollRef.child(data.val().myAge + "/" + uid).set(true);
        }
      });
    } else if (snapshot.key == "userStatus" && snapshot.val() == "Disenrolled") {
      console.log("child_changed: " + snapshot.val());
      
      snapshot.ref.parent.once("value", function(data) {
        console.log("enrolled_user: " + data.key + " / " + data.val().gender + " / " + data.val().myAge);
        if (data.val().gender == "male") {
          var uid = data.key;
          maleEnrollRef.child(data.val().myAge + "/" + uid).remove();
        } else {
          var uid = data.key;
          femaleEnrollRef.child(data.val().myAge + "/" + uid).remove();
        }
      });
    } else if (snapshot.key == "userStatus" && snapshot.val() == "Matched") {
      console.log("child_changed: " + snapshot.val());
    } else if(snapshot.key == "gender" && snapshot.val() == "female") {
      var newCoupon = userCoupon.child(snapshot.ref.parent.key).push();
          newCoupon.child("kind").set("1회 영화관람 이용권");
          newCoupon.child("used").set(false);
      userRef.child(snapshot.ref.parent.key).once("value", function(data){
        console.log(data.val());
        //sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
      });
    }
  });
});

var couponLoaded = false;
userCoupon.on("child_added", function(snapshot){
  if(couponLoaded == true) {
    console.log("new userCoupon child_added: " + snapshot.key);
    userRef.child(snapshot.key).child("token").once("value", function(data){
      sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
    });
  } else {
    console.log("userCoupon child_added: " + snapshot.key);
    userCoupon.child(snapshot.key).on("child_changed", function(snapshot){
      console.log("another userCoupon added: " + snapshot.ref.parent.key);
      userRef.child(snapshot.ref.parent.key).child("token").once("value", function(data){
        sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
      });
    });
  }
}); 

userCoupon.once("value", function(snapshot){
  couponLoaded = true;
  console.log("userCoupon once value: " + snapshot.key);
});

// listner of propose
proposeRef.on("child_added", function(snapshot, prevChildKey) {
  console.log("proposed: " + snapshot.key);
  snapshot.forEach(function(childSnapshot){
    console.log("proposed child: " + childSnapshot.key);

    childSnapshot.ref.on("child_changed", function(snapshot) {
      if (snapshot.key == "status" && snapshot.val() == "Like") {
        console.log(snapshot.ref.parent.parent.key + " / " + snapshot.ref.parent.key);
        checkMatch(snapshot.ref.parent.parent.key, snapshot.ref.parent.key);
      } else if (snapshot.key == "status" && snapshot.val() == "Dislike") {
        console.log(snapshot.ref.parent.key);
      }
    });

  });
});

matchMemberPaymentRef.once('value', function(data) {
  var loadingData = data.numChildren();

  var queryForChildAdded = matchMemberPaymentRef.orderByKey();
  queryForChildAdded.on('child_added', function(data) {
    var payments = [false, false];
    var childs = [];
    var tokens = [];
    var i = 0;
    
    console.log("queryForChildAdded " + loadingData + " " + data.key);

    if(loadingData != 0){
      loadingData = --loadingData;
    } else if(loadingData == 0 ) {
      data.forEach(function(child){
        payments[i] = child.val().payment;
        childs[i] = child.key;
        i++;
      });

      childs.forEach(function(item, index){
        userRef.child(item).child("token").once("value").then(function(token) {
          if(!payments[0] && !payments[1]) {
            tokens[index] = token.val();
            sendFCMMessage(tokens[index], "상대와 매치되었습니다!");
          }
        });
      });
      setTimer(data.key);
    }
  });
});

var queryForChildChanged = matchMemberPaymentRef.orderByKey();
queryForChildChanged.on('child_changed', function(data) {
  console.log(data.key);
  var payments = [];
  var childs = [];
  var i = 0;
  var ticket;
  var expiration_date;
  
  data.forEach(function(child){
    if(child.val().type != "" && child.val().payment == true ) {
      console.log(child.key + " " + child.val().payment + " " + child.val().type);
      payments[i] = child.val().payment;
      childs[i] = child.key;
      i++;
    }
  });

  console.log(payments[0] + " " + payments[1] + " " + childs[0] + " " + childs[1] ); 

  if(payments[0] != undefined && payments[1] !=undefined && childs[0] !=undefined && childs[1] !=undefined){
    if(payments[0] && payments[1]) {
      async.waterfall([ function(callback) {
        userRef.child(childs[0]).child("token").once("value").then(function(token) {
          console.log("token " + token.val());
          
          ticketPullRef.orderByKey().limitToFirst(1).once("value", function(snapshot) {
            snapshot.forEach(function(child) {
              ticket = child.val().ticket_id;
              expiration_date = child.val().expiration_date;
              child.ref.remove(function(error){
                console.log("removed");
                console.log("assignMovieTicket" + ticket);
                matchTicket.child(data.key).child(childs[0]).child(ticket).child("expiration_date").set(expiration_date);
                matchTicket.child(data.key).child(childs[0]).child(ticket).child("screening").set(true, function(error){
                  callback(null);
                });
              });
            });
          });

          sendFCMMessage(token.val(), "상대방이 결제하였습니다. 채팅방이 개설되었습니다.");
          releaseTimer(data.key);
        })}, 
        function(callback) {
          userRef.child(childs[1]).child("token").once("value").then(function(token) {
            console.log("token " + token.val());

            ticketPullRef.orderByKey().limitToFirst(1).once("value", function(snapshot) {
              snapshot.forEach(function(child) {
                ticket = child.val().ticket_id;
                expiration_date = child.val().expiration_date;
                child.ref.remove(function(error){
                  console.log("removed");
                  console.log("assignMovieTicket" + ticket);
                  matchTicket.child(data.key).child(childs[1]).child(ticket).child("expiration_date").set(expiration_date);
                  matchTicket.child(data.key).child(childs[1]).child(ticket).child("screening").set(true, function(error){
                    callback(null, null);
                  });                  
                });
              });
            });

            sendFCMMessage(token.val(), "상대방이 결제하였습니다. 채팅방이 개설되었습니다.");
            releaseTimer(data.key);
          })}], function(err, result){

        });
    } else if(payments[0] && !payments[1]) {
      userRef.child(childs[1]).child("token").once("value").then(function(token) {
          console.log("token " + token.val());
          sendFCMMessage(token.val(), "상대방이 결제하였습니다. 결제시 채팅방이 개설됩니다.");
          releaseTimer(data.key);
          setTimer(data.key);
        });
    } else if(!payments[0] && payments[1]) {
      userRef.child(childs[0]).child("token").once("value").then(function(token) {
          console.log("token " + token.val());
          sendFCMMessage(token.val(), "상대방이 결제하였습니다. 결제시 채팅방이 개설됩니다.");
          releaseTimer(data.key);
          setTimer(data.key);
        }); 
    }
  }
});

matchMemberPaymentRef.on('child_removed', function(data) {
  data.key; data.val();
});

matchChatRef.on('child_added', function(data) {
  var initialChatLoaded = false;
  console.log("match_chat" + data.key);

  matchChatRef.child(data.key).on('child_added', function(child) {
    if (initialChatLoaded) {    
      console.log("match_chat added after loaded: " + data.key + " " + child.key);
      matchMemberPaymentRef.child(data.key).once('value', function(snapshot) {
        console.log("match_chat addedafter loaded: " + child.val().message + " " + child.val().uid);
        var message = child.val().message;
        var senderUid = child.val().uid;
        var receiveUid; 
        
        snapshot.forEach(function(child) {
          if(child.key != senderUid) {
              receiveUid = child.key;
          }
        });
        
        console.log("match_chat changed: " + receiveUid);

        userRef.child(receiveUid).child("token").once("value", function(token) {
          console.log("sendFCMMessage: " + token.val());
          sendFCMMessage(token.val(), message);
        });
      });
    }
  });

  matchChatRef.child(data.key).once('value', function(snapshot) {
    initialChatLoaded = true;
  });
});

function setTimer(matchUid) {
  console.log("setTimer: " + matchUid);
  var timer = setTimeout(function() {
    console.log("Timer expired");
    rollback(matchUid);
  } , 21600000);
  timerMap.set(matchUid, timer);
}

function releaseTimer(matchUid) {
  console.log("releaseTimer: " + matchUid);
  var timer = timerMap.get(matchUid);
  clearTimeout(timer);
}

function rollback(matchUid) {
  matchMemberPaymentRef.child(matchUid).once('value', function(data) {
    
    data.forEach(function(child){
      var payment = child.val().payment;
      var type = child.val().type;

      if (payment == true) {
        if(type == "cash") {
          userPoint.child(child.key).set(20000);
        } else if(type = "coupon") {
          var newCoupon = userCoupon.child(child.key).push();
          newCoupon.child("kind").set("1회 영화관람 이용권");
          newCoupon.child("used").set(false);
        }
      }
      userMatchRef.child(child.key).child(matchUid).set(false);
    });
  });
}

function checkMatch(enrollerUid, opponentUid) {
  var isFound = false;

  proposeRef.child(opponentUid).once("value", function(snapshot){
    console.log("checkMatch: " + snapshot.key);
    snapshot.forEach(function(child){
      console.log("checkMatch child: " + child.key);
      if(child.key === enrollerUid){
        if(child.child("status").val() === "Like") {
          // Both user like each other
          console.log(child.child("status").val());
          makeMatchMember(enrollerUid, opponentUid);
          updateEnroll(enrollerUid, opponentUid);
        }
        isFound = true;
      }
    });
    if(!isFound) {
      sendProposeToOpponent(enrollerUid, opponentUid);
    }
  });
}

function makeMatchMember(enrollerUid, opponentUid) {
  var newMatchMemberRef = matchMemberPaymentRef.push();
  newMatchMemberRef.child(enrollerUid).child("payment").set(false);
  newMatchMemberRef.child(opponentUid).child("payment").set(false);
  newMatchMemberRef.child(enrollerUid).child("type").set("");
  newMatchMemberRef.child(opponentUid).child("type").set("");
  userMatchRef.child(enrollerUid).child(newMatchMemberRef.key).set(true);
  userMatchRef.child(opponentUid).child(newMatchMemberRef.key).set(true);

  console.log("makeMatchMember" + newMatchMemberRef.toString());
}

function updateEnroll(enrollerUid, opponentUid) {
  proposeRef.child(opponentUid + "/" + enrollerUid).child("status").set("Matched");
  proposeRef.child(enrollerUid + "/" + opponentUid).child("status").set("Matched");
}

function sendProposeToOpponent(enrollerUid, opponentUid) {
  proposeRef.child(opponentUid + "/" + enrollerUid).set({
    proposedAt: firebase.database.ServerValue.TIMESTAMP,
    status: "Proposed"
  }).then(function(){
    userRef.child(opponentUid).once("value").then(function(data) {
      var token = data.child("token").val();
      if(token != null){
        sendFCMMessage(token, "오늘의 소개가 도착했습니다.");
      }
    });
  }).catch(function(){
    console.log('sendProposeToOpponent failed');
  });
}

function processPropose(ref) {
  async.waterfall([
    async.apply(generateEnrollerList, ref),
    getUserDataList,
    processEachEnrollerData,
  ], function (err, result) {
    if(err != null) {
      console.error("processPropose err: " + err.toString());
    }
    if(result != null) {
      console.log("end!!!! " + result);
    }
  });
}

function generateEnrollerList(ref, callback) {
  var enrollerList = [];

  ref.once("value").then(function(snapshot) {
    snapshot.forEach(function(ageList) {
      ageList.forEach(function(uidList) {
        enrollerList.push(uidList.key);
      });
    });
    
    callback(null, enrollerList);
  });
}

function getUserDataList(enrollerList, callback) {
  var enrollerDataList = [];

  async.each(enrollerList, function(enrollerUid, callback){
    userRef.child(enrollerUid).once("value").then(function(data) {
      enrollerDataList.push(data);
      callback();
    });
  }, function(err) {
    if(err == null){
      callback(null, enrollerDataList); 
    } else {
      console.error(err);
    }
  });
}

function processEachEnrollerData(enrollerDataList, callback) {
  async.each(enrollerDataList, function(enrollerData, callback) {

    async.waterfall([
      async.apply(findOpponentCandidate, enrollerData),
      chooseThreePropose,
    ], function (err, result) {
      if(err != null) {
        console.error("processEachEnrollerData err: " + err.toString());
      } else {
        console.error("processEachEnrollerData result");
        if(result != null) {
          console.log("send fcm to: " + result);
          sendFCMMessage(result,"오늘의 소개가 도착했습니다.");
        }
        callback();
      }
    });
  
  }, function(err) {
    if( err ) {
      console.error("processEachEnrollerData err: " + err.toString());
    } else {
      console.log('processEachEnrollerData successfully');
      callback(null, "succeess");
    }
  });
}

function findOpponentCandidate(enrollerData, rootCallback) {
  var candidates = [];
  var filteredCandidates = [];

  var enrollerUid = enrollerData.key;
  var minPrefAge = enrollerData.child("minPrefAge").val().toString();
  var maxPrefAge = enrollerData.child("maxPrefAge").val().toString();
  var enrollerAge = enrollerData.child("myAge").val();
  var preferredGender = enrollerData.child("preferredGender").val();
  var enrollerGender = enrollerData.child("gender").val();
  var token = enrollerData.child("token").val();
  var enrollerDate = enrollerData.child("preferredDate").val();
  var enrollerMovie = enrollerData.child("preferredMovie").val();

  async.waterfall([function(parentCallback){
    // search opponent
    async.series(
    [function(callback){
      if(preferredGender === "male" || preferredGender === "both"){
        console.log("male or both find: " + enrollerUid + " / " + enrollerAge + " / " + minPrefAge + " / " + maxPrefAge + " / " + enrollerGender + " / " + preferredGender + " / " + token);
        
        maleEnrollRef.orderByKey().startAt(minPrefAge).endAt(maxPrefAge).once("value", function(snapshot) {
          console.log(enrollerUid + "(maleEnroller): " + snapshot.key);
          callback(null, snapshot);
        }, function(err) {
          callback(err, null);
        });
        
      } else {
        callback(null, null);
      }
    }, function(callback){
      if(preferredGender === "female" || preferredGender === "both"){
        console.log("female or both find: " + enrollerUid + " / " + enrollerAge + " / " + minPrefAge + " / " + maxPrefAge + " / " + enrollerGender + " / " + preferredGender + " / " + token);
        
        femaleEnrollRef.orderByKey().startAt(minPrefAge).endAt(maxPrefAge).once("value", function(snapshot) {
          console.log(enrollerUid + "(femaleEnroller): " + snapshot.key);
          callback(null, snapshot);
        }, function(err) {
          callback(err, null);
        });
        
      } else {
        callback(null, null);
      }
    }], function(err, results){
      if(err != null) {
        console.error("findOpponentCandidate err: " + err.toString());
      }
      
      var maleSnapshot = results[0];
      var femaleSnapshot = results[1];
      
      console.log("start candidate list " + enrollerUid);
      
      if(maleSnapshot != null) {
        generateCandidateList(maleSnapshot, candidates);
      }
      if(femaleSnapshot != null) {
        generateCandidateList(femaleSnapshot, candidates);
      }

      console.log("end candidate list " + enrollerUid);

      parentCallback(null, candidates);
    });
  }, function(candidates, secondParentCallback){
    console.log("start filter candidate list " + enrollerUid);
    async.each(candidates, function(candidate, eachCallback){
      console.log("filter candidate: " + candidate + " / " + enrollerUid + " / " + enrollerAge);

      async.series([
        function(callback) {
          userRef.child(candidate).once("value").then(function(data) {
            callback(null, data);
          });
        },
        function(callback) {
          proposeRef.child(enrollerUid).once("value").then(function(data) {
            callback(null, data);
          });
        },
      ], function(err, results) {
        if(err != null) {
          console.error("findOpponentCandidate err: " + err.toString());
        }        
        // results is now equal to ['opponentUserData', 'proposeData']
        var opponentUserData = results[0];
        var proposeData = results[1];

        // 1. check opponent pref age, gender, date, movie
        // 2. avoid duplication with past propose
        if (checkAge(enrollerAge, opponentUserData.child("minPrefAge").val(), opponentUserData.child("maxPrefAge").val())
        && checkGender(enrollerGender, opponentUserData.child("preferredGender").val())
        && checkDate(enrollerDate, opponentUserData.child("preferredDate").val())
        && checkMovie(enrollerMovie, opponentUserData.child("preferredMovie").val())
        && !proposeData.child(candidate).exists()) {
          //console.log("accept range & dup: " + candidate);
          filteredCandidates.push(candidate);
        }
        eachCallback();
      });

    }, function(err){
      if(err != null) {
        console.error("findOpponentCandidate err: " + err.toString());
      }      
      console.log("end filter candidate list: " + enrollerUid + " / " + filteredCandidates);
      secondParentCallback(null, filteredCandidates);
    });
  }],function(err, result) {
    if(err != null) {
      console.error("findOpponentCandidate err: " + err.toString());
    }
    // chooseThreePropose
    rootCallback(null, filteredCandidates, enrollerUid, token);
  });
}

function checkAge(enrollerAge, opponentMinPref, opponentMaxPref) {
  if(enrollerAge >= opponentMinPref && enrollerAge <= opponentMaxPref){
    return true;
  } else {
    return false;
  }
}

function checkGender(enrollerGender, opponentPrefGender) {
    if(enrollerGender === opponentPrefGender || opponentPrefGender === "both") {
      return true;
    } else {
      return false;
    }
}

function checkDate(enrollerDate, opponentDate) {
  var i, j;
  var enrDateLen = enrollerDate.length;
  var oppDateLen = opponentDate.length;


  for (i = 0; i < enrDateLen; i++) {
      for (j = 0; j < oppDateLen; j++) {
          if (enrollerDate[i] === opponentDate[j]) {
              return true;
          }
      }
  }

  return false;
}

function checkMovie(enrollerMovie, opponentMovie) {
  var i, j;
  var enrMovieLen = enrollerMovie.length;
  var oppMovieLen = opponentMovie.length;

  for (i = 0; i < enrMovieLen; i++) {
      for (j = 0; j < oppMovieLen; j++) {
          if (enrollerMovie[i] === opponentMovie[j]) {
              return true;
          }
      }
  }

  return false;
}

function generateCandidateList(snapshot, candidates) {
  snapshot.forEach(function(childSnapshot) {
    childSnapshot.forEach(function(secondChildSnapshot) {
      candidates.push(secondChildSnapshot.key);
    });
  });
  console.log("foreach end: " + candidates);
}

function chooseThreePropose(candidates, enrollerUid, token, callback) {
  var results = [];
  
  if(candidates != null) {
    for (var i = 0; i < 3; i++) {
      if(candidates.length <= 0) {
        break;
      }
      var pick = Math.floor(Math.random() * candidates.length);
      console.log("pick: " + pick + " / " + candidates.length + " / " + candidates[pick]);
      results.push(candidates[pick])
      candidates.splice(pick, 1);
    }
    
    for (var i = 0; i < results.length; i++) {
      proposeRef.child(enrollerUid + "/" + results[i]).set({
        proposedAt: firebase.database.ServerValue.TIMESTAMP,
        status: "Proposed"
      });
    }
  }
  
  //processEachEnrollerData's waterfall result
  if(results.length > 0) {
    callback(null, token);
  } else {
    callback(null, null);
  }
}

setTimeout(function() {

  setInterval(function(){
    processPropose(maleEnrollRef);

    setTimeout(function() {
      processPropose(femaleEnrollRef);
    }, 5000);
  }, 60000/*86400000*/ );

}, getIntervalByNoon() );

function getIntervalByNoon() {
  var today = new Date();
  var todayHours = today.getHours();
  if (todayHours >= 12) {
    var tomorrowNoon = new Date(today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(), today.getMinutes()+1, 0, 0);
      //today.getDate() + 1,
      //12, 0, 0, 0);
    console.log("getIntervalByNoon tomorrow: " + tomorrowNoon + " / " + tomorrowNoon.getTime() + " / " + today.getTime());
    return tomorrowNoon.getTime() - today.getTime();
  } else {
    var todayNoon = new Date(today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(), today.getMinutes()+1, 0, 0);
      // 12, 0, 0, 0);
    console.log("getIntervalByNoon today: " + todayNoon + " / " + todayNoon.getTime() + " / " + today.getTime());
    return todayNoon.getTime() - today.getTime();
  }
}

function removePreviousDate() {
userRef.once('value', function(snapshot) {
  snapshot.forEach(function(child) {
    child.forEach(function(grandChild) {
      if (grandChild.key == 'preferredDate') {
        grandChild.ref.orderByValue().once('value', function(snapshot) {
          console.log("-----------------------------");
          var newDate = [];
          snapshot.forEach(function(child) {
            var today = new Date();
            var d = new Date(child.val());
            if(d.getTime() > today.getTime()) {
              newDate.push(child.val());
            }            
          });
          console.log(newDate);
          grandChild.ref.set(newDate);
        });
      }
    });
  });
});

}

setTimeout(function() {
  removePreviousDate();
  setInterval(function(){
    removePreviousDate();
  }, 86400000 );

}, getIntervalByMidNight() );

function getIntervalByMidNight() {
  var today = new Date();
  
  var tomorrowNoon = new Date(today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
    0, 0, 0, 0);
  console.log("getIntervalByMidNight tomorrow: " + tomorrowNoon + " / " + tomorrowNoon.getTime() + " / " + today.getTime());
  return tomorrowNoon.getTime() - today.getTime();
}

function sendFCMMessage(token, messageBody) {
  var message = {
    to: token,
    collapse_key:"moviting-propose",
    data: {
      title: messageBody,
      body: messageBody
    }
  };

  fcm.send(message)
    .then(function(response){
      console.log("Successfully sent with response: ", response);
    })
    .catch(function(err){
      console.log("Something has gone wrong!");
      console.error(err);
    });
}

userRef.on("child_removed", function(snapshot) {
  console.log("child_removed: " + snapshot.val());
});

setInterval(
  function() {
    console.log("alive");
  }, 60000);
