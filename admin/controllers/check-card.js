const conn = require('./db')

exports.get_data = (req, res)=>{
    conn.query("SELECT a.id, b.nama as customer, a.pasien, a.status, a.date, a.lanjut from tbl_check_card a LEFT JOIN tbl_customers b ON a.id_customer = b.id order by a.id desc", (err , rows)=>{
        res.json(rows)
    })
}

exports.create_check = (req, res)=>{
    var data = req.body
    var data_images = []
    if(req.files.foto_oklusi){
        //data.foto_oklusi = req.files.foto_oklusi[0].filename
        for(let item of req.files.foto_oklusi){
            data_images.push({
                id_check : 0,
                image : item.filename,
                jenis : 'oklusi'
            })
        }
    }
    if(req.files.foto_warna){
        //data.foto_warna = req.files.foto_warna[0].filename
        for(let item of req.files.foto_warna){
            data_images.push({
                id_check : 0,
                image : item.filename,
                jenis : 'warna'
            })
        }
    }
    if(req.files.foto_profile){
        //data.foto_profile = req.files.foto_profile[0].filename
        for(let item of req.files.foto_profile){
            data_images.push({
                id_check : 0,
                image : item.filename,
                jenis : 'profile'
            })
        }
    }

    delete data.foto_oklusi
    delete data.foto_warna
    delete data.foto_profile

    conn.query("INSERT INTO tbl_check_card SET ?", data, (err, result)=>{
        if(err) res.status(500).json({msg : 'Error'})
        else{
            let data_bulk = []
            for(let item of data_images){
                data_bulk.push(
                    [0, result.insertId, item.image, item.jenis]
                )
            }
            if(data_bulk.length>0){
                conn.query("INSERT INTO tbl_check_card_images (id, id_check, image, jenis) VALUES ?", [data_bulk], (err,rslt)=>{
                
                })
            }
            res.json(result)
        }
    })
}

exports.single_data = (req, res)=>{
    var id = req.params.id
    var p = "" 
    for(let i = 1; i<=12; i++) p+= 'p' + i + ',' + 'k' + i + ','
    conn.query("select a.id, a.pasien, a.id_customer," + p + " a.pesan, a.date, a.status, b.nama as customer from tbl_check_card a LEFT JOIN tbl_customers b ON a.id_customer = b.id where a.id = " + id, (err, row)=>{
        conn.query("select * from tbl_check_card_images where id_check = " + id, (err, rows)=>{
            item = row[0]
            item.images = rows
            res.json(item)
        })
        
    })
}

exports.hapus_ = (req, res)=>{
    var id = req.params.id 
    conn.query("DELETE from tbl_check_card where id = " + id, (err, result)=>{
        conn.query("DELETE from tbl_check_card_images where id_check = " + id, (err, rlst)=>{})
        res.json(result)
    })
}

exports.update_check = (req, res)=>{
    var data = req.body
    
    var id = data.id
    delete data.id 

    conn.query("UPDATE tbl_check_card SET ? where id = " + id, data, (err, result)=>{
        if(err) res.status(500).json({msg : 'Error'})
        else res.json(result)
    })
}

exports.upload_images = (req, res)=>{
    var id_check = req.body.id_check
    var jenis = req.body.jenis
    var data = []
    if(req.files){
        for(let item of req.files){
            data.push(
                [id_check, item.filename, jenis]
            )
        }
        conn.query("INSERT INTO tbl_check_card_images (id_check, image, jenis) VALUES ?", [data], (err,result)=>{
                let rslt = []
                var id = result.insertId
                for(let item of data){
                    rslt.push({
                        id : id,
                        id_check : id_check,
                        image : item[1],
                        jenis : jenis
                    })
                    id += 1
                }
                res.json(rslt)
        })
    }else{
        res.status(400).json({msg : 'Upload failed'})
    }
}

exports.hapus_images = (req, res)=>{
    var id = req.params.id 
    conn.query("DELETE from tbl_check_card_images WHERE id = " + id, (err, result)=>{
        if(err) res.status(400).json({msg : 'Delete file failed'})
        else res.json(result)
    })
}

exports.set_lanjut = (req, res)=>{
    var id = req.body.id
    var lanjut = req.body.lanjut
    conn.query("UPDATE tbl_check_card set lanjut = " + lanjut + " where id = " + id, (err, result)=>{
        res.json(result)
    })
}

exports.get_quality_control = (req, res)=>{
    conn.query("select a.id, a.id_order, a.nama_pasien, b.nama as customer, a.tanggal_selesai, c.warranty from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id LEFT JOIN tbl_qc c ON a.id = c.id_order WHERE a.status = 2 and (not a.tanggal_selesai is NULL) order by a.tanggal_selesai DESC",  (err, rows)=>{
        res.json(rows)
    })
}

exports.get_quality_control_single = (req, res)=>{
    var id = req.params.id
    conn.query("select b.id, a.nama_pasien, c.nama as customer, a.id_order, b.anatomi, b.surface, b.shade, b.fitting, b.occlusion, b.warranty, b.team from tbl_order a LEFT JOIN tbl_qc b ON a.id = b.id_order LEFT JOIN tbl_customers c ON a.id_customer = c.id WHERE a.id = " + id , (err, row)=>{
        res.json(row[0])
    })
}

exports.simpan_qc = (req, res)=>{
    var data = req.body
    conn.query("REPLACE INTO tbl_qc SET ?", data, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}