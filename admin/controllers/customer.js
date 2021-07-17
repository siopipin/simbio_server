const conn = require('./db')

function padNumber(value) {
    if (!isNaN(value)) {
        return `0${value}`.slice(-2);
    } else {
        return '';
    }
}

exports.get_customer = (req, res, next) => {
    conn.query("select a.id, a.nama, a.email, a.no_hp, a.alamat, a.poin, b.nama as kota, a.kode, a.aktif from tbl_customers a LEFT JOIN tbl_kota b ON a.id_kota = b.id order by a.nama asc", (err, rows) => {
        res.json(rows);
    })
}

exports.create_kode_reset = (req, res, next)=>{
    var id = req.body.id
    var baru = req.body.baru
    conn.query("select kode_req from tbl_customers where id = " + id, (err, row)=>{
        if(baru || !row[0].kode_req){
            var kode = padNumber(Math.floor(Math.random() * 99)) + '' + padNumber(Math.floor(Math.random() * 99))+ padNumber(id)
            conn.query("update tbl_customers set kode_req = '" + kode + "' where id = " + id, (err, result)=>{
                res.json({kode_req : kode})
            })
        }else{
            res.json({kode_req : row[0].kode_req})
        }
    })
}

exports.get_kota = (req, res, next) => {
    conn.query("select id, concat(type , ' ' , nama) as nama_kota from tbl_kota order by nama asc", (err, rows) => {
        res.json(rows);
    })
}

exports.simpan_customer = (req, res, next) => {
    var data = req.body
    conn.query("INSERT INTO tbl_customers SET ?", data, (err, result) => {
        if (err) res.status(400).json(err)
        else {
            var dt = new Date()
            var kode = padNumber(dt.getDate()) + '' + padNumber(dt.getMonth())+ padNumber(result.insertId)
            kode = kode.slice(-6);
            conn.query("update tbl_customers set kode = '" + kode + "' where id = " + result.insertId, (er, rslt) => { })
            res.json(result)
        }
    })
}

exports.get_customer_single = (req, res, next) => {
    var id = req.params.id
    conn.query("select id, nama, id_kota, email, no_hp, alamat from tbl_customers where id = " + id, (err, row) => {
        if (row.length > 0) res.json(row[0])
        else res.json({})
    })
}

exports.update_customer = (req, res, next) => {
    var data = req.body
    conn.query("update tbl_customers set ? where id = " + data.id, data, (err, result) => {
        if (err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.hapus_customer = (req, res, next) => {
    var id = req.params.id
    conn.query("delete from tbl_customers where id = " + id, (err, result) => {
        if (err) res.status(400).json(err)
        else res.json(result)
    })
}