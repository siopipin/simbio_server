const messaging = require('./messaging')
const conn = require('./db')

exports.send_notifikasi_topic = (req, res)=>{
    var data = req.body
    messaging.sendMessageTopic(data.target, data.title, data.message)

    var notif = {
        tbl : data.target == 'customer' ? 'customers' : 'pegawai',
        topic : data.target,
        status : 0,
        title : data.title,
        isi : data.message
    }

    conn.query("INSERT INTO tbl_notifikasi SET ?", notif, (err, result)=>{
        res.json({
            ok : true
        })
    })
}