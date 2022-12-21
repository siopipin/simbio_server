var request_api = require('request')
const variables = require('../../variables')
const conn = require('./db')

exports.sendNotif = (title, body, tokens)=>{
    request_api({
        method : 'POST',
        url : 'https://fcm.googleapis.com/fcm/send',
        headers : {
            'Content-type' : 'application/json',
            'Authorization' : 'key=AAAAoZK9UUU:APA91bFIVXNXYtQwOyMwsF81IkRz1saWOQC8vk9Qyd_022lnVHTUkgLJIY7V0IpUJdo1FbYRetMcPJ6BxbAppsdGLr_1a-nMkAl-uiiaikZuyjysJRt5cQcH_sTK8fLAF6kGQj8yI1T9'
        },
       body : JSON.stringify({
        "notification": {
            "title" : title,
            "body" : body
        },
        "registration_ids" : tokens
       })
    }, function(result){ 
        console.log('Result push notif ', result)
       
    })
}

exports.sendMessageTopic = (topic, title, message)=>{
  console.log(topic)
  request_api({
    url: "https://fcm.googleapis.com/fcm/send",
    method: "POST",
    headers: {
      "Content-Type": " application/json",
      Authorization: variables.tokenfcm
    },
    body: JSON.stringify({
      notification: {
        title: title,
        body: message,
        content_available: true,
        priority: "high",
        sound: "default"
      },
      to : "/topics/" + topic
    })
  },
    function (error, response, body) {
      if (error) {
        console.error(error, response, body);
      } else if (response.statusCode >= 400) {
        console.error(
          "HTTP Error: " +
          response.statusCode +
          " - " +
          response.statusMessage +
          "\n" +
          body
        );
      } else {
        console.log("Done!");
      }
    }
  );
}

function sendMessageUser(deviceId, message, title, idorder, id, idproduct, customer, pasien){
    request_api({
      url: "https://fcm.googleapis.com/fcm/send",
      method: "POST",
      headers: {
        "Content-Type": " application/json",
        Authorization: variables.tokenfcm
      },
      body: JSON.stringify({
        notification: {
          title: title,
          body: message,
          content_available: true,
          priority: "high",
          sound: "default"
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          status: "ORDER",
          datas: [id, idorder, idproduct, customer, pasien, "ORDER"]
        },
        to: deviceId
      })
    },
      function (error, response, body) {
        if (error) {
          console.error(error, response, body);
        } else if (response.statusCode >= 400) {
          console.error(
            "HTTP Error: " +
            response.statusCode +
            " - " +
            response.statusMessage +
            "\n" +
            body
          );
        } else {
          console.log("Done!");
        }
      }
    );
}

exports.sendMessageToUser = (deviceId, message, title, idorder, id, idproduct, customer, pasien)=>{
    sendMessageUser(deviceId, message, title, idorder, id, idproduct, customer, pasien)
}

exports.finishJob = (id_jobdesk)=>{
    conn.query("select id_order from tbl_jobdesk where id = '" + id_jobdesk + "'", (err, row)=>{
        var id_order = row[0].id_order
        conn.query("select a.nama_pasien, b.token, b.nama, a.id from tbl_order a, tbl_customers b where b.id = a.id_customer and a.id_order = '" + id_order + "'", (err, rw)=>{
            var id = rw[0].id
            var nama = rw[0].nama
            var token = rw[0].token
            var nama_pasien = rw[0].nama_pasien

            sendMessageUser(token, "Order #" + id_order + " telah selesai dikerjakan", "Order Selesai", id_order, id, '', nama, nama_pasien)
        })
    })
}

exports.finishOrder = (id)=>{
    conn.query("select a.nama_pasien, a.id_order, b.token, b.nama, a.id from tbl_order a, tbl_customers b where b.id = a.id_customer and a.id = '" + id + "'", (err, rw)=>{
        var id = rw[0].id
        var id_order = rw[0].id
        var nama = rw[0].nama
        var token = rw[0].token
        var nama_pasien = rw[0].nama_pasien

        sendMessageUser(token, "Order #" + id_order + " telah selesai dikerjakan", "Order Selesai", id_order, id, '', nama, nama_pasien)
    })
}
