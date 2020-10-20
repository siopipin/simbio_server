const conn = require('./db')
const async = require('async')
const messaging = require('./messaging')

function getDateNow() {
    var dt = new Date()
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

function formatDate(date) {
    var dt = new Date(date)
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
}

function genNoOrder(value) {
    var str_alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    var number = value.substr(value.length - 3, 3);
    var alpha = value.substring(0, value.length - 3);
    if (Number(number) == 999) {
        var tmp = 1;
        alpha_str = ''
        for (let i = alpha.length - 1; i >= 0; i--) {
            console.log(alpha)
            if (alpha[i] == 'Z' && tmp == 1) {
                tmp = 1;
                alpha_str = 'A' + alpha_str
            } else if (tmp == 1) {
                var alpha_tmp = alpha[i]
                alpha_str = str_alpha[str_alpha.indexOf(alpha_tmp) + 1] + alpha_str
                tmp = 0
            } else {
                alpha_str = alpha[i] + alpha_str
            }
        }
        if (tmp == 1) alpha_str = 'A' + alpha_str
        alpha = alpha_str
        number = '001'
    } else {
        var nmb = Number(number) + 1
        number = nmb + ''
        for (let i = 1; i <= 3 - (nmb.toString()).length; i++) {
            number = '0' + number;
        }
    }
    return alpha + number
}

exports.generate_no_order = (req, res, next) => {
    conn.query("select id_order from tbl_order order by id desc limit 1", (err, row) => {
        if (row.length > 0) {
            res.json({ id: genNoOrder(row[0].id_order) })
        } else res.json({ id: 'A001' })
    })
}

exports.get_customers = (req, res, next) => {
    conn.query("select * from tbl_customers order by nama asc", (err, rows) => {
        if (err) res.status(400).json(err)
        else res.json(rows);
    })
}

exports.get_products = (req, res, next) => {
    conn.query("select a.id, a.nama, a.id_bahan, a.harga, a.durasi, b.nama as bahan, a.poin from tbl_product a, tbl_bahan b where b.id = a.id_bahan", (err, rows) => {
        res.json(rows);
    })
}

exports.get_vouchers = (req, res, next) => {
    var dt = new Date()
    var tanggal = dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate();
    conn.query("select * from tbl_voucher where tanggal >=" + tanggal, (err, rows) => {
        res.json(rows);
    })
}

exports.list_pre_order = (req, res, next) => {
    conn.query("select a.id, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.tanggal, a.tanggal_selesai, b.nama as customer, (select count(id) from tbl_preorder_detail where id_order = a.id) as jumlah from tbl_preorder a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.status = 0 ORDER BY a.id DESC LIMIT 200", (err, rows) => {
        res.json(rows);
    })
}

exports.get_view_preorder = (req, res, next) => {
    var id = req.params.id

    conn.query("select a.id, a.id_customer, a.nama_pasien, b.nama as customer, b.email as email_customer, b.no_hp as no_hp_customer, b.alamat as alamat_customer, b.poin as poin_customer, a.tanggal, a.tanggal_target_selesai, a.status, a.ongkir, a.extra_charge, a.poin, a.kode_voucher, a.diskon, a.status_invoice, a.tanggal_invoice from tbl_preorder a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.id = " + id, (err, rows) => {
        var item = rows.length > 0 ? rows[0] : {};
        var details = []
        if (rows.length > 0) {
            conn.query("select a.id, a.id_order, a.id_product, b.nama as nama_product, a.warna, a.posisi_gigi as posisi, b.harga as harga_product, a.poin, a.garansi, c.nama as bahan_product from tbl_preorder_detail a, tbl_product b, tbl_bahan c WHERE c.id = b.id_bahan AND b.id = a.id_product AND a.id_order = " + item.id, (err, row) => {
                details = row;
                res.json({ order: item, details: details });
            })
        } else {
            res.json({ order: item, details: details });
        }
    })
}

exports.simpan_preorder = (req, res, next) => {
    var order = req.body.order

    var id_preorder = order.id

    order.id = 0;
    //order.tanggal = getDateNow()
    var detail_order = req.body.detail_order
    var grand_total = order.total + order.ongkir + order.extra_charge - (order.diskon / 100 * order.total) - order.poin
    var sisa_poin = 0
    if (grand_total < 0) {
        sisa_poin = grand_total * -1;
        order.poin = order.poin - sisa_poin
    }
    conn.query("INSERT INTO tbl_order SET ?", order, (err, result) => {
        if (err) res.status(400).json(err);
        else {

            conn.query("select * from tbl_preorder where id = " + id_preorder, (errors, rowpre) => {
                conn.query("update tbl_preorder set status = 1 where id = " + id_preorder, (errr, rsltt) => { })
                var intruksi = rowpre[0].intruksi
                var id_customer = rowpre[0].id_customer
                var chats = {
                    pengirim: id_customer,
                    tbl: 'customers',
                    room: 'room',
                    channel: result.insertId,
                    pesan: intruksi
                }

                conn.query("INSERT INTO tbl_chats SET ?", chats, (err, rslts) => { })
            })

            var id = result.insertId;
            var data_detail = []
            for (let item of detail_order) {
                data_detail.push([id, item.id_product, item.warna, item.posisi, item.harga_product, item.poin, 1, item.garansi])
            }
            conn.query("INSERT INTO tbl_order_detail (id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                console.log(er);
                res.json(result);
            })
        }
    })
}


