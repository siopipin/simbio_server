const conn = require('./db')

exports.get_products = (req, res, next)=>{
    conn.query("select a.id, a.nama, a.id_bahan, a.harga, a.durasi, a.poin, b.nama as bahan from tbl_product a, tbl_bahan b where b.id = a.id_bahan order by b.nama asc", (err, rows)=>{
        res.json(rows);
    })
}

exports.get_bahan = (req, res, next)=>{
    conn.query("select * from tbl_bahan order by nama asc",(err, rows)=>{
        res.json(rows);
    })
}

exports.simpan_bahan = (req, res, next)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_bahan SET ?", data, (err,result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.hapus_bahan = (req, res, next)=>{
    var id = req.params.id
    conn.query("DELETE from tbl_bahan WHERE id = " + id, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.simpan_product = (req, res, next)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_product SET ?", data, (err, result)=>{
        res.json(result);
    })
}

exports.hapus_product = (req, res, next)=>{
    var id = req.params.id
    conn.query("DELETE from tbl_product WHERE id = " + id, (err, result)=>{
        conn.query("DELETE from tbl_master_proses where id_product = " + id, (er, rslt)=>{})
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.get_product_single = (req, res, next)=>{
    var id = req.params.id
    conn.query("select a.id, a.nama, b.nama as bahan from tbl_product a, tbl_bahan b where b.id = a.id_bahan and a.id = " + id, (err, row)=>{
        if(row.length>0) res.json(row[0])
        else res.json({})
    })
}

exports.get_product_aktivitas = (req, res, next)=>{
    var id = req.params.id
    conn.query("select * from tbl_master_proses where id_product = " + id + " order by nomor asc", (err, rows)=>{
        res.json(rows);
    })
}

exports.simpan_product_aktivitas = (req, res, next)=>{
    conn.query("INSERT INTO tbl_master_proses SET ?", req.body, (err, result)=>{
        res.json(result)
    })
}

exports.update_product_aktivitas = (req, res, next)=>{
    var id = req.params.id
    conn.query("update tbl_master_proses set ? where id = " + id, req.body, (err, result)=>{
        res.json(result)
    })
}

exports.hapus_product_aktivitas = (req, res, next)=>{
    var id = req.params.id
    conn.query("DELETE from tbl_master_proses WHERE id =" + id, (err,result)=>{
        res.json(result);
    })
}

exports.get_list_voucher = (req, res, next)=>{
    conn.query("select * from tbl_voucher order by id desc", (err, rows)=>{
        res.json(rows)
    })
}

exports.simpan_voucher = (req, res, next)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_voucher SET ?", data, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.hapus_voucher = (req, res, next)=>{
    var id = req.params.id
    conn.query("DELETE from tbl_voucher WHERE id = " + id, (err,result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.get_bahan_estimasi = (req, res, next)=>{
    conn.query("select * from tbl_bahan_estimasi", (err, rows)=>{
        res.json(rows);
    })
}

exports.update_bahan_estimasi = (req, res, next)=>{
    var id = req.params.id
    var data = req.body;
    conn.query("update tbl_bahan_estimasi set ? where id = " + id,  data, (err, result)=>{
        res.json(result)
    })
}

exports.hapus_bahan_estimasi = (req, res, next)=>{
    var id = req.params.id
    conn.query("DELETE FROM tbl_bahan_estimasi WHERE id = " + id, (err, result)=>{
        res.json(result);
    })
}

exports.simpan_bahan_estimasi = (req, res, next)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_bahan_estimasi SET ?", data, (err, result)=>{
        res.json(result)
    })
}

exports.get_hari_libur = (req, res)=>{
    conn.query("select * from tbl_libur order by tanggal desc", (err, rows)=>{
        res.json(rows)
    })
}

exports.hapus_hari_libur = (req, res)=>{
    var id = req.params.id
    conn.query("delete from tbl_libur where id = " + id, (err, result)=>{
        res.json(result)
    })
}

exports.simpan_hari_libur = (req, res)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_libur SET ?", data, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}