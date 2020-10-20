const conn = require('./db')
const bcrypt = require('bcryptjs')

exports.get_pegawai = (req, res, next)=>{
    conn.query("select id, nama, email, privilege, foto from tbl_pegawai order by nama asc", (err, rows)=>{
        res.json(rows);
    })
}

exports.get_pegawai_per_privilege = (req, res, next)=>{
    var privilege = req.params.privilege
    conn.query("select id, nama from tbl_pegawai where privilege = " + privilege, (err, rows)=>{
        res.json(rows);
    })
}

exports.tambah_pegawai = (req, res, next)=>{
    var data = req.body
    if(req.file){
        data.foto = req.file.filename
    }
    bcrypt.hash(data.password, 11, (error, hash) => {
        if (error) {
            res.status(500).json({ error: error })
        } else {
            data.password = hash
            conn.query("INSERT INTO tbl_pegawai SET ?", data, (err, result)=>{
                if(err) res.status(400).json(err)
                else res.json(result)
            })
        }
    })
}

exports.hapus_pegawai = (req, res, next)=>{
    var id = req.params.id
    conn.query("delete from tbl_pegawai where id = " + id, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}

exports.get_pegawai_single = (req, res, next)=>{
    var id = req.params.id
    conn.query("select id, nama, privilege, email, foto from tbl_pegawai where id  = "+ id, (err, row)=>{
        if(row.length<=0) res.json({})
        else res.json(row[0])
    })
}

exports.edit_pegawai = (req, res, next)=>{
    //var data = req.body
    var data = {
        id : req.body.id,
        nama : req.body.nama,
        privilege : req.body.privilege,
        email : req.body.email,
        foto : req.body.foto_old
    }
    if(req.file){
        data.foto = req.file.filename
    }else data.foto = req.body.foto_old;
    conn.query("UPDATE tbl_pegawai SET ? where id = " + data.id, data, (err, result)=>{
        if(err) res.status(400).json(err)
        else res.json(result)
    })
}