const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conn = require('./db');

exports.get_profil = (req, res, next)=>{
    var id = req.userData.userId;
    conn.query("select id, nama from tbl_pegawai where id = " + id, (err, row)=>{
        res.json(row[0])
    })
}

exports.do_login = (req, res, next)=>{
    var email = req.body.email;
    var password = req.body.password;
    conn.query("select id, email, password, privilege from tbl_pegawai where email = '" + email + "' and privilege = 1", (err, rw)=>{
        if(rw.length < 1){
            return res.status(401).json({message : 'Email & password anda tidak valid'});
        }
        var user = rw[0];
        bcrypt.compare(password, user.password, (error, result)=>{
            if(error)
                return res.status(401).json({message: 'Email & password anda tidak valid'})
            if(result){
                const token = jwt.sign({
                    email : email,
                    userId : user.id,
                    privilege : user.privilege
                }, process.env.JWT_KEY, {expiresIn : "2d"});

                return res.status(200).json({email : user.email,  id : user.id, token : token});
            }
            return res.status(401).json({message : 'Username & password anda tidak valid'});
        })
    })
}