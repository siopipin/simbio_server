const conn = require('./db')
const async = require('async')
const variables = require('../../variables')


exports.all_ratings = (req, res)=>{
    var page = req.params.page
    var urutkan = req.params.urutkan
    var orderBy = " a.id desc "
    switch(urutkan){
        case '1': 
            orderBy = " a.id desc "
            break;
        case '2': 
            orderBy = " a.id asc "
            break;
        case '3':
            orderBy = " rating_overall desc "
            break;
        case '4':
            orderBy = " rating_overall asc "
            break;
    }

    var count = 20

    conn.query("select a.id, a.id_order, ((a.rating_warna + a.rating_anatomi + a.rating_fitting + a.rating_oklusi + a.rating_komunikasi) / 5) as rating_overall, a.rating_warna, a.rating_anatomi, a.rating_fitting, a.rating_oklusi, a.rating_komunikasi, b.id_order as no_order, c.nama as customer, a.catatan, a.date from tbl_evaluasi a LEFT JOIN tbl_order b ON a.id_order = b.id LEFT JOIN tbl_customers c ON b.id_customer = c.id order by " + orderBy + " limit " + page + ", " + count, (err, rows)=>{
        let items = rows
        async.eachSeries(items, (item, cb)=>{
            conn.query("select * from tbl_evaluasi_foto where id_evaluasi = " + item.id, (err, row)=>{
                item.images = row
                cb(null)
            })
        }, error=>{
            res.json(items)
        })
    })
}