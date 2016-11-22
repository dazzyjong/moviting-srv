// Copyright 2015-2016, Seolrera, Inc.
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

var fs = require('fs');
var admin = require("firebase-admin");
var async = require('async');
var FCM = require('fcm-push-notif');
var logger = require('tracer').console({
      transport : function(data) {
        console.log(data.output);
        fs.appendFile('./file.log', data.output + '\n', (err) => {
            if (err) throw err;
        });
    },
    format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
    dateformat : "HH:MM:ss.L"
  });
var blocked = require('blocked');

var serviceAccount = require("./moviting-firebase-adminsdk-uo15c-c0100999b6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moviting.firebaseio.com/"
});

var db = admin.database();
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
var movieRef = db.ref("movie");
var matchTimerRef = db.ref("match_timer");

var serverKey = 'AIzaSyD68kMn8f6lFp1DHv5s1oG0OxQ8RWF19x8';
var fcm = new FCM(serverKey);
var HashMap = require('hashmap');
var timerMap = new HashMap();
var EXPIRATION_TIME = 43200000;
var PROPOSE_TIME = 86400000;

movieRef.on("child_removed", function(data){
	console.log("child_removed " + data.key);
  
  userRef.once('value', function(snapshot) {
    snapshot.forEach(function(child) {
      if(child.val().preferredMovie != null){
        var arr = child.val().preferredMovie;
        arr.forEach(function(item, index){
          if(item == data.key) {
            arr.splice(index, 1);
          }
        });
        child.ref.child("preferredMovie").set(arr);
        if(arr.length == 0) {
          child.ref.child("userStatus").set("Disenrolled");
        }
      }
    });
  });
});

//listener of user added
userRef.on("child_added", function(snapshot, prevChildKey) {
  logger.log("child_added: " + snapshot.val().email);

  // listener of each user's userStatus changed
  userRef.child(snapshot.key).on("child_changed", function(snapshot) {
    // userStatus && Enrolled
    if (snapshot.key == "userStatus" && snapshot.val() == "Enrolled") {
      logger.log("child_changed: " + snapshot.val());
      
      snapshot.ref.parent.once("value", function(data) {
        logger.log("enrolled_user: " + data.key + " / " + data.val().gender + " / " + data.val().myAge);
        if (data.val().gender == "male") {
          var uid = data.key;
          maleEnrollRef.child(data.val().myAge + "/" + uid).set(true);
        } else {
          var uid = data.key;
          femaleEnrollRef.child(data.val().myAge + "/" + uid).set(true);
        }
      });
    } else if (snapshot.key == "userStatus" && snapshot.val() == "Disenrolled") {
      logger.log("child_changed: " + snapshot.val());
      
      snapshot.ref.parent.once("value", function(data) {
        logger.log("enrolled_user: " + data.key + " / " + data.val().gender + " / " + data.val().myAge);
        if (data.val().gender == "male") {
          var uid = data.key;
          maleEnrollRef.child(data.val().myAge + "/" + uid).remove();
        } else {
          var uid = data.key;
          femaleEnrollRef.child(data.val().myAge + "/" + uid).remove();
        }
      });
    } else if (snapshot.key == "userStatus" && snapshot.val() == "Matched") {
      logger.log("child_changed: " + snapshot.val());
    } else if(snapshot.key == "gender" && snapshot.val() == "female") {
      var newCoupon = userCoupon.child(snapshot.ref.parent.key).push();
          newCoupon.child("kind").set("1회 영화관람 이용권");
          newCoupon.child("used").set(false);
      userRef.child(snapshot.ref.parent.key).once("value", function(data){
        logger.log(data.val());
        //sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
      });
    }
  });
});

matchTimerRef.on("child_added", function(snapshot){
	var now = new Date();
	logger.log("matchTimerRef " + snapshot.key + " " + (EXPIRATION_TIME - (now.getTime() - snapshot.val())));
  setTimer(snapshot.key, EXPIRATION_TIME - (now.getTime() - snapshot.val()));
});

/////////////////////////////////////////////////////////////////////////////////////////
var couponLoaded = false;
userCoupon.on("child_added", function(snapshot){
  if(couponLoaded == true) {
    logger.log("new userCoupon child_added: " + snapshot.key);
    userRef.child(snapshot.key).child("token").once("value", function(data){
      sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
    });
  } else {
    logger.log("userCoupon child_added: " + snapshot.key);
    userCoupon.child(snapshot.key).on("child_changed", function(snapshot){
      if(snapshot.val().used == false) {
        logger.log("another userCoupon added: " + snapshot.ref.parent.key);
        userRef.child(snapshot.ref.parent.key).child("token").once("value", function(data){
          sendFCMMessage(data.val(),"1회 영화관람 이용권이 발급되었습니다.");
        });
      }
    });
  }
}); 

