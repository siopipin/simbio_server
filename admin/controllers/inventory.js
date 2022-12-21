const conn = require('./db')

function formatDate(date) {
    var dt = new Date(date)
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

exports.data_barang = (req, res)=>{
    conn.query("select a.id, a.id_kategori, a.nama, a.keterangan, a.qty, a.satuan, a.date, b.nama as kategori from tbl_barang a LEFT JOIN tbl_kategori_barang b ON a.id_kategori = b.id order by a.id desc", (err, rows)=>{
        res.json(rows)
    })
}

exports.barang_baru = (req, res)=>{
    var data = req.body
    conn.query("INSERT INTO tbl_barang SET ?", data, (err, result)=>{
        if(err) res.status(500).json({msg : 'Error on query'})
        else{
            if(data.qty > 0){
                var hist = {
                    id_barang : result.insertId,
                    qty : data.qty,
                    keterangan : 'Stok awal'
                }
                conn.query("INSERT INTO tbl_barang_history SET ?", hist, (err, rslt)=>{
                    res.json(result)
                })
            }else{
                res.json(result)
            }
        }
    })
}

exports.hapus_barang = (req, res)=>{
    var id = req.params.id
    conn.query("DELETE from tbl_barang where id = " + id, (err, result)=>{
        conn.query("DELETE from tbl_barang_history where id_barang = " + id, (err, rlst)=>{})
        conn.query("DELETE from tbl_barang_masuk where id_barang = " + id, (err, rlst)=>{})
        conn.query("DELETE from tbl_barang_keluar where id_barang = " + id, (err, rlst)=>{})
        res.json(result)
    })
}

exports.update_barang = (req, res)=>{
    var data = req.body
    var id = data.id 
    delete data.id
    conn.query("UPDATE tbl_barang SET ? where id = " + id, data, (err, result)=>{
        if(err) res.status(500).json({msg : 'Error on query'})
        else res.json(result)
    })
}

exports.history_barang = (req, res)=>{
    var id = req.body.id
    var bulan = req.body.bulan
    var tahun = req.body.tahun

    conn.query("select a.id, a.keterangan, a.qty, a.date, b.nama, b.satuan from tbl_barang_history a, tbl_barang b where b.id = a.id_barang and a.id_barang = " + id + " and month(a.date) = " + bulan + " and year(a.date) = " + tahun + " order by a.id asc", (err, rows)=>{
        res.json(rows)
    })
}

exports.simpan_barang_masuk = (req, res)=>{
    var data = req.body
    conn.query("INSERT INTO tbl_barang_masuk SET ?", data, (err, result)=>{
        if(err) res.status(400).json({msg : 'Error on query'})
        else{
            var hist = {
                id_barang : data.id_barang,
                id_masuk : result.insertId,
                qty : data.qty,
                keterangan : data.keterangan
            }
            conn.query("INSERT INTO tbl_barang_history SET ?", hist, (err, rslt)=>{})
            conn.query("UPDATE tbl_barang set qty = qty + " + data.qty + " where id = " + data.id_barang, (err, rlst)=>{
                res.json(result)
            })
        }
    })
}

exports.history_barang_masuk = (req, res)=>{
    conn.query("select a.id, a.id_barang, b.nama, a.qty, a.harga, a.date from tbl_barang_masuk a, tbl_barang b where b.id = a.id_barang order by a.id desc limit 10", (err, rows)=>{
        res.json(rows)
    })
}

exports.hapus_barang_masuk = (req, res)=>{
    var data = req.body
    conn.query("DELETE FROM tbl_barang_masuk where id = " + data.id, (err, result)=>{
        conn.query("update tbl_barang set qty = qty - " + data.qty + " where id = " + data.id_barang, (err, rlst)=>{
            conn.query("delete from tbl_barang_history where id_masuk = " + data.id, (err, rslt)=>{})
            res.json(result)
        })
    })
}

exports.simpan_barang_keluar = (req, res)=>{
    var data = req.body
    conn.query("INSERT INTO tbl_barang_keluar SET ?", data, (err, result)=>{
        if(err) res.status(400).json({msg : 'Error on query'})
        else{
            var hist = {
                id_barang : data.id_barang,
                id_keluar : result.insertId,
                qty : data.qty * -1,
                keterangan : data.keterangan
            }
            conn.query("INSERT INTO tbl_barang_history SET ?", hist, (err, rslt)=>{})
            conn.query("UPDATE tbl_barang set qty = qty - " + data.qty + " where id = " + data.id_barang, (err, rlst)=>{
                res.json(result)
            })
        }
    })
}

exports.history_barang_keluar = (req, res)=>{
    conn.query("select a.id, a.id_barang, b.nama, a.keterangan, a.qty, a.date from tbl_barang_keluar a, tbl_barang b where b.id = a.id_barang order by a.id desc limit 10", (err, rows)=>{
        res.json(rows)
    })
}

exports.hapus_barang_keluar = (req, res)=>{
    var data = req.body
    conn.query("DELETE FROM tbl_barang_keluar where id = " + data.id, (err, result)=>{
        conn.query("update tbl_barang set qty = qty + " + data.qty + " where id = " + data.id_barang, (err, rlst)=>{
            conn.query("delete from tbl_barang_history where id_keluar = " + data.id, (err, rslt)=>{})
            res.json(result)
        })
    })
}

exports.report_pembelian = (req, res)=>{
    var start_d = formatDate(req.body.mulai) + ' 00:00:00'
    var end_d = formatDate(req.body.akhir) + ' 23:59:59'
    var where = ""
    if(req.body.id_barang){
        where = " and a.id_barang = " + req.body.id_barang
    }

    conn.query("select a.id, a.qty, a.harga, (a.qty * a.harga) as total, a.date, b.nama, b.satuan, a.supplier, a.keterangan from tbl_barang_masuk a, tbl_barang b where b.id = a.id_barang and a.date>='" + start_d + "' and a.date<='" + end_d + "'" + where + " order by a.id asc", (err, rows)=>{
        res.json(rows)
    })
}

exports.get_kategori_barang = (req, res)=>{
    conn.query("SELECT * FROM tbl_kategori_barang ORDER BY ID DESC", (err, rows)=>{
        res.json(rows)
    })
}

exports.simpan_kategori = (req, res)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_kategori_barang SET ?", data, (err, result)=>{
        res.json(result)
    })
}

exports.hapus_kategori = (req, res)=>{
    var id = req.params.id
    conn.query("DELETE FROM tbl_kategori_barang WHERE id = " + id, (err, result)=>{
        res.json(result)
    })
}