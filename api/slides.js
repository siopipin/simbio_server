const conn = require('../admin/controllers/db')
const express = require('express')
const router = express.Router()

router.get('/', (req, res)=>{
    conn.query("select id, image from tbl_slides order by id desc", (err, rows)=>{
        res.json(rows)
    })
})

router.get('/:id', (req, res)=>{
    var id = req.params.id 
    conn.query("select * from tbl_slides where id = " + id, (err, row)=>{
        if(row.length>0) res.json(row[0])
        else res.json({})
    })
})

module.exports = router