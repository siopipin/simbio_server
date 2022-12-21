const conn = require('../admin/controllers/db')
const express = require('express')
const router = express.Router()
const async = require('async')
const variables = require('../variables')

function formatDate(date) {
    var dt = new Date(date)
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

router.get('/check-level', (req, res)=>{
    conn.query("select id, level, nama from tbl_customers order by id asc", (err, rows)=>{
        var users = rows
        var tanggal = formatDate(new Date())
        async.eachSeries(users, (item, cb)=>{
            var start = '2022-05-01'
            var end = '2022-11-30'

            conn.query("select a.id_order, a.posisi_gigi, count(a.posisi_gigi) as jlh from tbl_order_detail a, tbl_order b where a.id_order = b.id and b.id_customer = " + item.id + " and b.tanggal>='" + start + "' and b.tanggal<'" + end + "' group by a.id_order, a.posisi_gigi", (err, row)=>{
                var jumlah = row.length
                var rata = jumlah/6
                var level = 1
                if(rata>=10) level = 5
                else if(rata>=8) level = 4
                else if(rata>=6) level = 3
                else if(rata>=4) level = 2

                conn.query("update tbl_customers set level = " + level + ", last_check='" + tanggal + " 01:00:00' where id = " + item.id, (err, rlst)=>{
                    item.level = level
                    item.jumlah = rata
                    cb(null)
                })
            })
        }, error=>{
            res.json(users)
        })
    })
})

module.exports = router