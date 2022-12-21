const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conn = require('./db');

exports.get_profil = (req, res, next)=>{
    var id = req.userData.userId;
    conn.query("select * from tbl_pegawai where id = " + id, (err, row)=>{
        res.json(row[0])
    })
}

exports.ganti_password = (req, res)=>{
    var id = req.userData.userId
    var password = req.body.password
    var new_password = req.body.password1

    conn.query("select id, email, password, privilege from tbl_pegawai where id = " + id, (err, rw)=>{
        if(rw.length < 1){
            return res.status(401).json({message : 'Email & password anda tidak valid'});
        }
        var user = rw[0];
        bcrypt.compare(password, user.password, (error, result)=>{
            if(error)
                return res.status(401).json({message: 'Password anda tidak valid, gagal mengganti password'})
            if(result){
                bcrypt.hash(new_password, 11, (error, hash) => {
                    if (error) {
                        res.status(500).json({ message : 'Terjadi kesalahan pada server' })
                    } else {
                       
                        var password_baru = hash
                       
                        conn.query("UPDATE tbl_pegawai SET password = '" + password_baru + "' where id = " + id, (err, result)=>{
                            if(err) res.status(400).json({ message : 'Terjadi kesalahan pada server' })
                            else res.json({message : 'Password berhasil diganti'})
                        })
                    }
                })
            }
        })
    })
}

exports.do_login = (req, res, next)=>{
    var email = req.body.email;
    var password = req.body.password;
    conn.query("select id, email, password, privilege from tbl_pegawai where email = '" + email + "' and (privilege = 1 or privilege = 3)", (err, rw)=>{
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