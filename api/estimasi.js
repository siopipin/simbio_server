const conn = require('../admin/controllers/db')
const express = require('express')
const router = express.Router()
const async = require('async')
const variables = require('../variables')

function formatDate(date) {
    var dt = new Date(date)
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

router.post('/', (req, res, next) => {

    var bahans = req.body.bahans;
    var tanggal = req.body.tanggal
    var team = req.body.team ? req.body.team : 1

    var durasi = 0;

    var jumlah_item = 0
    var max_item = variables.teams[team-1].size
    var tgl_libur = []

    async.eachSeries(bahans, (item, cb) => {
        conn.query("select * from tbl_bahan_estimasi where id = " + item.id, (err, row) => {
            var durasi_bahan = row[0].durasi;

            if (item.jumlah > 8) durasi_bahan += 6
            else if (item.jumlah >= 7) durasi_bahan += 4
            else if (item.jumlah >= 5) durasi_bahan += 3
            else if (item.jumlah >= 3) durasi_bahan += 2

            conn.query("select * from tbl_durasi_khusus where tanggal_mulai <='" + tanggal + "' and tanggal_selesai>='" + tanggal + "'", (err, rw) => {
                if (rw.length > 0) durasi_bahan += rw[0].jumlah

                cb(null);
            })

            if (durasi < durasi_bahan)
                durasi = durasi_bahan

            jumlah_item += item.jumlah

        })
    }, error => {


        var today = formatDate(tanggal)


        conn.query("SELECT a.tanggal, count(a.id) + COALESCE(b.jumlah, 0) as jumlah from tbl_jadwal a LEFT OUTER JOIN tbl_block_jadwal b ON a.tanggal = b.tanggal and a.team = b.team where a.tanggal>='" + today + "' and a.team = " + team + " group by a.tanggal UNION SELECT b.tanggal, count(a.id)+ COALESCE(b.jumlah, 0) as jumlah from tbl_jadwal a RIGHT OUTER JOIN tbl_block_jadwal b ON a.tanggal = b.tanggal and b.team = a.team where b.team = " + team + " and b.tanggal>='" + today + "' group by b.tanggal", (err, rows) => {

            var get_date = false

            conn.query("select * from tbl_libur where tanggal >='" + today + "'", (err, rows2) => {
                for (let item of rows2) {
                    item.tanggal = formatDate(new Date(item.tanggal))
                    tgl_libur.push(item)
                }

                var dt = new Date(req.body.tanggal)
                var selesai = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + durasi)
                var tmp_tgl = new Date(tanggal);
                for (let i = 1; i <= durasi; i++) {
                    var d = new Date(tmp_tgl);
                    tmp_tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
                    /*if (tmp_tgl.getDay() == 0) {
                        tmp_tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 2)
                    }*/


                    while (tgl_libur.filter(it => formatDate(it.tanggal) == formatDate(tmp_tgl)).length > 0 || tmp_tgl.getDay() == 0) {
                        var d = new Date(tmp_tgl);
                        tmp_tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
                    }
                    selesai = new Date(formatDate(tmp_tgl));
                }

                do {

                    var selected = rows.filter(it => formatDate(it.tanggal) == formatDate(selesai))

                    if (selected.length > 0) {
                        var jumlah = selected[0].jumlah + jumlah_item
                        if (jumlah <= max_item) {
                            get_date = true
                        } else {
                            var dt = new Date(selesai)
                            var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                            if (dt2.getDay() == 0) {
                                dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                            }
                            selesai = formatDate(dt2);
                        }
                    } else {
                        while (tgl_libur.filter(it => it.tanggal == selesai).length > 0) {
                            var dt = new Date(selesai)
                            var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                            if (dt2.getDay() == 0) {
                                dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                            }
                            selesai = formatDate(dt2);
                        }

                        var selected2 = rows.filter(it => formatDate(it.tanggal) == selesai)
                        if (selected2.length > 0) {
                            var jumlah = selected2[0].jumlah + jumlah_item
                            if (jumlah <= max_item) {
                                get_date = true
                            } else {
                                var dt = new Date(selesai)
                                var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                                if (dt2.getDay() == 0) {
                                    dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                                }
                                selesai = formatDate(dt2);
                            }
                        } else {
                            get_date = true
                        }

                    }

                } while (!get_date)
                selesai = new Date(selesai);
                var dt = new Date(req.body.tanggal)
                var durasi_fix = (selesai.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)
                res.json({ durasi: Math.floor(durasi_fix), mulai: tanggal, selesai: formatDate(selesai) })

            })

        })


    })
})

router.get('/bahan', (req, res) => {
    conn.query("select * from tbl_bahan_estimasi where id != 5", (err, rows) => {
        res.json(rows);
    })
})

router.get('/teams', (req, res) => {
    res.json(variables.teams)
})

router.get('/reset-jadwal', (req, res)=>{
    conn.query("select tanggal from tbl_jadwal group by tanggal order by tanggal asc", (err, rows)=>{
        async.eachSeries(rows, (item, cb)=>{
            var items = []
            conn.query("select * from tbl_jadwal where tanggal = '" + formatDate(item.tanggal) + "'" , (err, row)=>{
                for(let itm of row){
                    itm.tanggal = formatDate(itm.tanggal)
                    if(items.length>=10){
                        itm.team = 2
                    }
                    items.push([itm.id, itm.id_order, itm.product, itm.label, itm.bahan, itm.team, itm.tanggal])
                }

                conn.query("REPLACE INTO tbl_jadwal (id, id_order, id_product, label, bahan, team, tanggal) VALUES ?", [items], (err, rslt)=>{
                    cb(null)
                })
            })
        }, error=>{
            res.json({error : error})
        })
    })
})

module.exports = router