userCoupon.once("value", function(snapshot){
  couponLoaded = true;
  logger.log("userCoupon once value: " + snapshot.key);
});

/////////////////////////////////////////////////////////////////////////////////////////
var pointLoaded = false;
userPoint.on("child_added", function(snapshot){
  if(pointLoaded == true) {
    logger.log("new userPoint child_added: " + snapshot.key);
    userRef.child(snapshot.key).child("token").once("value", function(data){
      sendFCMMessage(data.val(), "크레딧이 충전되었습니다.");
    });
  } else {
    logger.log("userPoint child_added: " + snapshot.key);
    userPoint.on("child_changed", function(snapshot){
      if(snapshot.val() > 0) {
        logger.log("another userPoint added: " + snapshot.key);
        userRef.child(snapshot.key).child("token").once("value", function(data){
          sendFCMMessage(data.val(), "크레딧이 충전되었습니다.");
        });
      }
    });
  }
}); 

userPoint.once("value", function(snapshot){
  pointLoaded = true;
  logger.log("userPoint once value: " + snapshot.key);
});

/////////////////////////////////////////////////////////////////////////////////////////

// listner of propose
proposeRef.on("child_added", function(snapshot, prevChildKey) {
  // uid
  logger.log("proposed: " + snapshot.key);
  snapshot.ref.on("child_added", function(childSnapshot){
    // opponent uid
    logger.log("proposed child added: " + childSnapshot.key);
    proposeChangeListener(childSnapshot);
  });
});

function proposeChangeListener(childSnapshot) {
    childSnapshot.ref.on("child_changed", function(snapshot) {
      if (snapshot.key == "status" && snapshot.val() == "Like") {
        logger.log(snapshot.ref.parent.parent.key + " like " + snapshot.ref.parent.key);
        checkMatch(snapshot.ref.parent.parent.key, snapshot.ref.parent.key);
      } else if (snapshot.key == "status" && snapshot.val() == "Proposed") {
        logger.log("proposed again: " + snapshot.ref.parent.key);
      } else if (snapshot.key == "status" && snapshot.val() == "Dislike") {
        logger.log("dislike: " + snapshot.ref.parent.key);
      } 
    });
}

matchMemberPaymentRef.once('value', function(data) {
  var loadingData = data.numChildren();

  var queryForChildAdded = matchMemberPaymentRef.orderByKey();
  queryForChildAdded.on('child_added', function(data) {
    logger.log("queryForChildAdded " + loadingData + " " + data.key);
  });
});

