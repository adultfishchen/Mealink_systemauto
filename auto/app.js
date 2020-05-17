require("dotenv").config();

var express = require("express");
var app = express();
var MongoClient = require("mongodb").MongoClient;
var similarity = require("compute-cosine-similarity"); //similarity calculation packages
var schedule = require("node-schedule"); //system schedule set packages

var url = "mongodb://localhost:27017/";

//at 13.00 system will clear matched filed.
function scheduleClearCronstyle() {
  schedule.scheduleJob("00 08 17 * * *", function () {
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, db) {
        if (err) {
          console.log("hello");
          throw err;
        }
        var dbo = db.db("mealinktesting_project");
        var users = dbo
          .collection("users")
          .find()
          .toArray(function (err, result) {
            if (err) {
              console.log("hello");
              throw err;
            }
            for (z = 0; z < result.length; z++) {
              dbo
                .collection("users")
                .updateOne({ _id: result[z]._id }, { $set: { match: null } });
            }
            console.log("delete!!");
          });
      }
    );
    console.log("scheduleClearCronstyle:" + new Date());
  });
}

//at 18.00 system will clear matched filed.
function scheduleCronstyle() {
  schedule.scheduleJob("00 09 17 * * *", function () {
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, db) {
        if (err) {
          console.log("hello");
          throw err;
        }
        var userdouble = []; // two-people meal
        var manyusers = []; // multi-people meal
        var dbo = db.db("mealinktesting_project");
        var users = dbo
          .collection("users")
          .find()
          .toArray(function (err, result) {
            if (err) {
              console.log("hello");
              throw err;
            }
            for (a = 0; a < result.length; a++) {
              if (result[a].number === 2) {
                userdouble.push(result[a]);
                for (b = 0; b < userdouble.length; b++) {
                  if (userdouble[b].match === null) {
                    var baseuser = userdouble[b];
                    var basevalue = [];
                    for (
                      c = 0;
                      c < userdouble[b].matchHabies.select.length;
                      c++
                    ) {
                      var value = userdouble[b].matchHabies.select[c] * 1;
                      basevalue.push(value);
                      var e = []; // similarity
                      var d = []; // compuserid
                    }

                    for (f = b + 1; f < userdouble.length; f++) {
                      var compuser = null;
                      if (userdouble[f].match === null) {
                        compuser = userdouble[f]; //to find compuserID
                        var compvalue = [];
                        for (
                          g = 0;
                          g < userdouble[f].matchHabies.select.length;
                          g++
                        ) {
                          var comvalue =
                            userdouble[f].matchHabies.select[g] * 1;
                          compvalue.push(comvalue);
                        }
                        var s2 = similarity(basevalue, compvalue);
                        if (isNaN(s2)) {
                          s2 = 0; //let NaN = 0
                        }
                        d.push(userdouble[f]);                       
                          e.push(s2);
                          console.log("re:" + e);                        
                      }
                    }
                    var ans = Math.max(...e); //get max similarity
                    for (h = 0; h < e.length; h++) {
                      if (e[h] === ans) {
                        compuser = d[h];

                        dbo
                          .collection("users")
                          .updateOne(
                            { _id: baseuser._id },
                            { $set: { match: compuser._id } }
                          );
                        dbo
                          .collection("users")
                          .updateOne(
                            { _id: compuser._id },
                            { $set: { match: baseuser._id } }
                          );
                        break;
                      }
                    }

                    console.log("successful!!");
                  }
                }
              } else {
                manyusers.push(result[a]);
              }
            }

            //manyusers
            for (i = 0; i < manyusers.length; i++) {
              if (manyusers[i].match === null) {
                var mbaseuser = manyusers[i];
                var mbasevalue = [];
                for (j = 0; j < manyusers[i].matchHabies.select.length; j++) {
                  var mvalue = manyusers[i].matchHabies.select[j] * 1;
                  mbasevalue.push(mvalue);
                  var n = []; // similarity
                  var m = []; // compuserid
                }

                for (k = i + 1; k < manyusers.length; k++) {
                  var mcompuser = null;
                  if (manyusers[k].match === null) {
                    mcompuser = manyusers[k];
                    var mcompvalue = [];
                    for (
                      l = 0;
                      l < manyusers[k].matchHabies.select.length;
                      l++
                    ) {
                      var mcomvalue = manyusers[k].matchHabies.select[l] * 1;
                      mcompvalue.push(mcomvalue);
                    }

                    var s3 = similarity(mbasevalue, mcompvalue);
                    if (isNaN(s3)) {
                      s3 = 0;
                    }
                    m.push(manyusers[k]._id);
                    n.push(s3);
                  }
                }
                var mans = [];
                for (o = 0; o < n.length; o++) {
                  mans.push(n[o]);
                }
                mans.sort(function (a, b) {
                  return b - a;
                }); //rearrange similarity by decreasing order

                var mcusermatches = [];
                for (p = 0; p < mans.length; p++) {
                  if (mans[p] > 0) {
                    for (q = 0; q < mans.length; q++) {
                      if (mans[p] === n[q]) {
                        // mcompuser = m[q];
                        mcusermatches.push(m[q]);
                      }
                    }
                    dbo
                      .collection("users")
                      .updateOne(
                        { _id: mbaseuser._id },
                        {
                          $set: {
                            match: [
                              mcusermatches[0],
                              mcusermatches[1],
                              mcusermatches[2],
                            ],
                          },
                        }
                      );
                    dbo
                      .collection("users")
                      .updateOne(
                        { _id: mcusermatches[0] },
                        {
                          $set: {
                            match: [
                              mbaseuser._id,
                              mcusermatches[1],
                              mcusermatches[2],
                            ],
                          },
                        }
                      );
                    dbo
                      .collection("users")
                      .updateOne(
                        { _id: mcusermatches[1] },
                        {
                          $set: {
                            match: [
                              mbaseuser._id,
                              mcusermatches[0],
                              mcusermatches[2],
                            ],
                          },
                        }
                      );
                    dbo
                      .collection("users")
                      .updateOne(
                        { _id: mcusermatches[2] },
                        {
                          $set: {
                            match: [
                              mbaseuser._id,
                              mcusermatches[0],
                              mcusermatches[1],
                            ],
                          },
                        }
                      );
                  }
                }
                break;
              }

              console.log("successful!!");
            }
          });
      }
    );
    console.log("scheduleDoubleCronstyle:" + new Date());
  });
}

