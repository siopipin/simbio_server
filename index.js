const http = require("http");

const app = require("./app");

const server = http.createServer(app);

const io = require("socket.io")(server);

const conn = require("./admin/controllers/db");
const variables = require("./variables");

const fs = require("fs");
var request = require("request");

function sendMessageToUser(tokenfcm, message, title) {
  console.log(" ini pengguna '"+message.namapengirim+"'")
  var judul = '';
  if(message.namapengirim !== undefined) {
   var tmpjudul = message.namapengirim

   judul = tmpjudul +" di #"+ message.idorder
  } else {  
    judul = "Admin"
  }  

  request(
    {
      url: "https://fcm.googleapis.com/fcm/send",
      method: "POST",
      headers: {
        "Content-Type": " application/json",
        Authorization: variables.tokenfcm
      },
      body: JSON.stringify({
        notification: {
          title: judul,
          body: message.pesan,
          content_available: true,
          priority: "high",
          sound: "default"
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          status: "CHAT",
          datas: [message.channel, message.namacustomer, message.idorder, message.namapasien, message.pesan, "CHAT"]
        },
        to: tokenfcm
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

function notifToPegawai(itm) {
  var query =
    "SELECT tbl_pegawai.token from tbl_order LEFT JOIN tbl_spk on tbl_order.id = tbl_spk.id_order LEFT JOIN tbl_pegawai on tbl_spk.id_pegawai = tbl_pegawai.id WHERE tbl_order.id = ?";
  conn.query(query, [itm.channel], (err, rows) => {
    if (err) {
      console.log("Data tidak ditemukan");
    } else {
      var data = JSON.parse(JSON.stringify(rows));
      data.forEach(function (e) {
        if (e.token === null) {
          console.log("Token tidak ditemukan");
        } else {
          console.log("Sedang kirim pesan ke: " + e.token);
          sendMessageToUser(e.token, itm, "New Message");
        }
      });
    }
  });
}

function notifToCustomer(itm) {
  var query =
    "SELECT tbl_customers.token from tbl_order LEFT JOIN tbl_customers on tbl_order.id_customer = tbl_customers.id WHERE tbl_order.id = ?";
  conn.query(query, [itm.channel], (err, rows) => {
    if (err) {
      console.log("Data tidak ditemukan");
    } else {
      var data = JSON.parse(JSON.stringify(rows));
      data.forEach(function (e) {
        if (e.token === null) {
          console.log("Token tidak ditemukan");
        } else {
          console.log("Sedang kirim pesan ke: " + e.token);
          sendMessageToUser(e.token, itm, "New Message");
        }
      });
    }
  });
}

function notifToCustomerFromGeneral(itm) {
  var query = "SELECT * from tbl_customers WHERE tbl_customers.id = ?";
  conn.query(query, [itm.channel], (err, rows) => {
    if (err) {
      console.log("Data tidak ditemukan");
    } else {
      var data = JSON.parse(JSON.stringify(rows));
      data.forEach(function (e) {
        if (e.token === null) {
          console.log("Token tidak ditemukan");
        } else {
          console.log("Sedang kirim pesan ke: " + e.token);
          sendMessageToUser(e.token, itm, "New Message");
        }
      });
    }
  });
}

function notifToAdminGeneral(itm) {
  var query =
    "SELECT tbl_pegawai.token FROM tbl_chats LEFT JOIN tbl_pegawai on tbl_chats.pengirim = tbl_pegawai.id WHERE tbl_chats.channel = ? and tbl_chats.room = 'general' GROUP BY TOKEN";
  conn.query(query, [itm.channel], (err, rows) => {
    if (err) {
      console.log("Data tidak ditemukan");
    } else {
      var data = JSON.parse(JSON.stringify(rows));
      data.forEach(function (e) {
        if (e.token === null) {
          console.log("Token tidak ditemukan");
        } else {
          console.log("Sedang kirim pesan ke: " + e.token);
          sendMessageToUser(e.token, itm, "New Message");
        }
      });
    }
  });
}

function saveChats(item, fn) {
  var id = item.id;
  item.id = 0;
  console.log(item);

  var msg = {
    pengirim: item.pengirim,
    tbl: item.tbl,
    room: item.room,
    channel: item.channel,
    pesan: item.pesan,
    lampiran: item.lampiran
  };
  var q = conn.query("INSERT INTO tbl_chats SET ? ", msg, (err, rows) => {
    fn({
      id: id,
      insertId: rows.insertId,
      image: item.lampiran ? variables.urls + "images/" + item.lampiran : null
    });
    console.log("Chat saved in database");
  });
  console.log(q.sql);
}

function moveChat(item) {
  var id = item.id;
  console.log("ID : " + id);
  item.pesan = item.pesan + " (*dipindahkan oleh Admin)";
  conn.query(
    "update tbl_chats set pesan = '" +
    item.pesan +
    "', room = '" +
    item.room +
    "', channel = " +
    item.channel +
    " where id =" +
    id,
    (err, row) => {
      console.log("Chat moved");
    }
  );
}

function saveImage(item, socket, fn) {
  var realFile = Buffer.from(item.lampiran.split(",")[1], "base64");
  var name = "chats_" + Date.now() + "_.jpg";
  fs.writeFile(variables.PATH + "/assets/images/" + name, realFile, function (
    err
  ) {
    if (err) console.log(err);
    else {
      //item.lampiran = name;
      var itm = JSON.parse(JSON.stringify(item));
      itm.lampiran = name;

      saveChats(itm, fn);
      socket.broadcast.emit("new message", {
        user: socket.userData,
        message: item,
        date: new Date(),
        date_number: Date.now()
      });

      socket.broadcast.emit("new message " + item.room + " " + item.channel, {
        user: socket.userData,
        message: item,
        date: new Date(),
        date_number: Date.now()
      });
    }
  });
}

io.on("connection", socket => {
  var addUser = false;
  //console.log(socket);
  socket.on("new user", user => {
    if (addUser) return;
    socket.userData = user;
    addUser = true;
  });

  socket.on("new message", (message, fn) => {
    console.log(message.channel);

    if (message.lampiran) {
      console.log("Simpan Gambar");
      saveImage(message, socket, fn);
      if (message.tbl === "pegawai") {
        console.log("Akan mengirim ke customers");
        if (message.room == "general") {
          notifToCustomerFromGeneral(message);
        } else {
          notifToCustomer(message);
        }
      } else if (message.tbl === "customers") {
        console.log("Akan mengirim ke pegawai");
        if (message.room == "general") {
          notifToAdminGeneral(message);
        } else {
          notifToPegawai(message);
        }
      } else {
        console.log("Future tabel");
      }
    } else {
      console.log("Simpan Biasa");
      saveChats(message, fn);
      socket.broadcast.emit("new message", {
        user: socket.userData,
        message: message,
        date: new Date(),
        date_number: Date.now()
      });

      socket.broadcast.emit(
        "new message " + message.room + " " + message.channel,
        {
          user: socket.userData,
          message: message,
          date: new Date(),
          date_number: Date.now()
        }
      );
      if (message.tbl === "pegawai") {
        console.log("Akan mengirim ke customers");
        if (message.room == "general") {
          notifToCustomerFromGeneral(message);
          notifToPegawai(message);
        } else {
          notifToCustomer(message);
        }
      } else if (message.tbl === "customers") {
        console.log("Akan mengirim ke pegawai");
        if (message.room == "general") {
          notifToAdminGeneral(message);
          notifToPegawai(message);
        } else {
          notifToPegawai(message);
        }
      } else {
        console.log("Future tabel");
      }
    }
  });

  socket.on("move message", message => {
    moveChat(message);

    socket.emit("new message", {
      user: socket.userData,
      message: message,
      date: new Date(),
      date_number: Date.now()
    });

    socket.broadcast.emit("new message", {
      user: socket.userData,
      message: message,
      date: new Date(),
      date_number: Date.now()
    });

    socket.broadcast.emit(
      "new message " + message.room + " " + message.channel,
      {
        user: socket.userData,
        message: message,
        date: new Date(),
        date_number: Date.now()
      }
    );
  });
});

process.env.JWT_KEY = "simbio_app_auth";
server.listen(3200, "api.simbio.id", () => {
  console.log(__dirname);
});