function monoliticJadwal2(order, bahan, tgl_libur, cb) {
    var jlh = 0
    var summaries = []
    var tanggal = order.tanggal



    data_jadwal = []

    conn.query("select * from tbl_jadwal_summary where tanggal>='" + order.tanggal + "' order by tanggal asc", (err, row) => {
        summaries = row
        if (summaries.length <= 0) {
            summaries = [{ tanggal: order.tanggal, monolitic: 0, layering: 0, ld_press: 0 }]
        }

        while (bahan.length > 0) {
            for (let summary of summaries) {
                tanggal = formatDate(summary.tanggal)

                while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0) {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                    summary.tanggal = tanggal
                }

                jlh = 0;
                if (bahan.length == 14) {
                    if (summary.monolitic == 0 && summary.ld_press == 0 && summary.layering == 0) {
                        for (let i = 0; i < bahan.length; i++) {
                            var item = bahan[i]
                            data_jadwal.push([0, order.id, item.id_product, order.id_order, 'monolitic', summary.tanggal])
                            summary.monolitic = summary.monolitic + 1
                            jlh += 1
                        }
                    }
                } else if (bahan.length <= 10) {
                    if (summary.monolitic <= 10 - bahan.length) {
                        for (let i = 0; i < bahan.length; i++) {
                            var item = bahan[i]
                            data_jadwal.push([0, order.id, item.id_product, order.id_order, 'monolitic', summary.tanggal])
                            summary.monolitic = summary.monolitic + 1
                            jlh += 1
                        }
                    }
                } else {
                    if (summary.monolitic == 0 && summary.ld_press == 0 && summary.layering == 0) {
                        for (let i = 0; i < 14; i++) {
                            if (i < bahan.length) {
                                var item = bahan[i]
                                data_jadwal.push([0, order.id, item.id_product, order.id_order, 'monolitic', summary.tanggal])
                                summary.monolitic = summary.monolitic + 1
                                jlh += 1
                            }

                        }
                    }
                }
                if (jlh > 0) bahan.splice(0, jlh)
            }
            if (bahan.length > 0) {
                do {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                } while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0)


                var summary = {
                    tanggal: tanggal,
                    monolitic: 0,
                    layering: 0,
                    ld_press: 0
                }
                summaries.push(summary)
            }
        }

        async.eachSeries(summaries, (summary, cb_sum) => {
            conn.query("REPLACE INTO tbl_jadwal_summary SET ?", summary, (err, rslt) => {
                cb_sum(null)
            })
        }, error => {
            conn.query("INSERT INTO tbl_jadwal (id, id_order, id_product, label, bahan, tanggal) VALUES ?", [data_jadwal], (err, result) => {
                cb(null);
            })
        }) 

    })

}

