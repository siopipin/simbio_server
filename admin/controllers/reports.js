const conn = require('./db')



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