const conn = require('./db')
const async = require('async')
const variables = require('../../variables')
const messaging = require('./messaging')

function formatDate(date) {
    var dt = new Date(date)
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

exports.get_jobdesk = (req, res)=>{
    var tanggal = formatDate(new Date())

    conn.query("select a.id, a.id_order, a.tgl_masuk, a.tgl_target_selesai, a.selesai, a.team, b.nama_pasien, c.nama as dokter, a.keterangan from tbl_jobdesk a, tbl_order b, tbl_customers c where b.id_order = a.id_order and c.id = b.id_customer and a.selesai = 0 order by a.tgl_target_selesai asc, a.tgl_masuk asc", (err,rows)=>{
        var items = []

        async.eachSeries(rows, (item, cb)=>{
            conn.query("select * from tbl_jobdesk_detail where id_jobdesk = '" + item.id + "' and tanggal is NULL order by id_step asc limit 1", (err, rw)=>{
                item.steps = rw
                items.push(item)
                cb(null)
            })
        }, error=>{
            res.json(items)
        })
    })
}

exports.update_jobdesk = (req, res)=>{
    var data = req.body.data
    
    var tanggal = formatDate(new Date())
    async.eachSeries(data, (item, cb)=>{
        conn.query("update tbl_jobdesk_detail set ? where id = " + item.id_detail, {tanggal : tanggal, id_pegawai : item.id_pegawai} , (err, result)=>{
            if(item.id_step == 6){
                conn.query("update tbl_jobdesk set selesai = 1 where id = '" + item.id_jobdesk + "'", (err, rslt)=>{
                    messaging.finishJob(item.id_jobdesk)
                    cb(null)
                })
            }else cb(null)
        })
    }, error=>{
        res.json({status : 'ok'})
    })
}

exports.update_keterangan = (req, res)=>{
    var id = req.body.id
    data = {keterangan : req.body.keterangan}
    conn.query("UPDATE tbl_jobdesk SET ? where id = '" + id + "'", data, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.hapus_ = (req, res)=>{
    var id =req.body.id
    conn.query("delete from tbl_jobdesk where id = '" + id + "'", (err, rlst)=>{
        conn.query("delete from tbl_jobdesk_detail where id_jobdesk = '" + id + "'", (err, rslt)=>{})
        res.json(rlst)
    })
}

var labels = [
    "Model processing",
    "Scan",
    "Design",
    "Milling",
    "Fitting Contouring",
    "Staining"
  ]

exports.progress = (req, res)=>{
    var id_order = req.body.id_order
    conn.query("select * from tbl_jobdesk where id_order = '" + id_order + "'", (err, rows)=>{
        async.eachSeries(rows, (item, cb)=>{
            item.nama_team = variables.teams[item.team-1].nama
            conn.query("select a.id_step, a.tanggal, a.id_pegawai, b.nama as pegawai from tbl_jobdesk_detail a LEFT JOIN tbl_pegawai b ON a.id_pegawai = b.id where a.id_jobdesk = '" + item.id + "' order by a.id asc", (err, row)=>{
                var details = row
                for(let itm of details) itm.nama_step = labels[itm.id_step-1]
                item.details = details
                cb(null)
            })
        }, error=>{
            res.json(rows)
        })
    })
}

exports.get_evaluasi = (req, res)=>{
   
    conn.query("select distinct a.id, a.id_order, a.tanggal as tgl_masuk, a.tanggal_selesai as tgl_selesai, b.tgl_target_selesai, b.team, c.nama as customer from tbl_order a LEFT JOIN tbl_jobdesk b ON a.id_order = b.id_order LEFT JOIN tbl_customers c ON a.id_customer = c.id LEFT JOIN tbl_evaluasi d ON d.id_order = a.id WHERE a.status_invoice = 2 and a.tanggal >= '2022-01-01' and d.id is null", (err, rows)=>{
        var items = []
        for(let item of rows){
            let selected = items.filter(it=> it.id == item.id)
            if(selected.length>0){
                let index = items.indexOf(selected[0])
                items[index].nama_team += item.team ? ", " + variables.teams[item.team-1].nama : ''
            }else{
                item.nama_team = item.team ? variables.teams[item.team-1].nama : ''
                items.push(item)
            }
        }
        res.json(items)
    })
    /*conn.query("select distinct a.id_order, a.tgl_masuk, a.team, b.id, c.nama as customer, d.tanggal as tgl_selesai, a.tgl_target_selesai, datediff('" + tanggal + "', d.tanggal) as hari from tbl_jobdesk a, tbl_order b, tbl_customers c, tbl_jobdesk_detail d WHERE b.id_order = a.id_order and c.id = b.id_customer and d.id_jobdesk = a.id and a.selesai = 1 and d.id_step = 6 and a.followup = 0 and b.status_invoice = 2", (err, rows)=>{
        
    })*/
}

exports.review = (req, res)=>{
    var data = {
        id_order : req.body.id_order,
        rating_warna : req.body.rating_warna,
        rating_fitting : req.body.rating_fitting,
        rating_oklusi : req.body.rating_oklusi,
        rating_anatomi : req.body.rating_anatomi,
        rating_komunikasi : req.body.rating_komunikasi,
        catatan : req.body.catatan
    }

    let images = []
    if(req.files){
        for(let file of req.files) images.push(file.filename)
    }

    conn.query("INSERT INTO tbl_evaluasi SET ?", data, (err, result)=>{
        var id_order = req.body.id_job
        conn.query("update tbl_jobdesk set followup = 1 where id_order = '" + id_order + "'", (err, rlst_)=>{})
        if(err) res.status(400).json(err)
        else{
            var id = result.insertId
            if(images.length<=0) res.json(result)
            else{
                let data_images = []
                for(let image of images) data_images.push([id, image])
                conn.query("INSERT INTO tbl_evaluasi_foto (id_evaluasi, image) VALUES ?", [data_images], (err, rlst)=>{
                    res.json(result)
                })
            }
        }
    })
}

exports.summary_rating = (req, res)=>{
    conn.query("select count(id) as jumlah, avg(rating_warna) as rating_warna, avg(rating_fitting) as rating_fitting, avg(rating_oklusi) as rating_oklusi, avg(rating_anatomi) as rating_anatomi, avg(rating_komunikasi) as rating_komunikasi from tbl_evaluasi", (err, row)=>{
        if(row.length>0){
            let item = row[0]
            if(item.jumlah)
                res.json(item)
            else
                res.json({
                    jumlah : 0,
                    rating_warna : 0,
                    rating_fitting : 0,
                    rating_anatomi : 0,
                    rating_oklusi : 0,
                    rating_komunikasi : 0
                })
        }else{
            res.json({
                jumlah : 0,
                rating_warna : 0,
                rating_fitting : 0,
                rating_anatomi : 0,
                rating_oklusi : 0,
                rating_komunikasi : 0
            })
        }
    })
}


exports.hapus_jadwal = (req, res)=>{
    var data = req.body

    var label = data.label
    var team = data.team

    conn.query("select * from tbl_jadwal where label = '" + label + "' and team = " + team, (err, rows)=>{
        async.eachSeries(rows, (item, cb)=>{
            var dt = {
                id : 0,
                id_order : item.id_order,
                label : item.label,
                id_product : item.id_product,
                bahan : item.bahan,
                tanggal : formatDate(new Date())
            }
            conn.query("INSERT INTO tbl_draft_jadwal SET ?", dt, (err, rslt)=>{
                cb(null)
            })
        }, error=>{
            conn.query("DELETE FROM tbl_jadwal where label = '" + label + "' and team = " + team, (err, rslt)=>{
                conn.query("DELETE from tbl_jobdesk_detail where id_jobdesk = '" + label + "_" + team  + "'", (err, rslt)=>{})
                conn.query("DELETE from tbl_jobdesk where id_order = '" + label + "' and team = " + team, (err, result_)=>{
                    res.json({text : "OK"})
                })
            })
        })
    })
}


exports.hapus_draft_jadwal = (req, res)=>{
    var id = req.body.id_draft

    conn.query("DELETE from tbl_draft_jadwal where id = " + id, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}