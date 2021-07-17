const conn = require('./db')
const async = require('async')
const messaging = require('./messaging')

exports.request_cashback = (req, res) => {
    var status = req.body.status
    conn.query("select a.id, a.id_customer, a.status, a.nominal, a.date, b.nama as customer from tbl_request_cashback a LEFT JOIN tbl_customers b ON a.id_customer = b.id where a.status = " + status + " order by id desc", (err, rows) => {
        res.json(rows)
    })
}

exports.detail_cashback = (req, res) => {
    var id = req.params.id

    async.parallel({
        detail: (cb) => {
            conn.query("select a.id, a.id_customer, a.status, a.nominal, a.message, a.reply, a.date, b.nama as customer from tbl_request_cashback a LEFT JOIN tbl_customers b ON a.id_customer = b.id where a.id = " + id, (err, rows) => {
                cb(null, rows[0])
            })
        }, images : (cb)=>{
            conn.query("select * from tbl_request_cashback_images where id_request = " + id, (err, rows)=>{
                cb(null, rows)
            })
        }
    }, (err, result)=>{
        res.json(result)
    })
}

exports.proses = (req, res)=>{
    var id = req.body.id
    var data = req.body
    data.id_admin = req.userData.userId
    delete data.id

    conn.query("update tbl_request_cashback set ? where id = " + id, data, (err, result)=>{
        if(data.status == 1){
            conn.query("update tbl_customers set poin = poin + " + data.nominal + " where id =" + data.id_customer, (err, rlst)=>{
                conn.query("select token from tbl_customers where id = " + data.id_customer, (err, rows)=>{
                    var tokens = []
                    for(let itm of rows){
                        tokens.push(itm.token)
                    }

                    messaging.sendNotif('Cashback', 'Selamat kamu mendapat cashback dari SIMBIO! Silahkan cek di aplikasi SiMBIO anda.', tokens)
                })
            })
        }
        res.json(result)
    })
}

exports.reset_cashback = (req, res)=>{
    var data = req.body
    conn.query("update tbl_request_cashback set nominal = NULL, status = 0, reply = '' where id = " + data.id, (err, rslt)=>{
        conn.query("update tbl_customers set poin = poin - " + data.nominal + " where id =" + data.id_customer, (err, rlst)=>{ })

        res.json(rslt)
    })
}