function layeringJadwal(order, bahan, tgl_libur, cb) {
    var jlh = 0
    var summaries = []
    var tanggal = order.tanggal

    data_jadwal = []


    conn.query("select * from tbl_jadwal_summary where tanggal>='" + order.tanggal + "' order by tanggal asc", (err, row) => {
        summaries = row
        if (summaries.length <= 0) {
            summaries = [{ tanggal: order.tanggal, monolitic: 0, layering: 0, ld_press: 0 }]
        }

        while (bahan.length > 0) {
            for (let summary of summaries) {
                tanggal = formatDate(summary.tanggal)

                while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0) {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                    summary.tanggal = tanggal
                }

                jlh = 0;
                for (let i = 0; i < bahan.length; i++) {
                    var item = bahan[i]
                    if (summary.monolitic <= 10 && summary.ld_press + summary.layering < 4) {
                        data_jadwal.push([0, order.id, item.id_product, order.id_order, 'layering', summary.tanggal])
                        summary.layering = summary.layering + 1
                        jlh += 1
                    }
                }
                if (jlh > 0) bahan.splice(0, jlh)
            }
            if (bahan.length > 0) {
                do {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                } while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0)

                var summary = {
                    tanggal: tanggal,
                    monolitic: 0,
                    layering: 0,
                    ld_press: 0
                }
                summaries.push(summary)
            }
        }

        async.eachSeries(summaries, (summary, cb_sum) => {
            conn.query("REPLACE INTO tbl_jadwal_summary SET ?", summary, (err, rslt) => {
                cb_sum(null)
            })
        }, error => {
            conn.query("INSERT INTO tbl_jadwal (id, id_order, id_product, label, bahan, tanggal) VALUES ?", [data_jadwal], (err, result) => {
                cb(null);
            })
        })

    })
}

function ldpressJadwal(order, bahan, tgl_libur, cb) {
    var jlh = 0
    var summaries = []
    var tanggal = order.tanggal

    data_jadwal = []

    conn.query("select * from tbl_jadwal_summary where tanggal>='" + order.tanggal + "' order by tanggal asc", (err, row) => {
        summaries = row
        if (summaries.length <= 0) {
            summaries = [{ tanggal: order.tanggal, monolitic: 0, layering: 0, ld_press: 0 }]
        }

        while (bahan.length > 0) {
            for (let summary of summaries) {
                tanggal = formatDate(summary.tanggal)

                while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0) {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                    summary.tanggal = tanggal
                }

                jlh = 0;
                for (let i = 0; i < bahan.length; i++) {
                    var item = bahan[i]
                    if (summary.monolitic <= 10 && summary.ld_press + summary.layering < 4) {
                        data_jadwal.push([0, order.id, item.id_product, order.id_order, 'ld press', summary.tanggal])
                        summary.ld_press = summary.ld_press + 1
                        jlh += 1
                    }
                }

                if (jlh > 0) bahan.splice(0, jlh)
            }
            if (bahan.length > 0) {
                do {
                    var dt = new Date(tanggal)
                    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                    if (dt2.getDay() == 0) {
                        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                    }
                    tanggal = formatDate(dt2);
                } while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0)

                var summary = {
                    tanggal: tanggal,
                    monolitic: 0,
                    layering: 0,
                    ld_press: 0
                }
                summaries.push(summary)
            }
        }
        
        async.eachSeries(summaries, (summary, cb_sum) => {
            conn.query("REPLACE INTO tbl_jadwal_summary SET ?", summary, (err, rslt) => {
                cb_sum(null)
            })
        }, error => {
            conn.query("INSERT INTO tbl_jadwal (id, id_order, id_product, label, bahan, tanggal) VALUES ?", [data_jadwal], (err, result) => {
                cb(null);
            })
        })


    })

}

function tentukanJadwal(order, detail_order) {
    let dt = new Date(order.tanggal)
    let today = formatDate(dt)
    let tgl_libur = []

    conn.query("select * from tbl_libur where tanggal >='" + today + "'", (err, rows) => {
        for (let item of rows) {
            item.tanggal = formatDate(new Date(item.tanggal))
            tgl_libur.push(item)
        }
        console.log(tgl_libur)

        var layering = detail_order.filter(it => it.bahan_product.toLowerCase() == 'feldspathic' || it.bahan_product.toLowerCase() == 'porcelain')
        var ldpress = detail_order.filter(it => it.bahan_product.toLowerCase() == 'ld press')
        var monolitic = detail_order.filter(it => it.bahan_product.toLowerCase() == 'zirconia')

        var bahans = [
            monolitic,
            layering,
            ldpress
        ]

        var index = 0

        async.eachSeries(bahans, (bahan, cb) => {
            index += 1
            if (bahan.length <= 0) cb(null)
            else {
                if (index == 1) monoliticJadwal2(order, bahan, tgl_libur, cb)
                else if (index == 2) layeringJadwal(order, bahan, tgl_libur, cb)
                else ldpressJadwal(order, bahan, tgl_libur, cb)
            }
        }, error => {
            console.log('Selesai')
        })
    })
}


