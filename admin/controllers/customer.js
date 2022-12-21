const conn = require('./db')
const async = require('async')

function padNumber(value) {
    if (!isNaN(value)) {
        return `0${value}`.slice(-2);
    } else {
        return '';
    }
}

exports.get_customer = (req, res, next) => {
    conn.query("select a.id, a.nama, a.email, a.no_hp, a.alamat, a.poin, b.nama as kota, a.kode, a.aktif, c.nama as level_text, a.level from tbl_customers a LEFT JOIN tbl_level_customer c ON a.level = c.id LEFT JOIN tbl_kota b ON a.id_kota = b.id order by a.nama asc", (err, rows) => {
        res.json(rows);
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

exports.get_customer_single = (req, res, next) => {
    var id = req.params.id
    conn.query("select a.id, a.nama, a.id_kota, a.email, a.no_hp, a.alamat, a.level, b.nama as level_text from tbl_customers a LEFT JOIN tbl_level_customer b ON a.level = b.id where a.id = " + id, (err, row) => {
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


exports.get_summary_data = (req, res)=>{
    var id = req.params.id 

    async.parallel({
        order : (cb)=>{
            conn.query("select count(id) as jumlah, sum(total + extra_charge + ongkir - (total * diskon*0.01) - poin) as nilai from tbl_order where id_customer = " + id, (err, row)=>{
                cb(null, row[0])
            })
        },
        poin : (cb)=>{
            conn.query("select poin from tbl_customers where id = " + id, (err, row)=>{
                var poin = row[0].poin
                conn.query("select sum(poin) as total from tbl_history_poin where flag = 1 and id_customer = " + id, (err, rows)=>{
                    var klaim = rows[0].total
                    var pakai = poin - klaim
                    cb(null, {klaim : klaim, pakai : pakai})
                })
            })
            
        }
    }, (error, result)=>{
        res.json(result)
    })
}

exports.get_pie_chart_product = (req, res, next)=>{
    var id = req.params.id 
    conn.query("select b.id_bahan, c.nama as nama_product, count(a.id) as jumlah from tbl_order_detail a, tbl_product b, tbl_bahan c, tbl_order d where a.id_order = d.id and d.id_customer = " + id + " and c.id = b.id_bahan and b.id = a.id_product group by b.id_bahan", (err, rows)=>{
        res.json(rows);
    })
}

var bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agus', 'Sep', 'Okt', 'Nov', 'Des']

exports.get_chart_orders = (req, res, next)=>{
    var id = req.params.id
    var year = new Date().getFullYear();
    var month = new Date().getMonth()
    var tgl = []
    for(var i = 0; i<=11; i++){
        var dt = new Date(year, month - i, 1)
        tgl.push({month : dt.getMonth() + 1, year : dt.getFullYear()})
    }
    var items = [];
    async.eachSeries(tgl, (item, cb)=>{
        conn.query("select a.id_order, a.posisi_gigi, count(distinct a.posisi_gigi) as jlh from tbl_order_detail a, tbl_order b where a.id_order = b.id and b.id_customer = " + id + " and month(b.tanggal)=" + item.month + " and year(b.tanggal)=" + item.year + " group by a.id_order, a.posisi_gigi", (err, row)=>{
            items.unshift({periode : bln[item.month-1], total : row.length})
            cb(null)
        })
    }, error=>{
        res.json(items);
    })
}


exports.history_poin = (req, res)=>{
    var id = req.params.id 

    conn.query("select * from tbl_history_poin where id_customer = " + id + " and poin <> 0 order by date desc limit 100", (err, rows)=>{
        res.json(rows)
    })
}