var queryForChildChanged = matchMemberPaymentRef.orderByKey();
queryForChildChanged.on('child_changed', function(data) {
  logger.log("queryForChildChanged" + data.key + " " + data.val());
  var payments = [];
  var type = [];
  var childs = [];
  var i = 0;
  var ticket;
  var expiration_date;
  
  data.forEach(function(child){
      logger.log(child.key + " " + child.val().payment + " " + child.val().type);
      payments[i] = child.val().payment;
      type[i] = child.val().type;
      childs[i] = child.key;
      i++;
  });

  logger.log(payments[0] + " " + payments[1] + " " + childs[0] + " " + childs[1] ); 

  if(payments[0] != undefined && payments[1] !=undefined && childs[0] !=undefined && childs[1] !=undefined){
    if(payments[0] && payments[1] && type[0].length != 0 && type[1].length != 0) {
      logger.log("start chat");
      async.waterfall([ function(callback) {
        userRef.child(childs[0]).child("token").once("value").then(function(token) {
          logger.log("token " + token.val());
          
          ticketPullRef.orderByKey().limitToFirst(1).once("value", function(snapshot) {
            snapshot.forEach(function(child) {
              ticket = child.val().ticket_id;
              expiration_date = child.val().expiration_date;
              child.ref.remove(function(error){
                logger.log("removed");
                logger.log("assignMovieTicket" + ticket);
                matchTicket.child(data.key).child(childs[0]).child(ticket).child("expiration_date").set(expiration_date);
                matchTicket.child(data.key).child(childs[0]).child(ticket).child("screening").set(true, function(error){
                  callback(null);
                });
              });
            });
          });

          sendFCMMessage(token.val(), "채팅방이 개설되었습니다!");
          releaseTimer(data.key);
        })}, 
        function(callback) {
          userRef.child(childs[1]).child("token").once("value").then(function(token) {
            logger.log("token " + token.val());

            ticketPullRef.orderByKey().limitToFirst(1).once("value", function(snapshot) {
              snapshot.forEach(function(child) {
                ticket = child.val().ticket_id;
                expiration_date = child.val().expiration_date;
                child.ref.remove(function(error){
                  logger.log("removed");
                  logger.log("assignMovieTicket" + ticket);
                  matchTicket.child(data.key).child(childs[1]).child(ticket).child("expiration_date").set(expiration_date);
                  matchTicket.child(data.key).child(childs[1]).child(ticket).child("screening").set(true, function(error){
                    callback(null, null);
                  });                  
                });
              });
            });

            sendFCMMessage(token.val(), "채팅방이 개설되었습니다!");
            releaseTimer(data.key);          
          })}], function(err, result){
            var welcomMessage = { 
              message : "1. 약속 잡기\n: 설레는 영화관람을 위해 상영관, 시간, 일자 등 정확한 약속을 잡으세요\n\n2. 티켓 교환\n: 상단에 위치한 '티켓 건네주기' 기능을 통해 함께 앉아야 하므로 예매를 위해 한사람에게 티켓을 건네주세요(이벤트 쿠폰 결제자는 예매가 불가능해요)\n\n3. 티켓 예매\n: 영화티켓함 내 건네받은 티켓정보 및 사용방법을 통해 영화를 예매하세요",
              uid : "admin"
            };

            matchChatRef.child(data.key).push().set(welcomMessage);   
            logger.log("end chat");
        });
    } else if(payments[0] && !payments[1]) {
      userRef.child(childs[1]).child("token").once("value").then(function(token) {
          logger.log("token " + token.val());
          sendFCMMessage(token.val(), "상대방이 결제하였습니다. 12시간이내 결제시 채팅방이 개설됩니다.");
          releaseTimer(data.key);
          setTimer(data.key, EXPIRATION_TIME);
        });
    } else if(!payments[0] && payments[1]) {
      userRef.child(childs[0]).child("token").once("value").then(function(token) {
          logger.log("token " + token.val());
          sendFCMMessage(token.val(), "상대방이 결제하였습니다.  12시간이내 결제시 채팅방이 개설됩니다.");
          releaseTimer(data.key);
          setTimer(data.key, EXPIRATION_TIME);
        }); 
    } else if(!payments[0] && !payments[1]) {
      childs.forEach(function(item, index){
        userRef.child(item).child("token").once("value").then(function(token) {
          if(!payments[0] && !payments[1]) {
            var tokens = [];
            tokens[index] = token.val();
            logger.log("queryForChildAdded " + tokens[index]);
            sendFCMMessage(tokens[index], "서로 상대에게 '좋아요'를 보냈습니다.");
          }
        });
      });
      setTimer(data.key, EXPIRATION_TIME);
    }
  }
});

matchMemberPaymentRef.on('child_removed', function(data) {
  data.key; data.val();
});

matchChatRef.on('child_added', function(data) {
  var initialChatLoaded = false;
  logger.log("match_chat" + data.key);

  matchChatRef.child(data.key).on('child_added', function(child) {
    if (initialChatLoaded) {    
      logger.log("match_chat added after loaded: " + data.key + " " + child.key);
      matchMemberPaymentRef.child(data.key).once('value', function(snapshot) {
        logger.log("match_chat addedafter loaded: " + child.val().message + " " + child.val().uid);
        var message = child.val().message;
        var senderUid = child.val().uid;
        var receiveUid; 
        
        snapshot.forEach(function(child) {
          if(child.key != senderUid) {
              receiveUid = child.key;
          }
        });
        
        logger.log("match_chat changed: " + receiveUid);

        userRef.child(receiveUid).child("token").once("value", function(token) {
          logger.log("sendFCMMessage: " + token.val());
          sendFCMMessage(token.val(), message);
        });
      });
    }
  });

  matchChatRef.child(data.key).once('value', function(snapshot) {
    initialChatLoaded = true;
  });
});