function tentukanJadwal2(order, detail_order, cbs) {
    let dt = new Date(order.tanggal)
    let today = formatDate(dt)
    let tgl_libur = []

    conn.query("select * from tbl_libur where tanggal >='" + today + "'", (err, rows) => {
        for (let item of rows) {
            item.tanggal = formatDate(new Date(item.tanggal))
            tgl_libur.push(item)
        }

        var layering = detail_order.filter(it => it.bahan_product.toLowerCase() == 'feldspathic' || it.bahan_product.toLowerCase() == 'porcelain')
        var ldpress = detail_order.filter(it => it.bahan_product.toLowerCase() == 'ld press')
        var monolitic = detail_order.filter(it => it.bahan_product.toLowerCase() == 'zirconia')

        var bahans = [
            monolitic,
            layering,
            ldpress
        ]

        var index = 0

        async.eachSeries(bahans, (bahan, cb) => {
            index += 1
            if (bahan.length <= 0) cb(null)
            else {
                if (index == 1) monoliticJadwal2(order, bahan, tgl_libur, cb)
                else if (index == 2) layeringJadwal(order, bahan, tgl_libur, cb)
                else ldpressJadwal(order, bahan, tgl_libur, cb)
            }
        }, error => {
            console.log('Selesai')
            cbs(null)
        })
    })

}

exports.reset_jadwal_order = (req, res) => {
    var id = 908

    conn.query("select * from tbl_order where id > " + id, (err, row) => {
        async.eachSeries(row, (order, cb) => {

            conn.query("select a.id, a.id_order, a.id_product, b.nama as product , c.nama as bahan_product from tbl_order_detail a, tbl_product b, tbl_bahan c where b.id = a.id_product and c.id = b.id_bahan and a.id_order = " + order.id, (err, rows) => {
                tentukanJadwal2(order, rows, cb)

            })
        }, error => {
            res.end('Ok')
        })
    })
}

exports.simpan_order = (req, res, next) => {
    var order = req.body.order
    //order.tanggal = getDateNow()
    var detail_order = req.body.detail_order
    var grand_total = order.total + order.ongkir + order.extra_charge - (order.diskon / 100 * order.total) - order.poin
    var sisa_poin = 0
    if (grand_total < 0) {
        sisa_poin = grand_total * -1;
        order.poin = order.poin - sisa_poin
    }
    conn.query("INSERT INTO tbl_order SET ?", order, (err, result) => {
        if (err) res.status(400).json(err);
        else {
            conn.query("update tbl_customers set poin = " + sisa_poin + " where id = " + order.id_customer, (errr, rsltt) => { })

            var id = result.insertId;
            var data_detail = []
            order.id = id;
            for (let item of detail_order) {
                data_detail.push([id, item.id_product, item.warna, item.posisi, item.harga_product, item.poin, 1, item.garansi])
            }
            conn.query("INSERT INTO tbl_order_detail (id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                tentukanJadwal(order, detail_order) //function tentukan jadwal
                console.log(er);
                res.json(result);
            })
        }
    })
}


exports.list_order = (req, res, next) => {
    conn.query("select a.id, a.id_order, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.tanggal, a.tanggal_selesai, b.nama as customer from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id ORDER BY a.id DESC", (err, rows) => {
        res.json(rows);
    })
}

exports.get_view_order = (req, res, next) => {
    var id = req.params.id

    conn.query("select a.id, a.id_order, a.id_customer, a.nama_pasien, b.nama as customer, b.email as email_customer, b.no_hp as no_hp_customer, b.alamat as alamat_customer, b.poin as poin_customer, a.tanggal, a.tanggal_selesai, a.tanggal_target_selesai, a.status, a.ongkir, a.extra_charge, a.poin, a.kode_voucher, a.diskon, a.status_invoice, a.tanggal_invoice from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.id = " + id, (err, rows) => {
        var item = rows.length > 0 ? rows[0] : {};
        var details = []
        if (rows.length > 0) {
            conn.query("select a.id, a.id_order, a.id_product, b.nama as nama_product, a.warna, a.posisi_gigi as posisi, a.harga as harga_product, a.poin, a.garansi, c.nama as bahan_product from tbl_order_detail a, tbl_product b, tbl_bahan c WHERE c.id = b.id_bahan AND b.id = a.id_product AND a.id_order = " + item.id, (err, row) => {
                details = row;
                res.json({ order: item, details: details });
            })
        } else {
            res.json({ order: item, details: details });
        }
    })
}