// function scheduleFriendCronstyle(){
//   schedule.scheduleJob("00 45 18 * * *", function(){
//     MongoClient.connect(
//       url,
//       { useNewUrlParser: true, useUnifiedTopology: true },
//       function (err, db) {
//         if (err) {
//           console.log("hello");
//           throw err;
//         }
//         var dbo = db.db("mealinktesting_project");
//         var users = dbo
//           .collection("users")
//           .find()
//           .toArray(function (err, result) {
//             if (err) {
//               console.log("hello");
//               throw err;
//             }
//             // console.log(result);
//             // console.log(result[0]);
//             for (y = 0; y < result.length; y++) {
//               if(result[y].friends === null && result[y].match!=null){
//                 dbo
//                 .collection("users")
//                 .updateOne({ _id: result[y]._id }, { $set: { friends: result[y].match } });
//             } else {
//               dbo
//                 .collection("users")
//                 .updateOne({ _id: result[y]._id }, { $addToSet: { "friends":{$each:[result[y].match ]}}} );
//             }
//               }

//                 console.log("Friend Add!!");

//             }
//                 )}
//     );
//       console.log("scheduleClearCronstyle:" + new Date());
//   });
// }

scheduleClearCronstyle();
scheduleCronstyle();
// scheduleFriendCronstyle();
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
