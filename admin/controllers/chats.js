const conn = require('./db')
const async = require('async')
const variables = require('../../variables')

exports.get_recent = (req, res, next) => {
    var userId = req.userData.userId;

    conn.query("select a.channel, a.room, b.id_order as nama, c.nama as customer, b.nama_pasien from tbl_chats a, tbl_order b, tbl_customers c where b.id = a.channel and c.id = b.id_customer and a.room = 'order' group by a.channel", (err, rows) => {
        var items = rows;

        async.eachSeries(items, (item, cb) => {
            conn.query("select id, pesan, lampiran, date from tbl_chats where channel = " + item.channel + " and room = 'order' order by date desc limit 1", (err, row) => {
                item.pesan = row[0].pesan;
                item.date = row[0].date;
                item.date_number = new Date(row[0].date).getTime();
                item.id = row[0].id
                item.lampiran = row[0].lampiran
                cb(null);
            })
        }, error => {
            conn.query("select a.channel, a.room, b.nama from tbl_chats a, tbl_customers b where b.id = a.channel and a.room = 'general' group by a.channel", (err, rows) => {

                async.eachSeries(rows, (item, cb) => {
                    conn.query("select id, pesan, lampiran, date from tbl_chats where channel = " + item.channel + " and room = 'general' order by date desc limit 1", (err, row) => {
                        item.pesan = row[0].pesan;
                        item.date = row[0].date;
                        item.date_number = new Date(row[0].date).getTime();
                        item.id = row[0].id
                        item.lampiran = row[0].lampiran
                        
                        items.push(item);
                        cb(null);
                    })
                }, error => {
                    res.json(items);
                })
            })
        })
    })
}

exports.get_chats = (req, res, next) => {
    var userId = req.userData.userId;
    var channel = req.body.channel
    var room = req.body.room
    conn.query("select * from tbl_chats where channel = " + channel + " and room ='" + room + "' order by date desc limit 20", (err, rows) => {
        var items = []
        async.eachSeries(rows, (item, cb) => {
            conn.query("select nama " + (item.tbl == 'pegawai' ? ", privilege " : "") + " from tbl_" + item.tbl + " where id = " + item.pengirim, (err, row) => {
                if (row.length > 0) {
                    item.nama = row.length > 0 ? row[0].nama : "";
                    if (item.tbl == 'customers') item.privilege = 'Customer';
                    else {
                        if (row[0].privilege == 1) item.privilege = 'Admin'
                        else if (row[0].privilege == 2) item.privilege = 'Tekniker'
                        else if (row[0].privilege == 3) item.privilege = 'Supervisor'
                        else item.privilege = ''
                    }

                }else{
                    item.nama = ''
                    item.privilege = ''
                }

                item.sent = item.pengirim == userId;
                item.success = item.sent;
                item.date_number = new Date(item.date).getTime();
                item.lampiran = item.lampiran ? variables.urls + 'images/' + item.lampiran : null
                items.unshift(item);
                cb(null);
            })
        }, error => {
            res.json(items);
        })
    })
}

exports.move_chat = (req, res, next) => {
    var data = {
        id: req.body.id,
        date: new Date(),
        channel: req.body.channel,
        room: req.body.room
    }

    conn.query("delete from tbl_chats where id = " + id, (err, rows) => {
        res.json(rows);
    })
}

exports.hapus_chat = (req, res, next)=>{
    var id = req.params.id
    conn.query("delete from tbl_chats where id = " + id, (err, rows)=>{
        res.json(rows);
    })
}

exports.get_order_move_chat = (req, res, next)=>{
    var room = req.body.room
    var channel = req.body.channel
    if(room  == 'order'){
        conn.query("select id_customer from tbl_order where id = " + channel, (err, rw)=>{
            if(rw.length>0){
                var id_customer = rw[0].id_customer
                conn.query("select a.id, a.id_order, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.tanggal, a.tanggal_selesai, b.nama as customer from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE b.id = " + id_customer + " AND a.id != " + channel + " ORDER BY a.id DESC LIMIT 200", (err, rows) => {
                    res.json(rows);
                })
            }else res.json([])
        })
    }else{
        conn.query("select a.id, a.id_order, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.tanggal, a.tanggal_selesai, b.nama as customer from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE b.id = " + channel + " ORDER BY a.id DESC LIMIT 200", (err, rows) => {
            res.json(rows);
        })
    }
}


exports.get_galleries = (req, res)=>{
    var room = req.body.room
    var channel = req.body.channel

    conn.query("select * from tbl_chats where room = '" + room + "' and channel = " + channel + " and lampiran is not NULL order by id desc", (err, rows)=>{
        async.eachSeries(rows, (item, cb)=>{
            conn.query("select nama from tbl_" + item.tbl + " where id = " + item.pengirim, (err, row)=>{
                item.nama_pengirim = row[0].nama
                cb(null);
            })
        }, error=>{
            res.json(rows);
        })
    })
}