exports.edit_order = (req, res, next) => {
    var order = req.body.order
    var detail_order = req.body.detail_order
    var delete_details = req.body.delete_details;

    var data_edit = {
        id_customer: order.id_customer,
        nama_pasien: order.nama_pasien,
        total: order.total,
        poin: order.poin,
        extra_charge: order.extra_charge,
        ongkir: order.ongkir,
        diskon: order.diskon,
        kode_voucher: order.kode_voucher,
        tanggal: order.tanggal
    }

    if (order.tanggal_selesai) {
        data_edit.tanggal_selesai = order.tanggal_selesai
    }
    //var tanggal_selesai = order.tanggal_selesai ? ", tanggal_selesai = '" + order.tanggal_selesai + "'" : ""

    //var status = tanggal_selesai ? ", status = 2" : ""
    if (order.tanggal_selesai) {
        data_edit.status = 2
    }

    conn.query("UPDATE tbl_order set ? where id = " + order.id, data_edit, (err, result) => {
        if (err) res.status(400).json(err);
        else {
            conn.query("update tbl_customers set poin = " + order.poin_customer + " where id = " + order.id_customer, (errr, rsltt) => { })
            var id = result.insertId;
            var data_detail = []
            for (let item of detail_order) {
                data_detail.push([item.id, item.id_order, item.id_product, item.warna, item.posisi, item.harga_product, item.poin, 1, item.garansi])
            }
            if (delete_details.length > 0) {
                conn.query("DELETE FROM tbl_order_detail where id IN (?)", [delete_details], (err, rslt) => {
                    conn.query("REPLACE INTO tbl_order_detail (id, id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                        console.log(er);
                        res.json(result);
                    })
                })
            } else {
                conn.query("REPLACE INTO tbl_order_detail (id, id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                    console.log(er);
                    res.json(result);
                })
            }

        }
    })
}


exports.simpan_spk = (req, res, next) => {
    var spk = req.body.spk
    var data_progress = req.body.data_progress

    var query_spk = [[spk.id_order, spk.spv, 2]]
    for (let tekniker of spk.tekniker) {
        query_spk.push([spk.id_order, tekniker, 1])
    }

    var tokens = []
    conn.query("select token from tbl_pegawai where id = " + spk.spv + " and token is NOT NULL", (err, row) => {
        if (row.length > 0) tokens.push(row[0].token)
        async.eachSeries(spk.tekniker, (itm, cb) => {
            conn.query("select token from tbl_pegawai where id = " + itm + " and token is NOT NULL", (err, rw) => {
                if (rw.length > 0) tokens.push(rw[0].token)
                cb(null);
            })
        }, error => {
            if (tokens.length > 0) {
                conn.query("select id_order from tbl_order where id = " + spk.id_order, (rr, rw) => {
                    messaging.sendNotif('Tugas Baru', 'Tugas baru dengan Nomor Order #' + rw[0].id_order, tokens)
                })
            }
        })
    })

    conn.query("INSERT INTO tbl_spk (id_order, id_pegawai, privilege) VALUES ?", [query_spk], (err, result) => {
        async.eachSeries(data_progress, (progress, cb) => {
            async.eachSeries(progress.jobs, (item, cb2) => {
                var dt_progress = {
                    id_order: spk.id_order,
                    id_product: item.id_product,
                    id_proses: item.id,
                    status: 0
                }
                conn.query("INSERT INTO tbl_progress SET ?", dt_progress, (err2, rslt) => {
                    console.log('Error progress : ' + err2)
                    cb2(null);
                })
            }, error => {
                cb(null);
            })
        }, error => {
            conn.query("update tbl_order set tanggal_target_selesai = '" + spk.tanggal_target_selesai + "', status = 1 where id = " + spk.id_order, (err, rslt) => {
                if (err) res.status(400).json(err)
                else res.status(200).json({ message: 'Success' })
            })
        })
    })
}


exports.list_order_invoice = (req, res, next) => {
    var statusQuery = req.body.status == null ? "" : " and a.status_invoice = " + req.body.status
    conn.query("select a.id, a.id_order, a.nama_pasien, a.total, a.ongkir, a.extra_charge, a.poin, a.diskon, a.id_customer, a.status, a.status_invoice, a.tanggal_invoice, a.tanggal, b.nama as customer from tbl_order a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.status = 2 " + statusQuery + " ORDER BY a.id DESC", (err, rows) => {
        res.json(rows);
    })
}


