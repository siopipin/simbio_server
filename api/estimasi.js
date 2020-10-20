const conn = require('../admin/controllers/db')
const express = require('express')
const router = express.Router()
const async = require('async')

router.post('/', (req, res, next)=>{
    console.log(req.body)
    var bahans = req.body.bahans;
    var tanggal = req.body.tanggal

    var durasi = 0;

    async.eachSeries(bahans, (item, cb)=>{
        conn.query("select * from tbl_bahan_estimasi where id = " + item.id, (err, row)=>{
            var durasi_bahan = row[0].durasi;

            if(item.jumlah > 8) durasi_bahan += 6
            else if(item.jumlah >= 7) durasi_bahan += 4
            else if(item.jumlah >= 5) durasi_bahan += 3
            else if(item.jumlah >= 3) durasi_bahan += 2
            

            conn.query("select * from tbl_durasi_khusus where tanggal_mulai <='" + tanggal + "' and tanggal_selesai>='" + tanggal + "'", (err, rw)=>{
                if(rw.length>0) durasi_bahan += rw[0].jumlah
                durasi += durasi_bahan
                cb(null);
            })
            
        })
    }, error=>{
        var dt = new Date(tanggal)
        var selesai = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + durasi)
        var tmp_tgl = new Date(tanggal);
        for(let i = 1; i<=durasi; i++){
            var d = new Date(tmp_tgl);
            tmp_tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
            if(tmp_tgl.getDay() == 0){
                tmp_tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 2)
            }
            selesai = new Date(tmp_tgl);
        }
        res.json({durasi : durasi, selesai : selesai})
    })
})

router.get('/bahan',(req, res)=>{
    conn.query("select * from tbl_bahan_estimasi", (err, rows)=>{
        res.json(rows);
    })
})

module.exports = router
