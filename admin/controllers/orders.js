const conn = require('./db')
const async = require('async')
const messaging = require('./messaging')
const variables = require('../../variables')
const connection = require('./db')

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

    conn.query("select a.id, a.id_customer, a.nama_pasien, b.nama as customer, b.email as email_customer, b.no_hp as no_hp_customer, b.alamat as alamat_customer, b.poin as poin_customer, a.tanggal, a.tanggal_target_selesai, a.status, a.ongkir, a.extra_charge, a.poin, a.kode_voucher, a.diskon, a.status_invoice, a.tanggal_invoice, a.instruksi from tbl_preorder a LEFT JOIN tbl_customers b ON a.id_customer = b.id WHERE a.id = " + id, (err, rows) => {
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

            conn.query("select token from tbl_customers where id = " + order.id_customer, (err, rows) => {
                let tokens = []
                for (let item of rows)
                    if (item.token) tokens.push(item.token)
                if (tokens.length > 0) {
                    messaging.sendNotif('Order Baru', 'Order baru telah dibuat dengan ID Order #' + order.id_order, tokens)
                }
            })

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


exports.decline_preorder = (req, res) => {
    var id = req.body.id

    conn.query("update tbl_preorder set status = 2 where id = " + id, (err, result) => {
        if (err) res.status(400).json(err)
        else {

            conn.query("select token from tbl_customers where id = " + req.body.id_customer, (err, rows) => {
                let tokens = []
                for (let item of rows)
                    if (item.token) tokens.push(item.token)
                if (tokens.length > 0) {
                    messaging.sendNotif('Pre Order', 'Duh, pre-order anda terpaksa kami tolak. Hubungi kami untuk informasi lebih lanjut.', tokens)
                }
            })

            res.json(result)
        }
    })
}



function tentukanJadwal(order, detail_order) {
    let dt = new Date(order.tanggal)
    let today = formatDate(dt)
    let tgl_libur = []
    let max_item = 20
    let jumlah_item = detail_order.length

    var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
    if (dt2.getDay() == 0) {
        dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
        tanggal = formatDate(dt2);
    }

    conn.query("SELECT a.tanggal, count(a.id) + COALESCE(b.jumlah, 0) as jumlah from tbl_jadwal a LEFT OUTER JOIN tbl_block_jadwal b ON a.tanggal = b.tanggal where a.tanggal>='" + today + "' group by a.tanggal UNION SELECT b.tanggal, count(a.id)+ COALESCE(b.jumlah, 0) as jumlah from tbl_jadwal a RIGHT OUTER JOIN tbl_block_jadwal b ON a.tanggal = b.tanggal where b.tanggal>='" + today + "' group by b.tanggal", (err, rows) => {
        var tanggal = today
        var get_date = false

        conn.query("select * from tbl_libur where tanggal >='" + tanggal + "'", (err, rows2) => {
            for (let item of rows2) {
                item.tanggal = formatDate(new Date(item.tanggal))
                tgl_libur.push(item)
            }

            do {
                var selected = rows.filter(it => formatDate(it.tanggal) == tanggal)
                if (selected.length > 0) {
                    var jumlah = selected[0].jumlah + jumlah_item
                    if (jumlah <= max_item) {
                        get_date = true
                    } else {
                        var dt = new Date(tanggal)
                        var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                        if (dt2.getDay() == 0) {
                            dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                        }
                        tanggal = formatDate(dt2);
                    }
                } else {
                    while (tgl_libur.filter(it => it.tanggal == tanggal).length > 0) {
                        var dt = new Date(tanggal)
                        var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                        if (dt2.getDay() == 0) {
                            dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                        }
                        tanggal = formatDate(dt2);
                    }

                    var selected2 = rows.filter(it => formatDate(it.tanggal) == tanggal)
                    if (selected2.length > 0) {
                        var jumlah = selected2[0].jumlah + jumlah_item
                        if (jumlah <= max_item) {
                            get_date = true
                        } else {
                            var dt = new Date(tanggal)
                            var dt2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
                            if (dt2.getDay() == 0) {
                                dt2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate() + 1)
                            }
                            tanggal = formatDate(dt2);
                        }
                    } else {
                        get_date = true
                    }
                }

            } while (!get_date)

            var data_jadwal = []
            for (let item of detail_order) {
                data_jadwal.push([0, order.id, item.id_product, order.id_order, item.bahan_product, tanggal])
            }

            conn.query("INSERT INTO tbl_jadwal (id, id_order, id_product, label, bahan, tanggal) VALUES ?", [data_jadwal], (err, result) => {
                console.log('Selesai set di tanggal : ' + tanggal)
            })

        })

    })

}



function draftJadwal(order, detail_order) {
    let tanggal = formatDate(order.tanggal)
    var data_jadwal = []
    for (let item of detail_order) {
        data_jadwal.push([0, order.id, item.id_product, order.id_order, item.bahan_product, tanggal])
    }

    conn.query("INSERT INTO tbl_draft_jadwal (id, id_order, id_product, label, bahan, tanggal) VALUES ?", [data_jadwal], (err, result) => {
        console.log('Selesai set draft_jadwal')
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
    var set_jadwal = req.body.set_jadwal
    var sisa_poin = 0
    if (grand_total < 0) {
        sisa_poin = grand_total * -1;
        order.poin = order.poin - sisa_poin
    }

    conn.query("INSERT INTO tbl_order SET ?", order, (err, result) => {
        if (err) res.status(400).json(err);
        else {
            if(order.poin>0){
                conn.query("update tbl_customers set poin = " + sisa_poin + " where id = " + order.id_customer, (errr, rsltt) => { })
                var history_poin =  {
                    id_customer : order.id_customer,
                    id_order : result.insertId,
                    poin : order.poin,
                    flag : 0
                }
                conn.query("INSERT INTO tbl_history_poin SET ?", history_poin, (errr, rsltt)=>{})
            }
            var id = result.insertId;
            var data_detail = []
            order.id = id;
            for (let item of detail_order) {
                data_detail.push([id, item.id_product, item.warna, item.posisi, item.harga_product, item.poin, 1, item.garansi])
            }
            conn.query("INSERT INTO tbl_order_detail (id_order, id_product, warna, posisi_gigi, harga, poin, status, garansi) VALUES ?", [data_detail], (er, rslt) => {
                if(set_jadwal == 1) draftJadwal(order, detail_order)
                else tentukanJadwal(order, detail_order)
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
                    conn.query("INSERT INTO tbl_history_poin SET ?", { id_customer: order.id_customer, id_order: order.id, poin: order.poin * -1, flag: 0 }, (err, rslt) => { })
                }


                /* cek poin pending */
                conn.query("select * from tbl_history_poin where id_order = " + order.id + " and flag = 2", (er, rw) => {
                    if (rw.length > 0) {
                        var earn_poin = rw[0].poin
                        poin_customer = poin_customer + earn_poin

                        conn.query("update tbl_history_poin set flag = 1 where id = " + rw[0].id, (er, rlst) => { })

                        conn.query("update tbl_customers set poin = " + poin_customer + ", poin_pending = poin_pending - " + earn_poin + " where id = " + order.id_customer, (errr, rsltt) => {
                            conn.query("select token from tbl_customers where id = " + order.id_customer, (err, data_cust) => {
                                var tokens = []
                                for (let itm of data_cust) {
                                    if (itm.token) tokens.push(itm.token)
                                }
                                if (tokens.length > 0)
                                    messaging.sendNotif('Zirmon Dental Atelier', 'Selamat! Anda mendapat poin senilai ' + earn_poin + '.', tokens)
                            })
                        })
                    }
                })

                /*conn.query("INSERT INTO tbl_history_poin SET ?", { id_customer: order.id_customer, id_order: order.id, poin: earn_poin }, (err, rslt) => { }) */
            }

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
    var tanggal1 = formatDate(req.body.tanggal1)
    var tanggal2 = formatDate(req.body.tanggal2)

    conn.query("select tanggal, count(id) as jumlah from tbl_jadwal where tanggal>='" + tanggal1 + "' and tanggal<='" + tanggal2 + "' group by tanggal order by tanggal asc", (err, rows) => {
        var items = rows
        async.eachSeries(items, (item, cb) => {
            conn.query("select * from tbl_jadwal where tanggal = '" + formatDate(item.tanggal) + "'", (err, row) => {
                item.jadwal = row
                cb(null);
            })
        }, error => {

            conn.query("select * from tbl_libur where tanggal>='" + tanggal1 + "' and tanggal<='" + tanggal2 + "' order by tanggal asc", (err, liburs) => {
                for (let itm of liburs) {
                    itm.jadwal = []
                    itm.data_libur = [{ colspan: 20, keterangan: itm.keterangan }]
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


exports.update_jadwal = (req, res) => {
    var label = req.body.label
    var tanggal = formatDate(req.body.tanggal)

    conn.query("update tbl_jadwal set tanggal = '" + tanggal + "' where label = '" + label + "'", (err, result) => {
        if (err) rs.status(400).json(err)
        else res.json(result)
    })
}


exports.block_jadwal = (req, res) => {
    var tanggal = formatDate(new Date(req.body.tanggal))
    var blocked = req.body.blocked
    var team = req.body.team

    conn.query("select * from tbl_block_jadwal where team = " + team + " and tanggal = '" + tanggal + "'", (err, row)=>{
        var id = 0
        if(row.length>0){
            id = row[0].id
        }
        conn.query("REPLACE INTO tbl_block_jadwal SET ?", {id : id, tanggal: tanggal, jumlah: blocked, team : team }, (err, result) => {
            if (err) res.status(400).json(err)
            else res.json(result)
        })
    })

}

exports.get_blocked = (req, res) => {
    var tanggal1 = formatDate(req.body.tanggal1)
    var tanggal2 = formatDate(req.body.tanggal2)

    conn.query("select * from tbl_block_jadwal where tanggal>='" + tanggal1 + "' and tanggal<='" + tanggal2 + "'", (err, rows) => {
        res.json(rows)
    })
}

exports.get_draft_all = (req, res)=>{
    conn.query("select * from tbl_draft_jadwal order by id asc", (err, rows)=>{
        res.json(rows)
    })
}

exports.get_draft_single = (req, res)=>{
    var id_order = req.params.id_order

    conn.query("select * from tbl_draft_jadwal where id_order = " + id_order, (err, rows)=>{
        res.json(rows)
    })
}

exports.set_jadwal_draft = (req, res)=>{
    var data = req.body

    var jadwal = {
        id_order : data.id_order,
        id_product : data.id_product,
        tanggal : data.tanggal,
        label : data.label,
        bahan : data.bahan,
        team : data.team
    }

    conn.query("INSERT INTO tbl_jadwal SET ?", jadwal, (err, result)=>{
        conn.query("DELETE from tbl_draft_jadwal where id = " + data.id_draft, (err, rslt)=>{

        })
        res.json(result)
    })
}

exports.update_jadwal_new = (req, res) => {
    var ids = req.body.ids
    var tanggal = formatDate(req.body.tanggal)
    var team = req.body.team
    console.log(ids)
    async.eachSeries(ids, (item, cb)=>{
        conn.query("update tbl_jadwal set tanggal = '" + tanggal + "', team = " + team + " where id = " + item + "", (err, result) => {
            cb(null)
        })
    }, error=>{
        res.json({error : error})
    })
}

exports.get_teams =  (req, res) => {
    res.json(variables.teams)
}