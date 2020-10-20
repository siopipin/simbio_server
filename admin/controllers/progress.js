const conn = require('./db')
const async = require('async')

exports.get_master_proses_order = (req,res, next)=>{
    var id = req.params.id

    conn.query("select a.id_product, b.nama as nama_product from tbl_order_detail a, tbl_product b where b.id = a.id_product and a.id_order = " + id + " group by a.id_product", (err, rows)=>{
        var items = rows;
        async.eachSeries(rows, (item, cb)=>{
            conn.query("select * from tbl_master_proses where id_product = " + item.id_product + " order by nomor asc", (err, row)=>{
                item.jobs = row
                cb(null)
            })
        }, (error)=>{
            res.json(items);
        })
    })
}

exports.list_order = (req, res, next)=>{
    conn.query("select a.id, a.id_order, a.nama_pasien, a.id_customer, a.status, a.tanggal_target_selesai, b.nama as customer, (select count(id) from tbl_progress where id_order = a.id) as jumlah_jobs, (select count(id) from tbl_progress where id_order = a.id and status = 2) as jumlah_selesai from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id ORDER BY a.id DESC LIMIT 200", (err, rows)=>{

        async.eachSeries(rows, (item, cb)=>{
            conn.query("select count(id) as jumlah from tbl_order_detail where id_order = " + item.id + " group by id_product", (er, rw)=>{
                item.jumlah_product = rw.length;
                item.jumlah_items = 0
                for(let it of rw) item.jumlah_items += it.jumlah
                cb(null)
            })
        }, error=>{
            res.json(rows);
        })
        
    })
}

exports.detail_progress = (req, res, next)=>{
    var id = req.params.id
    var items = {teams : [], progress : []}

    conn.query("select a.id, a.id_order, b.email, a.id_pegawai, a.privilege, b.nama from tbl_spk a, tbl_pegawai b where b.id = a.id_pegawai and a.id_order = " + id + " order by a.privilege desc", (err, rows)=>{
        items.teams = rows
        conn.query("select a.id_product, b.nama as nama_product from tbl_order_detail a, tbl_product b where b.id = a.id_product and a.id_order = " + id + " group by a.id_product", (err, rows)=>{
            items.progress = rows;
            async.eachSeries(items.progress, (item, cb)=>{
                conn.query("select a.id, a.id_order, a.id_product, a.status, a.tanggal_selesai, b.nama as nama_proses, b.approve_spv, b.nomor, c.nama as status_text, d.nama as nama_tekniker from tbl_progress a LEFT JOIN tbl_master_proses b ON a.id_proses = b.id LEFT JOIN tbl_status_progress c ON a.status = c.id LEFT JOIN tbl_pegawai d ON a.tekniker = d.id WHERE a.id_order = " + id + " AND a.id_product = " + item.id_product + " ORDER BY b.nomor ASC", (err, row)=>{
                    item.jobs = row
                    cb(null)
                })
            }, (error)=>{
                res.json(items);
            })
        })
    })

    
}