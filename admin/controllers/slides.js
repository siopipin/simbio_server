const conn = require('./db')
const fs = require('fs')
const variables = require('../../variables')


exports.get_slides = (req, res)=>{
    conn.query("select * from tbl_slides order by id desc", (err, rows)=>{
        res.json(rows)
    })
}

exports.simpan_slide = (req, res)=>{
    var dt = req.body
    var data = {
        image : req.file.filename,
        deskripsi : dt.deskripsi
    }
    

    conn.query("INSERT INTO tbl_slides SET ?", data, (err, result)=>{
        if(err) res.status(400).json(err)
        else{
            res.json({
                id : result.insertId,
                image : data.image,
                deskripsi : data.deskripsi,
                status : 1
            })
        }
    })
}

exports.update_slide = (req, res)=>{
    var data = req.body
    var id = data.id 
    delete data.id
    var slide = {
        deskripsi : data.deskripsi
    }
    conn.query("update tbl_slides set ? where id = " + id, slide, (err, result)=>{
        res.json(result)
    })
}

exports.hapus_slide = (req, res)=>{
    var data = req.body

    conn.query("delete from tbl_slides where id = " + data.id, (err, result)=>{
        fs.unlink(variables.PATH + '/assets/images/' + data.image, (error)=>{
            res.json(result)
        })
    })
}