const conn = require('./db')
const async = require('async')


exports.report_product = (req, res, next)=>{
    var tanggal1 = req.body.tanggal1;
    var tanggal2 = req.body.tanggal2;

    var where_bahan = req.body.id_bahan ? " and b.id_bahan = " + req.body.id_bahan : "";

    conn.query("select a.id_product, b.nama as nama_product, c.nama as bahan, count(a.id) as jumlah from tbl_order_detail a, tbl_product b, tbl_bahan c, tbl_order d where d.tanggal >='" + tanggal1 + "' and d.tanggal<='" + tanggal2 + "' and a.id_order = d.id and b.id = a.id_product and c.id = b.id_bahan " + where_bahan + " group by a.id_product", (err, rows)=>{
        res.json(rows);
    })
}

exports.report_invoice_detail = (req, res, next)=>{
    var tanggal1 = req.body.tanggal1;
    var tanggal2 = req.body.tanggal2;

    var statusQuery = req.body.status == null ? "" : " and a.status_invoice = " + req.body.status
    conn.query("select a.id, a.id_order, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.status_invoice, a.tanggal_invoice, a.tanggal, b.nama as customer from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.tanggal_invoice >='" + tanggal1 + "' and a.tanggal_invoice <='" + tanggal2 + "' and  a.status = 2 " + statusQuery + " ORDER BY a.tanggal ASC", (err, rows) => {
        res.json(rows);
    })
}

exports.report_invoice_days = (req, res, next)=>{
    var tanggal1 = req.body.tanggal1
    var tanggal2 = req.body.tanggal2
    var statusQuery = req.body.status == null ? "" : " and a.status_invoice = " + req.body.status

    conn.query("select a.tanggal_invoice, sum(a.total) as total, sum(a.ongkir) as ongkir, sum(a.extra_charge) as extra_charge, sum(a.diskon/100 * a.total) as diskon, sum(a.poin) as poin from tbl_order a where a.tanggal_invoice >='" + tanggal1 + "' and a.tanggal_invoice<='" + tanggal2 + "' and a.status = 2 " + statusQuery + " group by a.tanggal_invoice ORDER by a.tanggal_invoice ASC", (err, rows)=>{
        console.error(err);
        res.json(rows);
    })
}


exports.evaluasi_bulanan = (req, res) => {
    var m = req.body.bulan
    var y = req.body.tahun
    conn.query("select a.id, a.id_order, b.nama as customer, a.tanggal, a.tanggal_selesai, c.tanggal as tanggal_target, (select count(d.id) from tbl_jobdesk_detail d where d.id_pegawai = 8 and d.id_jobdesk like concat(a.id_order, '_', '%')) as kelvin, (select count(e.id) from tbl_order_detail e, tbl_product f where f.id = e.id_product and e.id_order = a.id and f.id_bahan != 4) as jumlah from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id LEFT JOIN tbl_jadwal c ON a.id = c.id_order where (month(a.tanggal) = " + m + " and year(a.tanggal) = " + y + ") OR (month(a.tanggal_selesai) = " + m + " and year(a.tanggal_selesai) = " + y + ") group by a.id having kelvin = 0 order by a.tanggal asc", (err, rows) => {
        res.json(rows)
    })
}

exports.get_ratings = (req, res) => {
    async.parallel({
        summary: (cb) => {
            conn.query("select count(DISTINCT a.id) as total, (select count(d.id) from tbl_jobdesk_detail d where d.id_pegawai = 8 and d.id_jobdesk like concat(a.id_order, '_', '%')) as kelvin from tbl_order a, tbl_jobdesk_detail b where a.id_order = substr(b.id_jobdesk, 1, length(b.id_jobdesk)-2) and b.id_pegawai != 8 group by kelvin having kelvin = 0", (err, row) => {
                cb(null, row.length > 0 ? row[0].total : 0)
            })
        },
        rating: (cb) => {
            conn.query("select count(DISTINCT a.id) as jumlah, avg(a.rating_warna) as rating_warna, avg(a.rating_fitting) as rating_fitting, avg(a.rating_oklusi) as rating_oklusi, avg(a.rating_anatomi) as rating_anatomi, (select count(d.id) from tbl_jobdesk_detail d where d.id_pegawai = 8 and d.id_jobdesk like concat(c.id_order, '_', '%')) as kelvin from tbl_evaluasi a, tbl_jobdesk_detail b, tbl_order c where a.id_order = c.id and c.id_order = substr(b.id_jobdesk, 1, length(b.id_jobdesk)- 2) and b.id_pegawai != 8 having kelvin = 0", (err, row) => {
                if (row.length > 0) {
                    let item = row[0]
                    if (item.jumlah)
                        cb(null, item)
                    else
                        cb(null, {
                            jumlah: 0,
                            rating_warna: 0,
                            rating_fitting: 0,
                            rating_anatomi: 0,
                            rating_oklusi: 0
                        })
                } else {
                    cb(null,{
                        jumlah: 0,
                        rating_warna: 0,
                        rating_fitting: 0,
                        rating_anatomi: 0,
                        rating_oklusi: 0
                    })
                }
            })
        }
    }, (error, result) => {
        res.json(result)
    })
}