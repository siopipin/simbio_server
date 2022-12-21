const conn = require('./db')
const bcrypt = require('bcryptjs')
const async = require('async')

exports.get_pegawai = (req, res, next) => {
    conn.query("select id, nama, email, privilege, foto from tbl_pegawai order by nama asc", (err, rows) => {
        res.json(rows);
    })
}

exports.get_pegawai_per_privilege = (req, res, next) => {
    var privilege = req.params.privilege
    conn.query("select id, nama from tbl_pegawai where privilege = " + privilege, (err, rows) => {
        res.json(rows);
    })
}

exports.tambah_pegawai = (req, res, next) => {
    var data = req.body
    if (req.file) {
        data.foto = req.file.filename
    }
    bcrypt.hash(data.password, 11, (error, hash) => {
        if (error) {
            res.status(500).json({ error: error })
        } else {
            data.password = hash
            conn.query("INSERT INTO tbl_pegawai SET ?", data, (err, result) => {
                if (err) res.status(400).json(err)
                else res.json(result)
            })
        }
    })
}

exports.hapus_pegawai = (req, res, next) => {
    var id = req.params.id
    conn.query("delete from tbl_pegawai where id = " + id, (err, result) => {
        if (err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.get_pegawai_single = (req, res, next) => {
    var id = req.params.id
    conn.query("select id, nama, privilege, email, foto from tbl_pegawai where id  = " + id, (err, row) => {
        if (row.length <= 0) res.json({})
        else res.json(row[0])
    })
}

exports.edit_pegawai = (req, res, next) => {
    //var data = req.body
    var data = {
        id: req.body.id,
        nama: req.body.nama,
        privilege: req.body.privilege,
        email: req.body.email,
        foto: req.body.foto_old
    }
    if (req.file) {
        data.foto = req.file.filename
    } else data.foto = req.body.foto_old;
    conn.query("UPDATE tbl_pegawai SET ? where id = " + data.id, data, (err, result) => {
        if (err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.total_handle = (req, res) => {
    var id = req.body.id_pegawai
    async.parallel({
        bulan: (cb) => {
            var m = req.body.bulan
            var y = req.body.tahun

            conn.query("select count(a.id) as total from tbl_spk a, tbl_order b where b.id = a.id_order and a.id_pegawai = " + id + " and month(b.tanggal) = " + m + " and year(b.tanggal) = " + y + " group by a.id_pegawai", (err, row) => {
                cb(null, row.length > 0 ? row[0].total : 0)
            })
        }
    }, (error, result) => {
        res.json(result)
    })
}

exports.get_orders_bulanan = (req, res) => {
    var id = req.body.id_pegawai
    var m = req.body.bulan
    var y = req.body.tahun
    conn.query("select a.id, a.id_order, b.nama as customer, a.tanggal, a.tanggal_selesai, c.tanggal as tanggal_target, (select count(e.id) from tbl_order_detail e where e.id_order = a.id) as jumlah from tbl_order a INNER JOIN tbl_jobdesk_detail d ON a.id_order = substr(d.id_jobdesk, 1, length(d.id_jobdesk) - 2) LEFT JOIN tbl_customers b ON a.id_customer = b.id LEFT JOIN tbl_jadwal c ON a.id = c.id_order where d.id_pegawai = " + id + " and ((month(a.tanggal) = " + m + " and year(a.tanggal) = " + y + ") OR (month(a.tanggal_selesai) = " + m + " and year(a.tanggal_selesai) = " + y + ")) group by a.id order by a.tanggal asc", (err, rows) => {
        res.json(rows)
    })
}

exports.get_ratings = (req, res) => {
    var id = req.params.id

    async.parallel({
        summary: (cb) => {
            conn.query("select count(DISTINCT a.id) as total from tbl_order a, tbl_jobdesk_detail b where a.id_order = substr(b.id_jobdesk, 1, length(b.id_jobdesk)-2) and b.id_pegawai = " + id + " group by b.id_pegawai", (err, row) => {
                cb(null, row.length > 0 ? row[0].total : 0)
            })
        },
        rating: (cb) => {
            conn.query("select count(DISTINCT a.id) as jumlah, avg(a.rating_warna) as rating_warna, avg(a.rating_fitting) as rating_fitting, avg(a.rating_oklusi) as rating_oklusi, avg(a.rating_anatomi) as rating_anatomi from tbl_evaluasi a, tbl_jobdesk_detail b, tbl_order c where a.id_order = c.id and c.id_order = substr(b.id_jobdesk, 1, length(b.id_jobdesk)- 2) and b.id_pegawai = " + id, (err, row) => {
                if (row.length > 0) {
                    let item = row[0]
                    if (item.jumlah)
                        cb(null, item)
                    else
                        cb(null, {
                            jumlah: 0,
                            rating_warna: 0,
                            rating_fitting: 0,
                            rating_anatomi: 0,
                            rating_oklusi: 0
                        })
                } else {
                    cb(null,{
                        jumlah: 0,
                        rating_warna: 0,
                        rating_fitting: 0,
                        rating_anatomi: 0,
                        rating_oklusi: 0
                    })
                }
            })
        }
    }, (error, result) => {
        res.json(result)
    })
}