exports.update_invoice = (req, res, next) => {
    var order = req.body.order
    var detail_order = req.body.detail_order
    var tanggal_invoice = order.status_invoice == 1 ? ", tanggal_invoice = '" + getDateNow() + "'" : ""
    var tanggal_bayar = order.tanggal_bayar ? ", tanggal_bayar = '" + order.tanggal_bayar + "'" : ""

    conn.query("UPDATE tbl_order set nama_pasien = '" + order.nama_pasien + "', total = " + order.total + ", poin = " + order.poin + ", extra_charge = " + order.extra_charge + ", ongkir =" + order.ongkir + ", diskon=" + order.diskon + ", kode_voucher='" + order.kode_voucher + "', status_invoice = " + order.status_invoice + tanggal_invoice + tanggal_bayar + " where id = " + order.id, (err, result) => {
        if (err) res.status(400).json(err);
        else {

            var data_detail = []
            var status = order.status_invoice == 2 ? 2 : 1;
            var earn_poin = 0;
            for (let item of detail_order) {
                earn_poin += item.poin
                data_detail.push([item.id, item.id_order, item.id_product, item.warna, item.posisi, item.harga_product, item.poin, status, item.garansi])
            }
            var poin_customer = order.poin_customer
            if (status == 2) {
                if (order.poin > 0) {
                    conn.query("INSERT INTO tbl_history_poin SET ?", { id_customer: order.id_customer, id_order: order.id, poin: order.poin * -1 }, (err, rslt) => { })
                }

                poin_customer = poin_customer + earn_poin
                conn.query("INSERT INTO tbl_history_poin SET ?", { id_customer: order.id_customer, id_order: order.id, poin: earn_poin }, (err, rslt) => { })
            }
            conn.query("update tbl_customers set poin = " + poin_customer + " where id = " + order.id_customer, (errr, rsltt) => { })

            conn.query("REPLACE INTO tbl_order_detail (id, id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                console.log(er);
                res.json(result);
            })
        }
    })
}

exports.simpan_team = (req, res, next) => {
    var data = {
        id: req.body.id,
        id_order: req.body.id_order,
        id_pegawai: req.body.id_pegawai,
        privilege: req.body.privilege
    }

    conn.query("REPLACE INTO tbl_spk SET ?", data, (err, result) => {
        if (err) res.status(400).json(err)
        else {
            var tokens = []
            conn.query("select token from tbl_pegawai where id = " + data.id_pegawai + " and token is NOT NULL", (err, rw) => {
                if (rw.length > 0) {
                    tokens.push(rw[0].token)
                    conn.query("select id_order from tbl_order where id = " + data.id_order, (rr, rw) => {
                        console.log(tokens)
                        messaging.sendNotif('Tugas Baru', 'Tugas baru dengan Nomor Order #' + rw[0].id_order, tokens)
                    })
                }

            })
            res.status(200).json(result)
        }
    })
}

exports.hapus_team = (req, res, next) => {
    var id = req.params.id
    conn.query("DELETE from tbl_spk WHERE id = " + id, (err, result) => {
        if (err) res.status(400).json(err)
        else res.status(200).json(result)
    })
}

exports.show_jadwal = (req, res) => {
    var bulan = req.body.bulan
    var tahun = req.body.tahun

    conn.query("select * from tbl_jadwal_summary where month(tanggal)=" + bulan + " and year(tanggal)=" + tahun + " order by tanggal asc", (err, rows) => {
        var items = rows
        async.eachSeries(items, (item, cb) => {
            conn.query("select * from tbl_jadwal where tanggal = '" + formatDate(item.tanggal) + "'", (err, row) => {
                item.jadwal = row
                cb(null);
            })
        }, error => {
            conn.query("select * from tbl_libur where month(tanggal)=" + bulan + " and year(tanggal)=" + tahun + " order by tanggal asc", (err, liburs) => {
                for (let itm of liburs) {
                    itm.jadwal = []
                    itm.data_libur = [{ colspan: 14, keterangan: itm.keterangan }]
                }
                var data = items.concat(liburs)
                data.sort((a, b) => {
                    if (a.tanggal > b.tanggal) return 1
                    else return -1
                })
                res.json(data)
            })
        })
    })
}

exports.hapus_order = (req, res, next) => {
    var id = req.params.id

    conn.query("DELETE from tbl_order WHERE id = " + id, (err, result) => {
        conn.query("DELETE from tbl_order_detail WHERE id_order = " + id, (err, rslt) => {
            conn.query("DELETE from tbl_spk WHERE id_order = " + id, (err, rslt) => { })
            conn.query("DELETE from tbl_progress WHERE id_order = " + id, (err, rslt) => { })
            conn.query("DELETE from tbl_jadwal where id_order = " + id, (err, rslt) => { })
            if (!err)
                res.json(result)
            else res.status(400).json(err)
        })
    })
}