function setTimer(matchUid, time) {
  logger.log("setTimer: " + matchUid + " " + time);
  var timer = setTimeout(function() {
    logger.log("Timer expired");
    rollback(matchUid);
    matchTimerRef.child(matchUid).remove();
  } , time);
  matchTimerRef.child(matchUid).set(admin.database.ServerValue.TIMESTAMP);
  timerMap.set(matchUid, timer);
}

function releaseTimer(matchUid) {
  logger.log("releaseTimer: " + matchUid);
  var timer = timerMap.get(matchUid);
  clearTimeout(timer);
  matchTimerRef.child(matchUid).remove();
}

function rollback(matchUid) {
  matchMemberPaymentRef.child(matchUid).once('value', function(data) {
    var uid = [];
    data.forEach(function(child){
      uid.push(child.key);
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
    if(uid[0] != null && uid[1] != null) {
      proposeRef.child(uid[0]).child(uid[1]).remove();
      proposeRef.child(uid[1]).child(uid[0]).remove();
    }
  });
}

function checkMatch(enrollerUid, opponentUid) {
  var isFound = false;

  proposeRef.child(opponentUid).once("value", function(snapshot){
    logger.log("checkMatch: " + snapshot.key);
    snapshot.forEach(function(child){
      logger.log("checkMatch child: " + child.key);
      if(child.key === enrollerUid){
        if(child.child("status").val() === "Like") {
          // Both user like each other
          logger.log(child.child("status").val());
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
  var data = {payment : false,
              type : "" }; 
  newMatchMemberRef.child(enrollerUid).set(data);
  newMatchMemberRef.child(opponentUid).set(data);
  
  userMatchRef.child(enrollerUid).child(newMatchMemberRef.key).set(true);
  userMatchRef.child(opponentUid).child(newMatchMemberRef.key).set(true);

  logger.log("makeMatchMember" + newMatchMemberRef.toString());
}

function updateEnroll(enrollerUid, opponentUid) {
  proposeRef.child(opponentUid + "/" + enrollerUid).child("status").set("Matched");
  proposeRef.child(enrollerUid + "/" + opponentUid).child("status").set("Matched");
}

function sendProposeToOpponent(enrollerUid, opponentUid) {
  proposeRef.child(opponentUid + "/" + enrollerUid).set({
    proposedAt: admin.database.ServerValue.TIMESTAMP,
    status: "Proposed"
  }).then(function(){
    userRef.child(opponentUid).once("value").then(function(data) {
      var token = data.child("token").val();
      if(token != null){
        sendFCMMessage(token, "새 인연이 도착했습니다.");
      }
    });
  }).catch(function(){
    logger.log('sendProposeToOpponent failed');
  });
}

function processPropose(ref) {
  async.waterfall([
    async.apply(generateEnrollerList, ref),
    getUserDataList,
    processEachEnrollerData,
  ], function (err, result) {
    if(err != null) {
      logger.error("processPropose err: " + err.toString());
    }
    if(result != null) {
      logger.log("end!!!! " + result);
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
      logger.error(err);
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
        logger.error("processEachEnrollerData err: " + err.toString());
      } else {
        logger.error("processEachEnrollerData result");
        if(result != null) {
          logger.log("send fcm to: " + result);
          sendFCMMessage(result,"새 인연이 도착했습니다.");
        }
        callback();
      }
    });
  
  }, function(err) {
    if( err ) {
      logger.error("processEachEnrollerData err: " + err.toString());
    } else {
      logger.log('processEachEnrollerData successfully');
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
        logger.log("male or both find: " + enrollerUid + " / " + enrollerAge + " / " + minPrefAge + " / " + maxPrefAge + " / " + enrollerGender + " / " + preferredGender + " / " + token);
        
        maleEnrollRef.orderByKey().startAt(minPrefAge).endAt(maxPrefAge).once("value", function(snapshot) {
          logger.log(enrollerUid + "(maleEnroller): " + snapshot.key);
          callback(null, snapshot);
        }, function(err) {
          callback(err, null);
        });
        
      } else {
        callback(null, null);
      }
    }, function(callback){
      if(preferredGender === "female" || preferredGender === "both"){
        logger.log("female or both find: " + enrollerUid + " / " + enrollerAge + " / " + minPrefAge + " / " + maxPrefAge + " / " + enrollerGender + " / " + preferredGender + " / " + token);
        
        femaleEnrollRef.orderByKey().startAt(minPrefAge).endAt(maxPrefAge).once("value", function(snapshot) {
          logger.log(enrollerUid + "(femaleEnroller): " + snapshot.key);
          callback(null, snapshot);
        }, function(err) {
          callback(err, null);
        });
        
      } else {
        callback(null, null);
      }
    }], function(err, results){
      if(err != null) {
        logger.error("findOpponentCandidate err: " + err.toString());
      }
      
      var maleSnapshot = results[0];
      var femaleSnapshot = results[1];
      
      logger.log("start candidate list " + enrollerUid);
      
      if(maleSnapshot != null) {
        generateCandidateList(maleSnapshot, candidates);
      }
      if(femaleSnapshot != null) {
        generateCandidateList(femaleSnapshot, candidates);
      }

      logger.log("end candidate list " + enrollerUid);

      parentCallback(null, candidates);
    });
  }, function(candidates, secondParentCallback){
    logger.log("start filter candidate list " + enrollerUid);
    async.each(candidates, function(candidate, eachCallback){
      logger.log("filter candidate: " + candidate + " / " + enrollerUid + " / " + enrollerAge);

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
          logger.error("findOpponentCandidate err: " + err.toString());
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
        && !proposeData.child(candidate).exists()
        && enrollerUid != candidate) {
          logger.log("accept range & dup: " + candidate);
          filteredCandidates.push(candidate);
        } else {
          logger.log("rejected range & dup: " + candidate);
        }
        eachCallback();
      });

    }, function(err){
      if(err != null) {
        logger.error("findOpponentCandidate err: " + err.toString());
      }      
      logger.log("end filter candidate list: " + enrollerUid + " / " + filteredCandidates);
      secondParentCallback(null, filteredCandidates);
    });
  }],function(err, result) {
    if(err != null) {
      logger.error("findOpponentCandidate err: " + err.toString());
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
  logger.log("foreach end: " + candidates);
}

function chooseThreePropose(candidates, enrollerUid, token, callback) {
  var results = [];
  
  if(candidates != null) {
    for (var i = 0; i < 3; i++) {
      if(candidates.length <= 0) {
        break;
      }
      var pick = Math.floor(Math.random() * candidates.length);
      logger.log("pick: " + pick + " / " + candidates.length + " / " + candidates[pick]);
      results.push(candidates[pick])
      candidates.splice(pick, 1);
    }
    
    for (var i = 0; i < results.length; i++) {
      proposeRef.child(enrollerUid + "/" + results[i]).set({
        proposedAt: admin.database.ServerValue.TIMESTAMP,
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
  }, PROPOSE_TIME);

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
    logger.log("getIntervalByNoon tomorrow: " + tomorrowNoon + " / " + tomorrowNoon.getTime() + " / " + today.getTime());
    return tomorrowNoon.getTime() - today.getTime();
  } else {
    var todayNoon = new Date(today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(), today.getMinutes()+1, 0, 0);
      // 12, 0, 0, 0);
    logger.log("getIntervalByNoon today: " + todayNoon + " / " + todayNoon.getTime() + " / " + today.getTime());
    return todayNoon.getTime() - today.getTime();
  }
}

function removePreviousDate() {
  userRef.once('value', function(snapshot) {
    snapshot.forEach(function(child) {
      child.forEach(function(grandChild) {
        if (grandChild.key == 'preferredDate') {
          grandChild.ref.orderByValue().once('value', function(snapshot) {
            logger.log("-----------------------------");
            var newDate = [];
            snapshot.forEach(function(child) {
              var today = new Date();
              var d = new Date(child.val());
              if(d.getTime() > today.getTime()) {
                newDate.push(child.val());
              }            
            });
            
            logger.log(newDate);

            grandChild.ref.set(newDate);
            if(newDate.length == 0) {
              child.ref.child("userStatus").set("Disenrolled");
            }
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
  }, PROPOSE_TIME );

}, getIntervalByMidNight() );

function getIntervalByMidNight() {
  var today = new Date();
  
  var tomorrowNoon = new Date(today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
    0, 0, 0, 0);
  logger.log("getIntervalByMidNight tomorrow: " + tomorrowNoon + " / " + tomorrowNoon.getTime() + " / " + today.getTime());
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
      logger.log("Successfully sent with response: ", response);
    })
    .catch(function(err){
      logger.log("Something has gone wrong!");
      logger.error(err);
    });
}

userRef.on("child_removed", function(snapshot) {
  logger.log("child_removed: " + snapshot.val());
});

var timer = blocked(function(ms) {
                logger.log("Blocked");
                process.exit(1);
            });
clearInterval(timer);