var conn = require('./db');
var async = require('async')

exports.get_pie_chart_product = (req, res, next)=>{
    conn.query("select b.id_bahan, c.nama as nama_product, count(a.id) as jumlah from tbl_order_detail a, tbl_product b, tbl_bahan c where c.id = b.id_bahan and b.id = a.id_product group by b.id_bahan", (err, rows)=>{
        res.json(rows);
    })
}

exports.get_pie_chart_tahap = (req, res, next)=>{
    conn.query("select id_step, count(id) as jumlah from tbl_jobdesk_detail where tanggal is NULL group by id_step order by id_step asc", (err, rows)=>{
        res.json(rows);
    })
}

exports.get_chart_radar = (req, res, next)=>{
    var td = new Date();
   
    var dates = [];
    for(var i = 1; i<31; i++){
        dates.push(new Date(td.getFullYear(), td.getMonth(), td.getDate()-i))
    }

    var items = [];

    async.eachSeries(dates, (item,cb)=>{
        conn.query("select count(id) as jumlah from tbl_order where day(tanggal) = " + item.getDate() + " and month(tanggal)=" + (item.getMonth() + 1) + " and year(tanggal)=" + item.getFullYear(), (err, row)=>{
            items.unshift({value : row[0].jumlah, category : item.getDate() });
            cb(null);
        })
    }, error=>{ 
        res.json(items);
    })

}

var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

var bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agus', 'Sep', 'Okt', 'Nov', 'Des']


exports.get_chart_stack = (req, res, next)=>{
    var year = new Date().getFullYear();
    var months = []
    for(var i = 0; i<=new Date().getMonth(); i++){
        months.push(i+1);
    }
    var items = [];
    async.eachSeries(months, (item, cb)=>{
        var data = {}
        conn.query("select count(id) as jumlah from tbl_order where month(tanggal)=" + item + " and year(tanggal)=" + year, (err, row)=>{
            data.bulan = bln[item-1]
            data.baru = row[0].jumlah
            conn.query("select count(id) as jumlah from tbl_order where month(tanggal_selesai)=" + item + " and year(tanggal_selesai)=" + year, (err, rw)=>{
                data.selesai = rw[0].jumlah
                items.push(data);
                cb(null)
            })
        })
    }, error=>{
        res.json(items);
    })
}


exports.get_chart_invoice = (req, res, next)=>{
    var year = new Date().getFullYear();
    var month = new Date().getMonth()
    var tgl = []
    for(var i = 0; i<=11; i++){
        var dt = new Date(year, month - i, 1)
        tgl.push({month : dt.getMonth() + 1, year : dt.getFullYear()})
    }
    var items = [];
    async.eachSeries(tgl, (item, cb)=>{
        
        conn.query("select sum(total + extra_charge + ongkir - (total * diskon*0.01) - poin) as total from tbl_order where month(tanggal_invoice)=" + item.month + " and year(tanggal_invoice)=" +item.year, (err, row)=>{
            items.unshift({periode : bln[item.month-1], total : row[0].total})
            cb(null)
        })
    }, error=>{
        res.json(items);
    })
}